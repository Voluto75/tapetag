"use client";

import { useState } from "react";

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
}: {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Like failed");

      setLiked(!!data.liked);
      setCount(Number(data.like_count ?? 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="tt-btn98 tt-like"
      onClick={toggle}
      aria-pressed={liked}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        opacity: loading ? 0.7 : 1,
      }}
    >
      <span style={{ color: liked ? "#FF2F92" : "#141414" }}>♥</span>
      <span>{count}</span>
    </button>
  );
}

