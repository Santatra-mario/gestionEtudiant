import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";
import { ErrorBoundary } from "../ui";
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
  PenLine,
  Sun,
  Moon,
} from "lucide-react";

/* ─── Navigation ─────────────────────────────────────────────────────────── */
const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, exact: true, hint: "Vue d'ensemble" },
  { to: "/etudiants", label: "Étudiants", icon: GraduationCap, hint: "Gestion des étudiants" },
  { to: "/inscriptions", label: "Inscriptions", icon: ClipboardList, hint: "Gestion des inscriptions" },
  { to: "/notes", label: "Consultation Notes", icon: BookOpen, hint: "Consulter les notes", exact: true },
  { to: "/notes/saisie", label: "Saisie des notes", icon: PenLine, hint: "Saisir les notes", exact: true, roles: ["administrateur", "secretaire", "enseignant"] },
  { to: "/filieres", label: "Filières", icon: GitBranch, hint: "Gestion des filières", roles: ["administrateur", "secretaire"] },
  { to: "/utilisateurs", label: "Utilisateurs", icon: Users, hint: "Gestion des comptes", roles: ["administrateur"] },
];

/* ─── Couleurs par rôle ──────────────────────────────────────────────────── */
const ROLE_CONFIG = {
  administrateur: { color: "#4f8ef7", bg: "rgba(79,142,247,0.12)", label: "Administrateur" },
  secretaire:     { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  label: "Secrétaire"     },
  enseignant:     { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Enseignant"      },
};

/* ─── Séparateur de section nav ─────────────────────────────────────────── */
function NavSeparator({ label, collapsed }) {
  if (collapsed)
    return <div style={{ height: 1, background: "var(--border)", margin: "6px 8px" }} />;
  return (
    <div style={{ padding: "10px 10px 4px", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
      {label}
    </div>
  );
}

/* ─── Modal de déconnexion ───────────────────────────────────────────────── */
function LogoutDialog({ user, onConfirm, onCancel }) {
  const rc = ROLE_CONFIG[user?.role] || { color: "var(--accent)", bg: "rgba(79,142,247,0.12)", label: user?.role };
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(6,10,22,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 1000, animation: "fadeIn 0.18s ease" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1001, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px", width: 360, maxWidth: "calc(100vw - 32px)", boxShadow: "var(--shadow-modal)", animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, marginBottom: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle size={26} color="var(--danger)" />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, color: "var(--text)", marginBottom: 8, lineHeight: 1.3 }}>
          Confirmer la déconnexion
        </div>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: "0 0 20px" }}>
          Vous allez quitter votre session en tant que&nbsp;
          <span style={{ fontWeight: 600, color: rc.color, background: rc.bg, borderRadius: 6, padding: "1px 7px" }}>
            {user?.prenom} {user?.nom}
          </span>. Voulez-vous continuer ?
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-body)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            Annuler
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: "var(--danger)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity 0.15s", fontFamily: "var(--font-body)" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Élément de navigation ─────────────────────────────────────────────── */
function NavItem({ item, collapsed }) {
  const { to, label, icon: Icon, hint, exact } = item;
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink to={to} end={exact}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "10px" : "9px 10px",
        borderRadius: "var(--radius-sm)", textDecoration: "none",
        color: isActive ? "var(--accent-light)" : "var(--text-muted)",
        background: isActive ? "rgba(79,142,247,0.13)" : hovered ? "var(--surface2)" : "transparent",
        fontSize: 14, fontWeight: isActive ? 600 : 400, transition: "all 0.15s",
        whiteSpace: "nowrap", overflow: "hidden", position: "relative",
        borderLeft: collapsed ? "none" : isActive ? "2px solid var(--accent)" : "2px solid transparent",
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : undefined}
    >
      <Icon size={17} style={{ flexShrink: 0 }} />
      {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}

      {/* Tooltip en mode collapsed */}
      {collapsed && hovered && (
        <div style={{ position: "fixed", left: 70, zIndex: 9999, background: "var(--surface3)", color: "var(--text)", fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", pointerEvents: "none", whiteSpace: "nowrap", animation: "fadeIn 0.12s ease" }}>
          {label}
          {hint && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>}
        </div>
      )}
    </NavLink>
  );
}

/* ─── Bouton Toggle Thème ────────────────────────────────────────────────── */
function ThemeToggleButton({ collapsed, theme, onToggle }) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    setSpinning(true);
    onToggle();
    setTimeout(() => setSpinning(false), 400);
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={handleClick}
      title={collapsed ? (isDark ? "Mode clair" : "Mode sombre") : undefined}
      style={{
        width: "100%",
        padding: collapsed ? "8px 0" : "8px 10px",
        borderRadius: "var(--radius-sm)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--text-muted)",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 8,
        transition: "background 0.15s",
        fontFamily: "var(--font-body)",
        marginBottom: 2,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--surface2)";
        e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      <span className={spinning ? "theme-icon-spin" : ""} style={{ display: "flex", flexShrink: 0 }}>
        {isDark
          ? <Sun size={15} style={{ color: "var(--warning)" }} />
          : <Moon size={15} style={{ color: "var(--accent)" }} />}
      </span>
      {!collapsed && (
        <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
      )}
    </button>
  );
}

/* ─── Layout principal ───────────────────────────────────────────────────── */
export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const visibleNav = NAV.filter(n => !n.roles || n.roles.includes(user?.role));
  const rc = ROLE_CONFIG[user?.role] || { color: "var(--accent)", bg: "rgba(79,142,247,0.12)", label: user?.role };

  /* Groupes de nav */
  const mainNav  = visibleNav.filter(n => !["/filieres", "/utilisateurs"].includes(n.to));
  const adminNav = visibleNav.filter(n => ["/filieres", "/utilisateurs"].includes(n.to));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {showLogout && (
        <LogoutDialog user={user}
          onConfirm={() => { setShowLogout(false); logout(); navigate("/login"); }}
          onCancel={() => setShowLogout(false)} />
      )}

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <aside style={{
        width: collapsed ? 64 : 234,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh",
        boxShadow: "2px 0 20px rgba(0,0,0,0.12)", zIndex: 100,
      }}>

        {/* ── Logo / Marque ── */}
        <div style={{ padding: "18px 14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, minHeight: 68, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, var(--accent), var(--accent-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, boxShadow: "0 4px 14px rgba(79,142,247,0.4)", letterSpacing: "-0.02em" }}>
            U
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text)", lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.01em" }}>UniGest</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>Gestion universitaire</div>
            </div>
          )}
        </div>

        {/* ── Navigation principale ── */}
        <nav style={{ flex: 1, padding: "8px 8px 4px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", overflowX: "hidden" }}>
          {/* Groupe principal */}
          {!collapsed && <NavSeparator label="Principal" collapsed={collapsed} />}
          {mainNav.map(item => <NavItem key={item.to} item={item} collapsed={collapsed} />)}

          {/* Groupe administration */}
          {adminNav.length > 0 && (
            <>
              <NavSeparator label="Administration" collapsed={collapsed} />
              {adminNav.map(item => <NavItem key={item.to} item={item} collapsed={collapsed} />)}
            </>
          )}
        </nav>

        {/* ── Zone utilisateur & actions bas ── */}
        <div style={{ padding: "8px 8px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>

          {/* Carte utilisateur — mode étendu */}
          {!collapsed && (
            <div style={{ padding: "10px 12px", marginBottom: 6, borderRadius: "var(--radius-sm)", background: rc.bg, border: `1px solid ${rc.color}33`, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${rc.color}, ${rc.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", boxShadow: `0 2px 8px ${rc.color}40` }}>
                  {`${user?.prenom?.[0] || ""}${user?.nom?.[0] || ""}`.toUpperCase()}
                </div>
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.prenom} {user?.nom}
                  </div>
                  <div style={{ fontSize: 11, color: rc.color, fontWeight: 600, textTransform: "capitalize" }}>
                    {rc.label}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Avatar seul — mode collapsed */}
          {collapsed && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${rc.color}, ${rc.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", boxShadow: `0 2px 8px ${rc.color}40`, cursor: "default" }}
                title={`${user?.prenom} ${user?.nom} — ${rc.label}`}>
                {`${user?.prenom?.[0] || ""}${user?.nom?.[0] || ""}`.toUpperCase()}
              </div>
            </div>
          )}

          {/* ── Toggle Dark / Light ── */}
          <ThemeToggleButton collapsed={collapsed} theme={theme} onToggle={toggleTheme} />

          {/* ── Bouton déconnexion ── */}
          <button onClick={() => setShowLogout(true)}
            title={collapsed ? "Déconnexion" : undefined}
            style={{ width: "100%", padding: collapsed ? "8px 0" : "8px 10px", borderRadius: "var(--radius-sm)", background: "transparent", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8, transition: "background 0.15s", fontFamily: "var(--font-body)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <LogOut size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Déconnexion</span>}
          </button>

          {/* ── Bouton réduire / agrandir ── */}
          <button onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
            style={{ width: "100%", padding: collapsed ? "7px 0" : "7px 10px", borderRadius: "var(--radius-sm)", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8, marginTop: 2, transition: "background 0.15s", fontFamily: "var(--font-body)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            {collapsed ? <ChevronRight size={15} style={{ flexShrink: 0 }} /> : <ChevronLeft size={15} style={{ flexShrink: 0 }} />}
            {!collapsed && "Réduire le menu"}
          </button>
        </div>
      </aside>

      {/* ══════════════════════ CONTENU ══════════════════════ */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>

        {/* Barre de contexte supérieure */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--topbar-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: "0 32px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Fil d'ariane */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
            <span style={{ opacity: 0.5 }}>UniGest</span>
            <span style={{ opacity: 0.3 }}>/</span>
            <span style={{ color: "var(--text)", fontWeight: 500 }}>
              {NAV.find(n => n.to === location.pathname)?.label || "Page"}
            </span>
          </div>

          {/* Indicateur rôle */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 99, background: rc.bg, border: `1px solid ${rc.color}33` }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: rc.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: rc.color, fontWeight: 600 }}>{rc.label}</span>
          </div>
        </div>

        {/* Zone de page */}
        <div style={{ padding: "32px 36px", maxWidth: 1320, margin: "0 auto" }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
