/**
 * Vercel Serverless Function — /api/send-email
 * Resend ile transactional email gönderir.
 * RESEND_API_KEY sadece server-side'da tutulur.
 *
 * Kullanım türleri:
 *  - type: 'password_reset'  → Şifre sıfırlama maili
 *  - type: 'welcome'         → Gelecekte genişletilebilir
 */

const rateLimitMap = new Map()
const RATE_LIMIT = 5          // 5 istek / 15 dakika (email abuse koruması)
const RATE_WINDOW_MS = 15 * 60_000

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

export default async function handler(req, res) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || 'https://themenumind.com')
        .split(',').map(o => o.trim())
    const requestOrigin = req.headers.origin || ''
    const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]
    res.setHeader('Access-Control-Allow-Origin', corsOrigin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Vary', 'Origin')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        console.warn('RESEND_API_KEY not set.')
        return res.status(500).json({ error: 'Email service not configured.' })
    }

    // Rate limit
    pruneMap()
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
        .split(',')[0].trim()
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Çok fazla istek. Lütfen bekleyin.' })
    }

    const { type, to, resetLink } = req.body || {}

    if (!type || !to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return res.status(400).json({ error: 'Geçersiz istek.' })
    }

    let subject, html

    if (type === 'password_reset') {
        if (!resetLink || !resetLink.startsWith('https://')) {
            return res.status(400).json({ error: 'Geçersiz reset linki.' })
        }
        subject = 'MenuMind — Şifre Sıfırlama'
        html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Şifre Sıfırlama</title>
</head>
<body style="margin:0;padding:0;background:#F7F1F4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7B2D45,#5C1F31);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">MenuMind</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Admin Paneli</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1a1a1a;">Şifre Sıfırlama</h2>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
                Admin paneliniz için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7B2D45,#5C1F31);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.01em;">
                      Şifremi Sıfırla
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#888;font-size:13px;line-height:1.5;">
                Bu butona tıklamakta sorun yaşıyorsanız aşağıdaki linki tarayıcınıza kopyalayabilirsiniz:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${resetLink}" style="color:#7B2D45;font-size:12px;">${resetLink}</a>
              </p>
              <p style="margin:0;color:#aaa;font-size:12px;border-top:1px solid #f0e8ec;padding-top:20px;">
                Bu maili siz talep etmediyseniz güvenle yok sayabilirsiniz. Link 1 saat içinde geçerliliğini yitirir.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#faf5f7;padding:20px 40px;text-align:center;border-top:1px solid #f0e8ec;">
              <p style="margin:0;color:#bbb;font-size:12px;">© ${new Date().getFullYear()} MenuMind · Tüm hakları saklıdır</p>
              <p style="margin:4px 0 0;color:#ccc;font-size:11px;">
                <a href="https://www.themenumind.com" style="color:#bbb;text-decoration:none;">www.themenumind.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    } else {
        return res.status(400).json({ error: 'Bilinmeyen email tipi.' })
    }

    try {
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'MenuMind <noreply@themenumind.com>'
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from: fromAddress, to, subject, html }),
        })

        const data = await r.json()
        if (!r.ok) {
            console.error('Resend error:', data)
            return res.status(502).json({ error: 'E-posta gönderilemedi.', detail: data })
        }

        return res.status(200).json({ ok: true, id: data.id })
    } catch (err) {
        console.error('Send email error:', err)
        return res.status(500).json({ error: 'Sunucu hatası.' })
    }
}
