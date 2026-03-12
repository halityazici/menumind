/**
 * Auto-translate product descriptions via Claude AI.
 * - Uses the existing /api/chat endpoint (production) or direct Anthropic call (local dev).
 * - Caches translations in memory so each text is only translated once per session.
 * - Product names are NEVER translated.
 */

const _isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const API_KEY = _isLocalDev ? import.meta.env.VITE_ANTHROPIC_API_KEY : undefined

/* ── In-memory translation cache ─────────────────────────────────── */
const translationCache = new Map() // key: `${lang}:${text}` → translated text

function cacheKey(text, targetLang) {
    return `${targetLang}:${text}`
}

/**
 * Translate a short text (description, allergen, etc.) to the target language.
 * Returns the original text if translation fails or target is 'tr' (source language).
 *
 * @param {string} text       – text to translate (Turkish)
 * @param {string} targetLang – 'en' | 'tr'
 * @returns {Promise<string>}
 */
export async function translateText(text, targetLang = 'en') {
    if (!text || !text.trim()) return text
    if (targetLang === 'tr') return text // Already in Turkish

    const key = cacheKey(text, targetLang)
    if (translationCache.has(key)) return translationCache.get(key)

    const systemPrompt = `You are a precise translator. Translate the following Turkish text to English.
Rules:
- Translate naturally and fluently, not word-by-word.
- Do NOT translate product/food names — keep them in their original Turkish form (e.g. "Türk Kahvesi", "Mercimek Çorbası").
- Only translate descriptive text, ingredient explanations, and informational content.
- Return ONLY the translated text, nothing else. No quotes, no explanations.
- If the text is already in English, return it as-is.`

    const messages = [{ role: 'user', content: text }]

    try {
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

        let translated = ''

        if (isProduction) {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15_000)
            const res = await fetch('/api/chat', {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, systemPrompt }),
            })
            clearTimeout(timeoutId)
            if (!res.ok) throw new Error('Translation failed')
            const data = await res.json()
            translated = data.text || text
        } else {
            if (!API_KEY) return text
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15_000)
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-5',
                    max_tokens: 512,
                    system: systemPrompt,
                    messages,
                }),
            })
            clearTimeout(timeoutId)
            if (!res.ok) throw new Error('Translation failed')
            const data = await res.json()
            translated = data.content?.[0]?.text || text
        }

        // Cache the result
        translationCache.set(key, translated)
        return translated
    } catch (err) {
        console.warn('Translation error, using original text:', err.message)
        return text
    }
}

/**
 * Batch translate multiple texts at once (more efficient — single API call).
 * Returns an object mapping original text → translated text.
 *
 * @param {{ description?: string, allergens?: string[] }} product
 * @param {string} targetLang
 * @returns {Promise<{ description: string, allergens: string[] }>}
 */
export async function translateProduct(product, targetLang = 'en') {
    if (targetLang === 'tr') return { description: product.description, allergens: product.allergens }

    const descKey = cacheKey(product.description || '', targetLang)
    const allergensKey = cacheKey(JSON.stringify(product.allergens || []), targetLang)

    // Check if everything is already cached
    const cachedDesc = translationCache.has(descKey) ? translationCache.get(descKey) : null
    const cachedAllergens = translationCache.has(allergensKey) ? translationCache.get(allergensKey) : null

    if (cachedDesc !== null && cachedAllergens !== null) {
        return {
            description: cachedDesc,
            allergens: typeof cachedAllergens === 'string' ? JSON.parse(cachedAllergens) : cachedAllergens,
        }
    }

    // Build batch translation request
    const parts = []
    if (product.description && !cachedDesc) {
        parts.push(`DESCRIPTION: ${product.description}`)
    }
    if (product.allergens?.length > 0 && !cachedAllergens) {
        parts.push(`ALLERGENS: ${product.allergens.join(', ')}`)
    }

    if (parts.length === 0) {
        return {
            description: cachedDesc || product.description || '',
            allergens: cachedAllergens ? (typeof cachedAllergens === 'string' ? JSON.parse(cachedAllergens) : cachedAllergens) : (product.allergens || []),
        }
    }

    const systemPrompt = `You are a precise translator. Translate the following Turkish food/product information to English.

Rules:
- Translate naturally and fluently.
- Do NOT translate product/food names — keep them in their original Turkish form.
- Return the translation in the EXACT same format as provided.
- If you see "DESCRIPTION: ...", return "DESCRIPTION: ..." with the translated text.
- If you see "ALLERGENS: ...", return "ALLERGENS: ..." with the translated allergen names.
- Return ONLY the translated text in the same format. No explanations.`

    const userContent = parts.join('\n')

    try {
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        let result = ''

        if (isProduction) {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15_000)
            const res = await fetch('/api/chat', {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: userContent }],
                    systemPrompt,
                }),
            })
            clearTimeout(timeoutId)
            if (!res.ok) throw new Error('Batch translation failed')
            const data = await res.json()
            result = data.text || ''
        } else {
            if (!API_KEY) return { description: product.description, allergens: product.allergens }
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15_000)
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-5',
                    max_tokens: 512,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userContent }],
                }),
            })
            clearTimeout(timeoutId)
            if (!res.ok) throw new Error('Batch translation failed')
            const data = await res.json()
            result = data.content?.[0]?.text || ''
        }

        // Parse response
        let translatedDesc = cachedDesc || product.description || ''
        let translatedAllergens = cachedAllergens
            ? (typeof cachedAllergens === 'string' ? JSON.parse(cachedAllergens) : cachedAllergens)
            : (product.allergens || [])

        const descMatch = result.match(/DESCRIPTION:\s*(.+?)(?=\nALLERGENS:|$)/s)
        if (descMatch) {
            translatedDesc = descMatch[1].trim()
            translationCache.set(descKey, translatedDesc)
        }

        const allergensMatch = result.match(/ALLERGENS:\s*(.+)/s)
        if (allergensMatch) {
            translatedAllergens = allergensMatch[1].trim().split(',').map(a => a.trim()).filter(Boolean)
            translationCache.set(allergensKey, JSON.stringify(translatedAllergens))
        }

        return { description: translatedDesc, allergens: translatedAllergens }
    } catch (err) {
        console.warn('Batch translation error:', err.message)
        return { description: product.description || '', allergens: product.allergens || [] }
    }
}
