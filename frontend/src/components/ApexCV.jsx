import React from 'react';

const ApexCV = ({ d = {} }) => {
  return (
    <div id="cv-shell" style={{ display: "flex", minHeight: "1100px", background: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "260px", background: "#111827", color: "#f9fafb", padding: "40px 24px", flexShrink: 0 }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", lineHeight: "1.1", fontWeight: "700" }}>
            {d.name || "Your Name"}
          </div>
          <div style={{ fontSize: "13px", opacity: "0.7", marginTop: "4px" }}>
            {d.title || "Software Engineer"}
          </div>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#9ca3af", marginBottom: "8px" }}>CONTACT</div>
          {d.email && <div style={{ fontSize: "12px", marginBottom: "4px" }}>{d.email}</div>}
          {d.phone && <div style={{ fontSize: "12px", marginBottom: "4px" }}>{d.phone}</div>}
          {d.location && <div style={{ fontSize: "12px" }}>{d.location}</div>}
        </div>

        {d.skills?.technical?.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#9ca3af", marginBottom: "8px" }}>TECHNICAL SKILLS</div>
            {d.skills.technical.map((skill, i) => (
              <div key={i} style={{ fontSize: "12px", marginBottom: "3px" }}>• {skill}</div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px 48px" }}>
        {d.summary && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#6b7280", marginBottom: "8px" }}>PROFILE</div>
            <p style={{ fontSize: "13px", lineHeight: "1.8", color: "#374151" }}>{d.summary}</p>
          </div>
        )}

        {d.experience?.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>EXPERIENCE</div>
            {d.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{exp.title}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{exp.period}</div>
                </div>
                <div style={{ color: "#1d9e75", fontSize: "13px", marginBottom: "6px" }}>{exp.company}</div>
                {exp.achievements?.map((ach, j) => (
                  <div key={j} style={{ fontSize: "12.5px", lineHeight: "1.7", color: "#4b5563", paddingLeft: "14px", position: "relative" }}>
                    • {ach}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApexCV;