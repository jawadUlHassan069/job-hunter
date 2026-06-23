// src/pages/CVMakerPage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApexCV from "../components/ApexCV";
import AtlasCV from "../components/AtlasCV";
import AireCV from "../components/AireCV";

const BASE = "http://localhost:8000";

const TEMPLATES = [
  { id: "apex",  label: "Apex",  sub: "Classic · Corporate" },
  { id: "atlas", label: "Atlas", sub: "Modern · Structured"  },
  { id: "aire",  label: "Aire",  sub: "Editorial · Minimal"  },
];

const CV_MAP = { apex: ApexCV, atlas: AtlasCV, aire: AireCV };

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hi! I'll help you build a professional CV. Let's start — what's your full name and the job title you're targeting?",
};

export default function CVMakerPage() {
  const navigate = useNavigate();
  const [phase,     setPhase]     = useState("pick");
  const [tplIdx,    setTplIdx]    = useState(0);
  const [messages,  setMessages]  = useState([INITIAL_MESSAGE]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [cvData,    setCvData]    = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const tpl = TEMPLATES[tplIdx];
  const CVComponent = CV_MAP[tpl.id];

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when entering chat
  useEffect(() => {
    if (phase === "chat") inputRef.current?.focus();
  }, [phase]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/api/cv/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ message: currentInput, session_id: sessionId }),
      });

      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message || data.reply || "Got it! Tell me more.",
      }]);

      if (data.complete && data.cv_data) {
        setCvData(data.cv_data);
        setPhase("result");
      } else if (data.cv_data) {
        // Partial data — update live preview
        setCvData(data.cv_data);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${BASE}/api/cv/download/${sessionId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `CV_${tpl.label}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f3f6ff", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top Bar ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px" }}>JOBHUNTER</span>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>CV MAKER</span>
          {phase !== "pick" && (
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(29,158,117,0.15)", border: "1px solid rgba(29,158,117,0.3)", color: "#1d9e75", fontFamily: "monospace" }}>{tpl.label}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {phase !== "pick" && (
            <button
              onClick={() => { setPhase("pick"); setMessages([INITIAL_MESSAGE]); setCvData(null); setSessionId(null); }}
              style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}
            >
              Change Template
            </button>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* ── PHASE: TEMPLATE PICKER ── */}
      {phase === "pick" && (
        <div style={{ paddingTop: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "100px 24px 40px" }}>
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", color: "#1d9e75", marginBottom: 16 }}>◈ STEP 1 OF 2</div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, marginBottom: 12, textAlign: "center", letterSpacing: "-0.03em" }}>Choose Your CV Style</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 56, textAlign: "center", maxWidth: 400, fontSize: 15 }}>Select a template. The AI will fill it with your details.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, width: "100%", maxWidth: 900 }}>
            {TEMPLATES.map((t, i) => (
              <div
                key={t.id}
                onClick={() => { setTplIdx(i); setPhase("chat"); }}
                style={{
                  cursor: "pointer", borderRadius: 20, overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#1d9e75"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(29,158,117,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ height: 200, background: "linear-gradient(135deg, #111 0%, #1a1a2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>📄</div>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{t.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHASE: CHAT + PREVIEW ── */}
      {phase === "chat" && (
        <div style={{ paddingTop: 60, display: "flex", height: "100vh" }}>

          {/* Chat Panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.08)", minWidth: 0 }}>
            {/* Chat header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1d9e75", boxShadow: "0 0 0 2px rgba(29,158,117,0.3)" }} />
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>AI AGENT · BUILDING YOUR CV</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && (
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(29,158,117,0.2)", border: "1px solid rgba(29,158,117,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginRight: 8, marginTop: 2 }}>◈</div>
                  )}
                  <div style={{
                    maxWidth: "72%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                    background: m.role === "user" ? "#1d9e75" : "rgba(255,255,255,0.07)",
                    border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
                    color: m.role === "user" ? "#000" : "rgba(255,255,255,0.88)",
                    fontSize: 14, lineHeight: 1.65,
                    fontWeight: m.role === "user" ? 500 : 400,
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(29,158,117,0.2)", border: "1px solid rgba(29,158,117,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>◈</div>
                  <div style={{ padding: "12px 16px", borderRadius: "4px 18px 18px 18px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 5, alignItems: "center" }}>
                    {[0,1,2].map(j => (
                      <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: "#1d9e75", animation: `dot${j} 1.2s infinite`, opacity: 0.7 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type your answer here…"
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: "12px 18px", color: "#f3f6ff", fontSize: 14,
                    outline: "none", fontFamily: "inherit",
                    transition: "border-color .2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(29,158,117,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  style={{
                    padding: "12px 24px", borderRadius: 12, border: "none",
                    background: input.trim() && !loading ? "#1d9e75" : "rgba(255,255,255,0.06)",
                    color: input.trim() && !loading ? "#000" : "rgba(255,255,255,0.3)",
                    fontWeight: 700, fontSize: 14, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                    transition: "all .2s",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div style={{ width: "42%", overflowY: "auto", background: "#fff", flexShrink: 0 }}>
            {cvData
              ? <CVComponent d={cvData} />
              : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "rgba(0,0,0,0.25)", padding: 40 }}>
                  <div style={{ fontSize: 48 }}>📄</div>
                  <div style={{ fontSize: 14, textAlign: "center" }}>Your CV preview will appear here as you answer questions</div>
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* ── PHASE: RESULT ── */}
      {phase === "result" && cvData && (
        <div style={{ paddingTop: 80, padding: "80px 32px 60px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", color: "#1d9e75", marginBottom: 10 }}>◈ YOUR CV IS READY</div>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, letterSpacing: "-0.03em" }}>Looking great!</h1>
          </div>

          <div style={{ maxWidth: 860, margin: "0 auto 40px", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
            <CVComponent d={cvData} />
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
            <button
              onClick={downloadPDF}
              style={{ padding: "14px 36px", borderRadius: 100, background: "#1d9e75", color: "#000", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", transition: "opacity .15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Download PDF
            </button>
            <button
              onClick={() => setPhase("chat")}
              style={{ padding: "14px 36px", borderRadius: 100, background: "transparent", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 15, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}
            >
              Edit CV
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              style={{ padding: "14px 36px", borderRadius: 100, background: "transparent", color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 15, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
            >
              Dashboard →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dot0 { 0%,100%{opacity:.2} 33%{opacity:1} }
        @keyframes dot1 { 0%,100%{opacity:.2} 66%{opacity:1} }
        @keyframes dot2 { 0%,100%{opacity:.2} 99%{opacity:1} }
        @media(max-width:768px) {
          .cv-preview-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
