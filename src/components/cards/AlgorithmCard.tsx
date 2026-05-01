"use client";

import { useEffect, useRef } from "react";
import ShareButton from "@/components/ui/ShareButton";

interface AlgorithmCardProps {
  algorithmRate: number;
  youtube: { totalViews: number; searchCount: number; algorithmPercent: number };
  subscriptions: { totalAnnual: number; count: number; services: string[] };
}

export default function AlgorithmCard({ algorithmRate, youtube, subscriptions }: AlgorithmCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 640, H = 480;
    const cx = W / 2, cy = H / 2 + 30;
    const radius = 180;
    const lineWidth = 28;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalAngle = endAngle - startAngle;

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Tick marks
    for (let i = 0; i <= 20; i++) {
      const pct = i / 20;
      const angle = startAngle + pct * totalAngle;
      const tickInner = radius - lineWidth / 2 - 6;
      const tickOuter = radius - lineWidth / 2 - (i % 5 === 0 ? 16 : 10);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * tickInner, cy + Math.sin(angle) * tickInner);
      ctx.lineTo(cx + Math.cos(angle) * tickOuter, cy + Math.sin(angle) * tickOuter);
      ctx.strokeStyle = i % 5 === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)";
      ctx.lineWidth = i % 5 === 0 ? 1.5 : 1;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Percentage labels
    const labels = [
      { pct: 0, text: "0%" },
      { pct: 0.3, text: "30%" },
      { pct: 0.5, text: "50%" },
      { pct: 0.7, text: "70%" },
      { pct: 1.0, text: "100%" },
    ];
    ctx.font = '400 10px "JetBrains Mono"';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#4a5578";
    labels.forEach(l => {
      const angle = startAngle + l.pct * totalAngle;
      const lR = radius + lineWidth / 2 + 18;
      ctx.fillText(l.text, cx + Math.cos(angle) * lR, cy + Math.sin(angle) * lR);
    });

    // Colored arc
    const value = algorithmRate / 100;
    const valueAngle = startAngle + value * totalAngle;
    const segments = 100;
    const segmentAngle = (value * totalAngle) / segments;
    for (let i = 0; i < segments; i++) {
      const segStart = startAngle + (i / segments) * value * totalAngle;
      const segEnd = segStart + segmentAngle + 0.01;
      const pct = i / segments;
      let r: number, g: number, b: number;
      const localPct = pct * value;
      if (localPct < 0.3) {
        const t = localPct / 0.3;
        r = Math.round(57 + t * (255 - 57));
        g = Math.round(255 + t * (171 - 255));
        b = Math.round(20 + t * (0 - 20));
      } else if (localPct < 0.7) {
        const t = (localPct - 0.3) / 0.4;
        r = 255;
        g = Math.round(171 + t * (80 - 171));
        b = Math.round(0 + t * (60 - 0));
      } else {
        const t = (localPct - 0.7) / 0.3;
        r = 255;
        g = Math.round(80 + t * (0 - 80));
        b = Math.round(60 + t * (170 - 60));
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, segStart, segEnd);
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "butt";
      ctx.stroke();
    }

    // Round caps
    ctx.beginPath();
    ctx.arc(cx + Math.cos(startAngle) * radius, cy + Math.sin(startAngle) * radius, lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#39ff14";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + Math.cos(valueAngle) * radius, cy + Math.sin(valueAngle) * radius, lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffab00";
    ctx.fill();

    // Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + Math.cos(valueAngle) * radius, cy + Math.sin(valueAngle) * radius, lineWidth / 2 + 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,171,0,0.2)";
    ctx.fill();
    ctx.restore();

    // Zone labels
    ctx.font = '600 9px "JetBrains Mono"';
    ctx.textAlign = "center";
    const labelR = radius - lineWidth / 2 - 28;
    const autoAngle = startAngle + 0.15 * totalAngle;
    ctx.fillStyle = "rgba(57,255,20,0.5)";
    ctx.fillText("AUTONOMOUS", cx + Math.cos(autoAngle) * labelR, cy + Math.sin(autoAngle) * labelR);
    const mixAngle = startAngle + 0.5 * totalAngle;
    ctx.fillStyle = "rgba(255,171,0,0.5)";
    ctx.fillText("MIXED", cx + Math.cos(mixAngle) * labelR, cy + Math.sin(mixAngle) * labelR);
    const ctrlAngle = startAngle + 0.85 * totalAngle;
    ctx.fillStyle = "rgba(255,0,170,0.4)";
    ctx.fillText("CONTROLLED", cx + Math.cos(ctrlAngle) * labelR, cy + Math.sin(ctrlAngle) * labelR);
  }, [algorithmRate]);

  const selfWillPercent = youtube.totalViews > 0
    ? ((youtube.searchCount / youtube.totalViews) * 100).toFixed(1)
    : "0.0";

  return (
    <section className="card" id="card2">
      <div className="grid-overlay" />
      <div className="card-inner">
        <div className="seq-label">SEQUENCE 02</div>
        <div className="seq-id">アルゴリズム支配率</div>
        <div className="card-title">アルゴリズム支配率</div>
        <div className="card-sub">
          あなたのデジタルライフの何%が<br />アルゴリズムに決められているか？
        </div>
        <div style={{ position: "relative", width: 320, height: 240, margin: "0 auto 16px" }}>
          <canvas ref={canvasRef} width={640} height={480} style={{ width: "100%", height: "100%" }} />
          <div style={{
            position: "absolute", top: "56%", left: "50%",
            transform: "translate(-50%, -50%)", textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 72, fontWeight: 700,
              color: "var(--amber)",
              textShadow: "0 0 40px rgba(255,171,0,0.5), 0 0 80px rgba(255,171,0,0.2)",
              lineHeight: 1,
            }}>
              {algorithmRate}<span style={{ fontSize: 36 }}>%</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 20, lineHeight: 1.5 }}>
          あなたのデジタルライフの{algorithmRate}%は<br />アルゴリズムが決めている
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", marginBottom: 16 }}>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            fontSize: 12, color: "var(--text2)", lineHeight: 1.5,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.3 }}>🎬</span>
            <div>
              YouTube: <strong style={{ color: "var(--amber)" }}>{youtube.algorithmPercent}%</strong>がアルゴリズム選択
              <br />
              <span style={{ fontSize: 10, color: "var(--text3)" }}>
                検索{youtube.searchCount.toLocaleString()}回 / 視聴{youtube.totalViews.toLocaleString()}回 = 自分の意志{selfWillPercent}%
              </span>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            fontSize: 12, color: "var(--text2)", lineHeight: 1.5,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.3 }}>💳</span>
            <div>
              年間<strong style={{ color: "var(--amber)" }}>¥{subscriptions.totalAnnual.toLocaleString()}</strong>が判断なしに自動更新
              <br />
              <span style={{ fontSize: 10, color: "var(--text3)" }}>
                {subscriptions.services.join(", ")}...
              </span>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            fontSize: 12, color: "var(--text2)", lineHeight: 1.5,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.3 }}>🔄</span>
            <div>
              <strong style={{ color: "var(--amber)" }}>{subscriptions.count}サービス</strong>が月額自動課金
              <br />
              <span style={{ fontSize: 10, color: "var(--text3)" }}>毎月の判断機会: 0</span>
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: 2,
          color: "var(--text3)",
          marginTop: 12,
          padding: "8px 16px",
          border: "1px solid rgba(255,171,0,0.15)",
          borderRadius: 8,
          background: "rgba(255,171,0,0.04)",
          display: "inline-block",
        }}>
          私のアルゴリズム支配率: {algorithmRate}% #DataMirror
        </div>
      </div>
      <ShareButton cardId="card2" label="アルゴリズム支配率" />
    </section>
  );
}
