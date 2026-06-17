import { useEffect, useState, useRef, cloneElement, isValidElement } from "react";
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
  Image as ImageIcon,
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

/* ─── QR Code via api.qrserver.com ──────────────────────────────────────── */
function QRCodeSVG({ value, size = 80 }) {
  const [qrError, setQrError] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    value
  )}&size=${size}x${size}&format=svg&bgcolor=ffffff&color=1a1a2e&margin=2`;

  // FIX IHM — Règle 8 "Gestion des erreurs" : si le service externe est
  // inaccessible, on informe l'utilisateur au lieu d'afficher une image cassée.
  if (qrError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: 8,
          color: "#94A3B8",
          border: "1px dashed #CBD5E1",
          borderRadius: 4,
          padding: 4,
        }}
      >
        QR indisponible
      </div>
    );
  }

  return (
    <img
      src={qrUrl}
      alt={`QR code - ${value}`}
      width={size}
      height={size}
      style={{ display: "block", borderRadius: 4 }}
      crossOrigin="anonymous"
      onError={() => setQrError(true)}
    />
  );
}

/* ─── Champ d'aperçu de la carte ─────────────────────────────────────────── */
function CarteField({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          flexShrink: 0,
          background: "rgba(29,78,216,0.08)",
          border: "1px solid rgba(29,78,216,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={13} color="#1D4ED8" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#0F172A",
            wordBreak: "break-word",
            lineHeight: 1.3,
          }}
        >
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

/* ─── Champ du formulaire d'édition de la carte ──────────────────────────── */
function CarteFormField({ icon: Icon, label, children, id }) {
  // FIX IHM — Règle 11 "Accessibilité" : un <label> doit être lié à son champ
  // via htmlFor/id pour les lecteurs d'écran. On génère un id stable à partir
  // du label si aucun id explicite n'est fourni, et on l'injecte dans le champ
  // enfant sans modifier les appels existants de ce composant.
  const fieldId =
    id || `carte-${String(label).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={fieldId}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {Icon && <Icon size={12} color="#1D4ED8" />}
        {label}
      </label>
      {isValidElement(children) ? cloneElement(children, { id: fieldId }) : children}
    </div>
  );
}

/* ─── Modal : Carte d'étudiant imprimable ────────────────────────────────── */
function CarteEtudiantModal({ etudiant, historique = [], onClose }) {
  const cardRef = useRef(null);
  const panelRef = useRef(null);
  const [carteImgError, setCarteImgError] = useState(false);

  // FIX IHM — Règle 10 "Liberté" + Règle 11 "Accessibilité" : un modal doit
  // pouvoir se fermer au clavier (touche Echap), pas uniquement à la souris.
  // On donne aussi le focus au panneau dès l'ouverture pour les utilisateurs
  // clavier / lecteurs d'écran.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const inscriptionRecente = historique?.[0] || null;

  const [form, setForm] = useState({
    photoUrl: etudiant.photo ? getPhotoUrl(etudiant.photo) : "",
    nom: etudiant.nom || "",
    prenom: etudiant.prenom || "",
    idEtudiant: etudiant.matricule || "",
    filiere: inscriptionRecente?.filiere_nom || "",
    dateNaissance: etudiant.date_naissance
      ? new Date(etudiant.date_naissance).toISOString().slice(0, 10)
      : "",
    anneeAcademique:
      inscriptionRecente?.annee_universitaire ||
      `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    telephone: etudiant.telephone || "",
  });

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const initials =
    `${(form.prenom?.[0] || "").toUpperCase()}${(form.nom?.[0] || "").toUpperCase()}` ||
    "??";

  const photoSrc = form.photoUrl && !carteImgError ? form.photoUrl : null;

  /* QR encode l'URL mockée de la page étudiant */
  const qrData = `http://localhost:5173/etudiants/58`;

  const dateNaissanceAffichee = form.dateNaissance
    ? new Date(form.dateNaissance).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  /* ── Impression dans une nouvelle fenêtre ── */
  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    // FIX IHM — Règle 8 "Gestion des erreurs" : si le navigateur bloque la
    // pop-up, window.open renvoie null ; sans ce contrôle, le code plantait
    // sans aucune explication pour l'utilisateur.
    if (!printWindow) {
      alert(
        "Impossible d'ouvrir la fenêtre d'impression. Vérifiez que les pop-ups ne sont pas bloquées pour ce site, puis réessayez."
      );
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <title>Carte Étudiant – ${form.prenom} ${form.nom}</title>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            padding: 40px 20px;
          }
          @media print {
            body {
              background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 600);
          };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const carteInputStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: "1.5px solid #CBD5E1",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13.5,
    color: "#0F172A",
    background: "#fff",
    outline: "none",
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: "border-color 0.2s",
  };

  /* ── Styles inline pour la carte imprimable ── */
  const cardStyles = {
    wrapper: {
      position: "relative",
      width: 380,
      maxWidth: "100%",
      background: "#FFFFFF",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    spine: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: 8,
      background: "linear-gradient(180deg, #1D4ED8, #3B82F6)",
      zIndex: 2,
    },
    header: {
      height: 80,
      marginLeft: 8,
      background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
      position: "relative",
      overflow: "hidden",
    },
    headerPattern: {
      position: "absolute",
      inset: 0,
      opacity: 0.12,
      backgroundImage:
        "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    },
    headerLabel: {
      position: "absolute",
      top: 14,
      right: 18,
      fontSize: 10,
      fontWeight: 700,
      color: "rgba(255,255,255,0.85)",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
    },
    headerYear: {
      position: "absolute",
      bottom: 12,
      right: 18,
      fontSize: 11,
      fontWeight: 600,
      color: "rgba(255,255,255,0.7)",
      letterSpacing: "0.06em",
    },
    body: {
      padding: "0 24px 22px",
      marginLeft: 8,
    },
    avatarWrap: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: -50,
      marginBottom: 16,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: "50%",
      border: "4px solid #FFFFFF",
      boxShadow: "0 6px 20px rgba(29,78,216,0.28)",
      objectFit: "cover",
    },
    avatarFallback: {
      width: 96,
      height: 96,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "4px solid #FFFFFF",
      boxShadow: "0 6px 20px rgba(29,78,216,0.28)",
      fontSize: 30,
      fontWeight: 800,
      color: "#fff",
      letterSpacing: "-1px",
    },
    cardTitle: {
      fontSize: 10,
      fontWeight: 800,
      color: "#1D4ED8",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      marginTop: 12,
      marginBottom: 4,
    },
    studentName: {
      fontSize: 20,
      fontWeight: 700,
      color: "#0F172A",
      textAlign: "center",
      lineHeight: 1.25,
      wordBreak: "break-word",
    },
    divider: {
      height: 1,
      background: "linear-gradient(90deg, transparent, #E2E8F0 20%, #E2E8F0 80%, transparent)",
      margin: "16px 0",
    },
    fieldsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginBottom: 16,
    },
    footer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 14,
      borderTop: "1px solid #E2E8F0",
      gap: 10,
    },
    footerText: {
      fontSize: 9,
      color: "#64748B",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      marginBottom: 4,
    },
    footerUrl: {
      fontSize: 8,
      color: "#94A3B8",
      wordBreak: "break-all",
      maxWidth: 180,
    },
    qrWrap: {
      background: "#fff",
      border: "1px solid #E2E8F0",
      borderRadius: 10,
      padding: 5,
      flexShrink: 0,
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 20,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="carte-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(920px, 100%)",
          maxHeight: "93vh",
          overflowY: "auto",
          background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        {/* ── En-tête du modal ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              id="carte-modal-title"
              style={{
                fontSize: 19,
                fontWeight: 700,
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                gap: 9,
                margin: 0,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              <CreditCard size={20} color="#1D4ED8" />
              Carte d'étudiant
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0 29px" }}>
              Modifiez les champs et imprimez. Cliquez en dehors pour fermer.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              <Printer size={15} />
              Télécharger / Imprimer en PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Fermer la carte d'étudiant"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                background: "rgba(15,23,42,0.08)",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                color: "#0F172A",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Grille : formulaire | aperçu ── */}
        <div className="carte-modal-grid">

          {/* ─ Formulaire d'édition ─ */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#1D4ED8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 4,
                borderBottom: "2px solid #EEF2FF",
                paddingBottom: 8,
              }}
            >
              Édition des champs
            </div>

            <CarteFormField icon={ImageIcon} label="Photo (URL)">
              <input
                type="text"
                value={form.photoUrl}
                onChange={setField("photoUrl")}
                placeholder="https://exemple.com/photo.jpg"
                style={carteInputStyle}
              />
            </CarteFormField>

            <div style={{ display: "flex", gap: 10 }}>
              <CarteFormField icon={User} label="Prénom">
                <input value={form.prenom} onChange={setField("prenom")} style={carteInputStyle} />
              </CarteFormField>
              <CarteFormField icon={User} label="Nom">
                <input value={form.nom} onChange={setField("nom")} style={carteInputStyle} />
              </CarteFormField>
            </div>

            <CarteFormField icon={Hash} label="ID Étudiant">
              <input value={form.idEtudiant} onChange={setField("idEtudiant")} style={carteInputStyle} />
            </CarteFormField>

            <CarteFormField icon={GraduationCap} label="Filière">
              <input value={form.filiere} onChange={setField("filiere")} style={carteInputStyle} />
            </CarteFormField>

            <CarteFormField icon={Phone} label="Téléphone">
              <input
                type="tel"
                value={form.telephone}
                onChange={setField("telephone")}
                placeholder="+261 XX XX XXX XX"
                style={carteInputStyle}
              />
            </CarteFormField>

            <div style={{ display: "flex", gap: 10 }}>
              <CarteFormField icon={Calendar} label="Date de naissance">
                <input
                  type="date"
                  value={form.dateNaissance}
                  onChange={setField("dateNaissance")}
                  style={carteInputStyle}
                />
              </CarteFormField>
              <CarteFormField icon={Award} label="Année académique">
                <input
                  value={form.anneeAcademique}
                  onChange={setField("anneeAcademique")}
                  placeholder="2025-2026"
                  style={carteInputStyle}
                />
              </CarteFormField>
            </div>
          </div>

          {/* ─ Aperçu en direct ─ */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "10px 0",
            }}
          >
            {/* ══ CARTE IMPRIMABLE (ref) ══ */}
            <div ref={cardRef} style={cardStyles.wrapper}>

              {/* Liseré gauche bleu */}
              <div style={cardStyles.spine} />

              {/* Bandeau supérieur dégradé */}
              <div style={cardStyles.header}>
                <div style={cardStyles.headerPattern} />
                <div style={cardStyles.headerLabel}>CARTE D'ÉTUDIANT</div>
                <div style={cardStyles.headerYear}>{form.anneeAcademique}</div>
              </div>

              {/* Corps de la carte */}
              <div style={cardStyles.body}>

                {/* Avatar + nom */}
                <div style={cardStyles.avatarWrap}>
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={`${form.prenom} ${form.nom}`}
                      onError={() => setCarteImgError(true)}
                      crossOrigin="anonymous"
                      style={cardStyles.avatar}
                    />
                  ) : (
                    <div style={cardStyles.avatarFallback}>{initials}</div>
                  )}
                  <div style={cardStyles.cardTitle}>CARTE D'ÉTUDIANT</div>
                  <div style={cardStyles.studentName}>
                    {form.prenom} {form.nom}
                  </div>
                </div>

                <div style={cardStyles.divider} />

                {/* Grille des champs 2×3 */}
                <div style={cardStyles.fieldsGrid}>
                  <CarteField icon={Hash} label="ID Étudiant" value={form.idEtudiant} />
                  <CarteField icon={GraduationCap} label="Filière" value={form.filiere} />
                  <CarteField icon={Calendar} label="Naissance" value={dateNaissanceAffichee} />
                  <CarteField icon={Award} label="Année acad." value={form.anneeAcademique} />
                  {form.telephone && (
                    <CarteField
                      icon={Phone}
                      label="Téléphone"
                      value={form.telephone}
                    />
                  )}
                </div>

                {/* Pied : QR code + scanner */}
                <div style={cardStyles.footer}>
                  <div>
                    <div style={cardStyles.footerText}>Scanner pour vérifier</div>
                    <div style={cardStyles.footerUrl}>{qrData}</div>
                    <div style={{ fontSize: 8, color: "#94A3B8", marginTop: 3 }}>
                      Valable {form.anneeAcademique}
                    </div>
                  </div>
                  <div style={cardStyles.qrWrap}>
                    <QRCodeSVG value={qrData} size={68} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .carte-modal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 820px) {
          .carte-modal-grid {
            grid-template-columns: 310px 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Ligne d'info ───────────────────────────────────────────────────────── */
function InfoRow({ label, value, icon: Icon, last = false }) {
  if (!value) return null;

  let displayValue = value;
  let SexeIcon = null;

  if (label === "Genre" || label === "Sexe") {
    if (value.includes("Masculin") || value === "M" || value === "♂ Masculin") {
      displayValue = "♂ Masculin";
      SexeIcon = () => <span style={{ marginRight: 4 }}></span>;
    } else if (
      value.includes("Féminin") ||
      value === "F" ||
      value === "♀ Féminin"
    ) {
      displayValue = "♀ Féminin";
      SexeIcon = () => <span style={{ marginRight: 4 }}></span>;
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

/* ─── Stat résumé ────────────────────────────────────────────────────────── */
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

/* ─── Carte d'inscription ────────────────────────────────────────────────── */
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
            <Badge color={MENTION_COLOR[h.mention] || "muted"}>{h.mention}</Badge>
          )}
        </div>
      </div>

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
                border: `1px solid ${
                  moyenne >= 10 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"
                }`,
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

      <Btn small variant="ghost" onClick={onViewNotes} icon={<BookOpen size={13} />}>
        Consulter les notes
      </Btn>
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
    chargerDossier();
  }, [id]);

  // FIX IHM — Règle 8 "Gestion des erreurs" : "l'internaute doit facilement
  // pouvoir corriger ses erreurs". Avant, en cas d'échec réseau, l'utilisateur
  // restait bloqué sur le message d'erreur sans aucune action possible
  // (obligé de recharger toute la page). On extrait donc le chargement dans
  // une fonction réutilisable par un bouton "Réessayer".
  function chargerDossier() {
    setLoading(true);
    setError("");
    Promise.all([
      api.get(`/etudiants/${id}`),
      api.get(`/inscriptions/historique/${id}`),
    ])
      .then(([e, h]) => {
        setEtudiant(e.data.data);
        setHistorique(h.data.data);
        success(
          `Dossier de ${e.data.data.prenom} ${e.data.data.nom} chargé avec succès.`
        );
      })
      .catch(() => {
        setError("Impossible de charger les données de l'étudiant.");
        showError("Erreur lors du chargement du dossier étudiant.");
      })
      .finally(() => setLoading(false));
  }

  const handleViewNotes = (h) => {
    success(
      `Ouverture des notes — ${h.filiere_nom} (${h.annee_universitaire}, ${h.niveau})`
    );
    // FIX IHM — Règle 9 "Rapidité" : "l'internaute ne perd pas son temps".
    // 600ms d'attente avant de naviguer n'apportait rien de fonctionnel ;
    // 200ms suffit pour laisser apercevoir la notification sans ralentir
    // perceptiblement l'action de l'utilisateur.
    setTimeout(() => navigate(`/notes?inscription=${h.id}`), 200);
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
  if (error)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <Alert type="danger">{error}</Alert>
        {/* FIX IHM — Règle 8 "Gestion des erreurs" : donner à l'internaute
            un moyen direct de corriger l'erreur, au lieu de le laisser bloqué. */}
        <Btn variant="ghost" onClick={chargerDossier}>
          Réessayer
        </Btn>
      </div>
    );
  if (!etudiant) return <Alert type="warning">Étudiant introuvable.</Alert>;

  const photoSrc =
    etudiant.photo && !imgError ? getPhotoUrl(etudiant.photo) : null;

  const idx = (etudiant.prenom?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [gradFrom, gradTo] = AVATAR_COLORS[idx];
  const initials = `${(etudiant.prenom?.[0] || "").toUpperCase()}${(
    etudiant.nom?.[0] || ""
  ).toUpperCase()}`;

  const nbAdmis = historique.filter((h) => h.mention === "Admis").length;
  const nbRattrapage = historique.filter((h) => h.mention === "Rattrapage").length;
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
      {/* Modal carte étudiant */}
      {showCarte && (
        <CarteEtudiantModal
          etudiant={etudiant}
          historique={historique}
          onClose={() => setShowCarte(false)}
        />
      )}

      <NotificationDisplay notification={notification} onClose={hideNotification} />

      <PageHeader title={`${etudiant.prenom} ${etudiant.nom}`} back={() => navigate(-1)} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* ════════ COLONNE GAUCHE ════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Profil */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {/* Bandeau */}
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
                        <Badge color={STATUT_COLOR[statutAffiche] || "muted"} dot>
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
                <InfoRow label="Téléphone" value={etudiant.telephone} icon={Phone} />
                <InfoRow label="Adresse e-mail" value={etudiant.email} icon={Mail} />
                <InfoRow label="Adresse" value={etudiant.adresse} icon={MapPin} last />
              </div>
            </div>
          </div>

          {/* Bouton Carte */}
          <Btn
            variant="accent"
            onClick={() => setShowCarte(true)}
            icon={<CreditCard size={15} />}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Carte d'étudiant
          </Btn>

          {/* Bouton retour */}
          <Btn
            variant="ghost"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={15} />}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Retour à la liste
          </Btn>
        </div>

        {/* ════════ COLONNE DROITE ════════ */}
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
                Cet étudiant n'a encore aucune inscription enregistrée dans le système.
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
              <StatPill label="Rattrapages" value={nbRattrapage} color="var(--warning)" />
              <StatPill label="Ajournés" value={nbAjourn} color="var(--danger)" />

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
