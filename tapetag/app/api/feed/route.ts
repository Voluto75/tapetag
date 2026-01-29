import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

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
  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });

  const { data: pub } = supabase.storage.from("voices").getPublicUrl("");
  const base = pub.publicUrl;

  const items = res.data.map((p) => ({
    ...p,
    audio_url: `${base}/${p.audio_path}`,
  }));

  return NextResponse.json({ items });
}



