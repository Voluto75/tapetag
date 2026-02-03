import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabase-server";

const schema = z.object({
  pseudonym: z.string().min(1).max(40),
  hashtag: z.string().min(1).max(40),
  theme: z.enum([
    "politique",
    "foot",
    "sex",
    "nourriture",
    "business",
    "autre-sport",
    "jeux-video",
    "informatique",
    "nature",
  ]),
  parent_id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().max(80).optional().or(z.literal("")),
  caption: z.string().max(280).optional().or(z.literal("")),
  duration: z.coerce.number().int().min(1).max(30),

  // ✅ nouveau : mot de passe optionnel
  passcode: z.string().max(64).optional().or(z.literal("")),
});

function normalizeHashtag(input: string) {
  let h = input.trim();
  if (!h.startsWith("#")) h = "#" + h;
  h = h.toLowerCase();
  if (!/^#[a-z0-9_]+$/.test(h)) {
    throw new Error("Invalid hashtag (use letters/numbers/underscore)");
  }
  return h;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get("audio") as File | null;
    if (!file) return NextResponse.json({ error: "Missing audio" }, { status: 400 });

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    const parsed = schema.parse({
      pseudonym: form.get("pseudonym"),
      hashtag: form.get("hashtag"),
      theme: form.get("theme"),
      parent_id: form.get("parent_id"),
      title: form.get("title"),
      caption: form.get("caption"),
      duration: form.get("duration"),
      passcode: form.get("passcode"), // ✅ nouveau
    });

    const hashtag = normalizeHashtag(parsed.hashtag);
    const parent_post_id = parsed.parent_id ? parsed.parent_id : null;

    // ✅ hash du mot de passe (optionnel)
    const passcodeRaw = (parsed.passcode || "").trim();
    const passcode_hash =
      passcodeRaw.length > 0 ? await bcrypt.hash(passcodeRaw, 12) : null;

    const supabase = supabaseServer();

    // ✅ Storage path (évite "public/" — surtout si bucket privé)
    const ext = file.name.split(".").pop() || "webm";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const storagePath = filename; // ou `voices/${filename}` si tu veux un dossier

    const bytes = new Uint8Array(await file.arrayBuffer());

    const up = await supabase.storage.from("voices").upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

    if (up.error) {
      console.log("UPLOAD voices ERROR", up.error);
      return NextResponse.json({ error: up.error.message }, { status: 500 });
    }

    const ins = await supabase
      .from("voice_posts")
      .insert({
        pseudonym: parsed.pseudonym,
        hashtag,
        theme: parsed.theme,
        parent_post_id,
        title: parsed.title || null,
        caption: parsed.caption || null,
        audio_path: storagePath, // ✅ on stocke le chemin Storage
        audio_duration_seconds: parsed.duration,
        passcode_hash, // ✅ nouveau
      })
      .select("id")
      .single();

    if (ins.error) {
      console.log("INSERT voice_posts ERROR", ins.error);
      return NextResponse.json({ error: ins.error.message }, { status: 500 });
    }

    return NextResponse.json({ id: ins.data.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Bad Request" },
      { status: 400 }
    );
  }
}
