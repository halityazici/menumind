import { useState, useEffect } from 'react'
import { Lock, Mail, Eye, EyeOff, ChefHat, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const logoModules = import.meta.glob('../../assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['../../assets/logo.png'] ?? null

/* ── Yardımcı: branded şifre sıfırlama maili gönder ─────────── */
async function sendResetEmail(email, resetLink) {
    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'password_reset', to: email, resetLink }),
        })
    } catch {
        // Resend başarısız olsa bile Supabase zaten kendi mailini gönderir
    }
}

/* ── Ortak stil yardımcıları ─────────────────────────────────── */
const cardStyle = {
    width: '100%', maxWidth: '420px',
    borderRadius: '20px', overflow: 'hidden',
    background: 'var(--surface)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07)',
    border: '1px solid var(--border)',
    position: 'relative',
}

const inputWrapStyle = (hasError) => ({
    display: 'flex', alignItems: 'center',
    borderRadius: '12px', overflow: 'hidden',
    background: 'var(--surface2)',
    border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border2)'}`,
    transition: 'border-color 0.18s, box-shadow 0.18s',
})

const inputStyle = {
    flex: 1, padding: '13px 0',
    fontSize: '14.5px', outline: 'none',
    background: 'transparent', color: 'var(--text)',
    border: 'none', fontFamily: 'Inter, sans-serif',
}

const iconBoxStyle = {
    width: '44px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

const labelStyle = {
    display: 'block', fontSize: '12.5px',
    fontWeight: 600, marginBottom: '8px',
    color: 'var(--text2)', fontFamily: 'Inter, sans-serif',
    textTransform: 'uppercase', letterSpacing: '0.04em',
}

const primaryBtn = (loading) => ({
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
})

function Spinner() {
    return (
        <span style={{
            width: '16px', height: '16px',
            border: '2px solid rgba(255,255,255,0.4)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
        }} />
    )
}

function HeaderBlock({ title, subtitle }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
            padding: '32px 28px 24px',
            textAlign: 'center',
        }}>
            {/* Decorative ring */}
            <div style={{
                position: 'absolute', top: '-60px', right: '-60px',
                width: '180px', height: '180px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
            }} />
            <div style={{
                width: '72px', height: '72px',
                borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px',
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.25)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                overflow: 'hidden',
            }}>
                {logoSrc
                    ? <img src={logoSrc} alt="MenuMind" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ChefHat size={30} color="white" />
                }
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.02em' }}>
                MenuMind
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>
                {subtitle}
            </p>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   VIEW 1: Giriş Formu
═══════════════════════════════════════════════════════════════ */
function LoginView({ onForgot }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [shake, setShake] = useState(false)
    const [loading, setLoading] = useState(false)

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

    return (
        <div style={{ ...cardStyle, animation: shake ? 'shake 0.4s ease' : undefined }}>
            <HeaderBlock subtitle="Admin Paneli" />
            <form onSubmit={handleLogin} style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* E-posta */}
                <div>
                    <label style={labelStyle}>E-posta</label>
                    <div style={inputWrapStyle(!!error)}>
                        <div style={iconBoxStyle}><Mail size={15} style={{ color: 'var(--muted)' }} /></div>
                        <input
                            type="email" value={email}
                            onChange={e => { setEmail(e.target.value); setError('') }}
                            placeholder="admin@example.com"
                            autoComplete="email" autoFocus
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Şifre */}
                <div>
                    <label style={labelStyle}>Şifre</label>
                    <div style={inputWrapStyle(!!error)}>
                        <div style={iconBoxStyle}><Lock size={15} style={{ color: 'var(--muted)' }} /></div>
                        <input
                            type={showPw ? 'text' : 'password'} value={password}
                            onChange={e => { setPassword(e.target.value); setError('') }}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            style={inputStyle}
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                            style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            {showPw ? <EyeOff size={15} style={{ color: 'var(--muted)' }} /> : <Eye size={15} style={{ color: 'var(--muted)' }} />}
                        </button>
                    </div>

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.18)' }}>
                            <AlertCircle size={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}>{error}</span>
                        </div>
                    )}
                </div>

                {/* Giriş Yap */}
                <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                    {loading ? <><Spinner /> Giriş yapılıyor...</> : 'Giriş Yap'}
                </button>

                {/* Şifremi Unuttum */}
                <div style={{ textAlign: 'center' }}>
                    <button type="button" onClick={onForgot}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--primary)', fontFamily: 'Inter, sans-serif', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                        Şifremi unuttum
                    </button>
                </div>
            </form>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   VIEW 2: Şifremi Unuttum
═══════════════════════════════════════════════════════════════ */
function ForgotView({ onBack }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email.trim()) return
        setLoading(true)
        setError('')

        const redirectTo = `${window.location.origin}/admin`
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })

        if (authError) {
            setLoading(false)
            setError('E-posta gönderilemedi. E-posta adresinizi kontrol edin.')
            return
        }

        // Resend ile branded mail gönder (arka planda, hata olsa bile devam)
        await sendResetEmail(email.trim(), redirectTo)
        setLoading(false)
        setSent(true)
    }

    if (sent) {
        return (
            <div style={cardStyle}>
                <HeaderBlock subtitle="Şifre Sıfırlama" />
                <div style={{ padding: '36px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={32} style={{ color: '#22c55e' }} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>Mail Gönderildi!</h2>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text2)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, maxWidth: '300px' }}>
                        <strong>{email}</strong> adresine şifre sıfırlama linki gönderdik. Birkaç dakika içinde gelmezse spam klasörünü kontrol edin.
                    </p>
                    <button onClick={onBack}
                        style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--primary)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        <ArrowLeft size={13} /> Giriş sayfasına dön
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={cardStyle}>
            <HeaderBlock subtitle="Şifre Sıfırlama" />
            <form onSubmit={handleSubmit} style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text2)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                    Kayıtlı e-posta adresinizi girin. Şifre sıfırlama linki içeren bir mail göndereceğiz.
                </p>

                <div>
                    <label style={labelStyle}>E-posta</label>
                    <div style={inputWrapStyle(!!error)}>
                        <div style={iconBoxStyle}><Mail size={15} style={{ color: 'var(--muted)' }} /></div>
                        <input
                            type="email" value={email}
                            onChange={e => { setEmail(e.target.value); setError('') }}
                            placeholder="admin@example.com"
                            autoComplete="email" autoFocus
                            style={inputStyle}
                        />
                    </div>
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.18)' }}>
                            <AlertCircle size={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}>{error}</span>
                        </div>
                    )}
                </div>

                <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                    {loading ? <><Spinner /> Gönderiliyor...</> : 'Sıfırlama Maili Gönder'}
                </button>

                <div style={{ textAlign: 'center' }}>
                    <button type="button" onClick={onBack}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        <ArrowLeft size={13} /> Geri dön
                    </button>
                </div>
            </form>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   VIEW 3: Yeni Şifre Belirle (PASSWORD_RECOVERY event'inden sonra)
═══════════════════════════════════════════════════════════════ */
function ResetView({ onDone }) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleReset = async (e) => {
        e.preventDefault()
        if (password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return }
        if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return }

        setLoading(true)
        setError('')
        const { error: updateError } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (updateError) {
            setError('Şifre güncellenemedi. Lütfen linki yeniden talep edin.')
            return
        }
        setSuccess(true)
        setTimeout(onDone, 2000)
    }

    if (success) {
        return (
            <div style={cardStyle}>
                <HeaderBlock subtitle="Şifre Güncellendi" />
                <div style={{ padding: '40px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={32} style={{ color: '#22c55e' }} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>Şifre Güncellendi!</h2>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text2)', fontFamily: 'Inter, sans-serif' }}>Yönlendiriliyorsunuz...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={cardStyle}>
            <HeaderBlock subtitle="Yeni Şifre Belirle" />
            <form onSubmit={handleReset} style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text2)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                    En az 8 karakter uzunluğunda güçlü bir şifre belirleyin.
                </p>

                {/* Yeni Şifre */}
                <div>
                    <label style={labelStyle}>Yeni Şifre</label>
                    <div style={inputWrapStyle(!!error)}>
                        <div style={iconBoxStyle}><KeyRound size={15} style={{ color: 'var(--muted)' }} /></div>
                        <input
                            type={showPw ? 'text' : 'password'} value={password}
                            onChange={e => { setPassword(e.target.value); setError('') }}
                            placeholder="En az 8 karakter" autoFocus
                            autoComplete="new-password"
                            style={inputStyle}
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                            style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            {showPw ? <EyeOff size={15} style={{ color: 'var(--muted)' }} /> : <Eye size={15} style={{ color: 'var(--muted)' }} />}
                        </button>
                    </div>
                </div>

                {/* Şifre Tekrar */}
                <div>
                    <label style={labelStyle}>Şifre Tekrar</label>
                    <div style={inputWrapStyle(!!error)}>
                        <div style={iconBoxStyle}><Lock size={15} style={{ color: 'var(--muted)' }} /></div>
                        <input
                            type={showPw ? 'text' : 'password'} value={confirm}
                            onChange={e => { setConfirm(e.target.value); setError('') }}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            style={inputStyle}
                        />
                    </div>

                    {/* Güç göstergesi */}
                    {password.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4].map(level => {
                                const strength = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4
                                    : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
                                        : password.length >= 8 ? 2 : 1
                                const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
                                return (
                                    <div key={level} style={{
                                        flex: 1, height: '4px', borderRadius: '99px',
                                        background: level <= strength ? colors[strength - 1] : 'var(--border)',
                                        transition: 'background 0.2s',
                                    }} />
                                )
                            })}
                        </div>
                    )}

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.18)' }}>
                            <AlertCircle size={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}>{error}</span>
                        </div>
                    )}
                </div>

                <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                    {loading ? <><Spinner /> Güncelleniyor...</> : 'Şifremi Güncelle'}
                </button>
            </form>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   ANA BİLEŞEN
═══════════════════════════════════════════════════════════════ */
export default function LoginGuard({ children }) {
    const [session, setSession] = useState(undefined)
    const [view, setView] = useState('login')   // 'login' | 'forgot' | 'reset'

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
            setSession(s)
            // Kullanıcı şifre sıfırlama linkine tıkladıysa → reset formunu göster
            if (event === 'PASSWORD_RECOVERY') {
                setView('reset')
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setView('login')
    }

    if (session === undefined) return null

    // Giriş yapılı ve reset ekranında değilse → children (admin panel)
    if (session && view !== 'reset') return children(handleLogout)

    /* ── Arka plan ── */
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '24px',
            background: 'linear-gradient(155deg, #F7F1F4 0%, #FAF3F6 50%, #F5EEF2 100%)',
            position: 'fixed', inset: 0, overflow: 'auto',
        }}>
            {/* Dekor */}
            <div style={{ position: 'fixed', top: '-120px', right: '-120px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,45,69,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,45,69,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Kart */}
            <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
                {view === 'login' && <LoginView onForgot={() => setView('forgot')} />}
                {view === 'forgot' && <ForgotView onBack={() => setView('login')} />}
                {view === 'reset' && <ResetView onDone={handleLogout} />}
            </div>

            {/* Footer */}
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
