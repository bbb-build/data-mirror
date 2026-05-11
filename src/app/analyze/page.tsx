"use client";

import { useState, useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ParsedUserData } from "@/lib/types";
import { parseFiles, ParseProgress, translateFileReadError } from "@/lib/parsers/takeout-parser";
import { SAMPLE_DATA } from "@/lib/sample-data";
import { saveResult, getLatestResult, StoredResult } from "@/lib/storage";

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
  const [isOpen, setIsOpen] = useState(true);

  type Step = {
    label: string;
    text: ReactNode;
    sub?: ReactNode | null;
    items?: { name: string; note?: string; highlight?: boolean }[];
    excludeItems?: { name: string; note?: string }[];
    youtubeNote?: boolean;
  };

  const includeItems = [
    { name: "マイ アクティビティ", note: "最重要 — 検索・閲覧・アシスタントの全ログ", highlight: true },
    { name: "Chrome", note: "ブラウザ履歴・ブックマーク" },
    { name: "YouTube と YouTube Music", note: "視聴・検索履歴（※下の注意参照）" },
    { name: "マップ" },
    { name: "マップ（マイプレイス）" },
    { name: "タイムライン", note: "位置情報の時系列" },
    { name: "カレンダー" },
    { name: "連絡先" },
    { name: "Keep" },
    { name: "ToDo リスト" },
    { name: "リマインダー" },
    { name: "メッセージ" },
    { name: "Fit", note: "フィットネス" },
    { name: "Google Pay" },
    { name: "Google Play ストア" },
    { name: "Google Play ブックス" },
    { name: "Google Podcasts" },
    { name: "Google ショッピング" },
    { name: "Google ヘルプ コミュニティ" },
    { name: "Google アカウント" },
    { name: "Discover" },
    { name: "NotebookLM" },
    { name: "Saved" },
    { name: "Search Contributions" },
    { name: "Search Notifications" },
    { name: "アラート" },
    { name: "グループ" },
    { name: "ニュース" },
    { name: "プロフィール" },
    { name: "購入と予約" },
  ];

  const excludeItems = [
    { name: "Google フォト", note: "数十GB〜" },
    { name: "ドライブ", note: "数GB〜" },
    { name: "メール (Gmail)", note: "MBOX、数GB〜" },
    { name: "Google Meet", note: "録画含む可能性" },
    { name: "Nest" },
    { name: "フロー", note: "画像・動画" },
    { name: "ストリートビュー", note: "画像・動画" },
    { name: "Google Earth" },
    { name: "Phone Audio", note: "音声" },
    { name: "Pinpoint" },
    { name: "Google Pixel", note: "診断データ" },
    { name: "Fitbit", note: "Fitと重複" },
  ];

  const steps: Step[] = [
    { label: "⚠️", text: "最重要 — 全選択しない", sub: "全選択すると数十GB〜100GB超になり、ブラウザで開けません。下の推奨セットだけを選べば通常 50MB〜200MB に収まります" },
    {
      label: "1",
      text: (
        <>
          <a
            href="https://takeout.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--cyan)", textDecoration: "underline" }}
          >
            takeout.google.com
          </a>
          {" "}を開く
        </>
      ),
      sub: "Googleアカウントでログイン",
    },
    { label: "2", text: "「選択をすべて解除」をクリック", sub: "一度全てのチェックを外す（ここがスタート地点）" },
    { label: "3", text: "✅ 以下にチェックを付ける（推奨セット）", sub: "履歴・テキスト中心。合計でも通常 200MB 以下", items: includeItems },
    { label: "4", text: "❌ 以下は必ず外す（重量級）", sub: "メディア中心で容量が爆発する。解析にもほぼ寄与しない", excludeItems },
    { label: "⚠️", text: "YouTube の選び方（チェックする場合）", sub: "「すべての YouTube データが含まれます」横のボタンから選択画面を開き、history / subscriptions / playlists / comments / likes だけにチェック。videos（自分でアップした動画）と music-uploads は必ず外す", youtubeNote: true },
    { label: "5", text: "「次のステップ」→「エクスポートを作成」", sub: "Googleがデータを1つのZIPにまとめる" },
    { label: "6", text: "Googleからメールが届く", sub: "ZIPのダウンロードリンク付き（数分〜数時間）" },
    { label: "7", text: "ダウンロードしたZIPをこの画面にドロップ", sub: "端末ローカルに保存したものを使用（クラウド上のファイルは参照切れを起こします）" },
    { label: "💡", text: "ZIPが大きすぎる場合", sub: "解凍して個別ファイル（HTML/JSON/CSV）を直接アップロードできます" },
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
        <span>データの取得方法（必ずお読みください）</span>
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
                    marginTop: 8,
                    padding: "10px 12px",
                    background: "rgba(0,255,140,0.04)",
                    border: "1px solid rgba(0,255,140,0.15)",
                    borderRadius: 8,
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
                        padding: item.highlight ? "4px 6px" : "0",
                        background: item.highlight ? "rgba(0,255,140,0.08)" : "transparent",
                        borderRadius: item.highlight ? 4 : 0,
                      }}>
                        <span style={{ color: "var(--green)", fontSize: 10 }}>&#x2713;</span>
                        <span style={{
                          color: item.highlight ? "var(--green)" : "var(--text2)",
                          fontWeight: item.highlight ? 600 : 400,
                        }}>{item.name}</span>
                        {item.note && (
                          <span style={{ color: "var(--text3)", fontSize: 9 }}>— {item.note}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {step.excludeItems && (
                  <div style={{
                    marginTop: 8,
                    padding: "10px 12px",
                    background: "rgba(255,80,80,0.04)",
                    border: "1px solid rgba(255,80,80,0.18)",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}>
                    {step.excludeItems.map((item, j) => (
                      <div key={j} style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        fontSize: 11,
                      }}>
                        <span style={{ color: "#ff6464", fontSize: 10 }}>&#x2715;</span>
                        <span style={{ color: "var(--text2)" }}>{item.name}</span>
                        {item.note && (
                          <span style={{ color: "var(--text3)", fontSize: 9 }}>— {item.note}</span>
                        )}
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

// 前回結果の表示コンポーネント
function PreviousResultBanner({ stored, onLoad, onDismiss }: {
  stored: StoredResult;
  onLoad: () => void;
  onDismiss: () => void;
}) {
  const date = new Date(stored.analyzedAt);
  const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;

  return (
    <div style={{
      width: "100%",
      maxWidth: 420,
      padding: "14px 18px",
      background: "rgba(0,229,255,0.06)",
      border: "1px solid rgba(0,229,255,0.2)",
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{
        fontSize: 12,
        color: "var(--text2)",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        前回の解析結果があります
      </div>
      <div style={{
        fontSize: 11,
        color: "var(--text3)",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {dateStr} — {stored.data.totalDataPoints.toLocaleString()}データポイント — {stored.sourcesSummary}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onLoad}
          style={{
            flex: 1,
            background: "rgba(0,229,255,0.12)",
            border: "1px solid rgba(0,229,255,0.3)",
            borderRadius: 8,
            padding: "8px 0",
            color: "var(--cyan)",
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          前回の結果を見る
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "8px 14px",
            color: "var(--text3)",
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          新規解析
        </button>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const [data, setData] = useState<ParsedUserData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress>({ stage: "", percent: 0 });
  const [error, setError] = useState<string | null>(null);
  const [previousResult, setPreviousResult] = useState<StoredResult | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // 起動時にIndexedDBから前回結果を取得
  useEffect(() => {
    getLatestResult()
      .then(result => { if (result) setPreviousResult(result); })
      .catch(() => { /* IndexedDB未対応環境は無視 */ });
  }, []);

  const handleFilesReady = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await parseFiles(files, (p) => setProgress(p));
      // 解析結果をIndexedDBに保存
      saveResult(result).catch(() => { /* 保存失敗は無視 */ });
      setData(result);
    } catch (err) {
      // ブラウザネイティブのFile APIエラーをユーザー向けに翻訳
      const translated = translateFileReadError(err);
      setError(translated.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 結果画面から戻る
  const handleBack = () => {
    setData(null);
    setDismissed(false);
    // 前回結果を再取得
    getLatestResult()
      .then(result => { if (result) setPreviousResult(result); })
      .catch(() => {});
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
              必要な履歴データだけアップロード<br />
              あるものだけで、あなたを解析します
            </div>
            <div style={{
              width: "100%",
              maxWidth: 420,
              padding: "14px 16px",
              background: "rgba(255,107,107,0.08)",
              border: "1px solid rgba(255,107,107,0.35)",
              borderRadius: 12,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.6,
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--coral)",
                marginBottom: 6,
              }}>
                ⚠️ Takeoutでは「全選択」しないでください
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>
                全選択すると <strong style={{ color: "var(--coral)" }}>数十GB〜100GB超</strong> になり、ブラウザで開けません。
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
                以下は必ず<strong style={{ color: "var(--coral)" }}>チェックを外す</strong>:
                <span style={{ color: "var(--text3)" }}> Google フォト / ドライブ / Gmail</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6 }}>
                履歴系（YouTube・Chrome・マイ アクティビティ等）だけなら通常 200MB 以下です
              </div>
            </div>
            {/* 前回結果がある場合のバナー */}
            {previousResult && !dismissed && (
              <PreviousResultBanner
                stored={previousResult}
                onLoad={() => setData(previousResult.data)}
                onDismiss={() => setDismissed(true)}
              />
            )}
            <FileUpload
              onFilesReady={handleFilesReady}
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
      {/* 戻るボタン */}
      <button
        onClick={handleBack}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 100,
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "8px 14px",
          color: "var(--text2)",
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s",
        }}
      >
        &#x2190; 再解析
      </button>
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
