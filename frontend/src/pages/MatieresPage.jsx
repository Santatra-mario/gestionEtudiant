// pages/MatieresPage.jsx – Gestion complète des matières
import { useEffect, useState, useCallback } from "react";
import {
  X,
  Save,
  Edit,
  Trash2,
  Plus,
  BookOpen,
  Search,
  GraduationCap,
  Clock,
  Award,
  Filter,
  RotateCcw,
  BookMarked,
  User,
  Layers,
  AlertCircle,
  CheckCircle,
  BookText,
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
  FormRow,
  FormSection,
  Alert,
  Badge,
  Spinner,
  EmptyState,
  Table,
  Tr,
  Td,
} from "../components/ui";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";

// ─── Niveaux disponibles ───────────────────────────────────────────────────
const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];

// ─── Semestres par niveau ──────────────────────────────────────────────────
const SEMESTRES_PAR_NIVEAU = {
  L1: ["S1", "S2"],
  L2: ["S3", "S4"],
  L3: ["S5", "S6"],
  M1: ["S7", "S8"],
  M2: ["S9", "S10"],
};

// Tous les semestres (fallback si pas de niveau sélectionné)
const SEMESTRES_TOUS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];

const NIVEAU_COLORS = {
  L1: { bg: "rgba(102,126,234,0.12)", text: "#667eea", border: "rgba(102,126,234,0.3)" },
  L2: { bg: "rgba(168,85,247,0.12)", text: "#a855f7", border: "rgba(168,85,247,0.3)" },
  L3: { bg: "rgba(6,182,212,0.12)", text: "#06b6d4", border: "rgba(6,182,212,0.3)" },
  M1: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", border: "rgba(34,197,94,0.3)" },
  M2: { bg: "rgba(249,115,22,0.12)", text: "#f97316", border: "rgba(249,115,22,0.3)" },
};

// ─── Palette couleurs filières (cycle automatique) ────────────────────────
const FILIERE_COLORS = [
  { bg: "rgba(236,72,153,0.12)", text: "#ec4899", border: "rgba(236,72,153,0.3)" },
  { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  { bg: "rgba(99,102,241,0.12)", text: "#6366f1", border: "rgba(99,102,241,0.3)" },
  { bg: "rgba(239,68,68,0.12)",  text: "#ef4444", border: "rgba(239,68,68,0.3)"  },
  { bg: "rgba(14,165,233,0.12)", text: "#0ea5e9", border: "rgba(14,165,233,0.3)" },
];

// ─── Select stylisé réutilisable ──────────────────────────────────────────
const StyledSelect = ({ value, onChange, children, required, disabled }) => (
  <select
    value={value}
    onChange={onChange}
    required={required}
    disabled={disabled}
    style={{
      width: "100%",
      boxSizing: "border-box",
      background: "var(--surface2)",
      border: `1.5px solid ${value ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--radius-sm)",
      color: value ? "var(--text)" : "var(--text-muted)",
      padding: "10px 36px 10px 14px",
      fontSize: 14,
      outline: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "var(--font-body)",
      transition: "border-color 0.2s, box-shadow 0.2s",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 10px center",
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = "var(--accent)";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = value ? "var(--accent)" : "var(--border)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {children}
  </select>
);

// ─── Label de champ ───────────────────────────────────────────────────────
const FieldLabel = ({ icon: Icon, children, required }) => (
  <label
    style={{
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-soft)",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    {Icon && <Icon size={13} color="var(--accent)" />}
    {children}
    {required && <span style={{ color: "var(--danger)", fontWeight: 800 }}>*</span>}
  </label>
);

// ─── Formulaire de matière ──────────────────────────────────────────────────
function MatiereModal({ onClose, onSaved, onSuccess, onError, matiere }) {
  const isEdit = !!matiere;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code_matiere: matiere?.code_matiere || "",
    nom_matiere: matiere?.nom_matiere || "",
    filiere_id: matiere?.filiere_id || "",
    niveau: matiere?.niveau || "",
    semestre: matiere?.semestre || "",
    credit: matiere?.credit || "",
    volume_horaire: matiere?.volume_horaire || "",
    enseignant_id: matiere?.enseignant_id || "",
  });
  const [filieres, setFilieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);

  // Semestres disponibles selon le niveau sélectionné
  const semestresDisponibles = form.niveau
    ? SEMESTRES_PAR_NIVEAU[form.niveau] || SEMESTRES_TOUS
    : SEMESTRES_TOUS;

  useEffect(() => {
    api
      .get("/filieres")
      .then((r) => {
        const data = r.data?.data || r.data || [];
        setFilieres(Array.isArray(data) ? data : []);
      })
      .catch(() => setFilieres([]));
    api
      .get("/filieres/enseignants/liste")
      .then((r) => {
        const data = r.data?.data || r.data || [];
        setEnseignants(Array.isArray(data) ? data : []);
      })
      .catch(() => setEnseignants([]));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Quand le niveau change, on réinitialise le semestre au 1er semestre du niveau ──
  const handleNiveauChange = (e) => {
    const newNiveau = e.target.value;
    const sems = SEMESTRES_PAR_NIVEAU[newNiveau] || [];
    setForm((f) => ({
      ...f,
      niveau: newNiveau,
      semestre: sems[0] || "",
    }));
  };

  const isValid =
    form.code_matiere.trim() && form.nom_matiere.trim() && form.niveau;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        credit: form.credit ? parseFloat(form.credit) : null,
        volume_horaire: form.volume_horaire ? parseInt(form.volume_horaire) : null,
        filiere_id: form.filiere_id || null,
        enseignant_id: form.enseignant_id || null,
      };
      if (isEdit) {
        await api.put(`/matieres/${matiere.id}`, payload);
        onSuccess && onSuccess(`Matière "${form.nom_matiere}" mise à jour avec succès`);
      } else {
        await api.post("/matieres", payload);
        onSuccess && onSuccess(`Matière "${form.nom_matiere}" créée avec succès`);
      }
      onClose();
      setTimeout(() => onSaved(), 300);
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement";
      setError(msg);
      onError && onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Modifier la matière" : "Nouvelle matière"}
      onClose={onClose}
      width={640}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert type="danger">{error}</Alert>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <FormSection title="Identification" icon={BookText}>
            <FormRow>
              <Input
                label="Code matière *"
                value={form.code_matiere}
                onChange={set("code_matiere")}
                placeholder="ex: ALGO-BASE"
                icon={BookMarked}
                hint="Code unique identifiant la matière"
                required
                disabled={isEdit}
              />
              <Input
                label="Nom de la matière *"
                value={form.nom_matiere}
                onChange={set("nom_matiere")}
                placeholder="ex: Algorithmique"
                icon={BookOpen}
                required
              />
            </FormRow>
          </FormSection>

          <FormSection title="Affectation" icon={GraduationCap}>
            <FormRow>
              {/* ── Niveau ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <FieldLabel icon={Layers} required>Niveau</FieldLabel>
                <StyledSelect
                  value={form.niveau}
                  onChange={handleNiveauChange}
                  required
                >
                  <option value="">-- Sélectionner un niveau --</option>
                  {NIVEAUX.map((n) => (
                    <option key={n} value={n}>
                      {n} ({(SEMESTRES_PAR_NIVEAU[n] || []).join(" – ")})
                    </option>
                  ))}
                </StyledSelect>
              </div>

              {/* ── Semestre (filtré selon le niveau) ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <FieldLabel icon={BookMarked}>
                  Semestre
                  {form.niveau && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "none",
                      letterSpacing: 0,
                      marginLeft: 4,
                    }}>
                      ({(SEMESTRES_PAR_NIVEAU[form.niveau] || []).join(", ")})
                    </span>
                  )}
                </FieldLabel>
                <StyledSelect
                  value={form.semestre}
                  onChange={set("semestre")}
                  disabled={!form.niveau}
                >
                  {!form.niveau && (
                    <option value="">-- Choisir un niveau d'abord --</option>
                  )}
                  {semestresDisponibles.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </StyledSelect>

                {/* Indicateur visuel des semestres du niveau */}
                {form.niveau && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
                  }}>
                    {(SEMESTRES_PAR_NIVEAU[form.niveau] || []).map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: form.semestre === s
                            ? NIVEAU_COLORS[form.niveau]?.bg
                            : "var(--surface2)",
                          color: form.semestre === s
                            ? NIVEAU_COLORS[form.niveau]?.text
                            : "var(--text-muted)",
                          border: `1px solid ${form.semestre === s
                            ? NIVEAU_COLORS[form.niveau]?.border
                            : "var(--border)"}`,
                          transition: "all 0.15s",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </FormRow>

            <FormRow>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <FieldLabel icon={GraduationCap}>Filière (optionnelle)</FieldLabel>
                <StyledSelect value={form.filiere_id} onChange={set("filiere_id")}>
                  <option value="">-- Aucune filière --</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
                  ))}
                </StyledSelect>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <FieldLabel icon={User}>Enseignant (optionnel)</FieldLabel>
                <StyledSelect value={form.enseignant_id} onChange={set("enseignant_id")}>
                  <option value="">-- Non assigné --</option>
                  {enseignants.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nom_complet || `${e.nom} ${e.prenom}`}
                    </option>
                  ))}
                </StyledSelect>
              </div>
            </FormRow>
          </FormSection>

          <FormSection title="Crédits & Volume" icon={Award}>
            <FormRow>
              <Input
                label="Crédits (ECTS)"
                type="number"
                step="0.5"
                value={form.credit}
                onChange={set("credit")}
                placeholder="ex: 3"
                icon={Award}
                hint="Nombre de crédits ECTS"
              />
              <Input
                label="Volume horaire (heures)"
                type="number"
                value={form.volume_horaire}
                onChange={set("volume_horaire")}
                placeholder="ex: 40"
                icon={Clock}
                hint="Nombre total d'heures"
              />
            </FormRow>
          </FormSection>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 32,
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
            {isEdit ? "Enregistrer les modifications" : "Créer la matière"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function MatieresPage() {
  const { user } = useAuth();
  const canEdit = ["administrateur", "secretaire"].includes(user?.role);
  const {
    notification,
    hideNotification,
    success: showSuccess,
    error: showError,
  } = useNotification();

  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filieres, setFilieres] = useState([]);
  const [search, setSearch] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [filtreFiliere, setFiltreFiliere] = useState("");
  const [showModal, setShowModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtreNiveau) params.niveau = filtreNiveau;
      if (search) params.search = search;
      const { data } = await api.get("/matieres", { params });
      setMatieres(data?.data ?? []);
    } catch {
      setMatieres([]);
    } finally {
      setLoading(false);
    }
  }, [filtreNiveau, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api
      .get("/filieres")
      .then((r) => setFilieres(r.data?.data ?? r.data ?? []))
      .catch(() => setFilieres([]));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/matieres/${deleteTarget.id}`);
      showSuccess(`Matière "${deleteTarget.nom_matiere}" supprimée.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      showError(err.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = matieres.filter((m) => {
    const matchNiveau = !filtreNiveau || m.niveau === filtreNiveau;
    const matchFiliere = !filtreFiliere || String(m.filiere_id) === String(filtreFiliere);
    const matchSearch =
      !search ||
      m.nom_matiere?.toLowerCase().includes(search.toLowerCase()) ||
      m.code_matiere?.toLowerCase().includes(search.toLowerCase());
    return matchNiveau && matchFiliere && matchSearch;
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fadeUp { animation: fadeUp 0.35s cubic-bezier(.22,.68,0,1.2) both; }

        .niveau-pill { transition: transform 0.15s, box-shadow 0.15s; }
        .niveau-pill:hover { transform: translateY(-1px); }

        .mat-row { transition: background 0.15s; }
        .mat-row:hover { background: rgba(99,102,241,0.04) !important; }

        .lvl-btn { transition: all 0.18s cubic-bezier(.22,.68,0,1.2); }
        .lvl-btn:hover { transform: translateY(-1px); }

        .search-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
          outline: none;
        }

        .stat-card { transition: transform 0.18s, box-shadow 0.18s; cursor: default; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

        .filiere-card {
          transition: all 0.2s cubic-bezier(.22,.68,0,1.2);
          cursor: pointer;
          user-select: none;
        }
        .filiere-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.1);
        }
        .filiere-card:active {
          transform: translateY(-1px);
        }
      `}</style>

      <div className="fadeUp" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <PageHeader
          title="Gestion des matières"
          subtitle={`${filtered.length} matière${filtered.length > 1 ? "s" : ""}${
            filtreNiveau ? ` · Niveau ${filtreNiveau}` : ""
          }${
            filtreFiliere
              ? ` · ${filieres.find((f) => String(f.id) === String(filtreFiliere))?.nom || "Filière"}`
              : ""
          }`}
          action={
            canEdit && (
              <Btn onClick={() => setShowModal("create")} icon={<Plus size={16} />}>
                Nouvelle matière
              </Btn>
            )
          }
        />

        {/* ── GRID FILIÈRES ── */}
        {filieres.length > 0 && (
          <Card
            style={{
              padding: "20px 24px",
              borderLeft: "4px solid var(--accent)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "rgba(99,102,241,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GraduationCap size={17} color="var(--accent)" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                    Filtrer par filière
                  </p>
                  <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 0" }}>
                    Cliquez sur une filière pour filtrer les matières
                  </p>
                </div>
              </div>

              {filtreFiliere && (
                <button
                  onClick={() => setFiltreFiliere("")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 14px",
                    borderRadius: 20,
                    background: "rgba(239,68,68,0.08)",
                    border: "1.5px solid rgba(239,68,68,0.25)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#ef4444",
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                >
                  <X size={12} />
                  Effacer filtre
                </button>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              <div
                className="filiere-card"
                onClick={() => setFiltreFiliere("")}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: `2px solid ${!filtreFiliere ? "var(--accent)" : "var(--border)"}`,
                  background: !filtreFiliere ? "rgba(99,102,241,0.1)" : "var(--surface2)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {!filtreFiliere && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--accent)", borderRadius: "12px 12px 0 0" }} />
                )}
                <div style={{ fontSize: 22, fontWeight: 800, color: !filtreFiliere ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, marginBottom: 6 }}>
                  {matieres.length}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: !filtreFiliere ? "var(--accent)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Toutes
                </div>
              </div>

              {filieres.map((f, i) => {
                const c = FILIERE_COLORS[i % FILIERE_COLORS.length];
                const isActive = String(filtreFiliere) === String(f.id);
                const count = matieres.filter((m) => String(m.filiere_id) === String(f.id)).length;

                return (
                  <div
                    key={f.id}
                    className="filiere-card"
                    onClick={() => setFiltreFiliere(isActive ? "" : String(f.id))}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: `2px solid ${isActive ? c.border : "var(--border)"}`,
                      background: isActive ? c.bg : "var(--surface2)",
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {isActive && (
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.text, borderRadius: "12px 12px 0 0" }} />
                    )}
                    {isActive && (
                      <div style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: c.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle size={12} color="#fff" />
                      </div>
                    )}
                    <div style={{ fontSize: 22, fontWeight: 800, color: isActive ? c.text : "var(--text-muted)", lineHeight: 1, marginBottom: 5 }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? c.text : "var(--text)", textTransform: "uppercase", letterSpacing: "0.04em", wordBreak: "break-word", lineHeight: 1.3 }}>
                      {f.nom}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: isActive ? c.text : "var(--text-muted)", marginTop: 3, opacity: 0.75 }}>
                      {f.code}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Filtres niveau + search ── */}
        <Card style={{ padding: "16px 20px", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 280px", position: "relative" }}>
              <Search
                size={15}
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 1 }}
              />
              <input
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou code matière…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--surface2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 40,
                  color: "var(--text)",
                  padding: "9px 18px 9px 42px",
                  fontSize: 14,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>

            <div style={{ width: 1, height: 28, background: "var(--border)", flexShrink: 0 }} />

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", marginRight: 2 }}>
                Niveau
              </span>
              <button
                className="lvl-btn"
                onClick={() => setFiltreNiveau("")}
                style={{
                  padding: "7px 14px", borderRadius: 20, border: "1.5px solid",
                  borderColor: !filtreNiveau ? "var(--accent)" : "var(--border)",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  background: !filtreNiveau ? "var(--accent)" : "transparent",
                  color: !filtreNiveau ? "#fff" : "var(--text-muted)",
                  whiteSpace: "nowrap", letterSpacing: "0.02em",
                }}
              >
                Tous
              </button>
              {NIVEAUX.map((n) => {
                const c = NIVEAU_COLORS[n];
                const active = filtreNiveau === n;
                return (
                  <button
                    key={n}
                    className="lvl-btn"
                    onClick={() => setFiltreNiveau(n)}
                    style={{
                      padding: "7px 14px", borderRadius: 20,
                      border: `1.5px solid ${active ? c.border : "var(--border)"}`,
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      background: active ? c.bg : "transparent",
                      color: active ? c.text : "var(--text-muted)",
                      whiteSpace: "nowrap", letterSpacing: "0.02em",
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            {(search || filtreNiveau || filtreFiliere) && (
              <Btn
                small
                variant="ghost"
                onClick={() => { setSearch(""); setFiltreNiveau(""); setFiltreFiliere(""); }}
                icon={<RotateCcw size={13} />}
              >
                Réinitialiser
              </Btn>
            )}
          </div>
        </Card>

        {/* ── Liste des matières ── */}
        <Card style={{ padding: 0, overflow: "hidden", borderRadius: "var(--radius-lg)" }}>
          <Table
            headers={["Code", "Matière", "Niveau", "Semestre", "Crédits", "Volume H.", "Enseignant", canEdit ? "Actions" : ""]}
          >
            {loading ? (
              <tr>
                <td colSpan={canEdit ? 8 : 7} style={{ textAlign: "center", padding: 48 }}>
                  <Spinner />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 8 : 7}>
                  <EmptyState
                    icon={BookOpen}
                    title="Aucune matière"
                    description={
                      search || filtreNiveau || filtreFiliere
                        ? "Aucune matière trouvée pour ces filtres."
                        : "Commencez par créer une nouvelle matière."
                    }
                    action={
                      canEdit && !search && !filtreNiveau && !filtreFiliere && (
                        <Btn onClick={() => setShowModal("create")} icon={<Plus size={15} />}>
                          Nouvelle matière
                        </Btn>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const nc = NIVEAU_COLORS[m.niveau];
                return (
                  <Tr key={m.id} className="mat-row">
                    <Td>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 800, color: "var(--accent)", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                        {m.code_matiere}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>
                        {m.nom_matiere}
                      </span>
                    </Td>
                    <Td>
                      <span className="niveau-pill" style={{ display: "inline-flex", alignItems: "center", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", background: nc?.bg || "var(--surface2)", color: nc?.text || "var(--text)", border: `1.5px solid ${nc?.border || "var(--border)"}` }}>
                        {m.niveau || "—"}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant="accent">{m.semestre || "—"}</Badge>
                    </Td>
                    <Td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: m.credit ? "var(--warning)" : "var(--text-muted)" }}>
                        <Award size={13} color={m.credit ? "var(--warning)" : "var(--text-muted)"} />
                        {m.credit || "—"}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: m.volume_horaire ? "var(--text)" : "var(--text-muted)" }}>
                        <Clock size={13} color="var(--text-muted)" />
                        {m.volume_horaire ? `${m.volume_horaire}h` : "—"}
                      </span>
                    </Td>
                    <Td>
                      {m.enseignant_nom ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text)" }}>
                          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>
                            {m.enseignant_nom.charAt(0).toUpperCase()}
                          </span>
                          {m.enseignant_nom}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Non assigné</span>
                      )}
                    </Td>
                    {canEdit && (
                      <Td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn small variant="ghost" onClick={() => setShowModal(m)} icon={<Edit size={13} />} title="Modifier">Modifier</Btn>
                          <Btn small variant="danger" onClick={() => setDeleteTarget(m)} icon={<Trash2 size={13} />} title="Supprimer">Supprimer</Btn>
                        </div>
                      </Td>
                    )}
                  </Tr>
                );
              })
            )}
          </Table>
        </Card>

        {/* ── Stats en bas ── */}
        {matieres.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Par niveau
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
                {NIVEAUX.map((n) => {
                  const count = matieres.filter((m) => m.niveau === n).length;
                  const c = NIVEAU_COLORS[n];
                  return (
                    <div key={n} className="stat-card" style={{ padding: "16px 20px", borderRadius: "var(--radius-lg)", background: "var(--surface)", border: `1.5px solid ${c?.border || "var(--border)"}`, textAlign: "center", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c?.text || "var(--accent)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
                      <div style={{ fontSize: 28, fontWeight: 800, color: c?.text || "var(--text)", lineHeight: 1, marginBottom: 6 }}>{count}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Niveau {n}</div>
                    </div>
                  );
                })}
                <div className="stat-card" style={{ padding: "16px 20px", borderRadius: "var(--radius-lg)", background: "rgba(99,102,241,0.06)", border: "1.5px solid rgba(99,102,241,0.25)", textAlign: "center", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--accent)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", lineHeight: 1, marginBottom: 6 }}>{matieres.length}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {showModal && (
        <MatiereModal
          matiere={showModal === "create" ? null : showModal}
          onClose={() => setShowModal(null)}
          onSaved={() => { setShowModal(null); load(); }}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}

      <ConfirmationModal
        open={!!deleteTarget}
        title="Supprimer la matière"
        message={`Êtes-vous sûr de vouloir supprimer la matière "${deleteTarget?.nom_matiere}" (${deleteTarget?.code_matiere}) ? Cette action peut affecter les notes associées.`}
        confirmText="Supprimer"
        variant="danger"
        dangerZone
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <NotificationDisplay notification={notification} onClose={hideNotification} />
    </>
  );
}
