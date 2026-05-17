import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const API = "http://127.0.0.1:8000/api/chat/";

/* ─── Auth helper ────────────────────────────────────────────────────── */
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
});

/* ─── Static tokens ──────────────────────────────────────────────────── */
const BG   = "#080808";
const SURF = "#0d0d0d";
const BORDER = "rgba(255,255,255,0.06)";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap";

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'DM Mono', monospace; background: ${BG}; color: #fff;
    -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.15} }
  @keyframes slideR    { from{opacity:0;transform:translateX(40px) scale(0.98)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes slideL    { from{opacity:0;transform:translateX(-40px) scale(0.98)} to{opacity:1;transform:translateX(0) scale(1)} }
  .tpl-enter-right { animation: slideR 0.4s cubic-bezier(0.22,1,0.36,1) forwards; }
  .tpl-enter-left  { animation: slideL 0.4s cubic-bezier(0.22,1,0.36,1) forwards; }
  @media print { body { background:#fff !important; } #cv-shell { box-shadow:none !important; } }
`;

const PALETTE = {
  apex:  { particle: "#4f7bff", grid: "#3b5bdb", glow: "#1e3a8a", radial: "59,91,219" },
  atlas: { particle: "#1d9e75", grid: "#16a34a", glow: "#14532d", radial: "22,163,74"  },
  aire:  { particle: "#f87171", grid: "#dc2626", glow: "#7f1d1d", radial: "220,38,38"  },
};

const TEMPLATES = [
  { id:"apex",  label:"Apex",  sub:"Classic · Corporate",  bar:"#3b5bdb",
    desc:"Clean dark sidebar with strong visual hierarchy. Built for corporate and finance roles." },
  { id:"atlas", label:"Atlas", sub:"Modern · Structured",   bar:"#16a34a",
    desc:"Green-accented header with skill bars and a structured layout. Perfect for tech profiles." },
  { id:"aire",  label:"Aire",  sub:"Editorial · Minimal",   bar:"#dc2626",
    desc:"Red editorial lines with bold typography. Striking choice for creative and design roles." },
];

/* ══════════════════════════════════════════════════════════════════════
   THREE.JS BACKGROUND
══════════════════════════════════════════════════════════════════════ */
function ThreeBackground({ colorRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = window.innerWidth, H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 5;

    const COUNT = 2000;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const alphas= new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 22;
      pos[i*3+1] = (Math.random() - 0.5) * 18;
      pos[i*3+2] = (Math.random() - 0.5) * 12;
      sizes[i]   = Math.random() * 2.2 + 0.3;
      alphas[i]  = Math.random() * 0.55 + 0.08;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("alpha",    new THREE.BufferAttribute(alphas, 1));

    const currentColor = new THREE.Color(PALETTE.apex.particle);

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: {
        uTime:   { value: 0 },
        uColor:  { value: currentColor },
      },
      vertexShader: `
        attribute float size; attribute float alpha; varying float vAlpha;
        uniform float uTime;
        void main() {
          vAlpha = alpha;
          vec3 p = position;
          p.y += sin(uTime * 0.25 + position.x * 0.6) * 0.06;
          p.x += cos(uTime * 0.18 + position.z * 0.5) * 0.04;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = size * (300.0 / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vAlpha; uniform vec3 uColor;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float soft = 1.0 - smoothstep(0.15, 0.5, d);
          gl_FragColor = vec4(uColor, soft * vAlpha * 0.78);
        }
      `,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const gridColor = new THREE.Color(PALETTE.apex.grid);
    const lineMat   = new THREE.LineBasicMaterial({ color: gridColor, transparent: true, opacity: 0.04 });
    for (let i = -6; i <= 6; i++) {
      const hg = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-12, i*1.6, -3), new THREE.Vector3(12, i*1.6, -3)]);
      const vg = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i*1.6, -12, -3), new THREE.Vector3(i*1.6, 12, -3)]);
      scene.add(new THREE.Line(hg, lineMat));
      scene.add(new THREE.Line(vg, lineMat));
    }

    let mx = 0, my = 0;
    const onMouse = (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const LERP = 0.022;
    let rafId;
    const tick = (t) => {
      rafId = requestAnimationFrame(tick);
      mat.uniforms.uTime.value = t * 0.001;
      if (colorRef?.current) {
        currentColor.lerp(colorRef.current, LERP);
        mat.uniforms.uColor.value.copy(currentColor);
        const gridTarget = colorRef.current.clone().multiplyScalar(0.65);
        gridColor.lerp(gridTarget, LERP);
        lineMat.color.copy(gridColor);
        lineMat.needsUpdate = true;
      }
      particles.rotation.y = t * 0.00006;
      particles.rotation.x = t * 0.000025;
      camera.position.x += (mx * 0.28 - camera.position.x) * 0.035;
      camera.position.y += (-my * 0.18 - camera.position.y) * 0.035;
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CV TEMPLATES
══════════════════════════════════════════════════════════════════════ */
const DEMO = {
  name:"Alex Morgan", email:"alex@email.com", phone:"+1 555 0100", location:"New York, NY",
  linkedin:"linkedin.com/in/alexmorgan",
  summary:"Strategic product leader with 8+ years building scalable software platforms and AI-driven products across fintech and enterprise SaaS.",
  experience:[{ title:"Senior Product Manager", company:"Acme Corp", period:"2021–Present",
    achievements:["Led cross-functional team of 12 engineers","Grew revenue 40% YoY","Launched ML recommendation engine"] }],
  education:[{ degree:"MBA, Product Strategy", institution:"Stanford GSB", year:"2016" }],
  skills:{ technical:["Python","SQL","Figma","React","Node.js"], soft:["Leadership","Communication","Strategy"] },
  certifications:["PMP","AWS Solutions Architect","Google PM Certificate"],
  projects:[
    { name:"Platform Rebuild", description:"Revamped core infra, cut latency 60%" },
    { name:"AI Dashboard", description:"Real-time analytics for 50K+ users" },
  ],
};

function ApexCV({ d }) {
  const sb={width:210,background:"#111827",color:"#f9fafb",padding:"36px 22px",flexShrink:0,display:"flex",flexDirection:"column",gap:22,fontFamily:"'DM Sans',sans-serif"};
  const sh={fontSize:9,letterSpacing:2.5,textTransform:"uppercase",color:"#9ca3af",marginBottom:8,fontWeight:600};
  const mn={flex:1,padding:"36px 32px",fontFamily:"'DM Sans',sans-serif"};
  const msh={fontSize:9,letterSpacing:2.5,textTransform:"uppercase",color:"#9ca3af",marginBottom:10,fontWeight:600};
  return (
    <div id="cv-shell" style={{display:"flex",minHeight:1000,background:"#fff"}}>
      <div style={sb}>
        <div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,lineHeight:1.2,color:"#fff",marginBottom:4}}>{d.name}</div>{d.experience?.[0]?.title&&<div style={{fontSize:11,color:"#6b7280"}}>{d.experience[0].title}</div>}</div>
        <div><div style={sh}>Contact</div>{[d.email,d.phone,d.location].filter(Boolean).map((v,i)=><div key={i} style={{fontSize:11,color:"#d1d5db",marginBottom:5,lineHeight:1.5,wordBreak:"break-all"}}>{v}</div>)}{d.linkedin&&<div style={{fontSize:11,color:"#93c5fd",marginTop:4,wordBreak:"break-all"}}>{d.linkedin.replace(/https?:\/\//,"")}</div>}</div>
        {d.skills?.technical?.length>0&&<div><div style={sh}>Technical</div>{d.skills.technical.map((s,i)=><div key={i} style={{fontSize:11,color:"#d1d5db",marginBottom:5,display:"flex",alignItems:"center",gap:6}}><span style={{width:4,height:4,background:"#93c5fd",borderRadius:"50%",flexShrink:0}}/>{s}</div>)}</div>}
        {d.skills?.soft?.length>0&&<div><div style={sh}>Soft Skills</div>{d.skills.soft.map((s,i)=><div key={i} style={{fontSize:11,color:"#d1d5db",marginBottom:5,display:"flex",alignItems:"center",gap:6}}><span style={{width:4,height:4,background:"#a78bfa",borderRadius:"50%",flexShrink:0}}/>{s}</div>)}</div>}
        {d.education?.length>0&&<div><div style={sh}>Education</div>{d.education.map((e,i)=><div key={i} style={{marginBottom:10}}><div style={{fontSize:11,color:"#f3f4f6",fontWeight:500}}>{e.degree}</div><div style={{fontSize:10,color:"#9ca3af"}}>{e.institution}</div><div style={{fontSize:10,color:"#6b7280"}}>{e.year}</div></div>)}</div>}
        {d.certifications?.length>0&&<div><div style={sh}>Certifications</div>{d.certifications.map((c,i)=><div key={i} style={{fontSize:10,color:"#d1d5db",marginBottom:4}}>· {c}</div>)}</div>}
      </div>
      <div style={mn}>
        {d.summary&&<><div style={msh}>Profile</div><p style={{fontSize:12,lineHeight:1.8,color:"#374151",marginBottom:22}}>{d.summary}</p></>}
        {d.experience?.length>0&&<div style={{marginBottom:22}}><div style={msh}>Experience</div>{d.experience.map((e,i)=><div key={i} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><div style={{fontWeight:600,fontSize:13}}>{e.title}</div><div style={{fontSize:10,color:"#9ca3af"}}>{e.period}</div></div><div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>{e.company}</div>{e.achievements?.map((a,j)=><div key={j} style={{fontSize:11,color:"#4b5563",lineHeight:1.6,paddingLeft:10,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:0,top:6,width:3,height:3,background:"#3b5bdb",borderRadius:"50%"}}/>{a}</div>)}</div>)}</div>}
        {d.projects?.length>0&&<div><div style={msh}>Projects</div>{d.projects.map((p,i)=><div key={i} style={{marginBottom:12}}><div style={{fontWeight:600,fontSize:12}}>{p.name}</div><div style={{fontSize:11,color:"#6b7280",lineHeight:1.6}}>{p.description}</div></div>)}</div>}
      </div>
    </div>
  );
}

function AtlasCV({ d }) {
  const g="#14532d",lg="#f0fdf4";
  const sh={fontSize:9,letterSpacing:2.5,textTransform:"uppercase",color:g,fontWeight:700,marginBottom:10,borderLeft:"3px solid #16a34a",paddingLeft:8};
  return (
    <div id="cv-shell" style={{background:"#fff",fontFamily:"'DM Sans',sans-serif",minHeight:1000}}>
      <div style={{background:g,color:"#fff",padding:"32px 40px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:34,letterSpacing:-0.5}}>{d.name}</div>{d.experience?.[0]?.title&&<div style={{fontSize:12,color:"#86efac",marginTop:4,letterSpacing:1}}>{d.experience[0].title}</div>}</div>
          <div style={{textAlign:"right",fontSize:11,color:"#bbf7d0",lineHeight:2}}>{d.email&&<div>{d.email}</div>}{d.phone&&<div>{d.phone}</div>}{d.location&&<div>{d.location}</div>}{d.linkedin&&<div style={{color:"#6ee7b7"}}>{d.linkedin.replace(/https?:\/\//,"")}</div>}</div>
        </div>
      </div>
      {d.summary&&<div style={{background:lg,borderBottom:"1px solid #dcfce7",padding:"14px 40px"}}><p style={{fontSize:12,lineHeight:1.7,color:"#166534"}}>{d.summary}</p></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:0,padding:"28px 40px",alignItems:"start"}}>
        <div style={{paddingRight:32}}>
          {d.experience?.length>0&&<div style={{marginBottom:24}}><div style={sh}>Experience</div>{d.experience.map((e,i)=><div key={i} style={{marginBottom:18,paddingBottom:18,borderBottom:i<d.experience.length-1?"1px solid #f3f4f6":"none"}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:600,fontSize:13}}>{e.title}</div><div style={{fontSize:10,color:"#9ca3af"}}>{e.period}</div></div><div style={{fontSize:11,color:g,fontWeight:500,marginBottom:6}}>{e.company}</div>{e.achievements?.map((a,j)=><div key={j} style={{fontSize:11,color:"#374151",lineHeight:1.65,paddingLeft:12,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:0,top:7,width:4,height:1,background:g}}/>{a}</div>)}</div>)}</div>}
          {d.projects?.length>0&&<div><div style={sh}>Projects</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{d.projects.map((p,i)=><div key={i} style={{background:lg,padding:"10px 12px",borderRadius:6,borderTop:"2px solid #16a34a"}}><div style={{fontWeight:600,fontSize:11,color:g}}>{p.name}</div><div style={{fontSize:10,color:"#6b7280",marginTop:3,lineHeight:1.5}}>{p.description}</div></div>)}</div></div>}
        </div>
        <div style={{paddingLeft:24,borderLeft:"1px solid #f3f4f6"}}>
          {d.skills?.technical?.length>0&&<div style={{marginBottom:18}}><div style={{...sh,borderLeft:"none",paddingLeft:0}}>Skills</div>{d.skills.technical.map((s,i)=><div key={i} style={{fontSize:11,color:"#374151",marginBottom:6}}><div style={{marginBottom:2}}>{s}</div><div style={{height:3,background:"#f0fdf4",borderRadius:2,overflow:"hidden"}}><div style={{height:3,background:g,width:`${88-i*6}%`,borderRadius:2}}/></div></div>)}</div>}
          {d.skills?.soft?.length>0&&<div style={{marginBottom:18}}><div style={{...sh,borderLeft:"none",paddingLeft:0}}>Soft Skills</div>{d.skills.soft.map((s,i)=><div key={i} style={{fontSize:10,color:"#6b7280",marginBottom:4}}>· {s}</div>)}</div>}
          {d.education?.length>0&&<div style={{marginBottom:18}}><div style={{...sh,borderLeft:"none",paddingLeft:0}}>Education</div>{d.education.map((e,i)=><div key={i} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:600,color:"#111827"}}>{e.degree}</div><div style={{fontSize:10,color:g}}>{e.institution}</div><div style={{fontSize:10,color:"#9ca3af"}}>{e.year}</div></div>)}</div>}
          {d.certifications?.length>0&&<div><div style={{...sh,borderLeft:"none",paddingLeft:0}}>Certs</div>{d.certifications.map((c,i)=><div key={i} style={{fontSize:10,color:"#6b7280",marginBottom:4}}>✓ {c}</div>)}</div>}
        </div>
      </div>
    </div>
  );
}

function AireCV({ d }) {
  const red="#991b1b";
  const sh={fontSize:9,letterSpacing:3,textTransform:"uppercase",fontWeight:700,color:red,marginBottom:10,marginTop:24,display:"flex",alignItems:"center",gap:10};
  const rule=<div style={{flex:1,height:1,background:"#fecaca"}}/>;
  return (
    <div id="cv-shell" style={{background:"#fff",fontFamily:"'DM Sans',sans-serif",padding:"48px 52px",minHeight:1000}}>
      <div style={{borderBottom:`3px solid ${red}`,paddingBottom:20,marginBottom:4}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:42,letterSpacing:-1,color:"#111",lineHeight:1.1}}>{d.name}</div>
        {d.experience?.[0]?.title&&<div style={{fontSize:12,color:"#6b7280",marginTop:6,letterSpacing:2,textTransform:"uppercase"}}>{d.experience[0].title}</div>}
      </div>
      <div style={{display:"flex",gap:24,fontSize:11,color:"#9ca3af",padding:"10px 0",borderBottom:"1px solid #f9f9f9",flexWrap:"wrap"}}>
        {[d.email,d.phone,d.location].filter(Boolean).map((v,i)=><span key={i}>{v}</span>)}
        {d.linkedin&&<span style={{color:red}}>{d.linkedin.replace(/https?:\/\//,"")}</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"0 40px"}}>
        <div>
          {d.summary&&<><div style={sh}><span>Profile</span>{rule}</div><p style={{fontSize:12,lineHeight:1.8,color:"#374151",fontStyle:"italic"}}>{d.summary}</p></>}
          {d.experience?.length>0&&<><div style={sh}><span>Experience</span>{rule}</div>{d.experience.map((e,i)=><div key={i} style={{marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><div style={{fontWeight:600,fontSize:13,color:"#111"}}>{e.title}</div><div style={{fontSize:10,color:"#9ca3af"}}>{e.period}</div></div><div style={{fontSize:11,color:red,fontWeight:500,marginBottom:6}}>{e.company}</div>{e.achievements?.map((a,j)=><div key={j} style={{fontSize:11,color:"#4b5563",lineHeight:1.7,paddingLeft:12,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:0,color:red}}>—</span>{a}</div>)}</div>)}</>}
          {d.projects?.length>0&&<><div style={sh}><span>Projects</span>{rule}</div>{d.projects.map((p,i)=><div key={i} style={{marginBottom:12}}><div style={{fontWeight:600,fontSize:12,color:"#111"}}>{p.name}</div><div style={{fontSize:11,color:"#6b7280",lineHeight:1.6}}>{p.description}</div></div>)}</>}
        </div>
        <div>
          {d.skills?.technical?.length>0&&<><div style={{...sh,marginTop:0}}><span>Skills</span>{rule}</div>{d.skills.technical.map((s,i)=><div key={i} style={{fontSize:11,color:"#374151",marginBottom:7,paddingBottom:7,borderBottom:"1px solid #fef2f2"}}>{s}</div>)}</>}
          {d.skills?.soft?.length>0&&<><div style={sh}><span>Soft</span>{rule}</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{d.skills.soft.map((s,i)=><span key={i} style={{fontSize:10,border:"1px solid #fecaca",color:red,padding:"2px 8px",borderRadius:3}}>{s}</span>)}</div></>}
          {d.education?.length>0&&<><div style={sh}><span>Education</span>{rule}</div>{d.education.map((e,i)=><div key={i} style={{marginBottom:12}}><div style={{fontWeight:600,fontSize:11,color:"#111"}}>{e.degree}</div><div style={{fontSize:10,color:red}}>{e.institution}</div><div style={{fontSize:10,color:"#9ca3af"}}>{e.year}</div></div>)}</>}
          {d.certifications?.length>0&&<><div style={sh}><span>Certs</span>{rule}</div>{d.certifications.map((c,i)=><div key={i} style={{fontSize:10,color:"#6b7280",marginBottom:5}}>· {c}</div>)}</>}
        </div>
      </div>
    </div>
  );
}

const CV_MAP = { apex:ApexCV, atlas:AtlasCV, aire:AireCV };

function TemplatePreview({ id, animClass }) {
  const Comp = CV_MAP[id];
  return (
    <div key={id} className={animClass}
      style={{ width:"100%", height:"100%", overflow:"hidden", position:"relative", background:"#fff" }}>
      <div style={{ position:"absolute", top:0, left:0, transformOrigin:"top left", transform:"scale(0.44)", width:"227%", pointerEvents:"none" }}>
        <Comp d={DEMO} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SHARED TOPBAR
══════════════════════════════════════════════════════════════════════ */
function Topbar({ accentColor, children }) {
  return (
    <div style={{ position:"relative", zIndex:10, height:64, display:"flex", alignItems:"center",
      padding:"0 32px", gap:14, borderBottom:`1px solid ${BORDER}`,
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      background:"rgba(8,8,8,0.82)", flexShrink:0,
      transition:"border-color 0.8s ease",
    }}>
      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:17, letterSpacing:"-0.01em" }}>
        <span style={{ color: accentColor, transition:"color 0.8s ease" }}>JOB</span>HUNTER
      </span>
      <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:"rgba(255,255,255,0.18)",
        border:`1px solid ${BORDER}`, padding:"2px 8px", borderRadius:4, letterSpacing:"0.1em" }}>
        CV BUILDER
      </span>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ARROW BUTTON
══════════════════════════════════════════════════════════════════════ */
function ArrowBtn({ onClick, label, children, accentColor, size = 44 }) {
  const ref = useRef(null);
  return (
    <button ref={ref} onClick={onClick} aria-label={label}
      style={{ width:size, height:size, borderRadius:"50%", background:"rgba(255,255,255,0.04)",
        border:`1px solid ${BORDER}`, color:"rgba(255,255,255,0.4)", cursor:"pointer",
        fontSize: size > 40 ? 17 : 14, display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.2s ease", backdropFilter:"blur(8px)", flexShrink:0 }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accentColor + "90";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.background = accentColor + "18";
        e.currentTarget.style.boxShadow = `0 0 16px ${accentColor}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.color = "rgba(255,255,255,0.4)";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >{children}</button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════════════════ */
export default function CVMaker() {
  const [phase,    setPhase]    = useState("pick");
  const [tplIdx,   setTplIdx]   = useState(0);
  const [animDir,  setAnimDir]  = useState("right");
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [cvData,   setCvData]   = useState(null);

  const [cssAccent, setCssAccent] = useState(PALETTE.apex.particle);
  const colorRef = useRef(new THREE.Color(PALETTE.apex.particle));
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    const link = document.createElement("link"); link.rel="stylesheet"; link.href=FONT_HREF;
    document.head.appendChild(link);
    const style = document.createElement("style"); style.textContent=GLOBAL_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  useEffect(() => {
    const id = TEMPLATES[tplIdx].id;
    const pal = PALETTE[id];
    colorRef.current = new THREE.Color(pal.particle);
    setCssAccent(pal.particle);
  }, [tplIdx]);

  const navigate = useCallback((dir) => {
    setAnimDir(dir > 0 ? "right" : "left");
    setTplIdx(prev => (prev + dir + TEMPLATES.length) % TEMPLATES.length);
  }, []);

  useEffect(() => {
    if (phase !== "pick") return;
    const h = (e) => {
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft")  navigate(-1);
      if (e.key === "Enter")      handleStart();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase, tplIdx, navigate]);

  /* ── handleStart — uses authHeaders() ── */
  async function handleStart() {
    const id = TEMPLATES[tplIdx].id;
    setPhase("chat"); setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: authHeaders(),                                         // ← FIXED
        body: JSON.stringify({ messages:[{ role:"user", content:"start" }], template: id }),
      });
      const data = await res.json();
      let text = data.reply || "";
      try { text = JSON.parse(text).message || text; } catch {}
      setMessages([{ role:"assistant", content:text }]);
    } catch {
      setMessages([{ role:"assistant", content:"Hi! Let's build your CV. What's your full name?" }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  /* ── send — uses authHeaders() ── */
  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role:"user", content:input.trim() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: authHeaders(),                                         // ← FIXED
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (data.status === "complete" && data.data) {
        setCvData(data.data);
        setMessages([...next, { role:"assistant", content:"Your CV is ready — take a look!" }]);
        setTimeout(() => setPhase("result"), 800);
      } else {
        setMessages([...next, { role:"assistant", content: data.reply || "Something went wrong." }]);
      }
    } catch {
      setMessages([...next, { role:"assistant", content:"Something went wrong. Please try again." }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function downloadPDF() {
    const el = document.getElementById("cv-shell");
    if (!el) return;
    const w = window.open("","_blank","width=900,height=700");
    w.document.write(`<!DOCTYPE html><html><head><link rel="stylesheet" href="${FONT_HREF}">
      <style>*{box-sizing:border-box;margin:0;padding:0}
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      @page{margin:0;size:A4}</style></head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 800);
  }

  const tpl = TEMPLATES[tplIdx];

  /* ════════════════════════════════════════
     PHASE: PICK
  ════════════════════════════════════════ */
  if (phase === "pick") {
    return (
      <div style={{ height:"100vh", background:BG, display:"flex", flexDirection:"column",
        overflow:"hidden", position:"relative" }}>
        <ThreeBackground colorRef={colorRef} />
        <div style={{
          position:"fixed", inset:0, zIndex:1, pointerEvents:"none",
          background:`radial-gradient(ellipse 70% 55% at 60% 50%, ${cssAccent}16 0%, transparent 68%)`,
          transition:"background 1.2s ease",
        }} />
        <Topbar accentColor={cssAccent}>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8,
            fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.22)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:cssAccent,
              animation:"blink 2s ease infinite", transition:"background 0.8s ease" }} />
            {tplIdx + 1} / {TEMPLATES.length}
          </div>
        </Topbar>
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr",
          position:"relative", zIndex:10, overflow:"hidden" }}>
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"center",
            padding:"0 52px", borderRight:`1px solid ${BORDER}` }}>
            <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", letterSpacing:"0.24em",
              textTransform:"uppercase", color:cssAccent, marginBottom:22,
              animation:"fadeUp 0.5s ease", transition:"color 0.8s ease" }}>
              ◈ AI-Powered · Cloud-Native · Karachi
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, lineHeight:0.86,
              letterSpacing:"-0.03em", fontSize:"clamp(3.2rem,5.2vw,5.4rem)", color:"#fff",
              marginBottom:20, animation:"fadeUp 0.55s ease 0.05s both" }}>
              BUILD<br />YOUR<br />
              <span style={{ WebkitTextStroke:"1.5px rgba(255,255,255,0.16)", color:"transparent" }}>
                NEXT CV
              </span>
            </h1>
            <div key={tpl.id} style={{ marginBottom:16, animation:"fadeUp 0.35s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                <span style={{ width:20, height:2.5, background:cssAccent, borderRadius:2,
                  flexShrink:0, transition:"background 0.8s ease" }} />
                <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20,
                  color:"#fff", letterSpacing:"-0.02em" }}>{tpl.label}</span>
              </div>
              <div style={{ paddingLeft:30, fontFamily:"'DM Mono',monospace", fontSize:9,
                color:"rgba(255,255,255,0.25)", letterSpacing:"0.2em", textTransform:"uppercase",
                marginBottom:10 }}>{tpl.sub}</div>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:12,
                color:"rgba(255,255,255,0.42)", lineHeight:1.85, maxWidth:320 }}>{tpl.desc}</p>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:28,
              animation:"fadeUp 0.5s ease 0.15s both" }}>
              <button onClick={handleStart}
                style={{ padding:"12px 28px", borderRadius:100, background:cssAccent,
                  color:"#000", border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
                  fontFamily:"'Syne',sans-serif", letterSpacing:"0.02em",
                  boxShadow:`0 0 24px ${cssAccent}40`,
                  transition:"background 0.8s ease, box-shadow 0.8s ease, opacity 0.15s, transform 0.15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.opacity="0.82"; e.currentTarget.style.transform="scale(1.04)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.transform=""; }}
              >Use {tpl.label} →</button>
              <ArrowBtn onClick={()=>navigate(-1)} label="Previous" accentColor={cssAccent}>←</ArrowBtn>
              <ArrowBtn onClick={()=>navigate(1)}  label="Next"     accentColor={cssAccent}>→</ArrowBtn>
            </div>
            <div style={{ display:"flex", gap:7, marginTop:24, animation:"fadeUp 0.5s ease 0.2s both" }}>
              {TEMPLATES.map((t,i) => (
                <button key={t.id}
                  onClick={() => { setAnimDir(i>tplIdx?"right":"left"); setTplIdx(i); }}
                  style={{ height:3, borderRadius:2, border:"none", cursor:"pointer", padding:0,
                    transition:"all 0.4s ease",
                    width: i===tplIdx ? 30 : 10,
                    background: i===tplIdx ? cssAccent : "rgba(255,255,255,0.15)" }}
                  aria-label={t.label}
                />
              ))}
            </div>
            <div style={{ marginTop:18, fontFamily:"'DM Mono',monospace", fontSize:9,
              color:"rgba(255,255,255,0.15)", letterSpacing:"0.1em" }}>
              ← → arrow keys · Enter to select
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            padding:"28px 44px", position:"relative" }}>
            <div style={{
              position:"absolute", inset:0,
              background:`radial-gradient(ellipse 65% 55% at 55% 50%, ${cssAccent}22 0%, transparent 70%)`,
              pointerEvents:"none", transition:"background 1s ease",
            }} />
            <div style={{
              position:"relative", width:"min(400px,100%)", aspectRatio:"0.707",
              borderRadius:12, overflow:"hidden",
              border:`1px solid ${cssAccent}25`,
              boxShadow:`0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.75), 0 0 80px ${cssAccent}28`,
              transition:"border-color 1s ease, box-shadow 1s ease",
            }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
                background:`linear-gradient(90deg, ${cssAccent}, ${cssAccent}88)`,
                zIndex:3, transition:"background 0.8s ease" }} />
              <TemplatePreview id={tpl.id} animClass={animDir==="right"?"tpl-enter-right":"tpl-enter-left"} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0,
                padding:"28px 18px 16px",
                background:"linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)", zIndex:3 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:15, color:"#fff" }}>{tpl.label}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8,
                  color:"rgba(255,255,255,0.38)", letterSpacing:"0.2em", textTransform:"uppercase" }}>{tpl.sub}</div>
              </div>
            </div>
            <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}>
              <ArrowBtn onClick={()=>navigate(-1)} label="Previous template" accentColor={cssAccent} size={38}>←</ArrowBtn>
            </div>
            <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>
              <ArrowBtn onClick={()=>navigate(1)} label="Next template" accentColor={cssAccent} size={38}>→</ArrowBtn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     PHASE: CHAT
  ════════════════════════════════════════ */
  if (phase === "chat") {
    return (
      <div style={{ height:"100vh", display:"flex", flexDirection:"column",
        background:BG, position:"relative" }}>
        <ThreeBackground colorRef={colorRef} />
        <div style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none",
          background:`radial-gradient(ellipse 60% 50% at 50% 0%, ${cssAccent}12 0%, transparent 70%)`,
          transition:"background 1.2s ease" }} />
        <Topbar accentColor={cssAccent}>
          <button onClick={()=>{ setPhase("pick"); setMessages([]); }}
            style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)",
              fontSize:12, fontFamily:"'DM Mono',monospace", padding:"6px 10px", borderRadius:8,
              transition:"color 0.15s", marginLeft:4 }}
            onMouseEnter={e=>e.currentTarget.style.color="#fff"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}
          >← Back</button>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8,
            background:`${cssAccent}14`, padding:"6px 14px", borderRadius:100, fontSize:11,
            fontFamily:"'DM Mono',monospace", color:"rgba(255,255,255,0.5)",
            border:`1px solid ${cssAccent}30`, transition:"background 0.8s ease, border-color 0.8s ease" }}>
            <span style={{ width:7, height:7, background:tpl.bar, borderRadius:"50%" }} />
            {tpl.label}
          </div>
        </Topbar>
        <div style={{ flex:1, overflow:"auto", padding:"32px 20px", position:"relative", zIndex:10 }}>
          <div style={{ maxWidth:600, margin:"0 auto", display:"flex", flexDirection:"column", gap:16 }}>
            {messages.map((m,i) => (
              <div key={i} style={{ animation:"fadeUp 0.3s ease", display:"flex",
                flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                {m.role==="assistant" && <div style={{ fontSize:9, fontFamily:"'DM Mono',monospace",
                  color:cssAccent, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6,
                  transition:"color 0.8s ease" }}>AI</div>}
                <div style={{ maxWidth:"82%", padding:"13px 18px",
                  borderRadius:m.role==="user"?"18px 18px 4px 18px":"4px 18px 18px 18px",
                  background:m.role==="user"?`${cssAccent}20`:SURF,
                  color:"rgba(255,255,255,0.88)", fontSize:13, lineHeight:1.75,
                  fontFamily:"'DM Mono',monospace",
                  border:m.role==="user"?`1px solid ${cssAccent}35`:`1px solid ${BORDER}`,
                  transition:"background 0.8s ease, border-color 0.8s ease" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ animation:"fadeUp 0.3s ease", display:"flex",
                flexDirection:"column", alignItems:"flex-start" }}>
                <div style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:cssAccent,
                  letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>AI</div>
                <div style={{ padding:"14px 18px", borderRadius:"4px 18px 18px 18px",
                  background:SURF, border:`1px solid ${BORDER}`, display:"flex", gap:5, alignItems:"center" }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%",
                    background:cssAccent, animation:`blink 1.2s ease-in-out ${i*0.2}s infinite`,
                    transition:"background 0.8s ease" }}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        </div>
        <div style={{ position:"relative", zIndex:10, background:"rgba(8,8,8,0.92)",
          backdropFilter:"blur(16px)", borderTop:`1px solid ${BORDER}`,
          padding:"16px 20px", flexShrink:0 }}>
          <div style={{ maxWidth:600, margin:"0 auto", display:"flex", gap:10, alignItems:"center" }}>
            <input ref={inputRef} value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
              placeholder="Type your answer…" disabled={loading}
              style={{ flex:1, padding:"13px 20px", borderRadius:100, border:`1px solid ${BORDER}`,
                fontSize:13, outline:"none", background:SURF, color:"#fff",
                fontFamily:"'DM Mono',monospace", transition:"border-color 0.2s" }}
              onFocus={e=>e.target.style.borderColor=`${cssAccent}70`}
              onBlur={e=>e.target.style.borderColor=BORDER}
            />
            <button onClick={send} disabled={loading||!input.trim()}
              style={{ width:46, height:46, borderRadius:"50%", flexShrink:0,
                background:(!input.trim()||loading)?"rgba(255,255,255,0.06)":cssAccent,
                color:(!input.trim()||loading)?"rgba(255,255,255,0.18)":"#000",
                border:"none", cursor:(!input.trim()||loading)?"not-allowed":"pointer",
                fontSize:18, fontWeight:"bold", display:"flex", alignItems:"center",
                justifyContent:"center", transition:"background 0.8s ease, color 0.15s" }}
            >→</button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     PHASE: RESULT
  ════════════════════════════════════════ */
  if (phase === "result" && cvData) {
    const ResultComp = CV_MAP[tpl.id];
    return (
      <div style={{ height:"100vh", display:"flex", flexDirection:"column",
        background:"#0c0c0c", position:"relative" }}>
        <ThreeBackground colorRef={colorRef} />
        <div style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none",
          background:`radial-gradient(ellipse 55% 40% at 50% 0%, ${cssAccent}10 0%, transparent 70%)`,
          transition:"background 1.2s ease" }} />
        <Topbar accentColor={cssAccent}>
          <button onClick={()=>setPhase("chat")}
            style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)",
              fontSize:12, fontFamily:"'DM Mono',monospace", padding:"6px 10px", borderRadius:8,
              transition:"color 0.15s", marginLeft:4 }}
            onMouseEnter={e=>e.currentTarget.style.color="#fff"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}
          >← Edit</button>
          <div style={{ width:1, height:14, background:BORDER }}/>
          <button onClick={()=>{ setPhase("pick"); setMessages([]); setCvData(null); }}
            style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)",
              fontSize:12, fontFamily:"'DM Mono',monospace", padding:"6px 10px", borderRadius:8,
              transition:"color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#fff"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}
          >Change Template</button>
          <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(255,255,255,0.2)" }}>
              {tpl.label} · {cvData.name}
            </span>
            <button onClick={downloadPDF}
              style={{ padding:"9px 24px", borderRadius:100, background:cssAccent, color:"#000",
                border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
                fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", gap:7,
                transition:"background 0.8s ease, opacity 0.15s",
                boxShadow:`0 0 20px ${cssAccent}40` }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.82"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}
            >↓ Download PDF</button>
          </div>
        </Topbar>
        <div style={{ flex:1, overflow:"auto", padding:"32px 20px", display:"flex",
          justifyContent:"center", position:"relative", zIndex:10 }}>
          <div style={{ width:"min(794px,100%)", boxShadow:"0 30px 100px rgba(0,0,0,0.8)",
            borderRadius:6, overflow:"hidden", animation:"fadeUp 0.4s ease", flexShrink:0 }}>
            <ResultComp d={cvData}/>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
