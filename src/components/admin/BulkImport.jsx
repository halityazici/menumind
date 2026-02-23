import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
    Download, Upload, CheckCircle, AlertCircle,
    X, FileSpreadsheet, Loader2, Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

/* ── Kolon tanımları ───────────────────────────────────────── */
const COLUMNS = [
    { key: 'category', label: 'Kategori', hint: 'Başlangıçlar' },
    { key: 'name', label: 'Ürün Adı', hint: 'Akdeniz Salatası' },
    { key: 'description', label: 'İçerik', hint: 'Taze domates, salatalık...' },
    { key: 'price', label: 'Fiyat (₺)', hint: '89' },
    { key: 'calories', label: 'Kalori (kcal)', hint: '320' },
    { key: 'allergens', label: 'Alerjenler', hint: 'Gluten, Süt (virgülle ayırın)' },
]

const STATUS = { IDLE: 'idle', LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' }

/* ── Excel şablonu indir ─────────────────────────────────────── */
function downloadTemplate() {
    const headers = COLUMNS.map(c => c.label)
    const example = COLUMNS.map(c => c.hint)

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, example])

    // Kolon genişlikleri
    ws['!cols'] = [
        { wch: 18 }, { wch: 26 }, { wch: 40 },
        { wch: 12 }, { wch: 14 }, { wch: 32 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Menü')
    XLSX.writeFile(wb, 'MenuMind_Menu_Sablonu.xlsx')
}

/* ── Excel satırı → Supabase kaydı ──────────────────────────── */
function parseRow(row) {
    const get = (label) => {
        const col = COLUMNS.find(c => c.label === label)
        const val = col ? row[col.label] : undefined
        return val !== undefined && val !== null && val !== '' ? String(val).trim() : null
    }

    const name = get('Ürün Adı')
    const category = get('Kategori')
    const price = parseFloat(get('Fiyat (₺)') || '0')

    if (!name || !category || isNaN(price)) return null   // Zorunlu alan eksik

    const allergenStr = get('Alerjenler') || ''
    const allergens = allergenStr
        ? allergenStr.split(',').map(a => a.trim()).filter(Boolean)
        : []

    return {
        name,
        category,
        description: get('İçerik'),
        price,
        calories: parseInt(get('Kalori (kcal)') || '0') || null,
        allergens,
        is_available: true,
    }
}

export default function BulkImport() {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState([])
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(STATUS.IDLE)
    const [imported, setImported] = useState(0)
    const [showPreview, setShowPreview] = useState(false)
    const inputRef = useRef()

    /* ── Dosya seç → parse ───────────────────────────────────── */
    const handleFile = (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        setStatus(STATUS.IDLE)
        setImported(0)

        const reader = new FileReader()
        reader.onload = (ev) => {
            const wb = XLSX.read(ev.target.result, { type: 'binary' })
            const ws = wb.Sheets[wb.SheetNames[0]]
            const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

            const validRows = []
            const errorRows = []

            raw.forEach((row, i) => {
                const parsed = parseRow(row)
                if (parsed) {
                    validRows.push({ ...parsed, _rowNum: i + 2 })
                } else {
                    errorRows.push(`Satır ${i + 2}: "Ürün Adı", "Kategori" veya "Fiyat" eksik`)
                }
            })

            setPreview(validRows)
            setErrors(errorRows)
            setShowPreview(true)
        }
        reader.readAsBinaryString(f)
    }

    /* ── Supabase'e toplu yükle ──────────────────────────────── */
    const handleImport = async () => {
        if (!preview.length) return
        setStatus(STATUS.LOADING)

        const rows = preview.map(({ _rowNum, ...rest }) => rest)

        try {
            const { error } = await supabase.from('menu').insert(rows)
            if (error) throw error
            setImported(rows.length)
            setStatus(STATUS.SUCCESS)
            setPreview([])
            setFile(null)
            inputRef.current.value = ''
        } catch (err) {
            console.error(err)
            setErrors(prev => [...prev, `Yükleme hatası: ${err.message}`])
            setStatus(STATUS.ERROR)
        }
    }

    const reset = () => {
        setFile(null); setPreview([]); setErrors([])
        setStatus(STATUS.IDLE); setImported(0); setShowPreview(false)
        inputRef.current.value = ''
    }

    return (
        <div className="space-y-5">

            {/* Başlık */}
            <div>
                <h2
                    className="text-lg font-bold"
                    style={{ fontFamily: 'Poppins', color: 'var(--text)' }}
                >
                    Excel ile Toplu Menü Yükleme
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                    Menü ürünlerinizi toplu olarak yüklemek için önce şablonu indirin, doldurun ve yükleyin.
                </p>
            </div>

            {/* Adım 1 — Şablon indir */}
            <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--accent-soft)', border: '1.5px solid rgba(115,40,65,0.2)' }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--accent)', color: 'white' }}
                        >
                            <span className="text-sm font-bold">1</span>
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                                Excel Şablonunu İndir
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                Hazır kolonları olan şablonu bilgisayarınıza kaydedin
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #732841, #5a1f31)',
                            boxShadow: '0 3px 10px rgba(115,40,65,0.3)',
                        }}
                    >
                        <Download size={15} />
                        İndir
                    </button>
                </div>

                {/* Kolon bilgisi */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {COLUMNS.map(c => (
                        <span
                            key={c.key}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{
                                background: 'white',
                                border: '1px solid rgba(115,40,65,0.2)',
                                color: 'var(--text2)',
                                fontWeight: 500,
                            }}
                        >
                            {c.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Adım 2 — Excel yükle */}
            <div
                className="rounded-2xl p-5"
                style={{
                    background: 'var(--surface2)',
                    border: `1.5px dashed ${file ? 'var(--accent)' : 'var(--border2)'}`,
                }}
            >
                <div className="flex items-start gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: file ? 'var(--success)' : 'var(--border)',
                            color: 'white',
                        }}
                    >
                        <span className="text-sm font-bold">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            Doldurulmuş Excel'i Yükle
                        </p>
                        <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--muted)' }}>
                            .xlsx veya .xls formatı desteklenir
                        </p>

                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFile}
                            className="hidden"
                            id="excel-upload"
                        />
                        <label
                            htmlFor="excel-upload"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer inline-flex"
                            style={{
                                background: 'white',
                                border: '1.5px solid var(--border)',
                                color: 'var(--text2)',
                            }}
                        >
                            <FileSpreadsheet size={15} style={{ color: 'var(--success)' }} />
                            {file ? file.name : 'Excel Dosyası Seç'}
                        </label>
                    </div>
                </div>
            </div>

            {/* Önizleme + Hata */}
            {showPreview && (
                <div className="space-y-3">

                    {/* Özet */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {preview.length > 0 && (
                            <span
                                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-medium"
                                style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--success)', border: '1px solid rgba(0,184,148,0.2)' }}
                            >
                                <CheckCircle size={14} />
                                {preview.length} ürün hazır
                            </span>
                        )}
                        {errors.length > 0 && (
                            <span
                                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-medium"
                                style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)', border: '1px solid rgba(225,112,85,0.2)' }}
                            >
                                <AlertCircle size={14} />
                                {errors.length} satır atlandı
                            </span>
                        )}
                        {preview.length > 0 && (
                            <button
                                onClick={() => setShowPreview(v => !v)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
                                style={{ color: 'var(--accent)', border: '1px solid rgba(115,40,65,0.2)', background: 'var(--accent-soft)' }}
                            >
                                <Eye size={12} /> Önizleme
                            </button>
                        )}
                        <button onClick={reset} className="ml-auto" style={{ color: 'var(--muted)' }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Hata listesi */}
                    {errors.length > 0 && (
                        <div
                            className="rounded-xl p-3 text-xs space-y-1"
                            style={{ background: 'rgba(225,112,85,0.06)', border: '1px solid rgba(225,112,85,0.15)' }}
                        >
                            {errors.map((e, i) => (
                                <p key={i} style={{ color: 'var(--danger)' }}>⚠️ {e}</p>
                            ))}
                        </div>
                    )}

                    {/* Tablo önizleme */}
                    {showPreview && preview.length > 0 && (
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{ border: '1px solid var(--border)' }}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                                            {['Kategori', 'Ürün Adı', 'Fiyat', 'Kalori', 'Alerjenler'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text2)' }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.slice(0, 10).map((row, i) => (
                                            <tr
                                                key={i}
                                                style={{
                                                    borderBottom: i < preview.length - 1 ? '1px solid var(--border)' : 'none',
                                                    background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                                                }}
                                            >
                                                <td className="px-4 py-2.5" style={{ color: 'var(--accent)', fontWeight: 600 }}>{row.category}</td>
                                                <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{row.name}</td>
                                                <td className="px-4 py-2.5" style={{ color: 'var(--text2)' }}>{row.price} ₺</td>
                                                <td className="px-4 py-2.5" style={{ color: 'var(--muted)' }}>{row.calories || '—'}</td>
                                                <td className="px-4 py-2.5" style={{ color: 'var(--muted)' }}>
                                                    {row.allergens?.join(', ') || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                        {preview.length > 10 && (
                                            <tr style={{ background: 'var(--surface2)' }}>
                                                <td colSpan={5} className="px-4 py-2.5 text-center" style={{ color: 'var(--muted)' }}>
                                                    +{preview.length - 10} ürün daha...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Başarı */}
            {status === STATUS.SUCCESS && (
                <div
                    className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                    style={{ background: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)' }}
                >
                    <CheckCircle size={22} style={{ color: 'var(--success)' }} />
                    <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--success)' }}>
                            {imported} ürün başarıyla yüklendi!
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            Ürünleriniz menüde görünüyor.
                        </p>
                    </div>
                </div>
            )}

            {/* Adım 3 — Onayla */}
            {preview.length > 0 && status !== STATUS.SUCCESS && (
                <button
                    onClick={handleImport}
                    disabled={status === STATUS.LOADING}
                    className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 text-white"
                    style={{
                        background: 'linear-gradient(135deg, #00B894, #00967A)',
                        boxShadow: '0 4px 16px rgba(0,184,148,0.3)',
                        opacity: status === STATUS.LOADING ? 0.7 : 1,
                    }}
                >
                    {status === STATUS.LOADING ? (
                        <><Loader2 size={18} className="animate-spin" /> Yükleniyor...</>
                    ) : (
                        <><Upload size={18} /> {preview.length} Ürünü Menüye Ekle</>
                    )}
                </button>
            )}

        </div>
    )
}
