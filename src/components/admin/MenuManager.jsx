import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight, ImagePlus, Eye, EyeOff } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { uploadMenuImage } from '../../lib/supabaseClient'
import noImage from '../../assets/no-image.png'

const CATEGORIES = ['Başlangıçlar', 'Çorbalar', 'Ana Yemekler', 'Tatlılar', 'İçecekler', 'Diğer']
const ALLERGEN_OPTIONS = ['Gluten', 'Süt', 'Yumurta', 'Balık', 'Kabuklu Deniz Ürünleri', 'Yer Fıstığı', 'Fındık', 'Soya', 'Kereviz', 'Susam']

const EMPTY_FORM = { name: '', description: '', price: '', category: 'Ana Yemekler', allergens: [], is_available: true, image_url: '' }

/* ── Slide-over modal: Yeni Ürün Ekle / Düzenle ──────────────── */
function ItemEditModal({ form, setForm, onSave, onClose, saving, imgUploading, imgPreview, onImageUpload, onImageRemove, imgInputRef, isEditing }) {
    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-md flex flex-col"
                style={{
                    background: 'var(--surface)',
                    borderRadius: '28px 28px 0 0',
                    maxHeight: '92vh',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
                }}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border2)' }} />
                </div>

                {/* Başlık */}
                <div
                    className="flex-shrink-0 flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid var(--border)' }}
                >
                    <h2 className="font-bold text-base" style={{ fontFamily: 'Poppins', color: 'var(--text)' }}>
                        {isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable form */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {/* Görsel */}
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', color: 'var(--text2)', fontFamily: 'Inter, sans-serif' }}>Ürün Görseli</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    background: 'var(--surface2)',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                <img
                                    src={imgPreview || noImage}
                                    alt=""
                                    className="w-full h-full"
                                    style={{ objectFit: imgPreview ? 'cover' : 'contain', padding: imgPreview ? 0 : '14px' }}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <input ref={imgInputRef} type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => imgInputRef.current?.click()}
                                    disabled={imgUploading}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                                    style={{
                                        background: 'var(--accent-soft)',
                                        border: '1.5px dashed rgba(108,92,231,0.35)',
                                        color: 'var(--accent)',
                                    }}
                                >
                                    {imgUploading
                                        ? <><Loader2 size={14} className="animate-spin" /> Yükleniyor...</>
                                        : <><ImagePlus size={14} /> Görsel Seç</>}
                                </button>
                                {imgPreview && (
                                    <button
                                        type="button"
                                        onClick={onImageRemove}
                                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl"
                                        style={{ color: 'var(--danger)', border: '1px solid rgba(225,112,85,0.2)' }}
                                    >
                                        <X size={12} /> Görseli Kaldır
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ürün adı */}
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text2)' }}>Ürün Adı *</p>
                        <input
                            placeholder="Örn: Akdeniz Salatası"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                background: 'var(--surface2)',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        />
                    </div>

                    {/* Açıklama */}
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text2)' }}>İçerik / Açıklama</p>
                        <textarea
                            placeholder="Malzemeler, pişirme yöntemi..."
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'none',
                                boxSizing: 'border-box',
                                background: 'var(--surface2)',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        />
                    </div>

                    {/* Fiyat + Kategori */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text2)' }}>Fiyat (₺) *</p>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={form.price}
                                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    background: 'var(--surface2)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text2)' }}>Kategori</p>
                            <select
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    background: 'var(--surface2)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                    fontFamily: 'Inter, sans-serif',
                                    appearance: 'auto',
                                }}
                            >
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Alerjenler */}
                    <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Alerjenler</p>
                        <div className="flex flex-wrap gap-2">
                            {ALLERGEN_OPTIONS.map(a => (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setForm(f => ({
                                        ...f,
                                        allergens: f.allergens.includes(a)
                                            ? f.allergens.filter(x => x !== a)
                                            : [...f.allergens, a]
                                    }))}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                                    style={{
                                        background: form.allergens.includes(a) ? 'rgba(225,112,85,0.12)' : 'var(--surface2)',
                                        border: `1.5px solid ${form.allergens.includes(a) ? 'rgba(225,112,85,0.4)' : 'var(--border)'}`,
                                        color: form.allergens.includes(a) ? 'var(--danger)' : 'var(--muted)',
                                    }}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aktif/Pasif */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            borderRadius: '16px',
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Menüde Göster</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                {form.is_available ? 'Müşteriler bu ürünü görebilir' : 'Ürün müşterilerden gizli'}
                            </p>
                        </div>
                        <button
                            onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                            className="flex-shrink-0"
                        >
                            {form.is_available
                                ? <ToggleRight size={32} style={{ color: 'var(--success)' }} />
                                : <ToggleLeft size={32} style={{ color: 'var(--muted)' }} />
                            }
                        </button>
                    </div>

                </div>

                {/* Sabit footer — butonlar */}
                <div
                    style={{
                        flexShrink: 0,
                        padding: '14px 20px',
                        display: 'flex',
                        gap: '10px',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--surface)',
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: 500,
                            background: 'var(--surface2)',
                            color: 'var(--muted)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        İptal
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving || imgUploading}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            color: 'white',
                            background: 'linear-gradient(135deg, #6C5CE7, #5A4DD4)',
                            boxShadow: '0 4px 14px rgba(108,92,231,0.3)',
                            opacity: saving ? 0.7 : 1,
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ── Ana MenuManager bileşeni ──────────────────────────────── */
export default function MenuManager() {
    const { menuItems, loading, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu()
    const [editingId, setEditingId] = useState(null)   // null = kapalı, 'new' = yeni, string = düzenlenen id
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [imgUploading, setImgUploading] = useState(false)
    const [imgPreview, setImgPreview] = useState(null)
    const imgInputRef = useRef()

    const grouped = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {})

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
            if (editingId === 'new') {
                await addMenuItem(payload)
            } else {
                await updateMenuItem(editingId, payload)
            }
            closeModal()
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return
        await deleteMenuItem(id)
    }

    const toggleAvailability = async (item) => {
        await updateMenuItem(item.id, { is_available: !item.is_available })
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
        <div className="flex items-center justify-center p-12">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
    )

    return (
        <>
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
                />
            )}

            {/* Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Yeni ürün ekle butonu */}
                <button
                    onClick={openNew}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: 'var(--accent-soft)',
                        border: '2px dashed rgba(108,92,231,0.35)',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'transform 0.1s',
                    }}
                >
                    <Plus size={17} /> Yeni Ürün Ekle
                </button>

                {/* Boşluk ayırıcı: buton ile kategoriler arası */}
                <div style={{ height: '8px' }} />

                {menuItems.length === 0 && (
                    <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
                        <p className="text-sm">Henüz menü ürünü eklenmedi.</p>
                    </div>
                )}

                {/* Kategori bazlı liste */}
                {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat} style={{ marginBottom: '24px' }}>
                        {/* Kategori başlığı */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 20px',
                                marginBottom: '16px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(108,92,231,0.10) 0%, rgba(108,92,231,0.04) 100%)',
                                border: '1px solid rgba(108,92,231,0.18)',
                                borderLeft: '4px solid var(--accent)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    color: 'var(--accent)',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {cat}
                            </p>
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                {items.length} ürün
                            </span>
                        </div>

                        {/* Ürün kartları — desktop: 2-3 sütun */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '14px',
                            }}
                        >
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 p-4 rounded-2xl"
                                    style={{
                                        background: 'var(--surface)',
                                        border: '1.5px solid var(--border)',
                                        opacity: item.is_available ? 1 : 0.55,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    {/* Görsel */}
                                    <div
                                        className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                                    >
                                        <img
                                            src={item.image_url || noImage}
                                            alt={item.name}
                                            className="w-full h-full"
                                            style={{
                                                objectFit: item.image_url ? 'cover' : 'contain',
                                                padding: item.image_url ? 0 : '10px',
                                            }}
                                            onError={e => {
                                                e.target.src = noImage
                                                e.target.style.objectFit = 'contain'
                                                e.target.style.padding = '10px'
                                            }}
                                        />
                                    </div>

                                    {/* Bilgi */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                                                {item.name}
                                            </p>
                                            {item.allergens?.length > 0 && (
                                                <span
                                                    className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0"
                                                    style={{ background: 'rgba(217,119,6,0.1)', color: '#B45309', fontWeight: 600 }}
                                                >
                                                    ⚠️ Alerjen
                                                </span>
                                            )}
                                            {!item.is_available && (
                                                <span
                                                    className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0"
                                                    style={{ background: 'rgba(100,100,100,0.1)', color: 'var(--muted)', fontWeight: 600 }}
                                                >
                                                    Pasif
                                                </span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                                                {item.description}
                                            </p>
                                        )}
                                        <p className="text-sm font-bold mt-1" style={{ color: 'var(--accent)' }}>
                                            {Number(item.price).toFixed(2)} ₺
                                        </p>
                                    </div>

                                    {/* Aksiyonlar */}
                                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                        {/* Aktif/Pasif toggle */}
                                        <button
                                            onClick={() => toggleAvailability(item)}
                                            title={item.is_available ? 'Pasif yap' : 'Aktif yap'}
                                            className="p-2 rounded-xl"
                                            style={{ background: item.is_available ? 'rgba(0,184,148,0.08)' : 'var(--surface2)' }}
                                        >
                                            {item.is_available
                                                ? <Eye size={16} style={{ color: 'var(--success)' }} />
                                                : <EyeOff size={16} style={{ color: 'var(--muted)' }} />
                                            }
                                        </button>
                                        {/* Düzenle */}
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="p-2 rounded-xl"
                                            style={{ background: 'rgba(108,92,231,0.08)' }}
                                        >
                                            <Pencil size={14} style={{ color: 'var(--accent)' }} />
                                        </button>
                                        {/* Sil */}
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 rounded-xl"
                                            style={{ background: 'rgba(225,112,85,0.08)' }}
                                        >
                                            <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
