import Recorder from "@/components/Recorder";

export const dynamic = "force-dynamic";

export default function NewPostPage({ searchParams }: { searchParams?: { replyTo?: string } }) {
  const replyTo = searchParams?.replyTo;
  return (
    <main className="tt-layout">
      {/* LEFT AD */}
      <aside className="tt-ad tt-ad--left">
        <div className="tt-ad__inner">
          <div className="tt-ad__bar">
            <div className="tt-ad__title">Sponsored</div>
            <div className="tt-ad__badge">Ad</div>
          </div>
          <div className="tt-ad__content">
            <div className="tt-banner">
              <img src="/ads/ad-left.jpg" alt="Neon city ad" />
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER CONTENT */}
      <div className="tt-main" style={{ padding: 24 }}>
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
            margin: "-24px -24px 18px",
          }}
        >
          <span className="tt-appname">
            TapeTag
            <span style={{ marginLeft: 8, fontSize: "0.25em", opacity: 0.75 }}>raw</span>
          </span>

          <a className="tt-newbtn" href="/">← HOME</a>
        </header>

        <h1 style={{ fontSize: 28, marginBottom: 4 }}>
          New voice post
        </h1>

        <p
          style={{
            marginBottom: 20,
            fontFamily: "GAU Cube, system-ui",
            letterSpacing: "0.06em",
            color: "#C6A7FF",
            opacity: 0.9,
          }}
        >
          Keep it anonymous — or don’t. Feel free.
        </p>

        <Recorder parentId={replyTo} />
      </div>

      {/* RIGHT AD */}
      <aside className="tt-ad tt-ad--right">
        <div className="tt-ad__inner">
          <div className="tt-ad__bar">
            <div className="tt-ad__title">Sponsored</div>
            <div className="tt-ad__badge">Ad</div>
          </div>
          <div className="tt-ad__content">
            <div className="tt-banner">
              <img src="/ads/ad-right.jpg" alt="Neon tech ad" />
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
