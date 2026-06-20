// frontend/src/pages/MonProfilPage.jsx
// ─── Interface Étudiant (manokana) ────────────────────────────────────────────
// Vue en lecture seule : informations personnelles + statut présence par matière
// Accessible uniquement au rôle "etudiant"

import { useEffect, useState, useCallback } from "react";
import {
  User, Phone, Mail, MapPin, Calendar, Hash, BookOpen,
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  RefreshCw, GraduationCap, AlertCircle, Shield, Sun, Moon,
  LogOut, Award, TrendingUp, ClipboardList, TriangleAlert, Info,
} from "lucide-react";
import api, { getPhotoUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// ─── Palette avatar ───────────────────────────────────────────────────────────
const PALETTE = [
  ["#6366f1", "#4f46e5"], ["#22c55e", "#16a34a"], ["#f59e0b", "#d97706"],
  ["#ec4899", "#be185d"], ["#14b8a6", "#0d9488"], ["#8b5cf6", "#7c3aed"],
  ["#0ea5e9", "#0284c7"],
];
function getColors(seed) {
  const code = typeof seed === "string" && seed.length > 0 ? seed.charCodeAt(0) : 0;
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
        alt={`Photo de profil de ${prenom} ${nom}`}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--border)", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`Initiales de ${prenom} ${nom}`}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: size * 0.33,
        fontFamily: "var(--font-display)", flexShrink: 0, border: "3px solid var(--border)",
      }}
    >
      {initials || <User size={size * 0.4} />}
    </div>
  );
}

// ─── Badge statut présence ────────────────────────────────────────────────────
function PresenceBadge({ statut }) {
  const map = {
    present: { label: "Présent", color: "#16a34a", bg: "#dcfce7", icon: <CheckCircle2 size={13} /> },
    absent:  { label: "Absent",  color: "#dc2626", bg: "#fee2e2", icon: <XCircle size={13} /> },
    retard:  { label: "Retard",  color: "#d97706", bg: "#fef9c3", icon: <Clock size={13} /> },
    excuse:  { label: "Excusé",  color: "#0284c7", bg: "#e0f2fe", icon: <Shield size={13} /> },
  };
  const cfg = map[statut?.toLowerCase()] || { label: statut || "—", color: "var(--text-muted)", bg: "var(--bg-card)", icon: null };
  return (
    <span role="status" aria-label={`Statut : ${cfg.label}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600 }}
    >
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Ligne info ───────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }} aria-hidden="true">{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontSize: 14, color: "var(--text)", marginTop: 2, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Section matière avec ses présences ──────────────────────────────────────
function MatiereSection({ matiere, presences }) {
  const [open, setOpen] = useState(true);
  const absences = presences.filter((p) => p.statut?.toLowerCase() === "absent").length;
  const total = presences.length;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 12 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`matiere-${matiere}`}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-card)", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={16} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{matiere}</span>
          {absences > 0 && (
            <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 99 }}>
              {absences} absence{absences > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{total} séance{total > 1 ? "s" : ""}</span>
          {open ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
        </div>
      </button>
      {open && (
        <div id={`matiere-${matiere}`} style={{ borderTop: "1px solid var(--border)" }}>
          {presences.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Aucune séance enregistrée</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    <th style={thStyle} scope="col">Date</th>
                    <th style={thStyle} scope="col">Heure</th>
                    <th style={thStyle} scope="col">Statut</th>
                    <th style={thStyle} scope="col">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {presences.map((p, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--bg)" }}>
                      <td style={tdStyle}>{formatDate(p.date_seance || p.date)}</td>
                      <td style={tdStyle}>{p.heure_debut ? `${p.heure_debut}${p.heure_fin ? ` – ${p.heure_fin}` : ""}` : "—"}</td>
                      <td style={tdStyle}><PresenceBadge statut={p.statut} /></td>
                      <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{p.observation || p.motif || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: "8px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "10px 16px", color: "var(--text)" };

function formatDate(str) {
  if (!str) return "—";
  try { return new Intl.DateTimeFormat("fr-MG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(str)); }
  catch { return str; }
}
function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob), now = new Date();
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div role="status" aria-label="Chargement en cours…" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
}

// ─── Données mockées notes ────────────────────────────────────────────────────
const NOTES_MOCK = [
  { matiere: "Algorithmique",  note: 15, credits: 6 },
  { matiere: "Base de données", note: 8, credits: 4 },
  { matiere: "Réseaux",        note: 12, credits: 5 },
  { matiere: "Anglais",        note: 9,  credits: 2 },
];

function calcDecision(notes) {
  if (!notes || notes.length === 0) return null;
  const totalCredits = notes.reduce((s, n) => s + n.credits, 0);
  const totalPoints  = notes.reduce((s, n) => s + n.note * n.credits, 0);
  const moyenne = totalCredits > 0 ? totalPoints / totalCredits : 0;
  if (notes.some((n) => n.note < 7) || moyenne < 8) return "Ajourné";
  if (notes.some((n) => n.note < 10) || moyenne < 10) return "Rattrapage";
  return "Admis";
}

// ─── Badge décision pédagogique ──────────────────────────────────────────────
function DecisionBadge({ decision }) {
  const map = {
    Admis:     { bg: "#10B981", text: "#fff", msg: "Félicitations, vous êtes admis(e) !",             icon: <CheckCircle2 size={14} /> },
    Rattrapage:{ bg: "#F59E0B", text: "#fff", msg: "Vous êtes convoqué(e) aux rattrapages en août.",   icon: <Clock size={14} /> },
    Ajourné:   { bg: "#EF4444", text: "#fff", msg: "Vous êtes ajourné(e) pour cette session.",          icon: <XCircle size={14} /> },
  };
  const cfg = map[decision];
  if (!cfg) return null;
  return (
    <div role="status" aria-live="polite">
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 99, background: cfg.bg, color: cfg.text, fontWeight: 700, fontSize: 14, boxShadow: `0 2px 10px ${cfg.bg}55`, marginBottom: 6 }}>
        {cfg.icon}{decision}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>{cfg.msg}</p>
    </div>
  );
}

const noteThStyle = { padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" };
const noteTdStyle = { padding: "12px 16px", color: "var(--text)" };

// ─── Relevé de notes ─────────────────────────────────────────────────────────
// NB: plus de hauteur fixe ici — c'est la grille parente (profil-grid-2-wide)
// qui étire cette carte pour qu'elle ait la même hauteur que sa voisine.
function RelevéNotes({ notes }) {
  if (!notes || notes.length === 0) return null;
  const totalCredits = notes.reduce((s, n) => s + n.credits, 0);
  const totalPoints  = notes.reduce((s, n) => s + n.note * n.credits, 0);
  const moyenne  = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "—";
  const decision = calcDecision(notes);
  const noteColor = (note) => note < 10 ? "#DC2626" : note >= 14 ? "#16A34A" : "var(--text)";

  return (
    <div className="profil-card-fill" style={{ background: "var(--surface)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
      {/* En-tête + décision */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
        <SectionTitle icon={<Award size={16} />} title="Relevé de notes" inline />
        <DecisionBadge decision={decision} />
      </div>
      {/* Badge démo */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "#FEF9C3", color: "#854D0E", fontSize: 11, fontWeight: 600, border: "1px solid #FDE68A", marginBottom: 16, alignSelf: "flex-start" }}>
        <Info size={12} aria-hidden="true" />
        Données de démonstration — notes réelles disponibles prochainement
      </div>
      {/* Tableau */}
      <div style={{ borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem", lineHeight: 1.6, minWidth: 420 }} aria-label="Tableau des notes par matière">
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              <th style={noteThStyle} scope="col">Matière</th>
              <th style={{ ...noteThStyle, textAlign: "center" }} scope="col">Note / 20</th>
              <th style={{ ...noteThStyle, textAlign: "center" }} scope="col">Crédits</th>
              <th style={{ ...noteThStyle, textAlign: "center" }} scope="col">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((n, i) => (
              <tr key={i}
                style={{ borderTop: "1px solid var(--border)", transition: "background 0.2s ease", cursor: "default" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onFocus={(e)      => (e.currentTarget.style.background = "rgba(99,102,241,0.06)")}
                onBlur={(e)       => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ ...noteTdStyle, fontWeight: 500 }}>{n.matiere}</td>
                <td style={{ ...noteTdStyle, textAlign: "center", fontWeight: 700, color: noteColor(n.note), fontSize: "1rem" }}>{n.note}</td>
                <td style={{ ...noteTdStyle, textAlign: "center", color: "var(--text-muted)" }}>{n.credits}</td>
                <td style={{ ...noteTdStyle, textAlign: "center" }}>
                  {n.note >= 10 ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 10px", borderRadius: 99, background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
                      <CheckCircle2 size={11} /> Validé
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 10px", borderRadius: 99, background: "#fee2e2", color: "#dc2626", fontSize: 12, fontWeight: 600 }}>
                      <XCircle size={11} /> Non validé
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid var(--border)", background: "rgba(99,102,241,0.06)" }}>
              <td style={{ ...noteTdStyle, fontWeight: 700, color: "var(--text)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <TrendingUp size={14} style={{ color: "var(--accent)" }} aria-hidden="true" /> Moyenne générale
                </span>
              </td>
              <td style={{ ...noteTdStyle, textAlign: "center", fontWeight: 800, fontSize: "1.1rem", color: parseFloat(moyenne) >= 10 ? "#16A34A" : "#DC2626" }}>{moyenne} / 20</td>
              <td style={{ ...noteTdStyle, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>{totalCredits} crédits</td>
              <td style={noteTdStyle} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Helpers badge statut ─────────────────────────────────────────────────────
function statutCfg(statut) {
  const s = statut?.toLowerCase() || "";
  if (s === "absent")                         return { label: "Absent",         bg: "#FEE2E2", color: "#DC2626", icon: <XCircle size={11} /> };
  if (s === "retard")                         return { label: "En retard",      bg: "#FEF3C7", color: "#F59E0B", icon: <Clock size={11} /> };
  if (s === "excuse" || s === "excusé")       return { label: "Excusé",         bg: "#DCFCE7", color: "#16A34A", icon: <CheckCircle2 size={11} /> };
  return                                             { label: "Non renseigné",  bg: "var(--bg)", color: "var(--text-muted)", icon: null };
}
function fmtDate(str) {
  if (!str) return "—";
  try { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(str)); }
  catch { return str; }
}
function fmtHeure(str) { return str ? str.slice(0, 5) : "—"; }

// ─── Suivi d'assiduité ───────────────────────────────────────────────────────
function SuiviAssiduite({ presences = [] }) {
  const lignes = presences
    .filter((p) => { const s = p.statut?.toLowerCase() || ""; return s === "absent" || s === "retard" || s === "excuse" || s === "excusé"; })
    .sort((a, b) => new Date(b.date_seance || b.date || 0) - new Date(a.date_seance || a.date || 0));

  const nbAbsent = lignes.filter((p) => p.statut?.toLowerCase() === "absent").length;
  const nbRetard = lignes.filter((p) => p.statut?.toLowerCase() === "retard").length;
  const nbExcuse = lignes.filter((p) => ["excuse","excusé"].includes(p.statut?.toLowerCase())).length;
  const hasProbleme = nbAbsent > 0 || nbRetard > 0;

  return (
    <div className="profil-card-fill" style={{ background: hasProbleme ? "rgba(254,242,242,0.55)" : "rgba(240,253,244,0.55)", backdropFilter: "blur(20px)", borderRadius: 16, border: `1px solid ${hasProbleme ? "#FECACA" : "#BBF7D0"}`, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <SectionTitle icon={<ClipboardList size={16} />} title="Suivi d'assiduité" />

      {lignes.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <CheckCircle2 size={28} style={{ color: "#16A34A", flexShrink: 0 }} aria-hidden="true" />
          <div>
            <div style={{ fontWeight: 700, color: "#15803D", fontSize: 14 }}>Aucune absence, retard ou excusé à signaler.</div>
            <div style={{ fontSize: 12, color: "#166534", marginTop: 3 }}>Félicitations pour votre assiduité — continuez ainsi !</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { label: "Absent",    count: nbAbsent, bg: "#FEE2E2", color: "#DC2626", icon: <XCircle size={13} /> },
              { label: "En retard", count: nbRetard, bg: "#FEF3C7", color: "#F59E0B", icon: <Clock size={13} /> },
              { label: "Excusé",    count: nbExcuse, bg: "#DCFCE7", color: "#16A34A", icon: <CheckCircle2 size={13} /> },
            ].map(({ label, count, bg, color, icon }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: bg, color, fontWeight: 600, fontSize: 13 }}>
                {icon}{count} {label}{count > 1 ? "s" : ""}
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", lineHeight: 1.5, minWidth: 480 }} aria-label="Tableau du suivi d'assiduité">
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["Matière","Date","Heure","Statut","Observation"].map((col) => (
                    <th key={col} scope="col" style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-muted)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((p, i) => {
                  const cfg     = statutCfg(p.statut);
                  const matiere = p.matiere_nom || p.matiere?.nom || p.matiere || "—";
                  const obs     = p.observation || p.motif || "";
                  return (
                    <tr key={p.id || i}
                      style={{ borderTop: "1px solid var(--border)", transition: "background 0.18s ease", cursor: "default" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onFocus={(e)      => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")}
                      onBlur={(e)       => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><BookOpen size={13} style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden="true" />{matiere}</div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text)", whiteSpace: "nowrap", fontSize: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={12} style={{ color: "var(--text-muted)" }} aria-hidden="true" />{fmtDate(p.date_seance || p.date || "")}</div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text)", whiteSpace: "nowrap", fontSize: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} style={{ color: "var(--text-muted)" }} aria-hidden="true" />{fmtHeure(p.heure_debut || p.heure || "")}</div>
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: obs ? "var(--text)" : "var(--text-muted)", fontSize: 13, fontStyle: obs ? "normal" : "italic", maxWidth: 260 }}>
                        {obs || "Aucune remarque"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {nbAbsent >= 10 && (
            <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "#FFF7ED", border: "1px solid #FED7AA" }}>
              <TriangleAlert size={18} style={{ color: "#C2410C", flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9A3412" }}>Seuil d'absence atteint</div>
                <div style={{ fontSize: 12, color: "#C2410C", marginTop: 3, lineHeight: 1.5 }}>
                  Vous cumulez {nbAbsent} absences non justifiées. Des sanctions pédagogiques peuvent être appliquées. Rapprochez-vous de votre responsable pédagogique.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function EtudiantPage() {
  const { user } = useAuth();
  const [etudiant, setEtudiant]             = useState(null);
  const [presences, setPresences]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [error, setError]                   = useState(null);
  const [refreshing, setRefreshing]         = useState(false);
  const { theme, toggleTheme }              = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const studentToken = localStorage.getItem("student_token");
      if (!studentToken) { window.location.href = "/etudiant/login"; return; }
      const res = await api.get("/student/profile");
      setEtudiant(res.data?.data || res.data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("student_token"); localStorage.removeItem("student_user");
        window.location.href = "/etudiant/login"; return;
      }
      setError("Impossible de charger votre profil. Veuillez vérifier votre connexion et réessayer.");
    } finally { setLoading(false); }
  }, []);

  const fetchPresences = useCallback(async () => {
    setPresenceLoading(true);
    try {
      const studentToken = localStorage.getItem("student_token");
      if (!studentToken) return;
      const res  = await api.get("/student/presences");
      const list = res.data?.presences || res.data?.data || res.data || [];
      setPresences(Array.isArray(list) ? list : []);
    } catch { setPresences([]); }
    finally { setPresenceLoading(false); }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchPresences()]);
    setRefreshing(false);
  }, [fetchProfile, fetchPresences]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (etudiant?.id) fetchPresences(etudiant.id); }, [etudiant, fetchPresences]);

  const totalAbsences  = presences.filter((p) => p.statut?.toLowerCase() === "absent").length;
  const totalPresences = presences.filter((p) => p.statut?.toLowerCase() === "present").length;
  const alerteAbsences = totalAbsences >= 10;
  const age            = calcAge(etudiant?.date_naissance);

  const presencesByMatiere = presences.reduce((acc, p) => {
    const key = p.matiere_nom || p.matiere?.nom || p.matiere || "Sans matière";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const handleLogout      = () => { localStorage.removeItem("student_token"); localStorage.removeItem("student_user"); window.location.href = "/etudiant/login"; };
  const handleLogoutClick = () => setShowLogoutConfirm(true);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, var(--bg) 0%, var(--surface) 50%, var(--bg) 100%)" }}>

      {/* ── Modal déconnexion ── */}
      {showLogoutConfirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-desc"
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 25px 50px rgba(0,0,0,0.3)", animation: "fadeUp 0.25s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <LogOut size={22} color="#ef4444" aria-hidden="true" />
              </div>
              <h3 id="logout-title" style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Confirmer la déconnexion</h3>
              <p id="logout-desc" style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Voulez-vous vraiment vous déconnecter de votre session ?</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button autoFocus onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                Annuler
              </button>
              <button onClick={handleLogout}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Topbar ── */}
      <header className="profil-topbar" style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--surface)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>Portail Étudiant</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleTheme} aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", transition: "all 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}>
            {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <button onClick={handleLogoutClick} aria-label="Se déconnecter"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(239,68,68,0.12)", cursor: "pointer", color: "var(--danger)", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "var(--danger)"; }}>
            <LogOut size={14} aria-hidden="true" />
            <span className="profil-logout-label">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* ── Contenu principal ── */}
      <main className="profil-main" style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* En-tête page */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", margin: 0 }}>Mon Profil</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Informations personnelles — Portail Étudiant</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            aria-label="Actualiser le profil et les présences" aria-busy={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: refreshing ? "var(--accent)" : "var(--text-muted)", cursor: refreshing ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "var(--font-body)", transition: "all 0.2s", opacity: refreshing ? 0.7 : 1 }}
            onMouseEnter={(e) => { if (!refreshing) { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "var(--text)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = refreshing ? "var(--accent)" : "var(--text-muted)"; }}>
            <RefreshCw size={14} aria-hidden="true" style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
        </div>

        {/* Alerte absences excessives — visible dès le haut */}
        {alerteAbsences && !loading && (
          <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20, padding: "14px 16px", borderRadius: 12, background: "#FFF7ED", border: "2px solid #FED7AA" }}>
            <TriangleAlert size={20} style={{ color: "#C2410C", flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#9A3412" }}>Attention — Seuil d'absences atteint</div>
              <div style={{ fontSize: 13, color: "#C2410C", marginTop: 3, lineHeight: 1.5 }}>
                Vous cumulez {totalAbsences} absences non justifiées. Veuillez vous rapprocher de votre responsable pédagogique dès que possible.
              </div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div role="alert" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.12)", color: "var(--danger)", marginBottom: 20, fontSize: 14, border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertCircle size={18} aria-hidden="true" />{error}
          </div>
        )}

        {loading ? <Spinner /> : etudiant && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ╔══════════════════════════════════════════════════════════╗
                ║  LIGNE 1 — Carte profil (passe en colonne sur mobile)   ║
                ╚══════════════════════════════════════════════════════════╝ */}
            <section aria-labelledby="section-profil">
              <div className="profil-header-card" style={{ background: "var(--surface)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                <Avatar photo={etudiant.photo} prenom={etudiant.prenom} nom={etudiant.nom} size={96} />
                <div className="profil-header-info">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 id="section-profil" style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text)", fontFamily: "var(--font-display)" }}>
                      {etudiant.prenom} {etudiant.nom}
                    </h2>
                    <span style={{ padding: "2px 10px", borderRadius: 99, background: etudiant.statut === "actif" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: etudiant.statut === "actif" ? "var(--success)" : "#f87171", fontSize: 12, fontWeight: 600, border: `1px solid ${etudiant.statut === "actif" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                      {etudiant.statut === "actif" ? "Actif" : etudiant.statut || "—"}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6, display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {etudiant.matricule && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Hash size={13} aria-hidden="true" />{etudiant.matricule}</span>}
                    {etudiant.filiere_nom && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><GraduationCap size={13} aria-hidden="true" />{etudiant.filiere_nom}{etudiant.niveau && ` — Niveau ${etudiant.niveau}`}</span>}
                    {age && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={13} aria-hidden="true" />{age} ans</span>}
                  </div>
                </div>
                {/* Stats */}
                <div className="profil-header-stats">
                  <StatBox label="Présences" value={totalPresences} color="var(--success)" bg="rgba(34,197,94,0.12)" />
                  <StatBox label="Absences"  value={totalAbsences}  color="#f87171"        bg="rgba(239,68,68,0.12)" />
                </div>
              </div>
            </section>

            {/* ╔══════════════════════════════════════════════════════════╗
                ║  LIGNE 2 — Infos perso  |  Infos académiques            ║
                ║  Grille dynamique : auto-fit/minmax (1 ou 2 colonnes    ║
                ║  selon la largeur réellement disponible)                ║
                ╚══════════════════════════════════════════════════════════╝ */}
            <div className="profil-grid-2">

              <section aria-labelledby="section-perso">
                <div style={{ background: "var(--surface)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", height: "100%" }}>
                  <SectionTitle icon={<User size={16} />} title="Information personnelle" id="section-perso" />
                  <InfoRow icon={<Hash size={15} />}     label="Matricule"         value={etudiant.matricule} />
                  <InfoRow icon={<User size={15} />}     label="Genre"             value={etudiant.sexe === "M" ? "Masculin" : etudiant.sexe === "F" ? "Féminin" : etudiant.sexe} />
                  <InfoRow icon={<Phone size={15} />}    label="Téléphone"         value={etudiant.telephone} />
                  <InfoRow icon={<Mail size={15} />}     label="Adresse e-mail"    value={etudiant.email} />
                  <InfoRow icon={<MapPin size={15} />}   label="Adresse"           value={etudiant.adresse} />
                  <InfoRow icon={<Calendar size={15} />} label="Date de naissance" value={etudiant.date_naissance ? `${formatDate(etudiant.date_naissance)}${age ? ` (${age} ans)` : ""}` : null} />
                </div>
              </section>

              <section aria-labelledby="section-acad">
                <div style={{ background: "var(--surface)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", height: "100%" }}>
                  <SectionTitle icon={<GraduationCap size={16} />} title="Informations académiques" id="section-acad" />
                  <InfoRow icon={<BookOpen size={15} />}  label="Filière"              value={etudiant.filiere_nom || "Non assignée"} />
                  <InfoRow icon={<Hash size={15} />}      label="Niveau"               value={etudiant.niveau || "—"} />
                  <InfoRow icon={<Calendar size={15} />}  label="Année universitaire"  value={etudiant.annee_universitaire || "—"} />
                  <InfoRow icon={<Shield size={15} />}    label="Statut"               value={etudiant.statut === "actif" ? "Actif" : etudiant.statut || "—"} />
                </div>
              </section>

            </div>

            {/* ╔══════════════════════════════════════════════════════════╗
                ║  LIGNE 3 — Relevé de notes | Suivi d'assiduité          ║
                ║  Grille dynamique, cartes étirées à hauteur égale       ║
                ║  (plus de alignItems:"start" → grille bien remplie)     ║
                ╚══════════════════════════════════════════════════════════╝ */}
            <div className="profil-grid-2-wide">
              <RelevéNotes notes={NOTES_MOCK} />
              <SuiviAssiduite presences={presences} />
            </div>

            {/* ╔══════════════════════════════════════════════════════════╗
                ║  LIGNE 4 — Suivi des présences par matière (pleine)    ║
                ╚══════════════════════════════════════════════════════════╝ */}
            <section aria-labelledby="section-presences">
              <div style={{ background: "var(--surface)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                <SectionTitle icon={<Clock size={16} />} title="Suivi des présences par matière" id="section-presences" />
                {presenceLoading ? (
                  <Spinner />
                ) : Object.keys(presencesByMatiere).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
                    <Clock size={32} style={{ opacity: 0.3, marginBottom: 8 }} aria-hidden="true" />
                    <p>Aucune donnée de présence disponible.</p>
                  </div>
                ) : (
                  Object.entries(presencesByMatiere).map(([matiere, list]) => (
                    <MatiereSection key={matiere} matiere={matiere} presences={list} />
                  ))
                )}
              </div>
            </section>

          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Grilles dynamiques : s'adaptent automatiquement à la largeur
           disponible, sans seuils figés. Sur grand écran → 2 colonnes ;
           dès que l'espace manque → repli fluide sur 1 colonne. ── */
        .profil-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          align-items: stretch;
        }
        .profil-grid-2-wide {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 20px;
          align-items: stretch; /* cartes de même hauteur → grille bien remplie */
        }
        .profil-card-fill { height: 100%; box-sizing: border-box; }

        /* ── Carte profil (ligne 1) : repli en colonne sur petits écrans ── */
        .profil-header-card {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .profil-header-info { flex: 1 1 220px; min-width: 220px; }
        .profil-header-stats { display: flex; gap: 12px; flex-shrink: 0; flex-wrap: wrap; }

        @media (max-width: 720px) {
          .profil-main { padding: 20px 16px !important; }
        }
        @media (max-width: 560px) {
          .profil-header-card { justify-content: center; text-align: center; }
          .profil-header-stats { width: 100%; justify-content: center; }
        }
        @media (max-width: 480px) {
          .profil-topbar { padding: 0 14px !important; }
        }
        @media (max-width: 420px) {
          .profil-logout-label { display: none; }
        }
      `}</style>
    </div>
  );
}

// ─── Composants utilitaires ───────────────────────────────────────────────────
function StatBox({ label, value, color, bg }) {
  return (
    <div role="status" aria-label={`${label} : ${value}`}
      style={{ textAlign: "center", padding: "12px 20px", borderRadius: "var(--radius-sm)", background: bg, minWidth: 70 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "var(--font-display)" }}>{value}</div>
      <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

function SectionTitle({ icon, title, inline = false, id }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text)", fontWeight: 700, fontSize: 15, marginBottom: inline ? 0 : 16 }}>
      <span style={{ color: "var(--accent)" }} aria-hidden="true">{icon}</span>
      <span id={id}>{title}</span>
    </div>
  );
}

  