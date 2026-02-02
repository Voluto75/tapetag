import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";

const schema = z.object({
  pseudonym: z.string().min(1).max(40),
  hashtag: z.string().min(1).max(40),
  title: z.string().max(80).optional().or(z.literal("")),
  caption: z.string().max(280).optional().or(z.literal("")),
  duration: z.coerce.number().int().min(1).max(30),
});

function normalizeHashtag(input: string) {
  let h = input.trim();
  if (!h.startsWith("#")) h = "#" + h;
  h = h.toLowerCase();
  if (!/^#[a-z0-9_]+$/.test(h)) throw new Error("Invalid hashtag (use letters/numbers/underscore)");
  return h;
}

export async function POST(req: Request) {
  try {
   console.log("api/posts env", {
   hasUrl: !!process.env.SUPABASE_URL,
   hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
   urlHead: process.env.SUPABASE_URL?.slice(0, 30),
   serviceHead: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10),
});

    const form = await req.formData();

    const file = form.get("audio") as File | null;
    if (!file) return NextResponse.json({ error: "Missing audio" }, { status: 400 });

    const parsed = schema.parse({
      pseudonym: form.get("pseudonym"),
      hashtag: form.get("hashtag"),
      title: form.get("title"),
      caption: form.get("caption"),
      duration: form.get("duration"),
    });

    const hashtag = normalizeHashtag(parsed.hashtag);

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    const supabase = supabaseServer();

    const ext = file.name.split(".").pop() || "webm";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `public/${filename}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const up = await supabase.storage.from("voices").upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

    const ins = await supabase
      .from("voice_posts")
      .insert({
        pseudonym: parsed.pseudonym,
        hashtag,
        title: parsed.title || null,
        caption: parsed.caption || null,
        audio_path: path,
        audio_duration_seconds: parsed.duration,
      })
      .select("id")
      .single();

    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });

    return NextResponse.json({ id: ins.data.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Bad Request" }, { status: 400 });
  }
}

