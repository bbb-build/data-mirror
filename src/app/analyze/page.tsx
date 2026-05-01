"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ParsedUserData } from "@/lib/types";
import { parseTakeoutZip, ParseProgress } from "@/lib/parsers/takeout-parser";

const FileUpload = dynamic(() => import("@/components/ui/FileUpload"), { ssr: false });
const BackgroundParticles = dynamic(() => import("@/components/ui/BackgroundParticles"), { ssr: false });
const NavDots = dynamic(() => import("@/components/ui/NavDots"), { ssr: false });
const IntroCard = dynamic(() => import("@/components/cards/IntroCard"), { ssr: false });
const RhythmCard = dynamic(() => import("@/components/cards/RhythmCard"), { ssr: false });
const AlgorithmCard = dynamic(() => import("@/components/cards/AlgorithmCard"), { ssr: false });
const DataTypeCard = dynamic(() => import("@/components/cards/DataTypeCard"), { ssr: false });
const PortraitCard = dynamic(() => import("@/components/cards/PortraitCard"), { ssr: false });
const DataValueCard = dynamic(() => import("@/components/cards/DataValueCard"), { ssr: false });

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
        <section className="card">
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
            <div style={{
              fontSize: 11,
              color: "var(--text3)",
              lineHeight: 1.6,
              maxWidth: 360,
              textAlign: "center",
            }}>
              <a
                href="https://takeout.google.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--cyan)", textDecoration: "none" }}
              >
                Google Takeout
              </a>
              からデータをエクスポートしてください。
              YouTube履歴とChrome履歴を含めると最も精度の高い分析が得られます。
            </div>
          </div>
        </section>
      </>
    );
  }

  // Show results
  return (
    <>
      <BackgroundParticles />
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
