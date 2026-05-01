"use client";

import { useState, useCallback, useRef } from "react";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  progress?: { stage: string; percent: number };
}

export default function FileUpload({ onFileSelected, isProcessing, progress }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".zip")) {
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  }, [onFileSelected]);

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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        padding: "60px 28px",
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
        accept=".zip"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F4E6;</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text)",
        marginBottom: 8,
      }}>
        Google TakeoutのZIPをドロップ
      </div>
      <div style={{
        fontSize: 12,
        color: "var(--text3)",
        lineHeight: 1.6,
      }}>
        またはクリックしてファイルを選択<br />
        <span style={{ fontSize: 10 }}>データはブラウザ上で処理され、サーバーには送信されません</span>
      </div>
    </div>
  );
}
