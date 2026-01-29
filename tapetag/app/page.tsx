import HeroBanner from "@/components/HeroBanner";

export default async function Home() {
  const res = await fetch("http://localhost:3000/api/feed", { cache: "no-store" });
  const data = await res.json();

  return (
    <main className="tt-layout">

      {/* LEFT AD */}
      <aside className="tt-ad tt-ad--left">
        <div className="tt-ad__inner">
          AD SPACE
        </div>
      </aside>

      {/* CENTER CONTENT */}
      <div className="tt-main">

        {/* APP NAME */}

<header
  style={{
    position: "sticky",
    top: 0,
    zIndex: 20,
    padding: "14px 18px",
    background: "linear-gradient(to bottom, rgba(11,15,20,0.85), rgba(11,15,20,0))",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  }}
>
  <span className="tt-appname">TapeTag</span>

  <a className="tt-newbtn" href="/new">+ New Tape</a>
</header>
        {/* HERO */}
        <HeroBanner text="Just say it." />

        {/* FEED */}
        <section style={{ padding: 24 }}>
          <div style={{ display: "grid", gap: 12 }}>
            {(data.items || []).map((p: any) => (
              <div key={p.id} className="tt-card" style={{ padding: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <strong>{p.pseudonym}</strong>
                  {(() => {
                    const tagSlug = (p.hashtag || "").startsWith("#")
                      ? p.hashtag.slice(1)
                      : p.hashtag || "";
                    return (
                      <a href={`/tag/${encodeURIComponent(tagSlug)}`}>
                        {p.hashtag}
                      </a>
                    );
                  })()}
                </div>

                {p.title && <div style={{ marginTop: 6 }}>{p.title}</div>}
                {p.caption && (
                  <div style={{ marginTop: 6, opacity: 0.8 }}>
                    {p.caption}
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <audio controls src={p.audio_url} />
                </div>
              </div>
            ))}

            {(!data.items || data.items.length === 0) && (
              <div>No posts yet.</div>
            )}
          </div>
        </section>
      </div>

      {/* RIGHT AD */}
      <aside className="tt-ad tt-ad--right">
        <div className="tt-ad__inner">
          AD SPACE
        </div>
      </aside>

    </main>
  );
}

