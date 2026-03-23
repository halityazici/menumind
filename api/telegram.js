/**
 * Vercel Serverless Function — /api/telegram
 * Sends Telegram notifications server-side.
 * TELEGRAM_BOT_TOKEN is only available server-side (no VITE_ prefix).
 *
 * Güvenlik:
 *  - IP başına rate limit (10 istek / 60 saniye) — spam koruması
 *  - chatId whitelist: sadece server env'deki TELEGRAM_CHAT_ID'ye iletim yapılır
 *  - Payload doğrulama ve boyut sınırı
 *  - Input sanitization — Markdown injection önleme
 */

const rateLimitMap = new Map()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip) {
    const now = Date.now()
    const rec = rateLimitMap.get(ip)
    if (!rec || now > rec.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
        return true
    }
    if (rec.count >= RATE_LIMIT) return false
    rec.count++
    return true
}

function pruneMap() {
    const now = Date.now()
    for (const [ip, rec] of rateLimitMap) {
        if (now > rec.resetAt) rateLimitMap.delete(ip)
    }
}

// HTML özel karakterlerini escape et
function sanitize(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .slice(0, 200)
}

export default async function handler(req, res) {
    // CORS — izin verilen originleri kontrol et
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || 'https://themenumind.com')
        .split(',')
        .map(o => o.trim())
    const requestOrigin = req.headers.origin || ''
    const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]
    res.setHeader('Access-Control-Allow-Origin', corsOrigin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Vary', 'Origin')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

    // Rate limit
    pruneMap()
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
        .split(',')[0].trim()
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Çok fazla istek.' })
    }

    // Payload boyutu
    const bodySize = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8')
    if (bodySize > 8_192) {
        return res.status(413).json({ error: 'Payload too large.' })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
        console.warn('TELEGRAM_BOT_TOKEN not set, skipping notification.')
        return res.status(200).json({ ok: true, skipped: true })
    }

    // chatId güvenliği: server env'den al; istemciden gelen chatId yalnızca eşleşme kontrolü için
    const serverChatId = process.env.TELEGRAM_CHAT_ID
    const { order, chatId } = req.body || {}

    if (!order || !chatId) {
        return res.status(400).json({ error: 'Missing order or chatId' })
    }

    // Sadece tanımlı chat ID'ye gönder — arbitrary chat ID injection önle
    const targetChatId = serverChatId || chatId
    if (serverChatId && String(chatId) !== String(serverChatId)) {
        console.warn(`chatId mismatch: got ${chatId}, expected ${serverChatId}`)
        return res.status(403).json({ error: 'Unauthorized chatId' })
    }

    const itemsList = (Array.isArray(order.items) ? order.items : [])
        .slice(0, 50) // max 50 kalem
        .map(i => `  • ${sanitize(i.name)} x${parseInt(i.qty) || 1} — ${Number(i.price * i.qty).toFixed(2)} ₺`)
        .join('\n')

    const message = [
        '🔔 <b>Yeni Sipariş Geldi!</b>',
        `🕐 ${new Date().toLocaleTimeString('tr-TR')}`,
        order.table_no ? `🪑 Masa: <b>${sanitize(order.table_no)}</b>` : '',
        order.customer_name ? `👤 Müşteri: <b>${sanitize(order.customer_name)}</b>` : '',
        '',
        '<b>Sipariş Detayı:</b>',
        itemsList,
        '',
        `💰 <b>Toplam: ${Number(order.total).toFixed(2)} ₺</b>`,
        order.customer_note ? `📝 Not: <i>${sanitize(order.customer_note)}</i>` : '',
        '',
        `🆔 Sipariş ID: <code>${String(order.id || '').slice(0, 8)}</code>`,
    ].filter(Boolean).join('\n')

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8_000)
        const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: targetChatId, text: message, parse_mode: 'HTML' }),
        })
        clearTimeout(timeout)
        const data = await r.json()
        if (!data.ok) {
            console.error('Telegram API returned error:', data)
        }
        return res.status(200).json(data)
    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'Telegram request timed out.' })
        }
        console.error('Telegram API error:', err)
        return res.status(500).json({ error: 'Failed to send Telegram notification' })
    }
}
