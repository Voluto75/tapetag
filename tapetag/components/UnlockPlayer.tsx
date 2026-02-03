"use client";

import React, { useState } from "react";

type Props = {
  postId: string;
  locked: boolean;
};

export default function UnlockPlayer({ postId, locked }: Props) {
  const [passcode, setPasscode] = useState("");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!postId || postId === "undefined" || postId === "null") {
    return <div style={{ color: "crimson" }}>Post introuvable (id manquant).</div>;
  }

  async function requestSignedUrl(code: string) {
    setLoading(true);
    setErr("");

    try {
      const r = await fetch(`/api/posts/${postId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setSignedUrl(null);
        setErr(j?.error || "Impossible de déverrouiller.");
        return;
      }

      if (!j?.url) {
        setSignedUrl(null);
        setErr("Réponse invalide (URL manquante).");
        return;
      }

      setSignedUrl(j.url);
    } catch (e: any) {
      setSignedUrl(null);
      setErr(e?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  // Déjà déverrouillé -> on joue l’audio
  if (signedUrl) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <audio controls src={signedUrl} />
        <button
          type="button"
          onClick={() => {
            // optionnel : si tu veux re-demander une URL (expirée)
            setSignedUrl(null);
            setErr("");
          }}
          style={{ opacity: 0.85 }}
        >
          Changer / Re-déverrouiller
        </button>
      </div>
    );
  }

  // Post non verrouillé : on récupère quand même une URL signée (bucket privé)
  if (!locked) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <button type="button" onClick={() => requestSignedUrl("")} disabled={loading}>
          {loading ? "Loading…" : "▶ Play"}
        </button>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </div>
    );
  }

  // Post verrouillé : demander le mot de passe
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ color: "red", fontWeight: 700 }}>🔒 Mot de passe requis</div>

      <input
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="Mot de passe pour écouter"
        autoComplete="off"
        spellCheck={false}
      />

      <button
        type="button"
        onClick={() => requestSignedUrl(passcode)}
        disabled={loading || passcode.trim().length === 0}
      >
        {loading ? "Vérification…" : "Déverrouiller"}
      </button>

      {err && <div style={{ color: "crimson" }}>{err}</div>}
    </div>
  );
}
