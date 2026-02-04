"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  postId: string;
  locked: boolean;
  accentBorder?: string;
  accentGlow?: string;
};

export default function UnlockPlayer({ postId, locked, accentBorder = "rgba(120,200,255,0.65)", accentGlow = "rgba(90,170,255,0.35)" }: Props) {
  const [passcode, setPasscode] = useState("");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [autoplayRequested, setAutoplayRequested] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!postId || postId === "undefined" || postId === "null") {
    return <div style={{ color: "crimson" }}>Post not found (missing id).</div>;
  }

  async function requestSignedUrl(code: string) {
    setLoading(true);
    setErr("");
    setAutoplayRequested(true);

    try {
      const r = await fetch(`/api/posts/${postId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setSignedUrl(null);
        setErr(j?.error || "Unable to unlock.");
        return;
      }

      if (!j?.url) {
        setSignedUrl(null);
        setErr("Invalid response (missing URL).");
        return;
      }

      setSignedUrl(j.url);
    } catch (e: any) {
      setSignedUrl(null);
      setErr(e?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function tryAutoplay() {
    const a = audioRef.current;
    if (!a || !autoplayRequested) return;
    try {
      await a.play();
      setAutoplayRequested(false);
    } catch {
      // Keep request flag true so we can retry on canplay/loadeddata.
    }
  }

  function fmt(sec: number) {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  async function togglePlayback() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      await a.play().catch(() => {});
    } else {
      a.pause();
    }
  }

  function seekTo(value: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = value;
    setCurrentTime(value);
  }

  useEffect(() => {
    if (!signedUrl || !autoplayRequested) return;
    tryAutoplay();
  }, [signedUrl, autoplayRequested]);

  // Déjà déverrouillé -> on joue l’audio
  if (signedUrl) {
    return (
      <div
        style={{
          display: "grid",
          gap: 8,
          padding: 8,
          borderRadius: 10,
          background: "linear-gradient(180deg, rgba(7,10,16,0.9), rgba(10,14,22,0.72))",
          border: `1px solid ${accentBorder}`,
          boxShadow: `0 0 12px ${accentGlow}`,
        }}
      >
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          preload="auto"
          src={signedUrl}
          onTimeUpdate={(e) => setCurrentTime((e.currentTarget as HTMLAudioElement).currentTime)}
          onLoadedMetadata={(e) => setDuration((e.currentTarget as HTMLAudioElement).duration || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onCanPlay={() => {
            if (autoplayRequested) {
              tryAutoplay();
            }
          }}
          onLoadedData={() => {
            if (autoplayRequested) {
              tryAutoplay();
            }
          }}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button
            type="button"
            onClick={togglePlayback}
            style={{
              minWidth: 78,
              background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))",
              color: "#f2f8ff",
              border: `1px solid ${accentBorder}`,
              borderRadius: 999,
              padding: "6px 10px",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.03em",
              boxShadow: `0 0 12px ${accentGlow}`,
            }}
          >
            {isPlaying ? "❚❚ PAUSE" : "▶ PLAY"}
          </button>

          <div style={{ fontSize: 11, opacity: 0.85, whiteSpace: "nowrap" }}>
            {fmt(currentTime)} / {fmt(duration)}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(duration, 0)}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seekTo(Number(e.target.value))}
          style={{ width: "100%" }}
        />

        <button
          type="button"
          onClick={() => {
            // optionnel : si tu veux re-demander une URL (expirée)
            audioRef.current?.pause();
            setSignedUrl(null);
            setErr("");
            setAutoplayRequested(false);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
          }}
          style={{
            opacity: 0.9,
            background: "rgba(20,20,24,0.7)",
            color: "#eafff5",
            border: `1px solid ${accentBorder}`,
            borderRadius: 7,
            padding: "5px 7px",
            fontSize: 11,
            boxShadow: `0 0 10px ${accentGlow}`,
          }}
        >
          Change / Re-unlock
        </button>
      </div>
    );
  }

  // Post non verrouillé : on récupère quand même une URL signée (bucket privé)
  if (!locked) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <button
          type="button"
          onClick={() => requestSignedUrl("")}
          disabled={loading}
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06))",
            color: "#eafff5",
            border: `1px solid ${accentBorder}`,
            borderRadius: 8,
            padding: "7px 10px",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.05em",
            boxShadow: `0 0 12px ${accentGlow}`,
          }}
        >
          {loading ? "Loading…" : "▶ PLAY"}
        </button>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </div>
    );
  }

  // Post verrouillé : demander le mot de passe
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ color: "red", fontWeight: 700 }}>🔒 Passcode required</div>

      <input
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="Passcode to listen"
        autoComplete="off"
        spellCheck={false}
      />

      <button
        type="button"
        onClick={() => requestSignedUrl(passcode)}
        disabled={loading || passcode.trim().length === 0}
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06))",
          color: "#eafff5",
          border: `1px solid ${accentBorder}`,
          borderRadius: 8,
          padding: "7px 10px",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.05em",
          boxShadow: `0 0 12px ${accentGlow}`,
        }}
      >
        {loading ? "Checking…" : "Unlock"}
      </button>

      {err && <div style={{ color: "crimson" }}>{err}</div>}
    </div>
  );
}
