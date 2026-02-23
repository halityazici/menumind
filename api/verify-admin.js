/**
 * Vercel Serverless Function — /api/verify-admin
 * Verifies admin password server-side.
 * ADMIN_PASSWORD is only available server-side (no VITE_ prefix).
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
        return res.status(500).json({ error: 'Server configuration error: Admin password not set.' })
    }

    const { password } = req.body
    if (!password) {
        return res.status(400).json({ error: 'Missing password field' })
    }

    // Constant-time comparison to prevent timing attacks
    const inputBytes = Buffer.from(password)
    const storedBytes = Buffer.from(adminPassword)

    if (
        inputBytes.length === storedBytes.length &&
        require('crypto').timingSafeEqual(inputBytes, storedBytes)
    ) {
        return res.status(200).json({ ok: true })
    }

    // Deliberate 500ms delay to slow down brute force
    await new Promise(r => setTimeout(r, 500))
    return res.status(401).json({ ok: false, error: 'Invalid password' })
}
