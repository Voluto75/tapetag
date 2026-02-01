"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Recorder() {
  const runRef = useRef(0);
  const startLockRef = useRef(false);

  const startedMsRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [isRec, setIsRec] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState("");

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const shownSeconds = Math.min(30, Math.max(0, Number(duration) || 0));

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

async function start() {
  if (isRec) return;
  if (startLockRef.current) return; // empêche double start pendant getUserMedia
  startLockRef.current = true;

  // invalide tous les anciens timers (même s'ils existent encore)
  runRef.current += 1;
  const runId = runRef.current;

  setStatus("");
  setBlob(null);
  setDuration(0);
  chunksRef.current = [];

  // clear le dernier timer connu (au cas où)
  if (timerRef.current) {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

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

  mr.ondataavailable = (e) => chunksRef.current.push(e.data);
  mr.onstop = () => {
  mr.onstart = () => { ... };

    stream.getTracks().forEach((t) => t.stop());
    const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
    setBlob(b);
  };

  mr.start();
  setIsRec(true);

const started = performance.now(); // CAPTURE LOCALE (source de vérité)
setDuration(0);

timerRef.current = window.setInterval(() => {
  if (runRef.current !== runId) return;

  const sec = Math.min(30, Math.floor((performance.now() - started) / 1000));
  setDuration(sec);

  if (sec >= 30) stop();
}, 1000);

  startLockRef.current = false;
}

function stop() {

  // invalide les anciens timers
  runRef.current += 1;

if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
timeoutRef.current = null;
startedMsRef.current = null;

  mediaRecRef.current?.stop();
  setIsRec(false);

  // libère le lock au cas où

  startLockRef.current = false;
}

  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!blob) return;

    setStatus("Publishing...");

    const fd = new FormData(e.currentTarget);
    fd.set("audio", blob);

    // duration in seconds

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
      
    <button type="button" onClick={start} className="tt-btn98">
            ● Record
          </button>
        ) : (
          <button type="button" onClick={stop} className="tt-btn98 tt-btn98--danger">
            Stop ({shownSeconds}s)
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
        <input name="pseudonym" placeholder="Pseudonym" required />
        <input name="hashtag" placeholder="#hashtag" required />
        <input name="title" placeholder="Title (optional)" />
        <textarea name="caption" placeholder="Caption (optional)" />

        <button type="submit" disabled={!blob} className="tt-btn98 tt-btn98--primary">
          Publish
        </button>

        {status && <div>{status}</div>}
      </form>
    </div>
  );
}

