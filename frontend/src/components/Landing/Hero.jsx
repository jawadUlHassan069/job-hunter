// src/components/Landing/Hero.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import HolographicHero from "./HolographicHero";

/* ─── Three.js particle background ──────────────────────────────── */
function ThreeParticles() {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.offsetWidth || window.innerWidth;
    const H = el.offsetHeight || window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
    camera.position.z = 6;
    const COUNT = 1200;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const alpha = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   = (Math.random()-0.5)*24;
      pos[i*3+1] = (Math.random()-0.5)*18;
      pos[i*3+2] = (Math.random()-0.5)*12;
      sizes[i]   = Math.random()*1.5+0.2;
      alpha[i]   = Math.random()*0.4+0.06;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos,   3));
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("alpha",    new THREE.BufferAttribute(alpha, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#1d9e75") } },
      vertexShader: `
        attribute float size; attribute float alpha; varying float vAlpha;
        uniform float uTime;
        void main() {
          vAlpha = alpha;
          vec3 p = position;
          p.y += sin(uTime*0.20+position.x*0.5)*0.06;
          p.x += cos(uTime*0.15+position.z*0.4)*0.04;
          vec4 mv = modelViewMatrix*vec4(p,1.0);
          gl_PointSize = size*(240.0/-mv.z);
          gl_Position  = projectionMatrix*mv;
        }`,
      fragmentShader: `
        varying float vAlpha; uniform vec3 uColor;
        void main() {
          float d = length(gl_PointCoord-0.5);
          if(d>0.5) discard;
          gl_FragColor = vec4(uColor,(1.0-smoothstep(0.18,0.5,d))*vAlpha*0.65);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    const lm = new THREE.LineBasicMaterial({ color:0x1d9e75, transparent:true, opacity:0.025 });
    for(let i=-5;i<=5;i++){
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-12,i*1.7,-4),new THREE.Vector3(12,i*1.7,-4)]),lm));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i*1.7,-12,-4),new THREE.Vector3(i*1.7,12,-4)]),lm));
    }
    let mx=0,my=0;
    const onMouse = e=>{ mx=(e.clientX/window.innerWidth-0.5)*2; my=(e.clientY/window.innerHeight-0.5)*2; };
    window.addEventListener("mousemove",onMouse,{passive:true});
    const onResize = ()=>{ const w=el.offsetWidth||window.innerWidth,h=el.offsetHeight||window.innerHeight; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); };
    window.addEventListener("resize",onResize);
    let raf;
    const tick = t=>{ raf=requestAnimationFrame(tick); mat.uniforms.uTime.value=t*0.001; pts.rotation.y=t*0.00004; camera.position.x+=(mx*0.15-camera.position.x)*0.025; camera.position.y+=(-my*0.10-camera.position.y)*0.025; renderer.render(scene,camera); };
    raf=requestAnimationFrame(tick);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("mousemove",onMouse); window.removeEventListener("resize",onResize); renderer.dispose(); geo.dispose(); mat.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, []);
  return <div ref={mountRef} style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }} />;
}

/* ─── Hero ───────────────────────────────────────────────────────── */
export default function Hero({ onFeatureClick }) {
  return (
    <section style={{
      minHeight:  "calc(100vh - 60px)",
      background: "var(--bg, #060816)",
      position:   "relative",
      overflow:   "hidden",
      display:    "flex",
      alignItems: "center",
      paddingTop: "80px",
      paddingBottom: "60px",
    }}>
      <ThreeParticles />

      {/* Ambient glows */}
      <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
        background:"radial-gradient(ellipse 50% 60% at 8% 50%,rgba(29,158,117,0.11) 0%,transparent 55%),radial-gradient(ellipse 30% 35% at 92% 15%,rgba(55,138,221,0.06) 0%,transparent 55%)" }} />

      {/* Content */}
      <div style={{ position:"relative", zIndex:2, maxWidth:1100, margin:"0 auto", padding:"0 32px", width:"100%",
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"center" }}>

        {/* Left */}
        <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
          {/* Tag */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"5px 14px", borderRadius:100,
            border:"1px solid rgba(29,158,117,0.28)", background:"rgba(29,158,117,0.07)",
            color:"#1d9e75", fontSize:10, fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", width:"fit-content" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:"#1d9e75", flexShrink:0, animation:"pulse-dot 2s ease-in-out infinite" }} />
            AI-POWERED · CLOUD-NATIVE · KARACHI
          </div>

          {/* Headline */}
          <h1 style={{ margin:0, fontFamily:"'Syne',sans-serif", fontWeight:900,
            fontSize:"clamp(2.2rem,4vw,3.8rem)", lineHeight:1.0, letterSpacing:"-0.04em", color:"var(--text, #f3f6ff)" }}>
            FIND YOUR <span style={{ color:"#1d9e75" }}>NEXT ROLE</span><br />FASTER.
          </h1>

          {/* Subtext */}
          <p style={{ margin:0, fontSize:13, lineHeight:1.8, color:"var(--text-muted,rgba(243,246,255,0.60))",
            fontFamily:"'DM Mono',monospace", maxWidth:400 }}>
            Upload your CV — AI parses it with Gemini, scores it for ATS,
            then semantically matches you to jobs via RAG + ChromaDB.
          </p>

          {/* CTAs */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={() => onFeatureClick?.("cv-analysis")} style={{
              padding:"11px 22px", borderRadius:9, background:"#1d9e75", color:"#fff",
              border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
              fontFamily:"'DM Mono',monospace", letterSpacing:"0.04em",
              transition:"opacity 0.2s,transform 0.2s", boxShadow:"0 4px 18px rgba(29,158,117,0.32)" }}
              onMouseEnter={e=>{e.currentTarget.style.opacity="0.88";e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="none";}}
            >Upload CV →</button>
            <button onClick={() => onFeatureClick?.("cv-maker")} style={{
              padding:"11px 22px", borderRadius:9, background:"rgba(255,255,255,0.05)",
              color:"var(--text-soft,rgba(243,246,255,0.80))", border:"1px solid rgba(255,255,255,0.15)",
              cursor:"pointer", fontSize:13, fontFamily:"'DM Mono',monospace", letterSpacing:"0.04em", transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.09)";e.currentTarget.style.color="var(--text,#f3f6ff)";e.currentTarget.style.borderColor="rgba(29,158,117,0.35)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color="rgba(243,246,255,0.80)";e.currentTarget.style.borderColor="rgba(255,255,255,0.15)";}}
            >Build CV</button>
          </div>

          {/* Badges */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:18 }}>
            {[["◎","ATS Score"],["◈","RAG Matching"],["◑","Skill Gap"],["✦","CV Builder"]].map(([icon,label])=>(
              <div key={label} style={{ display:"flex", alignItems:"center", gap:5,
                fontSize:11, fontFamily:"'DM Mono',monospace", color:"var(--text-muted,rgba(243,246,255,0.50))" }}>
                <span style={{ color:"#1d9e75" }}>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — holographic widget */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center",
          overflow:"hidden", borderRadius:14, transform:"scale(0.85)", transformOrigin:"center center" }}>
          <HolographicHero />
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, zIndex:2, pointerEvents:"none",
        background:"linear-gradient(to bottom,transparent,var(--bg,#060816))" }} />

      <style>{`
        @media(max-width:768px){
          .hero-content-grid { grid-template-columns:1fr !important; }
          .hero-holo { display:none !important; }
        }
      `}</style>
    </section>
  );
}
