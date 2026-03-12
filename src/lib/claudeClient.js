/**
 * Calls Claude API.
 * - Production (Vercel): proxied through /api/chat serverless function.
 *   ANTHROPIC_API_KEY yaşar ONLY on the server (no VITE_ prefix).
 * - Local dev only: VITE_ANTHROPIC_API_KEY ile doğrudan çağrı yapılır.
 *   Bu key production .env'de OLMAMALI — JS bundle'a gömülür.
 *
 * Dayanıklılık:
 *  - Exponential backoff ile 2 otomatik yeniden deneme (429 / 5xx)
 *  - 25 saniyelik AbortController timeout
 *  - Mesaj geçmişi son 20 ile sınırlı — payload şişmesini önler
 *
 * Çokdillilik:
 *  - lang='en' → Claude İngilizce yanıtlar, ürün isimleri değişmez
 *  - Ürün açıklamaları & alerjen bilgileri otomatik çevrilir
 */

// Sadece local dev'de API key'i oku — production bundle'a gömülmesin
const _isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const API_KEY = _isLocalDev ? import.meta.env.VITE_ANTHROPIC_API_KEY : undefined

const MAX_HISTORY = 20   // Claude'a gönderilen max mesaj sayısı
const TIMEOUT_MS = 25_000


/* ── Exponential backoff sleep ───────────────────────────────────── */
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/* ── Fetch with timeout ──────────────────────────────────────────── */
async function fetchWithTimeout(url, options, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const res = await fetch(url, { ...options, signal: controller.signal })
        clearTimeout(id)
        return res
    } catch (err) {
        clearTimeout(id)
        throw err
    }
}

/* ── Retry ile fetch ─────────────────────────────────────────────── */
async function fetchWithRetry(url, options, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetchWithTimeout(url, options)

            // 429 veya 503 → bekle ve yeniden dene
            if ((res.status === 429 || res.status === 503) && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500
                await sleep(delay)
                continue
            }

            return res
        } catch (err) {
            // Timeout veya network hatası → son denemeyse fırlat
            if (err.name === 'AbortError') {
                throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.')
            }
            if (attempt === maxRetries) throw err
            await sleep(Math.pow(2, attempt) * 800)
        }
    }
}

/* ── Sistem promptu ──────────────────────────────────────────────── */
function buildSystemPrompt(menuItems, restaurantName, recommendedItems = [], lang = 'tr') {
    const isEnglish = lang === 'en'

    const grouped = menuItems.length === 0
        ? null
        : menuItems.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = []
            acc[item.category].push(item)
            return acc
        }, {})

    let menuSection = grouped
        ? Object.entries(grouped).map(([cat, items]) => {
            const rows = items.map(item => {
                const allergens = item.allergens?.length
                    ? `  ⚠️ ${isEnglish ? 'Allergens' : 'Alerjenler'}: ${item.allergens.join(', ')}`
                    : `  ✅ ${isEnglish ? 'No allergens' : 'Alerjen içermez'}`
                const newBadge = item.is_new ? (isEnglish ? ' 🆕 NEW' : ' 🆕 YENİ') : ''
                return `- **${item.name}**${newBadge} — ${item.price} ₺\n  ${item.description || ''}\n${allergens}`
            }).join('\n')
            return `\n### ${cat}\n${rows}`
        }).join('\n')
        : (isEnglish ? 'Menu information could not be loaded.' : 'Menü bilgisi şu an yüklenemedi.')

    const newItems = menuItems.filter(i => i.is_new)
    let newItemsSection = ''
    if (newItems.length > 0) {
        const newList = newItems.map(i =>
            `- **${i.name}** — ${i.price} ₺${i.description ? '\n  ' + i.description.slice(0, 100) : ''}`
        ).join('\n')

        if (isEnglish) {
            newItemsSection = `
## 🆕 Newly Added Products — IMPORTANT
The following products have been newly added to the menu and should be introduced to customers.

**Rule:** When the customer writes for the first time and asks a general question (what should I eat, any recommendations, what's available, etc.) or at a natural point in the first conversation — by the 2nd or 3rd message at the latest — introduce one of these products with a warm sentence like "This just arrived, if you haven't tried it you definitely should — everyone who's tasted it loved it 😊" or similar. Don't list them all at once, highlight the most suitable one. **Don't use advertising language**, speak naturally like a waiter talking to regulars.

${newList}

`
        } else {
            newItemsSection = `
## 🆕 Yeni Eklenen Ürünler — ÖNEMLİ
Aşağıdaki ürünler menüye yeni eklenmiştir ve mutlaka müşterilere tanıtılmalıdır.

**Kurala uy:** Müşteri sana ilk kez yazıp genel bir soru sorduğunda (ne yemeli, ne tavsiye edersin, ne var, vb.) ya da ilk konuşmanın doğal bir yerinde — en geç 2. veya 3. mesajda — bu ürünlerden birini \"Yeni geldi, henüz denemediyseniz mutlaka deneyin — tadına bakanlar çok beğendi 😊\" ya da benzer sıcak bir cümleyle tanıt. Tüm listeyi arka arkaya sıralama, en uygun 1 tanesini öne çıkar. **Reklam dili kullanma**, garsonun müdavimlerine söyleyeceği gibi doğal konuş.

${newList}

`
        }
    }

    let recommendSection = ''
    if (recommendedItems.length > 0) {
        const recList = recommendedItems
            .map(r => `- **${r.name}** (${r.category || (isEnglish ? 'General' : 'Genel')})${r.description ? ' — ' + r.description.slice(0, 80) : ''}`)
            .join('\n')

        if (isEnglish) {
            recommendSection = `
## Featured & Recommended Products
The following products are specifically highlighted by the restaurant. They may be newly added, most popular, or items whose sales the restaurant wants to boost. In the natural flow of conversation — when the customer doesn't know what to order, asks for a general recommendation, or is exploring the menu for the first time — suggest 1–2 of these with a genuine and friendly waiter attitude. Don't use advertising language; present them naturally like "We especially love this today" or "Would you like to try something new?". Don't list them all at once, choose the most appropriate one for the situation.

${recList}

`
        } else {
            recommendSection = `
## Öne Çıkan & Önerilen Ürünler
Aşağıdaki ürünler restoran tarafından özellikle öne çıkarılmak istenmektedir. Yeni eklenenler, en çok tercih edilenler ya da satışı desteklenmek istenen ürünler olabilir. Sohbetin doğal akışında — müşteri ne yiyeceğini bilemediğinde, genel bir öneri istediğinde ya da menüyü ilk kez incelediğinde — bu ürünlerden 1–2'sini içten ve samimi bir garson tavrıyla öner. Reklam dili kullanma; \"Bugün özellikle şunu çok beğeniyoruz\" ya da \"Yeni bir şey denemek ister misiniz?\" gibi doğal bir akışla sun. Tüm listeyi ard arda sıralama, duruma en uygun olanı seç.

${recList}

`
        }
    }

    if (isEnglish) {
        return `You are the AI-powered menu assistant of the restaurant called ${restaurantName || 'Our Restaurant'}.

## Your Character
- Your name is Waiter. You are a polite, warm and friendly assistant.
- You speak English, and address the customer respectfully using "you".
- You present products in a convincing but not pushy manner.
- You don't mention prices unless asked, but when asked you state them directly.
- You are very careful about allergens — if the customer mentions an allergy, don't recommend products containing it.

## CRITICAL RULE — Product Names
- **NEVER translate product names.** Always use the original product names exactly as they appear in the menu below (they are in Turkish). For example, say "Türk Kahvesi" not "Turkish Coffee", say "Mercimek Çorbası" not "Lentil Soup".
- You MUST translate the product descriptions and all other information into fluent, natural English.
- When presenting a product, keep the original name but explain what it is in English. For example: "**Mercimek Çorbası** — A traditional hearty red lentil soup, perfect for a warm start."

## Your Capabilities
- You can present the menu by categories.
- You can make personalized recommendations based on the customer's taste.
- You can provide information about allergens, calories, or ingredients.
- You can suggest meal sets by combining multiple products.
- You can clearly present an order summary.

## Important Rules
- Don't suggest food or drinks that are not on the menu.
- Don't make up information (no hallucination).
- When the customer selects something: say "Great choice! You can confirm your order by pressing the 'Confirm My Order' button."
${newItemsSection}${recommendSection}
## Current Menu
${menuSection}

## Order Management
When the customer wants to place an order, list the selected products, calculate the total amount and direct them to the "Confirm My Order" button. Track the order list in JSON format.
`
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
${newItemsSection}${recommendSection}
## Güncel Menü
${menuSection}

## Sipariş Yönetimi
Müşteri sipariş vermek istediğinde, seçtiği ürünleri listele, toplam tutarı hesapla ve "Karar Verdim" butonuna yönlendir. Sipariş listesini JSON formatında takip et.
`
}

/* ── Hata mesajını kullanıcı dostu hale getir ────────────────────── */
function friendlyError(status, code) {
    if (code === 'RATE_LIMITED' || status === 429)
        return 'Şu an çok fazla istek var. Lütfen bir dakika bekleyip tekrar deneyin. 🙏'
    if (code === 'UPSTREAM_RATE_LIMIT')
        return 'Yapay zeka servisi şu an yoğun. Kısa süre bekleyip tekrar deneyin.'
    if (code === 'TIMEOUT' || status === 504)
        return 'Yanıt gecikti. İnternet bağlantınızı kontrol edip tekrar deneyin.'
    if (status === 503)
        return 'Servis geçici olarak kullanılamıyor. Biraz bekleyip tekrar deneyin.'
    return 'Bir hata oluştu. Lütfen tekrar deneyin.'
}

/* ── Ana export ──────────────────────────────────────────────────── */
/**
 * @param {Array}  messages          – [{role, content}] conversation history
 * @param {Array}  menuItems
 * @param {string} restaurantName
 * @param {Array}  recommendedItems
 * @param {string} lang              – 'tr' | 'en'
 */
export async function sendMessageToClaude(messages, menuItems = [], restaurantName = '', recommendedItems = [], lang = 'tr') {
    const systemPrompt = buildSystemPrompt(menuItems, restaurantName, recommendedItems, lang)

    // Geçmiş şişmesini önle
    const trimmedMessages = messages.slice(-MAX_HISTORY)

    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

    if (isProduction) {
        const res = await fetchWithRetry('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: trimmedMessages, systemPrompt }),
        })

        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(friendlyError(res.status, body?.code))
        }

        const data = await res.json()
        return data.text || ''
    }

    // ── Local dev: Anthropic'e doğrudan istek ────────────────────────
    if (!API_KEY) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env')

    const res = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 1024,
            system: systemPrompt,
            messages: trimmedMessages,
        }),
    })

    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message || friendlyError(res.status, null))
    }

    const data = await res.json()
    return data.content?.[0]?.text || ''
}
