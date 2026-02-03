"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Recorder({ parentId }: { parentId?: string }) {
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

    const fd = new FormData(e.currentTarget);
    if (parentId) {
      fd.set("parent_id", parentId);
    }
    fd.set("audio", blob);
    fd.set("duration", String(shownSeconds));

    try {
      const res = await fetch("/api/posts", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Publish failed");

      setStatus("Published ✅");
      setBlob(null);
      setDuration(0);
      (e.target as HTMLFormElement).reset();
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
        {parentId ? (
          <input type="hidden" name="parent_id" value={parentId} />
        ) : null}
        <input name="pseudonym" placeholder="Pseudonym" required />
        <input name="hashtag" placeholder="#hashtag" required />
        <select name="theme" defaultValue="politique" required>
          <option value="politique">Politique (bleu clair)</option>
          <option value="foot">Foot (vert)</option>
          <option value="sex">Sex (rose)</option>
          <option value="nourriture">Nourriture (jaune)</option>
          <option value="business">Business (bleu nuit)</option>
          <option value="autre-sport">Autre sport (violet)</option>
          <option value="jeux-video">Jeux vidéo (gris)</option>
          <option value="informatique">Informatique (noir)</option>
          <option value="nature">Nature (blanc cassé)</option>
        </select>
        <input name="title" placeholder="Title (optional)" />
        <textarea name="caption" placeholder="Caption (optional)" />
        <input
        name="passcode"
        placeholder="Mot de passe (optionnel)"
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
