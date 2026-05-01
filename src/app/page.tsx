"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { SAMPLE_DATA } from "@/lib/sample-data";

const BackgroundParticles = dynamic(() => import("@/components/ui/BackgroundParticles"), { ssr: false });
const NavDots = dynamic(() => import("@/components/ui/NavDots"), { ssr: false });
const IntroCard = dynamic(() => import("@/components/cards/IntroCard"), { ssr: false });
const RhythmCard = dynamic(() => import("@/components/cards/RhythmCard"), { ssr: false });
const AlgorithmCard = dynamic(() => import("@/components/cards/AlgorithmCard"), { ssr: false });
const DataTypeCard = dynamic(() => import("@/components/cards/DataTypeCard"), { ssr: false });
const PortraitCard = dynamic(() => import("@/components/cards/PortraitCard"), { ssr: false });
const DataValueCard = dynamic(() => import("@/components/cards/DataValueCard"), { ssr: false });

export default function Home() {
  const data = SAMPLE_DATA;

  return (
    <>
      <BackgroundParticles />

      {/* Hero LP Section */}
      <section className="card" id="hero">
        <div className="scanline" />
        <div className="card-inner" style={{
          zIndex: 2,
          position: "relative",
          background: "rgba(3, 7, 17, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 24,
          padding: "48px 28px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: 8,
            color: "var(--cyan)",
            opacity: 0.6,
            marginBottom: 24,
          }}>
            DATA MIRROR
          </div>

          <div style={{
            fontSize: 13,
            color: "var(--text2)",
            marginBottom: 12,
            lineHeight: 1.6,
          }}>
            あなたのデータ、年間
          </div>

          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 64,
            fontWeight: 700,
            background: "linear-gradient(135deg, var(--coral), var(--amber))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1,
            marginBottom: 4,
          }}>
            ¥{data.dataValue.totalAnnual.toLocaleString()}
          </div>

          <div style={{
            fontSize: 14,
            color: "var(--text2)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}>
            の価値がある。<br />
            <span style={{ color: "var(--text3)", fontSize: 12 }}>
              あなたには0%が還元されている。
            </span>
          </div>

          <Link
            href="/analyze"
            style={{
              display: "inline-block",
              padding: "14px 36px",
              background: "linear-gradient(135deg, var(--cyan), var(--magenta))",
              borderRadius: 50,
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 0 30px rgba(0,229,255,0.3), 0 0 60px rgba(255,0,170,0.15)",
              transition: "transform 0.2s, box-shadow 0.2s",
              marginBottom: 16,
            }}
          >
            無料で診断する
          </Link>

          <div>
            <button
              onClick={() => document.getElementById("demo-start")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                background: "none",
                border: "none",
                color: "var(--text3)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 1,
                padding: "8px 16px",
              }}
            >
              ↓ デモを見る
            </button>
          </div>

          <div style={{
            marginTop: 24,
            fontSize: 10,
            color: "var(--text3)",
            lineHeight: 1.6,
          }}>
            データはブラウザ上で処理されます。<br />
            サーバーに送信されることはありません。
          </div>
        </div>
      </section>

      {/* Demo cards (scrollable sample data) */}
      <div id="demo-start" />
      <NavDots />
      <IntroCard totalDataPoints={data.totalDataPoints} sourceCount={data.sources.length} />
      <RhythmCard heatmap={data.heatmap} peakHour={data.peakHour} nocturnalIndex={data.nocturnalIndex} />
      <AlgorithmCard algorithmRate={data.algorithmRate} youtube={data.youtube} subscriptions={data.subscriptions} />
      <DataTypeCard code={data.dataType.code} name={data.dataType.name} axes={data.dataType.axes} />
      <PortraitCard categories={data.categories} heatmap={data.heatmap} totalDataPoints={data.totalDataPoints} />
      <DataValueCard companies={data.dataValue.companies} totalAnnual={data.dataValue.totalAnnual} humadReturn={data.dataValue.humadReturn} />
    </>
  );
}
