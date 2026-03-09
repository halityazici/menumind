/**
 * Vercel Serverless Function — /api/chat
 * Proxies requests to Anthropic Claude API.
 * ANTHROPIC_API_KEY is only available server-side (no VITE_ prefix).
 *
 * Dayanıklılık iyileştirmeleri:
 *  - IP başına rate limit (20 istek / 60 saniye — in-memory, serverless window)
 *  - Payload boyutu sınırı (32 KB)
 *  - Mesaj sayısı sınırı (son 20 mesaj)
 *  - AbortController ile 25 saniyelik timeout
 *  - Hata kodları: 429 (rate limit), 503 (upstream), 504 (timeout)
 */

/* ── In-memory rate limiter (serverless instance başına) ─────────── */
const rateLimitMap = new Map()   // ip -> { count, resetAt }
const RATE_LIMIT = 20            // istek / pencere
const RATE_WINDOW_MS = 60_000   // 60 saniye

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

// Bellek sızıntısını önlemek için eski kayıtları periyodik temizle
function pruneRateLimitMap() {
    const now = Date.now()
    for (const [ip, rec] of rateLimitMap) {
        if (now > rec.resetAt) rateLimitMap.delete(ip)
    }
}

/* ── Handler ─────────────────────────────────────────────────────── */
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

    // ── API key ──────────────────────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Server configuration error.' })

    // ── Rate limit ───────────────────────────────────────────────────
    pruneRateLimitMap()
    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
        .split(',')[0].trim()
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({
            error: 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.',
            code: 'RATE_LIMITED',
        })
    }

    // ── Payload boyutu ───────────────────────────────────────────────
    const bodySize = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8')
    if (bodySize > 32_768) {
        return res.status(413).json({ error: 'İstek çok büyük.', code: 'PAYLOAD_TOO_LARGE' })
    }

    // ── Giriş doğrulama ──────────────────────────────────────────────
    const { messages, systemPrompt } = req.body || {}
    if (!Array.isArray(messages) || typeof systemPrompt !== 'string') {
        return res.status(400).json({ error: 'Geçersiz istek formatı.' })
    }

    // Son 20 mesajı al — geçmiş şişmesini önle
    const trimmedMessages = messages.slice(-20)

    // ── Claude API çağrısı (25 sn timeout) ───────────────────────────
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25_000)

    try {
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5',
                max_tokens: 1024,
                system: systemPrompt,
                messages: trimmedMessages,
            }),
        })

        clearTimeout(timeoutId)

        if (!upstream.ok) {
            const errBody = await upstream.json().catch(() => ({}))
            const status = upstream.status === 429 ? 429 : 503
            return res.status(status).json({
                error: upstream.status === 429
                    ? 'Yapay zeka servisi şu an yoğun. Kısa bir süre bekleyip tekrar deneyin.'
                    : 'Yapay zeka servisine ulaşılamıyor. Lütfen tekrar deneyin.',
                code: upstream.status === 429 ? 'UPSTREAM_RATE_LIMIT' : 'UPSTREAM_ERROR',
                detail: errBody?.error?.message,
            })
        }

        const data = await upstream.json()
        const text = data.content?.[0]?.text || ''
        return res.status(200).json({ text })

    } catch (err) {
        clearTimeout(timeoutId)

        if (err.name === 'AbortError') {
            return res.status(504).json({
                error: 'Yanıt zaman aşımına uğradı. Lütfen tekrar deneyin.',
                code: 'TIMEOUT',
            })
        }

        console.error('[chat.js] Unexpected error:', err.message)
        return res.status(500).json({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' })
    }
}
