
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const parts = cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}


function normalizeHashtag(input: string) {
  let h = input.trim();
  if (!h.startsWith("#")) h = "#" + h;
  return h.toLowerCase();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawTag = searchParams.get("tag");

  const supabase = supabaseServer();

  let q = supabase
    .from("voice_posts")
    .select("id,pseudonym,hashtag,title,caption,audio_path,audio_duration_seconds,created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (rawTag) q = q.eq("hashtag", normalizeHashtag(rawTag));

  const res = await q;
  if (res.error) {
    return NextResponse.json({ error: res.error.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("voices").getPublicUrl("");
  const base = pub.publicUrl;

  const items = (res.data ?? []).map((p) => ({
    ...p,
    audio_url: `${base}/${p.audio_path}`,
  }));

  // ---- LIKES (Niveau A) ----

const visitor_id = getCookie(req, "tt_vid");

  const ids = items.map((p: any) => p.id);
  let likesRows: { post_id: string; visitor_id: string }[] = [];

  if (ids.length > 0) {
    const likes = await supabase
      .from("post_likes")
      .select("post_id,visitor_id")
      .in("post_id", ids);

    if (!likes.error) likesRows = (likes.data as any) ?? [];
  }

  const likeCountMap = new Map<string, number>();
  const likedByMeSet = new Set<string>();

  for (const r of likesRows) {
    likeCountMap.set(r.post_id, (likeCountMap.get(r.post_id) ?? 0) + 1);
    if (visitor_id && r.visitor_id === visitor_id) likedByMeSet.add(r.post_id);
  }

  const withLikes = items.map((p: any) => ({
    ...p,
    like_count: likeCountMap.get(p.id) ?? 0,
    liked_by_me: likedByMeSet.has(p.id),
  }));

  return NextResponse.json({ items: withLikes });
}



