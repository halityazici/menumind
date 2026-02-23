import { useState, useEffect, useCallback } from 'react'
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
    TrendingUp, ShoppingBag, Users, Clock,
    RefreshCw, Loader2, CheckCircle, XCircle, ChefHat, AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

/* ── Helpers ──────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n)
const fmtCur = (n) => `${fmt(Number(n).toFixed(0))} ₺`
const fmtSec = (s) => {
    if (!s) return '—'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}d ${sec}s` : `${sec}s`
}

const STATUS_COLORS = {
    'new': '#732841',
    'preparing': '#FDCB6E',
    'delivered': '#00B894',
    'cancelled': '#E17557',
}
const STATUS_LABELS = {
    'new': 'Yeni',
    'preparing': 'Hazırlanıyor',
    'delivered': 'Teslim Edildi',
    'served': 'Teslim Edildi',
    'cancelled': 'İptal',
}
const CHART_COLORS = ['#732841', '#00B894', '#FDCB6E', '#E17557', '#74B9FF', '#FD79A8']

/* ── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, color = 'var(--accent)' }) {
    return (
        <div
            style={{
                borderRadius: '16px',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
        >
            <div
                style={{
                    width: '44px', height: '44px',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: `${color}18`,
                }}
            >
                <Icon size={20} style={{ color }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <p style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'Poppins', color: 'var(--text)', lineHeight: 1.1 }}>
                    {value}
                </p>
                {sub && <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{sub}</p>}
            </div>
        </div>
    )
}

/* ── Section header ───────────────────────────────────────── */
function Section({ title, children }) {
    return (
        <div>
            <p className="text-xs font-bold mb-3 px-1 uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                {title}
            </p>
            {children}
        </div>
    )
}

/* ── Custom tooltip ───────────────────────────────────────── */
function CustomTooltip({ active, payload, label, currency }) {
    if (!active || !payload?.length) return null
    return (
        <div
            className="px-3 py-2 rounded-xl text-xs"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
        >
            <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || 'var(--accent)' }}>
                    {p.name}: {currency ? fmtCur(p.value) : fmt(p.value)}
                </p>
            ))}
        </div>
    )
}

/* ── Main component ───────────────────────────────────────── */
export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    const [range, setRange] = useState(7)
    const [customRange, setCustomRange] = useState(null)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const fmtDate = (d) => d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const applyCustomRange = () => {
        if (!dateFrom || !dateTo) return
        const start = new Date(dateFrom)
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        if (start > end) return
        setCustomRange({ start, end })
        setShowDatePicker(false)
    }

    const clearCustomRange = () => {
        setCustomRange(null)
        setDateFrom('')
        setDateTo('')
        setShowDatePicker(false)
    }


    const load = useCallback(async () => {
        setLoading(true)
        try {
            let sinceISO, untilISO
            if (customRange) {
                sinceISO = customRange.start.toISOString()
                untilISO = customRange.end.toISOString()
            } else {
                const since = new Date()
                since.setDate(since.getDate() - range)
                sinceISO = since.toISOString()
                untilISO = new Date().toISOString()
            }
            const rangeDays = customRange
                ? Math.ceil((customRange.end - customRange.start) / 86400000)
                : range

            const [ordersRes, sessionsRes, allOrdersRes] = await Promise.all([
                supabase.from('orders').select('*').gte('created_at', sinceISO).lte('created_at', untilISO).order('created_at'),
                supabase.from('page_sessions').select('*').gte('started_at', sinceISO).lte('started_at', untilISO),
                supabase.from('orders').select('id, status'),
            ])

            const orders = ordersRes.data || []
            const sessions = sessionsRes.data || []
            const allOrders = allOrdersRes.data || []

            /* KPIs */
            const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0)
            const avgOrder = orders.length ? totalRevenue / orders.filter(o => o.status !== 'cancelled').length : 0
            const validSessions = sessions.filter(s => s.duration_seconds > 0)
            const avgDuration = validSessions.length
                ? Math.round(validSessions.reduce((s, x) => s + x.duration_seconds, 0) / validSessions.length)
                : 0

            /* Orders over time */
            const dayMap = {}
            for (let i = rangeDays - 1; i >= 0; i--) {
                const d = customRange ? new Date(customRange.start) : new Date()
                d.setDate(d.getDate() + (customRange ? i : -i))
                const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
                dayMap[key] = { gün: key, sipariş: 0, ciro: 0 }
            }
            orders.forEach(o => {
                const key = new Date(o.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
                if (dayMap[key]) {
                    dayMap[key].sipariş += 1
                    if (o.status !== 'cancelled') dayMap[key].ciro += Number(o.total)
                }
            })
            const timelineData = Object.values(dayMap)

            /* Status distribution (all orders) */
            const statusCount = {}
            allOrders.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1 })
            const statusData = Object.entries(statusCount).map(([k, v]) => ({
                name: STATUS_LABELS[k] || k,
                value: v,
                color: STATUS_COLORS[k] || '#ccc',
            }))

            /* Top items */
            const itemMap = {}
            orders.forEach(o => {
                (o.items || []).forEach(item => {
                    itemMap[item.name] = (itemMap[item.name] || 0) + item.qty
                })
            })
            const topItems = Object.entries(itemMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 7)
                .map(([name, adet]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, adet }))

            /* Session duration buckets */
            const buckets = { '0-1 dk': 0, '1-3 dk': 0, '3-5 dk': 0, '5-10 dk': 0, '10+ dk': 0 }
            validSessions.forEach(s => {
                const m = s.duration_seconds / 60
                if (m < 1) buckets['0-1 dk']++
                else if (m < 3) buckets['1-3 dk']++
                else if (m < 5) buckets['3-5 dk']++
                else if (m < 10) buckets['5-10 dk']++
                else buckets['10+ dk']++
            })
            const durationData = Object.entries(buckets).map(([name, ziyaret]) => ({ name, ziyaret }))

            /* Conversion rate */
            const converted = sessions.filter(s => s.placed_order).length
            const convRate = sessions.length ? Math.round((converted / sessions.length) * 100) : 0

            setData({
                kpi: {
                    totalOrders: orders.length,
                    totalRevenue,
                    avgOrder,
                    totalVisitors: sessions.length,
                    avgDuration,
                    convRate,
                },
                timelineData,
                statusData,
                topItems,
                durationData,
                statusTotals: statusCount,
            })
        } catch (err) {
            console.error('Analytics error:', err)
        } finally {
            setLoading(false)
        }
    }, [range, customRange])

    useEffect(() => { load() }, [load])

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Veriler yükleniyor...</p>
        </div>
    )

    if (!data) return (
        <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
            <p>Veriler yüklenemedi.</p>
        </div>
    )

    const { kpi, timelineData, statusData, topItems, durationData } = data

    return (
        <div className="space-y-6 pb-8">

            {/* Başlık + filtre */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>Raporlar &amp; Analitiği</h2>
                    <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--muted)' }}>
                        {customRange ? `${fmtDate(customRange.start)} – ${fmtDate(customRange.end)}` : `Son ${range} günün özeti`}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {[7, 14, 30].map(d => (
                        <button key={d} onClick={() => { setRange(d); clearCustomRange() }}
                            style={{ padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: !customRange && range === d ? 'var(--accent)' : 'var(--surface2)', color: !customRange && range === d ? 'white' : 'var(--muted)', border: `1px solid ${!customRange && range === d ? 'transparent' : 'var(--border)'}` }}
                        >{d}G</button>
                    ))}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowDatePicker(v => !v)}
                            style={{ padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: customRange ? 'var(--accent)' : 'var(--surface2)', color: customRange ? 'white' : 'var(--muted)', border: `1px solid ${customRange ? 'transparent' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >📅 {customRange ? 'Özel' : 'Tarih'}</button>
                        {showDatePicker && (
                            <div style={{ position: 'absolute', right: 0, top: '44px', zIndex: 200, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: '250px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Poppins' }}>Özel Tarih Aralığı</p>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Başlangıç</label>
                                    <input type="date" value={dateFrom} max={dateTo || new Date().toISOString().split('T')[0]} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', fontSize: '13px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Bitiş</label>
                                    <input type="date" value={dateTo} min={dateFrom} max={new Date().toISOString().split('T')[0]} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', fontSize: '13px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={clearCustomRange} style={{ flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}>Sıfırla</button>
                                    <button onClick={applyCustomRange} disabled={!dateFrom || !dateTo} style={{ flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: dateFrom && dateTo ? 'linear-gradient(135deg,#732841,#5a1f31)' : 'var(--border)', color: dateFrom && dateTo ? 'white' : 'var(--muted)', border: 'none', cursor: dateFrom && dateTo ? 'pointer' : 'not-allowed' }}>Uygula</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={load} style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}><RefreshCw size={13} /></button>
                </div>
            </div>


            {/* KPI grid */}
            <Section title="Genel Bakış">
                <div className="grid grid-cols-2 gap-3">
                    <KpiCard icon={ShoppingBag} label="Toplam Sipariş" value={fmt(kpi.totalOrders)} sub={`Son ${range} gün`} color="#732841" />
                    <KpiCard icon={TrendingUp} label="Toplam Ciro" value={fmtCur(kpi.totalRevenue)} sub="İptal hariç" color="#00B894" />
                    <KpiCard icon={ChefHat} label="Ort. Sipariş Değeri" value={fmtCur(kpi.avgOrder)} color="#FDCB6E" />
                    <KpiCard icon={Users} label="Ziyaretçi" value={fmt(kpi.totalVisitors)} sub={`%${kpi.convRate} sipariş verdi`} color="#74B9FF" />
                    <KpiCard icon={Clock} label="Ort. Oturum Süresi" value={fmtSec(kpi.avgDuration)} sub="Müşteri başına" color="#FD79A8" />
                    <KpiCard
                        icon={AlertCircle}
                        label="Dönüşüm Oranı"
                        value={`%${kpi.convRate}`}
                        sub="Ziyaret → Sipariş"
                        color="#E17557"
                    />
                </div>
            </Section>

            {/* Sipariş durumları */}
            <Section title="Sipariş Durumları">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <div
                            key={key}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '16px 12px',
                                borderRadius: '14px',
                                textAlign: 'center',
                                gap: '6px',
                                background: 'var(--surface)',
                                border: '1.5px solid var(--border)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: STATUS_COLORS[key] }} />
                                <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                            </div>
                            <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', fontFamily: 'Poppins', lineHeight: 1 }}>
                                {fmt(data.statusTotals[key] || 0)}
                            </p>
                        </div>
                    ))}
                </div>
                {statusData.length > 0 && (
                    <div
                        className="rounded-2xl p-4"
                        style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
                    >
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => [fmt(v), 'Sipariş']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(v) => <span style={{ color: 'var(--text2)', fontSize: 11 }}>{v}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </Section>

            {/* Günlük ciro */}
            <Section title={`Günlük Ciro (Son ${range} Gün)`}>
                <div
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
                >
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={timelineData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="gün"
                                tick={{ fontSize: 10, fill: 'var(--muted)' }}
                                interval={range > 14 ? 3 : 0}
                            />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} width={45} />
                            <Tooltip content={<CustomTooltip currency />} />
                            <Line
                                type="monotone"
                                dataKey="ciro"
                                name="Ciro"
                                stroke="#732841"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#732841' }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Section>

            {/* Günlük sipariş adedi */}
            <Section title={`Günlük Sipariş Adedi (Son ${range} Gün)`}>
                <div
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
                >
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={timelineData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="gün"
                                tick={{ fontSize: 10, fill: 'var(--muted)' }}
                                interval={range > 14 ? 3 : 0}
                            />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} width={30} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="sipariş" name="Sipariş" fill="#00B894" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>

            {/* En çok sipariş edilen */}
            {topItems.length > 0 && (
                <Section title="En Çok Sipariş Edilen Ürünler">
                    <div
                        className="rounded-2xl p-4"
                        style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
                    >
                        <ResponsiveContainer width="100%" height={topItems.length * 36 + 20}>
                            <BarChart
                                data={topItems}
                                layout="vertical"
                                margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted)' }} allowDecimals={false} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 10, fill: 'var(--text2)' }}
                                    width={110}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="adet" name="Adet" radius={[0, 4, 4, 0]}>
                                    {topItems.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Section>
            )}

            {/* Oturum süresi dağılımı */}
            <Section title="Ziyaretçi Oturum Süresi Dağılımı">
                <div
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
                >
                    {kpi.totalVisitors === 0 ? (
                        <p className="text-center text-sm py-6" style={{ color: 'var(--muted)' }}>
                            Henüz oturum verisi yok. Müşteriler menü sayfasını ziyaret ettikçe veriler burada görünecek.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={durationData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} width={30} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="ziyaret" name="Ziyaret" fill="#74B9FF" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div
                        style={{
                            padding: '16px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            background: 'var(--surface)', border: '1.5px solid var(--border)',
                        }}
                    >
                        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sipariş Veren</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, color: '#00B894', fontFamily: 'Poppins', lineHeight: 1 }}>
                            {fmt(data.statusTotals['new'] || 0 + data.statusTotals['preparing'] || 0 + data.statusTotals['delivered'] || 0)}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={11} style={{ color: '#00B894' }} /> müşteri
                        </p>
                    </div>
                    <div
                        style={{
                            padding: '16px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            background: 'var(--surface)', border: '1.5px solid var(--border)',
                        }}
                    >
                        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>İptal Edilen</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, color: '#E17557', fontFamily: 'Poppins', lineHeight: 1 }}>
                            {fmt(data.statusTotals['cancelled'] || 0)}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={11} style={{ color: '#E17557' }} /> sipariş
                        </p>
                    </div>
                </div>
            </Section>

        </div>
    )
}
