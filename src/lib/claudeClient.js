const MODEL = 'claude-sonnet-4-5'

/**
 * Builds a rich system prompt that injects the live menu as context (RAG).
 */
function buildSystemPrompt(menuItems, restaurantName) {
    const menuText = menuItems.length === 0
        ? 'Menü bilgisi şu an yüklenemedi.'
        : menuItems
            .reduce((acc, item) => {
                if (!acc[item.category]) acc[item.category] = []
                acc[item.category].push(item)
                return acc
            }, {})

    let menuSection = ''
    if (typeof menuText === 'object') {
        for (const [cat, items] of Object.entries(menuText)) {
            menuSection += `\n### ${cat}\n`
            for (const item of items) {
                const allergens = item.allergens?.length
                    ? `  ⚠️ Alerjenler: ${item.allergens.join(', ')}`
                    : '  ✅ Alerjen içermez'
                menuSection += `- **${item.name}** — ${item.price} ₺\n  ${item.description || ''}\n${allergens}\n`
            }
        }
    }

    return `Sen ${restaurantName || 'Restoranımız'} adlı restoranın yapay zeka destekli menü asistanısın.

## Karakterin
- İsmin Garson. Nazik, sıcak ve samimi bir asistansın.
- Türkçe konuşuyorsun, müşteriye "siz" diye hitap ediyorsun.
- Ürünleri ikna edici ama baskıcı olmayan bir üslupla tanıtıyorsun.
- Fiyatları sorulmadan söylemiyorsun ama sorulunca doğrudan belirtiyorsun.
- Alerjen konusunda son derece hassassın — müşteri alerjisini belirtirse ilgili ürünleri önerme.

## Yeteneklerin
- Menüyü kategorilere göre tanıtabilirsin.
- Müşterinin zevklerine göre kişiselleştirilmiş öneri yapabilirsin.
- Alerjen, kalori veya içerik hakkında bilgi verebilirsin.
- Birden fazla ürünü birleştirerek yemek seti önerebilirsin.
- Sipariş özetini net bir şekilde sunabilirsin.

## Önemli Kurallar
- Menüde olmayan yiyecek veya içecek önerme.
- Gerçek olmayan bilgi üretme (hallucination yapma).
- Müşteri bir şey seçtiğinde: "Harika seçim! 'Karar Verdim' butonuna basarak siparişinizi onaylayabilirsiniz." de.

## Güncel Menü
${menuSection}

## Sipariş Yönetimi
Müşteri sipariş vermek istediğinde, seçtiği ürünleri listele, toplam tutarı hesapla ve "Karar Verdim" butonuna yönlendir. Sipariş listesini JSON formatında takip et.
`
}

/**
 * Sends a message to Claude via our secure /api/chat serverless function.
 * The Anthropic API key never touches the browser.
 * @param {Array}  messages     – [{role:'user'|'assistant', content: string}]
 * @param {Array}  menuItems    – current menu from Supabase
 * @param {string} restaurantName
 * @returns {Promise<string>}
 */
export async function sendMessageToClaude(messages, menuItems = [], restaurantName = '') {
    const systemPrompt = buildSystemPrompt(menuItems, restaurantName)

    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, systemPrompt }),
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error || `Chat API error ${response.status}`)
    }

    const data = await response.json()
    return data.text || ''
}
