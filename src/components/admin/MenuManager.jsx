import { useState, useRef, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight, ImagePlus, Eye, EyeOff, ChevronRight, AlertTriangle, Tag, Star, Sparkles, Search } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { uploadMenuImage, supabase } from '../../lib/supabaseClient'
import noImage from '../../assets/no-image.png'
import ItemManager from './ItemManager'

const DEFAULT_CATEGORIES = ['Başlangıçlar', 'Çorbalar', 'Ana Yemekler', 'Tatlılar', 'İçecekler', 'Diğer']
const DEFAULT_ALLERGENS = ['Gluten', 'Süt', 'Yumurta', 'Balık', 'Kabuklu Deniz Ürünleri', 'Yer Fıstığı', 'Fındık', 'Soya', 'Kereviz', 'Susam']
const EMPTY_FORM = { name: '', description: '', price: '', category: 'Ana Yemekler', allergens: [], is_available: true, is_new: false, image_url: '' }

/* ── Scroll Lock — modal açıkken arka sayfa kaymasını engeller ── */
let _scrollLockCount = 0
function useScrollLock() {
    useEffect(() => {
        _scrollLockCount++
        if (_scrollLockCount === 1) document.body.style.overflow = 'hidden'
        return () => {
            _scrollLockCount = Math.max(0, _scrollLockCount - 1)
            if (_scrollLockCount === 0) document.body.style.overflow = ''
        }
    }, [])
}

/* ── Ürün Detay & Aksiyon Drawer ───────────────────────────── */
function ItemDetailDrawer({ item, onEdit, onDelete, onToggle, onClose }) {
    useScrollLock()
    const [deleting, setDeleting] = useState(false)
    const [toggling, setToggling] = useState(false)
    const [descExpanded, setDescExpanded] = useState(false)
    const DESC_LIMIT = 180

    const handleDelete = async () => {
        if (!confirm(`"${item.name}" silinsin mi? Bu işlem geri alınamaz.`)) return
        setDeleting(true)
        await onDelete(item.id)
        onClose()
    }

    const handleToggle = async () => {
        setToggling(true)
        await onToggle(item)
        setToggling(false)
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 70,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                background: 'rgba(0,0,0,0.40)',
                backdropFilter: 'blur(6px)',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    width: '100%', maxWidth: '480px',
                    background: 'var(--surface)',
                    borderRadius: '28px 28px 0 0',
                    boxShadow: '0 -12px 48px rgba(0,0,0,0.18)',
                    overflow: 'hidden',
                    animation: 'modalUp 0.28s cubic-bezier(0.22,1,0.36,1)',
                }}
            >
                {/* Drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
                    <div style={{ width: '36px', height: '4px', borderRadius: '4px', background: 'var(--border2)' }} />
                </div>

                {/* Ürün başlığı */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px 20px',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{
                        width: '80px', height: '80px',
                        borderRadius: '18px', overflow: 'hidden', flexShrink: 0,
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <img
                            src={item.image_url || noImage}
                            alt={item.name}
                            style={{
                                width: '100%', height: '100%',
                                objectFit: item.image_url ? 'cover' : 'contain',
                                padding: item.image_url ? 0 : '14px',
                                display: 'block',
                            }}
                            onError={e => {
                                e.target.src = noImage
                                e.target.style.objectFit = 'contain'
                                e.target.style.padding = '14px'
                            }}
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                            <h2 style={{
                                fontSize: '17px', fontWeight: 700,
                                color: 'var(--text)', fontFamily: 'Poppins',
                                lineHeight: 1.3, letterSpacing: '-0.01em',
                            }}>
                                {item.name}
                            </h2>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '2px 8px', borderRadius: '100px', flexShrink: 0,
                                fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                                background: item.is_available ? 'rgba(16,185,129,0.10)' : 'var(--surface2)',
                                color: item.is_available ? '#059669' : 'var(--muted)',
                                border: `1px solid ${item.is_available ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                            }}>
                                <span style={{
                                    width: '5px', height: '5px', borderRadius: '50%',
                                    background: item.is_available ? '#059669' : 'var(--muted)',
                                    display: 'block',
                                }} />
                                {item.is_available ? 'Aktif' : 'Pasif'}
                            </span>
                        </div>

                        {item.description && (() => {
                            const isLong = item.description.length > DESC_LIMIT
                            const shown = isLong && !descExpanded
                                ? item.description.slice(0, DESC_LIMIT) + '…'
                                : item.description
                            return (
                                <div>
                                    <p style={{
                                        fontSize: '13px', color: 'var(--muted)',
                                        marginTop: '5px', lineHeight: 1.55,
                                        fontFamily: 'Inter, sans-serif',
                                    }}>
                                        {shown}
                                    </p>
                                    {isLong && (
                                        <button
                                            onClick={() => setDescExpanded(v => !v)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: '12px', fontWeight: 600, padding: '3px 0',
                                                color: 'var(--accent)', fontFamily: 'Inter, sans-serif',
                                                display: 'flex', alignItems: 'center', gap: '3px',
                                                marginTop: '2px',
                                            }}
                                        >
                                            {descExpanded ? 'Daha az göster ↑' : 'Devamını gör ↓'}
                                        </button>
                                    )}
                                </div>
                            )
                        })()}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                                fontSize: '18px', fontWeight: 800,
                                color: 'var(--accent)', fontFamily: 'Poppins',
                                letterSpacing: '-0.02em',
                            }}>
                                {Number(item.price).toFixed(2)} ₺
                            </span>
                            {item.category && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: '2px 8px', borderRadius: '100px',
                                    fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                                    background: 'var(--surface2)', color: 'var(--text2)',
                                    border: '1px solid var(--border)',
                                }}>
                                    <Tag size={9} />
                                    {item.category}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            width: '34px', height: '34px', flexShrink: 0,
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--surface2)', border: '1px solid var(--border)',
                            color: 'var(--muted)', cursor: 'pointer',
                            alignSelf: 'flex-start',
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Alerjen listesi */}
                {item.allergens?.length > 0 && (
                    <div style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                    }}>
                        <AlertTriangle size={14} style={{ color: '#B45309', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{ fontSize: '11.5px', fontWeight: 600, color: '#B45309', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>
                                Alerjen İçerir
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {item.allergens.map(a => (
                                    <span key={a} style={{
                                        padding: '3px 10px', borderRadius: '100px',
                                        fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                                        background: 'rgba(217,119,6,0.09)',
                                        color: '#92400E',
                                        border: '1px solid rgba(217,119,6,0.20)',
                                    }}>
                                        {a}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Aksiyon butonları */}
                <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Toggle */}
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '14px 18px',
                            borderRadius: '16px',
                            background: item.is_available ? 'rgba(16,185,129,0.07)' : 'var(--surface2)',
                            border: `1.5px solid ${item.is_available ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                            cursor: toggling ? 'not-allowed' : 'pointer',
                            transition: 'all 0.18s',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.is_available
                                ? <Eye size={18} style={{ color: '#059669' }} />
                                : <EyeOff size={18} style={{ color: 'var(--muted)' }} />
                            }
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
                                    {item.is_available ? 'Menüde Gösteriliyor' : 'Menüden Gizlendi'}
                                </p>
                                <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                                    {item.is_available ? 'Tıklayarak gizleyebilirsiniz' : 'Tıklayarak aktif edebilirsiniz'}
                                </p>
                            </div>
                        </div>
                        {toggling
                            ? <Loader2 size={18} style={{ color: 'var(--muted)', animation: 'spin 1s linear infinite' }} />
                            : item.is_available
                                ? <ToggleRight size={28} style={{ color: '#059669', flexShrink: 0 }} />
                                : <ToggleLeft size={28} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                        }
                    </button>

                    {/* Düzenle + Sil */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => { onClose(); setTimeout(() => onEdit(item), 50) }}
                            style={{
                                flex: 1, padding: '14px',
                                borderRadius: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                fontSize: '14px', fontWeight: 700,
                                color: 'white',
                                background: 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
                                boxShadow: '0 4px 14px rgba(123,45,69,0.30)',
                                border: 'none', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 8px 28px rgba(123,45,69,0.38)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(123,45,69,0.30)'
                            }}
                        >
                            <Pencil size={15} />
                            Düzenle
                        </button>

                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{
                                flex: 1, padding: '14px',
                                borderRadius: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                fontSize: '14px', fontWeight: 700,
                                color: 'var(--danger)',
                                background: 'rgba(239,68,68,0.08)',
                                border: '1.5px solid rgba(239,68,68,0.25)',
                                cursor: deleting ? 'not-allowed' : 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'background 0.18s',
                            }}
                            onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                            onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                        >
                            {deleting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={15} />}
                            Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Edit / Add Modal (centered, two-column) ─────────────────── */
function ItemEditModal({ form, setForm, onSave, onClose, saving, imgUploading, imgPreview, onImageUpload, onImageRemove, imgInputRef, isEditing, categories, allergenOptions }) {
    useScrollLock()
    const [customCat, setCustomCat] = useState('')
    const [showCustom, setShowCustom] = useState(false)

    const inputStyle = {
        width: '100%', padding: '12px 14px',
        borderRadius: '12px', fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        outline: 'none', boxSizing: 'border-box',
        background: 'var(--surface)', border: '1.5px solid var(--border)',
        color: 'var(--text)', transition: 'border-color 0.15s',
    }

    const labelStyle = {
        display: 'block', fontSize: '11.5px', fontWeight: 700,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        color: 'var(--text2)', marginBottom: '7px',
        fontFamily: 'Inter, sans-serif',
    }

    const sectionStyle = {
        padding: '20px', borderRadius: '16px',
        background: 'var(--surface2)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: '14px',
    }

    const sectionTitle = {
        fontSize: '13px', fontWeight: 700,
        color: 'var(--text)', fontFamily: 'Inter, sans-serif',
        marginBottom: '4px',
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 80,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
                background: 'rgba(20,8,16,0.60)',
                backdropFilter: 'blur(10px)',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                width: '100%', maxWidth: '860px',
                background: 'var(--surface)',
                borderRadius: '24px',
                boxShadow: '0 32px 72px rgba(0,0,0,0.30), 0 2px 12px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column',
                maxHeight: '92vh',
                overflow: 'hidden',
                animation: 'scaleIn 0.22s cubic-bezier(0.22,1,0.36,1)',
            }}>

                {/* ── Header ── */}
                <div style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 28px',
                    background: 'linear-gradient(135deg, #7B2D45 0%, #4A1829 100%)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Decorative glow */}
                    <div style={{
                        position: 'absolute', top: '-50px', right: '-30px',
                        width: '200px', height: '200px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-30px', left: '120px',
                        width: '120px', height: '120px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div>
                        <h2 style={{
                            fontSize: '20px', fontWeight: 800,
                            color: 'white', fontFamily: 'Poppins',
                            letterSpacing: '-0.02em', lineHeight: 1.2,
                        }}>
                            {isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                        </h2>
                        <p style={{
                            fontSize: '13px', color: 'rgba(255,255,255,0.55)',
                            marginTop: '4px', fontFamily: 'Inter, sans-serif',
                        }}>
                            {isEditing ? 'Ürün bilgilerini güncelleyebilirsiniz' : 'Menüye yeni bir ürün ekleyin'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '38px', height: '38px',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            color: 'rgba(255,255,255,0.80)',
                            cursor: 'pointer', flexShrink: 0,
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Body: 2-column grid ── */}
                <div style={{
                    flex: 1, overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr',
                    gap: '0',
                }}>
                    {/* LEFT: Görsel + Kategori + Toggle */}
                    <div style={{
                        padding: '24px 20px',
                        borderRight: '1px solid var(--border)',
                        background: 'var(--bg)',
                        display: 'flex', flexDirection: 'column', gap: '20px',
                    }}>

                        {/* Görsel yükleme alanı */}
                        <div>
                            <label style={labelStyle}>Ürün Görseli</label>
                            <input ref={imgInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />

                            {/* Preview / placeholder */}
                            <div
                                style={{
                                    width: '100%', aspectRatio: '1',
                                    borderRadius: '18px', overflow: 'hidden',
                                    background: 'var(--surface2)',
                                    border: '2px dashed var(--border2)',
                                    position: 'relative', cursor: 'pointer',
                                }}
                                onClick={() => !imgUploading && imgInputRef.current?.click()}
                                onMouseEnter={e => {
                                    e.currentTarget.querySelector('[data-overlay]').style.opacity = '1'
                                    if (!imgPreview) e.currentTarget.style.borderColor = 'var(--accent)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.querySelector('[data-overlay]').style.opacity = '0'
                                    if (!imgPreview) e.currentTarget.style.borderColor = 'var(--border2)'
                                }}
                            >
                                {imgPreview ? (
                                    <img
                                        src={imgPreview}
                                        alt="Ürün görseli"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--muted)', padding: '16px', boxSizing: 'border-box',
                                    }}>
                                        <ImagePlus size={32} style={{ marginBottom: '10px', opacity: 0.6 }} />
                                        <p style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                                            Görsel yüklemek için tıklayın
                                        </p>
                                        <p style={{ fontSize: '11.5px', marginTop: '4px', fontFamily: 'Inter, sans-serif', textAlign: 'center', opacity: 0.7 }}>
                                            PNG, JPG, GIF (max 5MB)
                                        </p>
                                    </div>
                                )}

                                {/* hover overlay */}
                                <div
                                    data-overlay="true"
                                    style={{
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(0,0,0,0.36)',
                                        borderRadius: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: 0, transition: 'opacity 0.18s',
                                    }}
                                >
                                    {imgUploading
                                        ? <Loader2 size={28} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
                                        : <ImagePlus size={28} style={{ color: 'white' }} />
                                    }
                                </div>
                            </div>

                            {/* Alt butonlar */}
                            {imgPreview && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => imgInputRef.current?.click()}
                                        style={{
                                            flex: 1, padding: '9px 0',
                                            borderRadius: '10px', fontSize: '12.5px', fontWeight: 600,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                            background: 'var(--accent-soft)', color: 'var(--accent)',
                                            border: '1px solid rgba(123,45,69,0.22)',
                                            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                        }}
                                    >
                                        <ImagePlus size={12} /> Değiştir
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onImageRemove}
                                        style={{
                                            flex: 1, padding: '9px 0',
                                            borderRadius: '10px', fontSize: '12.5px', fontWeight: 600,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                            background: 'rgba(239,68,68,0.08)', color: 'var(--danger)',
                                            border: '1px solid rgba(239,68,68,0.20)',
                                            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                        }}
                                    >
                                        <X size={12} /> Kaldır
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Kategori */}
                        <div>
                            <label style={labelStyle}>Kategori</label>
                            <select
                                value={showCustom ? '__custom__' : form.category}
                                onChange={e => {
                                    if (e.target.value === '__custom__') {
                                        setShowCustom(true); setCustomCat('')
                                        setForm(f => ({ ...f, category: '' }))
                                    } else {
                                        setShowCustom(false)
                                        setForm(f => ({ ...f, category: e.target.value }))
                                    }
                                }}
                                style={{ ...inputStyle, appearance: 'auto' }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="__custom__">+ Yeni kategori...</option>
                            </select>
                            {showCustom && (
                                <input
                                    autoFocus
                                    placeholder="Kategori adını yazın"
                                    value={customCat}
                                    onChange={e => {
                                        setCustomCat(e.target.value)
                                        setForm(f => ({ ...f, category: e.target.value }))
                                    }}
                                    style={{
                                        ...inputStyle,
                                        marginTop: '8px',
                                        background: 'var(--accent-soft)',
                                        border: '1.5px solid rgba(123,45,69,0.35)',
                                    }}
                                />
                            )}
                        </div>

                        {/* Menüde Göster toggle */}
                        <div style={{
                            padding: '14px 16px', borderRadius: '14px',
                            background: form.is_available ? 'rgba(16,185,129,0.07)' : 'var(--surface2)',
                            border: `1.5px solid ${form.is_available ? 'rgba(16,185,129,0.22)' : 'var(--border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'all 0.2s',
                        }}>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>
                                    Menüde Göster
                                </p>
                                <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                                    {form.is_available ? 'Müşteriler görebilir' : 'Gizlenmiş durumda'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                            >
                                {form.is_available
                                    ? <ToggleRight size={34} style={{ color: '#059669' }} />
                                    : <ToggleLeft size={34} style={{ color: 'var(--muted)' }} />
                                }
                            </button>
                        </div>

                        {/* Yeni Ürün toggle */}
                        <div style={{
                            padding: '14px 16px', borderRadius: '14px',
                            background: form.is_new ? 'rgba(251,191,36,0.08)' : 'var(--surface2)',
                            border: `1.5px solid ${form.is_new ? 'rgba(251,191,36,0.30)' : 'var(--border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'all 0.2s',
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                                    {form.is_new && <Sparkles size={13} style={{ color: '#D97706' }} />}
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: form.is_new ? '#D97706' : 'var(--text)', fontFamily: 'Inter, sans-serif', lineHeight: 1.3, transition: 'color 0.2s' }}>
                                        Yeni Ürün
                                    </p>
                                </div>
                                <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                                    {form.is_new ? 'Asistan özellikle önerecek' : 'Standart ürün'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, is_new: !f.is_new }))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                            >
                                {form.is_new
                                    ? <ToggleRight size={34} style={{ color: '#D97706' }} />
                                    : <ToggleLeft size={34} style={{ color: 'var(--muted)' }} />
                                }
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Form alanları */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

                        {/* Temel Bilgiler */}
                        <div style={sectionStyle}>
                            <p style={sectionTitle}>Temel Bilgiler</p>

                            <div>
                                <label style={labelStyle}>
                                    Ürün Adı <span style={{ color: 'var(--danger)' }}>*</span>
                                </label>
                                <input
                                    placeholder="Örn: Akdeniz Salatası"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    style={inputStyle}
                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>İçerik / Açıklama</label>
                                <textarea
                                    placeholder="Malzemeler, pişirme yöntemi veya kısa açıklama..."
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={4}
                                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>
                                    Fiyat (₺) <span style={{ color: 'var(--danger)' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                        fontSize: '14px', fontWeight: 700, color: 'var(--accent)',
                                        fontFamily: 'Inter, sans-serif', pointerEvents: 'none', userSelect: 'none',
                                    }}>₺</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                        style={{ ...inputStyle, paddingLeft: '30px' }}
                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Alerjenler */}
                        <div style={sectionStyle}>
                            <div>
                                <p style={sectionTitle}>Alerjenler</p>
                                <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                                    Ürünün içerdiği alerjenleri seçin
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {(allergenOptions || []).map(a => {
                                    const sel = form.allergens.includes(a)
                                    return (
                                        <button
                                            key={a}
                                            type="button"
                                            onClick={() => setForm(f => ({
                                                ...f,
                                                allergens: f.allergens.includes(a)
                                                    ? f.allergens.filter(x => x !== a)
                                                    : [...f.allergens, a]
                                            }))}
                                            style={{
                                                padding: '7px 14px',
                                                borderRadius: '100px',
                                                fontSize: '12.5px', fontWeight: sel ? 700 : 500,
                                                fontFamily: 'Inter, sans-serif',
                                                cursor: 'pointer',
                                                background: sel ? 'rgba(217,119,6,0.12)' : 'var(--surface)',
                                                border: `1.5px solid ${sel ? 'rgba(217,119,6,0.40)' : 'var(--border)'}`,
                                                color: sel ? '#92400E' : 'var(--muted)',
                                                transition: 'all 0.15s',
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            }}
                                        >
                                            {sel && <span style={{ fontSize: '11px' }}>⚠️</span>}
                                            {a}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px',
                    padding: '16px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg)',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px', borderRadius: '12px',
                            fontSize: '14px', fontWeight: 600,
                            background: 'var(--surface)', color: 'var(--muted)',
                            border: '1.5px solid var(--border)',
                            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                    >
                        İptal
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving || imgUploading}
                        style={{
                            padding: '12px 32px', borderRadius: '12px',
                            fontSize: '14px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            color: 'white',
                            background: (saving || imgUploading) ? 'var(--border2)' : 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
                            boxShadow: (saving || imgUploading) ? 'none' : '0 4px 18px rgba(123,45,69,0.35)',
                            border: 'none',
                            cursor: (saving || imgUploading) ? 'not-allowed' : 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            minWidth: '160px',
                            transition: 'all 0.18s',
                        }}
                        onMouseEnter={e => {
                            if (!saving && !imgUploading) {
                                e.currentTarget.style.boxShadow = '0 8px 26px rgba(123,45,69,0.45)'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 4px 18px rgba(123,45,69,0.35)'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                    >
                        {saving
                            ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Kaydediliyor...</>
                            : <><Check size={15} /> {isEditing ? 'Değişiklikleri Kaydet' : 'Ürünü Ekle'}</>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ── Ürün Kartı ─────────────────────────────────────────────── */
function MenuItem({ item, onClick }) {
    const [hovered, setHovered] = useState(false)

    return (
        <div
            onClick={() => onClick(item)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px',
                borderRadius: '18px',
                background: hovered ? 'var(--surface2)' : (item.is_new ? 'rgba(251,191,36,0.04)' : 'var(--surface)'),
                border: item.is_new
                    ? `1.5px solid ${hovered ? 'rgba(251,191,36,0.55)' : 'rgba(251,191,36,0.35)'}`
                    : `1.5px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
                opacity: item.is_available ? 1 : 0.55,
                boxShadow: item.is_new
                    ? (hovered ? '0 4px 16px rgba(251,191,36,0.14)' : '0 1px 6px rgba(251,191,36,0.08)')
                    : (hovered ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)'),
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                position: 'relative',
            }}
        >
            <div style={{
                width: '56px', height: '56px',
                borderRadius: '14px', overflow: 'hidden', flexShrink: 0,
                background: 'var(--surface2)', border: '1px solid var(--border)',
            }}>
                <img
                    src={item.image_url || noImage}
                    alt={item.name}
                    style={{
                        width: '100%', height: '100%',
                        objectFit: item.image_url ? 'cover' : 'contain',
                        padding: item.image_url ? 0 : '10px',
                        display: 'block',
                    }}
                    onError={e => {
                        e.target.src = noImage
                        e.target.style.objectFit = 'contain'
                        e.target.style.padding = '10px'
                    }}
                />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <p style={{
                        fontSize: '13.5px', fontWeight: 600, color: 'var(--text)',
                        fontFamily: 'Inter, sans-serif', lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {item.name}
                    </p>
                    {item.is_new && (
                        <span style={{
                            fontSize: '10px', padding: '2px 7px', borderRadius: '6px', flexShrink: 0,
                            background: 'rgba(251,191,36,0.15)', color: '#92400E', fontWeight: 700,
                            border: '1px solid rgba(251,191,36,0.40)',
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                        }}>
                            ✨ YENİ
                        </span>
                    )}
                    {item.allergens?.length > 0 && (
                        <span style={{
                            fontSize: '10px', padding: '1.5px 6px', borderRadius: '6px', flexShrink: 0,
                            background: 'rgba(217,119,6,0.09)', color: '#B45309', fontWeight: 600,
                        }}>
                            ⚠️ Alerjen
                        </span>
                    )}
                    {!item.is_available && (
                        <span style={{
                            fontSize: '10px', padding: '1.5px 6px', borderRadius: '6px', flexShrink: 0,
                            background: 'var(--surface2)', color: 'var(--muted)', fontWeight: 600,
                            border: '1px solid var(--border)',
                        }}>
                            Pasif
                        </span>
                    )}
                </div>
                {item.description && (
                    <p style={{
                        fontSize: '12px', marginTop: '3px', color: 'var(--muted)',
                        fontFamily: 'Inter, sans-serif',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {item.description}
                    </p>
                )}
                <p style={{
                    fontSize: '14px', fontWeight: 800, marginTop: '5px',
                    color: 'var(--accent)', fontFamily: 'Poppins', letterSpacing: '-0.01em',
                }}>
                    {Number(item.price).toFixed(2)} ₺
                </p>
            </div>

            <div style={{
                flexShrink: 0,
                width: '28px', height: '28px',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hovered ? 'var(--accent-soft)' : 'transparent',
                color: hovered ? 'var(--accent)' : 'var(--border2)',
                transition: 'all 0.18s',
            }}>
                <ChevronRight size={15} />
            </div>
        </div>
    )
}

/* ── Settings'ten kategori / alerjen listesi çıkarma ─────── */
function parseCategoriesFromSettings(settings) {
    try {
        const raw = settings?.categories_config
        if (!raw) return DEFAULT_CATEGORIES
        const parsed = JSON.parse(raw)
        const active = parsed.filter(c => c.active !== false).map(c => c.name)
        return active.length > 0 ? active : DEFAULT_CATEGORIES
    } catch { return DEFAULT_CATEGORIES }
}

function parseAllergensFromSettings(settings) {
    try {
        const raw = settings?.allergens_config
        if (!raw) return DEFAULT_ALLERGENS
        const parsed = JSON.parse(raw)
        const active = parsed.filter(a => a.active !== false).map(a => a.name)
        return active.length > 0 ? active : DEFAULT_ALLERGENS
    } catch { return DEFAULT_ALLERGENS }
}

function parseRawList(settings, key, defaults) {
    try {
        const raw = settings?.[key]
        if (!raw) return defaults.map(n => ({ name: n, active: true }))
        return JSON.parse(raw)
    } catch { return defaults.map(n => ({ name: n, active: true })) }
}

/* ══ Kategori Silme Modalı — ürün yönetimi dahil ═════════════ */
function CategoryDeleteModal({ categoryName, affectedItems, otherCategories, onConfirm, onCancel }) {
    useScrollLock()
    const [action, setAction] = useState('inactive') // 'inactive' | 'move' | 'diğer'
    const [targetCat, setTargetCat] = useState(otherCategories[0] || '')
    const [typed, setTyped] = useState('')
    const inputRef = useRef(null)

    const nameMatches = typed.trim() === categoryName.trim()
    const hasProducts = affectedItems.length > 0
    const canDelete = nameMatches && (action !== 'move' || targetCat.trim() !== '')

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 200)
        return () => clearTimeout(t)
    }, [])

    const ACTIONS = [
        { id: 'inactive', emoji: '⏸️', label: 'Ürünleri pasif yap', desc: 'Bu kategorideki ürünler menüde gizlenir, silinmez' },
        { id: 'move', emoji: '📦', label: 'Başka kategoriye taşı', desc: 'Ürünleri seçeceğiniz kategoriye aktarır' },
        { id: 'diğer', emoji: '🗂️', label: '\'Diğer\' kategorisine taşı', desc: 'Ürünler \'Diğer\' kategorisi altında görünmeye devam eder' },
    ]

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                background: 'rgba(5,0,5,0.65)',
                backdropFilter: 'blur(14px)',
                animation: 'fadeIn 0.18s ease',
            }}
            onClick={e => e.target === e.currentTarget && onCancel()}
        >
            <div style={{
                width: '100%', maxWidth: '440px',
                background: 'var(--surface)',
                borderRadius: '22px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.40), 0 4px 16px rgba(220,38,38,0.12)',
                overflow: 'hidden',
                animation: 'scaleIn 0.22s cubic-bezier(0.22,1,0.36,1)',
            }}>

                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
                    padding: '20px 22px 16px',
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
                            <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.60)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                                Kategori Silme
                            </p>
                            <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.02em', marginTop: '2px', lineHeight: 1.2 }}>
                                "{categoryName}"
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '60vh' }}>

                    {/* Etkilenen ürün uyarısı */}
                    {hasProducts ? (
                        <div style={{
                            padding: '13px 15px', borderRadius: '12px',
                            background: 'rgba(245,158,11,0.09)',
                            border: '1.5px solid rgba(245,158,11,0.28)',
                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                        }}>
                            <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#d97706', fontFamily: 'Inter, sans-serif', marginBottom: '3px' }}>
                                    {affectedItems.length} ürün bu kategoride
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                                    Kategori silinmeden önce bu ürünlere ne yapılacağını seçin.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: '12px 15px', borderRadius: '12px',
                            background: 'rgba(239,68,68,0.07)',
                            border: '1.5px solid rgba(239,68,68,0.18)',
                            display: 'flex', gap: '10px', alignItems: 'center',
                        }}>
                            <AlertTriangle size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
                            <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                                Bu kategoride ürün yok. Doğrudan silebilirsiniz.
                            </p>
                        </div>
                    )}

                    {/* Ürün işlem seçenekleri — sadece etkilenen ürün varsa */}
                    {hasProducts && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Ürünlere ne yapılsın?
                            </p>
                            {ACTIONS.map(a => {
                                const isSelected = action === a.id
                                return (
                                    <button
                                        key={a.id}
                                        onClick={() => setAction(a.id)}
                                        style={{
                                            padding: '12px 14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
                                            border: isSelected ? '2px solid #732841' : '1.5px solid var(--border)',
                                            background: isSelected ? 'rgba(115,40,65,0.08)' : 'var(--surface2)',
                                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{a.emoji}</span>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#732841' : 'var(--text)', fontFamily: 'Inter, sans-serif', marginBottom: '2px' }}>
                                                {a.label}
                                            </p>
                                            <p style={{ fontSize: '11.5px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
                                                {a.desc}
                                            </p>
                                        </div>
                                        {/* Radio indicator */}
                                        <div style={{
                                            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                                            border: isSelected ? '5px solid #732841' : '2px solid var(--border)',
                                            marginLeft: 'auto', marginTop: '2px',
                                            transition: 'all 0.15s',
                                        }} />
                                    </button>
                                )
                            })}

                            {/* Kategori seçici — sadece 'move' seçiliyse */}
                            {action === 'move' && (
                                <div style={{ marginTop: '4px' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>
                                        Hedef kategori:
                                    </p>
                                    <select
                                        value={targetCat}
                                        onChange={e => setTargetCat(e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px 13px', borderRadius: '10px',
                                            fontSize: '13.5px', outline: 'none',
                                            background: 'var(--surface2)', border: '1.5px solid var(--border)',
                                            color: 'var(--text)', fontFamily: 'Inter, sans-serif',
                                            cursor: 'pointer',
                                        }}
                                        onFocus={e => e.currentTarget.style.borderColor = '#732841'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    >
                                        {otherCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* İsim onay alanı */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        <p style={{ fontSize: '12.5px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                            Silmek için aşağıya{' '}
                            <strong style={{
                                color: 'var(--text)', fontFamily: 'monospace',
                                background: 'var(--surface2)', padding: '1px 6px',
                                borderRadius: '5px', fontSize: '12px',
                            }}>
                                {categoryName}
                            </strong>
                            {' '}yazın:
                        </p>
                        <input
                            ref={inputRef}
                            value={typed}
                            onChange={e => setTyped(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && canDelete) onConfirm({ action, targetCat })
                                if (e.key === 'Escape') onCancel()
                            }}
                            placeholder={categoryName}
                            style={{
                                padding: '10px 13px', borderRadius: '10px',
                                fontSize: '13.5px', outline: 'none', width: '100%', boxSizing: 'border-box',
                                background: typed.length > 0
                                    ? nameMatches ? 'rgba(5,150,105,0.05)' : 'rgba(239,68,68,0.04)'
                                    : 'var(--surface2)',
                                border: '1.5px solid',
                                borderColor: typed.length > 0
                                    ? nameMatches ? '#059669' : 'rgba(239,68,68,0.55)'
                                    : 'var(--border)',
                                color: 'var(--text)', fontFamily: 'Inter, sans-serif',
                                transition: 'border-color 0.18s, background 0.18s',
                            }}
                        />
                        {typed.length > 0 && !nameMatches && (
                            <p style={{ fontSize: '11.5px', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>✕ İsim eşleşmiyor</p>
                        )}
                        {canDelete && (
                            <p style={{ fontSize: '11.5px', color: '#059669', fontFamily: 'Inter, sans-serif' }}>✓ Hazır — silmek için butona tıklayın</p>
                        )}
                    </div>

                    {/* Butonlar */}
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
                            onClick={canDelete ? () => onConfirm({ action, targetCat }) : undefined}
                            disabled={!canDelete}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px',
                                fontSize: '13px', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                background: canDelete ? 'linear-gradient(135deg, #dc2626, #7f1d1d)' : 'var(--border)',
                                border: 'none',
                                color: canDelete ? 'white' : 'var(--muted)',
                                cursor: canDelete ? 'pointer' : 'not-allowed',
                                fontFamily: 'Inter, sans-serif',
                                boxShadow: canDelete ? '0 4px 14px rgba(220,38,38,0.30)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Trash2 size={14} /> Kategoriyi Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ══ Kategori & Alerjen Yönetim Modalı ══════════════════════─ */
function CategoryAllergenModal({ settings, menuItems = [], onClose, onSaveCats, onSaveAllergens, onUpdateProducts }) {
    useScrollLock()
    const [activeTab, setActiveTab] = useState('categories')
    const [catDeleteState, setCatDeleteState] = useState(null) // { name, affectedItems, proceedFn }
    const [catToggleState, setCatToggleState] = useState(null) // { name, affectedItems, proceedFn }
    const [deleting, setDeleting] = useState(false)
    const [toggling, setToggling] = useState(false)

    // Settings'teki kategoriler
    const settingsCats = parseRawList(settings, 'categories_config', DEFAULT_CATEGORIES)

    // Menüde var ama settings'te olmayan kategorileri bul ve ekle
    const settingsCatNames = new Set(settingsCats.map(c => c.name.toLowerCase()))
    const orphanCats = [...new Set(
        menuItems
            .map(i => i.category)
            .filter(Boolean)
            .filter(cat => !settingsCatNames.has(cat.toLowerCase()))
    )].map(name => ({ name, active: true }))

    // Birleştirilmiş liste: settings + menüden gelen ekstralar
    const rawCats = [...settingsCats, ...orphanCats]

    const rawAllers = parseRawList(settings, 'allergens_config', DEFAULT_ALLERGENS)

    // Menüdeki ürünlerde var ama settings'te olmayan alerjenler bul ve ekle
    const settingsAllerNames = new Set(rawAllers.map(a => a.name.toLowerCase()))
    const orphanAllers = [...new Set(
        menuItems
            .flatMap(i => Array.isArray(i.allergens) ? i.allergens : [])
            .filter(Boolean)
            .map(a => a.trim())
            .filter(a => a && !settingsAllerNames.has(a.toLowerCase()))
    )].map(name => ({ name, active: true }))

    // Birleştirilmiş liste: settings + ürünlerden gelen ekstralar
    const mergedAllers = [...rawAllers, ...orphanAllers]

    // Kategori silme isteği — ItemManager'dan gelir
    const handleCategoryDeleteRequest = (name, _idx, proceedFn) => {
        const affectedItems = menuItems.filter(item => item.category === name)
        setCatDeleteState({ name, affectedItems, proceedFn })
    }

    // Kategori pasife alma isteği — ItemManager'dan gelir (onToggleRequest)
    const handleCategoryToggleRequest = (name, _idx, proceedFn) => {
        const affectedItems = menuItems.filter(item => item.category === name && item.is_available)
        if (affectedItems.length === 0) {
            // Aktif ürün yok, doğrudan pasife al
            proceedFn()
            return
        }
        setCatToggleState({ name, affectedItems, proceedFn })
    }

    // Kategori pasife onaylandı — ürünleri pasife çek, sonra kategoriyi kapat
    const handleCategoryToggleConfirm = async () => {
        if (!catToggleState) return
        setToggling(true)
        try {
            const { affectedItems, proceedFn } = catToggleState
            for (const product of affectedItems) {
                await onUpdateProducts(product.id, { is_available: false })
            }
            proceedFn() // ItemManager listesinde de pasife al
            setCatToggleState(null)
        } catch (err) {
            console.error('Pasife alma hatası:', err)
        } finally {
            setToggling(false)
        }
    }

    // CategoryDeleteModal onayladı — önce ürünleri güncelle, sonra listeyi sil
    const handleCategoryDeleteConfirm = async ({ action, targetCat }) => {
        if (!catDeleteState) return
        setDeleting(true)
        try {
            const { affectedItems, proceedFn } = catDeleteState
            if (affectedItems.length > 0) {
                for (const product of affectedItems) {
                    const updates = action === 'inactive'
                        ? { is_available: false }
                        : { category: action === 'move' ? targetCat : 'Diğer' }
                    await onUpdateProducts(product.id, updates)
                }
            }
            proceedFn() // ItemManager'dıki listeyi güncelle
            setCatDeleteState(null)
        } catch (err) {
            console.error('Silme sırasında hata:', err)
        } finally {
            setDeleting(false)
        }
    }

    const tabs = [
        { id: 'categories', label: 'Kategoriler', icon: Tag, color: '#732841', emoji: '🏷️' },
        { id: 'allergens', label: 'Alerjenler', icon: AlertTriangle, color: '#B45309', emoji: '⚠️' },
    ]
    const tab = tabs.find(t => t.id === activeTab)

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 90,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                background: 'rgba(10,5,10,0.55)',
                backdropFilter: 'blur(10px)',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            {/* Kategori silme modalı — normal backdrop üstünde, z-index 200 */}
            {catDeleteState && (
                <CategoryDeleteModal
                    categoryName={catDeleteState.name}
                    affectedItems={catDeleteState.affectedItems}
                    otherCategories={rawCats.map(c => c.name).filter(n => n !== catDeleteState.name)}
                    onConfirm={handleCategoryDeleteConfirm}
                    onCancel={() => setCatDeleteState(null)}
                />
            )}

            {/* Kategori pasife alma onayı — z-index 200 */}
            {catToggleState && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px',
                    background: 'rgba(5,0,5,0.65)',
                    backdropFilter: 'blur(12px)',
                    animation: 'fadeIn 0.18s ease',
                }}>
                    <div style={{
                        width: '100%', maxWidth: '420px',
                        background: 'var(--surface)',
                        borderRadius: '22px',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.36)',
                        overflow: 'hidden',
                        animation: 'scaleIn 0.20s cubic-bezier(0.22,1,0.36,1)',
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #92400E 0%, #78350F 100%)',
                            padding: '20px 24px 18px',
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
                                    <EyeOff size={18} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '10.5px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Kategori Pasife Al</p>
                                    <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.02em', marginTop: '2px' }}>"{catToggleState.name}"</p>
                                </div>
                            </div>
                        </div>
                        {/* İçerik */}
                        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{
                                display: 'flex', gap: '10px', alignItems: 'flex-start',
                                padding: '13px 15px', borderRadius: '12px',
                                background: 'rgba(217,119,6,0.07)',
                                border: '1.5px solid rgba(217,119,6,0.22)',
                            }}>
                                <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
                                <div>
                                    <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#92400E', fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}>
                                        Bu kategoride {catToggleState.affectedItems.length} aktif ürün var
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                                        Kategoriyi pasife alırsanız bu ürünler de otomatik olarak müşteri menüsünden gizlenecektir. Pasif ürünler listesinden daha sonra tekrar aktif edebilirsiniz.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setCatToggleState(null)}
                                    disabled={toggling}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '12px',
                                        fontSize: '13px', fontWeight: 700,
                                        background: 'var(--surface2)', border: '1.5px solid var(--border)',
                                        color: 'var(--muted)', cursor: toggling ? 'not-allowed' : 'pointer',
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleCategoryToggleConfirm}
                                    disabled={toggling}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '12px',
                                        fontSize: '13px', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        background: toggling ? 'var(--border)' : 'linear-gradient(135deg, #92400E, #78350F)',
                                        border: 'none', color: 'white',
                                        cursor: toggling ? 'not-allowed' : 'pointer',
                                        fontFamily: 'Inter, sans-serif',
                                        boxShadow: toggling ? 'none' : '0 4px 14px rgba(146,64,14,0.30)',
                                    }}
                                >
                                    {toggling
                                        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> İşleniyor...</>
                                        : <><EyeOff size={14} /> Evet, Pasife Al</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                width: '100%', maxWidth: '520px',
                background: 'var(--surface)',
                borderRadius: '24px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.32), 0 2px 12px rgba(0,0,0,0.10)',
                display: 'flex', flexDirection: 'column',
                height: '80vh', maxHeight: '680px',
                overflow: 'hidden',
                animation: 'scaleIn 0.22s cubic-bezier(0.22,1,0.36,1)',
                opacity: (deleting || toggling) ? 0.6 : 1,
                transition: 'opacity 0.2s',
            }}>

                {/* ── Header ── */}
                <div style={{
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}cc 100%)`,
                    padding: '20px 24px 0',
                    position: 'relative', overflow: 'hidden',
                    transition: 'background 0.3s',
                }}>
                    {/* Glow */}
                    <div style={{
                        position: 'absolute', top: '-60px', right: '-40px',
                        width: '180px', height: '180px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.60)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginBottom: '5px' }}>
                                Menü Yönetimi
                            </p>
                            <h2 style={{ fontSize: '21px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.02em' }}>
                                {tab.emoji} {tab.label}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.20)',
                                color: 'rgba(255,255,255,0.80)', cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.24)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Sekmeler */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                style={{
                                    flex: 1, padding: '10px 0',
                                    borderRadius: '12px 12px 0 0',
                                    fontSize: '13px', fontWeight: 700,
                                    fontFamily: 'Inter, sans-serif',
                                    cursor: 'pointer', border: 'none',
                                    background: activeTab === t.id
                                        ? 'var(--surface)'
                                        : 'rgba(255,255,255,0.12)',
                                    color: activeTab === t.id ? t.color : 'rgba(255,255,255,0.75)',
                                    transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                }}
                            >
                                <t.icon size={14} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── İçerik ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {activeTab === 'categories' && (
                        <ItemManager
                            key="cats"
                            items={rawCats}
                            onSave={onSaveCats}
                            onDeleteRequest={handleCategoryDeleteRequest}
                            onToggleRequest={handleCategoryToggleRequest}
                            color="#732841"
                            emojiBullet="🏷️"
                            addPlaceholder="Kategori adı yazın (örn: Kahvaltılar)"
                        />
                    )}
                    {activeTab === 'allergens' && (
                        <ItemManager
                            key="allers"
                            items={mergedAllers}
                            onSave={onSaveAllergens}
                            color="#B45309"
                            emojiBullet="⚠️"
                            addPlaceholder="Alerjen adı yazın (örn: Hardal)"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}


/* ══ Önerilen Ürünler Modalı ══════════════════════════════════════ */
function RecommendedItemsModal({ allItems, recommended, onSave, onClose }) {
    useScrollLock()
    const [selected, setSelected] = useState(new Set(recommended.map(r => r.id)))
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState(false)

    const filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(search.toLowerCase())
    )

    const toggle = (id) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const chosenItems = allItems.filter(i => selected.has(i.id)).map(i => ({
                id: i.id, name: i.name, category: i.category, description: i.description || '', price: i.price,
            }))
            await onSave(chosenItems)
            onClose()
        } finally {
            setSaving(false)
        }
    }

    // Group filtered items by category
    const byCat = filtered.reduce((acc, item) => {
        const cat = item.category || 'Diğer'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
    }, {})

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 90,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                background: 'rgba(10,5,10,0.55)',
                backdropFilter: 'blur(10px)',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                width: '100%', maxWidth: '640px',
                background: 'var(--surface)',
                borderRadius: '24px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.32)',
                display: 'flex', flexDirection: 'column',
                height: '85vh', maxHeight: '760px',
                overflow: 'hidden',
                animation: 'scaleIn 0.22s cubic-bezier(0.22,1,0.36,1)',
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
                    padding: '22px 24px 18px',
                    position: 'relative', overflow: 'hidden', flexShrink: 0,
                }}>
                    <div style={{
                        position: 'absolute', top: '-50px', right: '-30px',
                        width: '180px', height: '180px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                                <Sparkles size={13} style={{ color: 'rgba(255,255,255,0.65)' }} />
                                <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.60)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                                    Asistan Öneri Yönetimi
                                </p>
                            </div>
                            <h2 style={{ fontSize: '21px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                                ⭐ Önerilen Ürünler
                            </h2>
                            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, maxWidth: '400px' }}>
                                Seçtiğiniz ürünler, yapay zeka tarafından sohbet sırasında doğal bir şekilde müşterilere önerilecek.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                                color: 'rgba(255,255,255,0.75)', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        >
                            <X size={15} />
                        </button>
                    </div>
                    {/* Stats pill */}
                    <div style={{
                        marginTop: '14px',
                        padding: '7px 13px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.10)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}>
                        <Star size={12} style={{ color: '#FCD34D' }} fill="#FCD34D" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif' }}>
                            {selected.size} ürün seçili
                        </span>
                    </div>
                </div>

                {/* Info banner */}
                <div style={{
                    flexShrink: 0,
                    margin: '14px 16px 0',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(123,45,69,0.06)',
                    border: '1.5px solid rgba(123,45,69,0.14)',
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}>
                    <Sparkles size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
                        Yapay zeka, müşteri menüyü keşfettiğinde ya da ne sipariş edeceğini bilemediğinde bu ürünlerden uygun olanları <strong style={{ color: 'var(--text)' }}>doğal ve içten bir dille</strong> önerecek.
                    </p>
                </div>

                {/* Search */}
                <div style={{ flexShrink: 0, padding: '12px 16px 4px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '9px',
                        background: 'var(--surface2)',
                        border: '1.5px solid var(--border)',
                        borderRadius: '12px', padding: '9px 13px',
                    }}>
                        <Search size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Ürün veya kategori ara..."
                            style={{
                                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter, sans-serif',
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '0' }}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Product list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 12px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                            Aramanızla eşleşen ürün bulunamadı.
                        </div>
                    ) : (
                        Object.entries(byCat).map(([cat, catItems]) => (
                            <div key={cat} style={{ marginBottom: '18px' }}>
                                {/* Category label */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '5px 10px', marginBottom: '8px',
                                    borderRadius: '8px',
                                    background: 'rgba(123,45,69,0.06)',
                                }}>
                                    <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>
                                        {cat}
                                    </p>
                                    <span style={{ fontSize: '10.5px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                                        {catItems.filter(i => selected.has(i.id)).length}/{catItems.length} seçili
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {catItems.map(item => {
                                        const isSelected = selected.has(item.id)
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => toggle(item.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                    padding: '10px 12px', borderRadius: '13px',
                                                    border: '1.5px solid',
                                                    borderColor: isSelected ? 'rgba(123,45,69,0.40)' : 'var(--border)',
                                                    background: isSelected ? 'rgba(123,45,69,0.06)' : 'var(--surface2)',
                                                    cursor: 'pointer', textAlign: 'left',
                                                    transition: 'all 0.15s', width: '100%',
                                                }}
                                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(123,45,69,0.25)' }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = isSelected ? 'rgba(123,45,69,0.40)' : 'var(--border)' }}
                                            >
                                                {/* Thumbnail */}
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '10px',
                                                    flexShrink: 0, overflow: 'hidden', background: 'var(--border)',
                                                    opacity: isSelected ? 1 : 0.75, transition: 'opacity 0.15s',
                                                }}>
                                                    <img src={item.image_url || noImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                {/* Text */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{
                                                        fontSize: '13.5px', fontWeight: 700,
                                                        color: isSelected ? 'var(--accent)' : 'var(--text)',
                                                        fontFamily: 'Inter, sans-serif',
                                                        marginBottom: '2px', lineHeight: 1.3,
                                                        transition: 'color 0.15s',
                                                    }}>
                                                        {item.name}
                                                    </p>
                                                    {item.description && (
                                                        <p style={{ fontSize: '11.5px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {/* Price */}
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                                                    {Number(item.price).toFixed(2)} ₺
                                                </span>
                                                {/* Checkbox */}
                                                <div style={{
                                                    width: '22px', height: '22px', borderRadius: '6px',
                                                    flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isSelected ? '#732841' : 'var(--surface)',
                                                    border: '1.5px solid',
                                                    borderColor: isSelected ? '#732841' : 'var(--border)',
                                                    transition: 'all 0.15s',
                                                }}>
                                                    {isSelected && <Check size={12} style={{ color: 'white' }} />}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '10px', flexShrink: 0,
                }}>
                    <div>
                        {selected.size > 0 ? (
                            <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                                <Star size={11} style={{ color: '#FCD34D', verticalAlign: 'middle', marginRight: '4px' }} fill="#FCD34D" />
                                <strong style={{ color: 'var(--text)' }}>{selected.size}</strong> ürün asistan tarafından önerilecek
                            </p>
                        ) : (
                            <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                                Hiçbir ürün seçilmedi — asistan varsayılan davranışıyla devam eder.
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 18px', borderRadius: '11px',
                                fontSize: '13px', fontWeight: 700,
                                background: 'var(--surface2)', border: '1.5px solid var(--border)',
                                color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '10px 22px', borderRadius: '11px',
                                fontSize: '13px', fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: '7px',
                                background: 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
                                border: 'none', color: 'white',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                boxShadow: '0 4px 14px rgba(123,45,69,0.28)',
                                opacity: saving ? 0.7 : 1,
                                transition: 'all 0.18s',
                            }}
                        >
                            {saving
                                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Kaydediliyor...</>
                                : <><Check size={13} /> Kaydet</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ══ Pasif Ürünler Modalı ═══════════════════════════════════ */
function PassiveItemsModal({ items, categories, onActivate, onChangeCategory, onDelete, onClose }) {
    useScrollLock()
    const [deleteTarget, setDeleteTarget] = useState(null)       // { id, name }
    const [catEditTarget, setCatEditTarget] = useState(null)    // id of item being category-edited
    const [newCatVal, setNewCatVal] = useState('')
    const [busyId, setBusyId] = useState(null)                  // id with pending async op
    const [typed, setTyped] = useState('')
    const deleteInputRef = useRef(null)

    const nameMatches = typed.trim() === (deleteTarget?.name ?? '').trim()

    useEffect(() => {
        if (deleteTarget) {
            setTyped('')
            const t = setTimeout(() => deleteInputRef.current?.focus(), 160)
            return () => clearTimeout(t)
        }
    }, [deleteTarget])

    const doActivate = async (item) => {
        setBusyId(item.id)
        try { await onActivate(item) } finally { setBusyId(null) }
    }

    const doChangeCategory = async (item) => {
        if (!newCatVal.trim()) return
        setBusyId(item.id)
        try {
            await onChangeCategory(item.id, newCatVal.trim())
            setCatEditTarget(null)
        } finally { setBusyId(null) }
    }

    const doDelete = async () => {
        if (!nameMatches || !deleteTarget) return
        setBusyId(deleteTarget.id)
        try {
            await onDelete(deleteTarget.id)
            setDeleteTarget(null)
        } finally { setBusyId(null) }
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 90,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                background: 'rgba(10,5,10,0.55)',
                backdropFilter: 'blur(10px)',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            {/* Silme onay overlay’ı */}
            {deleteTarget && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 200,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px',
                        background: 'rgba(5,0,5,0.68)',
                        backdropFilter: 'blur(14px)',
                    }}
                    onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}
                >
                    <div style={{
                        width: '100%', maxWidth: '400px',
                        background: 'var(--surface)', borderRadius: '22px',
                        overflow: 'hidden',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
                        animation: 'scaleIn 0.20s cubic-bezier(0.22,1,0.36,1)',
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg,#dc2626,#7f1d1d)',
                            padding: '20px 22px 16px',
                        }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'Inter, sans-serif' }}>Kalıcı Silme</p>
                            <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', marginTop: '3px' }}>"{deleteTarget.name}"</p>
                        </div>
                        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ padding: '11px 14px', borderRadius: '11px', background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.18)', display: 'flex', gap: '9px' }}>
                                <AlertTriangle size={15} style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                                <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                                    <strong style={{ color: 'var(--text)' }}>"{deleteTarget.name}"</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                                    Silmek için{' '}<strong style={{ color: 'var(--text)', fontFamily: 'monospace', background: 'var(--surface2)', padding: '1px 6px', borderRadius: '5px' }}>{deleteTarget.name}</strong>{' '}yazın:
                                </p>
                                <input
                                    ref={deleteInputRef}
                                    value={typed}
                                    onChange={e => setTyped(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && nameMatches) doDelete(); if (e.key === 'Escape') setDeleteTarget(null) }}
                                    placeholder={deleteTarget.name}
                                    style={{
                                        padding: '10px 13px', borderRadius: '10px', fontSize: '13.5px', outline: 'none',
                                        width: '100%', boxSizing: 'border-box',
                                        background: typed.length > 0 ? (nameMatches ? 'rgba(5,150,105,0.05)' : 'rgba(239,68,68,0.04)') : 'var(--surface2)',
                                        border: '1.5px solid',
                                        borderColor: typed.length > 0 ? (nameMatches ? '#059669' : 'rgba(239,68,68,0.55)') : 'var(--border)',
                                        color: 'var(--text)', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.18s, background 0.18s',
                                    }}
                                />
                                {typed.length > 0 && !nameMatches && <p style={{ fontSize: '11.5px', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>✕ İsim eşleşmiyor</p>}
                                {nameMatches && <p style={{ fontSize: '11.5px', color: '#059669', fontFamily: 'Inter, sans-serif' }}>✓ Hazır</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '11px', borderRadius: '11px', fontSize: '13px', fontWeight: 700, background: 'var(--surface2)', border: '1.5px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>İptal</button>
                                <button
                                    onClick={doDelete}
                                    disabled={!nameMatches}
                                    style={{
                                        flex: 1, padding: '11px', borderRadius: '11px', fontSize: '13px', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        background: nameMatches ? 'linear-gradient(135deg,#dc2626,#7f1d1d)' : 'var(--border)',
                                        border: 'none', color: nameMatches ? 'white' : 'var(--muted)',
                                        cursor: nameMatches ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif',
                                        boxShadow: nameMatches ? '0 4px 14px rgba(220,38,38,0.28)' : 'none', transition: 'all 0.18s',
                                    }}
                                >
                                    <Trash2 size={13} /> Sil
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ana panel */}
            <div style={{
                width: '100%', maxWidth: '600px',
                background: 'var(--surface)',
                borderRadius: '24px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.32)',
                display: 'flex', flexDirection: 'column',
                height: '82vh', maxHeight: '720px',
                overflow: 'hidden',
                animation: 'scaleIn 0.22s cubic-bezier(0.22,1,0.36,1)',
            }}>

                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                    padding: '20px 24px 20px',
                    position: 'relative', overflow: 'hidden', flexShrink: 0,
                }}>
                    <div style={{
                        position: 'absolute', top: '-50px', right: '-30px',
                        width: '160px', height: '160px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginBottom: '5px' }}>
                                Menü Yönetimi
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h2 style={{ fontSize: '21px', fontWeight: 800, color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.02em' }}>
                                    🚫 Pasif Ürünler
                                </h2>
                                <span style={{
                                    padding: '3px 10px', borderRadius: '20px',
                                    fontSize: '11.5px', fontWeight: 700,
                                    background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.80)',
                                    fontFamily: 'Inter, sans-serif',
                                }}>
                                    {items.length} ürün
                                </span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', marginTop: '5px' }}>
                                Bu ürünler müşteri menüsünde görünmüyor.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                                color: 'rgba(255,255,255,0.75)', cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Liste */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', padding: '48px' }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: 'rgba(55,65,81,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
                            }}>🎉</div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>Pasif ürün yok!</p>
                            <p style={{ fontSize: '12.5px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.5 }}>
                                Tüm ürünler aktif durumda ve müşteri menüsünde görünüyor.
                            </p>
                        </div>
                    ) : (
                        items.map(item => {
                            const isBusy = busyId === item.id
                            const isEditingCat = catEditTarget === item.id
                            return (
                                <div key={item.id} style={{
                                    background: 'var(--surface2)',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: '16px',
                                    padding: '14px 16px',
                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                    opacity: isBusy ? 0.55 : 1,
                                    transition: 'opacity 0.2s',
                                    position: 'relative',
                                }}>
                                    {/* Gorsel */}
                                    <div style={{
                                        width: '54px', height: '54px', borderRadius: '12px',
                                        flexShrink: 0, overflow: 'hidden',
                                        background: 'var(--border)',
                                    }}>
                                        <img
                                            src={item.image_url || noImage}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>

                                    {/* Bilgi */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>
                                                {item.name}
                                            </p>
                                            {/* Kategori badge */}
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700,
                                                padding: '2px 9px', borderRadius: '20px',
                                                background: 'rgba(115,40,65,0.12)', color: 'var(--accent)',
                                                fontFamily: 'Inter, sans-serif',
                                            }}>
                                                {item.category || 'Kategorisiz'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4, marginBottom: '8px' }}>
                                            {item.description
                                                ? (item.description.length > 60 ? item.description.slice(0, 60) + '…' : item.description)
                                                : <em>Açıklama yok</em>}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                                fontSize: '13px', fontWeight: 800,
                                                color: 'var(--text)', fontFamily: 'Inter, sans-serif',
                                            }}>
                                                {Number(item.price).toFixed(2)} ₺
                                            </span>
                                        </div>

                                        {/* Kategori düzenle */}
                                        {isEditingCat && (
                                            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <select
                                                    value={newCatVal}
                                                    onChange={e => setNewCatVal(e.target.value)}
                                                    style={{
                                                        flex: 1, padding: '8px 11px', borderRadius: '9px',
                                                        fontSize: '13px', outline: 'none',
                                                        background: 'var(--surface)', border: '1.5px solid var(--border)',
                                                        color: 'var(--text)', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                                                    }}
                                                    onFocus={e => e.currentTarget.style.borderColor = '#732841'}
                                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => doChangeCategory(item)}
                                                    style={{
                                                        padding: '8px 12px', borderRadius: '9px',
                                                        fontSize: '12.5px', fontWeight: 700,
                                                        background: '#732841', color: 'white', border: 'none',
                                                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                    }}
                                                >
                                                    <Check size={13} /> Kaydet
                                                </button>
                                                <button
                                                    onClick={() => setCatEditTarget(null)}
                                                    style={{
                                                        width: '34px', height: '34px', borderRadius: '9px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: 'var(--surface)', border: '1.5px solid var(--border)',
                                                        color: 'var(--muted)', cursor: 'pointer',
                                                    }}
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Aksiyon butonları */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                                        {/* Aktif et */}
                                        <button
                                            onClick={() => doActivate(item)}
                                            disabled={isBusy}
                                            title="Aktif yap"
                                            style={{
                                                padding: '7px 11px', borderRadius: '9px',
                                                fontSize: '11.5px', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                background: 'rgba(5,150,105,0.10)', color: '#059669',
                                                border: '1.5px solid rgba(5,150,105,0.22)',
                                                cursor: isBusy ? 'not-allowed' : 'pointer',
                                                fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                                                whiteSpace: 'nowrap',
                                            }}
                                            onMouseEnter={e => {
                                                if (!isBusy) e.currentTarget.style.background = 'rgba(5,150,105,0.20)'
                                            }}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(5,150,105,0.10)'}
                                        >
                                            {isBusy ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ToggleRight size={14} />}
                                            Aktif Et
                                        </button>
                                        {/* Kategori düzenle */}
                                        <button
                                            onClick={() => { setCatEditTarget(isEditingCat ? null : item.id); setNewCatVal(item.category || categories[0] || '') }}
                                            title="Kategori düzenle"
                                            style={{
                                                padding: '7px 11px', borderRadius: '9px',
                                                fontSize: '11.5px', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                background: isEditingCat ? 'rgba(115,40,65,0.12)' : 'var(--surface)',
                                                color: isEditingCat ? '#732841' : 'var(--text2)',
                                                border: isEditingCat ? '1.5px solid rgba(115,40,65,0.28)' : '1.5px solid var(--border)',
                                                cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            <Pencil size={12} /> Kategori
                                        </button>
                                        {/* Sil */}
                                        <button
                                            onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                                            title="Sil"
                                            style={{
                                                padding: '7px 11px', borderRadius: '9px',
                                                fontSize: '11.5px', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                background: 'rgba(239,68,68,0.07)', color: 'var(--danger)',
                                                border: '1.5px solid rgba(239,68,68,0.18)',
                                                cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
                                                whiteSpace: 'nowrap',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                                        >
                                            <Trash2 size={12} /> Sil
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                        {items.length > 0
                            ? <>⚠️ <strong style={{ color: 'var(--text)' }}>{items.length}</strong> ürün müşteriye görünmüyor</>
                            : '✅ Tüm ürünler aktif'}
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '9px 18px', borderRadius: '10px',
                            fontSize: '13px', fontWeight: 700,
                            background: 'var(--surface2)', border: '1.5px solid var(--border)',
                            color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ── Ana MenuManager bileşeni ──────────────────────────────────── */
export default function MenuManager() {
    const { menuItems, settings, loading, loadData, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu()
    const [editingId, setEditingId] = useState(null)
    const [detailItem, setDetailItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [imgUploading, setImgUploading] = useState(false)
    const [imgPreview, setImgPreview] = useState(null)
    const [catAllerModal, setCatAllerModal] = useState(false)
    const [passiveModal, setPassiveModal] = useState(false)
    const [recommendedModal, setRecommendedModal] = useState(false)
    const imgInputRef = useRef()

    // Aktif ürünleri kategoriye göre grupla
    const activeItems = menuItems.filter(i => i.is_available)
    const passiveItems = menuItems.filter(i => !i.is_available)

    const grouped = activeItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {})

    // Ayarlardan aktif kategorileri al; menüdeki ekstra kategorileri de ekle
    const settingsCategories = parseCategoriesFromSettings(settings)
    const dynamicCategories = [
        ...new Set([
            ...settingsCategories,
            ...menuItems.map(i => i.category).filter(Boolean),
        ])
    ]

    // Ayarlardan aktif alerjenleri al
    const ALLERGEN_OPTIONS = parseAllergensFromSettings(settings)

    // Önerilen ürünleri ayarlardan parse et
    const recommendedItems = (() => {
        try {
            const raw = settings.recommended_items
            if (!raw) return []
            return typeof raw === 'string' ? JSON.parse(raw) : raw
        } catch { return [] }
    })()

    // Önerilen ürünleri kaydet
    const handleSaveRecommended = async (list) => {
        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'recommended_items', value: JSON.stringify(list) }, { onConflict: 'key' })
        if (error) throw error
        await loadData()
    }

    // Kategori / Alerjen kaydetme
    const handleSaveCats = async (list) => {
        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'categories_config', value: JSON.stringify(list) }, { onConflict: 'key' })
        if (error) throw error
        await loadData()
    }

    const handleSaveAllergens = async (list) => {
        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'allergens_config', value: JSON.stringify(list) }, { onConflict: 'key' })
        if (error) throw error
        await loadData()
    }

    const openNew = () => {
        setForm(EMPTY_FORM)
        setImgPreview(null)
        setEditingId('new')
    }

    const openEdit = (item) => {
        setForm({
            name: item.name,
            description: item.description || '',
            price: String(item.price),
            category: item.category,
            allergens: item.allergens || [],
            is_available: item.is_available,
            is_new: item.is_new || false,
            image_url: item.image_url || '',
        })
        setImgPreview(item.image_url || null)
        setEditingId(item.id)
    }

    const closeModal = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setImgPreview(null)
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.price) return
        setSaving(true)
        try {
            const payload = { ...form, price: parseFloat(form.price) }
            try {
                if (editingId === 'new') {
                    await addMenuItem(payload)
                } else {
                    await updateMenuItem(editingId, payload)
                }
            } catch (err) {
                // If the error is about is_new column not existing, retry without it
                if (err.message?.includes('is_new') || err.code === '42703') {
                    console.warn('is_new column not found in DB, retrying without it. Run SQL migration to enable this feature.')
                    const { is_new, ...payloadWithoutNew } = payload
                    if (editingId === 'new') {
                        await addMenuItem(payloadWithoutNew)
                    } else {
                        await updateMenuItem(editingId, payloadWithoutNew)
                    }
                } else {
                    throw err
                }
            }
            closeModal()
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        await deleteMenuItem(id)
    }

    const toggleAvailability = async (item) => {
        await updateMenuItem(item.id, { is_available: !item.is_available })
        setDetailItem(prev => prev && prev.id === item.id ? { ...prev, is_available: !prev.is_available } : prev)
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImgUploading(true)
        try {
            const url = await uploadMenuImage(file)
            setForm(f => ({ ...f, image_url: url }))
            setImgPreview(url)
        } catch (err) {
            console.error('Görsel yüklenemedi:', err)
            alert('Görsel yüklenemedi. Supabase Storage bucket\'unun oluşturulduğundan emin olun.')
        } finally {
            setImgUploading(false)
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
            <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
    )

    return (
        <>
            {/* Ürün detay drawer */}
            {detailItem && !editingId && (
                <ItemDetailDrawer
                    item={detailItem}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggle={toggleAvailability}
                    onClose={() => setDetailItem(null)}
                />
            )}

            {/* Edit/Add modal */}
            {editingId && (
                <ItemEditModal
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    onClose={closeModal}
                    saving={saving}
                    imgUploading={imgUploading}
                    imgPreview={imgPreview}
                    onImageUpload={handleImageUpload}
                    onImageRemove={() => { setImgPreview(null); setForm(f => ({ ...f, image_url: '' })) }}
                    imgInputRef={imgInputRef}
                    isEditing={editingId !== 'new'}
                    categories={dynamicCategories}
                    allergenOptions={ALLERGEN_OPTIONS}
                />
            )}

            {/* Kategori & Alerjen Modalı */}
            {catAllerModal && (
                <CategoryAllergenModal
                    settings={settings}
                    menuItems={menuItems}
                    onClose={() => setCatAllerModal(false)}
                    onSaveCats={handleSaveCats}
                    onSaveAllergens={handleSaveAllergens}
                    onUpdateProducts={async (id, updates) => {
                        const item = menuItems.find(m => m.id === id)
                        if (item) await updateMenuItem(id, { ...item, ...updates })
                    }}
                />
            )}

            {/* Pasif Ürünler Modalı */}
            {passiveModal && (
                <PassiveItemsModal
                    items={passiveItems}
                    categories={dynamicCategories}
                    onActivate={item => updateMenuItem(item.id, { is_available: true })}
                    onChangeCategory={(id, cat) => {
                        const item = menuItems.find(m => m.id === id)
                        if (item) return updateMenuItem(id, { ...item, category: cat })
                    }}
                    onDelete={deleteMenuItem}
                    onClose={() => setPassiveModal(false)}
                />
            )}

            {/* Önerilen Ürünler Modalı */}
            {recommendedModal && (
                <RecommendedItemsModal
                    allItems={activeItems}
                    recommended={recommendedItems}
                    onSave={handleSaveRecommended}
                    onClose={() => setRecommendedModal(false)}
                />
            )}

            {/* Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* ── Toolbar ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '10px',
                    marginBottom: '4px',
                }}>
                    {/* Yeni ürün ekle */}
                    <button
                        onClick={openNew}
                        style={{
                            padding: '15px 20px', borderRadius: '16px',
                            fontSize: '14px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            background: 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
                            border: 'none',
                            color: 'white', cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 4px 16px rgba(123,45,69,0.30)',
                            transition: 'all 0.18s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(123,45,69,0.40)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,45,69,0.30)'
                        }}
                    >
                        <Plus size={17} /> Yeni Ürün Ekle
                    </button>

                    {/* Önerilen Ürünler butonu */}
                    <button
                        onClick={() => setRecommendedModal(true)}
                        style={{
                            padding: '15px 18px', borderRadius: '16px',
                            fontSize: '13px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: recommendedItems.length > 0 ? 'rgba(123,45,69,0.10)' : 'var(--surface)',
                            border: recommendedItems.length > 0 ? '1.5px solid rgba(123,45,69,0.28)' : '1.5px solid var(--border)',
                            color: recommendedItems.length > 0 ? 'var(--accent)' : 'var(--muted)',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.18s', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(123,45,69,0.16)'
                            e.currentTarget.style.borderColor = 'rgba(123,45,69,0.40)'
                            e.currentTarget.style.color = 'var(--accent)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = recommendedItems.length > 0 ? 'rgba(123,45,69,0.10)' : 'var(--surface)'
                            e.currentTarget.style.borderColor = recommendedItems.length > 0 ? 'rgba(123,45,69,0.28)' : 'var(--border)'
                            e.currentTarget.style.color = recommendedItems.length > 0 ? 'var(--accent)' : 'var(--muted)'
                        }}
                    >
                        <Star size={14} fill={recommendedItems.length > 0 ? 'currentColor' : 'none'} />
                        <span>Önerilen</span>
                        {recommendedItems.length > 0 && (
                            <span style={{
                                minWidth: '20px', height: '20px',
                                borderRadius: '10px', padding: '0 5px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--accent)', color: 'white',
                                fontSize: '11px', fontWeight: 800,
                                fontFamily: 'Inter, sans-serif',
                            }}>
                                {recommendedItems.length}
                            </span>
                        )}
                    </button>

                    {/* Pasif Ürünler butonu */}
                    <button
                        onClick={() => setPassiveModal(true)}
                        style={{
                            padding: '15px 18px', borderRadius: '16px',
                            fontSize: '13px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: passiveItems.length > 0 ? 'rgba(55,65,81,0.12)' : 'var(--surface)',
                            border: passiveItems.length > 0 ? '1.5px solid rgba(55,65,81,0.28)' : '1.5px solid var(--border)',
                            color: passiveItems.length > 0 ? '#374151' : 'var(--muted)',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.18s', whiteSpace: 'nowrap', position: 'relative',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(55,65,81,0.18)'
                            e.currentTarget.style.borderColor = 'rgba(55,65,81,0.40)'
                            e.currentTarget.style.color = '#1f2937'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = passiveItems.length > 0 ? 'rgba(55,65,81,0.12)' : 'var(--surface)'
                            e.currentTarget.style.borderColor = passiveItems.length > 0 ? 'rgba(55,65,81,0.28)' : 'var(--border)'
                            e.currentTarget.style.color = passiveItems.length > 0 ? '#374151' : 'var(--muted)'
                        }}
                    >
                        <EyeOff size={15} />
                        <span>Pasif</span>
                        {passiveItems.length > 0 && (
                            <span style={{
                                minWidth: '20px', height: '20px',
                                borderRadius: '10px',
                                padding: '0 5px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#374151', color: 'white',
                                fontSize: '11px', fontWeight: 800,
                                fontFamily: 'Inter, sans-serif',
                            }}>
                                {passiveItems.length}
                            </span>
                        )}
                    </button>

                    {/* Kategoriler & Alerjenler butonu */}
                    <button
                        onClick={() => setCatAllerModal(true)}
                        style={{
                            padding: '15px 18px', borderRadius: '16px',
                            fontSize: '13px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--surface)',
                            border: '1.5px solid var(--border)',
                            color: 'var(--text)', cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.18s', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--surface2)'
                            e.currentTarget.style.borderColor = 'var(--border2)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'var(--surface)'
                            e.currentTarget.style.borderColor = 'var(--border)'
                        }}
                    >
                        <Tag size={15} style={{ color: 'var(--accent)' }} />
                        <span>Kategoriler</span>
                        <span style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />
                        <AlertTriangle size={15} style={{ color: '#B45309' }} />
                        <span>Alerjenler</span>
                    </button>
                </div>

                <div style={{ height: '4px' }} />

                {menuItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
                        <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Henüz menü ürünü eklenmedi.</p>
                    </div>
                )}

                {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat} style={{ marginBottom: '24px' }}>
                        {/* Kategori başlığı */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 20px', marginBottom: '12px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(123,45,69,0.09) 0%, rgba(123,45,69,0.03) 100%)',
                            border: '1px solid rgba(123,45,69,0.15)',
                            borderLeft: '4px solid var(--accent)',
                        }}>
                            <p style={{
                                fontSize: '12.5px', fontWeight: 800,
                                color: 'var(--accent)', letterSpacing: '0.07em',
                                textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
                            }}>
                                {cat}
                            </p>
                            <span style={{
                                marginLeft: 'auto', fontSize: '11px', fontWeight: 700,
                                padding: '3px 10px', borderRadius: '20px',
                                background: 'var(--accent)', color: 'white',
                                fontFamily: 'Inter, sans-serif',
                            }}>
                                {items.length} ürün
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '10px',
                        }}>
                            {items.map(item => (
                                <MenuItem
                                    key={item.id}
                                    item={item}
                                    onClick={setDetailItem}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
