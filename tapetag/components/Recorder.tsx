"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type VoiceFx = "none" | "autotune-lite" | "deep" | "chipmunk" | "robot";

function audioBufferToWavBlob(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const wavSize = 44 + dataSize;
  const ab = new ArrayBuffer(wavSize);
  const view = new DataView(ab);

  let offset = 0;
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
  };

  writeString("RIFF");
  view.setUint32(offset, wavSize - 8, true);
  offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, channels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, byteRate, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString("data");
  view.setUint32(offset, dataSize, true);
  offset += 4;

  const channelData: Float32Array[] = [];
  for (let c = 0; c < channels; c++) channelData.push(buffer.getChannelData(c));
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, channelData[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

async function applyVoiceEffect(input: Blob, fx: VoiceFx): Promise<Blob> {
  if (fx === "none") return input;

  const AC = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AC();
  const arr = await input.arrayBuffer();
  const decoded = await ctx.decodeAudioData(arr.slice(0));

  let rate = 1;
  if (fx === "autotune-lite") rate = 1.1;
  if (fx === "deep") rate = 0.86;
  if (fx === "chipmunk") rate = 1.28;

  const outLength = Math.ceil(decoded.length / rate) + Math.floor(decoded.sampleRate * 0.05);
  const offline = new OfflineAudioContext(decoded.numberOfChannels, outLength, decoded.sampleRate);

  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.playbackRate.value = rate;

  const high = offline.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = fx === "deep" ? 70 : 120;

  const low = offline.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = fx === "chipmunk" ? 8000 : 6400;

  const tone = offline.createBiquadFilter();
  tone.type = "peaking";
  tone.frequency.value = fx === "autotune-lite" ? 2200 : 1100;
  tone.Q.value = 1.8;
  tone.gain.value = fx === "autotune-lite" ? 7 : 3;

  const comp = offline.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.knee.value = 20;
  comp.ratio.value = 3.5;
  comp.attack.value = 0.004;
  comp.release.value = 0.18;

  source.connect(high);
  high.connect(low);
  low.connect(tone);

  if (fx === "robot") {
    const crush = offline.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * 2 - 1;
      curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.45);
    }
    crush.curve = curve;
    crush.oversample = "4x";
    tone.connect(crush);
    crush.connect(comp);
  } else {
    tone.connect(comp);
  }

  comp.connect(offline.destination);
  source.start(0);

  const rendered = await offline.startRendering();
  ctx.close();
  return audioBufferToWavBlob(rendered);
}

export default function Recorder({ parentId, forcedTag }: { parentId?: string; forcedTag?: string }) {
  const searchParams = useSearchParams();
  const parentIdFromUrl = searchParams.get("replyTo") || undefined;
  const forcedTagFromUrl = searchParams.get("tag") || undefined;
  const effectiveParentId = parentId || parentIdFromUrl;
  const effectiveTagRaw = (forcedTag || forcedTagFromUrl || "").trim();
  const effectiveTag = effectiveTagRaw
    ? (effectiveTagRaw.startsWith("#") ? effectiveTagRaw : `#${effectiveTagRaw}`).toLowerCase()
    : "";
  // anti double-start + anti anciens timers
  const runRef = useRef(0);
  const startLockRef = useRef(false);

  // chrono robuste
  const startedMsRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // recorder
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // UI state
  const [isRec, setIsRec] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState("");
  const [blink, setBlink] = useState(true);
  const [voiceFx, setVoiceFx] = useState<VoiceFx>("autotune-lite");
  const [hashtagValue, setHashtagValue] = useState(effectiveTag);

  useEffect(() => {
    if (!effectiveTag) return;
    setHashtagValue(effectiveTag);
  }, [effectiveTag]);

  const shownSeconds = Math.min(30, Math.max(0, Number(duration) || 0));

  useEffect(() => {
    // clignote seulement pendant l'enregistrement
    if (!isRec) {
      setBlink(true); // reset (visible) quand on n'enregistre pas
      return;
    }

    const id = window.setInterval(() => {
      setBlink((b) => !b);
    }, 500);

    return () => window.clearInterval(id);
  }, [isRec]);

  useEffect(() => {
    // cleanup si hot reload / unmount
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, []);

  function stop() {
    // invalide les anciens runs
    runRef.current += 1;

    // stoppe le scheduler
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    startedMsRef.current = null;

    // stop recorder
    try {
      mediaRecRef.current?.stop();
    } catch {
      // ignore
    }

    setIsRec(false);
    startLockRef.current = false;
  }

  async function start() {
    if (isRec) return;
    if (startLockRef.current) return;
    startLockRef.current = true;

    // nouveau run
    runRef.current += 1;
    const runId = runRef.current;

    setStatus("");
    setBlob(null);
    setDuration(0);
    chunksRef.current = [];

    // coupe un éventuel scheduler restant (sécurité)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    startedMsRef.current = null;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("Microphone permission denied.");
      startLockRef.current = false;
      return;
    }

    const mr = new MediaRecorder(stream);
    mediaRecRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      // coupe le micro
      stream.getTracks().forEach((t) => t.stop());

      // construit le blob
      const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
      setBlob(b);
    };

    // chrono calé au VRAI démarrage de l’enregistrement
    mr.onstart = () => {
      startedMsRef.current = Date.now();
      setDuration(0);

      const tick = () => {
        if (runRef.current !== runId) return;

        const started = startedMsRef.current ?? Date.now();
        const elapsed = Date.now() - started;
        const sec = Math.min(30, Math.floor(elapsed / 1000));

        setDuration(sec);

        if (sec >= 30) {
          stop();
          return;
        }

        // recalage sur la prochaine seconde pile
        const nextIn = 1000 - (elapsed % 1000);
        timeoutRef.current = window.setTimeout(tick, nextIn);
      };

      timeoutRef.current = window.setTimeout(tick, 0);
    };

    mr.start();
    setIsRec(true);
    startLockRef.current = false;
  }

  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!blob) return;

    setStatus("Publishing...");

    try {
      const fd = new FormData(e.currentTarget);
      if (effectiveParentId) {
        fd.set("parent_id", effectiveParentId);
      }

      let audioBlob = blob;
      if (voiceFx !== "none") {
        setStatus("Applying voice effect...");
        audioBlob = await applyVoiceEffect(blob, voiceFx);
      }

      fd.set("audio", audioBlob, "voice.wav");
      fd.set("duration", String(shownSeconds));

      const res = await fetch("/api/posts", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Publish failed");

      setStatus("Published ✅");
      setBlob(null);
      setDuration(0);
      (e.target as HTMLFormElement).reset();
      setHashtagValue(effectiveTag || "");
    } catch (err: any) {
      setStatus(err?.message ?? "Publish failed");
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        {!isRec ? (
          <button type="button" onClick={start} className="tt-rec-btn tt-rec-btn--idle">
            ● Record
          </button>
        ) : (
        <button
          type="button"
          onClick={stop}
          className="tt-rec-btn tt-rec-btn--rec"
        >
  <span
    style={{
      fontFamily: "'GAU Font Cube', monospace",
      letterSpacing: 3,
      textTransform: "uppercase",
      marginRight: 6,
      opacity: blink ? 1 : 0, // 👈 clignotement
      transition: "opacity 0.1s linear",
    }}
  >
    stop
  </span>
  ({shownSeconds}s)
</button>

        )}

      <span style={{ opacity: 0.8 }}>Max 30s</span>
      </div>

      {blob && (
        <div style={{ marginBottom: 10 }}>
          <audio controls src={URL.createObjectURL(blob)} />
        </div>
      )}

      <form onSubmit={publish} style={{ display: "grid", gap: 10 }}>
        {effectiveParentId ? (
          <input type="hidden" name="parent_id" value={effectiveParentId} />
        ) : null}
        <input name="pseudonym" placeholder="Pseudonym" required />
        <input
          name="hashtag"
          placeholder="#hashtag"
          required
          value={hashtagValue}
          onChange={(e) => setHashtagValue(e.target.value)}
          readOnly={!!effectiveTag}
        />
        <select name="theme" defaultValue="no-theme" required>
          <option value="no-theme">No theme</option>
          <option value="politique">Politics (light blue)</option>
          <option value="foot">Foot (green)</option>
          <option value="sex">Sex (pink)</option>
          <option value="nourriture">Food (yellow)</option>
          <option value="business">Business (midnight blue)</option>
          <option value="autre-sport">Other sport (violet)</option>
          <option value="jeux-video">Video games (gray)</option>
          <option value="informatique">Tech (black)</option>
          <option value="nature">Nature (off-white)</option>
        </select>
        <select value={voiceFx} onChange={(e) => setVoiceFx(e.target.value as VoiceFx)}>
          <option value="none">Voice FX: none</option>
          <option value="autotune-lite">Voice FX: AutoTune lite</option>
          <option value="deep">Voice FX: Deep</option>
          <option value="chipmunk">Voice FX: Chipmunk</option>
          <option value="robot">Voice FX: Robot</option>
        </select>
        <textarea name="caption" placeholder="Caption (optional)" />
        <input
        name="passcode"
        placeholder="Create passcode (optional)"
        autoComplete="new-password"
        />

        <button type="submit" disabled={!blob} className="tt-btn98 tt-btn98--primary">
          Publish
        </button>

        {status && <div>{status}</div>}
      </form>
    </div>
  );
}
