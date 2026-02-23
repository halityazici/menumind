import { useState, useEffect } from 'react'
import { Save, Loader2, CheckCircle } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'

const FIELDS = [
    { key: 'restaurant_name', label: 'Restoran Adı', placeholder: 'MenuMind Restoran', type: 'text' },
    { key: 'welcome_message', label: 'Karşılama Mesajı', placeholder: 'Hoş Geldiniz!', type: 'textarea' },
    { key: 'telegram_chat_id', label: 'Telegram Chat ID', placeholder: '-1001234567890', type: 'text' },
]

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
                if (FIELDS.find(f => f.key === key)) {
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
        <div className="flex items-center justify-center p-12">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-accent2)' }} />
        </div>
    )

    return (
        <div className="p-4 space-y-4">
            <div
                className="rounded-2xl p-4 space-y-4"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
            >
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-accent2)' }}>Genel Ayarlar</h3>

                {FIELDS.map(field => (
                    <div key={field.key}>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>
                            {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                            <textarea
                                value={form[field.key] || ''}
                                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                rows={3}
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                            />
                        ) : (
                            <input
                                type="text"
                                value={form[field.key] || ''}
                                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                            />
                        )}
                    </div>
                ))}

                <div className="pt-2">
                    <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
                        💡 Telegram Chat ID'yi öğrenmek için @userinfobot'a /start gönderin.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #732841, #5a1f31)', color: 'white', boxShadow: '0 4px 14px rgba(115,40,65,0.3)' }}
                >
                    {saving ? (
                        <><Loader2 size={16} className="animate-spin" /> Kaydediliyor...</>
                    ) : saved ? (
                        <><CheckCircle size={16} /> Kaydedildi!</>
                    ) : (
                        <><Save size={16} /> Kaydet</>
                    )}
                </button>
            </div>

            {/* Info card */}
            <div
                className="rounded-2xl p-4 space-y-2"
                style={{ background: 'rgba(115,40,65,0.07)', border: '1px solid rgba(115,40,65,0.18)' }}
            >
                <p className="text-xs font-semibold" style={{ color: 'var(--color-accent2)' }}>AI Asistan Hakkında</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    AI asistanı (Garson), her müşteri sohbetinde güncel menüyü otomatik olarak kullanır.
                    Menüde yaptığınız değişiklikler bir sonraki sohbette anında yansır.
                </p>
            </div>
        </div>
    )
}
