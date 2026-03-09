import { useState, useEffect } from 'react'
import { Lock, Mail, Eye, EyeOff, ChefHat } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const logoModules = import.meta.glob('../../assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['../../assets/logo.png'] ?? null

export default function LoginGuard({ children }) {
    const [session, setSession] = useState(undefined)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [shake, setShake] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
        return () => subscription.unsubscribe()
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) return
        setLoading(true)
        setError('')
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        setLoading(false)
        if (authError) {
            setError('E-posta veya şifre hatalı.')
            setShake(true)
            setTimeout(() => setShake(false), 500)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setEmail('')
        setPassword('')
    }

    if (session === undefined) return null
    if (session) return children(handleLogout)

    /* ── Giriş Ekranı ── */
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            background: 'linear-gradient(155deg, #F7F1F4 0%, #FAF3F6 50%, #F5EEF2 100%)',
            position: 'fixed', inset: 0,
            overflow: 'auto',
        }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'fixed', top: '-120px', right: '-120px',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(123,45,69,0.08) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed', bottom: '-100px', left: '-100px',
                width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(123,45,69,0.05) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* Card */}
            <div
                style={{
                    width: '100%', maxWidth: '420px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(92,31,49,0.15), 0 4px 16px rgba(0,0,0,0.06)',
                    background: 'white',
                    animation: shake ? 'shake 0.4s ease' : 'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)',
                    position: 'relative',
                }}
                className={shake ? '' : 'animate-scale-in'}
            >
                {/* Header band */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '44px 32px 40px',
                    background: 'linear-gradient(145deg, #7B2D45 0%, #5C1F31 100%)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Glow circle */}
                    <div style={{
                        position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                        width: '260px', height: '260px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    {/* Logo */}
                    <div style={{
                        width: '72px', height: '72px',
                        borderRadius: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '22px', overflow: 'hidden',
                        background: 'rgba(255,255,255,0.15)',
                        border: '2px solid rgba(255,255,255,0.25)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                        position: 'relative',
                    }}>
                        {logoSrc
                            ? <img src={logoSrc} alt="MenuMind" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <ChefHat size={30} color="white" />
                        }
                    </div>

                    <h1 style={{
                        fontSize: '26px', fontWeight: 800,
                        color: 'white', fontFamily: 'Poppins',
                        margin: 0, letterSpacing: '-0.02em',
                    }}>
                        MenuMind
                    </h1>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        marginTop: '8px',
                        padding: '4px 12px', borderRadius: '100px',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.18)',
                    }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.80)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                            Admin Paneli
                        </span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {/* E-posta */}
                    <div>
                        <label style={{
                            display: 'block', fontSize: '12.5px',
                            fontWeight: 600, marginBottom: '8px',
                            color: 'var(--text2)', fontFamily: 'Inter, sans-serif',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            E-posta
                        </label>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            borderRadius: '12px', overflow: 'hidden',
                            background: 'var(--surface2)',
                            border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border2)'}`,
                            transition: 'border-color 0.18s, box-shadow 0.18s',
                        }}>
                            <div style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Mail size={15} style={{ color: 'var(--muted)' }} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setError('') }}
                                placeholder="admin@example.com"
                                autoComplete="email"
                                autoFocus
                                style={{
                                    flex: 1, padding: '13px 0',
                                    fontSize: '14.5px', outline: 'none',
                                    background: 'transparent', color: 'var(--text)',
                                    border: 'none', fontFamily: 'Inter, sans-serif',
                                }}
                            />
                        </div>
                    </div>

                    {/* Şifre */}
                    <div>
                        <label style={{
                            display: 'block', fontSize: '12.5px',
                            fontWeight: 600, marginBottom: '8px',
                            color: 'var(--text2)', fontFamily: 'Inter, sans-serif',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            Şifre
                        </label>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            borderRadius: '12px', overflow: 'hidden',
                            background: 'var(--surface2)',
                            border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border2)'}`,
                            transition: 'border-color 0.18s',
                        }}>
                            <div style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Lock size={15} style={{ color: 'var(--muted)' }} />
                            </div>
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError('') }}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                style={{
                                    flex: 1, padding: '13px 0',
                                    fontSize: '14.5px', outline: 'none',
                                    background: 'transparent', color: 'var(--text)',
                                    border: 'none', fontFamily: 'Inter, sans-serif',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                tabIndex={-1}
                                style={{
                                    width: '44px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                }}
                            >
                                {showPw
                                    ? <EyeOff size={15} style={{ color: 'var(--muted)' }} />
                                    : <Eye size={15} style={{ color: 'var(--muted)' }} />
                                }
                            </button>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                marginTop: '8px', padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'var(--danger-soft)',
                                border: '1px solid rgba(239,68,68,0.18)',
                            }}>
                                <span style={{ fontSize: '13px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}>
                                    {error}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '15px',
                            borderRadius: '12px',
                            fontWeight: 700, fontSize: '15px', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            background: loading
                                ? 'var(--border2)'
                                : 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
                            boxShadow: loading ? 'none' : '0 4px 20px rgba(123,45,69,0.35)',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            marginTop: '4px',
                            transition: 'all 0.18s',
                        }}
                    >
                        {loading ? (
                            <>
                                <span style={{
                                    width: '16px', height: '16px',
                                    border: '2px solid rgba(255,255,255,0.4)',
                                    borderTop: '2px solid white',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.8s linear infinite',
                                }} />
                                Giriş yapılıyor...
                            </>
                        ) : 'Giriş Yap'}
                    </button>
                </form>
            </div>

            {/* Footer note */}
            <p style={{
                position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                fontSize: '12px', color: 'var(--muted)',
                fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
            }}>
                MenuMind · Restoran Yönetim Sistemi
            </p>
        </div>
    )
}
