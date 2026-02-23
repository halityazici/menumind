/**
 * Sends an order notification to the restaurant owner via /api/telegram serverless function.
 * Telegram bot token never touches the browser.
 * @param {Object} order   – the order object from Supabase
 * @param {string} chatId  – Telegram chat/group ID
 */
export async function sendTelegramNotification(order, chatId) {
    const target = chatId || import.meta.env.VITE_TELEGRAM_CHAT_ID
    if (!target) {
        console.warn('Telegram chatId missing. Skipping notification.')
        return
    }

    try {
        const res = await fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order, chatId: target }),
        })
        if (!res.ok) {
            const err = await res.json()
            console.error('Telegram API error:', err)
        }
    } catch (err) {
        console.error('Failed to send Telegram notification:', err)
    }
}
