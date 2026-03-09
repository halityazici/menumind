/**
 * ItemManager — Yeniden kullanılabilir liste yönetim bileşeni
 *
 * Düzeltme: `items` prop her render'da yeni referans üretebilir.
 * `dirtyRef` sayesinde kullanıcı değişiklik yaparken parent re-render'ı
 * listeyi sıfırlamaz. Kaydet sonrası dirtyRef false'a döner ve ardından
 * gelen yeni `items` prop'u listeyi doğru şekilde günceller.
 *
 * `onDeleteRequest` prop'u verilirse yerleşik onay modalı yerine
 * dışarıdan özel akış tetiklenir (kategori silmeyle ürün yönetimi için).
 */
import { useState, useEffect, useRef } from 'react'
import {
    Plus, Pencil, Trash2, Check, X, Loader2,
    ToggleLeft, ToggleRight, CheckCircle, Save, AlertTriangle,
} from 'lucide-react'

const inputStyle = {
    padding: '10px 13px', borderRadius: '10px',
    fontSize: '13.5px', outline: 'none', boxSizing: 'border-box',
    background: 'var(--surface2)', border: '1.5px solid var(--border)',
    color: 'var(--text)', fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.18s',
}

/* ── İsim yazarak silme onayı modalı ──────────────────────── */
function DeleteConfirmModal({ itemName, onConfirm, onCancel }) {
    const [typed, setTyped] = useState('')
    const inputRef = useRef(null)
    const matches = typed.trim() === itemName.trim()

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 120)
        return () => clearTimeout(t)
    }, [])

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                background: 'rgba(5,0,5,0.60)',
                backdropFilter: 'blur(12px)',
                animation: 'fadeIn 0.18s ease',
            }}
            onClick={e => e.target === e.currentTarget && onCancel()}
        >
            <div style={{
                width: '100%', maxWidth: '400px',
                background: 'var(--surface)',
                borderRadius: '22px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.36), 0 4px 16px rgba(239,68,68,0.12)',
                overflow: 'hidden',
                animation: 'scaleIn 0.20s cubic-bezier(0.22,1,0.36,1)',
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    padding: '22px 24px 18px',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '-50px', right: '-30px',
                        width: '140px', height: '140px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.16)',
                        }}>
                            <Trash2 size={18} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '10.5px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                                Kalıcı Silme
                            </p>
                            <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.02em', marginTop: '2px' }}>
                                Kaydı Sil
                            </p>
                        </div>
                    </div>
                </div>

                {/* İçerik */}
                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{
                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                        padding: '13px 15px', borderRadius: '12px',
                        background: 'rgba(239,68,68,0.07)',
                        border: '1.5px solid rgba(239,68,68,0.18)',
                    }}>
                        <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                        <div>
                            <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#dc2626', fontFamily: 'Inter, sans-serif', marginBottom: '3px' }}>
                                Bu işlem geri alınamaz
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                                <strong style={{ color: 'var(--text)' }}>"{itemName}"</strong> kalıcı olarak silinecek.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '12.5px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                            Silmek için aşağıya{' '}
                            <strong style={{
                                color: 'var(--text)', fontFamily: 'monospace',
                                background: 'var(--surface2)', padding: '1px 6px',
                                borderRadius: '5px', fontSize: '12px',
                            }}>
                                {itemName}
                            </strong>
                            {' '}yazın:
                        </p>
                        <input
                            ref={inputRef}
                            value={typed}
                            onChange={e => setTyped(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && matches) onConfirm()
                                if (e.key === 'Escape') onCancel()
                            }}
                            placeholder={itemName}
                            style={{
                                ...inputStyle, width: '100%',
                                borderColor: typed.length > 0
                                    ? matches ? '#059669' : 'rgba(239,68,68,0.55)'
                                    : 'var(--border)',
                                background: typed.length > 0
                                    ? matches ? 'rgba(5,150,105,0.05)' : 'rgba(239,68,68,0.04)'
                                    : 'var(--surface2)',
                                transition: 'border-color 0.18s, background 0.18s',
                            }}
                        />
                        {typed.length > 0 && !matches && (
                            <p style={{ fontSize: '11.5px', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
                                ✕ İsim eşleşmiyor
                            </p>
                        )}
                        {matches && (
                            <p style={{ fontSize: '11.5px', color: '#059669', fontFamily: 'Inter, sans-serif' }}>
                                ✓ Onaylandı — silmek için butona tıklayın
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={onCancel}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px',
                                fontSize: '13px', fontWeight: 700,
                                background: 'var(--surface2)', border: '1.5px solid var(--border)',
                                color: 'var(--muted)', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--muted)' }}
                        >
                            İptal
                        </button>
                        <button
                            onClick={matches ? onConfirm : undefined}
                            disabled={!matches}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px',
                                fontSize: '13px', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: matches ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'var(--border)',
                                border: 'none',
                                color: matches ? 'white' : 'var(--muted)',
                                cursor: matches ? 'pointer' : 'not-allowed',
                                fontFamily: 'Inter, sans-serif',
                                boxShadow: matches ? '0 4px 14px rgba(220,38,38,0.30)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Trash2 size={14} /> Kalıcı Olarak Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ══ Ana ItemManager ═══════════════════════════════════════════ */
export default function ItemManager({
    items,
    onSave,
    onDeleteRequest,   // optional: (name, idx, proceedFn) => void  — dışarıdan özel silme akışı
    onToggleRequest,   // optional: (name, idx, proceedFn) => void  — dışarıdan özel pasif akışı (onay için)
    color = '#732841',
    emojiBullet = '🏷️',
    addPlaceholder = 'Yeni isim girin...',
}) {
    const [list, setList] = useState([])
    const [editing, setEditing] = useState(null)
    const [editVal, setEditVal] = useState('')
    const [adding, setAdding] = useState(false)
    const [newVal, setNewVal] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)

    // Kullanıcı değişiklik yaptıysa (dirty) parent re-render'ı listeyi sıfırlamasın
    const dirtyRef = useRef(false)

    useEffect(() => {
        if (!dirtyRef.current) {
            const normalized = items.map(i =>
                typeof i === 'string' ? { name: i, active: true } : i
            )
            setList(normalized)
            setDirty(false)
        }
    }, [items])

    const markDirty = (fn) => {
        dirtyRef.current = true
        fn()
        setDirty(true)
    }

    const handleToggle = (idx) => {
        const item = list[idx]
        // Aktife çekiyorsa — anında uygula, onay gerekmez
        if (!item.active) {
            markDirty(() => setList(l => l.map((it, i) => i === idx ? { ...it, active: true } : it)))
            return
        }
        // Pasife çekiyorsa — dışarıdan onay akışı varsa devret
        const proceedFn = () => markDirty(() =>
            setList(l => l.map((it, i) => i === idx ? { ...it, active: false } : it))
        )
        if (onToggleRequest) {
            onToggleRequest(item.name, idx, proceedFn)
        } else {
            proceedFn()
        }
    }

    // Bir öğeyi listeden kaldır (onay sonrası çağrılır)
    const proceedWithDelete = (idx) => {
        markDirty(() => setList(l => l.filter((_, i) => i !== idx)))
    }

    // Sil butonuna tıklanınca
    const handleDeleteClick = (idx) => {
        if (onDeleteRequest) {
            // Dışarıya devret (örn: kategori silme + ürün yönetimi akışı)
            onDeleteRequest(list[idx].name, idx, () => proceedWithDelete(idx))
        } else {
            // Varsayılan: isim yazarak onay modalı
            setDeleteTarget({ idx, name: list[idx].name })
        }
    }

    // Varsayılan onay modalından "Sil" geldi
    const handleDeleteConfirm = () => {
        proceedWithDelete(deleteTarget.idx)
        setDeleteTarget(null)
    }

    const handleEdit = (idx) => { setEditing(idx); setEditVal(list[idx].name) }

    const commitEdit = () => {
        if (!editVal.trim()) return
        markDirty(() =>
            setList(l => l.map((item, i) => i === editing ? { ...item, name: editVal.trim() } : item))
        )
        setEditing(null)
    }

    const handleAdd = () => {
        if (!newVal.trim()) return
        const exists = list.some(i => i.name.toLowerCase() === newVal.trim().toLowerCase())
        if (exists) { alert('Bu isimde bir kayıt zaten var!'); return }
        markDirty(() => setList(l => [...l, { name: newVal.trim(), active: true }]))
        setNewVal('')
        setAdding(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await onSave(list)
            dirtyRef.current = false   // dirty sıfırlanınca bir sonraki items değişikliği listeyi doğru günceller
            setSaved(true)
            setDirty(false)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const activeCount = list.filter(i => i.active).length

    return (
        <>
            {/* Yerleşik silme onay modalı (onDeleteRequest verilmemişse kullanılır) */}
            {deleteTarget && (
                <DeleteConfirmModal
                    itemName={deleteTarget.name}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                {/* Başlık */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg)', flexShrink: 0,
                }}>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                        <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{activeCount}</strong> aktif
                        {list.length - activeCount > 0 && (
                            <>, <strong style={{ color: 'var(--muted)', fontWeight: 600 }}>{list.length - activeCount}</strong> pasif</>
                        )}
                        <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                        toplam {list.length} kayıt
                    </p>
                    <button
                        onClick={() => { setAdding(true); setNewVal('') }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            fontSize: '12.5px', fontWeight: 700,
                            background: `${color}12`, color,
                            border: `1.5px solid ${color}28`,
                            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = `${color}22`}
                        onMouseLeave={e => e.currentTarget.style.background = `${color}12`}
                    >
                        <Plus size={13} /> Yeni Ekle
                    </button>
                </div>

                {/* Yeni kayıt formu */}
                {adding && (
                    <div style={{
                        display: 'flex', gap: '8px', alignItems: 'center',
                        padding: '12px 20px',
                        background: `${color}06`,
                        borderBottom: '1px solid var(--border)',
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: '15px', flexShrink: 0 }}>{emojiBullet}</span>
                        <input
                            autoFocus
                            placeholder={addPlaceholder}
                            value={newVal}
                            onChange={e => setNewVal(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleAdd()
                                if (e.key === 'Escape') { setAdding(false); setNewVal('') }
                            }}
                            style={{ ...inputStyle, flex: 1 }}
                            onFocus={e => e.currentTarget.style.borderColor = color}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        />
                        <button onClick={handleAdd} style={{
                            width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: color, color: 'white', border: 'none', cursor: 'pointer',
                        }}>
                            <Check size={14} />
                        </button>
                        <button onClick={() => { setAdding(false); setNewVal('') }} style={{
                            width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--surface2)', color: 'var(--muted)',
                            border: '1.5px solid var(--border)', cursor: 'pointer',
                        }}>
                            <X size={13} />
                        </button>
                    </div>
                )}

                {/* Liste */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {list.length === 0 ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '48px 24px', flexDirection: 'column', gap: '10px',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `${color}10`, fontSize: '22px',
                            }}>
                                {emojiBullet}
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                                Henüz kayıt yok.<br />
                                <span style={{ color, fontWeight: 600 }}>"Yeni Ekle"</span> butonuyla başlayın.
                            </p>
                        </div>
                    ) : (
                        list.map((item, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '11px 20px',
                                borderBottom: idx < list.length - 1 ? '1px solid var(--border)' : 'none',
                                opacity: item.active ? 1 : 0.48,
                                background: editing === idx ? `${color}05` : 'transparent',
                                transition: 'opacity 0.2s, background 0.15s',
                            }}>
                                <div style={{
                                    width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                                    background: item.active ? color : 'var(--border2)',
                                    boxShadow: item.active ? `0 0 6px ${color}60` : 'none',
                                    transition: 'all 0.2s',
                                }} />

                                {editing === idx ? (
                                    <input
                                        autoFocus
                                        value={editVal}
                                        onChange={e => setEditVal(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') commitEdit()
                                            if (e.key === 'Escape') setEditing(null)
                                        }}
                                        style={{ ...inputStyle, flex: 1 }}
                                        onFocus={e => e.currentTarget.style.borderColor = color}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    />
                                ) : (
                                    <p style={{
                                        flex: 1, fontSize: '13.5px', fontWeight: 500,
                                        color: item.active ? 'var(--text)' : 'var(--muted)',
                                        fontFamily: 'Inter, sans-serif', lineHeight: 1.4,
                                    }}>
                                        {item.name}
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                    {editing === idx ? (
                                        <>
                                            <button onClick={commitEdit} style={{
                                                width: '30px', height: '30px', borderRadius: '8px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: color, color: 'white', border: 'none', cursor: 'pointer',
                                            }}>
                                                <Check size={13} />
                                            </button>
                                            <button onClick={() => setEditing(null)} style={{
                                                width: '30px', height: '30px', borderRadius: '8px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'var(--surface2)', color: 'var(--muted)',
                                                border: '1.5px solid var(--border)', cursor: 'pointer',
                                            }}>
                                                <X size={12} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleToggle(idx)}
                                                title={item.active ? 'Pasif yap' : 'Aktif yap'}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    padding: '3px', borderRadius: '6px',
                                                    display: 'flex', alignItems: 'center',
                                                    color: item.active ? '#059669' : 'var(--muted)',
                                                    transition: 'color 0.18s',
                                                }}
                                            >
                                                {item.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(idx)}
                                                title="Düzenle"
                                                style={{
                                                    width: '30px', height: '30px', borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'var(--surface2)', color: 'var(--text2)',
                                                    border: '1.5px solid var(--border)', cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = `${color}12`
                                                    e.currentTarget.style.color = color
                                                    e.currentTarget.style.borderColor = `${color}30`
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'var(--surface2)'
                                                    e.currentTarget.style.color = 'var(--text2)'
                                                    e.currentTarget.style.borderColor = 'var(--border)'
                                                }}
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(idx)}
                                                title="Sil"
                                                style={{
                                                    width: '30px', height: '30px', borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(239,68,68,0.07)', color: 'var(--danger)',
                                                    border: '1.5px solid rgba(239,68,68,0.18)', cursor: 'pointer',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg)', flexShrink: 0,
                }}>
                    <p style={{
                        fontSize: '11.5px', fontFamily: 'Inter, sans-serif',
                        color: dirty ? '#B45309' : 'var(--muted)',
                    }}>
                        {dirty ? '⚠️ Kaydedilmemiş değişiklikler' : '✓ Güncel'}
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={saving || !dirty}
                        style={{
                            padding: '9px 20px', borderRadius: '10px',
                            fontSize: '12.5px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            color: 'white',
                            background: saved
                                ? 'linear-gradient(135deg,#00B894,#00967A)'
                                : (!dirty || saving) ? 'var(--border2)'
                                    : `linear-gradient(135deg, ${color}, ${color}cc)`,
                            boxShadow: saved
                                ? '0 4px 12px rgba(0,184,148,0.30)'
                                : (!dirty || saving) ? 'none'
                                    : `0 4px 12px ${color}28`,
                            border: 'none',
                            cursor: (!dirty || saving) ? 'not-allowed' : 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            minWidth: '100px', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        {saving
                            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Kaydediyor...</>
                            : saved
                                ? <><CheckCircle size={13} /> Kaydedildi!</>
                                : <><Save size={13} /> Kaydet</>
                        }
                    </button>
                </div>
            </div>
        </>
    )
}
