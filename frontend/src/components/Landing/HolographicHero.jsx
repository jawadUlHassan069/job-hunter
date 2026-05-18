// src/components/landing/HolographicHero.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { ACCENT } from "@/data.js";

const MEMBERS = [
  {
    name: "SALMAN KHAN", initials: "SK", lead: true,
    role: "Backend + ML Lead", title: "◈ Senior ML Engineer",
    match: 94,
    accentColor: "#1dc878", borderColor: "rgba(29,200,120,0.38)", glowColor: "rgba(29,200,120,0.16)",
    topMatch: "Senior ML Engineer", topCo: "Arbisoft · Lahore",
    chips: [
      { anim:"hol-orbitA 12s", border:"rgba(29,200,120,0.35)",  color:"rgba(29,200,120,0.95)",  icon:"✦", label:"PyTorch",   iconColor:"#1dc878" },
      { anim:"hol-orbitB 18s", border:"rgba(55,138,221,0.35)",  color:"rgba(55,138,221,0.95)",  icon:"◎", label:"RAG/LLMs",  iconColor:"#378add" },
      { anim:"hol-orbitC 15s", border:"rgba(127,119,221,0.35)", color:"rgba(160,155,235,0.95)", icon:"◈", label:"Azure ML",   iconColor:"#7f77dd" },
      { anim:"hol-orbitD 20s", border:"rgba(239,159,39,0.35)",  color:"rgba(239,159,39,0.95)",  icon:"⬡", label:"MLflow",    iconColor:"#ef9f27" },
      { anim:"hol-orbitE 14s", border:"rgba(29,200,120,0.25)",  color:"rgba(29,200,120,0.8)",   icon:"✦", label:"FastAPI",   iconColor:"#1dc878" },
    ],
    skills: [
      { label:"Python",  bg:"rgba(29,200,120,0.14)", border:"rgba(29,200,120,0.3)", color:"rgba(29,200,120,0.9)"  },
      { label:"PyTorch", bg:"rgba(29,200,120,0.14)", border:"rgba(29,200,120,0.3)", color:"rgba(29,200,120,0.9)"  },
      { label:"RAG",     bg:"rgba(55,138,221,0.14)", border:"rgba(55,138,221,0.3)", color:"rgba(55,138,221,0.9)"  },
      { label:"LLMs",    bg:"rgba(55,138,221,0.14)", border:"rgba(55,138,221,0.3)", color:"rgba(55,138,221,0.9)"  },
      { label:"Azure",   bg:"rgba(127,119,221,0.14)",border:"rgba(127,119,221,0.3)",color:"rgba(160,155,235,0.9)" },
    ],
    ats: [
      { label:"Keywords", w:"88%", c:"#1dc878", c2:"#37d4aa" },
      { label:"Format",   w:"95%", c:"#378add", c2:"#5fc4f0" },
      { label:"Clarity",  w:"79%", c:"#7f77dd", c2:"#a89fec" },
    ],
    gaps: ["Kubernetes","Terraform"], filled: ["✓ Docker","✓ CI/CD"],
    expBar: "82%",
  },
  {
    name: "ZOHAIB ARSHAD", initials: "ZA", lead: false,
    role: "Skill Gap + Testing", title: "◈ QA & Gap Analyst",
    match: 87,
    accentColor: "#378add", borderColor: "rgba(55,138,221,0.40)", glowColor: "rgba(55,138,221,0.16)",
    topMatch: "QA Automation Engineer", topCo: "Systems Ltd · Karachi",
    chips: [
      { anim:"hol-orbitA 13s", border:"rgba(55,138,221,0.35)",  color:"rgba(55,138,221,0.95)",  icon:"◎", label:"Selenium",  iconColor:"#378add" },
      { anim:"hol-orbitB 17s", border:"rgba(29,200,120,0.35)",  color:"rgba(29,200,120,0.95)",  icon:"✦", label:"Pytest",    iconColor:"#1dc878" },
      { anim:"hol-orbitC 16s", border:"rgba(127,119,221,0.35)", color:"rgba(160,155,235,0.95)", icon:"◈", label:"Postman",   iconColor:"#7f77dd" },
      { anim:"hol-orbitD 21s", border:"rgba(239,159,39,0.35)",  color:"rgba(239,159,39,0.95)",  icon:"⬡", label:"Jest",      iconColor:"#ef9f27" },
      { anim:"hol-orbitE 15s", border:"rgba(55,138,221,0.25)",  color:"rgba(55,138,221,0.8)",   icon:"◎", label:"Cypress",   iconColor:"#378add" },
    ],
    skills: [
      { label:"Selenium", bg:"rgba(55,138,221,0.14)", border:"rgba(55,138,221,0.3)", color:"rgba(55,138,221,0.9)"  },
      { label:"Pytest",   bg:"rgba(29,200,120,0.14)", border:"rgba(29,200,120,0.3)", color:"rgba(29,200,120,0.9)"  },
      { label:"Postman",  bg:"rgba(127,119,221,0.14)",border:"rgba(127,119,221,0.3)",color:"rgba(160,155,235,0.9)" },
      { label:"Jest",     bg:"rgba(239,159,39,0.14)", border:"rgba(239,159,39,0.3)", color:"rgba(239,159,39,0.9)"  },
      { label:"CI/CD",    bg:"rgba(55,138,221,0.14)", border:"rgba(55,138,221,0.3)", color:"rgba(55,138,221,0.9)"  },
    ],
    ats: [
      { label:"Keywords", w:"83%", c:"#378add", c2:"#5fc4f0" },
      { label:"Format",   w:"91%", c:"#1dc878", c2:"#37d4aa" },
      { label:"Clarity",  w:"86%", c:"#7f77dd", c2:"#a89fec" },
    ],
    gaps: ["Playwright","k6 Load"], filled: ["✓ Pytest","✓ Postman"],
    expBar: "74%",
  },
  {
    name: "KEYAN MAJID", initials: "KM", lead: false,
    role: "Frontend + CV Maker", title: "◈ Frontend Engineer",
    match: 91,
    accentColor: "#7f77dd", borderColor: "rgba(127,119,221,0.40)", glowColor: "rgba(127,119,221,0.16)",
    topMatch: "Frontend Developer", topCo: "10Pearls · Islamabad",
    chips: [
      { anim:"hol-orbitA 11s", border:"rgba(127,119,221,0.35)", color:"rgba(160,155,235,0.95)", icon:"◈", label:"React",     iconColor:"#7f77dd" },
      { anim:"hol-orbitB 16s", border:"rgba(29,200,120,0.35)",  color:"rgba(29,200,120,0.95)",  icon:"✦", label:"Tailwind",  iconColor:"#1dc878" },
      { anim:"hol-orbitC 14s", border:"rgba(55,138,221,0.35)",  color:"rgba(55,138,221,0.95)",  icon:"◎", label:"Vite",      iconColor:"#378add" },
      { anim:"hol-orbitD 19s", border:"rgba(239,159,39,0.35)",  color:"rgba(239,159,39,0.95)",  icon:"⬡", label:"GSAP",      iconColor:"#ef9f27" },
      { anim:"hol-orbitE 13s", border:"rgba(127,119,221,0.25)", color:"rgba(160,155,235,0.8)",  icon:"◈", label:"Figma",     iconColor:"#7f77dd" },
    ],
    skills: [
      { label:"React",      bg:"rgba(127,119,221,0.14)",border:"rgba(127,119,221,0.3)",color:"rgba(160,155,235,0.9)" },
      { label:"Tailwind",   bg:"rgba(29,200,120,0.14)", border:"rgba(29,200,120,0.3)", color:"rgba(29,200,120,0.9)"  },
      { label:"TypeScript", bg:"rgba(55,138,221,0.14)", border:"rgba(55,138,221,0.3)", color:"rgba(55,138,221,0.9)"  },
      { label:"GSAP",       bg:"rgba(239,159,39,0.14)", border:"rgba(239,159,39,0.3)", color:"rgba(239,159,39,0.9)"  },
      { label:"Vite",       bg:"rgba(127,119,221,0.14)",border:"rgba(127,119,221,0.3)",color:"rgba(160,155,235,0.9)" },
    ],
    ats: [
      { label:"Keywords", w:"90%", c:"#7f77dd", c2:"#a89fec" },
      { label:"Format",   w:"97%", c:"#1dc878", c2:"#37d4aa" },
      { label:"Clarity",  w:"85%", c:"#378add", c2:"#5fc4f0" },
    ],
    gaps: ["Next.js","WebGL"], filled: ["✓ React","✓ Figma"],
    expBar: "78%",
  },
  {
    name: "JAWAD UL HASSAN", initials: "JH", lead: false,
    role: "Jobs + ATS", title: "◈ Backend Engineer",
    match: 85,
    accentColor: "#ef9f27", borderColor: "rgba(239,159,39,0.40)", glowColor: "rgba(239,159,39,0.16)",
    topMatch: "Backend Developer", topCo: "Contour Software · Karachi",
    chips: [
      { anim:"hol-orbitA 14s", border:"rgba(239,159,39,0.35)",  color:"rgba(239,159,39,0.95)",  icon:"⬡", label:"Django",     iconColor:"#ef9f27" },
      { anim:"hol-orbitB 19s", border:"rgba(29,200,120,0.35)",  color:"rgba(29,200,120,0.95)",  icon:"✦", label:"PostgreSQL", iconColor:"#1dc878" },
      { anim:"hol-orbitC 16s", border:"rgba(55,138,221,0.35)",  color:"rgba(55,138,221,0.95)",  icon:"◎", label:"Redis",      iconColor:"#378add" },
      { anim:"hol-orbitD 22s", border:"rgba(127,119,221,0.35)", color:"rgba(160,155,235,0.95)", icon:"◈", label:"Celery",     iconColor:"#7f77dd" },
      { anim:"hol-orbitE 12s", border:"rgba(239,159,39,0.25)",  color:"rgba(239,159,39,0.8)",   icon:"⬡", label:"DRF",        iconColor:"#ef9f27" },
    ],
    skills: [
      { label:"Django",     bg:"rgba(239,159,39,0.14)", border:"rgba(239,159,39,0.3)", color:"rgba(239,159,39,0.9)"  },
      { label:"PostgreSQL", bg:"rgba(29,200,120,0.14)", border:"rgba(29,200,120,0.3)", color:"rgba(29,200,120,0.9)"  },
      { label:"Redis",      bg:"rgba(55,138,221,0.14)", border:"rgba(55,138,221,0.3)", color:"rgba(55,138,221,0.9)"  },
      { label:"Celery",     bg:"rgba(127,119,221,0.14)",border:"rgba(127,119,221,0.3)",color:"rgba(160,155,235,0.9)" },
      { label:"DRF",        bg:"rgba(239,159,39,0.14)", border:"rgba(239,159,39,0.3)", color:"rgba(239,159,39,0.9)"  },
    ],
    ats: [
      { label:"Keywords", w:"80%", c:"#ef9f27", c2:"#f7c56a" },
      { label:"Format",   w:"88%", c:"#1dc878", c2:"#37d4aa" },
      { label:"Clarity",  w:"76%", c:"#378add", c2:"#5fc4f0" },
    ],
    gaps: ["Kubernetes","GraphQL"], filled: ["✓ Docker","✓ Redis"],
    expBar: "70%",
  },
];

const HOL_CSS = `
  @keyframes hol-float       { 0%,100%{transform:translateY(0) rotateX(4deg) rotateY(-6deg)} 50%{transform:translateY(-18px) rotateX(6deg) rotateY(-4deg)} }
  @keyframes hol-scanLine    { 0%{top:-4px;opacity:0} 5%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
  @keyframes hol-orbitA      { from{transform:rotate(0deg)   translateX(190px) rotate(0deg)}   to{transform:rotate(360deg)  translateX(190px)  rotate(-360deg)} }
  @keyframes hol-orbitB      { from{transform:rotate(120deg) translateX(155px) rotate(-120deg)} to{transform:rotate(480deg)  translateX(155px)  rotate(-480deg)} }
  @keyframes hol-orbitC      { from{transform:rotate(240deg) translateX(175px) rotate(-240deg)} to{transform:rotate(600deg)  translateX(175px)  rotate(-600deg)} }
  @keyframes hol-orbitD      { from{transform:rotate(60deg)  translateX(200px) rotate(-60deg)}  to{transform:rotate(420deg)  translateX(200px)  rotate(-420deg)} }
  @keyframes hol-orbitE      { from{transform:rotate(310deg) translateX(160px) rotate(-310deg)} to{transform:rotate(670deg)  translateX(160px)  rotate(-670deg)} }
  @keyframes hol-pulse       { 0%,100%{box-shadow:0 0 0 0 rgba(29,200,120,0.55)} 50%{box-shadow:0 0 0 8px rgba(29,200,120,0)} }
  @keyframes hol-matchGlow   { 0%,100%{opacity:0.65} 50%{opacity:1} }
  @keyframes hol-ringPulse   { 0%{transform:translate(-50%,-50%) scale(1);opacity:.28} 50%{transform:translate(-50%,-50%) scale(1.06);opacity:.12} 100%{transform:translate(-50%,-50%) scale(1);opacity:.28} }
  @keyframes hol-chipIn      { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes hol-atsBar      { from{width:0} to{width:var(--w)} }
  @keyframes hol-dot1        { 0%,100%{opacity:.2} 33%{opacity:1} }
  @keyframes hol-dot2        { 0%,100%{opacity:.2} 66%{opacity:1} }
  @keyframes hol-dot3        { 0%,100%{opacity:.2} 99%{opacity:1} }
  @keyframes hol-flipOut     { 0%{opacity:1;transform:perspective(900px) rotateX(4deg) rotateY(-6deg) scale(1)} 100%{opacity:0;transform:perspective(900px) rotateX(4deg) rotateY(-90deg) scale(0.88)} }
  @keyframes hol-flipIn      { 0%{opacity:0;transform:perspective(900px) rotateX(4deg) rotateY(90deg) scale(0.88)} 100%{opacity:1;transform:perspective(900px) rotateX(4deg) rotateY(-6deg) scale(1)} }
  @keyframes hol-particleDrift { 0%{transform:translateY(0) translateX(0);opacity:.7} 100%{transform:translateY(-60px) translateX(18px);opacity:0} }

  .hol-wrap         { position:relative;width:520px;height:520px;overflow:hidden;border-radius:16px;display:flex;align-items:center;justify-content:center; }
  .hol-bg-grid      { position:absolute;inset:0;background-image:linear-gradient(rgba(29,200,120,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,200,120,0.06) 1px,transparent 1px);background-size:40px 40px; }
  .hol-bg-glow-g    { position:absolute;left:55%;top:50%;width:380px;height:380px;border-radius:50%;transform:translate(-50%,-50%);transition:background 0.9s ease; }
  .hol-bg-glow-b    { position:absolute;left:30%;top:60%;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(55,138,221,0.10) 0%,transparent 70%);transform:translate(-50%,-50%); }

  .hol-scene        { position:absolute;left:52%;top:50%;transform:translate(-50%,-50%);width:260px;height:340px;perspective:900px; }
  .hol-cv-card      { width:100%;height:100%;position:relative; }
  .hol-float        { animation:hol-float 6s ease-in-out infinite; }
  .hol-flip-out     { animation:hol-flipOut 0.38s ease-in  both!important; }
  .hol-flip-in      { animation:hol-flipIn  0.44s ease-out both!important; }

  .hol-cv-panel     { position:absolute;inset:0;border-radius:16px;padding:20px 18px;display:flex;flex-direction:column;gap:9px;overflow:hidden;background:linear-gradient(135deg,rgba(10,20,40,0.93) 0%,rgba(6,12,28,0.97) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08); }
  .hol-cv-glint     { position:absolute;top:0;left:15%;width:55%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent); }
  .hol-cv-corner    { position:absolute;width:12px;height:12px;border-style:solid; }
  .hol-cv-corner.tl { top:8px;left:8px;border-width:1.5px 0 0 1.5px; }
  .hol-cv-corner.tr { top:8px;right:8px;border-width:1.5px 1.5px 0 0; }
  .hol-cv-corner.bl { bottom:8px;left:8px;border-width:0 0 1.5px 1.5px; }
  .hol-cv-corner.br { bottom:8px;right:8px;border-width:0 1.5px 1.5px 0; }
  .hol-scan-line    { position:absolute;left:0;right:0;height:3px;animation:hol-scanLine 4s ease-in-out infinite;top:0;z-index:10;pointer-events:none; }
  .hol-cv-name      { font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#e8f4ff;letter-spacing:0.06em; }
  .hol-cv-title     { font-size:8px;letter-spacing:0.18em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-top:-4px; }
  .hol-cv-divider   { height:1px; }
  .hol-cv-section   { display:flex;flex-direction:column;gap:4px; }
  .hol-cv-sec-label { font-size:7px;letter-spacing:0.22em;text-transform:uppercase;font-family:'JetBrains Mono',monospace; }
  .hol-cv-line      { height:5px;border-radius:3px;background:rgba(255,255,255,0.07);overflow:hidden; }
  .hol-cv-line-fill { height:100%;border-radius:3px;transition:width 0.8s ease; }
  .hol-cv-text-line { height:4px;border-radius:2px;background:rgba(255,255,255,0.08); }
  .hol-ats-row      { display:flex;align-items:center;gap:6px;margin-top:2px; }
  .hol-ats-label    { font-size:7px;font-family:'JetBrains Mono',monospace;min-width:44px; }
  .hol-ats-bar-bg   { flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.07);overflow:hidden; }
  .hol-ats-bar-fill { height:100%;border-radius:2px;width:var(--w);animation:hol-atsBar 1s ease forwards; }
  .hol-ats-score    { font-size:7px;font-family:'JetBrains Mono',monospace;min-width:22px;text-align:right; }
  .hol-gap-row      { display:flex;gap:4px;flex-wrap:wrap;margin-top:3px; }
  .hol-gap-chip     { font-size:7px;padding:2px 5px;border-radius:4px;background:rgba(220,60,60,0.15);border:1px solid rgba(220,60,60,0.3);color:rgba(255,130,120,0.9);font-family:'JetBrains Mono',monospace; }
  .hol-gap-chip.filled { background:rgba(29,200,120,0.12);border:1px solid rgba(29,200,120,0.3);color:rgba(29,200,120,0.9); }
  .hol-orbiters     { position:absolute;left:52%;top:50%;width:0;height:0;transform:translate(-50%,-50%); }
  .hol-orbit-chip   { position:absolute;animation-timing-function:linear;animation-iteration-count:infinite; }
  .hol-chip-inner   { display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:600;white-space:nowrap;animation:hol-chipIn 0.6s ease both;background:rgba(10,20,38,0.90); }
  .hol-match-ring   { position:absolute;left:52%;top:50%;transform:translate(-50%,-50%);width:430px;height:430px;border-radius:50%;border:1px dashed;animation:hol-ringPulse 4s ease-in-out infinite;pointer-events:none;transition:border-color 0.9s ease; }
  .hol-match-ring2  { width:370px;height:370px;animation-duration:5s;animation-delay:1s; }
  .hol-left-panel   { position:absolute;left:16px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:12px; }
  .hol-match-badge  { display:flex;flex-direction:column;align-items:center;padding:12px 14px;border-radius:14px;background:rgba(10,20,38,0.88);backdrop-filter:blur(8px); }
  .hol-match-pct    { font-size:24px;font-weight:700;font-family:'JetBrains Mono',monospace;line-height:1;animation:hol-matchGlow 2.5s ease-in-out infinite;transition:color 0.5s ease; }
  .hol-match-sub    { font-size:7px;letter-spacing:0.2em;margin-top:3px;font-family:'JetBrains Mono',monospace; }
  .hol-status-dot   { display:flex;align-items:center;gap:6px;font-size:8px;color:rgba(200,220,255,0.55);font-family:'JetBrains Mono',monospace; }
  .hol-dot          { width:6px;height:6px;border-radius:50%;animation:hol-pulse 2s infinite; }
  .hol-dot.green    { background:#1dc878; }
  .hol-dot.blue     { background:#378add;animation-delay:0.7s; }
  .hol-dot.amber    { background:#ef9f27;animation-delay:1.4s; }
  .hol-thinking     { display:flex;align-items:center;gap:3px; }
  .hol-thinking span{ width:5px;height:5px;border-radius:50%;background:rgba(29,200,120,0.7); }
  .hol-thinking span:nth-child(1){animation:hol-dot1 1.2s infinite}
  .hol-thinking span:nth-child(2){animation:hol-dot2 1.2s infinite}
  .hol-thinking span:nth-child(3){animation:hol-dot3 1.2s infinite}
  .hol-ai-label     { font-size:7px;color:rgba(29,200,120,0.55);letter-spacing:0.15em;font-family:'JetBrains Mono',monospace; }
  .hol-skill-tag    { font-size:7px;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace; }
  .hol-dot-nav      { display:flex;gap:6px;justify-content:center; }
  .hol-dot-btn      { border:none;cursor:pointer;transition:all 0.35s ease;padding:0;border-radius:999px; }
  .hol-particle     { position:absolute;width:3px;height:3px;border-radius:50%;animation:hol-particleDrift 3s ease-out infinite; }
`;

function CVContent({ m }) {
  return (
    <div className="hol-cv-panel" style={{
      border: `1px solid ${m.borderColor}`,
      boxShadow: `0 0 0 1px ${m.accentColor}12, 0 0 55px ${m.glowColor}, 0 0 110px rgba(55,138,221,0.08), inset 0 1px 0 rgba(255,255,255,0.08)`,
    }}>
      <div className="hol-cv-glint" />
      {["tl","tr","bl","br"].map(c => (
        <div key={c} className={`hol-cv-corner ${c}`} style={{ borderColor:`${m.accentColor}CC` }} />
      ))}
      <div className="hol-scan-line" style={{
        background:`linear-gradient(90deg,transparent,${m.accentColor}E0,${m.accentColor},${m.accentColor}E0,transparent)`,
        boxShadow:`0 0 12px ${m.accentColor}, 0 0 24px ${m.accentColor}66`,
      }} />
      <div className="hol-cv-name">{m.name}</div>
      <div className="hol-cv-title" style={{ color:`${m.accentColor}E8` }}>
        {m.title}
        {m.lead && (
          <span style={{ marginLeft:"8px", fontSize:"6px", padding:"1px 5px", borderRadius:"3px",
            background:`${m.accentColor}20`, border:`1px solid ${m.accentColor}45`, color:m.accentColor }}>
            LEAD
          </span>
        )}
      </div>
      <div className="hol-cv-divider" style={{ background:`linear-gradient(90deg,${m.accentColor}66,rgba(55,138,221,0.18),transparent)` }} />
      <div className="hol-cv-section">
        <div className="hol-cv-sec-label" style={{ color:`${m.accentColor}B8` }}>Experience</div>
        <div className="hol-cv-line">
          <div className="hol-cv-line-fill" style={{ width:m.expBar, background:`linear-gradient(90deg,${m.accentColor}B0,rgba(55,138,221,0.5))` }} />
        </div>
        <div className="hol-cv-text-line" style={{ width:"90%" }} />
        <div className="hol-cv-text-line" style={{ width:"68%" }} />
      </div>
      <div className="hol-cv-section">
        <div className="hol-cv-sec-label" style={{ color:`${m.accentColor}B8` }}>Core Skills</div>
        <div style={{ display:"flex", gap:"3px", flexWrap:"wrap" }}>
          {m.skills.map(s => (
            <div key={s.label} className="hol-skill-tag"
              style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.color }}>{s.label}</div>
          ))}
        </div>
      </div>
      <div className="hol-cv-section">
        <div className="hol-cv-sec-label" style={{ color:`${m.accentColor}B8` }}>ATS Readiness</div>
        {m.ats.map(a => (
          <div key={a.label} className="hol-ats-row">
            <div className="hol-ats-label" style={{ color:`${a.c}CC` }}>{a.label}</div>
            <div className="hol-ats-bar-bg">
              <div className="hol-ats-bar-fill" style={{ "--w":a.w, background:`linear-gradient(90deg,${a.c},${a.c2})` }} />
            </div>
            <div className="hol-ats-score" style={{ color:a.c }}>{a.w}</div>
          </div>
        ))}
      </div>
      <div className="hol-cv-section">
        <div className="hol-cv-sec-label" style={{ color:`${m.accentColor}B8` }}>Skill Gaps</div>
        <div className="hol-gap-row">
          {m.gaps.map(g   => <div key={g} className="hol-gap-chip">{g}</div>)}
          {m.filled.map(f => <div key={f} className="hol-gap-chip filled">{f}</div>)}
        </div>
      </div>
      <div style={{ marginTop:"auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
          <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:m.accentColor, animation:"hol-pulse 2s infinite" }} />
          <span style={{ fontSize:"7px", color:`${m.accentColor}99`, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.15em" }}>
            LIVE · JOB HUNTER AI
          </span>
        </div>
        <span style={{ fontSize:"7px", color:"rgba(255,255,255,0.15)", fontFamily:"'JetBrains Mono',monospace" }}>HOL-v2.4</span>
      </div>
    </div>
  );
}

export default function HolographicHero() {
  const [displayIdx, setDisplayIdx] = useState(0);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [busy,       setBusy]       = useState(false);
  const cardRef  = useRef(null);
  const pctRef   = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("hol-css")) {
      const s = document.createElement("style");
      s.id = "hol-css"; s.textContent = HOL_CSS;
      document.head.appendChild(s);
    }
    animatePct(MEMBERS[0].match);
  }, []); // eslint-disable-line

  function animatePct(target) {
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(v + 3, target);
      if (pctRef.current) pctRef.current.textContent = v + "%";
      if (v >= target) clearInterval(t);
    }, 20);
  }

  const flipTo = useCallback((nextIdx) => {
    if (busy || nextIdx === activeIdx) return;
    setBusy(true);
    const card = cardRef.current;
    if (!card) { setBusy(false); return; }
    card.className = "hol-cv-card hol-flip-out";
    setTimeout(() => {
      setDisplayIdx(nextIdx);
      animatePct(MEMBERS[nextIdx].match);
      card.className = "hol-cv-card hol-flip-in";
      setTimeout(() => {
        card.className = "hol-cv-card hol-float";
        setActiveIdx(nextIdx);
        setBusy(false);
      }, 450);
    }, 390);
  }, [busy, activeIdx]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % MEMBERS.length;
        flipTo(next);
        return prev;
      });
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [flipTo]);

  const m      = MEMBERS[displayIdx];
  const active = MEMBERS[activeIdx];

  return (
    <div className="hol-wrap">
      <div className="hol-bg-grid" />
      <div className="hol-bg-glow-g" style={{ background:`radial-gradient(circle,${active.accentColor}22 0%,transparent 70%)` }} />
      <div className="hol-bg-glow-b" />

      {[
        { l:"42%",t:"30%",d:"0s",   dur:"3.2s",c:"#1dc878" },
        { l:"63%",t:"45%",d:"0.8s", dur:"2.8s",c:"#378add" },
        { l:"37%",t:"66%",d:"1.6s", dur:"3.6s",c:"#1dc878" },
        { l:"68%",t:"27%",d:"2.4s", dur:"3.0s",c:"#7f77dd" },
        { l:"54%",t:"72%",d:"0.4s", dur:"2.5s",c:"#ef9f27" },
      ].map((p,i) => (
        <div key={i} className="hol-particle" style={{ left:p.l, top:p.t, background:p.c, animationDelay:p.d, animationDuration:p.dur }} />
      ))}

      <div className="hol-match-ring" style={{ borderColor:`${active.accentColor}18` }} />
      <div className="hol-match-ring hol-match-ring2" style={{ borderColor:"rgba(55,138,221,0.10)" }} />

      <div className="hol-orbiters">
        {m.chips.map(({ anim, border, color, icon, label, iconColor }) => (
          <div key={label} className="hol-orbit-chip" style={{ animation:`${anim} linear infinite` }}>
            <div className="hol-chip-inner" style={{ border:`1px solid ${border}`, color }}>
              <span style={{ color:iconColor, fontSize:"10px" }}>{icon}</span>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Left panel */}
      <div className="hol-left-panel">
        <div className="hol-match-badge" style={{ border:`1px solid ${m.accentColor}38` }}>
          <div className="hol-match-pct" ref={pctRef} style={{ color:m.accentColor }}>0%</div>
          <div className="hol-match-sub" style={{ color:`${m.accentColor}80` }}>MATCH</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px", padding:"10px 12px", borderRadius:"12px",
          background:"rgba(10,20,38,0.82)", border:"1px solid rgba(255,255,255,0.07)" }}>
          {[{ cls:"green", label:"Analyzing CV" },{ cls:"blue", label:"Matching Jobs" },{ cls:"amber", label:"Gap Analysis" }].map(({ cls, label }) => (
            <div key={label} className="hol-status-dot">
              <div className={`hol-dot ${cls}`} /> {label}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", padding:"10px 12px",
          borderRadius:"12px", background:"rgba(10,20,38,0.82)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="hol-ai-label">AI READING</div>
          <div className="hol-thinking"><span /><span /><span /></div>
        </div>
      </div>

      {/* CV card */}
      <div className="hol-scene">
        <div ref={cardRef} className="hol-cv-card hol-float">
          <CVContent m={m} />
        </div>
      </div>

      {/* Right panel */}
      <div style={{ position:"absolute", right:"16px", top:"50%", transform:"translateY(-50%)",
        display:"flex", flexDirection:"column", gap:"10px", alignItems:"flex-end" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px", padding:"12px 14px", borderRadius:"12px",
          background:"rgba(10,20,38,0.85)", border:`1px solid ${m.accentColor}30`, backdropFilter:"blur(8px)", transition:"border-color 0.5s ease" }}>
          <div style={{ fontSize:"8px", color:`${m.accentColor}99`, letterSpacing:"0.2em", fontFamily:"'JetBrains Mono',monospace" }}>OPEN ROLES</div>
          <div style={{ fontSize:"22px", fontWeight:700, color:m.accentColor, fontFamily:"'JetBrains Mono',monospace", lineHeight:1, transition:"color 0.5s ease" }}>2,400+</div>
          <div style={{ fontSize:"8px", color:"rgba(200,220,255,0.42)", fontFamily:"'JetBrains Mono',monospace" }}>Matched to profile</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"5px", padding:"10px 14px", borderRadius:"12px",
          background:"rgba(10,20,38,0.85)", border:"1px solid rgba(127,119,221,0.22)" }}>
          <div style={{ fontSize:"8px", color:"rgba(160,155,235,0.62)", letterSpacing:"0.2em", fontFamily:"'JetBrains Mono',monospace" }}>TOP MATCH</div>
          <div style={{ fontSize:"10px", fontWeight:600, color:"rgba(200,200,255,0.9)", fontFamily:"'JetBrains Mono',monospace" }}>{m.topMatch}</div>
          <div style={{ fontSize:"8px", color:"rgba(200,220,255,0.38)", fontFamily:"'JetBrains Mono',monospace" }}>{m.topCo}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"5px", padding:"10px 12px", borderRadius:"12px",
          background:"rgba(10,20,38,0.85)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:"7px", color:"rgba(200,220,255,0.28)", letterSpacing:"0.18em", fontFamily:"'JetBrains Mono',monospace", marginBottom:"3px" }}>THE TEAM</div>
          {MEMBERS.map((tm, i) => (
            <button key={tm.initials} onClick={() => flipTo(i)}
              style={{ display:"flex", alignItems:"center", gap:"7px", background:"transparent", border:"none", cursor:"pointer",
                padding:"2px 0", opacity: activeIdx === i ? 1 : 0.42, transition:"opacity 0.35s ease" }}>
              <div style={{ width:"22px", height:"22px", borderRadius:"7px", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"8px", fontWeight:800, fontFamily:"'JetBrains Mono',monospace",
                background:`${tm.accentColor}20`, color:tm.accentColor,
                border: activeIdx === i ? `1.5px solid ${tm.accentColor}85` : "1.5px solid transparent",
                transition:"border 0.35s ease" }}>
                {tm.initials}
              </div>
              <span style={{ fontSize:"8px", fontFamily:"'JetBrains Mono',monospace",
                color: activeIdx === i ? "rgba(225,235,255,0.9)" : "rgba(200,220,255,0.32)",
                transition:"color 0.35s ease", whiteSpace:"nowrap" }}>
                {tm.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dot nav */}
      <div className="hol-dot-nav" style={{ position:"absolute", bottom:"14px", left:"52%", transform:"translateX(-50%)" }}>
        {MEMBERS.map((tm, i) => (
          <button key={i} className="hol-dot-btn" onClick={() => flipTo(i)}
            style={{ width: activeIdx === i ? "22px" : "7px", height:"7px",
              background: activeIdx === i ? tm.accentColor : "rgba(255,255,255,0.18)" }} />
        ))}
      </div>
    </div>
  );
}
