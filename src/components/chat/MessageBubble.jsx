import React from 'react'
import ReactMarkdown from 'react-markdown'

function BotAvatar() {
    return (
        <div style={{
            width: '32px', height: '32px',
            borderRadius: '10px',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700,
            background: 'linear-gradient(135deg, #7B2D45, #9C3D5A)',
            color: 'white',
            boxShadow: '0 3px 10px rgba(123,45,69,0.30)',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '-0.02em',
            alignSelf: 'flex-end',
            marginBottom: '2px',
        }}>
            M
        </div>
    )
}

function TypingIndicator() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }} className="animate-fade-in-up">
            <BotAvatar />
            <div style={{
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 5px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
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

    return (
        <div
            className="animate-fade-in-up"
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                flexDirection: isUser ? 'row-reverse' : 'row',
            }}
        >
            {!isUser && <BotAvatar />}

            <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: isUser ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
                background: isUser
                    ? 'linear-gradient(135deg, #7B2D45, #5C1F31)'
                    : 'var(--surface)',
                color: isUser ? 'white' : 'var(--text)',
                border: isUser ? 'none' : '1px solid var(--border)',
                boxShadow: isUser
                    ? '0 4px 16px rgba(123,45,69,0.28)'
                    : 'var(--shadow-sm)',
                fontSize: '14.5px',
                lineHeight: 1.65,
                fontFamily: 'Inter, sans-serif',
            }}>
                {isUser ? (
                    <p style={{ margin: 0, lineHeight: 1.65, fontSize: '14.5px' }}>
                        {message.content}
                    </p>
                ) : (
                    <div>
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => (
                                    <p style={{
                                        margin: '0 0 9px 0',
                                        lineHeight: 1.65,
                                        fontSize: '14.5px',
                                        color: 'var(--text)',
                                        fontFamily: 'Inter, sans-serif',
                                    }} className="last:mb-0">
                                        {children}
                                    </p>
                                ),
                                strong: ({ children }) => (
                                    <strong style={{ color: 'var(--accent)', fontWeight: 700 }}>
                                        {children}
                                    </strong>
                                ),
                                ul: ({ children }) => (
                                    <ul style={{ margin: '5px 0 9px 0', padding: 0, listStyle: 'none' }}>
                                        {children}
                                    </ul>
                                ),
                                li: ({ children }) => (
                                    <li style={{
                                        display: 'flex', gap: '8px',
                                        color: 'var(--text2)',
                                        lineHeight: 1.6, fontSize: '14px',
                                        marginBottom: '5px',
                                        fontFamily: 'Inter, sans-serif',
                                    }}>
                                        <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px', fontWeight: 700 }}>·</span>
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
                    fontSize: '10.5px',
                    marginTop: '6px',
                    textAlign: isUser ? 'right' : 'left',
                    color: isUser ? 'rgba(255,255,255,0.45)' : 'var(--muted)',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    {new Date(message.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    )
}
