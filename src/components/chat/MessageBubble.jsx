import React from 'react'
import ReactMarkdown from 'react-markdown'

const BOT_AVATAR = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #6C5CE7, #8B7CF8)',
    color: 'white',
    boxShadow: '0 3px 10px rgba(108,92,231,0.35)',
    marginBottom: '4px',
}

function TypingIndicator() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}
            className="animate-fade-in-up">
            <div style={BOT_AVATAR}>M</div>
            <div style={{
                padding: '14px 18px',
                borderRadius: '20px 20px 20px 4px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                </div>
            </div>
        </div>
    )
}

export default function MessageBubble({ message, isTyping }) {
    if (isTyping) return <TypingIndicator />

    const isUser = message.role === 'user'

    const bubbleStyle = isUser
        ? {
            maxWidth: '82%',
            padding: '14px 18px',
            borderRadius: '20px 20px 4px 20px',
            background: 'linear-gradient(135deg, #6C5CE7, #5A4DD4)',
            color: 'white',
            boxShadow: '0 3px 16px rgba(108,92,231,0.30)',
            fontSize: '15px',
            lineHeight: 1.65,
            fontFamily: 'Inter, sans-serif',
        }
        : {
            maxWidth: '82%',
            padding: '14px 18px',
            borderRadius: '20px 20px 20px 4px',
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            fontSize: '15px',
            lineHeight: 1.65,
            fontFamily: 'Inter, sans-serif',
        }

    return (
        <div
            className="animate-fade-in-up"
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '10px',
                flexDirection: isUser ? 'row-reverse' : 'row',
            }}
        >
            {/* Bot avatar */}
            {!isUser && <div style={BOT_AVATAR}>M</div>}

            <div style={bubbleStyle}>
                {isUser ? (
                    <p style={{ margin: 0, lineHeight: 1.65, fontSize: '15px' }}>{message.content}</p>
                ) : (
                    <div>
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => (
                                    <p style={{
                                        margin: '0 0 10px 0',
                                        lineHeight: 1.65,
                                        fontSize: '15px',
                                        color: 'var(--text)',
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                        className="last:mb-0"
                                    >
                                        {children}
                                    </p>
                                ),
                                strong: ({ children }) => (
                                    <strong style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '15px' }}>
                                        {children}
                                    </strong>
                                ),
                                ul: ({ children }) => (
                                    <ul style={{ margin: '6px 0 10px 0', padding: 0, listStyle: 'none' }}>
                                        {children}
                                    </ul>
                                ),
                                li: ({ children }) => (
                                    <li style={{
                                        display: 'flex',
                                        gap: '8px',
                                        color: 'var(--text2)',
                                        lineHeight: 1.6,
                                        fontSize: '14px',
                                        marginBottom: '6px',
                                        fontFamily: 'Inter, sans-serif',
                                    }}>
                                        <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }}>•</span>
                                        <span>{children}</span>
                                    </li>
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}

                <div style={{
                    fontSize: '11px',
                    marginTop: '6px',
                    textAlign: isUser ? 'right' : 'left',
                    color: isUser ? 'rgba(255,255,255,0.55)' : 'var(--muted)',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    {new Date(message.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    )
}
