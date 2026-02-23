/**
 * Vercel Serverless Function — /api/telegram
 * Sends Telegram notifications server-side.
 * TELEGRAM_BOT_TOKEN is only available server-side (no VITE_ prefix).
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
        // Telegram is optional — don't crash the app if not configured
        console.warn('TELEGRAM_BOT_TOKEN not set, skipping notification.')
        return res.status(200).json({ ok: true, skipped: true })
    }

    const { order, chatId } = req.body
    if (!order || !chatId) {
        return res.status(400).json({ error: 'Missing order or chatId' })
    }

    const itemsList = (order.items || [])
        .map(i => `  • ${i.name} x${i.qty} — ${(i.price * i.qty).toFixed(2)} ₺`)
        .join('\n')

    const message = [
        '🔔 *Yeni Sipariş Geldi!*',
        `🕐 ${new Date().toLocaleTimeString('tr-TR')}`,
        order.table_no ? `🪑 Masa: *${order.table_no}*` : '',
        order.customer_name ? `👤 Müşteri: *${order.customer_name}*` : '',
        '',
        '*Sipariş Detayı:*',
        itemsList,
        '',
        `💰 *Toplam: ${Number(order.total).toFixed(2)} ₺*`,
        order.customer_note ? `📝 Not: _${order.customer_note}_` : '',
        '',
        `🆔 Sipariş ID: \`${order.id?.slice(0, 8)}\``,
    ].filter(Boolean).join('\n')

    try {
        const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
        })
        const data = await r.json()
        return res.status(200).json(data)
    } catch (err) {
        console.error('Telegram API error:', err)
        return res.status(500).json({ error: 'Failed to send Telegram notification' })
    }
}
