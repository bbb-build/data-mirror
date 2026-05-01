"use client";

import { useState, useCallback, useRef } from "react";

interface FileUploadProps {
  onFilesReady: (files: File[]) => void;
  isProcessing: boolean;
  progress?: { stage: string; percent: number };
}

const SOURCE_PATTERNS: [RegExp, string][] = [
  [/watch-history\.(html|json)|再生履歴\.(html|json)/i, "YouTube視聴"],
  [/search-history\.(html|json)|検索履歴\.(html|json)/i, "YouTube検索"],
  [/browserhistory\.json|ブラウザ(の)?履歴\.json/i, "Chrome"],
  [/myactivity\.json|マイアクティビティ\.json/i, "Google検索"],
  [/^\d{4}-\d{2}-\d{2}\.csv$/i, "フィットネス"],
  [/records\.json/i, "位置情報"],
];

const PAY_PATTERN = /取引|transaction/i;

function detectSource(filename: string): string | null {
  const name = filename.split("/").pop() || filename;
  for (const [pattern, source] of SOURCE_PATTERNS) {
    if (pattern.test(name)) return source;
  }
  if (name.toLowerCase().endsWith(".csv") && PAY_PATTERN.test(name)) return "Google Pay";
  if (name.toLowerCase().endsWith(".zip")) return "ZIP";
  return null;
}

const ACCEPTED_EXTS = [".zip", ".html", ".json", ".csv"];

export default function FileUpload({ onFilesReady, isProcessing, progress }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList).filter(f =>
      ACCEPTED_EXTS.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (arr.length === 0) return;

    // ZIP → 即座に処理開始
    const zip = arr.find(f => f.name.toLowerCase().endsWith(".zip"));
    if (zip) {
      onFilesReady([zip]);
      return;
    }

    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const unique = arr.filter(f => !existing.has(f.name));
      return [...prev, ...unique];
    });
  }, [onFilesReady]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  }, [addFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // --- 処理中 ---
  if (isProcessing && progress) {
    return (
      <div style={{
        padding: "40px 28px",
        background: "var(--glass)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        textAlign: "center",
        maxWidth: 420,
        width: "100%",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: "var(--cyan)",
          marginBottom: 20,
          letterSpacing: 2,
        }}>
          {progress.stage}
        </div>
        <div style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 2,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${progress.percent}%`,
            background: "linear-gradient(90deg, var(--cyan), var(--magenta))",
            borderRadius: 2,
            transition: "width 0.3s ease",
          }} />
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--text3)",
          marginTop: 12,
          letterSpacing: 1,
        }}>
          {progress.percent}%
        </div>
      </div>
    );
  }

  // --- ファイルキュー表示 ---
  if (files.length > 0) {
    return (
      <div style={{
        padding: "24px",
        background: "var(--glass)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(0,229,255,0.15)",
        borderRadius: 20,
        maxWidth: 420,
        width: "100%",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: 2,
          color: "var(--cyan)",
          marginBottom: 16,
          opacity: 0.8,
        }}>
          {files.length} FILE{files.length > 1 ? "S" : ""} SELECTED
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {files.map((f, i) => {
            const source = detectSource(f.name);
            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                fontSize: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                  <span style={{ color: source ? "var(--green)" : "var(--text3)", fontSize: 10, flexShrink: 0 }}>
                    {source ? "\u2713" : "?"}
                  </span>
                  <span style={{
                    color: "var(--text2)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 11,
                  }}>
                    {f.name}
                  </span>
                  {source && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: "var(--cyan)",
                      background: "rgba(0,229,255,0.08)",
                      padding: "2px 6px",
                      borderRadius: 4,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}>
                      {source}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text3)",
                    cursor: "pointer",
                    padding: "2px 6px",
                    fontSize: 14,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  \u00d7
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              flex: 1,
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "10px",
              color: "var(--text3)",
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            + \u8ffd\u52a0
          </button>
          <button
            onClick={() => onFilesReady(files)}
            style={{
              flex: 2,
              background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(255,0,170,0.1))",
              border: "1px solid rgba(0,229,255,0.3)",
              borderRadius: 10,
              padding: "10px",
              color: "var(--cyan)",
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: 1,
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,229,255,0.6)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0,229,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            \u89e3\u6790\u3059\u308b \u2192
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".html,.json,.csv"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  // --- ドロップゾーン（初期状態） ---
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        padding: "48px 28px",
        background: isDragging ? "rgba(0,229,255,0.08)" : "var(--glass)",
        backdropFilter: "blur(20px)",
        border: `2px dashed ${isDragging ? "var(--cyan)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 20,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.3s ease",
        maxWidth: 420,
        width: "100%",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.html,.json,.csv"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.9 }}>{"\uD83D\uDCC2"}</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text)",
        marginBottom: 8,
      }}>
        {"\u30C7\u30FC\u30BF\u30D5\u30A1\u30A4\u30EB\u3092\u30C9\u30ED\u30C3\u30D7"}
      </div>
      <div style={{
        fontSize: 12,
        color: "var(--text3)",
        lineHeight: 1.8,
      }}>
        {"\u307E\u305F\u306F\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u30D5\u30A1\u30A4\u30EB\u3092\u9078\u629E"}<br />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: 1,
          color: "var(--text3)",
        }}>
          ZIP / HTML / JSON / CSV
        </span>
      </div>
      <div style={{
        marginTop: 16,
        fontSize: 10,
        color: "var(--text3)",
        opacity: 0.5,
      }}>
        {"\u30C7\u30FC\u30BF\u306F\u30D6\u30E9\u30A6\u30B6\u4E0A\u3067\u51E6\u7406\u3055\u308C\u3001\u30B5\u30FC\u30D0\u30FC\u306B\u306F\u9001\u4FE1\u3055\u308C\u307E\u305B\u3093"}
      </div>
    </div>
  );
}
