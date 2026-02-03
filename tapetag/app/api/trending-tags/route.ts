import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = supabaseServer();

    const res = await supabase
      .from("voice_posts")
      .select("hashtag,status")
      .eq("status", "active")
      .limit(2000);

    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }

    const counts = new Map<string, number>();
    for (const row of res.data ?? []) {
      const tag = (row as any)?.hashtag;
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }

    const items = Array.from(counts.entries())
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40);

    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Bad Request" }, { status: 400 });
  }
}
