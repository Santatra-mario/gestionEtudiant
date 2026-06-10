import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  X,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification, NotificationDisplay } from "../hooks/useNotification";
import { Messages, formatErrorMessage } from "../utils/messages";

import {
  PageHeader,
  Btn,
  Table,
  Tr,
  Td,
  Badge,
  Modal,
  Input,
  Select,
  FormRow,
  FormSection,
  Alert,
  Spinner,
  EmptyState,
  Tooltip,
} from "../components/ui";

// ─── Composant Toast Notification Moderne avec Tailwind CSS ─────────────────────
function ToastNotification({ message, type, onClose, details }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: "from-emerald-500 to-teal-600",
      icon: <CheckCircle2 className="w-5 h-5" />,
      border: "border-emerald-300",
      title: "Succès",
    },
    error: {
      bg: "from-rose-500 to-red-600",
      icon: <AlertCircle className="w-5 h-5" />,
      border: "border-rose-300",
      title: "Erreur",
    },
    warning: {
      bg: "from-amber-500 to-orange-600",
      icon: <AlertTriangle className="w-5 h-5" />,
      border: "border-amber-300",
      title: "Attention",
    },
    info: {
      bg: "from-sky-500 to-blue-600",
      icon: <Sparkles className="w-5 h-5" />,
      border: "border-sky-300",
      title: "Information",
    },
  };

  const current = config[type] || config.success;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`bg-gradient-to-r ${current.bg} text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 min-w-[360px] max-w-md backdrop-blur-sm border-l-4 ${current.border}`}
      >
        <div className="flex-shrink-0 mt-0.5">{current.icon}</div>
        <div className="flex-1">
          <div className="font-bold text-sm mb-1">{current.title}</div>
          <div className="text-sm opacity-95">{message}</div>
          {details && (
            <div className="text-xs opacity-80 mt-1.5 pt-1.5 border-t border-white/20">
              {details}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="hover:opacity-80 transition-opacity flex-shrink-0 -mt-1 -mr-1 p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Palette de couleurs avatar ───────────────────────────────────────────
const PALETTE = [
  ["#6366f1", "#4f46e5"],
  ["#22c55e", "#16a34a"],
  ["#f59e0b", "#d97706"],
  ["#ec4899", "#be185d"],
  ["#14b8a6", "#0d9488"],
  ["#ef4444", "#dc2626"],
  ["#8b5cf6", "#7c3aed"],
  ["#0ea5e9", "#0284c7"],
];

function getColors(seed) {
  const code =
    typeof seed === "string" && seed.length > 0
      ? seed.charCodeAt(0)
      : typeof seed === "number"
        ? seed
        : 0;
  const idx = (isNaN(code) ? 0 : Math.abs(code)) % PALETTE.length;
  return PALETTE[idx] || PALETTE[0];
}

// ─── Composant Avatar ─────────────────────────────────────────────────────
function Avatar({ photo, prenom, nom, size = 40 }) {
  const [imgError, setImgError] = useState(false);
  const [from, to] = getColors(prenom);
  const initials = `${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`;

  if (photo && !imgError) {
    return (
      <img
        src={`http://localhost:3000/uploads/photos/${photo}`}
        alt={`${prenom} ${nom}`}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid var(--border)",
          display: "block",
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
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "#fff",
        letterSpacing: "0.03em",
        flexShrink: 0,
        userSelect: "none",
        boxShadow: `0 2px 8px ${from}55`,
      }}
    >
      {initials || "?"}
    </div>
  );
}

// ─── Sélecteur de photo ───────────────────────────────────────────────────
function PhotoPicker({ photo, preview, prenom, nom, onFileChange }) {
  const [from, to] = getColors(prenom);
  const src = preview || (photo ? `http://localhost:3000/uploads/photos/${photo}` : null);
  const initials = `${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        padding: "20px 0 8px",
      }}
    >
      <div style={{ position: "relative", display: "inline-flex" }}>
        {src ? (
          <img
            src={src}
            alt="Aperçu"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid var(--accent)",
              boxShadow:
                "0 0 0 5px rgba(99,102,241,0.18), 0 4px 20px rgba(0,0,0,0.25)",
            }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${from}, ${to})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
              color: "#fff",
              border: "3px solid var(--border)",
              boxShadow: `0 4px 20px ${from}44`,
            }}
          >
            {initials || <User size={34} color="#fff" />}
          </div>
        )}
        <label
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "var(--accent)",
            border: "2.5px solid var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "transform 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.12)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          title={src ? "Changer la photo" : "Ajouter une photo"}
        >
          <Camera size={14} color="#fff" />
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </label>
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: "0.02em",
        }}
      >
        JPG, PNG · max 2 Mo
      </span>
    </div>
  );
}

// ─── Badge statut ────────────────────────────────────────────────────────
const STATUT_COLOR = {
  actif: "success",
  suspendu: "warning",
  diplome: "accent",
  abandonne: "danger",
};

// ══════════════════════════════════════════════════════════════════════════
// ── liste des pays avec indicatif et drapeau emoji ──────────────────────
// ══════════════════════════════════════════════════════════════════════════
const COUNTRIES = [
  { code: "MG", name: "Madagascar", dial: "+261", flag: "🇲🇬" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "RE", name: "La Réunion", dial: "+262", flag: "🇷🇪" },
  { code: "MU", name: "Maurice", dial: "+230", flag: "🇲🇺" },
  { code: "KM", name: "Comores", dial: "+269", flag: "🇰🇲" },
  { code: "ZA", name: "Afrique du Sud", dial: "+27", flag: "🇿🇦" },
  { code: "TN", name: "Tunisie", dial: "+216", flag: "🇹🇳" },
  { code: "MA", name: "Maroc", dial: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algérie", dial: "+213", flag: "🇩🇿" },
  { code: "SN", name: "Sénégal", dial: "+221", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮" },
  { code: "CM", name: "Cameroun", dial: "+237", flag: "🇨🇲" },
  { code: "US", name: "États-Unis", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "Royaume-Uni", dial: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Allemagne", dial: "+49", flag: "🇩🇪" },
  { code: "CN", name: "Chine", dial: "+86", flag: "🇨🇳" },
  { code: "IN", name: "Inde", dial: "+91", flag: "🇮🇳" },
];

// ── Sélecteur de pays avec drapeau ──────────────────────────────────────
function CountryDialPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search),
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 10px",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          cursor: "pointer",
          color: "var(--text)",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
          transition: "border-color .18s, box-shadow .18s",
          height: "100%",
          minWidth: 90,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "var(--accent)")
        }
        onMouseLeave={(e) =>
          !open && (e.currentTarget.style.borderColor = "var(--border)")
        }
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{selected.flag}</span>
        <span style={{ fontSize: 12 }}>{selected.dial}</span>
        <ChevronDown
          size={12}
          style={{
            transition: "transform .2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--text-muted)",
          }}
        />
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => {
              setOpen(false);
              setSearch("");
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 50,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              width: 240,
              maxHeight: 280,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "fadeDropdown .15s ease",
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 12,
                  color: "var(--text)",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "12px 14px",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  Aucun résultat
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setSearch("");
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 14px",
                      background:
                        c.code === value
                          ? "rgba(99,102,241,0.1)"
                          : "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text)",
                      fontSize: 13,
                      textAlign: "left",
                      transition: "background .12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        c.code === value
                          ? "rgba(99,102,241,0.1)"
                          : "transparent")
                    }
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>
                      {c.flag}
                    </span>
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {c.dial}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── Fonctions de validation ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

// NOM : lettres (avec accents), chiffres, tirets, apostrophes — SANS espaces
const TEXT_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'\-]+$/;

// PRÉNOM : même chose MAIS avec espaces autorisés (ex: "Santatra Mario Jonsthone")
const PRENOM_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'\- ]+$/;

// Validation NOM (espaces interdits)
function validateTextField(value) {
  if (!value) return null;
  if (/\s/.test(value)) return "Les espaces ne sont pas autorisés";
  if (!TEXT_REGEX.test(value))
    return "Caractères spéciaux non autorisés (ex: /* ; : ! …)";
  return null;
}

// Validation PRÉNOM (espaces autorisés)
function validatePrenomField(value) {
  if (!value) return null;
  if (!PRENOM_REGEX.test(value))
    return "Caractères spéciaux non autorisés (ex: /* ; : ! …)";
  return null;
}

// Adresse : autorise lettres, chiffres, espaces, virgules, tirets, points
const ADDR_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s,.\-']+$/;

function validateAddressField(value) {
  if (!value) return null;
  if (!ADDR_REGEX.test(value))
    return "Caractères spéciaux non autorisés dans l'adresse";
  return null;
}

// ── Composant d'erreur inline ────────────────────────────────────────────
function FieldErr({ msg }) {
  if (!msg) return null;
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: "#fca5a5",
        fontWeight: 500,
        marginTop: 4,
        animation: "fadeErrIn .2s ease both",
      }}
    >
      <AlertCircle size={11} style={{ flexShrink: 0 }} />
      {msg}
    </span>
  );
}

// ─── Modal étudiant (création / édition) ────────────────────────────────
function EtudiantModal({ onClose, onSaved, initial }) {
  const isEdit = !!initial?.id;
  const [toast, setToast] = useState(null);
  // ── Step : 1 = infos étudiant, 2 = inscription initiale (création seulement) ──
  const [step, setStep] = useState(1);
  const [filieres, setFilieres] = useState([]);
  const [filiereLoading, setFiliereLoading] = useState(false);
  const [withInscription, setWithInscription] = useState(true);

  function getTodayDate() { return new Date().toISOString().split("T")[0]; }
  function getCurrentAcademicYear() {
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 8 ? `${y}-${y+1}` : `${y-1}-${y}`;
  }

  const [inscForm, setInscForm] = useState({
    filiere_id: "",
    niveau: "L1",
    annee_universitaire: getCurrentAcademicYear(),
    date_inscription: getTodayDate(),
  });

  // Charger les filières dès que le modal s'ouvre (création seulement)
  useEffect(() => {
    if (isEdit) return;
    setFiliereLoading(true);
    api.get("/filieres").then(({ data }) => {
      setFilieres(data.data || []);
    }).catch(() => {
      setFilieres([]);
    }).finally(() => setFiliereLoading(false));
  }, [isEdit]);

  // ── Détecte l'indicatif stocké et le retire du numéro affiché ──────────
  function parseInitialPhone(telephone) {
    if (!telephone) return { code: "MG", digits: "" };
    const tel = telephone.trim();
    const matched = COUNTRIES.find((c) => tel.startsWith(c.dial));
    if (matched) {
      let digits = tel.slice(matched.dial.length).trim();
      // Fix double-prefixe ex: +261261XXXXXXX (sauvegarde precedente bugguee)
      const dialWithoutPlus = matched.dial.replace("+", "");
      if (digits.startsWith(dialWithoutPlus)) {
        digits = digits.slice(dialWithoutPlus.length);
      }
      return { code: matched.code, digits };
    }
    return { code: "MG", digits: tel };
  }
  const { code: initCode, digits: initDigits } = parseInitialPhone(initial?.telephone);

  const [form, setForm] = useState({
    nom: initial?.nom || "",
    prenom: initial?.prenom || "",
    date_naissance: initial?.date_naissance?.split("T")[0] || "",
    sexe: initial?.sexe || "M",
    adresse: initial?.adresse || "",
    telephone: initDigits,
    email: initial?.email || "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [countryCode, setCountryCode] = useState(initCode);

  const [fieldErrors, setFieldErrors] = useState({
    nom: "",
    prenom: "",
    adresse: "",
  });

  const showNotification = (message, type = "success", details = null) => {
    setToast({ message, type, details });
  };

  const today = new Date().toISOString().split("T")[0];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── PRÉNOM : espaces autorisés ───────────────────────────────────────
  const handlePrenomChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, prenom: val }));
    setFieldErrors((prev) => ({
      ...prev,
      prenom: validatePrenomField(val) || "",
    }));
  };

  // ── NOM : espaces interdits ──────────────────────────────────────────
  const handleNomChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, nom: val }));
    setFieldErrors((prev) => ({ ...prev, nom: validateTextField(val) || "" }));
  };

  const handleAdresseChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, adresse: val }));
    setFieldErrors((prev) => ({
      ...prev,
      adresse: validateAddressField(val) || "",
    }));
  };

  const hasFieldError = () =>
    !!(fieldErrors.nom || fieldErrors.prenom || fieldErrors.adresse);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const phoneDigits = form.telephone.replace(/[\s\-]/g, "");
  const selectedCountry =
    COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  const phoneValid = (() => {
    if (!form.telephone.trim()) return true;
    if (countryCode === "MG") {
      if (/^0/.test(phoneDigits)) return false;
      return /^[23][0-9]{8}$/.test(phoneDigits);
    }
    return /^\d{6,15}$/.test(phoneDigits);
  })();

  const phoneError = (() => {
    if (!form.telephone.trim()) return "";
    if (!phoneValid) {
      if (countryCode === "MG") {
        if (/^0/.test(phoneDigits))
          return "Avec +261 ne mettez pas le 0 — ex: 33 187 4598";
        return "Numéro invalide — 9 chiffres sans 0 ex: 331874598";
      }
      return "Numéro invalide — entre 6 et 15 chiffres";
    }
    return "";
  })();

  const isValid =
    form.nom.trim() &&
    form.prenom.trim() &&
    form.date_naissance &&
    !phoneError &&
    !hasFieldError();

  // ── Passe à l'étape 2 (inscription) ou soumet directement ───
  const handleNext = (e) => {
    e.preventDefault();
    if (!isValid) return;
    // Édition → soumet directement
    if (isEdit) { handleSubmit(e); return; }
    // Création sans inscription → soumet directement, skip step 2
    if (!withInscription) { handleSubmit(e); return; }
    // Création avec inscription → step 2
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      // Retire le 0 initial et aussi l'indicatif sans + s'il est deja present (ex: 261XXXXXXX)
      let rawTel = form.telephone.trim().replace(/[\s\-]/g, "");
      const dialWithoutPlus = selectedCountry.dial.replace("+", "");
      if (rawTel.startsWith(dialWithoutPlus)) rawTel = rawTel.slice(dialWithoutPlus.length);
      if (rawTel.startsWith("0")) rawTel = rawTel.slice(1);
      const telWithDial = rawTel ? `${selectedCountry.dial}${rawTel}` : "";
      Object.entries({
        ...form,
        telephone: telWithDial || form.telephone,
      }).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append("photo", photo);

      if (isEdit) {
        await api.put(`/etudiants/${initial.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showNotification(
          `Informations mises à jour avec succès`,
          "success",
          `${form.prenom} ${form.nom} · Modifications enregistrées`,
        );
      } else {
        // Ajout inscription optionnelle dans la même requête
        if (withInscription && inscForm.filiere_id) {
          fd.append("inscription", JSON.stringify(inscForm));
        }
        await api.post("/etudiants", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const msgDetail = withInscription && inscForm.filiere_id
          ? `${form.prenom} ${form.nom} · Inscrit(e) en ${inscForm.niveau} (${inscForm.annee_universitaire})`
          : `${form.prenom} ${form.nom} · Bienvenue dans la plateforme`;
        showNotification(`Nouvel étudiant ajouté avec succès`, "success", msgDetail);
      }
      setTimeout(() => { onSaved(); }, 500);
    } catch (err) {
      setError(formatErrorMessage(err) || Messages.STUDENT_ERROR);
      showNotification(
        "Une erreur est survenue",
        "error",
        "Veuillez vérifier les informations et réessayer",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          details={toast.details}
          onClose={() => setToast(null)}
        />
      )}
      <style>{`
        @keyframes fadeErrIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDropdown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Modal
        title={isEdit ? "Modifier l'étudiant" : "Nouvel étudiant"}
        subtitle={
          isEdit
            ? `Matricule : ${initial.matricule}`
            : "Remplissez les informations ci-dessous"
        }
        onClose={onClose}
        width={580}
      >
        <form
          onSubmit={step === 1 ? handleNext : handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 0 }}
        >
          {/* ── Indicateur de step (création avec inscription seulement) ── */}
          {!isEdit && withInscription && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: step >= s ? "var(--accent)" : "var(--surface2)",
                    border: `2px solid ${step >= s ? "var(--accent)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                    color: step >= s ? "#fff" : "var(--text-muted)",
                    transition: "all .2s",
                  }}>
                    {s}
                  </div>
                  <span style={{ fontSize: 12, color: step === s ? "var(--text)" : "var(--text-muted)", fontWeight: step === s ? 600 : 400 }}>
                    {s === 1 ? "Identité" : "Inscription"}
                  </span>
                  {s === 1 && <span style={{ color: "var(--border)", fontSize: 12 }}>→</span>}
                </div>
              ))}
            </div>
          )}

          {/* ══ STEP 1 : infos étudiant ══ */}
          <div style={{ display: step === 1 ? "block" : "none" }}>
          <PhotoPicker
            photo={initial?.photo}
            preview={photoPreview}
            prenom={form.prenom}
            nom={form.nom}
            onFileChange={handlePhoto}
          />

          {error && (
            <div style={{ margin: "12px 0 4px" }}>
              <Alert type="danger">{error}</Alert>
            </div>
          )}

          <div
            style={{
              height: 1,
              background:
                "linear-gradient(to right, transparent, var(--border), transparent)",
              margin: "16px 0",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <FormSection title="Identité" icon={User}>
              <FormRow>
                {/* ── PRÉNOM : espaces autorisés ── */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    flex: 1,
                  }}
                >
                  <Input
                    label="Prénom"
                    required
                    value={form.prenom}
                    onChange={handlePrenomChange}
                    placeholder="Jean Marie"
                    icon={User}
                    hint="Prénom(s) de l'étudiant — espaces autorisés"
                    error={fieldErrors.prenom}
                  />
                  <FieldErr msg={fieldErrors.prenom} />
                </div>
                {/* ── NOM : espaces interdits ── */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    flex: 1,
                  }}
                >
                  <Input
                    label="Nom"
                    required
                    value={form.nom}
                    onChange={handleNomChange}
                    placeholder="Rakoto"
                    icon={User}
                    hint="Nom de famille — sans espaces"
                    error={fieldErrors.nom}
                  />
                  <FieldErr msg={fieldErrors.nom} />
                </div>
              </FormRow>
              <FormRow>
                <Input
                  label="Date de naissance"
                  required
                  type="date"
                  value={form.date_naissance}
                  onChange={set("date_naissance")}
                  icon={Calendar}
                  hint="Sélectionnez une date passée"
                  min="1900-01-01"
                  max={today}
                />
                <Select
                  label="Sexe"
                  required
                  value={form.sexe}
                  onChange={set("sexe")}
                >
                  <option value="M">👦 Masculin</option>
                  <option value="F">👧 Féminin</option>
                </Select>
              </FormRow>
            </FormSection>

            <FormSection title="Contact" icon={Phone}>
              <Input
                label="Adresse e-mail"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="jean.rakoto@email.com"
                icon={Mail}
              />
              <FormRow>
                {/* ── Téléphone avec sélecteur de pays ── */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    flex: 1,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Téléphone
                  </label>
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "stretch" }}
                  >
                    <CountryDialPicker
                      value={countryCode}
                      onChange={setCountryCode}
                    />
                    <div style={{ position: "relative", flex: 1 }}>
                      <Phone
                        size={14}
                        style={{
                          position: "absolute",
                          left: 11,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)",
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        value={form.telephone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d\s\-]/g, "");
                          if (countryCode === "MG" && val.startsWith("0")) {
                            val = val.replace(/^0+/, "");
                          }
                          setForm((f) => ({ ...f, telephone: val }));
                        }}
                        placeholder={
                          countryCode === "MG" ? "33 187 4598" : "XX XX XX XX"
                        }
                        maxLength={15}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          paddingLeft: 32,
                          paddingRight: 12,
                          paddingTop: 10,
                          paddingBottom: 10,
                          background: "var(--surface2)",
                          border: `1px solid ${phoneError ? "#ef4444" : "var(--border)"}`,
                          borderRadius: 8,
                          color: "var(--text)",
                          fontSize: 14,
                          outline: "none",
                          transition: "border-color .18s, box-shadow .18s",
                          boxShadow: phoneError
                            ? "0 0 0 3px rgba(239,68,68,0.14)"
                            : "none",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = phoneError
                            ? "#ef4444"
                            : "var(--accent)";
                          e.currentTarget.style.boxShadow = phoneError
                            ? "0 0 0 3px rgba(239,68,68,0.14)"
                            : "0 0 0 3px rgba(99,102,241,0.18)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = phoneError
                            ? "#ef4444"
                            : "var(--border)";
                          e.currentTarget.style.boxShadow = phoneError
                            ? "0 0 0 3px rgba(239,68,68,0.14)"
                            : "none";
                        }}
                      />
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    {selectedCountry.flag} {selectedCountry.name} ·{" "}
                    {selectedCountry.dial}
                    {countryCode === "MG" && (
                      <span
                        style={{ color: "var(--accent-light)", marginLeft: 6 }}
                      >
                        · sans le 0 initial
                      </span>
                    )}
                  </span>
                  {phoneError && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "#fca5a5",
                        fontWeight: 500,
                        marginTop: 4,
                        animation: "fadeErrIn .2s ease both",
                      }}
                    >
                      <AlertCircle size={11} style={{ flexShrink: 0 }} />
                      {phoneError}
                    </span>
                  )}
                </div>

                {/* ── Adresse avec validation ── */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    flex: 1,
                  }}
                >
                  <Input
                    label="Adresse"
                    value={form.adresse}
                    onChange={handleAdresseChange}
                    placeholder="Antananarivo"
                    icon={MapPin}
                    error={fieldErrors.adresse}
                  />
                  <FieldErr msg={fieldErrors.adresse} />
                </div>
              </FormRow>
            </FormSection>
          </div>

          {/* ── Toggle inscription (création seulement) ── */}
          {!isEdit && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", marginTop: 20,
              background: withInscription ? "rgba(99,102,241,0.08)" : "var(--surface2)",
              border: `1px solid ${withInscription ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
              borderRadius: 10, cursor: "pointer", transition: "all .2s",
            }} onClick={() => setWithInscription(v => !v)}>
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                background: withInscription ? "var(--accent)" : "var(--surface)",
                border: `2px solid ${withInscription ? "var(--accent)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all .2s",
              }}>
                {withInscription && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  Inscrire immédiatement
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {withInscription
                    ? "Cliquez pour créer le profil sans inscription"
                    : "Cliquez pour ajouter une inscription à cette étape"}
                </div>
              </div>
            </div>
          )}

          </div>{/* fin step 1 */}
          {/* ══ STEP 2 : inscription initiale (création seulement) ══ */}
          {!isEdit && step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Titre step 2 */}
              <div style={{
                padding: "10px 16px",
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  Inscription initiale
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  Choisissez la filière et le niveau pour cet étudiant
                </div>
              </div>

              {true && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Filière */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                      Filière <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    {filiereLoading ? (
                      <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, fontSize: 13, color: "var(--text-muted)" }}>
                        Chargement…
                      </div>
                    ) : (
                      <select
                        value={inscForm.filiere_id}
                        onChange={(e) => setInscForm(f => ({ ...f, filiere_id: e.target.value }))}
                        style={{
                          width: "100%", padding: "10px 14px",
                          background: "var(--surface2)", border: "1px solid var(--border)",
                          borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
                        }}
                      >
                        <option value="">-- Choisir une filière --</option>
                        {filieres.map(f => (
                          <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Niveau + Année */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Niveau</label>
                      <select
                        value={inscForm.niveau}
                        onChange={(e) => setInscForm(f => ({ ...f, niveau: e.target.value }))}
                        style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none" }}
                      >
                        {["L1","L2","L3","M1","M2"].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Année universitaire</label>
                      <input
                        value={inscForm.annee_universitaire}
                        onChange={(e) => setInscForm(f => ({ ...f, annee_universitaire: e.target.value }))}
                        placeholder="2025-2026"
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none" }}
                      />
                    </div>
                  </div>

                  {/* Date inscription */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Date d'inscription</label>
                    <input
                      type="date"
                      value={inscForm.date_inscription}
                      onChange={(e) => setInscForm(f => ({ ...f, date_inscription: e.target.value }))}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
            }}
          >
            {step === 2 && !isEdit ? (
              <>
                <Btn variant="ghost" onClick={() => setStep(1)} icon={<X size={15} />}>
                  Retour
                </Btn>
                <Btn
                  type="submit"
                  loading={loading}
                  disabled={!inscForm.filiere_id}
                  icon={<Save size={15} />}
                >
                  {inscForm.filiere_id ? "Créer + Inscrire" : "Choisir une filière d'abord"}
                </Btn>
              </>
            ) : (
              <>
                <Btn variant="ghost" onClick={onClose} icon={<X size={15} />}>
                  Annuler
                </Btn>
                <Btn
                  type="submit"
                  loading={loading}
                  disabled={!isValid}
                  icon={<Save size={15} />}
                >
                  {isEdit
                    ? "Enregistrer les modifications"
                    : withInscription
                      ? "Suivant → Inscription"
                      : "Créer l'étudiant"}
                </Btn>
              </>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Modal de confirmation de suppression ────────────────────────────────
function DeleteModal({ student, onConfirm, onCancel, loading }) {
  if (!student) return null;

  const [localLoading, setLocalLoading] = useState(false);

  const handleConfirm = async () => {
    setLocalLoading(true);
    await onConfirm();
    setLocalLoading(false);
  };

  return (
    <Modal title="Confirmer la suppression" onClose={onCancel} width={480}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: "16px 0 24px",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))",
            border: "2px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 1.5s infinite",
          }}
        >
          <UserX size={40} color="#ef4444" />
        </div>

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text)",
              margin: "0 0 8px",
            }}
          >
            Supprimer {student.prenom} {student.nom}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              maxWidth: 380,
              margin: "0 auto",
            }}
          >
            Cette action entraînera la suppression définitive de toutes les
            données associées : inscriptions, notes, et documents.
          </p>
          <div
            style={{
              marginTop: 16,
              padding: "10px 16px",
              background: "rgba(239,68,68,0.08)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
              ⚠️ Cette action est irréversible
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
          paddingTop: 20,
          borderTop: "1px solid var(--border)",
        }}
      >
        <Btn
          variant="ghost"
          onClick={onCancel}
          disabled={loading || localLoading}
        >
          Annuler
        </Btn>
        <Btn
          variant="danger"
          onClick={handleConfirm}
          loading={loading || localLoading}
          icon={<Trash2 size={14} />}
        >
          Supprimer définitivement
        </Btn>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </Modal>
  );
}

// ─── Ligne de tableau skeleton (loading) ─────────────────────────────────
function SkeletonRow() {
  const pulse = {
    background:
      "linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: 6,
  };
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "14px 16px", width: 52 }}>
        <div style={{ ...pulse, width: 38, height: 38, borderRadius: "50%" }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 120, height: 14, marginBottom: 6 }} />
        <div style={{ ...pulse, width: 60, height: 11 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 70, height: 14 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 36, height: 22, borderRadius: 20 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 60, height: 22, borderRadius: 20 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 100, height: 30, borderRadius: 8 }} />
      </td>
    </tr>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────
const LIMIT = 20;

export default function EtudiantsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const canEdit = ["administrateur", "secretaire"].includes(user?.role);
  const isAdmin = user?.role === "administrateur";

  const [etudiants, setEtudiants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleTransfertAccepte = (e) => {
      const { etudiantId, etudiantNom, etudiantPrenom } = e.detail || {};
      if (!etudiantId) return;
      setEtudiants((prev) =>
        prev.filter((et) => String(et.id) !== String(etudiantId)),
      );
      setTotal((prev) => Math.max(0, prev - 1));
      setToast({
        message: `${etudiantPrenom} ${etudiantNom} a été transféré et retiré de la liste`,
        type: "info",
        details: "Transfert inter-établissement accepté",
      });
    };
    window.addEventListener("transfert:accepte", handleTransfertAccepte);
    return () =>
      window.removeEventListener("transfert:accepte", handleTransfertAccepte);
  }, []);

  const showNotification = (message, type = "success", details = null) => {
    setToast({ message, type, details });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/etudiants", {
        params: { search, page, limit: LIMIT },
      });
      setEtudiants(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setEtudiants([]);
      showNotification(
        "Impossible de charger la liste des étudiants",
        "error",
        "Veuillez vérifier votre connexion",
      );
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/etudiants/${toDelete.id}`);
      showNotification(
        `Étudiant supprimé avec succès`,
        "success",
        `${toDelete.prenom} ${toDelete.nom} · Toutes ses données ont été effacées`,
      );
      setToDelete(null);
      load();
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      let detail = "Veuillez réessayer ultérieurement";
      if (status === 403) {
        detail = "Vous n'avez pas les droits pour supprimer un étudiant.";
      } else if (status === 404) {
        detail = "Cet étudiant est introuvable.";
      } else if (serverMsg) {
        detail = serverMsg;
      }
      showNotification("Erreur lors de la suppression", "error", detail);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;
  const startRecord = (page - 1) * LIMIT + 1;
  const endRecord = Math.min(page * LIMIT, total);

  return (
    <>
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          details={toast.details}
          onClose={() => setToast(null)}
        />
      )}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes fadeErrIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDropdown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="page-enter"
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
      >
        <PageHeader
          title="Étudiants"
          subtitle={
            total > 0
              ? `${total} étudiant${total > 1 ? "s" : ""} enregistré${total > 1 ? "s" : ""}`
              : "Aucun étudiant"
          }
          action={
            canEdit && (
              <Btn
                onClick={() => setModal("create")}
                icon={<UserPlus size={16} />}
              >
                Nouvel étudiant
              </Btn>
            )
          }
        />

        <div style={{ marginBottom: 24, position: "relative", maxWidth: 460 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par nom, prénom ou matricule…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              borderRadius: 40,
              color: "var(--text)",
              padding: "11px 18px 11px 44px",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxShadow: "var(--shadow-sm)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(99,102,241,0.18)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            border: "2px solid var(--border)",
            overflow: "hidden",
            boxShadow: "var(--shadow)",
            transition: "box-shadow 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-lg)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow)")
          }
        >
          <Table
            headers={[
              "",
              "Étudiant",
              "Date naiss.",
              "Sexe",
              "Téléphone",
              "Adresse",
              "Actions",
            ]}
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : etudiants.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={GraduationCap}
                    title="Aucun étudiant trouvé"
                    description={
                      search
                        ? `Aucun résultat pour "${search}". Essayez un autre terme.`
                        : "Commencez par ajouter votre premier étudiant."
                    }
                    action={
                      canEdit &&
                      !search && (
                        <Btn
                          onClick={() => setModal("create")}
                          icon={<UserPlus size={15} />}
                        >
                          Nouvel étudiant
                        </Btn>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              etudiants.map((e) => (
                <Tr
                  key={e.id}
                  onClick={() => navigate(`/etudiants/${e.id}`)}
                  style={{
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    transform: "scale(1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface2)";
                    e.currentTarget.style.transform = "scale(1.01)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Td style={{ width: 56, paddingRight: 4, paddingLeft: 16 }}>
                    <Avatar
                      photo={e.photo}
                      prenom={e.prenom}
                      nom={e.nom}
                      size={38}
                    />
                  </Td>

                  <Td>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text)",
                        lineHeight: 1.3,
                      }}
                    >
                      {e.prenom} {e.nom}
                    </div>
                    {e.email && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {e.email}
                      </div>
                    )}
                  </Td>

                  <Td>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.date_naissance
                        ? new Date(e.date_naissance).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>
                  </Td>

                  <Td>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {e.sexe === "M" ? "👦 M" : e.sexe === "F" ? "👧 F" : "—"}
                    </span>
                  </Td>

                  <Td>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.telephone || "—"}
                    </span>
                  </Td>

                  <Td>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {e.adresse || "—"}
                    </span>
                  </Td>

                  <Td>
                    <div
                      onClick={(ev) => ev.stopPropagation()}
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      {canEdit && (
                        <>
                          <Tooltip text="Modifier">
                            <Btn
                              small
                              variant="success"
                              onClick={() => setModal(e)}
                              icon={<Edit size={13} />}
                            >
                              Modifier
                            </Btn>
                          </Tooltip>
                          <Tooltip text="Supprimer">
                            <Btn
                              small
                              variant="danger"
                              onClick={() => setToDelete(e)}
                              icon={<Trash2 size={13} />}
                            >
                              Suppr.
                            </Btn>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Table>

          {!loading && total > LIMIT && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderTop: "2px solid var(--border)",
                background: "var(--surface2)",
                borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {startRecord}–{endRecord} sur{" "}
                <strong style={{ color: "var(--text)" }}>{total}</strong>{" "}
                résultats
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Btn
                  small
                  variant="ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  icon={<ChevronLeft size={14} />}
                >
                  Précédent
                </Btn>
                <span
                  style={{
                    padding: "5px 12px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--text)",
                    fontWeight: 600,
                    minWidth: 60,
                    textAlign: "center",
                  }}
                >
                  {page} / {totalPages}
                </span>
                <Btn
                  small
                  variant="ghost"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  icon={<ChevronRight size={14} />}
                >
                  Suivant
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <EtudiantModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            if (page !== 1) {
              setPage(1);
            } else {
              load();
            }
          }}
        />
      )}

      <DeleteModal
        student={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </>
  );
}
