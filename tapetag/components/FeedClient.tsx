"use client";

import React, { useEffect, useState } from "react";
import UnlockPlayer from "@/components/UnlockPlayer";
import LikeButton from "@/components/LikeButton";
import TrendingTags from "@/components/TrendingTags";

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
  const normalizeHashtag = (input: string) => {
    const raw = input.trim().replace(/^#/, "").toLowerCase();
    if (!raw) return null;
    const cleaned = raw.replace(/[^a-z0-9_]/g, "");
    return cleaned ? `#${cleaned}` : null;
  };

  const initialTag =
    typeof window !== "undefined"
      ? normalizeHashtag(new URLSearchParams(window.location.search).get("tag") || "")
      : null;

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"pseudonym" | "hashtag">("hashtag");
  const [sort, setSort] = useState<"top" | "recent">("recent");
  const [theme, setTheme] = useState<string>("all");
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [stayHashtag, setStayHashtag] = useState<string | null>(initialTag);
  const [lastHashtagSearch, setLastHashtagSearch] = useState<string | null>(null);
  const [lastHashtagSearchHasResults, setLastHashtagSearchHasResults] = useState(false);
  const [pinnedTags, setPinnedTags] = useState<string[]>([]);
  const [fxName, setFxName] = useState("wall-rain");
  const [fxActive, setFxActive] = useState(false);
  const [fxKey, setFxKey] = useState(0);

  const activateHashtagEnvironment = (tag: string) => {
    setQuery(tag);
    setMode("hashtag");
    setStayHashtag(tag);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tag", tag.slice(1));
      window.history.replaceState(null, "", url.toString());
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("tt_pinned_tags");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .map((v) => normalizeHashtag(String(v)))
          .filter((v): v is string => !!v)
          .slice(0, 3);
        setPinnedTags(cleaned);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tt_pinned_tags", JSON.stringify(pinnedTags.slice(0, 3)));
  }, [pinnedTags]);

  useEffect(() => {
    const variants = ["wall-rain", "fireworks", "candy-rain", "emoji-rain", "strobe", "spark-wave"];
    let last = -1;
    let hideTimer: number | null = null;

    const triggerFx = () => {
      let idx = Math.floor(Math.random() * variants.length);
      if (idx === last) idx = (idx + 1) % variants.length;
      last = idx;

      setFxName(variants[idx]);
      setFxKey((k) => k + 1);
      setFxActive(true);

      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setFxActive(false), 3000);
    };

    const first = window.setTimeout(triggerFx, 1000);
    const loop = window.setInterval(triggerFx, 20000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  const loadFeed = async (opts?: {
    query?: string;
    mode?: "pseudonym" | "hashtag";
    sort?: "top" | "recent";
    theme?: string;
    forceHashtag?: string | null;
  }) => {
    const q = (opts?.query ?? query).trim();
    const m = opts?.mode ?? mode;
    const s = opts?.sort ?? sort;
    const t = opts?.theme ?? "all";
    const forcedTag = opts?.forceHashtag ?? null;

    try {
      setLoading(true);
      setErr("");

      const params = new URLSearchParams();
      if (forcedTag) {
        params.set("q", forcedTag);
        params.set("mode", "hashtag");
      } else if (q.length > 0) {
        params.set("q", q);
        params.set("mode", m);
      }
      if (t !== "all") {
        params.set("theme", t);
      }
      params.set("sort", s);

      const url = params.toString().length > 0 ? `/api/feed?${params}` : "/api/feed";
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setErr(j?.error || "Unable to load feed.");
        setItems([]);
        return;
      }

      const loadedItems = Array.isArray(j?.items) ? j.items : [];
      setItems(loadedItems);

      if (!forcedTag && m === "hashtag" && q.length > 0) {
        const normalized = normalizeHashtag(q);
        setLastHashtagSearch(normalized);
        setLastHashtagSearchHasResults(loadedItems.length > 0);
      } else if (!forcedTag) {
        setLastHashtagSearch(null);
        setLastHashtagSearchHasResults(false);
      }
    } catch (e: any) {
      setErr(e?.message || "Network error.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed({ sort, theme, forceHashtag: stayHashtag });
  }, [sort, theme, stayHashtag]);

  useEffect(() => {
    if (!stayHashtag) return;
    setMode("hashtag");
    setQuery(stayHashtag);
  }, [stayHashtag]);

  useEffect(() => {
    if (!stayHashtag) return;
    const id = window.setInterval(() => {
      loadFeed({ sort, theme, forceHashtag: stayHashtag });
    }, 10000);
    return () => window.clearInterval(id);
  }, [stayHashtag, sort, theme]);

  if (loading) return <div style={{ padding: 12, opacity: 0.8 }}>Loading…</div>;
  if (err) return <div style={{ padding: 12, color: "crimson" }}>{err}</div>;

  const themeStyles: Record<string, { border: string; glow: string; badge: string; fill: string }> = {
    "politique": {
      border: "#7ad7ff",
      glow: "rgba(122,215,255,0.75)",
      badge: "#7ad7ff",
      fill: "rgba(122,215,255,0.58)",
    },
    "foot": {
      border: "#78ffb0",
      glow: "rgba(120,255,176,0.75)",
      badge: "#78ffb0",
      fill: "rgba(120,255,176,0.58)",
    },
    "sex": {
      border: "#ff77c8",
      glow: "rgba(255,119,200,0.75)",
      badge: "#ff77c8",
      fill: "rgba(255,119,200,0.58)",
    },
    "nourriture": {
      border: "#ffd86b",
      glow: "rgba(255,216,107,0.75)",
      badge: "#ffd86b",
      fill: "rgba(255,216,107,0.58)",
    },
    "business": {
      border: "#2b3a8f",
      glow: "rgba(43,58,143,0.85)",
      badge: "#98a4ff",
      fill: "rgba(43,58,143,0.72)",
    },
    "autre-sport": {
      border: "#b682ff",
      glow: "rgba(182,130,255,0.75)",
      badge: "#b682ff",
      fill: "rgba(182,130,255,0.58)",
    },
    "jeux-video": {
      border: "#b6b6b6",
      glow: "rgba(182,182,182,0.6)",
      badge: "#b6b6b6",
      fill: "rgba(182,182,182,0.5)",
    },
    "informatique": {
      border: "#0d0d0d",
      glow: "rgba(0,0,0,0.8)",
      badge: "#7cffb7",
      fill: "rgba(0,0,0,0.8)",
    },
    "nature": {
      border: "#f3f0e6",
      glow: "rgba(243,240,230,0.65)",
      badge: "#f3f0e6",
      fill: "rgba(243,240,230,0.56)",
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

  const searchableTag = mode === "hashtag" ? normalizeHashtag(query) : null;
  const canStay =
    !stayHashtag &&
    mode === "hashtag" &&
    !!searchableTag &&
    searchableTag === lastHashtagSearch &&
    lastHashtagSearchHasResults;
  const canPin =
    !!searchableTag &&
    mode === "hashtag" &&
    searchableTag === lastHashtagSearch &&
    lastHashtagSearchHasResults &&
    !pinnedTags.includes(searchableTag) &&
    pinnedTags.length < 3;

  return (
    <div className="tt-feed">
      <form
        className="tt-feed-filters"
        onSubmit={(e) => {
          e.preventDefault();
          loadFeed({ query, mode, sort, theme, forceHashtag: stayHashtag });
        }}
      >
        <input
          className="tt-feed-control tt-feed-control--input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "hashtag" ? "#hashtag" : "pseuso"}
        />

        <select
          className="tt-feed-control"
          value={mode}
          onChange={(e) => setMode(e.target.value as "pseudonym" | "hashtag")}
        >
          <option value="pseudonym">Pseudo</option>
          <option value="hashtag">Hashtag</option>
        </select>

        <select
          className="tt-feed-control"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
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
          className="tt-feed-control"
          value={sort}
          onChange={(e) => setSort(e.target.value as "top" | "recent")}
        >
          <option value="top">Most listened</option>
          <option value="recent">Most recent</option>
        </select>

        <button className="tt-feed-action" type="submit">
          Search
        </button>

        <button
          type="button"
          onClick={() => {
            setQuery("");
            setMode("pseudonym");
            setTheme("all");
            setStayHashtag(null);
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.delete("tag");
              window.history.replaceState(null, "", url.toString());
            }
            loadFeed({ query: "", mode: "pseudonym", sort, theme: "all", forceHashtag: null });
          }}
          className="tt-feed-action tt-feed-action--ghost"
        >
          Clear
        </button>
      </form>

      {canStay ? (
        <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="tt-feed-action"
            onClick={() => {
              if (!searchableTag) return;
              activateHashtagEnvironment(searchableTag);
            }}
          >
            stay
          </button>

          {canPin ? (
            <button
              type="button"
              className="tt-feed-action tt-feed-action--ghost"
              onClick={() => {
                if (!searchableTag) return;
                setPinnedTags((prev) => {
                  const next = [...prev, searchableTag].filter((v, i, arr) => arr.indexOf(v) === i);
                  return next.slice(0, 3);
                });
              }}
            >
              pin hashtag
            </button>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Pinned:</span>
        {pinnedTags.map((tag) => (
          <div key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              className="tt-feed-action"
              onClick={() => activateHashtagEnvironment(tag)}
            >
              {tag}
            </button>
            <button
              type="button"
              className="tt-feed-action tt-feed-action--ghost"
              onClick={() => setPinnedTags((prev) => prev.filter((t) => t !== tag))}
            >
              ×
            </button>
          </div>
        ))}
        {pinnedTags.length === 0 ? <span style={{ fontSize: 12, opacity: 0.65 }}>No pinned hashtag yet</span> : null}
      </div>

      {stayHashtag ? (
        <div style={{ fontSize: 12, opacity: 0.9, display: "flex", alignItems: "center", gap: 10 }}>
          <span>Staying in hashtag environment: {stayHashtag}</span>
          <button
            type="button"
            className="tt-feed-action tt-feed-action--ghost"
            onClick={() => {
              setStayHashtag(null);
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.delete("tag");
                window.history.replaceState(null, "", url.toString());
              }
              loadFeed({ query: "", mode: "pseudonym", sort, theme, forceHashtag: null });
            }}
          >
            exit hashtag
          </button>
          <a className="tt-feed-action" href={`/new?tag=${encodeURIComponent(stayHashtag.slice(1))}`}>
            post in {stayHashtag}
          </a>
        </div>
      ) : null}

      <div className="tt-feed-stage">
        <div
          key={fxKey}
          className={`tt-feed-fx ${fxActive ? `tt-feed-fx--active tt-feed-fx--${fxName}` : ""}`}
        />

        <div className="tt-feed-stage__content">
          <TrendingTags />

          {items.length === 0 && (
            <div style={{ padding: 12, opacity: 0.8 }}>
              {query.trim().length > 0 ? "No results for this search." : "No posts yet."}
            </div>
          )}

          <div className="tt-feed-grid">
            {items.map((p) => (
        (() => {
          const theme = themeStyles[p.theme] || themeStyles["politique"];
          const replies = p.replies ?? [];
          const isOpen = !!openReplies[p.id];
          return (
        <article
          className="tt-feed-card"
          key={p.id}
          style={{
            padding: 10,
            borderRadius: 14,
            aspectRatio: "1 / 1",
            overflow: "visible",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            background: theme.fill,
            border: p.locked ? "2px solid red" : `1px solid ${theme.border}`,
            boxShadow: p.locked
              ? undefined
              : `0 0 0 1px ${theme.border} inset, 0 0 18px ${theme.glow}, 0 0 32px ${theme.glow}`,
            color: p.locked ? "red" : "inherit",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -15,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#ffffff",
              background: "rgba(8, 10, 14, 0.96)",
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: "4px 10px",
              width: "fit-content",
              maxWidth: "calc(100% - 16px)",
              whiteSpace: "nowrap",
              boxShadow: `0 4px 0 rgba(0,0,0,0.35), 0 0 12px ${theme.glow}, 0 0 22px ${theme.glow}`,
              textShadow: `0 0 8px ${theme.glow}, 0 0 14px ${theme.glow}`,
              zIndex: 2,
            }}
          >
            hashtag: {p.hashtag}
          </div>

          <div style={{ display: "grid", gap: 6, marginTop: 8, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <strong style={{ fontSize: 20 }}>pseudo: {p.pseudonym}</strong>
              {/* @ts-ignore */}
              <LikeButton postId={p.id} likeCount={p.like_count} likedByMe={p.liked_by_me} />
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 16,
                  padding: "2px 6px",
                  borderRadius: 999,
                  border: `1px solid ${theme.border}`,
                  color: theme.badge,
                  opacity: 0.95,
                }}
              >
                theme: {themeLabels[p.theme] ?? p.theme}
              </span>
              {p.locked && <span style={{ fontWeight: 700, fontSize: 14 }}>🔒 LOCKED</span>}
            </div>

            {p.title ? <div style={{ fontSize: 20, fontWeight: 700 }}>{p.title}</div> : null}
            {p.caption ? <div style={{ opacity: 0.95, fontSize: 20 }}>{p.caption}</div> : null}

            <div style={{ marginTop: 2 }}>
              <UnlockPlayer postId={String(p.id)} locked={!!p.locked} />
            </div>

            <div style={{ marginTop: 2, fontSize: 17, opacity: 0.9 }}>
              ⏱ {p.audio_duration_seconds}s · 🎧 {p.listen_count} listen{p.listen_count > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 10, opacity: 0.72 }}>
              🗓 {new Date(p.created_at).toLocaleDateString()} · {new Date(p.created_at).toLocaleTimeString()}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <a
                href={`/new?replyTo=${encodeURIComponent(p.id)}`}
                style={{
                  fontSize: 17,
                  padding: "5px 9px",
                  borderRadius: 999,
                  border: `1px solid ${theme.border}`,
                  color: theme.badge,
                  letterSpacing: "0.04em",
                  background: "rgba(255,255,255,0.07)",
                }}
              >
                💬 comment
              </a>
              <button
                type="button"
                onClick={() =>
                  setOpenReplies((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                }
                style={{
                  fontSize: 17,
                  padding: "5px 9px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                👀 comments ({replies.length})
              </button>
            </div>
          </div>

          {isOpen && replies.length > 0 && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {replies.map((r) => {
                const rt = themeStyles[r.theme] || themeStyles["politique"];
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: rt.fill,
                      border: `1px solid ${rt.border}`,
                      boxShadow: `0 0 0 1px ${rt.border} inset, 0 0 10px ${rt.glow}`,
                    }}
                  >
                    <div style={{ fontSize: 14, opacity: 0.95 }}>
                      <strong>pseudo: {r.pseudonym}</strong> <span>hashtag: {r.hashtag}</span>
                    </div>
                    {r.title ? <div style={{ marginTop: 4, fontSize: 17 }}>{r.title}</div> : null}
                    {r.caption ? <div style={{ marginTop: 4, opacity: 0.95, fontSize: 17 }}>{r.caption}</div> : null}
                    <div style={{ marginTop: 6 }}>
                      <UnlockPlayer postId={String(r.id)} locked={!!r.locked} />
                    </div>
                    <div style={{ marginTop: 4, fontSize: 16, opacity: 0.9 }}>
                      ⏱ {r.audio_duration_seconds}s · 🎧 {r.listen_count} listen{r.listen_count > 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>
                      🗓 {new Date(r.created_at).toLocaleDateString()} · {new Date(r.created_at).toLocaleTimeString()}
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
        </div>
      </div>
    </div>
  );
}
