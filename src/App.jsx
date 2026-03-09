import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ChefHat, Sparkles, Star, Clock, Shield } from 'lucide-react'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'

const logoModules = import.meta.glob('./assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['./assets/logo.png'] ?? null

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Kişisel Öneri',
    desc: 'Zevkinize ve tercihlerinize göre yemek önerir.',
  },
  {
    icon: Shield,
    title: 'Alerjen Bilgisi',
    desc: 'İçerik ve alerjen bilgilerini anında sunar.',
  },
  {
    icon: Clock,
    title: 'Hızlı Sipariş',
    desc: 'Sohbet ederek siparişinizi kolayca verin.',
  },
  {
    icon: Star,
    title: '7/24 Aktif',
    desc: 'Her an masanızda hazır, beklemeden yanıt.',
  },
]

function ChatLayout() {
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg)' }}>

      {/* ── Sol Branding Paneli ── sadece md+ ekranda ── */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 52px',
          background: 'linear-gradient(155deg, #7B2D45 0%, #5C1F31 55%, #3E1020 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dekoratif arka plan lekesi */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── Logo / Marka ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
          <div
            style={{
              width: '48px', height: '48px',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          >
            {logoSrc
              ? <img src={logoSrc} alt="MenuMind" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <ChefHat size={22} color="white" />
            }
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '17px', color: 'white', fontFamily: 'Poppins', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              MenuMind
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
              AI Menü Asistanı
            </p>
          </div>
        </div>

        {/* ── Orta — Başlık + Kartlar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', position: 'relative' }}>

          {/* Başlık bloğu */}
          <div>
            {/* Küçük etiket */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '5px 12px', borderRadius: '100px',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.18)',
              marginBottom: '20px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', display: 'block', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.80)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                Yapay Zeka Destekli
              </span>
            </div>

            <h2 style={{
              fontSize: '44px',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.12,
              fontFamily: 'Poppins',
              letterSpacing: '-0.03em',
            }}>
              Yapay Zekâ ile<br />Menü Deneyimi
            </h2>
            <p style={{
              marginTop: '18px',
              fontSize: '15.5px',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.75,
              fontFamily: 'Inter, sans-serif',
              maxWidth: '420px',
            }}>
              Garson, menünüzü tanıtır, alerjenleri açıklar ve
              siparişinizi almanıza yardımcı olur.
            </p>
          </div>

          {/* Feature cards — 2×2 grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            maxWidth: '540px',
          }}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px 18px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}>
                  <Icon size={16} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', color: 'white', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>
                    {title}
                  </p>
                  <p style={{
                    fontSize: '12px', marginTop: '4px', lineHeight: 1.55,
                    color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif',
                  }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alt ── */}
        <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.30)', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
          © 2025 MenuMind · Tüm hakları saklıdır
        </p>
      </div>

      {/* ── Sohbet Alanı ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          flexShrink: 0,
          borderLeft: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.08)',
        }}
      >
        <ChatPage />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatLayout />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}
