import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";

const bodySchema = z.object({
  post_id: z.string().uuid(),
});

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const parts = cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer();
    const json = await req.json();
    const { post_id } = bodySchema.parse(json);

    let visitor_id = getCookie(req, "tt_vid");

    // On prépare la réponse
    const res = NextResponse.json({ ok: true });

    // Si pas de cookie → on en crée un
    if (!visitor_id) {
      visitor_id = crypto.randomUUID();
      res.cookies.set("tt_vid", visitor_id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    // Toggle like
    const existing = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("visitor_id", visitor_id)
      .maybeSingle();

    if (existing.error) {
      return NextResponse.json({ error: existing.error.message }, { status: 500 });
    }

    let liked = false;

    if (existing.data?.id) {
      const del = await supabase
        .from("post_likes")
        .delete()
        .eq("id", existing.data.id);

      if (del.error) {
        return NextResponse.json({ error: del.error.message }, { status: 500 });
      }

      liked = false;
    } else {
      const ins = await supabase
        .from("post_likes")
        .insert({ post_id, visitor_id });

      if (ins.error) {
        return NextResponse.json({ error: ins.error.message }, { status: 500 });
      }

      liked = true;
    }

    // Recalcul du compteur
    const countQ = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post_id);

    if (countQ.error) {
      return NextResponse.json({ error: countQ.error.message }, { status: 500 });
    }

    // Réponse finale (on garde le cookie posé)
    return new NextResponse(
      JSON.stringify({
        liked,
        like_count: countQ.count ?? 0,
      }),
      { status: 200, headers: res.headers }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Bad Request" },
      { status: 400 }
    );
  }
}

