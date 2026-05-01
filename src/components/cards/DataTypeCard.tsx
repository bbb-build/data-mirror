"use client";

interface DataTypeAxis {
  label: [string, string];
  value: number;
  color: string;
  description: string;
}

interface DataTypeCardProps {
  code: string;
  name: string;
  axes: DataTypeAxis[];
}

export default function DataTypeCard({ code, name, axes }: DataTypeCardProps) {
  return (
    <section className="card" id="card3">
      <div className="grid-overlay" />
      <div className="card-inner">
        <div className="seq-label">SEQUENCE 03</div>
        <div className="seq-id">データ型</div>
        <div className="card-title">データ型</div>
        <div className="card-sub">
          デジタル行動から導き出された<br />あなたのデータパーソナリティ
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 56, fontWeight: 700,
          color: "var(--cyan)",
          textShadow: "0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.2)",
          letterSpacing: 8,
          marginBottom: 4, lineHeight: 1,
        }}>
          {code}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, letterSpacing: 6,
          color: "var(--magenta)",
          marginBottom: 28,
          textShadow: "0 0 20px rgba(255,0,170,0.3)",
        }}>
          {name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", marginBottom: 20 }}>
          {axes.map((axis, i) => (
            <div key={i} style={{
              padding: "14px 16px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: 600, letterSpacing: 1,
                  color: "var(--text3)",
                }}>
                  {axis.label[0]}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: 600, letterSpacing: 1,
                  color: axis.color,
                }}>
                  {axis.label[1]}
                </span>
              </div>
              <div style={{
                width: "100%", height: 6,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 3, position: "relative", marginBottom: 6,
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0,
                  height: "100%", width: `${axis.value}%`,
                  background: `linear-gradient(90deg, ${axis.color}10, ${axis.color}4d)`,
                  borderRadius: 3,
                }} />
                <div style={{
                  position: "absolute", top: "50%",
                  left: `${axis.value}%`,
                  transform: "translate(-50%, -50%)",
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid #fff",
                  background: axis.color,
                  boxShadow: `0 0 12px ${axis.color}, 0 0 24px ${axis.color}`,
                }} />
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.4, textAlign: "left" }}>
                {axis.description}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: 2,
          color: "var(--text3)",
          marginTop: 16,
          padding: "8px 16px",
          border: "1px solid rgba(0,229,255,0.15)",
          borderRadius: 8,
          background: "rgba(0,229,255,0.04)",
          display: "inline-block",
        }}>
          私のデータ型: {code} ({name}) #DataMirror
        </div>
      </div>
    </section>
  );
}
