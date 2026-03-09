import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchMenu, fetchSettings } from '../lib/supabaseClient'
import { sendMessageToClaude } from '../lib/claudeClient'

const WELCOME_FALLBACK = 'Merhaba! Ben sizin yapay zeka destekli menü asistanınızım 🤖✨ Size bugün ne önerebilirim?'
const INIT_MAX_RETRIES = 3
const INIT_RETRY_DELAY = 1500   // ms

/* ── Basit sleep yardımcı ────────────────────────────────────────── */
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/* ── Supabase init'ini retry ile sar ────────────────────────────── */
async function loadMenuAndSettings(attempt = 0) {
    try {
        const [menu, sett] = await Promise.all([fetchMenu(), fetchSettings()])
        return { menu, sett }
    } catch (err) {
        if (attempt < INIT_MAX_RETRIES) {
            await sleep(INIT_RETRY_DELAY * (attempt + 1))
            return loadMenuAndSettings(attempt + 1)
        }
        throw err
    }
}

export function useChat() {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [menuItems, setMenuItems] = useState([])
    const [settings, setSettings] = useState({})
    const [error, setError] = useState(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const conversationRef = useRef([])  // Claude'a gönderilen tam geçmiş
    const abortRef = useRef(null)       // iptal edilebilir mevcut istek

    /* ── Menü + ayarlar yükle ──────────────────────────────────────── */
    useEffect(() => {
        let cancelled = false

        async function init() {
            try {
                const { menu, sett } = await loadMenuAndSettings()
                if (cancelled) return

                // Pasif kategorileri belirle
                let passiveCatNames = new Set()
                try {
                    const raw = sett.categories_config
                    if (raw) {
                        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
                        if (Array.isArray(parsed)) {
                            parsed.forEach(c => {
                                if (c.active === false) passiveCatNames.add(c.name.toLowerCase())
                            })
                        }
                    }
                } catch { /* ignore */ }

                const filteredMenu = passiveCatNames.size > 0
                    ? menu.filter(item => !passiveCatNames.has((item.category || '').toLowerCase()))
                    : menu

                setMenuItems(filteredMenu)
                setSettings(sett)

                const welcome = sett.welcome_message || WELCOME_FALLBACK
                setMessages([{ id: 'welcome', role: 'assistant', content: welcome, ts: Date.now() }])
                setIsInitialized(true)
            } catch (err) {
                if (cancelled) return
                console.error('Init error:', err)
                setError('Menü yüklenemedi. Lütfen sayfayı yenileyin.')
                setIsInitialized(true)
            }
        }

        init()
        return () => { cancelled = true }
    }, [])

    /* ── Önerilen ürünleri parse et ───────────────────────────────── */
    const recommendedItems = (() => {
        try {
            const raw = settings.recommended_items
            if (!raw) return []
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    })()

    /* ── Mesaj gönder ─────────────────────────────────────────────── */
    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || isLoading) return

        // Önceki yüklenmekte olan isteği iptal et (kullanıcı çok hızlı yazarsa)
        if (abortRef.current) {
            abortRef.current = null
        }

        const userMsg = { id: Date.now(), role: 'user', content: text.trim(), ts: Date.now() }
        setMessages(prev => [...prev, userMsg])
        conversationRef.current = [...conversationRef.current, { role: 'user', content: text.trim() }]

        setIsLoading(true)
        setError(null)

        try {
            const reply = await sendMessageToClaude(
                conversationRef.current,
                menuItems,
                settings.restaurant_name,
                recommendedItems
            )

            conversationRef.current = [...conversationRef.current, { role: 'assistant', content: reply }]
            const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: reply, ts: Date.now() }
            setMessages(prev => [...prev, assistantMsg])
            setError(null)
        } catch (err) {
            console.error('Claude error:', err)
            // claudeClient'ten gelen kullanıcı dostu mesajı göster
            setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, menuItems, settings, recommendedItems])

    /* ── Sohbeti sıfırla ─────────────────────────────────────────── */
    const resetChat = useCallback(() => {
        conversationRef.current = []
        const welcome = settings.welcome_message || WELCOME_FALLBACK
        setMessages([{ id: 'welcome', role: 'assistant', content: welcome, ts: Date.now() }])
        setError(null)
    }, [settings])

    return { messages, isLoading, menuItems, settings, error, isInitialized, sendMessage, resetChat }
}
