import { timingSafeEqual } from 'crypto'

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
    try {
        const inputBytes = Buffer.from(String(password))
        const storedBytes = Buffer.from(adminPassword)

        const match =
            inputBytes.length === storedBytes.length &&
            timingSafeEqual(inputBytes, storedBytes)

        if (match) {
            return res.status(200).json({ ok: true })
        }
    } catch {
        // Length mismatch or encoding error → wrong password
    }

    // Deliberate 300ms delay to slow down brute force
    await new Promise(r => setTimeout(r, 300))
    return res.status(401).json({ ok: false, error: 'Invalid password' })
}
