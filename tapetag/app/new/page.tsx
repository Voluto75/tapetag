import Recorder from "@/components/Recorder";

export const dynamic = "force-dynamic";

export default function NewPostPage({ searchParams }: { searchParams?: { replyTo?: string; tag?: string } }) {
  const replyTo = searchParams?.replyTo;
  const forcedTag = searchParams?.tag;
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "rgba(4,8,14,0.45)",
        backdropFilter: "blur(10px)",
      }}
    >
      <section
        style={{
          width: "min(760px, 96vw)",
          maxHeight: "88vh",
          overflow: "auto",
          borderRadius: 16,
          border: "1px solid rgba(140,190,255,0.5)",
          background: "linear-gradient(180deg, rgba(7,11,18,0.96), rgba(5,8,12,0.94))",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.1) inset, 0 24px 70px rgba(0,0,0,0.6), 0 0 35px rgba(100,170,255,0.35)",
          padding: 20,
          position: "relative",
        }}
      >
        <a
          href="/"
          aria-label="Close"
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            textDecoration: "none",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.1)",
            fontWeight: 700,
          }}
        >
          ×
        </a>

        <h1 style={{ fontSize: 28, marginBottom: 4 }}>New voice post</h1>
        <p
          style={{
            marginBottom: 20,
            fontFamily: "GAU Font Cube, monospace",
            letterSpacing: "0.06em",
            color: "#C6A7FF",
            opacity: 0.9,
          }}
        >
          Keep it anonymous — or don't. Feel free.
        </p>

        <Recorder parentId={replyTo} forcedTag={forcedTag} />
      </section>
    </main>
  );
}
