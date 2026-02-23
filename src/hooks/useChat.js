import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchMenu, fetchSettings } from '../lib/supabaseClient'
import { sendMessageToClaude } from '../lib/claudeClient'

const WELCOME_FALLBACK = 'Merhaba! Ben sizin yapay zeka destekli menü asistanınızım 🤖✨ Size bugün ne önerebilirim?'

export function useChat() {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [menuItems, setMenuItems] = useState([])
    const [settings, setSettings] = useState({})
    const [error, setError] = useState(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const conversationRef = useRef([]) // tracks full history for Claude

    // Load menu + settings, then show welcome message
    useEffect(() => {
        async function init() {
            try {
                const [menu, sett] = await Promise.all([fetchMenu(), fetchSettings()])
                setMenuItems(menu)
                setSettings(sett)

                const welcome = sett.welcome_message || WELCOME_FALLBACK
                const welcomeMsg = { id: 'welcome', role: 'assistant', content: welcome, ts: Date.now() }
                setMessages([welcomeMsg])
                // Don't push welcome to conversationRef — it's shown as UI only
                setIsInitialized(true)
            } catch (err) {
                console.error('Init error:', err)
                setError('Bağlantı hatası. Lütfen sayfayı yenileyin.')
                setIsInitialized(true)
            }
        }
        init()
    }, [])

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || isLoading) return

        const userMsg = { id: Date.now(), role: 'user', content: text.trim(), ts: Date.now() }
        setMessages(prev => [...prev, userMsg])

        // Add to conversation history for Claude
        conversationRef.current = [
            ...conversationRef.current,
            { role: 'user', content: text.trim() }
        ]

        setIsLoading(true)
        setError(null)

        try {
            const reply = await sendMessageToClaude(
                conversationRef.current,
                menuItems,
                settings.restaurant_name
            )

            conversationRef.current = [
                ...conversationRef.current,
                { role: 'assistant', content: reply }
            ]

            const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: reply, ts: Date.now() }
            setMessages(prev => [...prev, assistantMsg])
        } catch (err) {
            console.error('Claude error:', err)
            setError('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, menuItems, settings])

    const resetChat = useCallback(() => {
        conversationRef.current = []
        const welcome = settings.welcome_message || WELCOME_FALLBACK
        setMessages([{ id: 'welcome', role: 'assistant', content: welcome, ts: Date.now() }])
        setError(null)
    }, [settings])

    return { messages, isLoading, menuItems, settings, error, isInitialized, sendMessage, resetChat }
}
