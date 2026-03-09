/**
 * Sends an order notification to the restaurant owner via /api/telegram serverless function.
 * Telegram bot token and chat ID never touch the browser bundle.
 * chatId is read from Supabase settings (restaurant-configured), not from env.
 * @param {Object} order   – the order object from Supabase
 * @param {string} chatId  – Telegram chat/group ID (from Supabase settings)
 */
export async function sendTelegramNotification(order, chatId) {
    // chatId must come from settings (Supabase) — never from a VITE_ env var
    if (!chatId) {
        console.warn('Telegram chatId not configured in settings. Skipping notification.')
        return
    }

    try {
        const res = await fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order, chatId }),
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            console.error('Telegram API error:', err)
        }
    } catch (err) {
        console.error('Failed to send Telegram notification:', err)
    }
}
