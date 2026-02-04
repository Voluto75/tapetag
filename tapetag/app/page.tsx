
import FeedClient from "@/components/FeedClient";
import HeroBanner from "@/components/HeroBanner";
import TrendingTags from "@/components/TrendingTags";

export default async function Home() {

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
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 12,
  }}
>
  <span className="tt-appname" style={{ justifySelf: "start" }}>
    TapeTag
    <span style={{ marginLeft: 8, fontSize: "0.25em", opacity: 0.75 }}>raw</span>
  </span>

  <span />
  <span />
</header>
        {/* HERO */}
        <HeroBanner text="">
          <div style={{ display: "grid", gap: 20, justifyItems: "center" }}>
            <span
              style={{
                fontSize: "clamp(10px, 3.2vw, 22px)",
                lineHeight: 1,
                margin: 0,
                fontFamily: "\"Tahoma\", \"MS Sans Serif\", \"Verdana\", system-ui, Arial",
                color: "#9ad8ff",
                textShadow:
                  "0 0 8px rgba(100,190,255,0.9), 0 0 18px rgba(90,170,255,0.8), 0 0 30px rgba(50,130,255,0.75)",
                letterSpacing: "0.03em",
              }}
            >
              Drop opinion, gossip, thought...whatever
            </span>
            <a className="tt-newbtn--hero" href="/new">+ NEW TAPE</a>
          </div>
        </HeroBanner>

        <TrendingTags />

<FeedClient />

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
