import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const postsIdx = pathParts.indexOf("posts");
    const idFromPath =
      postsIdx >= 0 && pathParts.length > postsIdx + 1 ? pathParts[postsIdx + 1] : null;

    const postId = params?.id || idFromPath;

    if (!postId || postId === "undefined" || postId === "null") {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const passcode = String(body?.passcode ?? "");

    const supabase = supabaseServer();

    const { data: post, error } = await supabase
      .from("voice_posts")
      .select("id,audio_path,passcode_hash,status,listen_count")
      .eq("id", postId)
      .single();

    if (error || !post) {
      console.log("UNLOCK not found", { postId, error });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (post.status !== "active") {
      console.log("UNLOCK inactive", { postId, status: post.status });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (post.passcode_hash) {
      const ok = await bcrypt.compare(passcode, post.passcode_hash);
      if (!ok) {
        return NextResponse.json(
          { error: "Mot de passe incorrect" },
          { status: 401 }
        );
      }
    }

    await supabase
      .from("voice_posts")
      .update({ listen_count: (post.listen_count ?? 0) + 1 })
      .eq("id", postId);

    const signed = await supabase.storage
      .from("voices")
      .createSignedUrl(post.audio_path, 60 * 10);

    if (signed.error || !signed.data?.signedUrl) {
      console.log("UNLOCK signed url error", signed.error);
      return NextResponse.json(
        { error: signed.error?.message || "Could not create signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { url: signed.data.signedUrl },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Bad Request" },
      { status: 400 }
    );
  }
}
