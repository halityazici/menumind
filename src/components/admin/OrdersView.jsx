import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Clock, CheckCircle, XCircle, ChefHat } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { supabase } from '../../lib/supabaseClient'

const STATUS_CONFIG = {
    new: { label: 'Yeni', color: '#732841', icon: Clock },
    preparing: { label: 'Hazırlanıyor', color: '#f59e0b', icon: ChefHat },
    served: { label: 'Teslim Edildi', color: '#22d3a5', icon: CheckCircle },
    cancelled: { label: 'İptal', color: '#f87171', icon: XCircle },
}

const STATUS_FLOW = { new: 'preparing', preparing: 'served' }

export default function OrdersView() {
    const { orders, loading, loadOrders, updateOrderStatus } = useMenu()
    const [filterStatus, setFilterStatus] = useState('all')
    const [cancelTarget, setCancelTarget] = useState(null)   // {id, table_no}

    useEffect(() => {
        loadOrders()
        const channel = supabase
            .channel('orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                loadOrders()
            })
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [loadOrders])

    const filtered = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus)

    const handleAdvanceStatus = async (order) => {
        const next = STATUS_FLOW[order.status]
        if (!next) return
        await updateOrderStatus(order.id, next)
    }

    const confirmCancel = async () => {
        if (!cancelTarget) return
        await updateOrderStatus(cancelTarget.id, 'cancelled')
        setCancelTarget(null)
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
    )

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── İptal onay modalı ── */}
            {cancelTarget && (
                <div
                    onClick={() => setCancelTarget(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--surface)',
                            borderRadius: '20px',
                            padding: '28px 24px',
                            maxWidth: '340px',
                            width: '100%',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'rgba(248,113,113,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <XCircle size={26} style={{ color: '#f87171' }} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: '17px', fontFamily: 'Poppins', color: 'var(--text)', marginBottom: '8px' }}>
                            Siparişi İptal Et
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.55 }}>
                            {cancelTarget.table_no ? `Masa ${cancelTarget.table_no} için` : 'Bu'} siparişi iptal etmek istediğinizden emin misiniz?
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setCancelTarget(null)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '14px',
                                    fontSize: '14px', fontWeight: 600,
                                    background: 'var(--surface2)', color: 'var(--text2)',
                                    border: '1.5px solid var(--border)', cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={confirmCancel}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '14px',
                                    fontSize: '14px', fontWeight: 600,
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: 'white', border: 'none', cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                                }}
                            >
                                İptal Et
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter tabs ── */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['all', 'new', 'preparing', 'served', 'cancelled'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        style={{
                            flexShrink: 0,
                            padding: '7px 14px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            background: filterStatus === s
                                ? 'linear-gradient(135deg, #732841, #5a1f31)'
                                : 'var(--surface2)',
                            color: filterStatus === s ? 'white' : 'var(--muted)',
                            border: `1px solid ${filterStatus === s ? 'transparent' : 'var(--border)'}`,
                            boxShadow: filterStatus === s ? '0 3px 10px rgba(115,40,65,0.3)' : 'none',
                        }}
                    >
                        {s === 'all' ? 'Tümü' : STATUS_CONFIG[s]?.label}
                        {' '}
                        <span style={{ fontWeight: 700 }}>
                            ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
                        </span>
                    </button>
                ))}
                <button
                    onClick={loadOrders}
                    style={{
                        flexShrink: 0, padding: '7px 10px',
                        borderRadius: '12px', cursor: 'pointer',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <RefreshCw size={14} style={{ color: 'var(--muted)' }} />
                </button>
            </div>

            {/* ── Orders ── */}
            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
                    <p style={{ fontSize: '14px' }}>Bu kategoride sipariş yok.</p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map(order => {
                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new
                    const Icon = cfg.icon
                    const canAdvance = !!STATUS_FLOW[order.status]

                    return (
                        <div
                            key={order.id}
                            style={{
                                borderRadius: '16px',
                                padding: '16px',
                                display: 'flex', flexDirection: 'column', gap: '12px',
                                background: 'var(--surface)',
                                border: `1px solid ${cfg.color}33`,
                                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Icon size={14} style={{ color: cfg.color }} />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                                    {order.table_no && (
                                        <span style={{
                                            fontSize: '11px', padding: '2px 8px',
                                            borderRadius: '8px', background: 'var(--surface2)',
                                            color: 'var(--muted)',
                                        }}>
                                            Masa {order.table_no}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                    {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {(order.items || []).map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span>{item.name} <span style={{ color: 'var(--muted)' }}>×{item.qty}</span></span>
                                        <span style={{ color: 'var(--muted)' }}>{(item.price * item.qty).toFixed(2)} ₺</span>
                                    </div>
                                ))}
                            </div>

                            {/* Note */}
                            {order.customer_note && (
                                <p style={{
                                    fontSize: '12px', padding: '8px 12px',
                                    borderRadius: '10px', fontStyle: 'italic',
                                    background: 'var(--surface2)', color: 'var(--muted)',
                                }}>
                                    📝 {order.customer_note}
                                </p>
                            )}

                            {/* Footer */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                paddingTop: '10px', borderTop: '1px solid var(--border)',
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                                    {Number(order.total).toFixed(2)} ₺
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {order.status !== 'cancelled' && order.status !== 'served' && (
                                        <button
                                            onClick={() => setCancelTarget({ id: order.id, table_no: order.table_no })}
                                            style={{
                                                padding: '8px 14px', borderRadius: '10px',
                                                fontSize: '12px', fontWeight: 600,
                                                background: 'rgba(248,113,113,0.10)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(248,113,113,0.25)',
                                                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                            }}
                                        >
                                            İptal
                                        </button>
                                    )}
                                    {canAdvance && (
                                        <button
                                            onClick={() => handleAdvanceStatus(order)}
                                            style={{
                                                padding: '8px 14px', borderRadius: '10px',
                                                fontSize: '12px', fontWeight: 600,
                                                background: 'linear-gradient(135deg, #732841, #5a1f31)',
                                                color: 'white', border: 'none',
                                                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                                boxShadow: '0 3px 10px rgba(115,40,65,0.3)',
                                            }}
                                        >
                                            {order.status === 'new' ? '🍳 Hazırlamaya Başla' : '✅ Teslim Edildi'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
