import { useEffect, useState, useCallback } from "react";
import {
  Search,
  UserPlus,
  Calendar,
  BookOpen,
  Users,
  Edit,
  Filter,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
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
} from "../components/ui";

// ─── Constantes ────────────────────────────────────────────────────────────
const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];
const STATUTS = ["actif", "suspendu", "diplome", "abandonne"];
const STATUT_COLOR = {
  actif: "success",
  suspendu: "warning",
  diplome: "accent",
  abandonne: "danger",
};
const STATUT_LABELS = {
  actif: "Actif",
  suspendu: "Suspendu",
  diplome: "Diplômé",
  abandonne: "Abandonné",
};

const PALETTE = [
  ["#6366f1", "#4f46e5"],
  ["#22c55e", "#16a34a"],
  ["#f59e0b", "#d97706"],
  ["#ec4899", "#be185d"],
  ["#14b8a6", "#0d9488"],
  ["#8b5cf6", "#7c3aed"],
];

function getColors(seed) {
  const idx =
    (typeof seed === "string" ? seed.charCodeAt(0) : seed || 0) %
    PALETTE.length;
  return PALETTE[idx];
}

// ─── Mini-avatar inline ────────────────────────────────────────────────────
function MiniAvatar({ prenom, nom, size = 32 }) {
  const [from, to] = getColors(prenom);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#fff",
        boxShadow: `0 2px 6px ${from}44`,
      }}
    >
      {`${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`}
    </div>
  );
}

// ─── Recherche d'étudiant avec dropdown autocomplete ──────────────────────
function StudentSearch({ onSelect, defaultLabel = "" }) {
  const [query, setQuery] = useState(defaultLabel);
  const [results, setResults] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      setFetching(true);
      api
        .get("/etudiants", { params: { search: query, limit: 8 } })
        .then((r) => {
          setResults(r.data?.data ?? []);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setFetching(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Users size={14} color="var(--accent)" />
        Étudiant <span style={{ color: "var(--danger, #ef4444)" }}>*</span>
      </label>

      <div style={{ position: "relative" }}>
        {/* Icône loupe */}
        <Search
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tapez le nom, prénom ou matricule…"
          autoComplete="off"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "var(--surface2)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
            padding: "10px 36px 10px 36px",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.18)";
            if (results.length) setOpen(true);
          }}
          onBlur={(e) => {
            setTimeout(() => setOpen(false), 160);
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Spinner de recherche */}
        {fetching && (
          <div
            style={{
              position: "absolute",
              right: 11,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        )}

        {/* Dropdown résultats */}
        {open && results.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 4px)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              boxShadow: "var(--shadow)",
              zIndex: 100,
              animation: "slideDown 0.15s ease",
            }}
          >
            {results.map((e) => (
              <div
                key={e.id}
                onMouseDown={() => {
                  onSelect({
                    id: e.id,
                    label: `${e.prenom} ${e.nom} (${e.matricule})`,
                    prenom: e.prenom,
                    nom: e.nom,
                  });
                  setQuery(`${e.prenom} ${e.nom} (${e.matricule})`);
                  setOpen(false);
                }}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--surface2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <MiniAvatar prenom={e.prenom} nom={e.nom} size={34} />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {e.prenom} {e.nom}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                      marginTop: 1,
                    }}
                  >
                    {e.matricule}
                  </div>
                </div>
                {e.filiere_nom && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      background: "var(--surface2)",
                      padding: "2px 8px",
                      borderRadius: 20,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {e.filiere_nom}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal nouvelle inscription ─────────────────────────────────────────────
function InscriptionModal({ onClose, onSaved }) {
  const [filieres, setFilieres] = useState([]);
  const [filiereLoading, setFiliereLoading] = useState(true);
  const [filiereError, setFiliereError] = useState(false);
  const [selected, setSelected] = useState(null); // { id, label, prenom, nom }
  const [form, setForm] = useState({
    etudiant_id: "",
    filiere_id: "",
    niveau: "L1",
    annee_universitaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    date_inscription: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/filieres")
      .then((r) => setFilieres(r.data?.data ?? r.data ?? []))
      .catch(() => setFiliereError(true))
      .finally(() => setFiliereLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isValid = form.etudiant_id && form.filiere_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.etudiant_id) {
      setError("Veuillez sélectionner un étudiant.");
      return;
    }
    if (!form.filiere_id) {
      setError("Veuillez choisir une filière.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/inscriptions", form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Nouvelle inscription"
      subtitle="Inscrire un étudiant dans une filière"
      onClose={onClose}
      width={580}
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
          {/* ── Étudiant ── */}
          <FormSection title="Étudiant" icon={Users}>
            <StudentSearch
              onSelect={(s) => {
                setSelected(s);
                setForm((f) => ({ ...f, etudiant_id: s.id }));
              }}
            />

            {/* Confirmation de sélection */}
            {selected ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "rgba(34,197,94,0.07)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: "var(--radius-sm)",
                  animation: "slideDown 0.18s ease",
                }}
              >
                <MiniAvatar
                  prenom={selected.prenom}
                  nom={selected.nom}
                  size={36}
                />
                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <CheckCircle size={14} color="#22c55e" />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      Étudiant sélectionné
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {selected.label}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: "rgba(99,102,241,0.05)",
                  border: "1px dashed var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                <AlertCircle size={14} color="var(--text-muted)" />
                Recherchez et sélectionnez un étudiant ci-dessus
              </div>
            )}
          </FormSection>

          {/* ── Cursus ── */}
          <FormSection title="Cursus académique" icon={BookOpen}>
            {/* Select filière */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <BookOpen size={14} color="var(--accent)" />
                Filière{" "}
                <span style={{ color: "var(--danger, #ef4444)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.filiere_id}
                  onChange={set("filiere_id")}
                  disabled={filiereLoading}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "var(--surface2)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: form.filiere_id
                      ? "var(--text)"
                      : "var(--text-muted)",
                    padding: "10px 36px 10px 14px",
                    fontSize: 14,
                    outline: "none",
                    opacity: filiereLoading ? 0.6 : 1,
                    cursor: filiereLoading ? "not-allowed" : "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    appearance: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(99,102,241,0.18)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="">
                    {filiereLoading
                      ? "Chargement des filières…"
                      : filiereError
                        ? "⚠ Erreur de chargement"
                        : "— Sélectionner une filière —"}
                  </option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.code})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            {/* Niveau + Année */}
            <FormRow>
              <Select
                label="Niveau d'études"
                required
                value={form.niveau}
                onChange={set("niveau")}
              >
                {NIVEAUX.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
              <Input
                label="Année universitaire"
                required
                value={form.annee_universitaire}
                onChange={set("annee_universitaire")}
                placeholder="2024-2025"
                icon={Calendar}
              />
            </FormRow>
          </FormSection>

          {/* ── Date ── */}
          <FormSection title="Date d'inscription" icon={Calendar}>
            <Input
              label="Date d'inscription"
              required
              type="date"
              value={form.date_inscription}
              onChange={set("date_inscription")}
              icon={Calendar}
            />
          </FormSection>
        </div>

        {/* Actions */}
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
            icon={<UserPlus size={15} />}
          >
            Inscrire l'étudiant
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal changement de statut ─────────────────────────────────────────────
function StatutModal({ inscription, onClose, onSaved }) {
  const [statut, setStatut] = useState(inscription.statut);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/inscriptions/${inscription.id}/statut`, { statut });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Modifier le statut"
      subtitle={`Inscription de ${inscription.etudiant_nom}`}
      onClose={onClose}
      width={420}
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

        {/* Statut actuel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Statut actuel
          </span>
          <Badge color={STATUT_COLOR[inscription.statut] || "muted"} dot>
            {STATUT_LABELS[inscription.statut] || inscription.statut}
          </Badge>
        </div>

        {/* Sélecteur nouveau statut */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Edit size={14} color="var(--accent)" />
            Nouveau statut
          </label>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {STATUTS.map((s) => {
              const active = statut === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatut(s)}
                  style={{
                    padding: "10px 12px",
                    background: active ? "var(--accent)" : "var(--surface2)",
                    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    color: active ? "#fff" : "var(--text)",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontFamily: "inherit",
                  }}
                >
                  {active && <CheckCircle size={13} />}
                  {STATUT_LABELS[s] || s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 24,
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
            disabled={statut === inscription.statut}
            icon={<Save size={15} />}
          >
            Enregistrer
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Ligne skeleton ─────────────────────────────────────────────────────────
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
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 80, height: 13 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 130, height: 14 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 90, height: 13 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 36, height: 22, borderRadius: 20 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 75, height: 13 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 64, height: 22, borderRadius: 20 }} />
      </td>
      <td style={{ padding: "14px 12px" }}>
        <div style={{ ...pulse, width: 80, height: 30, borderRadius: 8 }} />
      </td>
    </tr>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function InscriptionsPage() {
  const { user } = useAuth();
  const canEdit = ["administrateur", "secretaire"].includes(user?.role);

  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statutModal, setStatutModal] = useState(null); // inscription obj
  const [filters, setFilters] = useState({ annee: "", statut: "" });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.annee) params.annee = filters.annee;
      if (filters.statut) params.statut = filters.statut;
      const { data } = await api.get("/inscriptions", { params });
      setInscriptions(data?.data ?? []);
    } catch {
      setInscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const hasFilters = filters.annee || filters.statut;
  const filterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => setFilters({ annee: "", statut: "" });

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg) }
        }
      `}</style>

      <div
        className="page-enter"
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
      >
        {/* En-tête */}
        <PageHeader
          title="Inscriptions"
          subtitle={`${inscriptions.length} inscription${inscriptions.length !== 1 ? "s" : ""}${hasFilters ? " (filtrées)" : ""}`}
          action={
            canEdit && (
              <Btn
                onClick={() => setShowModal(true)}
                icon={<UserPlus size={16} />}
              >
                Nouvelle inscription
              </Btn>
            )
          }
        />

        {/* Barre filtres */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <Btn
            small
            variant={showFilters ? "outline" : "ghost"}
            onClick={() => setShowFilters((v) => !v)}
            icon={<Filter size={14} />}
          >
            Filtres
            {filterCount > 0 && (
              <span
                style={{
                  marginLeft: 4,
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 20,
                  lineHeight: 1.6,
                }}
              >
                {filterCount}
              </span>
            )}
          </Btn>

          {hasFilters && (
            <Btn
              small
              variant="ghost"
              onClick={clearFilters}
              icon={<RotateCcw size={13} />}
            >
              Réinitialiser
            </Btn>
          )}

          {/* Chips filtres actifs */}
          {filters.annee && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20,
                fontSize: 12,
                color: "var(--accent-light)",
                fontWeight: 500,
              }}
            >
              <Calendar size={12} /> {filters.annee}
              <button
                onClick={() => setFilters((f) => ({ ...f, annee: "" }))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  color: "inherit",
                }}
              >
                <X size={11} />
              </button>
            </span>
          )}
          {filters.statut && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20,
                fontSize: 12,
                color: "var(--accent-light)",
                fontWeight: 500,
              }}
            >
              {STATUT_LABELS[filters.statut] || filters.statut}
              <button
                onClick={() => setFilters((f) => ({ ...f, statut: "" }))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  color: "inherit",
                }}
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 20,
              padding: "18px 20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              animation: "slideDown 0.18s ease",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Input
              label="Année universitaire"
              value={filters.annee}
              onChange={(e) =>
                setFilters((f) => ({ ...f, annee: e.target.value }))
              }
              placeholder="ex : 2024-2025"
              icon={Calendar}
            />
            <Select
              label="Statut"
              value={filters.statut}
              onChange={(e) =>
                setFilters((f) => ({ ...f, statut: e.target.value }))
              }
            >
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {STATUT_LABELS[s] || s}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Tableau */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Table
            headers={[
              "Matricule",
              "Étudiant",
              "Filière",
              "Niveau",
              "Année",
              "Statut",
              canEdit ? "Actions" : "",
            ]}
          >
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
            ) : inscriptions.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={GraduationCap}
                    title="Aucune inscription"
                    description={
                      hasFilters
                        ? "Aucun résultat pour ces filtres. Essayez de les modifier."
                        : "Créez la première inscription en cliquant sur le bouton ci-dessus."
                    }
                    action={
                      canEdit &&
                      !hasFilters && (
                        <Btn
                          onClick={() => setShowModal(true)}
                          icon={<UserPlus size={15} />}
                        >
                          Nouvelle inscription
                        </Btn>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              inscriptions.map((i) => (
                <Tr key={i.id}>
                  {/* Matricule */}
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
                      {i.matricule}
                    </span>
                  </Td>

                  {/* Étudiant */}
                  <Td>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>
                      {i.etudiant_nom}
                    </div>
                  </Td>

                  {/* Filière */}
                  <Td>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {i.filiere_nom || "—"}
                    </span>
                  </Td>

                  {/* Niveau */}
                  <Td>
                    <Badge color="info">{i.niveau}</Badge>
                  </Td>

                  {/* Année */}
                  <Td>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {i.annee_universitaire}
                    </span>
                  </Td>

                  {/* Statut */}
                  <Td>
                    <Badge color={STATUT_COLOR[i.statut] || "muted"} dot>
                      {STATUT_LABELS[i.statut] || i.statut}
                    </Badge>
                  </Td>

                  {/* Actions */}
                  <Td>
                    {canEdit && (
                      <Btn
                        small
                        variant="ghost"
                        onClick={() => setStatutModal(i)}
                        icon={<Edit size={13} />}
                      >
                        Statut
                      </Btn>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <InscriptionModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
      {statutModal && (
        <StatutModal
          inscription={statutModal}
          onClose={() => setStatutModal(null)}
          onSaved={() => {
            setStatutModal(null);
            load();
          }}
        />
      )}
    </>
  );
}
