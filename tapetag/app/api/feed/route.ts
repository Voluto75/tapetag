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

function escapeLike(input: string) {
  return input.replace(/[%_]/g, "\\$&");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawTag = searchParams.get("tag");
  const rawQuery = searchParams.get("q") || "";
  const rawMode = searchParams.get("mode") || "";
  const rawSort = searchParams.get("sort") || "";
  const rawTheme = searchParams.get("theme") || "";

  const supabase = supabaseServer();

  // ✅ On inclut passcode_hash uniquement pour calculer locked,
  // mais on ne le renvoie pas au client.
  let q = supabase
    .from("voice_posts")
    .select(
      "id,pseudonym,hashtag,theme,title,caption,audio_duration_seconds,created_at,status,passcode_hash,listen_count"
    )
    .eq("status", "active")
    .limit(50);

  const sort = rawSort.toLowerCase();
  if (sort === "recent") {
    q = q.order("created_at", { ascending: false });
  } else {
    q = q.order("listen_count", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  }

  if (rawTag) q = q.eq("hashtag", normalizeHashtag(rawTag));
  if (rawTheme.trim().length > 0) q = q.eq("theme", rawTheme.trim());
  if (rawQuery.trim().length > 0) {
    const term = rawQuery.trim();
    const mode = rawMode.toLowerCase();

    if (mode === "hashtag" || term.startsWith("#")) {
      const normalized = normalizeHashtag(term);
      const pattern = `${escapeLike(normalized)}%`;
      q = q.ilike("hashtag", pattern);
    } else {
      const pattern = `%${escapeLike(term)}%`;
      q = q.ilike("pseudonym", pattern);
    }
  }

  const res = await q;
  if (res.error) {
    return NextResponse.json({ error: res.error.message }, { status: 500 });
  }

  // ✅ items sans audio_url (lecture via /unlock => URL signée)
  const itemsBase = (res.data ?? []).map((p: any) => ({
    id: p.id,
    pseudonym: p.pseudonym,
    hashtag: p.hashtag,
    theme: p.theme ?? "politique",
    title: p.title ?? null,
    caption: p.caption ?? null,
    audio_duration_seconds: p.audio_duration_seconds,
    created_at: p.created_at,
    locked: !!p.passcode_hash, // 🔒 si hash présent
    listen_count: p.listen_count ?? 0,
  }));

  // ---- LIKES ----
  const visitor_id = getCookie(req, "tt_vid");
  const ids = itemsBase.map((p: any) => p.id);

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

  const items = itemsBase.map((p: any) => ({
    ...p,
    like_count: likeCountMap.get(p.id) ?? 0,
    liked_by_me: likedByMeSet.has(p.id),
  }));

  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
