import { useEffect, useState, useRef } from "react";
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
  CreditCard,
  Printer,
  X,
} from "lucide-react";
import api, { getPhotoUrl } from "../services/api";
import { useNotification, NotificationDisplay } from "../hooks/useNotification";
import { PageHeader, Card, Badge, Btn, Spinner, Alert } from "../components/ui";

/* ─── Palettes ───────────────────────────────────────────────────────────── */
const STATUT_COLOR = {
  actif: "success",
  suspendu: "warning",
  diplome: "accent",
  abandonne: "danger",
  transfere: "info",
};
const STATUT_LABELS = {
  actif: "Actif",
  suspendu: "Suspendu",
  diplome: "Diplômé",
  abandonne: "Abandonné",
  transfere: "Transféré",
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

/* ─── QR Code SVG simple (data matrix basé sur le matricule) ────────────── */
function QRCodeSVG({ value, size = 80 }) {
  // Génère un QR code simple via l'API publique gratuite de QR Server
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&format=svg&bgcolor=ffffff&color=1a1a2e&margin=2`;
  return (
    <img
      src={qrUrl}
      alt={`QR code - ${value}`}
      width={size}
      height={size}
      style={{ display: "block", borderRadius: 4 }}
      crossOrigin="anonymous"
    />
  );
}

/* ─── Composant : Carte d'étudiant imprimable ───────────────────────────── */
function CarteEtudiantModal({ etudiant, onClose }) {
  const cardRef = useRef(null);
  const [carteImgError, setCarteImgError] = useState(false);
  // URL directe vers le backend — indépendante du imgError du parent
  const photoSrc =
    etudiant.photo && !carteImgError
      ? getPhotoUrl(etudiant.photo)
      : null;

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Carte Étudiant – ${etudiant.prenom} ${etudiant.nom}</title>
        <meta charset="utf-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f0f4f8;
          }
          .card-wrapper {
            width: 85.6mm;
            height: 54mm;
            page-break-inside: avoid;
          }
          @media print {
            body { background: white; }
            .card-wrapper { width: 85.6mm; height: 54mm; }
          }
        </style>
      </head>
      <body>
        <div class="card-wrapper">
          ${printContent.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const qrData = `MATRICULE:${etudiant.matricule}|NOM:${etudiant.nom}|PRENOM:${etudiant.prenom}|EMAIL:${etudiant.email || ""}`;

  const inscriptionActive = etudiant.inscription_active || null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
      }}
      onClick={onClose}
    >
      {/* Titre et boutons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CreditCard size={22} /> Carte d'étudiant
        </h2>
        <button
          onClick={handlePrint}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#4f8ef7",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background .2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#2d6ee0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#4f8ef7")}
        >
          <Printer size={15} /> Imprimer
        </button>
        <button
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            background: "rgba(255,255,255,0.15)",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Carte principale (format CB : 85.6mm × 54mm ≈ 323px × 204px à 96dpi) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.5))" }}
      >
        <div
          ref={cardRef}
          style={{
            width: 340,
            height: 215,
            borderRadius: 14,
            overflow: "hidden",
            background: "linear-gradient(135deg, #0f0c29, #1a1a4e, #24243e)",
            position: "relative",
            fontFamily: "'Segoe UI', Arial, sans-serif",
          }}
        >
          {/* Décoration fond */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(79,142,247,0.12)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(79,142,247,0.08)",
              pointerEvents: "none",
            }}
          />

          {/* Bande supérieure */}
          <div
            style={{
              background: "linear-gradient(90deg, #4f8ef7, #2d6ee0)",
              height: 6,
              width: "100%",
            }}
          />

          {/* Contenu carte */}
          <div
            style={{
              display: "flex",
              padding: "12px 14px 10px",
              gap: 12,
              height: "calc(100% - 6px)",
            }}
          >
            {/* Colonne gauche : logo + photo */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                minWidth: 72,
              }}
            >
              {/* Logo université */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#4f8ef7,#2d6ee0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GraduationCap size={15} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: 7,
                    color: "#a0aec0",
                    textAlign: "center",
                    lineHeight: 1.2,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                  }}
                >
                  UNIV.
                  <br />
                  GESTION
                </span>
              </div>

              {/* Photo étudiant */}
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={`${etudiant.prenom} ${etudiant.nom}`}
                  onError={() => setCarteImgError(true)}
                  crossOrigin="anonymous"
                  style={{
                    width: 64,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "2.5px solid #4f8ef7",
                    boxShadow: "0 2px 12px rgba(79,142,247,0.35)",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 72,
                    borderRadius: 8,
                    background: "linear-gradient(135deg,#4f8ef7,#2d6ee0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2.5px solid #4f8ef7",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {`${(etudiant.prenom?.[0] || "").toUpperCase()}${(etudiant.nom?.[0] || "").toUpperCase()}`}
                </div>
              )}
            </div>

            {/* Colonne centrale : infos */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              {/* Header titre */}
              <div>
                <div
                  style={{
                    fontSize: 8,
                    color: "#4f8ef7",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 3,
                  }}
                >
                  Carte d'Étudiant
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.25,
                    wordBreak: "break-word",
                  }}
                >
                  {etudiant.prenom} {etudiant.nom}
                </div>
              </div>

              {/* Matricule */}
              <div
                style={{
                  background: "rgba(79,142,247,0.15)",
                  border: "1px solid rgba(79,142,247,0.3)",
                  borderRadius: 5,
                  padding: "3px 7px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  alignSelf: "flex-start",
                }}
              >
                <Hash size={9} color="#4f8ef7" />
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: "#4f8ef7",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  {etudiant.matricule}
                </span>
              </div>

              {/* Infos */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 3 }}
              >
                {etudiant.date_naissance && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 9,
                      color: "#cbd5e0",
                    }}
                  >
                    <Calendar size={9} color="#4f8ef7" />
                    Né(e) le{" "}
                    {new Date(etudiant.date_naissance).toLocaleDateString(
                      "fr-FR",
                    )}
                  </div>
                )}
                {etudiant.email && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 9,
                      color: "#cbd5e0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Mail size={9} color="#4f8ef7" />
                    {etudiant.email}
                  </div>
                )}
                {etudiant.telephone && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 9,
                      color: "#cbd5e0",
                    }}
                  >
                    <Phone size={9} color="#4f8ef7" />
                    {etudiant.telephone}
                  </div>
                )}
              </div>

              {/* Statut */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    padding: "2px 7px",
                    borderRadius: 20,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background:
                      etudiant.statut === "actif"
                        ? "rgba(34,197,94,0.2)"
                        : "rgba(239,68,68,0.2)",
                    color:
                      etudiant.statut === "actif" ? "#4ade80" : "#f87171",
                    border: `1px solid ${etudiant.statut === "actif" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}
                >
                  ● {STATUT_LABELS[etudiant.statut] || etudiant.statut || "Actif"}
                </div>
                <div
                  style={{
                    fontSize: 7,
                    color: "#718096",
                    fontStyle: "italic",
                  }}
                >
                  {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                </div>
              </div>
            </div>

            {/* Colonne droite : QR code */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                minWidth: 72,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 7,
                  padding: 3,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                <QRCodeSVG value={qrData} size={66} />
              </div>
              <span
                style={{
                  fontSize: 7,
                  color: "#718096",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                Scanner
                <br />
                pour vérifier
              </span>
            </div>
          </div>

          {/* Bande inférieure */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #4f8ef7, #2d6ee0, #a78bfa)",
            }}
          />
        </div>
      </div>

      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        Cliquez en dehors de la carte pour fermer · Format CB (85.6 × 54 mm)
      </p>
    </div>
  );
}

/* ─── Composant : Ligne d'information avec emojis pour le sexe ───────────── */
function InfoRow({ label, value, icon: Icon, last = false }) {
  if (!value) return null;

  let displayValue = value;
  let SexeIcon = null;

  if (label === "Genre" || label === "Sexe") {
    if (value.includes("Masculin") || value === "M" || value === "♂ Masculin") {
      displayValue = "♂ Masculin";
      SexeIcon = () => <span className="text-blue-500 mr-2">👨</span>;
    } else if (
      value.includes("Féminin") ||
      value === "F" ||
      value === "♀ Féminin"
    ) {
      displayValue = "♀ Féminin";
      SexeIcon = () => <span className="text-pink-500 mr-2">👩</span>;
    }
  }

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
          {label === "Genre" || label === "Sexe" ? (
            SexeIcon ? (
              <SexeIcon />
            ) : (
              <Icon size={13} color="var(--accent)" />
            )
          ) : (
            <Icon size={13} color="var(--accent)" />
          )}
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
            display: "flex",
            alignItems: "center",
          }}
        >
          {label === "Genre" || label === "Sexe" ? (
            <>
              {SexeIcon && <SexeIcon />}
              <span>{displayValue}</span>
            </>
          ) : (
            displayValue
          )}
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
  const pct = moyenne != null ? Math.min(100, (moyenne / 20) * 100) : null;

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

/* ─── Composant amélioré pour afficher le sexe avec emoji ───────────────── */
function GenderDisplay({ sexe }) {
  if (!sexe) return null;

  const isMale = sexe === "M" || sexe === "Masculin" || sexe === "♂";
  const genderText = isMale ? "Masculin" : "Féminin";
  const genderEmoji = isMale ? "👨" : "👩";
  const genderIcon = isMale ? "♂" : "♀";
  const colorClass = isMale ? "text-blue-500" : "text-pink-500";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xl ${colorClass}`}>{genderEmoji}</span>
      <span className="font-medium">
        {genderIcon} {genderText}
      </span>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function EtudiantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    notification,
    hideNotification,
    success,
    error: showError,
  } = useNotification();

  const [etudiant, setEtudiant] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);
  const [showCarte, setShowCarte] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/etudiants/${id}`),
      api.get(`/inscriptions/historique/${id}`),
    ])
      .then(([e, h]) => {
        setEtudiant(e.data.data);
        setHistorique(h.data.data);
        success(
          `Dossier de ${e.data.data.prenom} ${e.data.data.nom} chargé avec succès.`,
        );
      })
      .catch(() => {
        setError("Impossible de charger les données de l'étudiant.");
        showError("Erreur lors du chargement du dossier étudiant.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleViewNotes = (h) => {
    success(
      `Ouverture des notes — ${h.filiere_nom} (${h.annee_universitaire}, ${h.niveau})`,
    );
    setTimeout(() => navigate(`/notes?inscription=${h.id}`), 600);
  };

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

  /* ── Photo : URL corrigée vers le backend port 3000 ── */
  const photoSrc =
    etudiant.photo && !imgError
      ? getPhotoUrl(etudiant.photo)
      : null;

  const idx = (etudiant.prenom?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [gradFrom, gradTo] = AVATAR_COLORS[idx];
  const initials = `${(etudiant.prenom?.[0] || "").toUpperCase()}${(etudiant.nom?.[0] || "").toUpperCase()}`;

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

  const getGenderDisplay = () => {
    const sexe = etudiant.sexe;
    if (sexe === "M") {
      return { text: "♂ Masculin", emoji: "👨", icon: "♂", color: "text-blue-500" };
    } else if (sexe === "F") {
      return { text: "♀ Féminin", emoji: "👩", icon: "♀", color: "text-pink-500" };
    }
    return { text: sexe || "Non spécifié", emoji: "❓", icon: "", color: "text-gray-500" };
  };

  const genderInfo = getGenderDisplay();

  return (
    <div className="page-enter">
      {/* Modal carte étudiant */}
      {showCarte && (
        <CarteEtudiantModal
          etudiant={etudiant}
          onClose={() => setShowCarte(false)}
        />
      )}

      <NotificationDisplay
        notification={notification}
        onClose={hideNotification}
      />

      <PageHeader
        title={`${etudiant.prenom} ${etudiant.nom}`}
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
              {/* Photo / Avatar */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: -44,
                  marginBottom: 16,
                }}
              >
                {/* ── PHOTO CORRIGÉE : URL vers localhost:3000 ── */}
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

                {etudiant.statut &&
                  (() => {
                    const statutAffiche =
                      etudiant.statut === "abandonne" &&
                      etudiant.matricule?.includes("H-")
                        ? "transfere"
                        : etudiant.statut;
                    return (
                      <div style={{ marginTop: 10 }}>
                        <Badge
                          color={STATUT_COLOR[statutAffiche] || "muted"}
                          dot
                        >
                          {STATUT_LABELS[statutAffiche] || statutAffiche}
                        </Badge>
                      </div>
                    );
                  })()}
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

          {/* ── Bouton Carte étudiant ── */}
          <Btn
            variant="accent"
            onClick={() => setShowCarte(true)}
            icon={<CreditCard size={15} />}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Carte d'étudiant
          </Btn>

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
                onViewNotes={() => handleViewNotes(h)}
              />
            ))
          )}

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
