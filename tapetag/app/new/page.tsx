import Recorder from "@/components/Recorder";

export default function NewPostPage() {
  return (
    <main className="tt-layout">
      {/* LEFT AD */}
      <aside className="tt-ad tt-ad--left">
        <div className="tt-ad__inner">
          AD SPACE
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
          <span className="tt-appname">TapeTag</span>

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

        <Recorder />
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
