import { useState } from 'react'
import { LogOut, Menu as MenuIcon, ShoppingBag, Settings, FileSpreadsheet, BarChart2 } from 'lucide-react'
import LoginGuard from '../components/admin/LoginGuard'
import MenuManager from '../components/admin/MenuManager'
import OrdersView from '../components/admin/OrdersView'
import SettingsPanel from '../components/admin/SettingsPanel'
import BulkImport from '../components/admin/BulkImport'
import AnalyticsPage from '../components/admin/AnalyticsPage'

// Logo — src/assets/logo.png dosyası varsa gösterilir, yoksa 'MM' yazısı
const logoModules = import.meta.glob('../assets/logo.png', { eager: true, as: 'url' })
const logoSrc = logoModules['../assets/logo.png'] ?? null

const TABS = [
    { id: 'menu', label: 'Menü', icon: MenuIcon },
    { id: 'orders', label: 'Siparişler', icon: ShoppingBag },
    { id: 'analytics', label: 'Raporlar', icon: BarChart2 },
    { id: 'import', label: 'İçe Aktar', icon: FileSpreadsheet },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
]

function AdminDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('menu')

    return (
        <div
            className="flex flex-col"
            style={{ background: 'var(--bg)', minHeight: '100vh' }}
        >
            {/* ── Header ──────────────────────────────────────────── */}
            <header
                style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4DD4 100%)',
                    boxShadow: '0 2px 12px rgba(108,92,231,0.25)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.18)',
                            border: '2px solid rgba(255,255,255,0.35)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                    >
                        {logoSrc
                            ? <img src={logoSrc} alt="MenuMind" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>MM</span>
                        }
                    </div>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: '16px', color: 'white', fontFamily: 'Poppins', lineHeight: 1.2 }}>
                            Admin Paneli
                        </p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                            MenuMind Restoran Yönetimi
                        </p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white',
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'background 0.2s',
                    }}
                >
                    <LogOut size={15} /> Çıkış
                </button>
            </header>

            {/* ── Tab bar ─────────────────────────────────────────── */}
            <nav
                style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0 20px',
                    background: 'var(--surface)',
                    borderBottom: '2px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    overflowX: 'auto',
                }}
            >
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const active = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '16px 18px',
                                fontSize: '14px',
                                fontWeight: active ? 700 : 500,
                                fontFamily: 'Inter, sans-serif',
                                color: active ? 'var(--accent)' : 'var(--text2)',
                                borderBottom: active ? '3px solid var(--accent)' : '3px solid transparent',
                                marginBottom: '-2px',
                                background: 'transparent',
                                border: 'none',
                                borderBottomStyle: 'solid',
                                borderBottomWidth: '3px',
                                borderBottomColor: active ? 'var(--accent)' : 'transparent',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'color 0.15s',
                            }}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    )
                })}
            </nav>

            {/* ── Content ─────────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '28px 28px' }}>
                    {activeTab === 'menu' && <MenuManager />}
                    {activeTab === 'orders' && <OrdersView />}
                    {activeTab === 'analytics' && <AnalyticsPage />}
                    {activeTab === 'import' && <BulkImport />}
                    {activeTab === 'settings' && <SettingsPanel />}
                </div>
            </div>
        </div>
    )
}

export default function AdminPage() {
    return (
        <LoginGuard>
            {(onLogout) => <AdminDashboard onLogout={onLogout} />}
        </LoginGuard>
    )
}
