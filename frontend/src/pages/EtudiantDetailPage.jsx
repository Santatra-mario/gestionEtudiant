import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  TrendingUp,
  ArrowLeft,
  User,
  Award,
  Hash,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import api from "../services/api";
import { PageHeader, Card, Badge, Btn, Spinner, Alert } from "../components/ui";

/* ─── Palettes ───────────────────────────────────────────────────────────── */
const STATUT_COLOR = {
  actif: "success",
  suspendu: "warning",
  diplome: "accent",
  abandonne: "danger",
};
const MENTION_COLOR = {
  Admis: "success",
  Rattrapage: "warning",
  Ajourné: "danger",
};
const AVATAR_COLORS = [
  ["#4f8ef7", "#2d6ee0"],
  ["#22c55e", "#16a34a"],
  ["#a78bfa", "#7c3aed"],
  ["#f59e0b", "#d97706"],
  ["#ec4899", "#be185d"],
  ["#14b8a6", "#0d9488"],
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const mention_icon = {
  Admis: CheckCircle2,
  Rattrapage: AlertCircle,
  Ajourné: AlertCircle,
};

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("fr", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function moyenneColor(m) {
  if (m === null || m === undefined) return "var(--text-muted)";
  return parseFloat(m) >= 10 ? "var(--success)" : "var(--danger)";
}

/* ─── Composant : Ligne d'information ───────────────────────────────────── */
function InfoRow({ label, value, icon: Icon, last = false }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 0",
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      {Icon && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            flexShrink: 0,
            background: "rgba(79,142,247,0.1)",
            border: "1px solid rgba(79,142,247,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={13} color="var(--accent)" />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text)",
            fontWeight: 500,
            wordBreak: "break-word",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─── Composant : Stat résumé ────────────────────────────────────────────── */
function StatPill({ label, value, color = "var(--text)" }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

/* ─── Composant : Carte d'inscription (historique) ──────────────────────── */
function InscriptionCard({ h, onViewNotes }) {
  const moyenne = h.moyenne != null ? parseFloat(h.moyenne) : null;
  const MIcon = mention_icon[h.mention] || Clock;
  const pct = moyenne != null ? Math.min(100, (moyenne / 20) * 100) : 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 22px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-focus)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* En-tête de la carte */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            {h.filiere_nom}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <Calendar size={12} />
              {h.annee_universitaire}
            </div>
            <span style={{ color: "var(--border)" }}>·</span>
            <Badge color="info">{h.niveau}</Badge>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Badge color={STATUT_COLOR[h.statut] || "muted"} dot>
            {h.statut}
          </Badge>
          {h.mention && (
            <Badge color={MENTION_COLOR[h.mention] || "muted"}>
              {h.mention}
            </Badge>
          )}
        </div>
      </div>

      {/* Bloc moyenne */}
      {moyenne != null ? (
        <div
          style={{
            background: "var(--surface2)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 16px",
            marginBottom: 14,
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Icône tendance */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                flexShrink: 0,
                background:
                  moyenne >= 10 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${moyenne >= 10 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={18} color={moyenneColor(moyenne)} />
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 3,
                }}
              >
                Moyenne générale
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: moyenneColor(moyenne),
                  lineHeight: 1,
                }}
              >
                {moyenne.toFixed(2)}
                <span style={{ fontSize: 13, opacity: 0.6, marginLeft: 4 }}>
                  /&nbsp;20
                </span>
              </div>
            </div>

            {/* Barre de progression */}
            <div style={{ flex: 1, marginLeft: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {Math.round(pct)}%
                </span>
              </div>
              <div
                style={{
                  height: 7,
                  background: "var(--border)",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    width: `${pct}%`,
                    background:
                      moyenne >= 10
                        ? "linear-gradient(90deg,#22c55e,#16a34a)"
                        : "linear-gradient(90deg,#ef4444,#dc2626)",
                    transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 3,
                  fontSize: 10,
                  color: "var(--text-muted)",
                }}
              >
                <span>0</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>
          </div>

          {/* Seuil de passage */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
            }}
          >
            {moyenne >= 10 ? (
              <CheckCircle2 size={13} color="var(--success)" />
            ) : (
              <AlertCircle size={13} color="var(--danger)" />
            )}
            <span
              style={{
                fontSize: 12,
                color: moyenne >= 10 ? "var(--success)" : "var(--danger)",
                fontWeight: 500,
              }}
            >
              {moyenne >= 10
                ? "Seuil de passage atteint (≥ 10/20)"
                : "Seuil de passage non atteint (< 10/20)"}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: 14,
            background: "var(--surface2)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            fontSize: 13,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Clock size={14} /> Aucune moyenne enregistrée pour cette inscription.
        </div>
      )}

      {/* Action */}
      <Btn
        small
        variant="ghost"
        onClick={onViewNotes}
        icon={<BookOpen size={13} />}
      >
        Consulter les notes
      </Btn>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function EtudiantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [etudiant, setEtudiant] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/etudiants/${id}`),
      api.get(`/inscriptions/historique/${id}`),
    ])
      .then(([e, h]) => {
        setEtudiant(e.data.data);
        setHistorique(h.data.data);
      })
      .catch(() => setError("Impossible de charger les données de l'étudiant."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 320,
        }}
      >
        <Spinner text="Chargement du dossier étudiant…" />
      </div>
    );
  if (error) return <Alert type="danger">{error}</Alert>;
  if (!etudiant) return <Alert type="warning">Étudiant introuvable.</Alert>;

  /* Avatar */
  const photoSrc =
    etudiant.photo && !imgError ? `/uploads/${etudiant.photo}` : null;
  const idx = (etudiant.prenom?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [gradFrom, gradTo] = AVATAR_COLORS[idx];
  const initials = `${(etudiant.prenom?.[0] || "").toUpperCase()}${(etudiant.nom?.[0] || "").toUpperCase()}`;

  /* Stats */
  const nbAdmis = historique.filter((h) => h.mention === "Admis").length;
  const nbRattrapage = historique.filter(
    (h) => h.mention === "Rattrapage",
  ).length;
  const nbAjourn = historique.filter((h) => h.mention === "Ajourné").length;
  const moyennes = historique
    .filter((h) => h.moyenne != null)
    .map((h) => parseFloat(h.moyenne));
  const moyGlobale =
    moyennes.length > 0
      ? (moyennes.reduce((a, b) => a + b, 0) / moyennes.length).toFixed(2)
      : null;

  return (
    <div className="page-enter">
      {/* ── En-tête ── */}
      <PageHeader
        title={`${etudiant.prenom} ${etudiant.nom}`}
        subtitle={`Matricule : ${etudiant.matricule}`}
        back={() => navigate(-1)}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* ════════════════════ COLONNE GAUCHE ════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ── Carte profil ── */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {/* Bandeau décoratif */}
            <div
              style={{
                height: 72,
                background: `linear-gradient(135deg, ${gradFrom}44, ${gradTo}22)`,
                borderBottom: "1px solid var(--border)",
                position: "relative",
              }}
            >
              {/* Motif points */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.15,
                  backgroundImage:
                    "radial-gradient(circle, #fff 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />
            </div>

            <div style={{ padding: "0 20px 20px", position: "relative" }}>
              {/* Photo / Avatar (chevauchant le bandeau) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: -44,
                  marginBottom: 16,
                }}
              >
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={`${etudiant.prenom} ${etudiant.nom}`}
                    onError={() => setImgError(true)}
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid var(--surface)",
                      boxShadow: `0 0 0 3px ${gradFrom}66`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      fontWeight: 700,
                      color: "#fff",
                      border: "4px solid var(--surface)",
                      boxShadow: `0 0 0 3px ${gradFrom}66`,
                    }}
                  >
                    {initials}
                  </div>
                )}

                {/* Nom & Matricule */}
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 17,
                      color: "var(--text)",
                      lineHeight: 1.3,
                    }}
                  >
                    {etudiant.prenom} {etudiant.nom}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "var(--accent-light)",
                      marginTop: 4,
                      background: "rgba(79,142,247,0.1)",
                      borderRadius: 6,
                      padding: "2px 8px",
                      display: "inline-block",
                    }}
                  >
                    {etudiant.matricule}
                  </div>
                </div>

                {etudiant.statut && (
                  <div style={{ marginTop: 10 }}>
                    <Badge color={STATUT_COLOR[etudiant.statut] || "muted"} dot>
                      {etudiant.statut}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Informations personnelles */}
              <div>
                <InfoRow
                  label="Genre"
                  value={etudiant.sexe === "M" ? "♂ Masculin" : "♀ Féminin"}
                  icon={User}
                />
                <InfoRow
                  label="Date de naissance"
                  value={fmtDate(etudiant.date_naissance)}
                  icon={Calendar}
                />
                <InfoRow
                  label="Adresse e-mail"
                  value={etudiant.email}
                  icon={Mail}
                />
                <InfoRow
                  label="Téléphone"
                  value={etudiant.telephone}
                  icon={Phone}
                />
                <InfoRow
                  label="Adresse"
                  value={etudiant.adresse}
                  icon={MapPin}
                  last
                />
              </div>
            </div>
          </div>

          {/* ── Bouton retour ── */}
          <Btn
            variant="ghost"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={15} />}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Retour à la liste
          </Btn>
        </div>

        {/* ════════════════════ COLONNE DROITE ════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ── Titre section historique ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 14,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#4f8ef7,#2d6ee0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={17} color="#fff" />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  color: "var(--text)",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Historique académique
              </h2>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {historique.length} inscription
                {historique.length > 1 ? "s" : ""} enregistrée
                {historique.length > 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Badge color={historique.length > 0 ? "accent" : "muted"}>
                {historique.length}
              </Badge>
            </div>
          </div>

          {/* ── Liste des inscriptions ── */}
          {historique.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "40px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  margin: "0 auto 16px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={24} color="var(--text-muted)" />
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 6,
                }}
              >
                Aucune inscription
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                Cet étudiant n'a encore aucune inscription enregistrée dans le
                système.
              </div>
            </div>
          ) : (
            historique.map((h) => (
              <InscriptionCard
                key={h.id}
                h={h}
                onViewNotes={() => navigate(`/notes?inscription=${h.id}`)}
              />
            ))
          )}

          {/* ── Résumé académique ── */}
          {historique.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "18px 20px",
                boxShadow: "var(--shadow-sm)",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "linear-gradient(135deg,#4f8ef7,#2d6ee0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart3 size={14} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Résumé académique
                </span>
              </div>

              <StatPill label="Total inscriptions" value={historique.length} />
              <StatPill label="Admis" value={nbAdmis} color="var(--success)" />
              <StatPill
                label="Rattrapages"
                value={nbRattrapage}
                color="var(--warning)"
              />
              <StatPill
                label="Ajournés"
                value={nbAjourn}
                color="var(--danger)"
              />

              {moyGlobale !== null && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "12px 14px",
                    background: `${moyenneColor(parseFloat(moyGlobale))}11`,
                    border: `1px solid ${moyenneColor(parseFloat(moyGlobale))}33`,
                    borderRadius: "var(--radius-sm)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 4,
                    }}
                  >
                    Moyenne globale
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      color: moyenneColor(parseFloat(moyGlobale)),
                    }}
                  >
                    {moyGlobale}
                    <span style={{ fontSize: 14, opacity: 0.6, marginLeft: 4 }}>
                      /20
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
