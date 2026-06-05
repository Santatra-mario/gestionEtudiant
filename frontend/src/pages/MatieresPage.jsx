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
const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];

const NIVEAU_COLORS = {
  L1: { bg: "rgba(102,126,234,0.15)", text: "#667eea" },
  L2: { bg: "rgba(240,147,251,0.15)", text: "#f093fb" },
  L3: { bg: "rgba(79,172,254,0.15)", text: "#4facfe" },
  M1: { bg: "rgba(67,233,123,0.15)", text: "#43e97b" },
  M2: { bg: "rgba(250,112,154,0.15)", text: "#fa709a" },
};

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
    semestre: matiere?.semestre || "S1",
    credit: matiere?.credit || "",
    volume_horaire: matiere?.volume_horaire || "",
    enseignant_id: matiere?.enseignant_id || "",
  });
  const [filieres, setFilieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);

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
        volume_horaire: form.volume_horaire
          ? parseInt(form.volume_horaire)
          : null,
        filiere_id: form.filiere_id || null,
        enseignant_id: form.enseignant_id || null,
      };
      if (isEdit) {
        await api.put(`/matieres/${matiere.id}`, payload);
        onSuccess &&
          onSuccess(`Matière "${form.nom_matiere}" mise à jour avec succès`);
      } else {
        await api.post("/matieres", payload);
        onSuccess &&
          onSuccess(`Matière "${form.nom_matiere}" créée avec succès`);
      }
      onClose();
      setTimeout(() => onSaved(), 300);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Erreur lors de l'enregistrement";
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
      width={620}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
      >
        {error && (
          <div style={{ marginBottom: 16 }}>
            <Alert type="danger">{error}</Alert>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* ── Identification ── */}
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

          {/* ── Affectation ── */}
          <FormSection title="Affectation" icon={GraduationCap}>
            <FormRow>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-soft)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Layers size={14} color="var(--accent)" />
                  Niveau <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  value={form.niveau}
                  onChange={set("niveau")}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "var(--surface2)",
                    border: `1.5px solid ${form.niveau ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    color: form.niveau ? "var(--text)" : "var(--text-muted)",
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <option value="">-- Sélectionner un niveau --</option>
                  {NIVEAUX.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-soft)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <BookMarked size={14} color="var(--accent)" />
                  Semestre
                </label>
                <select
                  value={form.semestre}
                  onChange={set("semestre")}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "var(--surface2)",
                    border: `1.5px solid ${form.semestre ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text)",
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "border-color 0.2s",
                  }}
                >
                  {SEMESTRES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </FormRow>
            <FormRow>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-soft)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <GraduationCap size={14} color="var(--accent)" />
                  Filière (optionnelle)
                </label>
                <select
                  value={form.filiere_id}
                  onChange={set("filiere_id")}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "var(--surface2)",
                    border: `1.5px solid ${form.filiere_id ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    color: form.filiere_id
                      ? "var(--text)"
                      : "var(--text-muted)",
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <option value="">-- Aucune filière --</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.code})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-soft)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <User size={14} color="var(--accent)" />
                  Enseignant (optionnel)
                </label>
                <select
                  value={form.enseignant_id}
                  onChange={set("enseignant_id")}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "var(--surface2)",
                    border: `1.5px solid ${form.enseignant_id ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    color: form.enseignant_id
                      ? "var(--text)"
                      : "var(--text-muted)",
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <option value="">-- Non assigné --</option>
                  {enseignants.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nom_complet || `${e.nom} ${e.prenom}`}
                    </option>
                  ))}
                </select>
              </div>
            </FormRow>
          </FormSection>

          {/* ── Crédits et volume ── */}
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
  const [showModal, setShowModal] = useState(null); // null | 'create' | matiere object
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

  useEffect(() => {
    load();
  }, [load]);

  // Charger la liste des filières pour le filtre
  useEffect(() => {
    api
      .get("/filieres")
      .then((r) => setFilieres(r.data?.data ?? r.data ?? []))
      .catch(() => setFilieres([]));
  }, []);

  // Suppression
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

  // Filtre local (en plus du filtre backend)
  const filtered = matieres.filter((m) => {
    const matchNiveau = !filtreNiveau || m.niveau === filtreNiveau;
    const matchFiliere =
      !filtreFiliere || String(m.filiere_id) === String(filtreFiliere);
    const matchSearch =
      !search ||
      m.nom_matiere?.toLowerCase().includes(search.toLowerCase()) ||
      m.code_matiere?.toLowerCase().includes(search.toLowerCase());
    return matchNiveau && matchFiliere && matchSearch;
  });

  return (
    <>
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .fadeUp { animation: fadeUp 0.3s ease both; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="fadeUp"
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        <PageHeader
          title="Gestion des matières"
          subtitle={`${filtered.length} matière${filtered.length > 1 ? "s" : ""}${filtreNiveau ? ` · Niveau ${filtreNiveau}` : ""}${filtreFiliere ? ` · ${filieres.find((f) => String(f.id) === String(filtreFiliere))?.nom || "Filière"}` : ""}`}
          action={
            canEdit && (
              <Btn
                onClick={() => setShowModal("create")}
                icon={<Plus size={16} />}
              >
                Nouvelle matière
              </Btn>
            )
          }
        />

        {/* ── Sélecteur de filière ── */}
        <Card style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <GraduationCap size={16} color="var(--accent)" />
              Filtrer par filière
            </label>
            <select
              value={filtreFiliere}
              onChange={(e) => setFiltreFiliere(e.target.value)}
              style={{
                flex: "1 1 300px",
                maxWidth: 400,
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid var(--border)",
                background: "var(--surface2)",
                color: filtreFiliere ? "var(--text)" : "var(--text-muted)",
                fontSize: 14,
                outline: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              <option value="">-- Sélectionner une filière --</option>
              {filieres.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom} ({f.code})
                </option>
              ))}
            </select>
            {filtreFiliere &&
              (() => {
                const filiereChoisie = filieres.find(
                  (f) => String(f.id) === String(filtreFiliere),
                );
                return (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 14px",
                      borderRadius: 20,
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#22c55e",
                    }}
                  >
                    <CheckCircle size={14} />
                    {filiereChoisie?.nom || "Filière sélectionnée"}
                  </span>
                );
              })()}
          </div>
        </Card>

        {/* ── Filtres ── */}
        <Card style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: "1 1 280px", position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              <input
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
                  padding: "10px 18px 10px 44px",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--accent)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
            </div>

            {/* ── Filtre niveau ── */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                onClick={() => setFiltreNiveau("")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "1.5px solid var(--border)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                  background: !filtreNiveau
                    ? "var(--accent)"
                    : "var(--surface)",
                  color: !filtreNiveau ? "#fff" : "var(--text-muted)",
                  fontWeight: !filtreNiveau ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                Tous les niveaux
              </button>
              {NIVEAUX.map((n) => (
                <button
                  key={n}
                  onClick={() => setFiltreNiveau(n)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    border: "1.5px solid var(--border)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.15s",
                    background:
                      filtreNiveau === n
                        ? NIVEAU_COLORS[n]?.text || "var(--accent)"
                        : "var(--surface)",
                    color: filtreNiveau === n ? "#fff" : "var(--text-muted)",
                    fontWeight: filtreNiveau === n ? 700 : 400,
                    borderColor:
                      filtreNiveau === n ? "transparent" : "var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            {(search || filtreNiveau || filtreFiliere) && (
              <Btn
                small
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setFiltreNiveau("");
                  setFiltreFiliere("");
                }}
                icon={<RotateCcw size={13} />}
              >
                Réinitialiser
              </Btn>
            )}
          </div>
        </Card>

        {/* ── Liste des matières ── */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Table
            headers={[
              "Code",
              "Matière",
              "Niveau",
              "Semestre",
              "Crédits",
              "Volume H.",
              "Enseignant",
              canEdit ? "Actions" : "",
            ]}
          >
            {loading ? (
              <tr>
                <td
                  colSpan={canEdit ? 8 : 7}
                  style={{ textAlign: "center", padding: 40 }}
                >
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
                      search || filtreNiveau
                        ? "Aucune matière trouvée pour ces filtres."
                        : "Commencez par créer une nouvelle matière."
                    }
                    action={
                      canEdit &&
                      !search &&
                      !filtreNiveau && (
                        <Btn
                          onClick={() => setShowModal("create")}
                          icon={<Plus size={15} />}
                        >
                          Nouvelle matière
                        </Btn>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--accent-light)",
                        background: "rgba(99,102,241,0.08)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.code_matiere}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontWeight: 600 }}>{m.nom_matiere}</span>
                  </Td>
                  <Td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background:
                          NIVEAU_COLORS[m.niveau]?.bg || "var(--surface2)",
                        color: NIVEAU_COLORS[m.niveau]?.text || "var(--text)",
                      }}
                    >
                      {m.niveau || "—"}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant="accent">{m.semestre || "—"}</Badge>
                  </Td>
                  <Td>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      <Award size={13} color="var(--warning)" />
                      {m.credit || "—"}
                    </span>
                  </Td>
                  <Td>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Clock size={13} color="var(--text-muted)" />
                      {m.volume_horaire ? `${m.volume_horaire}h` : "—"}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {m.enseignant_nom || "Non assigné"}
                    </span>
                  </Td>
                  {canEdit && (
                    <Td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn
                          small
                          variant="ghost"
                          onClick={() => setShowModal(m)}
                          icon={<Edit size={13} />}
                          title="Modifier"
                        >
                          Modifier
                        </Btn>
                        <Btn
                          small
                          variant="danger"
                          onClick={() => setDeleteTarget(m)}
                          icon={<Trash2 size={13} />}
                          title="Supprimer"
                        >
                          Supprimer
                        </Btn>
                      </div>
                    </Td>
                  )}
                </Tr>
              ))
            )}
          </Table>
        </Card>

        {/* ── Stats en bas ── */}
        {matieres.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              fontSize: 13,
            }}
          >
            {NIVEAUX.map((n) => {
              const count = matieres.filter((m) => m.niveau === n).length;
              const c = NIVEAU_COLORS[n] || {};
              return (
                <div
                  key={n}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-lg)",
                    background: c.bg || "var(--surface2)",
                    border: `1px solid ${c.text || "var(--border)"}30`,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: c.text || "var(--text)",
                    }}
                  >
                    {count}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    Matières · {n}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {showModal && (
        <MatiereModal
          matiere={showModal === "create" ? null : showModal}
          onClose={() => setShowModal(null)}
          onSaved={() => {
            setShowModal(null);
            load();
          }}
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

      <NotificationDisplay
        notification={notification}
        onClose={hideNotification}
      />
    </>
  );
}
