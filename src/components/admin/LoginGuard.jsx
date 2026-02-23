import { useState } from 'react'
import { Lock, Eye, EyeOff, ChefHat } from 'lucide-react'

// Özel logo
const logoModules = import.meta.glob('../../assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['../../assets/logo.png'] ?? null

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'


export default function LoginGuard({ children }) {
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('mm_admin') === '1')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState(false)
    const [shake, setShake] = useState(false)

    const handleLogin = (e) => {
        e.preventDefault()
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('mm_admin', '1')
            setAuthed(true)
        } else {
            setError(true)
            setShake(true)
            setTimeout(() => setShake(false), 500)
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem('mm_admin')
        setAuthed(false)
        setPassword('')
    }

    if (authed) return children(handleLogout)

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: '24px',
                paddingRight: '24px',
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                background: 'linear-gradient(160deg, #EDE9FE 0%, #F5F3FF 40%, #EEF2FF 100%)',
                overflowY: 'auto',
            }}
        >
            {/* Card */}
            <div
                className={`w-full max-w-md rounded-3xl overflow-hidden ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
                style={{
                    background: 'white',
                    boxShadow: '0 12px 48px rgba(108,92,231,0.18)',
                }}
            >
                {/* Header band */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingTop: '48px',
                        paddingBottom: '48px',
                        paddingLeft: '32px',
                        paddingRight: '32px',
                        background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4DD4 100%)',
                    }}
                >
                    <div
                        style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.18)',
                            border: '3px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        }}
                    >
                        {logoSrc
                            ? <img src={logoSrc} alt="MenuMind" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <ChefHat size={36} color="white" />
                        }
                    </div>
                    <h1
                        style={{ fontSize: '30px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.01em', margin: 0 }}
                    >
                        MenuMind
                    </h1>
                    <p style={{ fontSize: '15px', marginTop: '8px', color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif' }}>
                        Admin Paneli
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleLogin}
                    style={{
                        padding: '32px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                    }}
                >
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 600,
                                marginBottom: '10px',
                                color: '#475569',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            Yönetici Şifresi
                        </label>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: '#F8FAFC',
                                border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`,
                                transition: 'border-color 0.2s',
                            }}
                        >
                            <div style={{
                                width: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Lock size={17} style={{ color: '#94A3B8' }} />
                            </div>
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(false) }}
                                placeholder="Yönetici şifresi"
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    padding: '16px 0',
                                    fontSize: '16px',
                                    outline: 'none',
                                    background: 'transparent',
                                    color: '#1E293B',
                                    border: 'none',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                                autoComplete="current-password"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                tabIndex={-1}
                                style={{
                                    width: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {showPw
                                    ? <EyeOff size={17} style={{ color: '#94A3B8' }} />
                                    : <Eye size={17} style={{ color: '#94A3B8' }} />
                                }
                            </button>
                        </div>
                        {error && (
                            <p style={{ fontSize: '14px', marginTop: '10px', color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
                                ⚠️ Yanlış şifre. Tekrar deneyin.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '16px',
                            fontWeight: 700,
                            fontSize: '16px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #6C5CE7, #5A4DD4)',
                            boxShadow: '0 4px 18px rgba(108,92,231,0.4)',
                            letterSpacing: '0.02em',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'transform 0.1s',
                        }}
                    >
                        Giriş Yap
                    </button>
                </form>
            </div>

            {/* Bottom hint */}
            <p className="mt-8 text-sm text-center" style={{ color: '#94A3B8' }}>
                MenuMind · Restoran Yönetim Sistemi
            </p>
        </div>
    )
}
