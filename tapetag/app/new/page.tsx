import Recorder from "@/components/Recorder";

export default function NewPostPage() {
  return (
<main style={{ padding: 24 }}>
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
    </main>
  );
}

