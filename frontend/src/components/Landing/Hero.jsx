// src/components/landing/Hero.jsx
import HolographicHero from './HolographicHero';


export default function Hero({ onFeatureClick }) {
  return (
    <section className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center pt-16">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center relative z-10">

        {/* ── Left copy ── */}
        <div className="lg:col-span-7 space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/30 bg-black/40 backdrop-blur-md text-emerald-400 text-sm font-medium tracking-wider">
            AI-POWERED • CLOUD-NATIVE • KARACHI
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-none text-white">
            FIND YOUR <span className="text-emerald-400">NEXT ROLE</span><br />
            FASTER.
          </h1>

          <p className="text-xl text-gray-400 max-w-lg">
            Upload your CV. Our AI analyzes your experience, matches you to the best roles,
            and shows exactly which skills you need to close the gap.
          </p>

          {/* ── CTA buttons — fixed: removed duplicate, fixed className="..." ── */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => onFeatureClick?.('cv-analysis')}
              className="btn-primary"
            >
              Upload CV for Analysis →
            </button>

            <button
              onClick={() => onFeatureClick?.('cv-maker')}
              className="btn-secondary"
            >
              Build CV
            </button>

            <button
              onClick={() => onFeatureClick?.('job-scraping')}
              className="btn-secondary"
            >
              Find Jobs
            </button>
          </div>
        </div>

        {/* ── Holographic widget ── */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end animate-slide-up">
          <div className="w-full max-w-[520px]">
            <HolographicHero />
          </div>
        </div>
      </div>

      {/* Bottom ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
    </section>
  );
}
