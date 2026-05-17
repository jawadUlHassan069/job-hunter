import { useRef, useCallback } from 'react'
import Particles from './Particles'

const ACCENT = '#1d9e75'
const TEXT   = '#0a0a0a'

function Rings() {
    const rings = [
        { size: 580, anim: 'spin1', dur: '34s', border: 'rgba(29,158,117,0.07)'  },
        { size: 400, anim: 'spin2', dur: '25s', border: 'rgba(29,158,117,0.12)'  },
        { size: 255, anim: 'spin3', dur: '18s', border: 'rgba(29,158,117,0.18)', dashed: true },
        { size: 135, anim: 'spin1', dur: '11s', border: 'rgba(29,158,117,0.24)', dashed: true },
    ]
    return (
        <>
            {rings.map((r, i) => (
                <div key={i} style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: r.size, height: r.size,
                    border: `1px ${r.dashed ? 'dashed' : 'solid'} ${r.border}`,
                    borderRadius: '50%', pointerEvents: 'none',
                    animation: `${r.anim} ${r.dur} linear infinite`,
                }} />
            ))}
        </>
    )
}

function AnimHeading({ lines, baseDelay = 0.25 }) {
    return (
        <div style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 900,
            fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
            lineHeight: 0.97, letterSpacing: '-0.025em', marginBottom: 22,
        }}>
            {lines.map((line, i) => (
                <div key={i} style={{ overflow: 'hidden' }}>
                    <div style={{
                        color: line.outline ? 'transparent' : '#fff',
                        WebkitTextStroke: line.outline ? '1.5px rgba(255,255,255,0.22)' : undefined,
                        animation: `revealWord 0.65s cubic-bezier(0.22,1,0.36,1) ${baseDelay + i * 0.1}s both`,
                    }}>
                        {line.text}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function BrandPanel({ mode }) {
    const panelRef = useRef(null)
    const innerRef = useRef(null)
    const rafRef   = useRef(null)

    const handleMouseMove = useCallback(e => {
        if (!panelRef.current || !innerRef.current) return
        const { left, top, width, height } = panelRef.current.getBoundingClientRect()
        const x = (e.clientX - left) / width  - 0.5
        const y = (e.clientY - top)  / height - 0.5
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
            if (innerRef.current)
                innerRef.current.style.transform = `translate(${x * 10}px, ${y * 8}px)`
        })
    }, [])

    const handleMouseLeave = useCallback(() => {
        if (innerRef.current) {
            innerRef.current.style.transition = 'transform 0.9s cubic-bezier(0.22,1,0.36,1)'
            innerRef.current.style.transform  = 'translate(0,0)'
            setTimeout(() => {
                if (innerRef.current) innerRef.current.style.transition = ''
            }, 900)
        }
    }, [])

    const loginLines    = [{ text: 'YOUR' }, { text: 'CAREER', outline: true }, { text: 'AWAITS.' }]
    const registerLines = [{ text: 'BUILD' }, { text: 'YOUR',  outline: true }, { text: 'FUTURE.' }]

    return (
        <div
            ref={panelRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                width: '42%', background: TEXT, position: 'relative',
                overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}
        >
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(ellipse 80% 55% at 50% 105%, ${ACCENT}28 0%, transparent 70%)`,
                animation: 'glowPulse 4.5s ease-in-out infinite',
            }} />
            <Rings />
            <Particles />

            <div ref={innerRef} style={{
                position: 'relative', zIndex: 1,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', height: '100%',
                padding: '44px 48px', willChange: 'transform',
            }}>
                {/* Logo */}
                <div style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}>
                    <div style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 900,
                        fontSize: 20, color: '#fff', letterSpacing: '-0.02em',
                    }}>
                        <span style={{ color: ACCENT }}>JOB</span>HUNTER
                    </div>
                </div>

                {/* Hero text */}
                <div>
                    <div style={{
                        fontSize: 10, fontFamily: "'DM Mono', monospace",
                        letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: ACCENT, marginBottom: 18,
                        animation: 'fadeUp 0.6s ease 0.2s both',
                    }}>
                        ◈ {mode === 'login' ? 'Welcome back' : mode === 'otp' ? 'Verify identity' : 'Get started'}
                    </div>
                    <AnimHeading lines={
                        mode === 'register'
                            ? registerLines
                            : loginLines
                    } />
                    <p style={{
                        fontFamily: "'DM Mono', monospace", fontStyle: 'italic',
                        fontSize: 12, color: 'rgba(255,255,255,0.28)',
                        lineHeight: 1.9, maxWidth: 255,
                        animation: 'fadeUp 0.6s ease 0.56s both',
                    }}>
                        {mode === 'login'
                            ? 'Sign in to access your CV builder, saved templates, and career tools.'
                            : mode === 'otp'
                            ? 'Complete two-factor authentication to secure your account.'
                            : 'Create your account and start building CVs that get you hired.'}
                    </p>
                </div>

                {/* Footer quote */}
                <div style={{ animation: 'fadeUp 0.6s ease 0.66s both' }}>
                    <div style={{
                        width: 28, height: 1, background: `${ACCENT}50`,
                        marginBottom: 12, animation: 'drawLine 0.9s ease 0.85s both',
                    }} />
                    <p style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 11,
                        color: 'rgba(255,255,255,0.18)', lineHeight: 1.85,
                    }}>
                        "The best CV is the one<br />that gets read."
                    </p>
                </div>
            </div>
        </div>
    )
}