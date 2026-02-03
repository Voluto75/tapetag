"use client";

import React, { useEffect, useState } from "react";

type TagItem = {
  hashtag: string;
  count: number;
};

export default function TrendingTags() {
  const [items, setItems] = useState<TagItem[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/trending-tags", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErr(j?.error || "Impossible de charger les tendances.");
          return;
        }
        setItems(Array.isArray(j?.items) ? j.items : []);
      } catch (e: any) {
        setErr(e?.message || "Erreur réseau.");
      }
    })();
  }, []);

  return (
    <section className="tt-trends" aria-label="Hashtags tendances">
      <div className="tt-trends__title">Trending Hashtags</div>
      {err ? (
        <div className="tt-trends__empty">{err}</div>
      ) : items.length === 0 ? (
        <div className="tt-trends__empty">Aucune tendance pour l’instant.</div>
      ) : (
        <div className="tt-trends__grid">
          {items.map((t) => (
            <a
              key={t.hashtag}
              className="tt-trends__item"
              href={`/tag/${encodeURIComponent(t.hashtag.replace("#", ""))}`}
            >
              <span className="tt-trends__tag">{t.hashtag}</span>
              <span className="tt-trends__count">{t.count}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
