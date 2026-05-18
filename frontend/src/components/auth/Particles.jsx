import { useRef } from 'react'

const ACCENT = '#1d9e75'

export default function Particles() {
    const pts = useRef(
        Array.from({ length: 14 }, (_, i) => ({
            id:    i,
            left:  `${8  + Math.random() * 84}%`,
            top:   `${15 + Math.random() * 72}%`,
            size:  1.5 + Math.random() * 2,
            dur:   6   + Math.random() * 9,
            delay: Math.random() * 9,
        }))
    ).current

    return (
        <>
            {pts.map(p => (
                <div key={p.id} style={{
                    position: 'absolute', left: p.left, top: p.top,
                    width: p.size, height: p.size,
                    borderRadius: '50%', background: ACCENT,
                    opacity: 0, pointerEvents: 'none',
                    animation: `particleDrift ${p.dur}s ease-in-out ${p.delay}s infinite`,
                }} />
            ))}
        </>
    )
}