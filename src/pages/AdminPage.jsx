import { useState } from 'react'
import { LogOut, Menu as MenuIcon, ShoppingBag, Settings, FileSpreadsheet, BarChart2 } from 'lucide-react'
import LoginGuard from '../components/admin/LoginGuard'
import MenuManager from '../components/admin/MenuManager'
import OrdersView from '../components/admin/OrdersView'
import SettingsPanel from '../components/admin/SettingsPanel'
import BulkImport from '../components/admin/BulkImport'
import AnalyticsPage from '../components/admin/AnalyticsPage'

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
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg)', minHeight: '100vh' }}>

            {/* ── Header ───────────────────────────────────────── */}
            <header style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #7B2D45 0%, #5C1F31 100%)',
                boxShadow: '0 3px 16px rgba(92,31,49,0.35)',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Subtle radial overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />

                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                    <div style={{
                        width: '130px', height: '42px',
                        borderRadius: '10px',
                        overflow: 'hidden', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.15)',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        boxShadow: '0 3px 12px rgba(0,0,0,0.20)',
                        padding: '3px 8px',
                    }}>
                        {logoSrc
                            ? <img src={logoSrc} alt="MenuMind" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                            : <span style={{ color: 'white', fontWeight: 800, fontSize: '13px', fontFamily: 'Poppins' }}>MM</span>
                        }
                    </div>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: '16px', color: 'white', fontFamily: 'Poppins', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                            Admin Paneli
                        </p>
                        <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.60)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                            MenuMind Restoran Yönetimi
                        </p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '9px 16px',
                        borderRadius: '10px',
                        fontSize: '13px', fontWeight: 600,
                        color: 'rgba(255,255,255,0.85)',
                        background: 'rgba(255,255,255,0.10)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'background 0.18s',
                        position: 'relative',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                >
                    <LogOut size={13} />
                    Çıkış
                </button>
            </header>

            {/* ── Tab Bar ──────────────────────────────────────── */}
            <nav style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center',
                gap: '2px',
                padding: '0 20px',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                overflowX: 'auto',
            }}>
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const active = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '7px',
                                padding: '15px 16px',
                                fontSize: '13.5px',
                                fontWeight: active ? 700 : 500,
                                fontFamily: 'Inter, sans-serif',
                                color: active ? 'var(--accent)' : 'var(--muted)',
                                borderBottom: `2.5px solid ${active ? 'var(--accent)' : 'transparent'}`,
                                marginBottom: '-1px',
                                background: 'transparent',
                                border: 'none',
                                borderBottomStyle: 'solid',
                                borderBottomWidth: '2.5px',
                                borderBottomColor: active ? 'var(--accent)' : 'transparent',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'color 0.15s',
                            }}
                        >
                            <Icon size={15} />
                            {tab.label}
                        </button>
                    )
                })}
            </nav>

            {/* ── Content ──────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
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
