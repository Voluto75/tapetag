export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase-server";

function normalizeSlug(input: string) {
  const s = (input || "").trim().toLowerCase().replace(/\s+/g, "");
  return s.replace(/[^a-z0-9_]/g, "");
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const slug = normalizeSlug(tag);
  const hashtag = `#${slug}`;

  // DEBUG (temporaire)
  if (!slug) {
    return (
      <main style={{ padding: 24 }}>
        <a href="/">Back</a>
        <h1 style={{ fontSize: 28, marginTop: 12 }}>DEBUG</h1>
<pre>tag: {JSON.stringify(tag)}</pre>

        <pre>slug: {JSON.stringify(slug)}</pre>
        <pre>hashtag: {JSON.stringify(hashtag)}</pre>
      </main>
    );
  }

  const supabase = supabaseServer();

  const filtered = await supabase
    .from("voice_posts")
    .select("id,pseudonym,hashtag,title,caption,audio_path,audio_duration_seconds,created_at")
    .eq("status", "active")
    .ilike("hashtag", hashtag)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filtered.error) {
    return (
      <main style={{ padding: 24 }}>
        <a href="/">Back</a>
        <h1 style={{ fontSize: 28, marginTop: 12 }}>Tag: {hashtag}</h1>
        <pre style={{ marginTop: 12 }}>{filtered.error.message}</pre>
      </main>
    );
  }

  const { data: pub } = supabase.storage.from("voices").getPublicUrl("");
  const base = pub.publicUrl;

  const items =
    filtered.data?.map((p) => ({
      ...p,
      audio_url: `${base}/${p.audio_path}`,
    })) ?? [];

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 28 }}>Tag: {hashtag}</h1>
        <a href="/">Back</a>
      </div>

      <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
        {items.map((p: any) => (
          <div key={p.id} style={{ border: "1px solid #ccc", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{p.pseudonym}</strong>
              <a href={`/tag/${encodeURIComponent(p.hashtag.slice(1))}`}>{p.hashtag}</a>
            </div>
            <div style={{ marginTop: 8 }}>
              <audio controls src={p.audio_url} />
            </div>
          </div>
        ))}
        {items.length === 0 && <div>No posts for this tag yet.</div>}
      </div>
    </main>
  );
}


  
