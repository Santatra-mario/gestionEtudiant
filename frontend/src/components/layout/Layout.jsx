import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useState, useEffect } from "react";
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
  Calendar,
  ArrowLeftRight,
  Bell,
  Search,
  Settings,
  Book,
} from "lucide-react";

/* ─── Navigation avec règles de visibilité par rôle ─────────────────────────
 *
 *  Tableau de bord  → tous les rôles
 *  Étudiants        → administrateur + secrétaire (pas enseignant)
 *  Filières         → administrateur + secrétaire
 *  Inscriptions     → administrateur + secrétaire
 *  Saisie notes     → tous les rôles
 *  Consultation notes → tous les rôles
 *  Présence         → tous les rôles
 *  Transferts       → administrateur + secrétaire
 *  Utilisateurs     → administrateur seulement
 *
 * ─────────────────────────────────────────────────────────────────────────── */
const NAV = [
  {
    to: "/",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    exact: true,
    hint: "Vue d'ensemble",
    // pas de "roles" → visible par tous
  },
  {
    to: "/etudiants",
    label: "Étudiants",
    icon: GraduationCap,
    hint: "Gestion des étudiants",
    roles: ["administrateur", "secretaire"],  // ← enseignant exclu
  },
  {
    to: "/filieres",
    label: "Filières",
    icon: GitBranch,
    hint: "Gestion des filières",
    roles: ["administrateur", "secretaire"],
  },
   {
    to: "/matieres",
    label: "Matières",
    icon: Book,
    hint: "Gestion des matières",
    roles: ["administrateur", "secretaire"],  // ← admin seulement
  },
  {
    to: "/inscriptions",
    label: "Inscriptions",
    icon: ClipboardList,
    hint: "Gestion des inscriptions",
    roles: ["administrateur", "secretaire"],  // ← enseignant exclu
  },
  {
    to: "/notes/saisie",
    label: "Saisie des notes",
    icon: PenLine,
    hint: "Saisir les notes",
    exact: true,
    // pas de "roles" → visible par tous (admin, secrétaire, enseignant)
  },
  {
    to: "/notes",
    label: "Consultation Notes",
    icon: BookOpen,
    hint: "Consulter les notes",
    exact: true,
    // visible par tous
  },
  {
    to: "/presence",
    label: "Présence",
    icon: Calendar,
    hint: "Gestion de présence",
    // visible par tous
  },
  {
    to: "/transferts",
    label: "Transferts",
    icon: ArrowLeftRight,
    hint: "Gestion des transferts",
    roles: ["administrateur", "secretaire"],  // ← enseignant exclu
  },
  {
    to: "/utilisateurs",
    label: "Utilisateurs",
    icon: Users,
    hint: "Gestion des comptes",
    roles: ["administrateur"],  // ← admin seulement
  },
];

/* ─── Couleurs par rôle ──────────────────────────────────────────────────── */
const ROLE_CONFIG = {
  administrateur: { color: "#4f8ef7", bg: "rgba(79,142,247,0.12)",  label: "Administrateur", gradient: "linear-gradient(135deg, #4f8ef7, #2d6ee0)" },
  secretaire:     { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   label: "Secrétaire",     gradient: "linear-gradient(135deg, #22c55e, #16a34a)" },
  enseignant:     { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "Enseignant",     gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
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

/* ─── Élément de navigation amélioré ────────────────────────────────────── */
function NavItem({ item, collapsed }) {
  const { to, label, icon: Icon, hint, exact } = item;
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState(0);

  const handleMouseEnter = (e) => {
    setHovered(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos(rect.top + rect.height / 2);
  };

  return (
    <NavLink to={to} end={exact}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "11px 8px" : "10px 12px",
        borderRadius: 10, textDecoration: "none",
        color: isActive ? "var(--accent)" : hovered ? "var(--text)" : "var(--text-muted)",
        background: isActive
          ? "var(--accent-glow)"
          : hovered
          ? "var(--surface2)"
          : "transparent",
        fontSize: 13.5, fontWeight: isActive ? 600 : 500,
        transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
        whiteSpace: "nowrap", overflow: "hidden", position: "relative",
        border: isActive ? "1px solid rgba(var(--accent-rgb), 0.3)" : "1px solid transparent",
        boxShadow: isActive ? "0 2px 10px rgba(var(--accent-rgb), 0.12)" : "none",
        letterSpacing: isActive ? "0.01em" : "normal",
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : undefined}
    >
      {/* Indicateur actif — barre gauche */}
      <NavLink to={to} end={exact} style={{ display: "none" }} />

      <Icon size={16} style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: hovered ? "scale(1.1)" : "scale(1)" }} />
      {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1 }}>{label}</span>}

      {/* Tooltip en mode collapsed */}
      {collapsed && hovered && (
        <div style={{
          position: "fixed", left: 72, top: tooltipPos, transform: "translateY(-50%)",
          zIndex: 9999, background: "var(--surface3)", color: "var(--text)",
          fontSize: 12.5, fontWeight: 500, padding: "7px 13px", borderRadius: 9,
          border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          pointerEvents: "none", whiteSpace: "nowrap", animation: "fadeIn 0.1s ease",
        }}>
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
        borderRadius: 9,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--text-muted)",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 8,
        transition: "all 0.15s",
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

/* ─── Logo moderne avec bouton réduire intégré ───────────────────────────── */
function AppLogo({ collapsed, onToggleCollapse }) {
  return (
    <div style={{
      padding: collapsed ? "16px 8px" : "15px 14px 13px",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      minHeight: 64,
      flexShrink: 0,
      background: "linear-gradient(180deg, var(--surface2) 0%, var(--surface) 100%)",
    }}>
      {/* Partie gauche: Icône + Texte */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flex: 1,
        overflow: "hidden",
      }}>
        {/* Icône avec halo */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, rgba(var(--accent-rgb), 0.25) 0%, rgba(var(--accent-rgb), 0.08) 100%)",
            border: "1px solid rgba(var(--accent-rgb), 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(var(--accent-rgb), 0.2)",
          }}>
            <GraduationCap
              size={20}
              strokeWidth={1.7}
              style={{
                color: "var(--accent)",
                filter: "drop-shadow(0 0 4px rgba(var(--accent-rgb), 0.5))",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Texte — visible seulement en mode étendu */}
        {!collapsed && (
          <div style={{ overflow: "hidden", lineHeight: 1, flex: 1 }}>
            <div style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontFamily: "var(--font-display)",
            }}>
              Gestion d'étudiant
            </div>
            <div style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginTop: 3,
              whiteSpace: "nowrap",
              opacity: 0.8,
            }}>
              Universitaire
            </div>
          </div>
        )}
      </div>

      {/* Bouton Réduire/Agrandir */}
      <button
        onClick={onToggleCollapse}
        title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        aria-label={collapsed ? "Agrandir le menu de navigation" : "Réduire le menu de navigation"}
        style={{
          width: 28, height: 28,
          borderRadius: 7,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "var(--surface3)";
          e.currentTarget.style.color = "var(--text)";
          e.currentTarget.style.borderColor = "var(--accent)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "var(--surface2)";
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}>
        {collapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronLeft size={14} aria-hidden="true" />}
      </button>
    </div>
  );
}

/* ─── Bandeau info rôle (mode étendu) ───────────────────────────────────── */
/* Affiché sous le logo pour rappeler visuellement les droits du rôle connecté */
function RoleBanner({ user, collapsed }) {
  const rc = ROLE_CONFIG[user?.role] || { color: "var(--accent)", bg: "rgba(79,142,247,0.12)", label: user?.role };
  if (collapsed) return null;

  const roleInfo = {
    administrateur: "Accès complet",
    secretaire: "Gestion étudiants & inscriptions",
    enseignant: "Notes & présences uniquement",
  };

  return (
    <div style={{
      margin: "8px 8px 2px",
      padding: "7px 10px",
      borderRadius: 9,
      background: rc.bg,
      border: `1px solid ${rc.color}30`,
      display: "flex",
      alignItems: "center",
      gap: 7,
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: rc.color, flexShrink: 0,
        boxShadow: `0 0 6px ${rc.color}70`,
        animation: "pulse 2s infinite",
      }} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: rc.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {rc.label}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {roleInfo[user?.role] || ""}
        </div>
      </div>
    </div>
  );
}

/* ─── Topbar enrichie ────────────────────────────────────────────────────── */
function Topbar({ location, rc, user }) {
  const currentPage = NAV.find(n => {
    if (n.exact) return n.to === location.pathname;
    return location.pathname.startsWith(n.to) && n.to !== "/";
  }) || NAV.find(n => n.to === "/");

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--topbar-bg)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 28px",
      height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      boxShadow: "0 1px 0 var(--border), 0 4px 16px rgba(0,0,0,0.06)",
    }}>
      {/* Fil d'ariane enrichi */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {currentPage?.icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "var(--accent-glow)",
            border: "1px solid rgba(var(--accent-rgb), 0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <currentPage.icon size={14} style={{ color: "var(--accent)" }} />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Gestion Universitaire</span>
          <span style={{ color: "var(--border)", fontSize: 15, fontWeight: 300 }}>/</span>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>
            {currentPage?.label || "Page"}
          </span>
        </div>
      </div>

      {/* Droite : date + badge rôle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Date */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "var(--text-muted)",
          padding: "5px 10px", borderRadius: 7,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          fontWeight: 500,
        }}>
          <Calendar size={12} style={{ opacity: 0.7 }} />
          <span style={{ textTransform: "capitalize" }}>{dateStr}</span>
        </div>

        {/* Indicateur rôle */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 99,
          background: rc.bg,
          border: `1px solid ${rc.color}35`,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: rc.color, flexShrink: 0,
            boxShadow: `0 0 6px ${rc.color}70`,
          }} />
          <span style={{ fontSize: 12, color: rc.color, fontWeight: 600 }}>{rc.label}</span>
        </div>
      </div>
    </div>
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

  // Filtre les items de nav en fonction du rôle de l'utilisateur connecté
  // Un item sans "roles" est visible par tous les rôles
  const visibleNav = NAV.filter(n => !n.roles || n.roles.includes(user?.role));

  const rc = ROLE_CONFIG[user?.role] || { color: "var(--accent)", bg: "rgba(79,142,247,0.12)", label: user?.role, gradient: "linear-gradient(135deg, var(--accent), var(--accent-dark))" };

  /* Groupes de nav :
   * - mainNav  : tout sauf Utilisateurs
   * - adminNav : uniquement Utilisateurs (admin seulement, déjà filtré ci-dessus)
   */
  const mainNav  = visibleNav.filter(n => n.to !== "/utilisateurs");
  const adminNav = visibleNav.filter(n => n.to === "/utilisateurs");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {showLogout && (
        <LogoutDialog user={user}
          onConfirm={() => { setShowLogout(false); logout(); navigate("/login"); }}
          onCancel={() => setShowLogout(false)} />
      )}

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <aside style={{
        width: collapsed ? 60 : 256,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh",
        boxShadow: "2px 0 16px rgba(0,0,0,0.1)", zIndex: 100,
      }}>

        {/* ── Logo avec bouton réduire ── */}
        <AppLogo collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

        {/* ── Bandeau rôle ── */}
        <RoleBanner user={user} collapsed={collapsed} />

        {/* ── Navigation principale ── */}
        <nav style={{
          flex: 1, padding: "6px 6px 4px",
          display: "flex", flexDirection: "column", gap: 1,
          overflowY: "auto", overflowX: "hidden",
        }}>
          {!collapsed && <NavSeparator label="Principal" collapsed={collapsed} />}
          {mainNav.map(item => <NavItem key={item.to} item={item} collapsed={collapsed} />)}

          {adminNav.length > 0 && (
            <>
              <NavSeparator label="Administration" collapsed={collapsed} />
              {adminNav.map(item => <NavItem key={item.to} item={item} collapsed={collapsed} />)}
            </>
          )}
        </nav>

        {/* ── Zone utilisateur & actions bas ── */}
        <div style={{
          padding: "8px 6px 10px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
          background: "linear-gradient(0deg, var(--surface2) 0%, var(--surface) 100%)",
        }}>

          {/* Carte utilisateur — mode étendu */}
          {!collapsed && (
            <div style={{
              padding: "11px 12px", marginBottom: 6,
              borderRadius: 10,
              background: rc.bg,
              border: `1px solid ${rc.color}35`,
              overflow: "hidden",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${rc.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Avatar initiales */}
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: rc.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff",
                  boxShadow: `0 2px 8px ${rc.color}40`,
                  border: "2px solid rgba(255,255,255,0.2)",
                  letterSpacing: "0.05em",
                }}>
                  {`${user?.prenom?.[0] || ""}${user?.nom?.[0] || ""}`.toUpperCase()}
                </div>
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.prenom} {user?.nom}
                  </div>
                  <div style={{ fontSize: 11, color: rc.color, fontWeight: 600, textTransform: "capitalize", marginTop: 1 }}>
                    {rc.label}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Avatar seul — mode collapsed */}
          {collapsed && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: rc.gradient,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
                boxShadow: `0 2px 8px ${rc.color}40`,
                cursor: "default",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
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
            aria-label="Se déconnecter de l'application"
            style={{
              width: "100%", padding: collapsed ? "8px 0" : "8px 10px",
              borderRadius: 9, background: "transparent", border: "none",
              cursor: "pointer", color: "var(--danger)", fontSize: 13,
              display: "flex", alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 8, transition: "background 0.15s",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.09)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <LogOut size={15} style={{ flexShrink: 0 }} aria-hidden="true" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════════════ CONTENU ══════════════════════ */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Topbar enrichie */}
        <Topbar location={location} rc={rc} user={user} />

        {/* Zone de page */}
        <div style={{
          padding: "32px 36px",
          maxWidth: 1440, margin: "0 auto",
          width: "100%",
          flex: 1,
        }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
