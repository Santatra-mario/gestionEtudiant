import { useEffect, useState, useCallback, useRef } from "react";
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
  Lock,
} from "lucide-react";
import api, { getPhotoUrl } from "../services/api";
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

// ─── Composant Toast Notification ─────────────────────────────────────────────
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
      // ✅ [IHM R8] Titre courtois
      title: "Succès",
    },
    error: {
      bg: "from-rose-500 to-red-600",
      icon: <AlertCircle className="w-5 h-5" />,
      border: "border-rose-300",
      // ✅ [IHM R8] Eviter "Erreur" sec — plus courtois
      title: "Une erreur s'est produite",
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
    // ✅ [IHM R11] z-index 99999 garanti au-dessus du modal portal
    // ✅ [IHM R5]  role="alert" + aria-live pour lecteurs d'écran
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 99999,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div
        className={`bg-gradient-to-r ${current.bg} text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 min-w-[360px] max-w-md backdrop-blur-sm border-l-4 ${current.border}`}
      >
        <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
          {current.icon}
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm mb-1">{current.title}</div>
          <div className="text-sm opacity-95">{message}</div>
          {details && (
            <div className="text-xs opacity-80 mt-1.5 pt-1.5 border-t border-white/20">
              {details}
            </div>
          )}
        </div>
        {/* ✅ [IHM R11] aria-label explicite */}
        <button
          onClick={onClose}
          aria-label="Fermer la notification"
          className="hover:opacity-80 transition-opacity flex-shrink-0 -mt-1 -mr-1 p-1"
        >
          <X size={16} aria-hidden="true" />
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
        src={getPhotoUrl(photo)}
        // ✅ [IHM R11] alt descriptif
        alt={`Photo de profil de ${prenom} ${nom}`}
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
      aria-label={`Initiales de ${prenom} ${nom}`}
      role="img"
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
  const src = preview || getPhotoUrl(photo);
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
            alt="Aperçu de la photo de profil"
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
        {/* ✅ [IHM R7] aria-label explicite sur le bouton photo */}
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
          title={src ? "Changer la photo de profil" : "Ajouter une photo de profil"}
          aria-label={src ? "Changer la photo de profil" : "Ajouter une photo de profil"}
        >
          <Camera size={14} color="#fff" aria-hidden="true" />
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

  // ✅ [IHM R10] Fermeture par Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Indicatif : ${selected.name} ${selected.dial}`}
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
        <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">
          {selected.flag}
        </span>
        <span style={{ fontSize: 12 }}>{selected.dial}</span>
        <ChevronDown
          size={12}
          aria-hidden="true"
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
                aria-label="Rechercher un pays"
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
              {/* ✅ [IHM R8] Message explicite si aucun résultat */}
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "12px 14px",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  Aucun pays trouvé pour « {search} »
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
                    <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">
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
// ── Regex & helpers de validation ────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
const NAME_ALLOWED_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ '\-]+$/;
const ADDR_ALLOWED_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ,.\-']+$/;

function filterNameChars(raw) {
  return raw.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ '\-]/g, "");
}

function filterAddrChars(raw) {
  return raw.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 ,.\-']/g, "");
}

// ✅ [IHM R8] Messages d'erreur précis et courtois
function validateNameField(value, label) {
  if (!value) return null;
  if (!value.trim())
    return `${label} ne peut pas contenir uniquement des espaces`;
  if (!NAME_ALLOWED_RE.test(value))
    return `${label} contient des caractères non autorisés (chiffres et symboles interdits)`;
  if (value.trim().length < 2)
    return `${label} doit contenir au moins 2 caractères`;
  return null;
}

function validateAddressField(value) {
  if (!value || !value.trim()) return null;
  if (!ADDR_ALLOWED_RE.test(value))
    return "L'adresse contient des caractères non autorisés";
  return null;
}

// ── Composant d'erreur inline ────────────────────────────────────────────
function FieldErr({ msg }) {
  if (!msg) return null;
  return (
    // ✅ [IHM R11] role="alert" pour lecteurs d'écran
    <span
      role="alert"
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
      <AlertCircle size={11} style={{ flexShrink: 0 }} aria-hidden="true" />
      {msg}
    </span>
  );
}

// ─── Modal étudiant (création / édition) ────────────────────────────────
// ✅ [IHM TOAST FIX] onToast remonte le toast au niveau page (hors du portal modal)
function EtudiantModal({ onClose, onSaved, initial, onToast }) {
  const isEdit = !!initial?.id;
  const [step, setStep] = useState(1);
  const [filieres, setFilieres] = useState([]);
  const [filiereLoading, setFiliereLoading] = useState(false);
  const [withInscription, setWithInscription] = useState(true);

  function getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }
  function getCurrentAcademicYear() {
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }

  const [inscForm, setInscForm] = useState({
    filiere_id: "",
    niveau: "L1",
    annee_universitaire: getCurrentAcademicYear(),
    date_inscription: getTodayDate(),
  });

  // ✅ [IHM R10] Fermeture par Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (isEdit) return;
    setFiliereLoading(true);
    api
      .get("/filieres")
      .then(({ data }) => {
        setFilieres(data.data || []);
      })
      .catch(() => {
        setFilieres([]);
      })
      .finally(() => setFiliereLoading(false));
  }, [isEdit]);

  function parseInitialPhone(telephone) {
    if (!telephone) return { code: "MG", digits: "" };
    const tel = telephone.trim();
    const matched = COUNTRIES.find((c) => tel.startsWith(c.dial));
    if (matched) {
      let digits = tel.slice(matched.dial.length).trim();
      const dialWithoutPlus = matched.dial.replace("+", "");
      if (digits.startsWith(dialWithoutPlus)) {
        digits = digits.slice(dialWithoutPlus.length);
      }
      return { code: matched.code, digits };
    }
    return { code: "MG", digits: tel };
  }
  const { code: initCode, digits: initDigits } = parseInitialPhone(
    initial?.telephone,
  );

  const [form, setForm] = useState({
    password: "",
    password_confirm: "",
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

  const calcAgeExact = (dateStr) => {
    if (!dateStr) return null;
    const dob = new Date(dateStr);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };
  const ageActuel = calcAgeExact(form.date_naissance);
  const ageError =
    form.date_naissance && ageActuel !== null && ageActuel < 13
      ? `L'étudiant a ${ageActuel} an${ageActuel > 1 ? "s" : ""} — l'âge minimum requis est 13 ans.`
      : "";

  // ✅ [IHM TOAST FIX] Remonte le toast au parent via onToast
  const showNotification = (message, type = "success", details = null) => {
    onToast({ message, type, details });
  };

  const today = new Date().toISOString().split("T")[0];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePrenomChange = (e) => {
    const raw = e.target.value;
    const filtered = filterNameChars(raw).replace(/^\s+/, "");
    setForm((f) => ({ ...f, prenom: filtered }));
    setFieldErrors((prev) => ({
      ...prev,
      prenom: validateNameField(filtered, "Le prénom") || "",
    }));
  };

  const handleNomChange = (e) => {
    const raw = e.target.value;
    const filtered = filterNameChars(raw).replace(/^\s+/, "");
    setForm((f) => ({ ...f, nom: filtered }));
    setFieldErrors((prev) => ({
      ...prev,
      nom: validateNameField(filtered, "Le nom") || "",
    }));
  };

  const handleAdresseChange = (e) => {
    const raw = e.target.value;
    const filtered = filterAddrChars(raw);
    setForm((f) => ({ ...f, adresse: filtered }));
    setFieldErrors((prev) => ({
      ...prev,
      adresse: validateAddressField(filtered) || "",
    }));
  };

  const hasFieldError = () =>
    !!(fieldErrors.nom || fieldErrors.prenom || fieldErrors.adresse);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // ✅ [IHM R8] Validation taille avec message explicite
    if (file.size > 2 * 1024 * 1024) {
      showNotification(
        "Photo trop volumineuse",
        "error",
        "La photo doit faire moins de 2 Mo. Veuillez en choisir une autre.",
      );
      return;
    }
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

  // ✅ [IHM R8] Messages téléphone précis et orientés correction
  const phoneError = (() => {
    if (!form.telephone.trim()) return "";
    if (!phoneValid) {
      if (countryCode === "MG") {
        if (/^0/.test(phoneDigits))
          return "Avec +261, ne saisissez pas le 0 initial — ex : 33 187 4598";
        return "Numéro invalide — 9 chiffres sans le 0, ex : 331874598";
      }
      return "Numéro invalide — entre 6 et 15 chiffres attendus";
    }
    return "";
  })();

  const isValid =
    form.nom.trim() &&
    form.prenom.trim() &&
    form.date_naissance &&
    !ageError &&
    !phoneError &&
    !hasFieldError();

  const handleNext = (e) => {
    e.preventDefault();
    if (!isValid) return;
    if (isEdit) {
      handleSubmit(e);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!isValid) return;
    if (ageError) {
      showNotification("Soumission impossible", "error", ageError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      let rawTel = form.telephone.trim().replace(/[\s\-]/g, "");
      const dialWithoutPlus = selectedCountry.dial.replace("+", "");
      if (rawTel.startsWith(dialWithoutPlus))
        rawTel = rawTel.slice(dialWithoutPlus.length);
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
          `Modifications enregistrées avec succès`,
          "success",
          `${form.prenom} ${form.nom} · Profil mis à jour`,
        );
      } else {
        if (withInscription && inscForm.filiere_id) {
          fd.append("inscription", JSON.stringify(inscForm));
        }
        await api.post("/etudiants", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const msgDetail =
          withInscription && inscForm.filiere_id
            ? `${form.prenom} ${form.nom} · Inscrit(e) en ${inscForm.niveau} (${inscForm.annee_universitaire})`
            : `${form.prenom} ${form.nom} · Bienvenue dans la plateforme`;
        showNotification(
          `Nouvel étudiant ajouté avec succès`,
          "success",
          msgDetail,
        );
      }
      setTimeout(() => {
        onSaved();
      }, 500);
    } catch (err) {
      // ✅ [IHM R8] Messages d'erreur précis selon code HTTP
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      let userMessage = "Impossible d'enregistrer les données";
      let userDetail = "Veuillez vérifier les informations saisies et réessayer";

      if (status === 409) {
        userMessage = "Cet étudiant existe déjà";
        userDetail = "Un étudiant avec le même e-mail est déjà enregistré.";
      } else if (status === 422) {
        userMessage = "Certains champs sont invalides";
        userDetail = serverMsg || "Vérifiez les champs et corrigez-les.";
      } else if (status === 403) {
        userMessage = "Action non autorisée";
        userDetail = "Vous n'avez pas les droits pour effectuer cette action.";
      } else if (status >= 500) {
        userMessage = "Erreur du serveur";
        userDetail = "Le serveur est indisponible. Réessayez dans quelques instants.";
      } else if (serverMsg) {
        userDetail = serverMsg;
      }

      setError(`${userMessage} — ${userDetail}`);
      showNotification(userMessage, "error", userDetail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: 0 }}
        >
          {/* ── Indicateur de step (création seulement) ── */}
          {!isEdit && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {/* ✅ [IHM R5] Progression visible */}
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", marginRight: 8 }}>
                Étape {step}/2
              </span>
              {[1, 2].map((s) => (
                <div
                  key={s}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    aria-current={step === s ? "step" : undefined}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background:
                        step >= s ? "var(--accent)" : "var(--surface2)",
                      border: `2px solid ${step >= s ? "var(--accent)" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: step >= s ? "#fff" : "var(--text-muted)",
                      transition: "all .2s",
                    }}
                  >
                    {s}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: step === s ? "var(--text)" : "var(--text-muted)",
                      fontWeight: step === s ? 600 : 400,
                    }}
                  >
                    {s === 1 ? "Identité" : "Inscription"}
                  </span>
                  {s === 1 && (
                    <span style={{ color: "var(--border)", fontSize: 12 }} aria-hidden="true">
                      →
                    </span>
                  )}
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
              <div style={{ margin: "12px 0 4px" }} role="alert">
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
                    <Input
                      label="Prénom"
                      required
                      autoFocus
                      value={form.prenom}
                      onChange={handlePrenomChange}
                      placeholder="Jean Marie"
                      icon={User}
                      hint="Lettres et espaces uniquement"
                      error={fieldErrors.prenom}
                      aria-required="true"
                      aria-invalid={!!fieldErrors.prenom}
                    />
                    <FieldErr msg={fieldErrors.prenom} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
                    <Input
                      label="Nom"
                      required
                      value={form.nom}
                      onChange={handleNomChange}
                      placeholder="Rakoto"
                      icon={User}
                      hint="Lettres et espaces uniquement"
                      error={fieldErrors.nom}
                      aria-required="true"
                      aria-invalid={!!fieldErrors.nom}
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
                    aria-required="true"
                    aria-invalid={!!ageError}
                    style={
                      ageError
                        ? {
                            borderColor: "#DC2626",
                            boxShadow: "0 0 0 3px #FEE2E2",
                            outline: "none",
                          }
                        : undefined
                    }
                  />
                  {/* ✅ [IHM R8] Message d'erreur âge précis et courtois */}
                  {ageError && (
                    <div
                      role="alert"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                      }}
                    >
                      <AlertCircle size={16} style={{ color: "#DC2626", flexShrink: 0 }} aria-hidden="true" />
                      <div>
                        <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
                          {ageError}
                        </span>
                        <div style={{ fontSize: 12, color: "#9B1C1C", marginTop: 2 }}>
                          L'âge minimum pour s'inscrire est de 13 ans.
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ✅ [IHM R5] Confirmation positive */}
                  {form.date_naissance && !ageError && (
                    <div
                      role="status"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 6,
                        fontSize: 12,
                        color: "#16A34A",
                        fontWeight: 500,
                      }}
                    >
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {ageActuel} ans — âge valide
                    </div>
                  )}
                  <Select
                    label="Sexe"
                    required
                    value={form.sexe}
                    onChange={set("sexe")}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
                    <label
                      htmlFor="telephone-input"
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
                    <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
                      <CountryDialPicker
                        value={countryCode}
                        onChange={setCountryCode}
                      />
                      <div style={{ position: "relative", flex: 1 }}>
                        <Phone
                          size={14}
                          aria-hidden="true"
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
                          id="telephone-input"
                          value={form.telephone}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^\d\s\-]/g, "");
                            if (countryCode === "MG" && val.startsWith("0")) {
                              val = val.replace(/^0+/, "");
                            }
                            setForm((f) => ({ ...f, telephone: val }));
                          }}
                          placeholder="XX XX XXX XX"
                          maxLength={15}
                          aria-invalid={!!phoneError}
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
                            e.currentTarget.style.borderColor = phoneError ? "#ef4444" : "var(--accent)";
                            e.currentTarget.style.boxShadow = phoneError
                              ? "0 0 0 3px rgba(239,68,68,0.14)"
                              : "0 0 0 3px rgba(99,102,241,0.18)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = phoneError ? "#ef4444" : "var(--border)";
                            e.currentTarget.style.boxShadow = phoneError
                              ? "0 0 0 3px rgba(239,68,68,0.14)"
                              : "none";
                          }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      {selectedCountry.flag} {selectedCountry.name} · {selectedCountry.dial}
                      {countryCode === "MG" && (
                        <span style={{ color: "var(--accent-light)", marginLeft: 6 }}>
                          · sans le 0 initial
                        </span>
                      )}
                    </span>
                    {phoneError && (
                      <span
                        role="alert"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          color: "#DC2626",
                          fontWeight: 500,
                          marginTop: 4,
                          animation: "fadeErrIn .2s ease both",
                        }}
                      >
                        <AlertCircle size={11} style={{ flexShrink: 0 }} aria-hidden="true" />
                        {phoneError}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
                    <Input
                      label="Adresse"
                      value={form.adresse}
                      onChange={handleAdresseChange}
                      placeholder="Antananarivo"
                      icon={MapPin}
                      error={fieldErrors.adresse}
                      aria-invalid={!!fieldErrors.adresse}
                    />
                    <FieldErr msg={fieldErrors.adresse} />
                  </div>
                </FormRow>
              </FormSection>

              {/* ✅ [IHM R6] Label clair "Mot de passe" au lieu de "Code de Confirmation" ambigu */}
              {!isEdit && (
                <FormSection title="Mot de passe (portail étudiant)" icon={Lock}>
                  <Input
                    label="Mot de passe d'accès au portail étudiant"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="••••••••"
                    icon={Lock}
                    hint="Minimum 6 caractères"
                  />
                  <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    value={form.password_confirm}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password_confirm: e.target.value }))
                    }
                    placeholder="••••••••"
                    icon={Lock}
                    // ✅ [IHM R8] Message précis sur la confirmation
                    error={
                      form.password &&
                      form.password_confirm &&
                      form.password !== form.password_confirm
                        ? "Les deux mots de passe ne correspondent pas"
                        : ""
                    }
                  />
                </FormSection>
              )}
            </div>
          </div>
          {/* fin step 1 */}

          {/* ══ STEP 2 : inscription initiale (création seulement) ══ */}
          {!isEdit && step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: withInscription ? "rgba(99,102,241,0.08)" : "var(--surface2)",
                  border: `1px solid ${withInscription ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all .2s",
                }}
                onClick={() => setWithInscription((v) => !v)}
                role="checkbox"
                aria-checked={withInscription}
                tabIndex={0}
                onKeyDown={(e) => e.key === " " && setWithInscription((v) => !v)}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: withInscription ? "var(--accent)" : "var(--surface)",
                    border: `2px solid ${withInscription ? "var(--accent)" : "var(--border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all .2s",
                  }}
                >
                  {withInscription && (
                    <span style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>✓</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    Inscrire immédiatement
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Créer l'inscription en même temps que le profil
                  </div>
                </div>
              </div>

              {withInscription && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label
                      htmlFor="filiere-select"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Filière <span style={{ color: "var(--danger)" }} aria-label="obligatoire">*</span>
                    </label>
                    {filiereLoading ? (
                      <div
                        role="status"
                        aria-label="Chargement des filières"
                        style={{
                          padding: "10px 14px",
                          background: "var(--surface2)",
                          borderRadius: 8,
                          fontSize: 13,
                          color: "var(--text-muted)",
                        }}
                      >
                        Chargement des filières…
                      </div>
                    ) : (
                      <select
                        id="filiere-select"
                        value={inscForm.filiere_id}
                        onChange={(e) =>
                          setInscForm((f) => ({ ...f, filiere_id: e.target.value }))
                        }
                        aria-required="true"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          color: "var(--text)",
                          fontSize: 14,
                          outline: "none",
                        }}
                      >
                        <option value="">-- Choisir une filière --</option>
                        {filieres.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nom} ({f.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label
                        htmlFor="niveau-select"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Niveau
                      </label>
                      <select
                        id="niveau-select"
                        value={inscForm.niveau}
                        onChange={(e) =>
                          setInscForm((f) => ({ ...f, niveau: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          color: "var(--text)",
                          fontSize: 14,
                          outline: "none",
                        }}
                      >
                        {["L1", "L2", "L3", "M1", "M2"].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        htmlFor="annee-input"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Année universitaire
                      </label>
                      <input
                        id="annee-input"
                        value={inscForm.annee_universitaire}
                        onChange={(e) =>
                          setInscForm((f) => ({ ...f, annee_universitaire: e.target.value }))
                        }
                        placeholder="2025-2026"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px 14px",
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          color: "var(--text)",
                          fontSize: 14,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="date-insc-input"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Date d'inscription
                    </label>
                    <input
                      id="date-insc-input"
                      type="date"
                      value={inscForm.date_inscription}
                      onChange={(e) =>
                        setInscForm((f) => ({ ...f, date_inscription: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--text)",
                        fontSize: 14,
                        outline: "none",
                      }}
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
                  disabled={withInscription && !inscForm.filiere_id}
                  icon={<Save size={15} />}
                >
                  {withInscription && inscForm.filiere_id
                    ? "Créer + Inscrire"
                    : "Créer sans inscription"}
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
                  {isEdit ? "Enregistrer les modifications" : "Suivant →"}
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

  // ✅ [IHM R10] Fermeture par Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !loading && !localLoading) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, loading, localLoading]);

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
          aria-hidden="true"
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
            Supprimer {student.prenom} {student.nom} ?
          </p>
          {/* ✅ [IHM R8] Explication précise des conséquences */}
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              maxWidth: 380,
              margin: "0 auto",
            }}
          >
            Cette action supprimera définitivement toutes les données associées :
            inscriptions, notes et documents.
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
            {/* ✅ [IHM R8] Avertissement courtois sans "fatal" */}
            <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
              ⚠️ Cette action est irréversible — vérifiez avant de confirmer
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
        {/* ✅ [IHM R10] Annuler toujours disponible */}
        <Btn
          variant="ghost"
          onClick={onCancel}
          disabled={loading || localLoading}
          aria-label="Annuler la suppression"
        >
          Annuler
        </Btn>
        <Btn
          variant="danger"
          onClick={handleConfirm}
          loading={loading || localLoading}
          icon={<Trash2 size={14} />}
          aria-label={`Confirmer la suppression de ${student.prenom} ${student.nom}`}
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
    <tr style={{ borderBottom: "1px solid var(--border)" }} aria-hidden="true">
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

  // ✅ [IHM TOAST FIX] Toast unique au niveau page — visible même quand modal est ouvert
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

  // ✅ [IHM R9] Debounce recherche — évite une requête à chaque frappe
  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 350);
  };

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const showNotification = (message, type = "success", details = null) => {
    setToast({ message, type, details });
  };

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

  // ✅ [IHM R9] Utilise debouncedSearch pour les appels API
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/etudiants", {
        params: { search: debouncedSearch, page, limit: LIMIT },
      });
      setEtudiants(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setEtudiants([]);
      // ✅ [IHM R8] Message réseau précis
      showNotification(
        "Impossible de charger la liste",
        "error",
        "Vérifiez votre connexion internet et réessayez",
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

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
      // ✅ [IHM R8] Messages précis selon code HTTP
      let msg = "Suppression impossible";
      let detail = "Veuillez réessayer dans quelques instants";
      if (status === 403) {
        detail = "Vous n'avez pas les droits pour supprimer un étudiant.";
      } else if (status === 404) {
        detail = "Cet étudiant est introuvable — il a peut-être déjà été supprimé.";
      } else if (serverMsg) {
        detail = serverMsg;
      }
      showNotification(msg, "error", detail);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;
  const startRecord = (page - 1) * LIMIT + 1;
  const endRecord = Math.min(page * LIMIT, total);

  return (
    <>
      {/* ✅ [IHM TOAST FIX] Toast ici au niveau page, hors du portal Modal → toujours visible */}
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
            // ✅ [IHM R5] Feedback contextuel sur les résultats
            loading
              ? "Chargement en cours…"
              : total > 0
                ? `${total} étudiant${total > 1 ? "s" : ""} enregistré${total > 1 ? "s" : ""}${debouncedSearch ? ` pour « ${debouncedSearch} »` : ""}`
                : debouncedSearch
                  ? `Aucun résultat pour « ${debouncedSearch} »`
                  : "Aucun étudiant enregistré"
          }
          action={
            canEdit && (
              <Btn
                onClick={() => setModal("create")}
                icon={<UserPlus size={16} />}
                aria-label="Ajouter un nouvel étudiant"
              >
                Nouvel étudiant
              </Btn>
            )
          }
        />

        {/* ✅ [IHM R3] Barre de recherche avec role="search" */}
        <div
          role="search"
          aria-label="Rechercher un étudiant"
          style={{ marginBottom: 24, position: "relative", maxWidth: 460 }}
        >
          <Search
            size={16}
            aria-hidden="true"
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
            onChange={handleSearchChange}
            placeholder="Rechercher par nom, prénom ou matricule…"
            aria-label="Rechercher un étudiant par nom, prénom ou matricule"
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
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.18)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          />
          {/* ✅ [IHM R10] Bouton effacer recherche */}
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setPage(1);
              }}
              aria-label="Effacer la recherche"
              title="Effacer la recherche"
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
              <X size={14} aria-hidden="true" />
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
            aria-label="Liste des étudiants"
            aria-busy={loading}
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : etudiants.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={GraduationCap}
                    title="Aucun étudiant trouvé"
                    // ✅ [IHM R8] Message état vide contextuel
                    description={
                      debouncedSearch
                        ? `Aucun résultat pour « ${debouncedSearch} ». Essayez avec un autre nom ou matricule.`
                        : "Aucun étudiant n'est encore enregistré. Commencez par en ajouter un."
                    }
                    action={
                      canEdit && !debouncedSearch && (
                        <Btn
                          onClick={() => setModal("create")}
                          icon={<UserPlus size={15} />}
                        >
                          Ajouter un étudiant
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
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Td style={{ width: 56, paddingRight: 4, paddingLeft: 16 }}>
                    <Avatar photo={e.photo} prenom={e.prenom} nom={e.nom} size={38} />
                  </Td>

                  <Td>
                    <div style={{ fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
                      {e.prenom} {e.nom}
                    </div>
                    {e.email && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {e.email}
                      </div>
                    )}
                  </Td>

                  <Td>
                    <span style={{ color: "var(--text-muted)", fontSize: 13, whiteSpace: "nowrap" }}>
                      {e.date_naissance
                        ? new Date(e.date_naissance).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>
                  </Td>

                  <Td>
                    {/* ✅ [IHM R11] aria-label pour emoji non lisible par lecteur d'écran */}
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {e.sexe === "M"
                        ? <span aria-label="Masculin">  M</span>
                        : e.sexe === "F"
                          ? <span aria-label="Féminin"> F</span>
                          : "—"}
                    </span>
                  </Td>

                  <Td>
                    <span style={{ color: "var(--text-muted)", fontSize: 13, whiteSpace: "nowrap" }}>
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
                          {/* ✅ [IHM R7] aria-label explicite sur chaque action */}
                          <Tooltip text="Modifier les informations">
                            <Btn
                              small
                              variant="success"
                              onClick={() => setModal(e)}
                              icon={<Edit size={13} />}
                              aria-label={`Modifier ${e.prenom} ${e.nom}`}
                            >
                              Modifier
                            </Btn>
                          </Tooltip>
                          <Tooltip text="Supprimer cet étudiant">
                            <Btn
                              small
                              variant="danger"
                              onClick={() => setToDelete(e)}
                              icon={<Trash2 size={13} />}
                              aria-label={`Supprimer ${e.prenom} ${e.nom}`}
                            >
                              Supprimer
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

          {/* ✅ [IHM R9] Pagination accessible */}
          {!loading && total > LIMIT && (
            <nav
              aria-label="Pagination de la liste"
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
              <span
                style={{ fontSize: 13, color: "var(--text-muted)" }}
                aria-live="polite"
                aria-atomic="true"
              >
                {startRecord}–{endRecord} sur{" "}
                <strong style={{ color: "var(--text)" }}>{total}</strong>{" "}
                étudiants
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Btn
                  small
                  variant="ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  icon={<ChevronLeft size={14} />}
                  aria-label="Page précédente"
                >
                  Précédent
                </Btn>
                <span
                  aria-current="page"
                  aria-label={`Page ${page} sur ${totalPages}`}
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
                  aria-label="Page suivante"
                >
                  Suivant
                </Btn>
              </div>
            </nav>
          )}
        </div>
      </div>

      {modal && (
        <EtudiantModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          // ✅ [IHM TOAST FIX] onToast reçoit le toast du modal et l'affiche ici au niveau page
          onToast={(t) => setToast(t)}
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