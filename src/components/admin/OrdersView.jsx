import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Clock, CheckCircle, XCircle, ChefHat } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { supabase } from '../../lib/supabaseClient'

const STATUS_CONFIG = {
    new: { label: 'Yeni', color: '#7c6af7', icon: Clock },
    preparing: { label: 'Hazırlanıyor', color: '#f59e0b', icon: ChefHat },
    served: { label: 'Teslim Edildi', color: '#22d3a5', icon: CheckCircle },
    cancelled: { label: 'İptal', color: '#f87171', icon: XCircle },
}

const STATUS_FLOW = { new: 'preparing', preparing: 'served' }

export default function OrdersView() {
    const { orders, loading, loadOrders, updateOrderStatus } = useMenu()
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => {
        loadOrders()

        // Realtime subscription
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

    const handleCancel = async (order) => {
        if (!confirm('Siparişi iptal etmek istiyor musunuz?')) return
        await updateOrderStatus(order.id, 'cancelled')
    }

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-accent2)' }} />
        </div>
    )

    return (
        <div className="p-4 space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {['all', 'new', 'preparing', 'served', 'cancelled'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                            background: filterStatus === s ? 'linear-gradient(135deg, #7c6af7, #6455e8)' : 'var(--color-surface2)',
                            color: filterStatus === s ? 'white' : 'var(--color-muted)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        {s === 'all' ? 'Tümü' : STATUS_CONFIG[s]?.label}
                        {' '}
                        <span className="font-bold">
                            ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
                        </span>
                    </button>
                ))}
                <button onClick={loadOrders} className="flex-shrink-0 p-2 rounded-xl" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                    <RefreshCw size={14} style={{ color: 'var(--color-muted)' }} />
                </button>
            </div>

            {/* Orders */}
            {filtered.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--color-muted)' }}>
                    <p className="text-sm">Bu kategoride sipariş yok.</p>
                </div>
            )}

            <div className="space-y-3">
                {filtered.map(order => {
                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new
                    const Icon = cfg.icon
                    const canAdvance = !!STATUS_FLOW[order.status]

                    return (
                        <div
                            key={order.id}
                            className="rounded-2xl p-4 space-y-3"
                            style={{ background: 'var(--color-surface2)', border: `1px solid ${cfg.color}33` }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon size={14} style={{ color: cfg.color }} />
                                    <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                                    {order.table_no && (
                                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}>
                                            Masa {order.table_no}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                    {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Items */}
                            <div className="space-y-1">
                                {(order.items || []).map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span>{item.name} <span style={{ color: 'var(--color-muted)' }}>×{item.qty}</span></span>
                                        <span style={{ color: 'var(--color-muted)' }}>{(item.price * item.qty).toFixed(2)} ₺</span>
                                    </div>
                                ))}
                            </div>

                            {/* Note */}
                            {order.customer_note && (
                                <p className="text-xs px-3 py-2 rounded-xl italic" style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}>
                                    📝 {order.customer_note}
                                </p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                                <span className="font-bold" style={{ color: 'var(--color-accent2)' }}>
                                    {Number(order.total).toFixed(2)} ₺
                                </span>
                                <div className="flex gap-2">
                                    {order.status !== 'cancelled' && order.status !== 'served' && (
                                        <button
                                            onClick={() => handleCancel(order)}
                                            className="px-3 py-1.5 rounded-xl text-xs"
                                            style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(248,113,113,0.2)' }}
                                        >
                                            İptal
                                        </button>
                                    )}
                                    {canAdvance && (
                                        <button
                                            onClick={() => handleAdvanceStatus(order)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-medium"
                                            style={{ background: 'linear-gradient(135deg, #7c6af7, #6455e8)', color: 'white' }}
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
