const fs = require('fs')
let c = fs.readFileSync('src/components/admin/AnalyticsPage.jsx', 'utf8')

// 1) Add state vars
c = c.replace(
    `const [range, setRange] = useState(7)   // days`,
    `const [range, setRange] = useState(7)
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
    }`
)

// 2) Update load deps
c = c.replace('    }, [range])', '    }, [range, customRange])')

// 3) Update sinceISO block
c = c.replace(
    `            const since = new Date()
            since.setDate(since.getDate() - range)
            const sinceISO = since.toISOString()

            const [ordersRes, sessionsRes, allOrdersRes] = await Promise.all([
                supabase.from('orders').select('*').gte('created_at', sinceISO).order('created_at'),
                supabase.from('page_sessions').select('*').gte('started_at', sinceISO),
                supabase.from('orders').select('id, status'),   // all orders for status totals`,
    `            let sinceISO, untilISO
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
                supabase.from('orders').select('id, status'),`
)

// 4) Update dayMap loop
c = c.replace(
    `            for (let i = range - 1; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)`,
    `            for (let i = rangeDays - 1; i >= 0; i--) {
                const d = customRange ? new Date(customRange.start) : new Date()
                d.setDate(d.getDate() + (customRange ? i : -i))`
)

// 5) Replace header section
const oldHeader = `            {/* Başlık + filtre */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'Poppins', color: 'var(--text)' }}>
                        Raporlar & Analitiği
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Son {range} günün özeti</p>
                </div>
                <div className="flex items-center gap-2">
                    {[7, 14, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => setRange(d)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                            style={{
                                background: range === d ? 'var(--accent)' : 'var(--surface2)',
                                color: range === d ? 'white' : 'var(--muted)',
                                border: \`1px solid \${range === d ? 'transparent' : 'var(--border)'}\`,
                            }}
                        >
                            {d}G
                        </button>
                    ))}
                    <button
                        onClick={load}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
                    >
                        <RefreshCw size={13} />
                    </button>
                </div>
            </div>`

const newHeader = `            {/* Başlık + filtre */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>
                        Raporlar &amp; Analitiği
                    </h2>
                    <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--muted)' }}>
                        {customRange
                            ? \`\${fmtDate(customRange.start)} \u2013 \${fmtDate(customRange.end)}\`
                            : \`Son \${range} günün özeti\`}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {[7, 14, 30].map(d => (
                        <button key={d} onClick={() => { setRange(d); clearCustomRange() }}
                            style={{ padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: !customRange && range === d ? 'var(--accent)' : 'var(--surface2)', color: !customRange && range === d ? 'white' : 'var(--muted)', border: \`1px solid \${!customRange && range === d ? 'transparent' : 'var(--border)'}\` }}
                        >{d}G</button>
                    ))}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowDatePicker(v => !v)}
                            style={{ padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: customRange ? 'var(--accent)' : 'var(--surface2)', color: customRange ? 'white' : 'var(--muted)', border: \`1px solid \${customRange ? 'transparent' : 'var(--border)'}\`, display: 'flex', alignItems: 'center', gap: '5px' }}
                        >{'\u{1F4C5}'} {customRange ? '\u00d6zel' : 'Tarih'}</button>
                        {showDatePicker && (
                            <div style={{ position: 'absolute', right: 0, top: '44px', zIndex: 200, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: '260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Poppins' }}>{\u00d6zel Tarih Aral\u0131\u011f\u0131}</p>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Ba\u015flang\u0131\u00e7</label>
                                    <input type="date" value={dateFrom} max={dateTo || new Date().toISOString().split('T')[0]} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', fontSize: '13px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Biti\u015f</label>
                                    <input type="date" value={dateTo} min={dateFrom} max={new Date().toISOString().split('T')[0]} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', fontSize: '13px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={clearCustomRange} style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}>S\u0131f\u0131rla</button>
                                    <button onClick={applyCustomRange} disabled={!dateFrom || !dateTo} style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: dateFrom && dateTo ? 'linear-gradient(135deg, #732841, #5a1f31)' : 'var(--border)', color: dateFrom && dateTo ? 'white' : 'var(--muted)', border: 'none', cursor: dateFrom && dateTo ? 'pointer' : 'not-allowed' }}>Uygula</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={load} style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}>
                        <RefreshCw size={13} />
                    </button>
                </div>
            </div>`

if (c.includes(oldHeader)) {
    c = c.replace(oldHeader, newHeader)
    console.log('Header replaced OK')
} else {
    console.log('Header NOT found - checking...')
    const idx = c.indexOf('Başlık + filtre')
    console.log('idx:', idx)
    if (idx > -1) console.log(JSON.stringify(c.substring(idx - 5, idx + 300)))
}

fs.writeFileSync('src/components/admin/AnalyticsPage.jsx', c, 'utf8')
console.log('File written, lines:', c.split('\n').length)
