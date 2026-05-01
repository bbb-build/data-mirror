"use client";

import { useEffect, useRef } from "react";

interface RhythmCardProps {
  heatmap: number[][];
  peakHour: number;
  nocturnalIndex: number;
}

export default function RhythmCard({ heatmap, peakHour, nocturnalIndex }: RhythmCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 640, H = 640;
    const cx = W / 2, cy = H / 2;
    const innerR = 95, outerR = 275;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let maxVal = 0;
    heatmap.forEach(row => row.forEach(v => { if (v > maxVal) maxVal = v; }));

    // Background glow
    const bgGrad = ctx.createRadialGradient(cx, cy, innerR - 20, cx, cy, outerR + 40);
    bgGrad.addColorStop(0, "rgba(0,229,255,0.03)");
    bgGrad.addColorStop(0.5, "rgba(0,229,255,0.01)");
    bgGrad.addColorStop(1, "transparent");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Draw heatmap segments
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const val = heatmap[d][h];
        const intensity = val / maxVal;
        const startAngle = (h / 24) * Math.PI * 2 - Math.PI / 2;
        const endAngle = ((h + 1) / 24) * Math.PI * 2 - Math.PI / 2;
        const r1 = innerR + (d / 7) * (outerR - innerR);
        const r2 = innerR + ((d + 1) / 7) * (outerR - innerR);

        ctx.beginPath();
        ctx.arc(cx, cy, r2, startAngle, endAngle);
        ctx.arc(cx, cy, r1, endAngle, startAngle, true);
        ctx.closePath();

        let r: number, g: number, b: number;
        if (intensity < 0.5) {
          const t = intensity / 0.5;
          r = Math.round(13 + t * (0 - 13));
          g = Math.round(27 + t * (229 - 27));
          b = Math.round(62 + t * (255 - 62));
        } else {
          const t = (intensity - 0.5) / 0.5;
          r = Math.round(0 + t * 255);
          g = Math.round(229 + t * (255 - 229));
          b = 255;
        }
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.85})`;
        ctx.fill();

        if (intensity > 0.6) {
          ctx.save();
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }

        ctx.strokeStyle = "rgba(3,7,17,0.6)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    // Hour labels
    ctx.fillStyle = "#a0aac4";
    ctx.font = '500 11px "JetBrains Mono"';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let h = 0; h < 24; h += 3) {
      const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
      const lR = outerR + 24;
      ctx.fillText(h + ":00", cx + Math.cos(angle) * lR, cy + Math.sin(angle) * lR);
    }

    // Day labels
    ctx.font = '500 10px "JetBrains Mono"';
    ctx.fillStyle = "#4a5578";
    for (let d = 0; d < 7; d++) {
      const r = innerR + ((d + 0.5) / 7) * (outerR - innerR);
      const angle = -Math.PI / 2 - 0.22;
      ctx.fillText(dayNames[d], cx + Math.cos(angle) * r - 22, cy + Math.sin(angle) * r);
    }

    // Inner/outer rings
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,229,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,229,255,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [heatmap]);

  return (
    <section className="card" id="card1">
      <div className="grid-overlay" />
      <div className="card-inner">
        <div className="seq-label">SEQUENCE 01</div>
        <div className="seq-id">生活リズム</div>
        <div className="card-title">生活リズムDNA</div>
        <div className="card-sub">曜日 x 時間帯のアクティビティマップ</div>
        <div style={{ position: "relative", width: 320, height: 320, margin: "0 auto 20px" }}>
          <canvas ref={canvasRef} width={640} height={640} style={{ width: "100%", height: "100%" }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 38, fontWeight: 700,
              color: "var(--cyan)",
              textShadow: "var(--glow-c)",
            }}>
              {peakHour}:00
            </div>
            <div style={{ fontSize: 10, color: "var(--text2)", letterSpacing: 2, marginTop: 2 }}>
              ピーク時間
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          <div style={{
            background: "rgba(0,229,255,0.05)",
            border: "1px solid rgba(0,229,255,0.12)",
            borderLeft: "3px solid var(--cyan)",
            borderRadius: 10,
            padding: "12px 16px",
            textAlign: "left",
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.5,
          }}>
            <strong style={{ color: "var(--cyan)" }}>夜行性指数: {nocturnalIndex}%</strong> — 深夜0-6時の活動量が全体の{nocturnalIndex}%。標準ユーザーの3倍
          </div>
          <div style={{
            background: "rgba(0,229,255,0.05)",
            border: "1px solid rgba(0,229,255,0.12)",
            borderLeft: "3px solid var(--cyan)",
            borderRadius: 10,
            padding: "12px 16px",
            textAlign: "left",
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.5,
          }}>
            <strong style={{ color: "var(--cyan)" }}>午前の谷</strong> — 8-11時が最も静か。午後から加速して{peakHour}時にピーク
          </div>
        </div>
      </div>
    </section>
  );
}
