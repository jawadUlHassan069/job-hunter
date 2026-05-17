import React from 'react';

const AtlasCV = ({ d = {} }) => {
  return (
    <div id="cv-shell" style={{ background: "#fff", minHeight: "1100px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#14532d", color: "#fff", padding: "40px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", fontWeight: "700" }}>{d.name}</div>
            <div style={{ fontSize: "14px", marginTop: "6px", opacity: "0.9" }}>{d.title}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "13px", lineHeight: "1.6" }}>
            {d.email}<br />{d.phone}<br />{d.location}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", padding: "40px 48px", gap: "48px" }}>
        <div>
          {d.summary && <p style={{ fontSize: "13px", lineHeight: "1.8", color: "#166534", marginBottom: "32px" }}>{d.summary}</p>}

          {d.experience?.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#14532d", fontWeight: "700", marginBottom: "12px" }}>EXPERIENCE</div>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: "600" }}>{e.title}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{e.period}</div>
                  </div>
                  <div style={{ color: "#166534", fontWeight: "500" }}>{e.company}</div>
                  {e.achievements?.map((a, j) => <div key={j} style={{ fontSize: "12.5px", marginTop: "4px" }}>• {a}</div>)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {d.skills?.technical && (
            <div style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#14532d", fontWeight: "700", marginBottom: "10px" }}>SKILLS</div>
              {d.skills.technical.map((s, i) => (
                <div key={i} style={{ fontSize: "12.5px", marginBottom: "6px" }}>{s}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AtlasCV;