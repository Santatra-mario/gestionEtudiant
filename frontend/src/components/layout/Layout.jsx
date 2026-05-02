import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  BookOpen,
  GitBranch,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'

const NAV = [
  { to: '/',             label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/etudiants',   label: 'Étudiants',        icon: GraduationCap },
  { to: '/inscriptions', label: 'Inscriptions',     icon: ClipboardList },
  { to: '/notes',       label: 'Notes',             icon: BookOpen },
  { to: '/filieres',    label: 'Filières',          icon: GitBranch,  roles: ['administrateur'] },
  { to: '/utilisateurs', label: 'Utilisateurs',     icon: Users,      roles: ['administrateur'] },
]

// ── Boîte de dialogue de confirmation déconnexion ─────────────────────────────
function LogoutDialog({ onConfirm, onCancel }) {
  return (
    <>
      {/* Overlay sombre */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Boîte de dialogue */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 28px 24px',
        width: 340,
        maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Icône */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <AlertTriangle size={26} color="var(--danger)" />
        </div>

        {/* Titre */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18, fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 8,
        }}>
          Confirmer la déconnexion
        </div>

        {/* Message */}
        <p style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          margin: '0 0 24px',
        }}>
          Vous allez être déconnecté de votre session. Voulez-vous continuer ?
        </p>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Annuler */}
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 16px',
              borderRadius: 10, border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface2)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            Annuler
          </button>

          {/* Confirmer */}
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 16px',
              borderRadius: 10, border: 'none',
              background: 'var(--danger)',
              color: '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Animations CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -44%) scale(0.95) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) }
        }
      `}</style>
    </>
  )
}

// ── Layout principal ──────────────────────────────────────────────────────────
export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)   // ✅ état dialog

  const handleLogoutClick   = () => setShowLogoutDialog(true)
  const handleLogoutConfirm = () => { setShowLogoutDialog(false); logout(); navigate('/login') }
  const handleLogoutCancel  = () => setShowLogoutDialog(false)

  const visibleNav = NAV.filter(n => !n.roles || n.roles.includes(user?.role))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ✅ Dialog monté conditionnellement */}
      {showLogoutDialog && (
        <LogoutDialog
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '64px' : '220px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-display)'
          }}>U</div>
          {!collapsed && (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)', whiteSpace: 'nowrap' }}>
              UniGest
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleNav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                textDecoration: 'none',
                color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                background: isActive ? 'rgba(79,142,247,0.12)' : 'transparent',
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User + boutons bas */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{ padding: '8px 10px', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role}
              </div>
            </div>
          )}

          {/* ✅ Clic → ouvre dialog (plus de déconnexion directe) */}
          <button
            onClick={handleLogoutClick}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--danger)', fontSize: 13, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && 'Déconnexion'}
          </button>

          {/* Bouton Réduire */}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 12, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
            }}
          >
            {collapsed
              ? <ChevronRight size={16} style={{ flexShrink: 0 }} />
              : <ChevronLeft  size={16} style={{ flexShrink: 0 }} />
            }
            {!collapsed && 'Réduire'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div className="page-enter" style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}