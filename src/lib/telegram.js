const TELEGRAM_API = `https://api.telegram.org/bot${import.meta.env.VITE_TELEGRAM_BOT_TOKEN}`

/**
 * Sends an order notification to the restaurant owner via Telegram.
 * @param {Object} order   – the order object from Supabase
 * @param {string} chatId  – Telegram chat/group ID  
 */
export async function sendTelegramNotification(order, chatId) {
    const target = chatId || import.meta.env.VITE_TELEGRAM_CHAT_ID
    if (!target || !import.meta.env.VITE_TELEGRAM_BOT_TOKEN) {
        console.warn('Telegram config missing. Skipping notification.')
        return
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
        const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: target,
                text: message,
                parse_mode: 'Markdown',
            }),
        })
        if (!res.ok) {
            const err = await res.json()
            console.error('Telegram API error:', err)
        }
    } catch (err) {
        console.error('Failed to send Telegram notification:', err)
    }
}
