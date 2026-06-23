// src/components/landing/BentoGrid.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BENTO_CARDS } from "@/data.js";

gsap.registerPlugin(ScrollTrigger);

/* ─── Single card ───────────────────────────────────────────────── */
function BentoCard({ card }) {
  const ref = useRef(null);

  const enter = () => {
    if (!ref.current) return;
    ref.current.style.borderColor = `${card.accent}50`;
    ref.current.style.boxShadow   = `0 0 50px ${card.accent}16`;
  };
  const leave = () => {
    if (!ref.current) return;
    ref.current.style.borderColor = `${card.accent}14`;
    ref.current.style.boxShadow   = "none";
  };

  return (
    <div
      ref={ref}
      onMouseEnter={enter}
      onMouseLeave={leave}
      className={`bento-card group rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer ${card.span}`}
      style={{
        background:  "var(--card-bg)",
        border:      `1px solid ${card.accent}14`,
        minHeight:   card.large ? "340px" : "200px",
        transition:  "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <div>
        {/* Tag */}
        <div
          className="text-[10px] sm:text-xs font-mono-ui mb-2 sm:mb-3 tracking-[0.2em] uppercase"
          style={{ color: `${card.accent}90` }}
        >
          {card.tag}
        </div>

        {/* Headline — theme-aware */}
        <h3
          className={`font-black font-heading leading-tight mb-2 sm:mb-3 ${
            card.large ? "text-2xl sm:text-3xl md:text-4xl" : "text-lg sm:text-xl"
          }`}
          style={{ color: "var(--text)" }}
        >
          {card.headline}
        </h3>

        {/* Body — theme-aware muted */}
        <p
          className="text-xs sm:text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {card.body}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 sm:mt-6">
        <span
          className="text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 inline-block"
          style={{ color: card.accent }}
          aria-hidden="true"
        >
          {card.icon}
        </span>
        <span
          className="text-xs font-mono-ui transition-colors duration-300"
          style={{ color: "var(--text-faint)" }}
        >
          Learn more →
        </span>
      </div>
    </div>
  );
}

/* ─── Grid ──────────────────────────────────────────────────────── */
export default function BentoGrid() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".bento-header",
        { opacity: 0, y: 35 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
        }
      );
      gsap.fromTo(".bento-card",
        { opacity: 0, y: 45, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.65,
          stagger: { amount: 0.5, from: "start" },
          ease: "power3.out",
          scrollTrigger: { trigger: ".bento-grid", start: "top 78%", once: true },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bento-header opacity-0 mb-10 sm:mb-14">
          <div
            className="text-xs font-mono-ui mb-3 tracking-[0.22em] uppercase"
            style={{ color: "#1d9e75" }}
          >
            ◈ Everything You Need
          </div>
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-black font-heading leading-tight"
            style={{ color: "var(--text)" }}
          >
            Built for
            <br />
            <span className="text-outline">every step</span>
          </h2>
        </div>

        {/* Grid */}
        <div
          className="bento-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          style={{ gridAutoRows: "minmax(190px, auto)" }}
        >
          {BENTO_CARDS.map((card) => (
            <BentoCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
