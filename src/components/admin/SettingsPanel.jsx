import { useState, useEffect } from 'react'
import { Save, Loader2, CheckCircle, Store, MessageSquare, Send, Bot, KeyRound, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useMenu } from '../../hooks/useMenu'

const INFO_FIELDS = [
    {
        key: 'restaurant_name',
        label: 'Restoran Adı',
        placeholder: 'MenuMind Restoran',
        type: 'text',
        icon: Store,
        desc: 'Müşteri ekranında ve AI asistanında görünen ad',
    },
    {
        key: 'welcome_message',
        label: 'Karşılama Mesajı',
        placeholder: 'Merhaba! Ben yapay zeka destekli menü asistanınızım 🍽️✨ Size ne önerebilirim?',
        type: 'textarea',
        icon: MessageSquare,
        desc: "Müşteri chat penceresini açtığında AI'nın söylediği ilk mesaj",
    },
    {
        key: 'telegram_chat_id',
        label: 'Telegram Chat ID',
        placeholder: '-1001234567890',
        type: 'text',
        icon: Send,
        desc: "Yeni sipariş bildirimlerinin gönderileceği grup veya kanal ID'si",
    },
]

const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '12px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: 'var(--surface2)', border: '1.5px solid var(--border)',
    color: 'var(--text)', fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
}

function InfoCard({ icon: Icon, title, children, color = '#732841' }) {
    return (
        <div style={{
            padding: '16px 18px', borderRadius: '14px',
            background: `${color}08`, border: `1.5px solid ${color}22`,
            display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
            <div style={{
                width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}18`,
            }}>
                <Icon size={16} style={{ color }} />
            </div>
            <div>
                <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>{title}</p>
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{children}</div>
            </div>
        </div>
    )
}

function SectionHeader({ label, icon: Icon }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <div style={{
                width: '26px', height: '26px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(115,40,65,0.10)',
            }}>
                <Icon size={13} style={{ color: 'var(--accent)' }} />
            </div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>
                {label}
            </p>
        </div>
    )
}

/* ── Şifre Güç Çubuğu ──────────────────────────────────────── */
function PasswordStrength({ password }) {
    if (!password) return null
    const strength = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4
        : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
            : password.length >= 8 ? 2 : 1
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
    const labels = ['Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü']
    return (
        <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3, 4].map(l => (
                    <div key={l} style={{
                        flex: 1, height: '4px', borderRadius: '99px',
                        background: l <= strength ? colors[strength - 1] : 'var(--border)',
                        transition: 'background 0.2s',
                    }} />
                ))}
            </div>
            <span style={{ fontSize: '11px', color: colors[strength - 1], fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                {labels[strength - 1]}
            </span>
        </div>
    )
}

/* ── Şifre Değiştir Bölümü ──────────────────────────────────── */
function ChangePasswordSection() {
    const [curr, setCurr] = useState('')
    const [next, setNext] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const eyeBtn = (setter) => (
        <button type="button" onClick={() => setter(v => !v)} tabIndex={-1}
            style={{ width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            {showPw ? <EyeOff size={14} style={{ color: 'var(--muted)' }} /> : <Eye size={14} style={{ color: 'var(--muted)' }} />}
        </button>
    )

    const handleChange = async (e) => {
        e.preventDefault()
        setError('')
        if (next.length < 8) { setError('Yeni şifre en az 8 karakter olmalıdır.'); return }
        if (next !== confirm) { setError('Şifreler eşleşmiyor.'); return }

        setSaving(true)
        // Mevcut şifreyi doğrula
        const { data: { user } } = await supabase.auth.getUser()
        const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: user?.email || '',
            password: curr,
        })
        if (signInErr) {
            setSaving(false)
            setError('Mevcut şifre yanlış.')
            return
        }

        // Yeni şifreyi ayarla
        const { error: updateErr } = await supabase.auth.updateUser({ password: next })
        setSaving(false)
        if (updateErr) {
            setError('Şifre güncellenemedi. Lütfen tekrar deneyin.')
            return
        }

        setSuccess(true)
        setCurr(''); setNext(''); setConfirm('')
        setTimeout(() => setSuccess(false), 3000)
    }

    const fieldStyle = {
        display: 'flex', alignItems: 'center',
        borderRadius: '12px', overflow: 'hidden',
        background: 'var(--surface2)', border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
        transition: 'border-color 0.18s',
    }

    const iconBox = (
        <div style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={13} style={{ color: 'var(--muted)' }} />
        </div>
    )

    const inp = {
        flex: 1, padding: '11px 0', fontSize: '14px', outline: 'none',
        background: 'transparent', color: 'var(--text)', border: 'none',
        fontFamily: 'Inter, sans-serif',
    }

    return (
        <div style={{
            padding: '24px', borderRadius: '18px',
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
            <SectionHeader label="Şifre Değiştir" icon={KeyRound} />

            <form onSubmit={handleChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Mevcut Şifre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)', fontFamily: 'Inter, sans-serif' }}>Mevcut Şifre</label>
                    <div style={fieldStyle}>
                        {iconBox}
                        <input type={showPw ? 'text' : 'password'} value={curr}
                            onChange={e => { setCurr(e.target.value); setError('') }}
                            placeholder="Mevcut şifreniz" autoComplete="current-password"
                            style={inp} />
                        {eyeBtn(setShowPw)}
                    </div>
                </div>

                {/* Yeni Şifre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)', fontFamily: 'Inter, sans-serif' }}>Yeni Şifre</label>
                    <div style={{ ...fieldStyle, borderColor: error ? 'var(--danger)' : 'var(--border)' }}>
                        {iconBox}
                        <input type={showPw ? 'text' : 'password'} value={next}
                            onChange={e => { setNext(e.target.value); setError('') }}
                            placeholder="En az 8 karakter" autoComplete="new-password"
                            style={inp} />
                    </div>
                    <PasswordStrength password={next} />
                </div>

                {/* Şifre Tekrar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)', fontFamily: 'Inter, sans-serif' }}>Yeni Şifre (Tekrar)</label>
                    <div style={fieldStyle}>
                        {iconBox}
                        <input type={showPw ? 'text' : 'password'} value={confirm}
                            onChange={e => { setConfirm(e.target.value); setError('') }}
                            placeholder="Şifreyi tekrarlayın" autoComplete="new-password"
                            style={inp} />
                    </div>
                </div>

                {/* Hata */}
                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 14px', borderRadius: '10px', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.18)' }}>
                        <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}>{error}</span>
                    </div>
                )}

                {/* Buton */}
                <button type="submit" disabled={saving || success}
                    style={{
                        width: '100%', padding: '13px', borderRadius: '12px',
                        fontWeight: 700, fontSize: '14px', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: success
                            ? 'linear-gradient(135deg,#00B894,#00967A)'
                            : saving ? 'var(--border)' : 'linear-gradient(135deg,#732841,#5a1f31)',
                        boxShadow: success ? '0 4px 14px rgba(0,184,148,0.3)' : saving ? 'none' : '0 4px 14px rgba(115,40,65,0.3)',
                        border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                        fontFamily: 'Inter, sans-serif', transition: 'background 0.3s, box-shadow 0.3s',
                    }}>
                    {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Güncelleniyor...</>
                        : success ? <><ShieldCheck size={15} /> Şifre Güncellendi!</>
                            : <><KeyRound size={15} /> Şifremi Değiştir</>}
                </button>
            </form>
        </div>
    )
}

export default function SettingsPanel() {
    const { settings, loading, updateSetting } = useMenu()
    const [form, setForm] = useState({})
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        if (settings) setForm({ ...settings })
    }, [settings])

    const handleSave = async () => {
        setSaving(true)
        try {
            for (const [key, value] of Object.entries(form)) {
                if (INFO_FIELDS.find(f => f.key === key)) {
                    await updateSetting(key, value)
                }
            }
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
            <Loader2 size={26} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
    )

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Başlık ── */}
            <div>
                <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>Ayarlar</h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    Restoran bilgilerini ve sistem ayarlarını buradan güncelleyin.
                </p>
            </div>

            {/* ── Form alanları ── */}
            <div style={{
                padding: '24px', borderRadius: '18px',
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '22px',
            }}>
                <SectionHeader label="Genel Ayarlar" icon={Store} />

                {INFO_FIELDS.map(field => {
                    const Icon = field.icon
                    return (
                        <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(115,40,65,0.08)',
                                }}>
                                    <Icon size={13} style={{ color: 'var(--accent)' }} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{field.label}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>{field.desc}</p>
                                </div>
                            </div>

                            {field.type === 'textarea' ? (
                                <textarea
                                    value={form[field.key] || ''}
                                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    style={{ ...inputStyle, resize: 'none' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(115,40,65,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={form[field.key] || ''}
                                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = 'rgba(115,40,65,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                />
                            )}

                            {field.key === 'telegram_chat_id' && (
                                <p style={{ fontSize: '11px', color: 'var(--muted)', paddingLeft: '4px', fontFamily: 'Inter, sans-serif' }}>
                                    💡 Chat ID'yi öğrenmek için Telegram'da <strong>@userinfobot</strong>'a <code>/start</code> gönderin.
                                </p>
                            )}
                        </div>
                    )
                })}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        width: '100%', padding: '15px', borderRadius: '14px',
                        fontSize: '14px', fontWeight: 700, color: 'white',
                        background: saved
                            ? 'linear-gradient(135deg,#00B894,#00967A)'
                            : saving ? 'var(--border)' : 'linear-gradient(135deg,#732841,#5a1f31)',
                        boxShadow: saved
                            ? '0 4px 14px rgba(0,184,148,0.3)'
                            : saving ? 'none' : '0 4px 14px rgba(115,40,65,0.3)',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'background 0.3s, box-shadow 0.3s',
                    }}
                >
                    {saving
                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Kaydediliyor...</>
                        : saved
                            ? <><CheckCircle size={16} /> Kaydedildi!</>
                            : <><Save size={16} /> Ayarları Kaydet</>
                    }
                </button>
            </div>

            {/* ── Bilgi kartları ── */}
            <InfoCard icon={Bot} title="AI Asistan (Garson) Hakkında" color="#732841">
                AI asistanı, her müşteri sohbetinde <strong>güncel menüyü otomatik olarak kullanır</strong>.
                Menüde yaptığınız değişiklikler bir sonraki sohbette anında yansır. Ürünlerin
                fiyatı, içeriği veya alerjen bilgisi sisteme her zaman güncel aktarılır.
            </InfoCard>

            <InfoCard icon={Send} title="Telegram Bildirimleri" color="#0088cc">
                Yeni sipariş geldiğinde Telegram grubunuza veya kanalınıza otomatik bildirim gönderilir.
                Bot token güvenli şekilde sunucu tarafında saklanır, tarayıcıya asla açılmaz.
            </InfoCard>

            {/* ── Şifre Değiştir ── */}
            <ChangePasswordSection />

        </div>
    )
}
