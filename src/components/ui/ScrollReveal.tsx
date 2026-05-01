"use client";

import { useEffect } from "react";

// カードの出現時にフェードインアニメーションを付与するグローバルオブザーバー
export default function ScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    // 全 .card 要素を監視
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => observer.observe(card));

    // 初期表示のカード（最初のカード）は即座に表示
    if (cards.length > 0) {
      cards[0].classList.add("visible");
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
