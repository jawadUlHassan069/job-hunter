import React from 'react';

const AireCV = ({ d = {} }) => {
  return (
    <div id="cv-shell" style={{ background: "#fff", minHeight: "1100px", padding: "60px 70px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ borderBottom: "3px solid #991b1b", paddingBottom: "20px", marginBottom: "32px" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "42px", fontWeight: "700", color: "#111" }}>{d.name}</div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>{d.title}</div>
      </div>

      <div style={{ display: "flex", gap: "60px" }}>
        <div style={{ flex: "2.5" }}>
          {d.summary && <p style={{ fontSize: "13.5px", lineHeight: "1.85", color: "#374151", marginBottom: "32px" }}>{d.summary}</p>}

          {d.experience?.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: "#991b1b", fontWeight: "700", marginBottom: "14px" }}>EXPERIENCE</div>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: "600" }}>{e.title}</div>
                    <div style={{ color: "#6b7280", fontSize: "12px" }}>{e.period}</div>
                  </div>
                  <div style={{ color: "#991b1b", fontWeight: "500" }}>{e.company}</div>
                  {e.achievements?.map((a, j) => <div key={j} style={{ marginTop: "6px", fontSize: "12.5px" }}>— {a}</div>)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: "1" }}>
          {d.skills?.technical && (
            <div style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: "#991b1b", fontWeight: "700", marginBottom: "10px" }}>SKILLS</div>
              {d.skills.technical.map((s, i) => <div key={i} style={{ marginBottom: "6px", fontSize: "12.5px" }}>{s}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AireCV;