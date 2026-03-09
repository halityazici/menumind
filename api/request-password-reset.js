/**
 * Vercel Serverless Function — /api/request-password-reset
 *
 * Supabase'in kendi SMTP'sine bağımlı OLMADAN şifre sıfırlama yapar:
 *  1. Supabase Admin API ile tek kullanımlık recovery link üretir
 *  2. Resend ile branded HTML mail gönderir
 *
 * Gereken env vars (Vercel, server-only):
 *  - SUPABASE_URL            (örn: https://xxx.supabase.co)
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - RESEND_API_KEY
 *  - RESEND_FROM_EMAIL       (örn: MenuMind <noreply@themenumind.com>)
 */

const rateLimitMap = new Map()
const RATE_LIMIT = 3          // 3 istek / 15 dakika (abuse koruması)
const RATE_WINDOW_MS = 15 * 60_000

function checkRateLimit(key) {
    const now = Date.now()
    const rec = rateLimitMap.get(key)
    if (!rec || now > rec.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
        return true
    }
    if (rec.count >= RATE_LIMIT) return false
    rec.count++
    return true
}

function pruneMap() {
    const now = Date.now()
    for (const [k, rec] of rateLimitMap) {
        if (now > rec.resetAt) rateLimitMap.delete(k)
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

    pruneMap()
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Çok fazla istek. 15 dakika bekleyiniz.' })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendKey = process.env.RESEND_API_KEY

    if (!supabaseUrl || !serviceRoleKey || !resendKey) {
        console.error('Missing env vars: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY')
        return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' })
    }

    const { email, redirectTo } = req.body || {}

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Geçersiz e-posta adresi.' })
    }

    // ── 1. Supabase Admin API ile recovery link üret ──────────────
    const generateRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
            type: 'recovery',
            email,
            options: {
                redirect_to: redirectTo || 'https://www.themenumind.com/admin',
            },
        }),
    })

    const generateData = await generateRes.json()

    if (!generateRes.ok) {
        console.error('Supabase generate_link error:', generateData)
        // Kullanıcıya email kayıtlı değil bilgisini verme (güvenlik)
        // Başarılı gibi davran ama mail gönderme
        return res.status(200).json({ ok: true })
    }

    const actionLink = generateData.action_link || generateData.properties?.action_link
    if (!actionLink) {
        console.error('No action_link in response:', generateData)
        return res.status(200).json({ ok: true }) // güvenlik: sussak geç
    }

    // ── 2. Resend ile branded mail gönder ────────────────────────
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'MenuMind <noreply@themenumind.com>'
    const year = new Date().getFullYear()

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Şifre Sıfırlama — MenuMind</title>
</head>
<body style="margin:0;padding:0;background:#F7F1F4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:linear-gradient(135deg,#7B2D45,#5C1F31);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">MenuMind</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Admin Paneli</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1a1a1a;">Şifre Sıfırlama</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
              Admin paneliniz için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 28px;">
                  <a href="${actionLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7B2D45,#5C1F31);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
                    Şifremi Sıfırla
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#888;font-size:13px;line-height:1.5;">
              Butona tıklamakta sorun yaşıyorsanız aşağıdaki linki kopyalayabilirsiniz:
            </p>
            <p style="margin:0 0 24px;word-break:break-all;">
              <a href="${actionLink}" style="color:#7B2D45;font-size:12px;">${actionLink}</a>
            </p>
            <p style="margin:0;color:#aaa;font-size:12px;border-top:1px solid #f0e8ec;padding-top:20px;">
              Bu maili siz talep etmediyseniz güvenle yok sayabilirsiniz. Link 1 saat içinde geçerliliğini yitirir.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#faf5f7;padding:20px 40px;text-align:center;border-top:1px solid #f0e8ec;">
            <p style="margin:0;color:#bbb;font-size:12px;">© ${year} MenuMind · Tüm hakları saklıdır</p>
            <p style="margin:4px 0 0;"><a href="https://www.themenumind.com" style="color:#bbb;text-decoration:none;font-size:11px;">www.themenumind.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const mailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromAddress, to: email, subject: 'MenuMind — Şifre Sıfırlama', html }),
    })

    if (!mailRes.ok) {
        const mailErr = await mailRes.json().catch(() => ({}))
        console.error('Resend error:', mailErr)
        return res.status(502).json({ error: 'E-posta gönderilemedi. Lütfen tekrar deneyin.' })
    }

    return res.status(200).json({ ok: true })
}
