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
  replies?: ReplyItem[];
};

type ReplyItem = {
  id: string;
  pseudonym: string;
  hashtag: string;
  theme: string;
  title: string | null;
  caption: string | null;
  audio_duration_seconds: number;
  created_at: string;
  locked: boolean;
  listen_count: number;
  parent_post_id: string;
};

export default function FeedClient() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"pseudonym" | "hashtag">("pseudonym");
  const [sort, setSort] = useState<"top" | "recent">("top");
  const [theme, setTheme] = useState<string>("all");
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});

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
        setErr(j?.error || "Unable to load feed.");
        setItems([]);
        return;
      }

      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch (e: any) {
      setErr(e?.message || "Network error.");
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

  const themeLabels: Record<string, string> = {
    "politique": "politics",
    "foot": "foot",
    "sex": "sex",
    "nourriture": "food",
    "business": "business",
    "autre-sport": "other sport",
    "jeux-video": "video games",
    "informatique": "tech",
    "nature": "nature",
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
          placeholder={mode === "hashtag" ? "#hashtag" : "username"}
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
          <option value="pseudonym">Username</option>
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
          <option value="all">All themes</option>
          <option value="politique">Politics</option>
          <option value="foot">Foot</option>
          <option value="sex">Sex</option>
          <option value="nourriture">Food</option>
          <option value="business">Business</option>
          <option value="autre-sport">Other sport</option>
          <option value="jeux-video">Video games</option>
          <option value="informatique">Tech</option>
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
          <option value="top">Most listened</option>
          <option value="recent">Most recent</option>
        </select>

        <button className="tt-newbtn" type="submit" style={{ padding: "8px 12px" }}>
          Search
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
          Clear
        </button>
      </form>

      {items.length === 0 && (
        <div style={{ padding: 12, opacity: 0.8 }}>
          {query.trim().length > 0 ? "No results for this search." : "No posts yet."}
        </div>
      )}

      {items.map((p) => (
        (() => {
          const theme = themeStyles[p.theme] || themeStyles["politique"];
          const replies = p.replies ?? [];
          const isOpen = !!openReplies[p.id];
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
                {themeLabels[p.theme] ?? p.theme}
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
            {p.audio_duration_seconds}s · {p.listen_count} listen{p.listen_count > 1 ? "s" : ""}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <a
              href={`/new?replyTo=${encodeURIComponent(p.id)}`}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                color: theme.badge,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              cmt
            </a>
            <button
              type="button"
              onClick={() =>
                setOpenReplies((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
              }
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              see cmt ({replies.length})
            </button>
          </div>

          {isOpen && replies.length > 0 && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {replies.map((r) => {
                const rt = themeStyles[r.theme] || themeStyles["politique"];
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: rt.fill,
                      border: `1px solid ${rt.border}`,
                      boxShadow: `0 0 10px ${rt.glow}`,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      <strong>{r.pseudonym}</strong> <span>{r.hashtag}</span>
                    </div>
                    {r.title ? <div style={{ marginTop: 6 }}>{r.title}</div> : null}
                    {r.caption ? <div style={{ marginTop: 6, opacity: 0.9 }}>{r.caption}</div> : null}
                    <div style={{ marginTop: 8 }}>
                      <UnlockPlayer postId={String(r.id)} locked={!!r.locked} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, opacity: 0.75 }}>
                      {r.audio_duration_seconds}s · {r.listen_count} listen{r.listen_count > 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
          );
        })()
      ))}
    </div>
  );
}
