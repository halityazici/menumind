import { useEffect, useRef, useState } from 'react'
import { RotateCcw, ChefHat, Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import OrderConfirmModal from './OrderConfirmModal'
import { useChat } from '../../hooks/useChat'

// Özel logo
const logoModules = import.meta.glob('../../assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['../../assets/logo.png'] ?? null


export default function ChatUI() {
    const { messages, isLoading, menuItems, settings, error, isInitialized, sendMessage, resetChat } = useChat()
    const [showModal, setShowModal] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    const restaurantName = settings?.restaurant_name || import.meta.env.VITE_RESTAURANT_NAME || 'MenuMind'

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

            {/* ── Header ────────────────────────────────────── */}
            <header
                className="flex-shrink-0 flex items-center justify-between px-5 py-4"
                style={{
                    background: 'linear-gradient(135deg, #732841 0%, #5a1f31 100%)',
                    boxShadow: '0 2px 12px rgba(115,40,65,0.30)',
                }}
            >
                <div className="flex items-center gap-3.5">
                    <div
                        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{
                            background: 'rgba(255,255,255,0.18)',
                            border: '2px solid rgba(255,255,255,0.35)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                    >
                        {logoSrc
                            ? <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <ChefHat size={22} style={{ color: 'white' }} />
                        }
                    </div>
                    <div>
                        <h1
                            className="font-bold text-base leading-tight"
                            style={{ color: 'white', fontFamily: 'Poppins', letterSpacing: '-0.01em' }}
                        >
                            {restaurantName}
                        </h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: '#55EFC4' }}
                            />
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                Garson • AI Menü Asistanı
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={resetChat}
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                    title="Sohbeti sıfırla"
                >
                    <RotateCcw size={15} />
                </button>
            </header>

            {/* ── Messages ──────────────────────────────────── */}
            <div
                className="flex-1 overflow-y-auto px-5 py-6 space-y-5"
                style={{ background: 'var(--bg2)' }}
            >
                {!isInitialized && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-3">
                            <div
                                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                                style={{ background: 'var(--accent-soft)' }}
                            >
                                <Sparkles size={20} style={{ color: 'var(--accent)' }} />
                            </div>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>Yükleniyor...</p>
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {isLoading && <MessageBubble isTyping />}

                {error && (
                    <div className="flex justify-center">
                        <span
                            className="text-xs px-3 py-2 rounded-full"
                            style={{
                                background: 'rgba(225,112,85,0.08)',
                                color: 'var(--danger)',
                                border: '1px solid rgba(225,112,85,0.2)',
                            }}
                        >
                            ⚠️ {error}
                        </span>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ── Bottom bar: CTA + Input ──────────────────── */}
            <div
                className="flex-shrink-0"
                style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
            >
                {/* Karar Verdim butonu */}
                {isInitialized && menuItems.length > 0 && (
                    <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '8px' }}>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                padding: '16px 20px',
                                borderRadius: '18px',
                                background: 'linear-gradient(135deg, #00B894, #00967A)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '16px',
                                letterSpacing: '0.01em',
                                boxShadow: '0 4px 20px rgba(0,184,148,0.35)',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'transform 0.1s',
                            }}
                        >
                            <span style={{ fontSize: '18px', lineHeight: 1 }}>&#x2705;</span>
                            Karar Verdim — Sipariş Ver
                        </button>
                    </div>
                )}

                {/* Input alanı */}
                <InputBar onSend={sendMessage} isLoading={isLoading} disabled={!isInitialized} />
            </div>

            {/* ── Modal ─────────────────────────────────────────── */}
            {showModal && (
                <OrderConfirmModal
                    menuItems={menuItems}
                    settings={settings}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    )
}
