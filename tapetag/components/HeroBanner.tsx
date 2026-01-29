"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  text: string;
};

export default function HeroBanner({ text }: Props) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const styles = useMemo(() => {
    const t = Math.min(1, scrollY / 240);

    return {
      opacity: 1 - t * 0.85,
      transform: `translateY(${t * 36}px) scale(${1 - t * 0.03})`,
      filter: `blur(${t * 4}px)`,
    };
  }, [scrollY]);

  return (
    <section
      style={{
        height: "50vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(to bottom, rgba(255,183,213,0.25), rgba(0,0,0,1))",
      }}
    >
      <div style={styles}>
        <h2 className="tt-hero__text">{text}</h2>
      </div>
    </section>
  );
}

