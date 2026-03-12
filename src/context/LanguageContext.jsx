import { createContext, useContext, useState, useCallback } from 'react'
import { DEFAULT_LANG, LANGUAGES, t as translate } from '../lib/i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        // Restore from localStorage if available
        try {
            const saved = localStorage.getItem('menumind_lang')
            if (saved && LANGUAGES[saved]) return saved
        } catch { /* ignore */ }
        return DEFAULT_LANG
    })

    const toggleLang = useCallback(() => {
        setLang(prev => {
            const next = prev === 'tr' ? 'en' : 'tr'
            try { localStorage.setItem('menumind_lang', next) } catch { /* ignore */ }
            return next
        })
    }, [])

    const t = useCallback((key) => translate(key, lang), [lang])

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
    return ctx
}
