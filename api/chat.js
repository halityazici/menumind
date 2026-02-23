/**
 * Vercel Serverless Function — /api/chat
 * Proxies requests to Anthropic Claude API.
 * ANTHROPIC_API_KEY is only available server-side (no VITE_ prefix).
 */
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API key missing.' })
    }

    const { messages, systemPrompt } = req.body
    if (!messages || !systemPrompt) {
        return res.status(400).json({ error: 'Missing required fields: messages, systemPrompt' })
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5',
                max_tokens: 1024,
                system: systemPrompt,
                messages,
            }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            return res.status(response.status).json({
                error: error?.error?.message || `Claude API error ${response.status}`,
            })
        }

        const data = await response.json()
        return res.status(200).json({ text: data.content?.[0]?.text || '' })
    } catch (err) {
        console.error('Chat API error:', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
