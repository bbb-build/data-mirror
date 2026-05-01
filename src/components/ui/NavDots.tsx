"use client";

import { useEffect, useRef, useState } from "react";

const ACCENT_COLORS = ["#00e5ff", "#00e5ff", "#ffab00", "#00e5ff", "#ff00aa", "#39ff14"];

export default function NavDots() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = document.querySelectorAll(".card");
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(cards).indexOf(entry.target as Element);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.5 }
    );

    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  const handleClick = (index: number) => {
    const cards = document.querySelectorAll(".card");
    cards[index]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="nav-dots">
      {ACCENT_COLORS.map((color, i) => (
        <button
          key={i}
          className={`nav-dot${i === activeIndex ? " active" : ""}`}
          onClick={() => handleClick(i)}
          style={
            i === activeIndex
              ? { background: color, boxShadow: `0 0 12px ${color}` }
              : {}
          }
        />
      ))}
    </div>
  );
}
