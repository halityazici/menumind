import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

export default function InputBar({ onSend, isLoading, disabled }) {
    const [text, setText] = useState('')
    const textareaRef = useRef(null)

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

    return (
        <div style={{
            background: 'var(--surface)',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingBottom: '20px',
            paddingTop: '10px',
        }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '10px',
                    borderRadius: '20px',
                    paddingLeft: '16px',
                    paddingRight: '12px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: 'var(--bg2)',
                    border: `1.5px solid ${canSend ? 'var(--accent)' : 'var(--border)'}`,
                    boxShadow: canSend ? '0 0 0 3px rgba(115,40,65,0.08)' : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={disabled ? 'Yükleniyor...' : isLoading ? 'Garson yazıyor...' : 'Bir şey sorun...'}
                    disabled={isLoading || disabled}
                    rows={1}
                    className="flex-1 bg-transparent resize-none outline-none"
                    style={{
                        color: 'var(--text)',
                        lineHeight: '1.6',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px',
                        padding: '2px 0',
                    }}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{
                        background: canSend
                            ? 'linear-gradient(135deg, #732841, #5a1f31)'
                            : 'var(--border)',
                        boxShadow: canSend ? '0 2px 10px rgba(115,40,65,0.35)' : 'none',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        transform: canSend ? 'scale(1)' : 'scale(0.9)',
                    }}
                >
                    <Send size={16} style={{ color: 'white', transform: 'translateX(1px)' }} />
                </button>
            </div>
            <p
                className="text-center mt-2"
                style={{ color: 'var(--muted)', fontSize: '10px', opacity: 0.7 }}
            >
                Enter ile gönder · Shift+Enter yeni satır
            </p>
        </div>
    )
}
