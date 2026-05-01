"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ParsedUserData } from "@/lib/types";
import { parseTakeoutZip, ParseProgress } from "@/lib/parsers/takeout-parser";
import { SAMPLE_DATA } from "@/lib/sample-data";

const ScrollReveal = dynamic(() => import("@/components/ui/ScrollReveal"), { ssr: false });
const FileUpload = dynamic(() => import("@/components/ui/FileUpload"), { ssr: false });
const BackgroundParticles = dynamic(() => import("@/components/ui/BackgroundParticles"), { ssr: false });
const NavDots = dynamic(() => import("@/components/ui/NavDots"), { ssr: false });
const IntroCard = dynamic(() => import("@/components/cards/IntroCard"), { ssr: false });
const RhythmCard = dynamic(() => import("@/components/cards/RhythmCard"), { ssr: false });
const AlgorithmCard = dynamic(() => import("@/components/cards/AlgorithmCard"), { ssr: false });
const DataTypeCard = dynamic(() => import("@/components/cards/DataTypeCard"), { ssr: false });
const PortraitCard = dynamic(() => import("@/components/cards/PortraitCard"), { ssr: false });
const DataValueCard = dynamic(() => import("@/components/cards/DataValueCard"), { ssr: false });

function TakeoutGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    { label: "1", text: "takeout.google.com を開く", sub: "Googleアカウントでログイン" },
    { label: "2", text: "「選択をすべて解除」をクリック", sub: "一度全てのチェックを外す" },
    { label: "3", text: "以下を選択してチェック", sub: null, items: [
      { name: "YouTube と YouTube Music", note: "必須 — 視聴・検索履歴" },
      { name: "Chrome", note: "推奨 — ブラウザ閲覧履歴" },
      { name: "マイ アクティビティ", note: "推奨 — Google検索履歴" },
      { name: "Fit", note: "任意 — フィットネスデータ" },
      { name: "Google Pay", note: "任意 — 決済履歴" },
      { name: "ロケーション履歴", note: "任意 — 位置情報" },
    ]},
    { label: "4", text: "「次のステップ」→「エクスポートを作成」", sub: "ZIPファイルの準備が始まる" },
    { label: "5", text: "メールでダウンロードリンクが届く", sub: "データ量により数分〜数時間" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          background: "rgba(0,229,255,0.04)",
          border: "1px solid rgba(0,229,255,0.15)",
          borderRadius: 12,
          padding: "12px 16px",
          color: "var(--cyan)",
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.3s",
        }}
      >
        <span>データの取得方法</span>
        <span style={{
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.3s",
          fontSize: 10,
        }}>&#x25BC;</span>
      </button>
      {isOpen && (
        <div style={{
          marginTop: 8,
          padding: "16px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--cyan)",
                background: "rgba(0,229,255,0.1)",
                borderRadius: 6,
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}>
                {step.label}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12,
                  color: "var(--text)",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}>
                  {step.text}
                </div>
                {step.sub && (
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                    {step.sub}
                  </div>
                )}
                {step.items && (
                  <div style={{
                    marginTop: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}>
                    {step.items.map((item, j) => (
                      <div key={j} style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        fontSize: 11,
                      }}>
                        <span style={{ color: "var(--green)", fontSize: 10 }}>&#x2713;</span>
                        <span style={{ color: "var(--text2)" }}>{item.name}</span>
                        <span style={{ color: "var(--text3)", fontSize: 9 }}>— {item.note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  const [data, setData] = useState<ParsedUserData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress>({ stage: "", percent: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await parseTakeoutZip(file, (p) => setProgress(p));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // Show upload screen if no data yet
  if (!data) {
    return (
      <>
        <BackgroundParticles />
        <section className="card-static">
          <div className="scanline" />
          <div className="card-inner" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: 12,
              color: "var(--cyan)",
              opacity: 0.7,
            }}>
              DATA MIRROR
            </div>
            <div className="card-title" style={{ fontSize: 28 }}>
              あなたのデジタルDNAを解析
            </div>
            <div className="card-sub" style={{ marginBottom: 8 }}>
              Google Takeoutのデータをアップロードして<br />
              知らなかった自分を発見しよう
            </div>
            <FileUpload
              onFileSelected={handleFileSelected}
              isProcessing={isProcessing}
              progress={progress}
            />
            {error && (
              <div style={{
                padding: "12px 20px",
                background: "rgba(255,107,107,0.1)",
                border: "1px solid rgba(255,107,107,0.3)",
                borderRadius: 10,
                color: "var(--coral)",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {error}
              </div>
            )}
            <TakeoutGuide />
            <button
              onClick={() => setData(SAMPLE_DATA)}
              style={{
                background: "none",
                border: "1px solid rgba(0,229,255,0.2)",
                borderRadius: 20,
                padding: "8px 20px",
                color: "var(--text3)",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer",
                transition: "all 0.3s",
                letterSpacing: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,229,255,0.5)";
                e.currentTarget.style.color = "var(--cyan)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)";
                e.currentTarget.style.color = "var(--text3)";
              }}
            >
              デモで試す &#x2192;
            </button>
          </div>
        </section>
      </>
    );
  }

  // YouTubeデータが存在するか（AlgorithmCardの表示判定）
  const hasYouTube = data.youtube.totalViews > 0;
  // ヒートマップに活動データがあるか
  const hasActivity = data.heatmap.some(row => row.some(v => v > 0));

  // Show results
  return (
    <>
      <ScrollReveal />
      <BackgroundParticles />
      <NavDots />
      <IntroCard totalDataPoints={data.totalDataPoints} sourceCount={data.sources.length} sources={data.sources} />
      {hasActivity && (
        <RhythmCard heatmap={data.heatmap} peakHour={data.peakHour} nocturnalIndex={data.nocturnalIndex} />
      )}
      {hasYouTube && (
        <AlgorithmCard algorithmRate={data.algorithmRate} youtube={data.youtube} subscriptions={data.subscriptions} />
      )}
      <DataTypeCard code={data.dataType.code} name={data.dataType.name} axes={data.dataType.axes} />
      <PortraitCard categories={data.categories} heatmap={data.heatmap} totalDataPoints={data.totalDataPoints} />
      <DataValueCard companies={data.dataValue.companies} totalAnnual={data.dataValue.totalAnnual} humadReturn={data.dataValue.humadReturn} />
    </>
  );
}
