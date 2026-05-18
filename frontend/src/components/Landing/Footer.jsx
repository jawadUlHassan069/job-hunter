// src/components/landing/Footer.jsx
import { TECH_STACK, ACCENT } from "@/data.js";

const QUICK_LINKS = [
  { label: "Upload CV",          action: "analyze" },
  { label: "Browse Jobs",        href: "#jobs"     },
  { label: "Skill Gap Analysis", href: "#features" },
  { label: "Track Applications", href: "#features" },
  { label: "Documentation",      href: "#"         },
  { label: "GitHub",             href: "#"         },
];

export default function Footer({ onFeatureClick, onAnalyze }) {
  const handleUploadCV = () => {
    onFeatureClick?.("cv-analysis");
    onAnalyze?.();
  };

  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.08)",
      background: "#0a0a0a",
      padding: "80px 24px 40px",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── Top grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "48px",
          marginBottom: "64px",
        }}>

          {/* ── Brand ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
              <span style={{ color: ACCENT, fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>JOB</span>
              <span style={{ color: "#f3f6ff", fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>HUNTER</span>
            </div>

            <p style={{
              color: "rgba(243,246,255,0.38)",
              fontSize: "13px",
              lineHeight: "1.7",
              marginBottom: "20px",
              fontFamily: "monospace",
            }}>
              Smart CV &amp; Job Matching Platform.<br />
              Cloud Computing Project — CSL 220.
            </p>

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              fontFamily: "monospace",
              padding: "6px 14px",
              borderRadius: "999px",
              background: `${ACCENT}18`,
              color: ACCENT,
              border: `1px solid ${ACCENT}35`,
            }}>
              <span style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: ACCENT,
                display: "inline-block",
                animation: "footerPulse 2s ease-in-out infinite",
              }} />
              Live on Azure
            </div>
          </div>

          {/* ── Tech Stack ── */}
          <div>
            <p style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(243,246,255,0.2)",
              fontFamily: "monospace",
              marginBottom: "20px",
            }}>
              Tech Stack
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {TECH_STACK?.map((s) => (
                <div key={s} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  color: "rgba(243,246,255,0.38)",
                }}>
                  <span style={{ color: ACCENT, fontSize: "16px", lineHeight: 1 }}>·</span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <p style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(243,246,255,0.2)",
              fontFamily: "monospace",
              marginBottom: "20px",
            }}>
              Quick Links
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {QUICK_LINKS.map(({ label, action, href }) =>
                action === "analyze" ? (
                  <button
                    key={label}
                    onClick={handleUploadCV}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: 0,
                      fontSize: "13px",
                      fontFamily: "monospace",
                      color: "rgba(243,246,255,0.38)",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f3f6ff"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(243,246,255,0.38)"}
                  >
                    {label} →
                  </button>
                ) : (
                  <a
                    key={label}
                    href={href}
                    style={{
                      fontSize: "13px",
                      fontFamily: "monospace",
                      color: "rgba(243,246,255,0.38)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f3f6ff"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(243,246,255,0.38)"}
                  >
                    {label} →
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "32px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}>
          <p style={{
            fontSize: "12px",
            fontFamily: "monospace",
            color: "rgba(243,246,255,0.2)",
          }}>
            © 2026 Job Hunter · Bahria University Karachi Campus · BSE 6A
          </p>
          <p style={{
            fontSize: "12px",
            fontFamily: "monospace",
            color: "rgba(243,246,255,0.2)",
          }}>
            Powered by Claude API · Azure Cloud
          </p>
        </div>
      </div>

      <style>{`
        @keyframes footerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </footer>
  );
}
