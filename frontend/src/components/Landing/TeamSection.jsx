import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TEAM, ACCENT } from "@/data.js";

gsap.registerPlugin(ScrollTrigger);

gsap.registerPlugin(ScrollTrigger);

export default function TeamSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".team-header",
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 82%", once: true },
        }
      );
      gsap.fromTo(".team-card",
        { opacity: 0, y: 35 },
        {
          opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: ".team-grid", start: "top 80%", once: true },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="team"
      ref={sectionRef}
      className="py-20 sm:py-28 px-4 sm:px-6"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="team-header opacity-0 mb-10 sm:mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div
              className="text-xs font-mono-ui mb-3 tracking-[0.22em] uppercase"
              style={{ color: ACCENT }}
            >
              ◈ The Team
            </div>
            <h2
              className="text-4xl sm:text-5xl font-black font-heading leading-tight"
              style={{ color: "var(--text)" }}
            >
              BSE 6A · Spring 2026
            </h2>
          </div>
          <p
            className="text-sm max-w-xs leading-relaxed font-mono-ui"
            style={{ color: "var(--text-muted)" }}
          >
            CSL 220 Cloud Computing
            <br />
            Bahria University Karachi Campus
          </p>
        </div>

        {/* Cards */}
        <div className="team-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((m) => (
            <div
              key={m.enroll}
              className="team-card opacity-0 rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background:   "var(--card-bg)",
                border:       "1px solid var(--card-border)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${m.color}35`;
                e.currentTarget.style.boxShadow   = `0 8px 30px ${m.color}12`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--card-border)";
                e.currentTarget.style.boxShadow   = "none";
              }}
            >
              {/* Avatar + lead badge */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs font-heading flex-shrink-0"
                  style={{ background: `${m.color}20`, color: m.color }}
                >
                  {m.initials}
                </div>
                {m.lead && (
                  <span
                    className="text-[10px] font-mono-ui px-2 py-1 rounded-full"
                    style={{
                      background: `${ACCENT}18`,
                      color:      ACCENT,
                      border:     `1px solid ${ACCENT}28`,
                    }}
                  >
                    Lead
                  </span>
                )}
              </div>

              {/* Name */}
              <div
                className="font-bold text-base font-heading mb-1 leading-tight"
                style={{ color: "var(--text)" }}
              >
                {m.name}
              </div>

              {/* Role */}
              <div
                className="text-xs font-mono-ui mb-4"
                style={{ color: `${m.color}AA` }}
              >
                {m.role}
              </div>

              {/* Enrollment */}
              <div
                className="text-[10px] font-mono-ui"
                style={{ color: "var(--text-faint)" }}
              >
                {m.enroll}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
