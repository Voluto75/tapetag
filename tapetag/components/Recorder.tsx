"use client";

import { useRef, useState } from "react";

export default function Recorder() {
  const [isRec, setIsRec] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<string>("");

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  async function start() {
    setStatus("");
    setBlob(null);
    setDuration(0);
    chunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecRef.current = mr;

    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
      setBlob(b);
    };

    mr.start();
    setIsRec(true);
    startedAtRef.current = Date.now();

    timerRef.current = window.setInterval(() => {
      const sec = Math.min(30, Math.floor((Date.now() - startedAtRef.current) / 1000));
      setDuration(sec);
      if (sec >= 30) stop();
    }, 200);
  }

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    mediaRecRef.current?.stop();
    setIsRec(false);
  }

  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!blob) return;

    setStatus("Uploading...");

    const fd = new FormData(e.currentTarget);
    fd.set("audio", new File([blob], "voice.webm", { type: blob.type || "audio/webm" }));
    fd.set("duration", String(Math.min(30, Math.max(1, duration || 1))));

    const r = await fetch("/api/posts", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      setStatus(j.error || "Upload failed");
      return;
    }

    setStatus("Published!");
    // Pour l’instant on renvoie juste vers la home, on fera la page détail après
    window.location.href = "/";
  }

  return (
<div style={{ maxWidth: 520 }}>
  <div
    style={{
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginBottom: 12,
    }}
  >

{!isRec ? (
  <button
    type="button"
    onClick={start}
    className="tt-btn98"
  >
    ● Record
  </button>
) : (
  <button
    type="button"
    onClick={stop}
    className="tt-btn98 tt-btn98--danger"
  >
    Stop ({duration}s)
  </button>
)}


    <span style={{ opacity: 0.8 }}>Max 30s</span>
  </div>

  <form onSubmit={publish} style={{ display: "grid", gap: 10 }}>
    <input name="pseudonym" placeholder="Pseudonym" required />
    <input name="hashtag" placeholder="#hashtag" required />
    <input name="title" placeholder="Title (optional)" />
    <textarea name="caption" placeholder="Caption (optional)" />

    {blob && <audio controls src={URL.createObjectURL(blob)} />}

    <button
      type="submit"
      disabled={!blob}
      className="tt-btn98 tt-btn98--primary"
    >
      Publish
    </button>

    {status && <div>{status}</div>}
  </form>
</div>

  );
}

