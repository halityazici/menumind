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
function buildSystemPrompt(menuItems, restaurantName, recommendedItems = []) {
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
                    ? `  ⚠️ Alerjenler: ${item.allergens.join(', ')}`
                    : '  ✅ Alerjen içermez'
                const newBadge = item.is_new ? ' 🆕 YENİ' : ''
                return `- **${item.name}**${newBadge} — ${item.price} ₺\n  ${item.description || ''}\n${allergens}`
            }).join('\n')
            return `\n### ${cat}\n${rows}`
        }).join('\n')
        : 'Menü bilgisi şu an yüklenemedi.'

    const newItems = menuItems.filter(i => i.is_new)
    let newItemsSection = ''
    if (newItems.length > 0) {
        const newList = newItems.map(i =>
            `- **${i.name}** — ${i.price} ₺${i.description ? '\n  ' + i.description.slice(0, 100) : ''}`
        ).join('\n')
        newItemsSection = `
## 🆕 Yeni Eklenen Ürünler — ÖNEMLİ
Aşağıdaki ürünler menüye yeni eklenmiştir ve mutlaka müşterilere tanıtılmalıdır.

**Kurala uy:** Müşteri sana ilk kez yazıp genel bir soru sorduğunda (ne yemeli, ne tavsiye edersin, ne var, vb.) ya da ilk konuşmanın doğal bir yerinde — en geç 2. veya 3. mesajda — bu ürünlerden birini \"Yeni geldi, henüz denemediyseniz mutlaka deneyin — tadına bakanlar çok beğendi 😊\" ya da benzer sıcak bir cümleyle tanıt. Tüm listeyi arka arkaya sıralama, en uygun 1 tanesini öne çıkar. **Reklam dili kullanma**, garsonun müdavimlerine söyleyeceği gibi doğal konuş.

${newList}

`
    }

    let recommendSection = ''
    if (recommendedItems.length > 0) {
        const recList = recommendedItems
            .map(r => `- **${r.name}** (${r.category || 'Genel'})${r.description ? ' — ' + r.description.slice(0, 80) : ''}`)
            .join('\n')

        recommendSection = `
## Öne Çıkan & Önerilen Ürünler
Aşağıdaki ürünler restoran tarafından özellikle öne çıkarılmak istenmektedir. Yeni eklenenler, en çok tercih edilenler ya da satışı desteklenmek istenen ürünler olabilir. Sohbetin doğal akışında — müşteri ne yiyeceğini bilemediğinde, genel bir öneri istediğinde ya da menüyü ilk kez incelediğinde — bu ürünlerden 1–2'sini içten ve samimi bir garson tavrıyla öner. Reklam dili kullanma; \"Bugün özellikle şunu çok beğeniyoruz\" ya da \"Yeni bir şey denemek ister misiniz?\" gibi doğal bir akışla sun. Tüm listeyi ard arda sıralama, duruma en uygun olanı seç.

${recList}

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
 */
export async function sendMessageToClaude(messages, menuItems = [], restaurantName = '', recommendedItems = []) {
    const systemPrompt = buildSystemPrompt(menuItems, restaurantName, recommendedItems)

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
