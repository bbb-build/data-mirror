"use client";

import { useState, useCallback } from "react";
import html2canvas from "html2canvas-pro";

interface ShareButtonProps {
  cardId: string;
  label?: string;
}

export default function ShareButton({ cardId, label = "DATA MIRROR" }: ShareButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const captureCard = useCallback(async (): Promise<Blob | null> => {
    const card = document.getElementById(cardId);
    if (!card) return null;

    try {
      const canvas = await html2canvas(card, {
        backgroundColor: "#030711",
        scale: 2,
        useCORS: true,
        logging: false,
        // WebGLキャンバスのキャプチャ対応
        onclone: (doc) => {
          // クローン内のcanvasにオリジナルの描画内容をコピー
          const origCanvases = card.querySelectorAll("canvas");
          const cloneCanvases = doc.getElementById(cardId)?.querySelectorAll("canvas");
          if (cloneCanvases) {
            origCanvases.forEach((orig, i) => {
              if (cloneCanvases[i]) {
                const cloneCtx = cloneCanvases[i].getContext("2d");
                if (cloneCtx) {
                  cloneCanvases[i].width = orig.width;
                  cloneCanvases[i].height = orig.height;
                  cloneCtx.drawImage(orig, 0, 0);
                }
              }
            });
          }
        },
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });
    } catch {
      return null;
    }
  }, [cardId]);

  const handleDownload = useCallback(async () => {
    setIsCapturing(true);
    setShowMenu(false);
    try {
      const blob = await captureCard();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-mirror-${cardId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsCapturing(false);
    }
  }, [captureCard, cardId]);

  const handleShare = useCallback(async () => {
    setIsCapturing(true);
    setShowMenu(false);
    try {
      const blob = await captureCard();
      if (!blob) return;

      // Web Share API（モバイル）
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `data-mirror-${cardId}.png`, { type: "image/png" });
        const shareData = { files: [file], title: label, text: "Data Mirror — 知らなかった自分を発見" };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // フォールバック: ダウンロード
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-mirror-${cardId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsCapturing(false);
    }
  }, [captureCard, cardId, label]);

  const handleTwitter = useCallback(async () => {
    setIsCapturing(true);
    setShowMenu(false);
    try {
      // まず画像をダウンロード
      const blob = await captureCard();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `data-mirror-${cardId}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsCapturing(false);
    }
    // Twitterを開く（画像は手動で添付）
    const text = encodeURIComponent(`Data Mirror — 知らなかった自分を発見\n\n${window.location.origin}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  }, [captureCard, cardId]);

  return (
    <div className="share-container">
      <button
        className="share-btn"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isCapturing}
        aria-label="Share this card"
      >
        {isCapturing ? (
          <span className="share-spinner" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
      </button>

      {showMenu && (
        <div className="share-menu">
          <button className="share-menu-item" onClick={handleShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            シェア
          </button>
          <button className="share-menu-item" onClick={handleDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            PNG保存
          </button>
          <button className="share-menu-item" onClick={handleTwitter}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Xでポスト
          </button>
        </div>
      )}
    </div>
  );
}
