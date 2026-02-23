import { useState } from 'react'
import { X, ShoppingBag, Loader2, CheckCircle, AlertCircle, Plus, Minus, Search } from 'lucide-react'
import { insertOrder } from '../../lib/supabaseClient'
import { sendTelegramNotification } from '../../lib/telegram'
import ProductDetailModal from './ProductDetailModal'
import noImage from '../../assets/no-image.png'

const STATUS = { IDLE: 'idle', LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' }

export default function OrderConfirmModal({ menuItems, onClose, settings }) {
    const [tableNo, setTableNo] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [note, setNote] = useState('')
    const [cart, setCart] = useState([])
    const [status, setStatus] = useState(STATUS.IDLE)
    const [errorMsg, setErrorMsg] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [tableError, setTableError] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)

    const addToCart = (item, qty = 1) => {
        setCart(prev => {
            const ex = prev.find(c => c.id === item.id)
            if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + qty } : c)
            return [...prev, { ...item, qty }]
        })
    }

    const changeQty = (id, delta) => {
        setCart(prev =>
            prev
                .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
                .filter(c => c.qty > 0)
        )
    }

    const total = cart.reduce((s, c) => s + c.price * c.qty, 0)
    const categories = [...new Set(menuItems.map(m => m.category))]
    const filteredMenu = menuItems.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleConfirm = async () => {
        // Masa numarası zorunlu
        if (!tableNo.trim()) {
            setTableError(true)
            setErrorMsg('Masa numarasını lütfen girin.')
            return
        }
        if (cart.length === 0) {
            setErrorMsg('Lütfen en az bir ürün ekleyin.')
            return
        }
        setStatus(STATUS.LOADING)
        setErrorMsg('')

        const payload = {
            items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })),
            total,
            customer_note: note.trim() || null,
            table_no: tableNo.trim(),
            customer_name: customerName.trim() || null,
        }

        try {
            const saved = await insertOrder(payload)
            await sendTelegramNotification(saved, settings?.telegram_chat_id)
            setStatus(STATUS.SUCCESS)
        } catch (err) {
            // Eğer customer_name kolonu yoksa, onsuz tekrar dene
            if (err?.message?.includes('customer_name') || err?.code === '42703') {
                try {
                    const { customer_name: _dropped, ...payloadWithout } = payload
                    const saved = await insertOrder(payloadWithout)
                    await sendTelegramNotification(saved, settings?.telegram_chat_id)
                    setStatus(STATUS.SUCCESS)
                    return
                } catch (err2) {
                    console.error('Retry failed:', err2)
                    setErrorMsg('Sipariş gönderilemedi. Lütfen tekrar deneyin.')
                    setStatus(STATUS.ERROR)
                    return
                }
            }
            console.error(err)
            setErrorMsg('Sipariş gönderilemedi. Lütfen tekrar deneyin.')
            setStatus(STATUS.ERROR)
        }
    }


    /* ── Success screen ───────────────────────────────────────── */
    if (status === STATUS.SUCCESS) {
        return (
            <Backdrop onClose={onClose}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 32px',
                    gap: '20px',
                    textAlign: 'center',
                    minHeight: '320px',
                }}>
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,184,148,0.10)',
                        }}
                    >
                        <CheckCircle size={40} style={{ color: 'var(--success)' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', fontFamily: 'Poppins', color: 'var(--text)' }}>
                            {customerName ? `Teşekkürler, ${customerName}!` : 'Siparişiniz Alındı!'}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                            Mutfağa iletildi, kısa sürede hazırlanacak.
                        </p>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Poppins' }}>
                        {total.toFixed(2)} ₺
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '14px 36px',
                            borderRadius: '16px',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            background: 'linear-gradient(135deg, #6C5CE7, #5A4DD4)',
                            boxShadow: '0 4px 14px rgba(108,92,231,0.35)',
                        }}
                    >
                        Harika, teşekkürler! 🎉
                    </button>
                </div>
            </Backdrop>
        )
    }

    /* ── Main modal ───────────────────────────────────────────── */
    return (
        <Backdrop
            onClose={status === STATUS.LOADING ? null : onClose}
            selectedItem={selectedItem}
            onCloseDetail={() => setSelectedItem(null)}
            addToCart={addToCart}
            changeQty={changeQty}
            cart={cart}
        >
            {/* ── Fixed header ── */}
            <div
                style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--accent-soft)',
                            flexShrink: 0,
                        }}
                    >
                        <ShoppingBag size={18} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                        <h2 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>Sipariş Özeti</h2>
                        {cart.length > 0 && (
                            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                                {cart.reduce((s, c) => s + c.qty, 0)} ürün · {total.toFixed(2)} ₺
                            </p>
                        )}
                    </div>
                </div>
                {status !== STATUS.LOADING && (
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--surface2)',
                            color: 'var(--muted)',
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Masa no — ZORUNLU */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: tableError ? 'var(--danger)' : 'var(--text2)',
                            fontFamily: 'Inter, sans-serif',
                        }}>
                            Masa Numarası
                            <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={tableNo}
                            onChange={e => { setTableNo(e.target.value); setTableError(false); setErrorMsg('') }}
                            placeholder="Masa numaranız nedir?"
                            className="input-field"
                            style={{
                                background: 'var(--surface2)',
                                borderColor: tableError ? 'var(--danger)' : undefined,
                                boxShadow: tableError ? '0 0 0 3px rgba(225,112,85,0.12)' : undefined,
                            }}
                        />
                        {tableError && (
                            <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}>
                                ⚠️ Lütfen masa numaranızı girin.
                            </p>
                        )}
                    </div>

                    {/* Müşteri adı — OPSİYONEL */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: 'var(--text2)',
                            fontFamily: 'Inter, sans-serif',
                        }}>
                            Size nasıl hitap edelim?
                            <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: '4px' }}>(isteğe bağlı)</span>
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Adınız (örn: Ahmet)"
                            className="input-field"
                            style={{ background: 'var(--surface2)' }}
                        />
                        <p style={{ fontSize: '11px', marginTop: '6px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                            Siparışinizi size özel teslim edebilmek için.
                        </p>
                    </div>

                    {/* Menü seçim alanı */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginBottom: '10px',
                            color: 'var(--text2)',
                            fontFamily: 'Inter, sans-serif',
                        }}>
                            Menüden Seçin
                        </label>
                        {/* Arama */}
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                            <Search size={14} style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--muted)',
                                pointerEvents: 'none',
                            }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Ürün ara..."
                                className="input-field"
                                style={{ paddingLeft: '36px', background: 'var(--surface2)' }}
                            />
                        </div>

                        {/* Ürün listesi — tıklanabilir, detay modal açar */}
                        <div
                            style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '2px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                        >
                            {categories.map(cat => {
                                const items = filteredMenu.filter(m => m.category === cat)
                                if (!items.length) return null
                                return (
                                    <div key={cat}>
                                        <p
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                marginBottom: '8px',
                                                paddingLeft: '4px',
                                                color: 'var(--accent)',
                                                letterSpacing: '0.04em',
                                                textTransform: 'uppercase',
                                                fontFamily: 'Inter, sans-serif',
                                            }}
                                        >
                                            {cat}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {items.map(item => {
                                                const inCart = cart.find(c => c.id === item.id)
                                                return (
                                                    <div
                                                        key={item.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '10px 12px',
                                                            borderRadius: '12px',
                                                            cursor: 'pointer',
                                                            background: inCart ? 'var(--accent-soft)' : 'var(--surface2)',
                                                            border: `1px solid ${inCart ? 'rgba(108,92,231,0.25)' : 'var(--border)'}`,
                                                            transition: 'all 0.1s',
                                                        }}
                                                        onClick={() => setSelectedItem(item)}
                                                    >
                                                        {/* Küçük görsel */}
                                                        <img
                                                            src={item.image_url || noImage}
                                                            alt={item.name}
                                                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                                                            style={{ objectFit: item.image_url ? 'cover' : 'contain', padding: item.image_url ? 0 : '4px', background: 'var(--surface)' }}
                                                            onError={e => { e.target.src = noImage; e.target.style.objectFit = 'contain'; e.target.style.padding = '4px' }}
                                                        />
                                                        <span className="text-sm truncate flex-1" style={{ color: 'var(--text)' }}>
                                                            {item.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                            <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
                                                                {Number(item.price).toFixed(0)} ₺
                                                            </span>
                                                            {inCart ? (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => changeQty(item.id, -1)}
                                                                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                                        style={{ background: 'var(--accent)', color: 'white' }}
                                                                    >
                                                                        <Minus size={10} />
                                                                    </button>
                                                                    <span className="w-5 text-center text-xs font-bold" style={{ color: 'var(--accent)' }}>
                                                                        {inCart.qty}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => changeQty(item.id, 1)}
                                                                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                                        style={{ background: 'var(--accent)', color: 'white' }}
                                                                    >
                                                                        <Plus size={10} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); addToCart(item) }}
                                                                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                                                                    style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 2px 6px rgba(108,92,231,0.3)' }}
                                                                >
                                                                    <Plus size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Sepet özeti */}
                    {cart.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>
                                Seçilenler
                            </label>
                            <div
                                className="rounded-2xl overflow-hidden"
                                style={{ border: '1px solid var(--border)' }}
                            >
                                {cart.map((item, i) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between px-4 py-3"
                                        style={{
                                            borderBottom: i < cart.length - 1 ? '1px solid var(--border)' : 'none',
                                            background: 'var(--surface)',
                                        }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                                {item.qty} × {Number(item.price).toFixed(2)} ₺
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                                                {(item.price * item.qty).toFixed(2)} ₺
                                            </span>
                                            <button
                                                onClick={() => changeQty(item.id, -item.qty)}
                                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                style={{ color: 'var(--danger)' }}
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Not */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: 'var(--text2)',
                            fontFamily: 'Inter, sans-serif',
                        }}>
                            Sipariş Notu <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(isteğe bağlı)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Özel istekler, alerjenler, pişirme tercihleri..."
                            rows={3}
                            className="input-field"
                            style={{ background: 'var(--surface2)', resize: 'none' }}
                        />
                    </div>


                </div>
            </div>

            {/* ── Fixed footer ── */}
            <div
                style={{
                    flexShrink: 0,
                    padding: '16px 24px 20px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)',
                }}
            >
                {/* Hata mesajı — her zaman görünür */}
                {errorMsg && (
                    <div
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-3"
                        style={{
                            background: 'rgba(225,112,85,0.08)',
                            border: '1px solid rgba(225,112,85,0.2)',
                            color: 'var(--danger)',
                        }}
                    >
                        <AlertCircle size={15} className="flex-shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {cart.length > 0 && (
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Toplam Tutar</span>
                        <span className="text-2xl font-bold" style={{ color: 'var(--accent)', fontFamily: 'Poppins' }}>
                            {total.toFixed(2)} ₺
                        </span>
                    </div>
                )}
                <button
                    onClick={handleConfirm}
                    disabled={status === STATUS.LOADING || cart.length === 0}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '16px',
                        fontSize: '15px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: 'white',
                        border: 'none',
                        fontFamily: 'Inter, sans-serif',
                        background: (status === STATUS.LOADING || cart.length === 0)
                            ? 'var(--border2)'
                            : 'linear-gradient(135deg, #6C5CE7, #5A4DD4)',
                        boxShadow: (cart.length > 0 && status !== STATUS.LOADING)
                            ? '0 4px 14px rgba(108,92,231,0.35)'
                            : 'none',
                        cursor: (status === STATUS.LOADING || cart.length === 0) ? 'not-allowed' : 'pointer',
                    }}
                >
                    {status === STATUS.LOADING ? (
                        <><Loader2 size={18} className="animate-spin" /> Gönderiliyor...</>
                    ) : (
                        <>✅ Siparişi Onayla</>
                    )}
                </button>
                <p className="text-center text-xs mt-2" style={{ color: 'var(--muted)', fontSize: '11px' }}>
                    <span style={{ color: 'var(--danger)' }}>*</span> Zorunlu alan
                </p>
            </div>
        </Backdrop>
    )
}

/* ── Backdrop wrapper ─────────────────────────────────────── */
function Backdrop({ children, onClose, selectedItem, onCloseDetail, addToCart, changeQty, cart }) {
    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-end justify-center"
                style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
                onClick={e => e.target === e.currentTarget && onClose?.()}
            >
                <div
                    className="w-full max-w-md flex flex-col animate-modal-up"
                    style={{
                        background: 'var(--surface)',
                        borderRadius: '28px 28px 0 0',
                        boxShadow: 'var(--shadow-modal)',
                        maxHeight: '92vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* drag handle */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border2)' }} />
                    </div>
                    {children}
                </div>
            </div>

            {/* Ürün detay modal — üstte katman olarak */}
            {selectedItem && (
                <ProductDetailModal
                    item={selectedItem}
                    cartQty={cart.find(c => c.id === selectedItem.id)?.qty || 0}
                    onClose={onCloseDetail}
                    onAdd={addToCart}
                    onChangeQty={changeQty}
                />
            )}
        </>
    )
}
