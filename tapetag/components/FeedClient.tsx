"use client";

import { useEffect, useState } from "react";
import LikeButton from "@/components/LikeButton";

type Item = {
  id: string;
  pseudonym: string;
  hashtag: string;
  title: string | null;
  caption: string | null;
  audio_url: string;
  like_count?: number;
  liked_by_me?: boolean;
};

export default function FeedClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load feed");
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (err) return <div style={{ padding: 24 }}>Error: {err}</div>;

  return (
    <section style={{ padding: 24 }}>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((p) => (
          <div key={p.id} className="tt-card" style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong>{p.pseudonym}</strong>

              {(() => {
                const tagSlug = (p.hashtag || "").startsWith("#") ? p.hashtag.slice(1) : p.hashtag || "";
                return <a href={`/tag/${encodeURIComponent(tagSlug)}`}>{p.hashtag}</a>;
              })()}
            </div>

            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 10,
              }}
            >
              <LikeButton
                postId={p.id}
                initialCount={p.like_count ?? 0}
                initialLiked={p.liked_by_me ?? false}
              />
            </div>

            {p.title && <div style={{ marginTop: 6 }}>{p.title}</div>}
            {p.caption && <div style={{ marginTop: 6, opacity: 0.8 }}>{p.caption}</div>}

            <div style={{ marginTop: 10 }}>
              <audio controls src={p.audio_url} />
            </div>
          </div>
        ))}

        {items.length === 0 && <div>No posts yet.</div>}
      </div>
    </section>
  );
}

