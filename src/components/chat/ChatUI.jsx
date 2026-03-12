import { useEffect, useRef, useState } from 'react'
import { RotateCcw, ChefHat, Sparkles, Globe } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import OrderConfirmModal from './OrderConfirmModal'
import { useChat } from '../../hooks/useChat'
import { useLanguage } from '../../context/LanguageContext'
import { LANGUAGES } from '../../lib/i18n'

const logoModules = import.meta.glob('../../assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['../../assets/logo.png'] ?? null

export default function ChatUI() {
    const { lang, toggleLang, t } = useLanguage()
    const { messages, isLoading, menuItems, settings, error, isInitialized, sendMessage, resetChat } = useChat(lang)
    const [showModal, setShowModal] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    const restaurantName = settings?.restaurant_name || import.meta.env.VITE_RESTAURANT_NAME || 'MenuMind'
    const otherLang = lang === 'tr' ? LANGUAGES.en : LANGUAGES.tr

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>

            {/* ── Header ──────────────────────────────────────── */}
            <header
                className="flex-shrink-0"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
                    boxShadow: '0 2px 16px rgba(92,31,49,0.40)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Subtle glow overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.07) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '40px', height: '40px',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0,
                        background: 'rgba(255,255,255,0.15)',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
                    }}>
                        {logoSrc
                            ? <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <ChefHat size={18} style={{ color: 'white' }} />
                        }
                    </div>

                    {/* Title */}
                    <div>
                        <h1 style={{
                            fontWeight: 700, fontSize: '15px',
                            color: 'white', fontFamily: 'Poppins',
                            letterSpacing: '-0.01em', lineHeight: 1.2,
                        }}>
                            {restaurantName}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: '#34D399',
                                boxShadow: '0 0 6px rgba(52,211,153,0.7)',
                                display: 'block',
                            }} />
                            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.70)', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                                {t('header.subtitle')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                    {/* Language switcher button */}
                    <button
                        onClick={toggleLang}
                        title={`Switch to ${otherLang.name}`}
                        style={{
                            height: '36px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            borderRadius: '10px',
                            padding: '0 10px',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            color: 'rgba(255,255,255,0.90)',
                            transition: 'all 0.18s',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                        }}
                    >
                        <Globe size={13} style={{ opacity: 0.8 }} />
                        <span>{otherLang.label}</span>
                    </button>

                    {/* Reset button */}
                    <button
                        onClick={resetChat}
                        title={t('header.reset')}
                        style={{
                            width: '36px', height: '36px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            color: 'rgba(255,255,255,0.80)',
                            transition: 'background 0.18s',
                            position: 'relative',
                            cursor: 'pointer',
                        }}
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </header>

            {/* ── Messages ────────────────────────────────────── */}
            <div
                className="flex-1 overflow-y-auto"
                style={{
                    padding: '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: 'var(--bg)',
                }}
            >
                {!isInitialized && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '48px', height: '48px',
                                borderRadius: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 12px',
                                background: 'var(--accent-soft)',
                                border: '1px solid rgba(123,45,69,0.12)',
                            }}>
                                <Sparkles size={20} style={{ color: 'var(--accent)' }} />
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                                {t('loading.text')}
                            </p>
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} lang={lang} />
                ))}

                {isLoading && <MessageBubble isTyping />}

                {error && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                            fontSize: '12px', padding: '7px 14px',
                            borderRadius: '100px',
                            background: 'var(--danger-soft)',
                            color: 'var(--danger)',
                            border: '1px solid rgba(239,68,68,0.18)',
                            fontFamily: 'Inter, sans-serif',
                        }}>
                            ⚠️ {error}
                        </span>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ── Bottom: CTA + Input ──────────────────────────── */}
            <div
                className="flex-shrink-0"
                style={{
                    background: 'var(--surface)',
                    borderTop: '1px solid var(--border)',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
                }}
            >
                {/* Karar Verdim butonu */}
                {isInitialized && menuItems.length > 0 && (
                    <div style={{ padding: '14px 16px 8px' }}>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '14px 20px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white',
                                fontWeight: 700, fontSize: '15px',
                                letterSpacing: '0.01em',
                                boxShadow: '0 4px 18px rgba(16,185,129,0.35)',
                                border: 'none', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 6px 22px rgba(16,185,129,0.42)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 18px rgba(16,185,129,0.35)'
                            }}
                        >
                            <span style={{
                                width: '20px', height: '20px',
                                borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.20)',
                                fontSize: '11px', lineHeight: 1,
                            }}>✓</span>
                            {t('cta.confirmOrder')}
                        </button>
                    </div>
                )}

                <InputBar onSend={sendMessage} isLoading={isLoading} disabled={!isInitialized} lang={lang} />
            </div>

            {/* ── Modal ──────────────────────────────────────────── */}
            {showModal && (
                <OrderConfirmModal
                    menuItems={menuItems}
                    settings={settings}
                    onClose={() => setShowModal(false)}
                    lang={lang}
                />
            )}
        </div>
    )
}
