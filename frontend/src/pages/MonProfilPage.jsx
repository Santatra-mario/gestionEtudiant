// frontend/src/pages/EtudiantPage.jsx
// ─── Interface Étudiant (manokana) ────────────────────────────────────────────
// Vue en lecture seule : informations personnelles + statut présence par matière
// Accessible uniquement au rôle "etudiant"

import { useEffect, useState, useCallback } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  GraduationCap,
  AlertCircle,
  Shield,
  Sun,
  Moon,
  LogOut,
  Palette,
} from "lucide-react";
import api, { getPhotoUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// ─── Palette avatar ───────────────────────────────────────────────────────────
const PALETTE = [
  ["#6366f1", "#4f46e5"],
  ["#22c55e", "#16a34a"],
  ["#f59e0b", "#d97706"],
  ["#ec4899", "#be185d"],
  ["#14b8a6", "#0d9488"],
  ["#8b5cf6", "#7c3aed"],
  ["#0ea5e9", "#0284c7"],
];
function getColors(seed) {
  const code =
    typeof seed === "string" && seed.length > 0 ? seed.charCodeAt(0) : 0;
  return PALETTE[Math.abs(code) % PALETTE.length] || PALETTE[0];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ photo, prenom, nom, size = 96 }) {
  const [err, setErr] = useState(false);
  const [from, to] = getColors(prenom);
  const initials = `${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`;
  if (photo && !err) {
    return (
      <img
        src={getPhotoUrl(photo)}
        alt={`${prenom} ${nom}`}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "3px solid var(--border)",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.33,
        fontFamily: "var(--font-display)",
        flexShrink: 0,
        border: "3px solid var(--border)",
      }}
    >
      {initials || <User size={size * 0.4} />}
    </div>
  );
}

// ─── Badge statut présence ────────────────────────────────────────────────────
function PresenceBadge({ statut }) {
  const map = {
    present: {
      label: "Présent",
      color: "#16a34a",
      bg: "#dcfce7",
      icon: <CheckCircle2 size={13} />,
    },
    absent: {
      label: "Absent",
      color: "#dc2626",
      bg: "#fee2e2",
      icon: <XCircle size={13} />,
    },
    retard: {
      label: "Retard",
      color: "#d97706",
      bg: "#fef9c3",
      icon: <Clock size={13} />,
    },
    excuse: {
      label: "Excusé",
      color: "#0284c7",
      bg: "#e0f2fe",
      icon: <Shield size={13} />,
    },
  };
  const cfg = map[statut?.toLowerCase()] || {
    label: statut || "—",
    color: "var(--text-muted)",
    bg: "var(--bg-card)",
    icon: null,
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 99,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Ligne info ───────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }}>
        {icon}
      </span>
      <div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text)",
            marginTop: 2,
            fontWeight: 500,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Section matière avec ses présences ──────────────────────────────────────
function MatiereSection({ matiere, presences }) {
  const [open, setOpen] = useState(true);
  const absences = presences.filter(
    (p) => p.statut?.toLowerCase() === "absent",
  ).length;
  const total = presences.length;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* En-tête matière */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--bg-card)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={16} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>
            {matiere}
          </span>
          {absences > 0 && (
            <span
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 8px",
                borderRadius: 99,
              }}
            >
              {absences} absence{absences > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {total} séance{total > 1 ? "s" : ""}
          </span>
          {open ? (
            <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </button>

      {/* Liste des présences */}
      {open && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {presences.length === 0 ? (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              Aucune séance enregistrée
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Heure</th>
                  <th style={thStyle}>Statut</th>
                  <th style={thStyle}>Observation</th>
                </tr>
              </thead>
              <tbody>
                {presences.map((p, i) => (
                  <tr
                    key={i}
                    style={{
                      borderTop: "1px solid var(--border)",
                      background: i % 2 === 0 ? "transparent" : "var(--bg)",
                    }}
                  >
                    <td style={tdStyle}>
                      {formatDate(p.date_seance || p.date)}
                    </td>
                    <td style={tdStyle}>
                      {p.heure_debut
                        ? `${p.heure_debut}${p.heure_fin ? ` – ${p.heure_fin}` : ""}`
                        : "—"}
                    </td>
                    <td style={tdStyle}>
                      <PresenceBadge statut={p.statut} />
                    </td>
                    <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                      {p.observation || p.motif || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "8px 16px",
  textAlign: "left",
  color: "var(--text-muted)",
  fontWeight: 600,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const tdStyle = { padding: "10px 16px", color: "var(--text)" };

// ─── Formatage date ───────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return "—";
  try {
    return new Intl.DateTimeFormat("fr-MG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(str));
  } catch {
    return str;
  }
}
function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob),
    now = new Date();
  const age =
    now.getFullYear() -
    d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return age;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
      }}
    >
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function EtudiantPage() {
  const { user } = useAuth();

  const [etudiant, setEtudiant] = useState(null);
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charge le profil de l'étudiant connecté
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentToken = localStorage.getItem("student_token");
      const studentUser = JSON.parse(
        localStorage.getItem("student_user") || "{}",
      );

      if (!studentToken) {
        window.location.href = "/etudiant/login";
        return;
      }

      // Utiliser l'API étudiant (le token est envoyé automatiquement)
      const res = await api.get("/student/profile");
      setEtudiant(res.data?.data || res.data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("student_user");
        window.location.href = "/etudiant/login";
        return;
      }
      setError(
        e.response?.data?.message || "Impossible de charger votre profil.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Charge les présences de l'étudiant
  const fetchPresences = useCallback(async () => {
    setPresenceLoading(true);
    try {
      const studentToken = localStorage.getItem("student_token");
      if (!studentToken) return;

      const res = await api.get("/student/presences");
      const list = res.data?.presences || res.data?.data || res.data || [];
      setPresences(Array.isArray(list) ? list : []);
    } catch {
      setPresences([]);
    } finally {
      setPresenceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  useEffect(() => {
    if (etudiant?.id) fetchPresences(etudiant.id);
  }, [etudiant, fetchPresences]);

  // Regroupe les présences par matière
  const presencesByMatiere = presences.reduce((acc, p) => {
    const key = p.matiere_nom || p.matiere?.nom || p.matiere || "Sans matière";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const totalAbsences = presences.filter(
    (p) => p.statut?.toLowerCase() === "absent",
  ).length;
  const totalPresences = presences.filter(
    (p) => p.statut?.toLowerCase() === "present",
  ).length;
  const age = calcAge(etudiant?.date_naissance);

  const { theme, toggleTheme } = useTheme();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("student_token");
    localStorage.removeItem("student_user");
    window.location.href = "/etudiant/login";
  };

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, var(--bg) 0%, var(--surface) 50%, var(--bg) 100%)",
      }}
    >
      {/* Modal de confirmation déconnexion */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              border: "1px solid var(--border)",
              padding: 28,
              maxWidth: 380,
              width: "100%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              animation: "fadeUp 0.25s ease",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <LogOut size={22} color="#ef4444" />
              </div>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Confirmer la déconnexion
              </h3>
              <p
                style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}
              >
                Voulez-vous vraiment vous déconnecter ?
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface2)",
                  color: "var(--text)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky topbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--surface)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #4f8ef7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={16} color="#fff" />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
              fontFamily: "var(--font-display)",
            }}
          >
            Portail Étudiant
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Dark/Light toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {/* Logout */}
          <button
            onClick={handleLogoutClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "rgba(239,68,68,0.12)",
              cursor: "pointer",
              color: "var(--danger)",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.25)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              e.currentTarget.style.color = "var(--danger)";
            }}
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
        {/* En-tête page */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                margin: 0,
              }}
            >
              Mon Profil
            </h1>
            <p
              style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}
            >
              Information personnelle de l'étudiant — Portail Étudiant
            </p>
          </div>
          <button
            onClick={() => {
              fetchProfile();
            }}
            title="Actualiser"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: "var(--radius)",
              background: "rgba(239,68,68,0.12)",
              color: "var(--danger)",
              marginBottom: 20,
              fontSize: 14,
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <Spinner />
        ) : (
          etudiant && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* ── Carte profil ── */}
              <div
                style={{
                  background: "var(--surface)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  padding: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >
                <Avatar
                  photo={etudiant.photo}
                  prenom={etudiant.prenom}
                  nom={etudiant.nom}
                  size={96}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        margin: 0,
                        color: "var(--text)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {etudiant.prenom} {etudiant.nom}
                    </h2>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 99,
                        background:
                          etudiant.statut === "actif"
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color:
                          etudiant.statut === "actif"
                            ? "var(--success)"
                            : "#f87171",
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${etudiant.statut === "actif" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                      }}
                    >
                      {etudiant.statut === "actif"
                        ? "Actif"
                        : etudiant.statut || "—"}
                    </span>
                  </div>
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 13,
                      marginTop: 6,
                      display: "flex",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    {etudiant.matricule && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Hash size={13} /> {etudiant.matricule}
                      </span>
                    )}
                    {etudiant.filiere_nom && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <GraduationCap size={13} /> {etudiant.filiere_nom}
                        {etudiant.niveau && ` — Niveau ${etudiant.niveau}`}
                      </span>
                    )}
                    {age && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar size={13} /> {age} ans
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                  <StatBox
                    label="Présences"
                    value={totalPresences}
                    color="var(--success)"
                    bg="rgba(34,197,94,0.12)"
                    border="rgba(34,197,94,0.25)"
                  />
                  <StatBox
                    label="Absences"
                    value={totalAbsences}
                    color="#f87171"
                    bg="rgba(239,68,68,0.12)"
                    border="rgba(239,68,68,0.25)"
                  />
                </div>
              </div>

              {/* ── Grille infos ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                }}
              >
                {/* Informations personnelles */}
                <div
                  style={{
                    background: "var(--surface)",
                    backdropFilter: "blur(20px)",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    padding: 24,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  }}
                >
                  <SectionTitle
                    icon={<User size={16} />}
                    title="Information personnelle"
                  />
                  <InfoRow
                    icon={<Hash size={15} />}
                    label="Matricule"
                    value={etudiant.matricule}
                  />
                  <InfoRow
                    icon={<User size={15} />}
                    label="Genre"
                    value={
                      etudiant.sexe === "M"
                        ? "Masculin"
                        : etudiant.sexe === "F"
                          ? "Féminin"
                          : etudiant.sexe
                    }
                  />
                  <InfoRow
                    icon={<Phone size={15} />}
                    label="Téléphone"
                    value={etudiant.telephone}
                  />
                  <InfoRow
                    icon={<Mail size={15} />}
                    label="Adresse e-mail"
                    value={etudiant.email}
                  />
                  <InfoRow
                    icon={<MapPin size={15} />}
                    label="Adresse"
                    value={etudiant.adresse}
                  />
                  <InfoRow
                    icon={<Calendar size={15} />}
                    label="Date de naissance"
                    value={
                      etudiant.date_naissance
                        ? `${formatDate(etudiant.date_naissance)}${age ? ` (${age} ans)` : ""}`
                        : null
                    }
                  />
                </div>

                {/* Infos académiques */}
                <div
                  style={{
                    background: "var(--surface)",
                    backdropFilter: "blur(20px)",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    padding: 24,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  }}
                >
                  <SectionTitle
                    icon={<GraduationCap size={16} />}
                    title="Informations académiques"
                  />
                  <InfoRow
                    icon={<BookOpen size={15} />}
                    label="Filière"
                    value={etudiant.filiere_nom || "Non assignée"}
                  />
                  <InfoRow
                    icon={<Hash size={15} />}
                    label="Niveau"
                    value={etudiant.niveau || "—"}
                  />
                  <InfoRow
                    icon={<Calendar size={15} />}
                    label="Année universitaire"
                    value={etudiant.annee_universitaire || "—"}
                  />
                  <InfoRow
                    icon={<Shield size={15} />}
                    label="Statut"
                    value={
                      etudiant.statut === "actif"
                        ? "Actif"
                        : etudiant.statut || "—"
                    }
                  />
                </div>
              </div>

              {/* ── Présences ── */}
              <div
                style={{
                  background: "var(--surface)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  padding: 24,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}
              >
                <SectionTitle
                  icon={<Clock size={16} />}
                  title="Suivi des présences"
                />
                {presenceLoading ? (
                  <Spinner />
                ) : Object.keys(presencesByMatiere).length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 0",
                      color: "var(--text-muted)",
                      fontSize: 14,
                    }}
                  >
                    <Clock
                      size={32}
                      style={{ opacity: 0.3, marginBottom: 8 }}
                    />
                    <p>Aucune donnée de présence.</p>
                  </div>
                ) : (
                  Object.entries(presencesByMatiere).map(([matiere, list]) => (
                    <MatiereSection
                      key={matiere}
                      matiere={matiere}
                      presences={list}
                    />
                  ))
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Petits composants utilitaires ───────────────────────────────────────────
function StatBox({ label, value, color, bg }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px 20px",
        borderRadius: "var(--radius-sm)",
        background: bg,
        minWidth: 70,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color,
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          color,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, inline = false }) {
  const el = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "var(--text)",
        fontWeight: 700,
        fontSize: 15,
        marginBottom: inline ? 0 : 16,
      }}
    >
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      {title}
    </div>
  );
  return el;
}
