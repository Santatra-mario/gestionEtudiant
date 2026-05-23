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
      <div className={`bg-gradient-to-r ${current.bg} text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 min-w-[360px] max-w-md backdrop-blur-sm border-l-4 ${current.border}`}>
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
        src={`/uploads/${photo}`}
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
  const src = preview || (photo ? `/uploads/${photo}` : null);
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

// ─── Modal étudiant (création / édition) avec notifications modernes ─────────────────────────────────
function EtudiantModal({ onClose, onSaved, initial }) {
  const isEdit = !!initial?.id;
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    nom: initial?.nom || "",
    prenom: initial?.prenom || "",
    date_naissance: initial?.date_naissance?.split("T")[0] || "",
    sexe: initial?.sexe || "M",
    adresse: initial?.adresse || "",
    telephone: initial?.telephone || "",
    email: initial?.email || "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showNotification = (message, type = "success", details = null) => {
    setToast({ message, type, details });
  };

  const today = new Date().toISOString().split("T")[0];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const phoneDigits = form.telephone.replace(/[\s\-\+]/g, "");
  const phoneValid =
    !form.telephone.trim() ||
    /^0[23][0-9]{8}$/.test(phoneDigits) ||
    /^261[23][0-9]{8}$/.test(phoneDigits);
  const phoneError = form.telephone.trim() && !phoneValid
    ? "Numéro invalide — 10 chiffres ex: 034 12 345 67"
    : "";

  const isValid = form.nom.trim() && form.prenom.trim() && form.date_naissance && !phoneError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append("photo", photo);
      if (isEdit) {
        await api.put(`/etudiants/${initial.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showNotification(
          `Informations mises à jour avec succès`,
          "success",
          `${form.prenom} ${form.nom} · Modifications enregistrées`
        );
      } else {
        await api.post("/etudiants", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showNotification(
          `Nouvel étudiant ajouté avec succès`,
          "success",
          `${form.prenom} ${form.nom} · Bienvenue dans la plateforme`
        );
      }
      setTimeout(() => {
        onSaved();
      }, 500);
    } catch (err) {
      setError(formatErrorMessage(err) || Messages.STUDENT_ERROR);
      showNotification(
        "Une erreur est survenue",
        "error",
        "Veuillez vérifier les informations et réessayer"
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
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 0 }}
        >
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
                <Input
                  label="Prénom"
                  required
                  value={form.prenom}
                  onChange={set("prenom")}
                  placeholder="Jean"
                  icon={User}
                  hint="Prénom(s) de l'étudiant"
                />
                <Input
                  label="Nom"
                  required
                  value={form.nom}
                  onChange={set("nom")}
                  placeholder="Rakoto"
                  icon={User}
                  hint="Nom de famille"
                />
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
                <Input
                  label="Téléphone"
                  value={form.telephone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d\s\+\-]/g, "");
                    setForm(f => ({ ...f, telephone: val }));
                  }}
                  placeholder="034 12 345 67"
                  icon={Phone}
                  maxLength={15}
                  error={phoneError}
                  hint="Format Madagascar : 034 XX XXX XX"
                />
                <Input
                  label="Adresse"
                  value={form.adresse}
                  onChange={set("adresse")}
                  placeholder="Antananarivo"
                  icon={MapPin}
                />
              </FormRow>
            </FormSection>
          </div>

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
            <Btn variant="ghost" onClick={onClose} icon={<X size={15} />}>
              Annuler
            </Btn>
            <Btn
              type="submit"
              loading={loading}
              disabled={!isValid}
              icon={<Save size={15} />}
            >
              {isEdit ? "Enregistrer les modifications" : "Créer l'étudiant"}
            </Btn>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Modal de confirmation de suppression moderne ─────────────────────────────────
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
            background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))",
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
            Cette action entraînera la suppression définitive de toutes les données associées :
            inscriptions, notes, et documents.
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
        <Btn variant="ghost" onClick={onCancel} disabled={loading || localLoading}>
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
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
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
        <div style={{ ...pulse, width: 80, height: 14 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 120, height: 14, marginBottom: 6 }} />
        <div style={{ ...pulse, width: 90, height: 11 }} />
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

  const [etudiants, setEtudiants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
        "Veuillez vérifier votre connexion"
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
        `${toDelete.prenom} ${toDelete.nom} · Toutes ses données ont été effacées`
      );
      setToDelete(null);
      load();
    } catch (err) {
      showNotification(
        "Erreur lors de la suppression",
        "error",
        "Veuillez réessayer ultérieurement"
      );
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
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
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
          onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-lg)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow)"}
        >
          <Table
            headers={[
              "",
              "Matricule",
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
                <td colSpan={8}>
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
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "var(--surface2)";
                    e.currentTarget.style.transform = "scale(1.01)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={e => {
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
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "var(--accent-light)",
                        fontWeight: 700,
                        background: "rgba(99,102,241,0.08)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.matricule}
                    </span>
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
                    <span style={{ color: "var(--text-muted)", fontSize: 13, whiteSpace: "nowrap" }}>
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
              setPage(1); // useEffect re-déclenche load() automatiquement
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