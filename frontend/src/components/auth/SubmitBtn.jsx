import { useState } from 'react'

const ACCENT      = '#1d9e75'
const ACCENT_DARK = '#15724f'

export default function SubmitBtn({ children, loading, success, delay = 0 }) {
    const [hovered, setHovered] = useState(false)
    const [ripple,  setRipple]  = useState(null)

    function triggerRipple(e) {
        const rect = e.currentTarget.getBoundingClientRect()
        setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() })
        setTimeout(() => setRipple(null), 600)
    }

    return (
        <button
            type="submit"
            disabled={loading || success}
            onClick={triggerRipple}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: success ? '#16a34a' : loading ? `${ACCENT}80` : hovered ? ACCENT_DARK : ACCENT,
                color: '#fff', fontSize: 13,
                fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '0.06em',
                cursor: loading || success ? 'not-allowed' : 'pointer',
                transition: 'background 0.25s, transform 0.2s, box-shadow 0.25s',
                transform: hovered && !loading && !success ? 'translateY(-2px)' : 'none',
                boxShadow: hovered && !loading && !success
                    ? `0 10px 28px ${ACCENT}45`
                    : `0 2px 8px ${ACCENT}22`,
                position: 'relative', overflow: 'hidden',
                animation: `fadeUp 0.5s ease ${delay}s both`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            }}
        >
            {ripple && (
                <span ref={el => el && el.animate(
                    [{ transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
                     { transform: 'translate(-50%,-50%) scale(7)', opacity: 0 }],
                    { duration: 550, easing: 'ease-out', fill: 'forwards' }
                )} style={{
                    position: 'absolute', left: ripple.x, top: ripple.y,
                    width: 0, height: 0, background: 'rgba(255,255,255,0.28)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
            )}
            {hovered && !loading && !success && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.13) 50%, transparent 100%)',
                    backgroundSize: '200% auto', animation: 'shimmer 1.1s linear infinite',
                    pointerEvents: 'none',
                }} />
            )}
            {loading && (
                <div style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.28)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%', animation: 'spinLoader 0.7s linear infinite',
                    flexShrink: 0,
                }} />
            )}
            {success && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{ animation: 'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1)', flexShrink: 0 }}>
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="#fff" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
            <span>{success ? 'Done!' : loading ? 'Please wait…' : children}</span>
        </button>
    )
}