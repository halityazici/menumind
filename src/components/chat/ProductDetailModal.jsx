import { useState } from 'react'
import { X, Plus, Minus, ShoppingBag, AlertTriangle } from 'lucide-react'
import noImage from '../../assets/no-image.png'

export default function ProductDetailModal({ item, cartQty, onClose, onAdd, onChangeQty }) {
    const [qty, setQty] = useState(cartQty || 1)
    const [imgError, setImgError] = useState(false)

    const inCart = cartQty > 0
    const showImage = item.image_url && !imgError

    const handleAdd = () => {
        if (inCart) {
            // Mevcut miktarı güncelle
            const diff = qty - cartQty
            if (diff > 0) onAdd(item, diff)
            else if (diff < 0) onChangeQty(item.id, diff)
        } else {
            onAdd(item, qty)
        }
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-md animate-modal-up flex flex-col"
                style={{
                    background: 'var(--surface)',
                    borderRadius: '28px 28px 0 0',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
                }}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border2)' }} />
                </div>

                {/* Kapat butonu */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                    <X size={16} style={{ color: 'var(--text2)' }} />
                </button>

                {/* Scrollable içerik */}
                <div className="flex-1 overflow-y-auto">

                    {/* Ürün görseli */}
                    <div
                        className="w-full flex-shrink-0 flex items-center justify-center"
                        style={{ height: '220px', background: 'var(--surface2)' }}
                    >
                        <img
                            src={showImage ? item.image_url : noImage}
                            alt={item.name}
                            onError={() => setImgError(true)}
                            className="w-full h-full"
                            style={{
                                objectFit: showImage ? 'cover' : 'contain',
                                padding: showImage ? 0 : '40px',
                            }}
                        />
                    </div>

                    {/* Ürün bilgileri */}
                    <div className="px-5 pt-5 pb-2 space-y-4">

                        {/* Başlık + Fiyat */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h2
                                    className="text-xl font-bold leading-snug"
                                    style={{ fontFamily: 'Poppins', color: 'var(--text)' }}
                                >
                                    {item.name}
                                </h2>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                                    {item.category}
                                </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <p
                                    className="text-2xl font-bold"
                                    style={{ color: 'var(--accent)', fontFamily: 'Poppins' }}
                                >
                                    {Number(item.price).toFixed(0)} ₺
                                </p>
                                {item.calories && (
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                        {item.calories} kcal
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Açıklama */}
                        {item.description && (
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
                                {item.description}
                            </p>
                        )}

                        {/* Alerjenler */}
                        {item.allergens?.length > 0 && (
                            <div
                                className="flex items-start gap-2.5 px-4 py-3 rounded-2xl"
                                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}
                            >
                                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                                <div>
                                    <p className="text-xs font-semibold mb-1" style={{ color: '#D97706' }}>
                                        Alerjen Uyarısı
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {item.allergens.map(a => (
                                            <span
                                                key={a}
                                                className="text-xs px-2 py-0.5 rounded-lg"
                                                style={{
                                                    background: 'rgba(217,119,6,0.1)',
                                                    color: '#B45309',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {a}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Sabit alt — miktar + sepete ekle */}
                <div
                    className="flex-shrink-0 px-5 py-4 flex items-center gap-3"
                    style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
                >
                    {/* Miktar kontrolü */}
                    <div
                        className="flex items-center gap-3 px-3 py-2 rounded-2xl"
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                    >
                        <button
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                            style={{
                                background: qty > 1 ? 'var(--accent)' : 'var(--border)',
                                color: 'white',
                            }}
                        >
                            <Minus size={13} />
                        </button>
                        <span
                            className="text-base font-bold min-w-[20px] text-center"
                            style={{ color: 'var(--text)', fontFamily: 'Poppins' }}
                        >
                            {qty}
                        </span>
                        <button
                            onClick={() => setQty(q => q + 1)}
                            className="w-7 h-7 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--accent)', color: 'white' }}
                        >
                            <Plus size={13} />
                        </button>
                    </div>

                    {/* Sepete ekle butonu */}
                    <button
                        onClick={handleAdd}
                        className="flex-1 py-3.5 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 text-white transition-all active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #732841, #5a1f31)',
                            boxShadow: '0 4px 14px rgba(115,40,65,0.35)',
                        }}
                    >
                        <ShoppingBag size={17} />
                        {inCart
                            ? `Sepeti Güncelle · ${(item.price * qty).toFixed(0)} ₺`
                            : `Sepete Ekle · ${(item.price * qty).toFixed(0)} ₺`
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
