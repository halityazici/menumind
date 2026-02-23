import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
    Download, Upload, CheckCircle, AlertCircle,
    X, FileSpreadsheet, Loader2, ChevronDown, ChevronUp, Trash2
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

/* ── Kolon tanımları ─────────────────────────────────────── */
const COLUMNS = [
    { key: 'category', label: 'Kategori', hint: 'Başlangıçlar', required: true },
    { key: 'name', label: 'Ürün Adı', hint: 'Akdeniz Salatası', required: true },
    { key: 'description', label: 'İçerik', hint: 'Taze domates, salatalık...' },
    { key: 'price', label: 'Fiyat (₺)', hint: '89', required: true },
    { key: 'calories', label: 'Kalori (kcal)', hint: '320' },
    { key: 'allergens', label: 'Alerjenler', hint: 'Gluten, Süt (virgülle)' },
]

/* ── Excel şablonu indir ─────────────────────────────────── */
function downloadTemplate() {
    const headers = COLUMNS.map(c => c.label)
    const example = COLUMNS.map(c => c.hint)
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    ws['!cols'] = [{ wch: 18 }, { wch: 26 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 32 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Menü')
    XLSX.writeFile(wb, 'MenuMind_Menu_Sablonu.xlsx')
}

/* ── Row parser ──────────────────────────────────────────── */
function parseRow(row) {
    const get = (label) => {
        const col = COLUMNS.find(c => c.label === label)
        const val = col ? row[col.label] : undefined
        return val !== undefined && val !== null && val !== '' ? String(val).trim() : null
    }
    const name = get('Ürün Adı')
    const category = get('Kategori')
    const price = parseFloat(get('Fiyat (₺)') || '0')
    if (!name || !category || isNaN(price) || price <= 0) return null
    const allergenStr = get('Alerjenler') || ''
    return {
        name, category,
        description: get('İçerik'),
        price,
        calories: parseInt(get('Kalori (kcal)') || '0') || null,
        allergens: allergenStr ? allergenStr.split(',').map(a => a.trim()).filter(Boolean) : [],
        is_available: true,
    }
}

/* ── Step indicator ──────────────────────────────────────── */
function Step({ num, title, desc, active, done }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '14px', fontFamily: 'Poppins',
                background: done ? '#00B894' : active ? 'linear-gradient(135deg,#732841,#5a1f31)' : 'var(--surface2)',
                color: done || active ? 'white' : 'var(--muted)',
                boxShadow: active ? '0 4px 12px rgba(115,40,65,0.3)' : done ? '0 4px 12px rgba(0,184,148,0.25)' : 'none',
                border: active || done ? 'none' : '2px solid var(--border)',
            }}>
                {done ? <CheckCircle size={16} /> : num}
            </div>
            <div style={{ paddingTop: '6px' }}>
                <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>{title}</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{desc}</p>
            </div>
        </div>
    )
}

export default function BulkImport() {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState([])
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState('idle')   // idle | loading | success | error
    const [imported, setImported] = useState(0)
    const [showTable, setShowTable] = useState(false)
    const inputRef = useRef()

    const step = file ? (preview.length > 0 ? 3 : 2) : 1

    /* ── Dosya seç → parse ───────────────────────────────── */
    const handleFile = (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        setStatus('idle')
        setImported(0)
        setErrors([])
        setPreview([])

        const reader = new FileReader()
        reader.onload = (ev) => {
            const wb = XLSX.read(ev.target.result, { type: 'binary' })
            const ws = wb.Sheets[wb.SheetNames[0]]
            const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

            const valid = [], errs = []
            raw.forEach((row, i) => {
                const parsed = parseRow(row)
                if (parsed) valid.push({ ...parsed, _rowNum: i + 2 })
                else errs.push(`Satır ${i + 2}: "Ürün Adı", "Kategori" veya "Fiyat" eksik/geçersiz`)
            })
            setPreview(valid)
            setErrors(errs)
        }
        reader.readAsBinaryString(f)
    }

    /* ── Supabase'e toplu yükle ──────────────────────────── */
    const handleImport = async () => {
        if (!preview.length) return
        setStatus('loading')
        const rows = preview.map(({ _rowNum, ...rest }) => rest)
        try {
            const { error } = await supabase.from('menu').insert(rows)
            if (error) throw error
            setImported(rows.length)
            setStatus('success')
            setPreview([])
            setFile(null)
            inputRef.current.value = ''
        } catch (err) {
            setErrors(prev => [...prev, `Yükleme hatası: ${err.message}`])
            setStatus('error')
        }
    }

    const reset = () => {
        setFile(null); setPreview([]); setErrors([])
        setStatus('idle'); setImported(0); setShowTable(false)
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Başlık ── */}
            <div>
                <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>
                    Excel ile Toplu Menü Yükleme
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                    Ürünlerinizi toplu eklemek için şablonu indirin, doldurun ve yükleyin.
                </p>
            </div>

            {/* ── Adımlar göstergesi ── */}
            <div style={{
                padding: '20px 24px',
                borderRadius: '18px',
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '16px',
            }}>
                <Step num="1" title="Şablonu İndir" desc="Hazır kolonları olan Excel şablonunu indirin" active={step === 1} done={step > 1} />
                <div style={{ width: '2px', height: '12px', background: 'var(--border)', marginLeft: '17px' }} />
                <Step num="2" title="Excel'i Doldurun ve Yükleyin" desc=".xlsx veya .xls dosyasını seçin" active={step === 2} done={step > 2} />
                <div style={{ width: '2px', height: '12px', background: 'var(--border)', marginLeft: '17px' }} />
                <Step num="3" title="Önizleyip Onaylayın" desc="Ürünleri kontrol edin ve menüye ekleyin" active={step === 3} done={status === 'success'} />
            </div>

            {/* ── Adım 1: Şablon İndir ── */}
            <div style={{
                padding: '20px 24px', borderRadius: '18px',
                background: 'var(--surface)', border: '1.5px solid var(--border)',
            }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                    ADIM 1 — ŞABLON
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>Excel Şablonunu İndir</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                            {COLUMNS.map(c => (
                                <span key={c.key} style={{
                                    fontSize: '11px', padding: '3px 10px', borderRadius: '8px', fontWeight: 500,
                                    background: c.required ? 'rgba(115,40,65,0.08)' : 'var(--surface2)',
                                    color: c.required ? 'var(--accent)' : 'var(--muted)',
                                    border: `1px solid ${c.required ? 'rgba(115,40,65,0.2)' : 'var(--border)'}`,
                                }}>
                                    {c.label}{c.required ? ' *' : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 20px', borderRadius: '12px',
                            fontSize: '13px', fontWeight: 700, color: 'white',
                            background: 'linear-gradient(135deg,#732841,#5a1f31)',
                            boxShadow: '0 4px 14px rgba(115,40,65,0.3)',
                            border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            flexShrink: 0,
                        }}
                    >
                        <Download size={15} /> İndir
                    </button>
                </div>
            </div>

            {/* ── Adım 2: Dosya Yükle ── */}
            <div style={{
                padding: '20px 24px', borderRadius: '18px',
                background: 'var(--surface)',
                border: `1.5px ${file ? 'solid' : 'dashed'} ${file ? 'rgba(115,40,65,0.4)' : 'var(--border2)'}`,
            }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                    ADIM 2 — YÜKLE
                </p>
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} id="bulk-upload" />
                {!file ? (
                    <label htmlFor="bulk-upload" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '32px', borderRadius: '14px', cursor: 'pointer',
                        background: 'var(--surface2)', border: '2px dashed var(--border2)',
                        gap: '10px', textAlign: 'center',
                    }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(115,40,65,0.08)' }}>
                            <FileSpreadsheet size={24} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>Excel dosyasını seçin</p>
                            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>.xlsx veya .xls formatı desteklenir</p>
                        </div>
                        <span style={{
                            padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                            background: 'linear-gradient(135deg,#732841,#5a1f31)', color: 'white',
                            boxShadow: '0 3px 10px rgba(115,40,65,0.25)',
                        }}>Dosya Seç</span>
                    </label>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(115,40,65,0.06)', border: '1.5px solid rgba(115,40,65,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileSpreadsheet size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            <div>
                                <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{file.name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                                    {preview.length} geçerli ürün{errors.length > 0 ? `, ${errors.length} hata` : ''}
                                </p>
                            </div>
                        </div>
                        <button onClick={reset} style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', flexShrink: 0 }}>
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Hata listesi ── */}
            {errors.length > 0 && (
                <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(225,112,85,0.06)', border: '1.5px solid rgba(225,112,85,0.2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <AlertCircle size={15} style={{ color: '#E17557', flexShrink: 0 }} />
                        <p style={{ fontWeight: 700, fontSize: '13px', color: '#E17557' }}>{errors.length} satır atlandı</p>
                    </div>
                    {errors.slice(0, 5).map((e, i) => (
                        <p key={i} style={{ fontSize: '12px', color: 'var(--muted)', paddingLeft: '23px' }}>⚠️ {e}</p>
                    ))}
                    {errors.length > 5 && <p style={{ fontSize: '12px', color: 'var(--muted)', paddingLeft: '23px' }}>+{errors.length - 5} hata daha</p>}
                </div>
            )}

            {/* ── Adım 3: Önizleme + Onayla ── */}
            {preview.length > 0 && status !== 'success' && (
                <div style={{ padding: '20px 24px', borderRadius: '18px', background: 'var(--surface)', border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        ADIM 3 — ONAYLA
                    </p>

                    {/* Özet istatistikler */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {[
                            { label: 'Ürün', value: preview.length, color: '#732841' },
                            { label: 'Kategori', value: [...new Set(preview.map(r => r.category))].length, color: '#00B894' },
                            { label: 'Toplam Fiyat', value: `${preview.reduce((s, r) => s + r.price, 0).toFixed(0)} ₺`, color: '#FDCB6E' },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                padding: '14px 12px', borderRadius: '14px', textAlign: 'center',
                                background: 'var(--surface2)', border: '1.5px solid var(--border)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            }}>
                                <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</p>
                                <p style={{ fontSize: '22px', fontWeight: 800, color: stat.color, fontFamily: 'Poppins', lineHeight: 1 }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tablo toggle */}
                    <button
                        onClick={() => setShowTable(v => !v)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', borderRadius: '12px', width: '100%', textAlign: 'left',
                            background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                            Önizleme ({Math.min(preview.length, 10)} / {preview.length} ürün)
                        </span>
                        {showTable ? <ChevronUp size={15} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--muted)' }} />}
                    </button>

                    {showTable && (
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--surface2)' }}>
                                            {['Kategori', 'Ürün Adı', 'Fiyat', 'Kalori', 'Alerjenler'].map(h => (
                                                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.slice(0, 10).map((row, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{row.category}</td>
                                                <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text)' }}>{row.name}</td>
                                                <td style={{ padding: '10px 14px', color: 'var(--text2)', whiteSpace: 'nowrap', textAlign: 'right' }}>{row.price} ₺</td>
                                                <td style={{ padding: '10px 14px', color: 'var(--muted)', textAlign: 'center' }}>{row.calories || '—'}</td>
                                                <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{row.allergens?.join(', ') || '—'}</td>
                                            </tr>
                                        ))}
                                        {preview.length > 10 && (
                                            <tr style={{ background: 'var(--surface2)' }}>
                                                <td colSpan={5} style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>
                                                    +{preview.length - 10} ürün daha...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Onayla butonu */}
                    <button
                        onClick={handleImport}
                        disabled={status === 'loading'}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '14px',
                            fontSize: '15px', fontWeight: 700, color: 'white',
                            background: status === 'loading' ? 'var(--border)' : 'linear-gradient(135deg,#00B894,#00967A)',
                            boxShadow: status === 'loading' ? 'none' : '0 5px 18px rgba(0,184,148,0.3)',
                            border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            fontFamily: 'Inter, sans-serif', transition: 'opacity 0.2s',
                        }}
                    >
                        {status === 'loading'
                            ? <><Loader2 size={18} className="animate-spin" /> Yükleniyor...</>
                            : <><Upload size={18} /> {preview.length} Ürünü Menüye Ekle</>
                        }
                    </button>
                </div>
            )}

            {/* ── Başarı ── */}
            {status === 'success' && (
                <div style={{
                    padding: '28px 24px', borderRadius: '18px', textAlign: 'center',
                    background: 'rgba(0,184,148,0.06)', border: '1.5px solid rgba(0,184,148,0.25)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,184,148,0.12)' }}>
                        <CheckCircle size={28} style={{ color: '#00B894' }} />
                    </div>
                    <div>
                        <p style={{ fontWeight: 800, fontSize: '18px', color: '#00B894', fontFamily: 'Poppins' }}>{imported} ürün başarıyla eklendi!</p>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Ürünler menüde görünüyor.</p>
                    </div>
                    <button
                        onClick={reset}
                        style={{
                            padding: '11px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                            background: 'linear-gradient(135deg,#732841,#5a1f31)', color: 'white',
                            border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 4px 12px rgba(115,40,65,0.25)',
                        }}
                    >Yeni Yükleme Yap</button>
                </div>
            )}

        </div>
    )
}
