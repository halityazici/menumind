import { useState, useEffect } from 'react'
import { X, Plus, Minus, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react'
import noImage from '../../assets/no-image.png'
import { t } from '../../lib/i18n'
import { translateProduct } from '../../lib/translate'

export default function ProductDetailModal({ item, cartQty, onClose, onAdd, onChangeQty, lang = 'tr' }) {
    const [qty, setQty] = useState(cartQty || 1)
    const [imgError, setImgError] = useState(false)
    const [translatedDesc, setTranslatedDesc] = useState(item.description || '')
    const [translatedAllergens, setTranslatedAllergens] = useState(item.allergens || [])
    const [isTranslating, setIsTranslating] = useState(false)

    const inCart = cartQty > 0
    const showImage = item.image_url && !imgError

    /* ── Auto-translate when lang = 'en' ──────────────────────────── */
    useEffect(() => {
        if (lang === 'tr') {
            setTranslatedDesc(item.description || '')
            setTranslatedAllergens(item.allergens || [])
            return
        }

        let cancelled = false
        setIsTranslating(true)

        translateProduct(
            { description: item.description, allergens: item.allergens },
            lang
        ).then(result => {
            if (cancelled) return
            setTranslatedDesc(result.description)
            setTranslatedAllergens(result.allergens)
        }).finally(() => {
            if (!cancelled) setIsTranslating(false)
        })

        return () => { cancelled = true }
    }, [item.id, lang])

    const handleAdd = () => {
        if (inCart) {
            const diff = qty - cartQty
            if (diff > 0) onAdd(item, diff)
            else if (diff < 0) onChangeQty(item.id, diff)
        } else {
            onAdd(item, qty)
        }
        onClose()
    }

    const buttonLabel = inCart
        ? `${t('product.updateCart', lang)} · ${(item.price * qty).toFixed(0)} ₺`
        : `${t('product.addToCart', lang)} · ${(item.price * qty).toFixed(0)} ₺`

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-md animate-modal-up"
                style={{
                    background: 'var(--surface)',
                    borderRadius: '28px 28px 0 0',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* ── Image section ─────────────────────────────── */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    {/* Image */}
                    <div
                        style={{
                            width: '100%',
                            height: '200px',
                            background: showImage
                                ? 'var(--surface2)'
                                : 'linear-gradient(135deg, #f5f0eb 0%, #ebe3da 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            borderRadius: '28px 28px 0 0',
                        }}
                    >
                        <img
                            src={showImage ? item.image_url : noImage}
                            alt={item.name}
                            width={440}
                            height={200}
                            onError={() => { if (!imgError) setImgError(true) }}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: showImage ? 'cover' : 'contain',
                                padding: showImage ? 0 : '48px',
                                display: 'block',
                            }}
                        />
                    </div>

                    {/* Close button — overlaying image */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.92)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                            border: 'none',
                            cursor: 'pointer',
                            backdropFilter: 'blur(8px)',
                            transition: 'transform 0.15s',
                        }}
                    >
                        <X size={16} style={{ color: 'var(--text2)' }} />
                    </button>

                    {/* Price badge — overlaying image bottom-right */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-16px',
                            right: '20px',
                            padding: '8px 18px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #7B2D45, #5C1F31)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '18px',
                            fontFamily: 'Poppins, sans-serif',
                            boxShadow: '0 4px 16px rgba(123,45,69,0.35)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {Number(item.price).toFixed(0)} ₺
                    </div>
                </div>

                {/* ── Scrollable content ────────────────────────── */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '28px 24px 16px',
                    }}
                >
                    {/* Title + Category + Calories */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2
                                style={{
                                    fontWeight: 700,
                                    fontSize: '20px',
                                    lineHeight: 1.3,
                                    fontFamily: 'Poppins, sans-serif',
                                    color: 'var(--text)',
                                    margin: 0,
                                }}
                            >
                                {item.name}
                            </h2>
                            {item.is_new && (
                                <span style={{
                                    fontSize: '9px',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(251,191,36,0.15)',
                                    color: '#92400E',
                                    fontWeight: 700,
                                    border: '1px solid rgba(251,191,36,0.35)',
                                    flexShrink: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}>
                                    {t('product.new', lang)}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: 'var(--muted)',
                                fontFamily: 'Inter, sans-serif',
                            }}>
                                {item.category}
                            </span>
                            {item.calories && (
                                <>
                                    <span style={{ color: 'var(--border2)', fontSize: '10px' }}>·</span>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: 'var(--muted)',
                                        fontFamily: 'Inter, sans-serif',
                                    }}>
                                        {item.calories} kcal
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description — auto-translated */}
                    {(item.description || translatedDesc) && (
                        <div style={{ marginBottom: '16px' }}>
                            {isTranslating ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 16px',
                                    borderRadius: '14px',
                                    background: 'var(--surface2)',
                                    border: '1px solid var(--border)',
                                }}>
                                    <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                    <span style={{
                                        fontSize: '13px',
                                        color: 'var(--muted)',
                                        fontFamily: 'Inter, sans-serif',
                                        fontStyle: 'italic',
                                    }}>
                                        {t('product.translating', lang)}
                                    </span>
                                </div>
                            ) : (
                                <p style={{
                                    fontSize: '14px',
                                    lineHeight: 1.7,
                                    color: 'var(--text2)',
                                    fontFamily: 'Inter, sans-serif',
                                    margin: 0,
                                    letterSpacing: '0.005em',
                                }}>
                                    {translatedDesc}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Allergens — auto-translated */}
                    {translatedAllergens?.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '12px 14px',
                                borderRadius: '14px',
                                background: 'rgba(251,191,36,0.06)',
                                border: '1px solid rgba(251,191,36,0.20)',
                            }}
                        >
                            <AlertTriangle size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
                            <div>
                                <p style={{
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    marginBottom: '6px',
                                    color: '#D97706',
                                    fontFamily: 'Inter, sans-serif',
                                }}>
                                    {t('product.allergenWarning', lang)}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {translatedAllergens.map((a, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                fontSize: '11.5px',
                                                padding: '3px 10px',
                                                borderRadius: '8px',
                                                background: 'rgba(217,119,6,0.08)',
                                                color: '#B45309',
                                                fontWeight: 500,
                                                fontFamily: 'Inter, sans-serif',
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

                {/* ── Fixed footer — qty + add to cart ─────────── */}
                <div
                    style={{
                        flexShrink: 0,
                        padding: '14px 20px 18px',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    {/* Quantity controls */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 10px',
                            borderRadius: '14px',
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            flexShrink: 0,
                        }}
                    >
                        <button
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                background: qty > 1 ? 'var(--accent)' : 'var(--border)',
                                color: 'white',
                            }}
                        >
                            <Minus size={14} />
                        </button>
                        <span
                            style={{
                                minWidth: '24px',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '16px',
                                color: 'var(--text)',
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            {qty}
                        </span>
                        <button
                            onClick={() => setQty(q => q + 1)}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                background: 'var(--accent)',
                                color: 'white',
                            }}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Add to cart button */}
                    <button
                        onClick={handleAdd}
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            borderRadius: '14px',
                            fontWeight: 600,
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            background: 'linear-gradient(135deg, #7B2D45, #5C1F31)',
                            boxShadow: '0 4px 16px rgba(123,45,69,0.35)',
                            transition: 'transform 0.12s, box-shadow 0.12s',
                        }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                        <ShoppingBag size={17} />
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
