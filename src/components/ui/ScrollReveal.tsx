"use client";

import { useEffect } from "react";

// カードの出現時にフェードインアニメーションを付与するグローバルオブザーバー
// MutationObserverで動的に追加されるカードも検出する
export default function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    // 新しい .card 要素を初期化して監視する
    function initCards() {
      const cards = document.querySelectorAll(".card:not(.scroll-init)");
      cards.forEach((card) => {
        card.classList.add("scroll-init");
        io.observe(card);
      });
    }

    // 初回実行
    initCards();

    // dynamic importで遅延レンダリングされるカードを捕捉するMutationObserver
    const mo = new MutationObserver(() => initCards());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
