import { useState, useEffect } from 'react'
import { Save, Loader2, CheckCircle, Store, MessageSquare, Send, Bot } from 'lucide-react'
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

        </div>
    )
}
