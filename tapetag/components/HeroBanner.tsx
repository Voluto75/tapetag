"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  text: string;
  children?: ReactNode;
};

export default function HeroBanner({ text, children }: Props) {
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
        height: "12.5vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(to bottom, rgba(3,10,6,0.9), rgba(0,0,0,1)), repeating-linear-gradient(90deg, rgba(40,255,140,0.18) 0 6px, rgba(0,0,0,0) 6px 12px), repeating-linear-gradient(180deg, rgba(40,255,140,0.14) 0 6px, rgba(0,0,0,0) 6px 12px)",
      }}
    >
      <div style={styles}>
        {text ? <h2 className="tt-hero__text">{text}</h2> : null}
      </div>
      {children ? <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{children}</div> : null}
    </section>
  );
}
