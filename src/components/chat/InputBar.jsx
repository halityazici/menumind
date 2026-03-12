import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { t } from '../../lib/i18n'

export default function InputBar({ onSend, isLoading, disabled, lang = 'tr' }) {
    const [text, setText] = useState('')
    const textareaRef = useRef(null)
    const [focused, setFocused] = useState(false)

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            const h = Math.min(textareaRef.current.scrollHeight, 120)
            textareaRef.current.style.height = h + 'px'
        }
    }, [text])

    const handleSubmit = () => {
        if (!text.trim() || isLoading || disabled) return
        onSend(text)
        setText('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const canSend = text.trim() && !isLoading && !disabled
    const isActive = focused || canSend

    const placeholder = disabled
        ? t('input.placeholder.loading', lang)
        : isLoading
            ? t('input.placeholder.typing', lang)
            : t('input.placeholder.default', lang)

    return (
        <div style={{
            padding: '10px 14px 16px',
            background: 'var(--surface)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                borderRadius: '16px',
                padding: '10px 10px 10px 16px',
                background: 'var(--bg)',
                border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: isActive ? '0 0 0 3px var(--accent-glow)' : 'none',
                transition: 'border-color 0.18s, box-shadow 0.18s',
            }}>
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    disabled={isLoading || disabled}
                    rows={1}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        resize: 'none',
                        outline: 'none',
                        border: 'none',
                        color: 'var(--text)',
                        lineHeight: '1.60',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14.5px',
                        padding: '2px 0',
                    }}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    style={{
                        flexShrink: 0,
                        width: '36px', height: '36px',
                        borderRadius: '11px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: canSend
                            ? 'linear-gradient(135deg, #7B2D45, #5C1F31)'
                            : 'var(--border)',
                        boxShadow: canSend ? 'var(--shadow-accent)' : 'none',
                        border: 'none',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                        transform: canSend ? 'scale(1)' : 'scale(0.88)',
                    }}
                >
                    <Send size={14} style={{ color: 'white', transform: 'translateX(1px)' }} />
                </button>
            </div>

            <p style={{
                textAlign: 'center',
                marginTop: '7px',
                fontSize: '10.5px',
                color: 'var(--muted)',
                opacity: 0.65,
                fontFamily: 'Inter, sans-serif',
            }}>
                {t('input.hint', lang)}
            </p>
        </div>
    )
}
