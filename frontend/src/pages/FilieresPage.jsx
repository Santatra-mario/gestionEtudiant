import { useEffect, useState, useCallback } from "react";
import {
  X,
  Save,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GraduationCap,
  User,
  Code,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  UserCog,
  Briefcase,
  Layers,
  BookMarked,
  FileText,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification, NotificationDisplay } from "../hooks/useNotification";
import {
  PageHeader,
  Btn,
  Card,
  Modal,
  Input,
  Alert,
  Badge,
  Spinner,
} from "../components/ui";

// ─── Styles globaux modernes ───────────────────────────────────────────────
const MODERN_STYLES = `
  .modern-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .modern-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
  }
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .slide-down {
    animation: slideDown 0.3s ease-out;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: scaleY(0); }
    to { opacity: 1; transform: scaleY(1); }
  }
`;

// ─── Composant Badge Niveau Moderne ────────────────────────────────────────
function NiveauBadge({ niveau, taille = "medium" }) {
  const niveauConfig = {
    L1: {
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      icon: <BookOpen size={12} />,
    },
    L2: {
      bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      icon: <Layers size={12} />,
    },
    L3: {
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      icon: <GraduationCap size={12} />,
    },
    M1: {
      bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      icon: <Briefcase size={12} />,
    },
    M2: {
      bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      icon: <Award size={12} />,
    },
  };

  const config = niveauConfig[niveau] || niveauConfig.L1;
  const padding = taille === "small" ? "2px 8px" : "4px 12px";
  const fontSize = taille === "small" ? 11 : 13;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: config.bg,
        color: "white",
        padding: padding,
        borderRadius: 20,
        fontSize: fontSize,
        fontWeight: 600,
        letterSpacing: "0.02em",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {config.icon}
      {niveau}
    </span>
  );
}

// ─── Bouton "Modifier" moderne ─────────────────────────────────────────────
function BtnModifier({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 500,
        borderRadius: 8,
        border: "none",
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "#fff",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(16,185,129,0.2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(16,185,129,0.2)";
      }}
    >
      <Edit size={14} />
      {children}
    </button>
  );
}

// ─── Composant Select Moderne ──────────────────────────────────────────────
function ModernSelect({
  label,
  value,
  onChange,
  options,
  required,
  icon: Icon,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: "100%",
      }}
    >
      <label
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {Icon && <Icon size={14} />}
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "var(--text)",
          padding: "10px 12px",
          fontSize: 14,
          outline: "none",
          width: "100%",
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#c9a227";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,162,39,0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {options}
      </select>
    </div>
  );
}

// ─── Composant Input Moderne ───────────────────────────────────────────────
function ModernInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  icon: Icon,
  disabled,
  min,
  max,
  step,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: "100%",
      }}
    >
      <label
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {Icon && <Icon size={14} />}
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "var(--text)",
          padding: "10px 12px",
          fontSize: 14,
          outline: "none",
          width: "100%",
          transition: "all 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#c9a227";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,162,39,0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// --- MODAL DE CONFIRMATION MODERNE ---
function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;
  return (
    <Modal title={title || "Confirmation"} onClose={onCancel} width={440}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: "8px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(239,68,68,0.1)",
            padding: 16,
            borderRadius: 12,
          }}
        >
          <AlertTriangle size={24} color="#ef4444" />
          <p style={{ fontSize: 14, color: "var(--text)", margin: 0, flex: 1 }}>
            {message}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>
            Annuler
          </Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Suppression..." : "Confirmer"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// --- MODAL FILIÈRE MODERNE ---
function FiliereModal({ onClose, onSaved, initial }) {
  const [form, setForm] = useState(
    initial || { code: "", nom: "", description: "" },
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isFormValid = form.code.trim() !== "" && form.nom.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError("");
    setLoading(true);
    try {
      if (initial?.id) {
        await api.put(`/filieres/${initial.id}`, form);
      } else {
        await api.post("/filieres", form);
      }
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initial ? "Modifier filière" : "Nouvelle filière"}
      onClose={onClose}
      width={500}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 18 }}
      >
        {error && <Alert style={{ width: "100%" }}>{error}</Alert>}

        <ModernInput
          label="Code"
          icon={Code}
          value={form.code}
          onChange={set("code")}
          placeholder="ex: INFO"
          required
          disabled={!!initial?.id}
        />

        <ModernInput
          label="Nom"
          icon={BookMarked}
          value={form.nom}
          onChange={set("nom")}
          placeholder="ex: Informatique"
          required
        />

        <ModernInput
          label="Description"
          icon={FileText}
          value={form.description || ""}
          onChange={set("description")}
          placeholder="Description optionnelle"
        />

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            <X size={16} style={{ marginRight: 6 }} /> Annuler
          </Btn>
          <Btn type="submit" disabled={loading || !isFormValid}>
            <Save size={16} style={{ marginRight: 6 }} />
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Semestres valides S1 → S10
const SEMESTRES_VALIDES = [
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "S9",
  "S10",
];
const NIVEAU_SEMESTRES = {
  L1: ["S1", "S2"],
  L2: ["S3", "S4"],
  L3: ["S5", "S6"],
  M1: ["S7", "S8"],
  M2: ["S9", "S10"],
};

// --- MODAL MATIÈRE MODERNE ---
function MatiereModal({ filiereId, onClose, onSaved, initial }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, enseignant_id: initial.enseignant_id ?? "" }
      : {
          filiere_id: filiereId,
          codemat: "",
          nom: "",
          coefficient: 1,
          semestre: "S1",
          enseignant_id: "",
        },
  );
  const [enseignants, setEnseignants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    api
      .get("/filieres/enseignants/liste")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setEnseignants(list);
      })
      .catch(() => setEnseignants([]));
  }, []);

  const isFormValid = () => {
    const codeOk = form.codemat.trim() !== "";
    const nomOk = form.nom.trim() !== "";
    const coeff = parseFloat(form.coefficient);
    const coeffOk = !isNaN(coeff) && coeff >= 0.5 && coeff <= 10;
    const semestreOk = SEMESTRES_VALIDES.includes(form.semestre);
    return codeOk && nomOk && coeffOk && semestreOk;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        enseignant_id:
          form.enseignant_id === "" ? null : parseInt(form.enseignant_id, 10),
      };
      if (initial?.id) {
        await api.put(`/filieres/matieres/${initial.id}`, payload);
      } else {
        await api.post("/filieres/matieres", payload);
      }
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'enregistrement de la matière.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getNiveauFromSemestre = (semestre) => {
    for (const [niveau, semestres] of Object.entries(NIVEAU_SEMESTRES)) {
      if (semestres.includes(semestre)) return niveau;
    }
    return null;
  };

  const currentNiveau = getNiveauFromSemestre(form.semestre);

  return (
    <Modal
      title={initial ? "Modifier matière" : "Nouvelle matière"}
      onClose={onClose}
      width={520}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 18 }}
      >
        {error && <Alert style={{ width: "100%" }}>{error}</Alert>}

        <ModernInput
          label="Code"
          icon={Code}
          value={form.codemat}
          onChange={set("codemat")}
          placeholder="ex: ALGO1"
          required
          disabled={!!initial?.id}
        />

        <ModernInput
          label="Nom"
          icon={BookMarked}
          value={form.nom}
          onChange={set("nom")}
          placeholder="ex: Algorithmique 1"
          required
        />

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <ModernInput
            label="Coefficient"
            icon={Award}
            type="number"
            min="1"
            max="10"
            step="0.5"
            value={form.coefficient}
            onChange={set("coefficient")}
            required
          />

          <ModernSelect
            label="Semestre"
            icon={Calendar}
            value={form.semestre}
            onChange={set("semestre")}
            options={
              <>
                {Object.entries(NIVEAU_SEMESTRES).map(([niveau, sems]) => (
                  <optgroup key={niveau} label={`─ ${niveau} ─`}>
                    {sems.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </>
            }
            required
          />
        </div>

        {/* Bloc d'affichage du niveau sélectionné */}
        {currentNiveau && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "14px",
              background:
                "linear-gradient(135deg, rgba(201,162,39,0.1) 0%, rgba(201,162,39,0.05) 100%)",
              borderRadius: 12,
              border: "1px solid rgba(201,162,39,0.2)",
            }}
          >
            <GraduationCap size={20} color="#c9a227" />
            <span
              style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}
            >
              Niveau :
            </span>
            <NiveauBadge niveau={currentNiveau} />
          </div>
        )}

        <ModernSelect
          label="Enseignant assigné"
          icon={UserCog}
          value={form.enseignant_id ?? ""}
          onChange={set("enseignant_id")}
          options={
            <>
              <option value="">— Aucun enseignant assigné —</option>
              {enseignants.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom_complet}
                </option>
              ))}
            </>
          }
        />

        <span
          style={{ fontSize: 11, color: "var(--text-muted)", marginTop: -8 }}
        >
          L'enseignant assigné pourra saisir les notes de cette matière.
        </span>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            <X size={16} style={{ marginRight: 6 }} /> Annuler
          </Btn>
          <Btn type="submit" disabled={loading || !isFormValid()}>
            <Save size={16} style={{ marginRight: 6 }} />
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function FilieresPage() {
  const { user } = useAuth();
  const {
    notification,
    hideNotification,
    success,
    error: showError,
  } = useNotification();

  const canManageFilieres =
    user?.role === "administrateur" || user?.role === "secretaire";
  const isAdmin = user?.role === "administrateur";

  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [matieres, setMatieres] = useState({});
  const [matiereModal, setMatiereModal] = useState(null);
  const [activeButton, setActiveButton] = useState(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

  const openConfirm = (message, onConfirm, title = "Confirmation") => {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        onConfirm();
      },
      loading: false,
    });
  };

  const closeConfirm = () => {
    setConfirmState({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
      loading: false,
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await api.get("/filieres");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setFilieres(list);
    } catch {
      setLoadError(true);
      setFilieres([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMatieres = async (filiereId) => {
    try {
      const { data } = await api.get(`/filieres/${filiereId}/matieres`);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setMatieres((m) => ({ ...m, [filiereId]: list }));
    } catch {
      setMatieres((m) => ({ ...m, [filiereId]: [] }));
    }
  };

  const toggleExpand = (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    loadMatieres(id);
  };

  const handleDeleteFiliere = async (id, nom) => {
    try {
      await api.delete(`/filieres/${id}`);
      success(`Filière "${nom}" désactivée avec succès.`);
      load();
      closeConfirm();
    } catch (err) {
      showError(
        err.response?.data?.message || "Erreur lors de la désactivation.",
      );
      closeConfirm();
    }
  };

  const handleDeleteMatiere = async (id, filiereId, nom) => {
    try {
      await api.delete(`/filieres/matieres/${id}`);
      success(`Matière "${nom}" supprimée avec succès.`);
      loadMatieres(filiereId);
      closeConfirm();
    } catch (err) {
      showError(
        err.response?.data?.message || "Erreur lors de la suppression.",
      );
      closeConfirm();
    }
  };

  if (loadError) {
    return (
      <div>
        <PageHeader
          title="Filières & Matières"
          subtitle="Gestion des filières et de leurs matières"
        />
        <Card>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ color: "var(--danger)", marginBottom: 12 }}>
              Impossible de charger les filières.
            </p>
            <Btn onClick={load}>Réessayer</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <style>{MODERN_STYLES}</style>
      <NotificationDisplay
        notification={notification}
        onClose={hideNotification}
      />

      <PageHeader
        title="Filières & Matières"
        subtitle={`${filieres.length} filière(s) active(s)`}
        action={
          canManageFilieres && (
            <Btn onClick={() => setModal("create")} icon={<Plus size={16} />}>
              Nouvelle filière
            </Btn>
          )
        }
      />

      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filieres.length === 0 && (
            <Card>
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <GraduationCap
                  size={48}
                  color="var(--text-muted)"
                  style={{ marginBottom: 16, opacity: 0.5 }}
                />
                <p style={{ color: "var(--text-muted)" }}>
                  Aucune filière active.{" "}
                  {canManageFilieres &&
                    "Créez la première filière avec le bouton ci-dessus."}
                </p>
              </div>
            </Card>
          )}

          {filieres.map((f) => (
            <Card
              key={f.id}
              style={{ padding: 0, overflow: "hidden" }}
              className="modern-card"
            >
              {/* ── En-tête filière ── */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 24px",
                  cursor: "pointer",
                  background: "var(--surface)",
                  transition: "background 0.2s ease",
                }}
                onClick={() => toggleExpand(f.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--surface)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background:
                        "linear-gradient(135deg, #c9a227 0%, #a07c18 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Briefcase size={20} color="white" />
                  </div>
                  <div>
                    <Badge color="accent" style={{ marginBottom: 4 }}>
                      {f.code}
                    </Badge>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--text)",
                        fontSize: 16,
                      }}
                    >
                      {f.nom}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <BookOpen size={12} />
                    {f.nb_matieres} matière(s)
                  </span>
                  {f.description && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      {f.description}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {canManageFilieres && (
                    <BtnModifier
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveButton(`filiere-${f.id}`);
                        setModal(f);
                      }}
                    >
                      Modifier
                    </BtnModifier>
                  )}
                  {canManageFilieres && (
                    <Btn
                      small
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirm(
                          `Désactiver la filière "${f.nom}" ?`,
                          () => handleDeleteFiliere(f.id, f.nom),
                          "Désactivation",
                        );
                      }}
                    >
                      <Trash2 size={14} style={{ marginRight: 6 }} />
                      Désactiver
                    </Btn>
                  )}
                  <span
                    style={{
                      color: "var(--text-muted)",
                      padding: "0 4px",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(f.id);
                    }}
                  >
                    {expanded === f.id ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </span>
                </div>
              </div>

              {/* ── Matières ── */}
              {expanded === f.id && (
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    padding: "20px 24px",
                    background: "var(--surface2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Liste des matières
                    </span>
                  </div>

                  {!matieres[f.id] ? (
                    <Spinner />
                  ) : matieres[f.id].length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <BookMarked
                        size={32}
                        color="var(--text-muted)"
                        style={{ opacity: 0.5, marginBottom: 12 }}
                      />
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        Aucune matière pour cette filière.
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 13,
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background: "var(--surface)",
                              borderBottom: "2px solid var(--border)",
                            }}
                          >
                            {[
                              "Code",
                              "Matière",
                              "Semestre",
                              "Niveau",
                              "Coeff.",
                              "Enseignant",
                              canManageFilieres ? "Actions" : "",
                            ].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--text-muted)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {matieres[f.id].map((m) => {
                            const niveau = Object.entries(
                              NIVEAU_SEMESTRES,
                            ).find(([_, sems]) =>
                              sems.includes(m.semestre),
                            )?.[0];

                            return (
                              <tr
                                key={m.id}
                                style={{
                                  borderBottom: "1px solid var(--border)",
                                  transition: "background 0.12s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "var(--surface)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }}
                              >
                                <td style={{ padding: "10px 12px" }}>
                                  <code
                                    style={{
                                      fontSize: 11,
                                      color: "var(--accent-light)",
                                      fontWeight: 700,
                                      background: "rgba(99,102,241,0.08)",
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                    }}
                                  >
                                    {m.codemat || m.code_matiere || "—"}
                                  </code>
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    fontWeight: 600,
                                    color: "var(--text)",
                                  }}
                                >
                                  {m.nom || m.nom_matiere}
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  <Badge color="accent">{m.semestre}</Badge>
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  {niveau && (
                                    <NiveauBadge
                                      niveau={niveau}
                                      taille="small"
                                    />
                                  )}
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <Award size={12} color="var(--warning)" />
                                    {m.coefficient || m.credit || "—"}
                                  </span>
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  {m.enseignant_nom ? (
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: "#10b981",
                                        background: "rgba(16,185,129,0.1)",
                                        borderRadius: 6,
                                        padding: "3px 8px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <User size={12} />
                                      {m.enseignant_nom}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: "var(--text-muted)",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Non assigné
                                    </span>
                                  )}
                                </td>
                                {canManageFilieres && (
                                  <td style={{ padding: "10px 12px" }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 4,
                                      }}
                                    >
                                      <BtnModifier
                                        onClick={() => {
                                          setActiveButton(`matiere-${m.id}`);
                                          setMatiereModal({
                                            filiereId: f.id,
                                            initial: m,
                                          });
                                        }}
                                      >
                                        Modifier
                                      </BtnModifier>
                                      <Btn
                                        small
                                        variant="danger"
                                        onClick={() =>
                                          openConfirm(
                                            `Supprimer la matière "${m.nom || m.nom_matiere}" ? Cette action est irréversible.`,
                                            () =>
                                              handleDeleteMatiere(
                                                m.id,
                                                f.id,
                                                m.nom || m.nom_matiere,
                                              ),
                                            "Suppression",
                                          )
                                        }
                                      >
                                        <Trash2
                                          size={13}
                                          style={{ marginRight: 4 }}
                                        />
                                        Supprimer
                                      </Btn>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
        loading={confirmState.loading}
      />

      {modal && (
        <FiliereModal
          initial={modal === "create" ? null : modal}
          onClose={() => {
            setModal(null);
            setActiveButton(null);
          }}
          onSaved={() => {
            const isEdit = modal !== "create";
            success(
              isEdit
                ? `Filière "${modal.nom}" modifiée avec succès.`
                : "Nouvelle filière créée avec succès.",
            );
            setModal(null);
            setActiveButton(null);
            load();
          }}
        />
      )}

      {matiereModal && (
        <MatiereModal
          filiereId={matiereModal.filiereId}
          initial={matiereModal.initial}
          onClose={() => {
            setMatiereModal(null);
            setActiveButton(null);
          }}
          onSaved={() => {
            const isEdit = !!matiereModal.initial;
            success(
              isEdit
                ? `Matière "${matiereModal.initial.nom}" modifiée avec succès.`
                : "Nouvelle matière ajoutée avec succès.",
            );
            loadMatieres(matiereModal.filiereId);
            setMatiereModal(null);
            setActiveButton(null);
          }}
        />
      )}
    </div>
  );
}
