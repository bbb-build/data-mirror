"use client";

import ShareButton from "@/components/ui/ShareButton";

interface Company {
  name: string;
  logo: string;
  logoColor: string;
  description: string;
  annualValue: number;
}

interface DataValueCardProps {
  companies: Company[];
  totalAnnual: number;
  humadReturn: number;
}

export default function DataValueCard({ companies, totalAnnual, humadReturn }: DataValueCardProps) {
  return (
    <section className="card" id="card5">
      <div className="grid-overlay" />
      <div className="card-inner">
        <div className="seq-label">SEQUENCE 05</div>
        <div className="seq-id">データの価値</div>
        <div className="card-title">データの価値</div>
        <div className="card-sub">あなたのデータの推定年間価値</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", marginBottom: 20 }}>
          {companies.map((company, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              transition: "all .3s",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 18, color: "#fff",
                background: company.logoColor,
              }}>
                {company.logo}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{company.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{company.description}</div>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18, fontWeight: 700, flexShrink: 0,
                color: "var(--coral)",
              }}>
                ¥{company.annualValue.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, color: "var(--text2)", marginBottom: 4,
        }}>
          合計: <span style={{ color: "var(--coral)", fontWeight: 700, fontSize: 18 }}>¥{totalAnnual.toLocaleString()}</span>
          <span style={{ fontSize: 10 }}>/年</span>
        </div>
        <div style={{
          width: "100%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)",
          margin: "16px 0",
        }} />
        <div style={{
          background: "rgba(0,229,255,0.06)",
          border: "1px solid rgba(0,229,255,0.2)",
          borderRadius: 14, padding: 20, marginBottom: 16,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: 3,
            color: "var(--text3)", marginBottom: 8,
          }}>
            WITH HUMAD
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 32, fontWeight: 700,
            color: "var(--green)",
            textShadow: "0 0 30px rgba(57,255,20,0.3)",
          }}>
            ¥{humadReturn.toLocaleString()}<span style={{ fontSize: 14, color: "var(--text2)" }}>/年</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>70%があなたに還元</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cyan)", marginTop: 10 }}>
            あなたのデータ。あなたの利益。
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5, marginTop: 8 }}>
          現在、100%が企業へ。あなたには0%。
        </div>
      </div>
      <ShareButton cardId="card5" label="データの価値" />
    </section>
  );
}
