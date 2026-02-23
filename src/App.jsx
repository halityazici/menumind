import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ChefHat, Sparkles, Star, Clock, Shield } from 'lucide-react'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'

// Özel logo — src/assets/logo.png varsa kullan
const logoModules = import.meta.glob('./assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['./assets/logo.png'] ?? null

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Kişisel Öneri',
    desc: 'Zevkinize ve tercihlerinize göre en uygun yemekleri önerir.',
  },
  {
    icon: Shield,
    title: 'Alerjen Bilgisi',
    desc: 'Tüm ürünlerin içerik ve alerjen bilgilerini anında sunar.',
  },
  {
    icon: Clock,
    title: 'Hızlı Sipariş',
    desc: 'Sohbet ederek birkaç adımda siparişinizi tamamlayın.',
  },
  {
    icon: Star,
    title: '7/24 Aktif',
    desc: 'Gece gündüz her an masanızda hazır, beklemeden yanıt.',
  },
]

/* ── Masaüstü: Sol panel + sağda chat paneli ── */
function ChatLayout() {
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg)' }}>

      {/* Sol branding paneli — sadece md+ ekranda görünür */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          background: 'linear-gradient(160deg, #732841 0%, #5a1f31 60%, #4a1828 100%)',
        }}
      >
        {/* Logo üst */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.35)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
            }}
          >
            {logoSrc
              ? <img src={logoSrc} alt="MenuMind" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <ChefHat size={24} color="white" />
            }
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '18px', color: 'white', fontFamily: 'Poppins', lineHeight: 1.2 }}>
              MenuMind
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
              AI Menü Asistanı
            </p>
          </div>
        </div>

        {/* Orta içerik — tam dikey ortalı */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h2
              style={{
                fontSize: '42px',
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.15,
                fontFamily: 'Poppins',
                letterSpacing: '-0.02em',
              }}
            >
              Yapay Zekâ ile<br />Menü Deneyimi
            </h2>
            <p
              style={{
                marginTop: '16px',
                fontSize: '16px',
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.75,
                fontFamily: 'Inter, sans-serif',
                maxWidth: '460px',
              }}
            >
              Garson, size restoran menüsünü tanıtır, alerjenleri açıklar ve
              siparişinizi almanıza yardımcı olur.
            </p>
          </div>

          {/* Feature cards — 2×2 grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              maxWidth: '560px',
            }}
          >
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderLeft: '3px solid rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'rgba(255,255,255,0.18)',
                  }}
                >
                  <Icon size={18} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: 'white', fontFamily: 'Inter, sans-serif' }}>
                    {title}
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      marginTop: '4px',
                      lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.62)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alt */}
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', fontFamily: 'Inter, sans-serif' }}>
          © 2025 MenuMind · Tüm hakları saklıdır
        </p>
      </div>

      {/* Sohbet alanı */}
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          flexShrink: 0,
          borderLeft: '1px solid rgba(0,0,0,0.07)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
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
