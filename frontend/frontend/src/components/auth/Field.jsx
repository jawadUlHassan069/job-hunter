import { useState } from 'react'

const ACCENT  = '#1d9e75'
const MUTED   = 'rgba(0,0,0,0.35)'
const BORDER  = 'rgba(0,0,0,0.08)'
const WHITE   = '#ffffff'
const SURFACE = '#fafaf8'
const TEXT    = '#0a0a0a'

export default function Field({
    label, type = 'text', placeholder,
    value, onChange, id, delay = 0, error
}) {
    const [focused, setFocused] = useState(false)
    const [show,    setShow]    = useState(false)
    const isPassword = type === 'password'
    const hasVal     = value.length > 0

    return (
        <div style={{ animation: `fadeUp 0.5s ease ${delay}s both` }}>
            <label htmlFor={id} style={{
                display: 'block', fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: error ? '#dc2626' : focused ? ACCENT : MUTED,
                marginBottom: 7, transition: 'color 0.2s',
            }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    type={isPassword ? (show ? 'text' : 'password') : type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={()  => setFocused(false)}
                    style={{
                        width: '100%',
                        padding: isPassword ? '13px 50px 13px 16px' : '13px 16px',
                        borderRadius: 10,
                        border: `1.5px solid ${error ? '#fca5a5' : focused ? `${ACCENT}55` : BORDER}`,
                        background: focused ? WHITE : SURFACE,
                        color: TEXT, fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                        outline: 'none',
                        transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s, transform 0.2s',
                        boxShadow: focused
                            ? `0 0 0 4px ${error ? '#fca5a520' : `${ACCENT}14`}, 0 2px 12px rgba(0,0,0,0.06)`
                            : '0 1px 3px rgba(0,0,0,0.04)',
                        transform: focused ? 'translateY(-1px)' : 'none',
                    }}
                />
                {/* filled check */}
                {hasVal && !focused && !isPassword && !error && (
                    <div style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)',
                        width: 16, height: 16,
                        background: `${ACCENT}18`, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'checkPop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 4.5L3.5 6.5L7.5 2.5"
                                stroke={ACCENT} strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
                {/* show/hide password */}
                {isPassword && (
                    <button type="button" onClick={() => setShow(p => !p)} style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, fontFamily: "'DM Mono', monospace",
                        color: focused ? ACCENT : MUTED,
                        transition: 'color 0.2s', padding: '2px 4px',
                    }}>
                        {show ? 'hide' : 'show'}
                    </button>
                )}
            </div>
            {error && (
                <div style={{
                    fontSize: 11, fontFamily: "'DM Mono', monospace",
                    color: '#dc2626', marginTop: 5,
                    animation: 'fadeUp 0.25s ease',
                }}>
                    {error}
                </div>
            )}
        </div>
    )
}