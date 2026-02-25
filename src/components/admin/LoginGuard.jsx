import { useState, useEffect } from 'react'
import { Lock, Mail, Eye, EyeOff, ChefHat, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const logoModules = import.meta.glob('../../assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['../../assets/logo.png'] ?? null

export default function LoginGuard({ children }) {
    const [session, setSession] = useState(undefined)   // undefined = loading
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [shake, setShake] = useState(false)
    const [loading, setLoading] = useState(false)

    // Mevcut oturumu kontrol et
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s)
        })
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

    // Oturum yüklenirken boş ekran
    if (session === undefined) return null

    // Giriş yapılmışsa children'ı render et
    if (session) return children(handleLogout)

    // Giriş ekranı
    return (
        <div
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                paddingLeft: '24px', paddingRight: '24px',
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'linear-gradient(160deg, #F9EDF2 0%, #FDF5F7 40%, #FFF3F6 100%)',
                overflowY: 'auto',
            }}
        >
            <div
                className={shake ? 'animate-[shake_0.4s_ease]' : ''}
                style={{ width: '100%', maxWidth: '440px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 12px 48px rgba(115,40,65,0.18)', background: 'white' }}
            >
                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', background: 'linear-gradient(135deg, #732841 0%, #5a1f31 100%)' }}>
                    <div style={{ width: '88px', height: '88px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', overflow: 'hidden', background: 'rgba(255,255,255,0.18)', border: '3px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                        {logoSrc
                            ? <img src={logoSrc} alt="MenuMind" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <ChefHat size={36} color="white" />
                        }
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', margin: 0 }}>MenuMind</h1>
                    <p style={{ fontSize: '14px', marginTop: '6px', color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif' }}>Admin Paneli</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* E-posta */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#475569', fontFamily: 'Inter, sans-serif' }}>E-posta</label>
                        <div style={{ display: 'flex', alignItems: 'center', borderRadius: '14px', overflow: 'hidden', background: '#F8FAFC', border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`, transition: 'border-color 0.2s' }}>
                            <div style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Mail size={16} style={{ color: '#94A3B8' }} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setError('') }}
                                placeholder="admin@example.com"
                                autoComplete="email"
                                autoFocus
                                style={{ flex: 1, padding: '14px 0', fontSize: '15px', outline: 'none', background: 'transparent', color: '#1E293B', border: 'none', fontFamily: 'Inter, sans-serif' }}
                            />
                        </div>
                    </div>

                    {/* Şifre */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#475569', fontFamily: 'Inter, sans-serif' }}>Şifre</label>
                        <div style={{ display: 'flex', alignItems: 'center', borderRadius: '14px', overflow: 'hidden', background: '#F8FAFC', border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`, transition: 'border-color 0.2s' }}>
                            <div style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Lock size={16} style={{ color: '#94A3B8' }} />
                            </div>
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError('') }}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                style={{ flex: 1, padding: '14px 0', fontSize: '15px', outline: 'none', background: 'transparent', color: '#1E293B', border: 'none', fontFamily: 'Inter, sans-serif' }}
                            />
                            <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                {showPw ? <EyeOff size={16} style={{ color: '#94A3B8' }} /> : <Eye size={16} style={{ color: '#94A3B8' }} />}
                            </button>
                        </div>
                        {error && <p style={{ fontSize: '13px', marginTop: '8px', color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>⚠️ {error}</p>}
                    </div>

                    {/* Giriş butonu */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '14px',
                            fontWeight: 700, fontSize: '15px', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: loading ? '#c07090' : 'linear-gradient(135deg, #732841, #5a1f31)',
                            boxShadow: '0 4px 18px rgba(115,40,65,0.35)',
                            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'Inter, sans-serif', marginTop: '4px',
                        }}
                    >
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>

            <p style={{ marginTop: '24px', fontSize: '13px', textAlign: 'center', color: '#94A3B8' }}>
                MenuMind · Restoran Yönetim Sistemi
            </p>
        </div>
    )
}
