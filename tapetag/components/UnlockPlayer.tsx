"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  postId: string;
  locked: boolean;
};

export default function UnlockPlayer({ postId, locked }: Props) {
  const [passcode, setPasscode] = useState("");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [autoplayRequested, setAutoplayRequested] = useState(false);
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

  useEffect(() => {
    if (!signedUrl || !autoplayRequested) return;
    const a = audioRef.current;
    if (!a) return;
    a.play().catch(() => {
      // Some browsers can still block autoplay; controls remain available.
    });
    setAutoplayRequested(false);
  }, [signedUrl, autoplayRequested]);

  // Déjà déverrouillé -> on joue l’audio
  if (signedUrl) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <audio ref={audioRef} controls autoPlay playsInline src={signedUrl} />
        <button
          type="button"
          onClick={() => {
            // optionnel : si tu veux re-demander une URL (expirée)
            setSignedUrl(null);
            setErr("");
            setAutoplayRequested(false);
          }}
          style={{
            opacity: 0.9,
            background: "rgba(20,20,24,0.7)",
            color: "#eafff5",
            border: "1px solid rgba(126,255,193,0.7)",
            borderRadius: 8,
            padding: "6px 8px",
            boxShadow: "0 0 12px rgba(126,255,193,0.35)",
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
            background: "linear-gradient(180deg, rgba(70,255,170,0.35), rgba(20,120,80,0.45))",
            color: "#eafff5",
            border: "1px solid rgba(126,255,193,0.9)",
            borderRadius: 8,
            padding: "7px 10px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            boxShadow: "0 0 14px rgba(126,255,193,0.5)",
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
          background: "linear-gradient(180deg, rgba(70,255,170,0.35), rgba(20,120,80,0.45))",
          color: "#eafff5",
          border: "1px solid rgba(126,255,193,0.9)",
          borderRadius: 8,
          padding: "7px 10px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          boxShadow: "0 0 14px rgba(126,255,193,0.5)",
        }}
      >
        {loading ? "Checking…" : "Unlock"}
      </button>

      {err && <div style={{ color: "crimson" }}>{err}</div>}
    </div>
  );
}
