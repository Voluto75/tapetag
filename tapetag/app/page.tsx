
import FeedClient from "@/components/FeedClient";

import LikeButton from "@/components/LikeButton";

import HeroBanner from "@/components/HeroBanner";
import TrendingTags from "@/components/TrendingTags";

export default async function Home() {

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
  <span className="tt-appname">
    TapeTag
    <span style={{ marginLeft: 8, fontSize: "0.25em", opacity: 0.75 }}>raw</span>
  </span>

  <a className="tt-newbtn tt-newbtn--hero" href="/new">+ NEW TAPE</a>
</header>
        {/* HERO */}
        <HeroBanner text="Just say it." />

        <TrendingTags />

<FeedClient />

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
