"use client";

import { useState } from "react";

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
  likeCount,
  likedByMe,
}: {
  postId: string;
  initialCount?: number;
  initialLiked?: boolean;
  likeCount?: number;
  likedByMe?: boolean;
}) {
  const [count, setCount] = useState(initialCount ?? likeCount ?? 0);
  const [liked, setLiked] = useState(initialLiked ?? likedByMe ?? false);
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
      onClick={toggle}
      aria-pressed={liked}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: loading ? 0.7 : 1,
        fontSize: 20,
        lineHeight: 1,
        color: "#ff2f4d",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        filter: "drop-shadow(0 0 10px rgba(255,47,77,0.7))",
      }}
      aria-label={`Like (${count})`}
    >
      <span style={{ color: liked ? "#ff2f4d" : "#ff2f4d" }}>♥</span>
    </button>
  );
}
