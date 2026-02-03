"use client";

import React, { useEffect, useState } from "react";
import UnlockPlayer from "@/components/UnlockPlayer";
import LikeButton from "@/components/LikeButton";

type FeedItem = {
  id: string;
  pseudonym: string;
  hashtag: string;
  theme: string;
  title: string | null;
  caption: string | null;
  audio_duration_seconds: number;
  created_at: string;
  locked: boolean;
  like_count: number;
  liked_by_me: boolean;
  listen_count: number;
};

export default function FeedClient() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"pseudonym" | "hashtag">("pseudonym");
  const [sort, setSort] = useState<"top" | "recent">("top");
  const [theme, setTheme] = useState<string>("all");

  const loadFeed = async (opts?: {
    query?: string;
    mode?: "pseudonym" | "hashtag";
    sort?: "top" | "recent";
    theme?: string;
  }) => {
    const q = (opts?.query ?? "").trim();
    const m = opts?.mode ?? "pseudonym";
    const s = opts?.sort ?? "top";
    const t = opts?.theme ?? "all";

    try {
      setLoading(true);
      setErr("");

      const params = new URLSearchParams();
      if (q.length > 0) {
        params.set("q", q);
        params.set("mode", m);
      }
      if (t !== "all") {
        params.set("theme", t);
      }
      if (s === "recent") {
        params.set("sort", "recent");
      }

      const url = params.toString().length > 0 ? `/api/feed?${params}` : "/api/feed";
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setErr(j?.error || "Impossible de charger le feed.");
        setItems([]);
        return;
      }

      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch (e: any) {
      setErr(e?.message || "Erreur réseau.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed({ sort, theme });
  }, [sort, theme]);

  if (loading) return <div style={{ padding: 12, opacity: 0.8 }}>Loading…</div>;
  if (err) return <div style={{ padding: 12, color: "crimson" }}>{err}</div>;

  const themeStyles: Record<string, { border: string; glow: string; badge: string; fill: string }> = {
    "politique": {
      border: "#7ad7ff",
      glow: "rgba(122,215,255,0.25)",
      badge: "#7ad7ff",
      fill: "rgba(122,215,255,0.12)",
    },
    "foot": {
      border: "#78ffb0",
      glow: "rgba(120,255,176,0.25)",
      badge: "#78ffb0",
      fill: "rgba(120,255,176,0.12)",
    },
    "sex": {
      border: "#ff77c8",
      glow: "rgba(255,119,200,0.25)",
      badge: "#ff77c8",
      fill: "rgba(255,119,200,0.12)",
    },
    "nourriture": {
      border: "#ffd86b",
      glow: "rgba(255,216,107,0.25)",
      badge: "#ffd86b",
      fill: "rgba(255,216,107,0.12)",
    },
    "business": {
      border: "#2b3a8f",
      glow: "rgba(43,58,143,0.35)",
      badge: "#98a4ff",
      fill: "rgba(43,58,143,0.22)",
    },
    "autre-sport": {
      border: "#b682ff",
      glow: "rgba(182,130,255,0.25)",
      badge: "#b682ff",
      fill: "rgba(182,130,255,0.12)",
    },
    "jeux-video": {
      border: "#b6b6b6",
      glow: "rgba(182,182,182,0.18)",
      badge: "#b6b6b6",
      fill: "rgba(182,182,182,0.12)",
    },
    "informatique": {
      border: "#0d0d0d",
      glow: "rgba(0,0,0,0.45)",
      badge: "#7cffb7",
      fill: "rgba(0,0,0,0.45)",
    },
    "nature": {
      border: "#f3f0e6",
      glow: "rgba(243,240,230,0.2)",
      badge: "#f3f0e6",
      fill: "rgba(243,240,230,0.16)",
    },
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadFeed({ query, mode, sort, theme });
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto auto auto",
          gap: 8,
          alignItems: "center",
          padding: 10,
          borderRadius: 12,
          background: "rgba(11,15,20,0.45)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "hashtag" ? "#hashtag" : "pseudo"}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(9,11,16,0.8)",
            color: "white",
          }}
        />

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "pseudonym" | "hashtag")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(9,11,16,0.8)",
            color: "white",
          }}
        >
          <option value="pseudonym">Pseudo</option>
          <option value="hashtag">Hashtag</option>
        </select>

        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(9,11,16,0.8)",
            color: "white",
          }}
        >
          <option value="all">Tous thèmes</option>
          <option value="politique">Politique</option>
          <option value="foot">Foot</option>
          <option value="sex">Sex</option>
          <option value="nourriture">Nourriture</option>
          <option value="business">Business</option>
          <option value="autre-sport">Autre sport</option>
          <option value="jeux-video">Jeux vidéo</option>
          <option value="informatique">Informatique</option>
          <option value="nature">Nature</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "top" | "recent")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(9,11,16,0.8)",
            color: "white",
          }}
        >
          <option value="top">Plus écoutés</option>
          <option value="recent">Plus récents</option>
        </select>

        <button className="tt-newbtn" type="submit" style={{ padding: "8px 12px" }}>
          Rechercher
        </button>

        <button
          type="button"
          onClick={() => {
            setQuery("");
            setMode("pseudonym");
            setTheme("all");
            loadFeed({ query: "", mode: "pseudonym", sort, theme: "all" });
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "transparent",
            color: "white",
          }}
        >
          Effacer
        </button>
      </form>

      {items.length === 0 && (
        <div style={{ padding: 12, opacity: 0.8 }}>
          {query.trim().length > 0 ? "Aucun résultat pour cette recherche." : "Aucun post pour l’instant."}
        </div>
      )}

      {items.map((p) => (
        (() => {
          const theme = themeStyles[p.theme] || themeStyles["politique"];
          return (
        <article
          key={p.id}
          style={{
            padding: 14,
            borderRadius: 12,
            background: theme.fill,
            border: p.locked ? "2px solid red" : `1px solid ${theme.border}`,
            boxShadow: p.locked ? undefined : `0 0 16px ${theme.glow}`,
            color: p.locked ? "red" : "inherit",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <strong>{p.pseudonym}</strong>{" "}
              <span style={{ opacity: 0.9 }}>{p.hashtag}</span>{" "}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 999,
                  border: `1px solid ${theme.border}`,
                  color: theme.badge,
                  opacity: 0.9,
                }}
              >
                {p.theme}
              </span>
              {p.locked && <span style={{ marginLeft: 10, fontWeight: 700 }}>🔒 LOCKED</span>}
              {p.title ? <div style={{ marginTop: 6 }}>{p.title}</div> : null}
            </div>

            {/* ⚠️ Ajuste si ton LikeButton n'a pas ces props */}
            {/* @ts-ignore */}
            <LikeButton postId={p.id} likeCount={p.like_count} likedByMe={p.liked_by_me} />
          </div>

          {p.caption ? <div style={{ marginTop: 10, opacity: 0.9 }}>{p.caption}</div> : null}

          <div style={{ marginTop: 12 }}>
            <UnlockPlayer postId={String(p.id)} locked={!!p.locked} />
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
            {p.audio_duration_seconds}s · {p.listen_count} écoute{p.listen_count > 1 ? "s" : ""}
          </div>
        </article>
          );
        })()
      ))}
    </div>
  );
}
