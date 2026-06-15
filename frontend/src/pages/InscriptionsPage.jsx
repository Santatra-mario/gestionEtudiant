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
  Tag,
  Layers,
  Sparkles,
  ArrowLeftRight,
  Building2,
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
} from "../components/ui";

// ─── Fonction pour déterminer le statut affiché ─────────────────────────
function getStatutDisplay(inscription) {
  if (
    inscription.statut === "abandonne" &&
    inscription.matricule?.includes("H-")
  ) {
    return "transfere";
  }
  return inscription.statut;
}

// ─── Couleurs et labels des statuts ─────────────────────────────────────────
const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];
const STATUTS = ["actif", "suspendu", "diplome", "abandonne", "transfere"];
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

const PALETTE = [
  ["#6366f1", "#4f46e5"],
  ["#22c55e", "#16a34a"],
  ["#f59e0b", "#d97706"],
  ["#ec4899", "#be185d"],
  ["#14b8a6", "#0d9488"],
  ["#8b5cf6", "#7c3aed"],
];

const getTodayDate = () => new Date().toISOString().split("T")[0];
const getCurrentAcademicYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};
function getColors(seed) {
  const idx =
    (typeof seed === "string" ? seed.charCodeAt(0) : seed || 0) %
    PALETTE.length;
  return PALETTE[idx];
}

// ─── Mini-avatar ─────────────────────────────────────────────────────────────
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

// ─── Recherche étudiant autocomplete + liste déroulante étudiants complets ───
function StudentSearch({ onSelect, defaultLabel = "", preloadedStudents = [], loadingPreloaded = false }) {
  const [query, setQuery] = useState(defaultLabel);
  const [results, setResults] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [open, setOpen] = useState(false);

  // État pour la liste déroulante des étudiants avec inscription complète
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const handleSelectFromDropdown = (e) => {
    const val = e.target.value;
    if (!val) return;
    const found = preloadedStudents.find((s) => String(s.id) === String(val));
    if (found) {
      onSelect({
        id: found.id,
        label: `${found.prenom} ${found.nom} (${found.matricule})`,
        prenom: found.prenom,
        nom: found.nom,
      });
      setQuery(`${found.prenom} ${found.nom} (${found.matricule})`);
    }
  };

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

      {/* ── Champ de recherche (inchangé) ── */}
      <div style={{ position: "relative" }}>
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
        {open && results.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 4px)",
              background: "var(--bg)",
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

      {/* ── Liste déroulante des étudiants avec inscription complète ── */}
      {(preloadedStudents.length > 0 || loadingPreloaded) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          {/* En-tête cliquable pour ouvrir/fermer */}
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
              background: dropdownOpen
                ? "rgba(99,102,241,0.12)"
                : "rgba(99,102,241,0.06)",
              border: "1.5px solid rgba(99,102,241,0.25)",
              borderRadius: dropdownOpen
                ? "var(--radius-sm) var(--radius-sm) 0 0"
                : "var(--radius-sm)",
              cursor: "pointer",
              transition: "all 0.15s",
              width: "100%",
              fontFamily: "inherit",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent-light, #818cf8)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <GraduationCap size={13} color="var(--accent)" />
              {loadingPreloaded
                ? "Chargement…"
                : `Étudiants avec inscription complète (${preloadedStudents.length})`}
            </span>
            <ChevronDown
              size={15}
              color="var(--accent)"
              style={{
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {/* Corps déroulant — liste native <select> scrollable */}
          {dropdownOpen && !loadingPreloaded && (
            <div
              style={{
                border: "1.5px solid rgba(99,102,241,0.25)",
                borderTop: "none",
                borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                background: "var(--surface2)",
                overflow: "hidden",
                animation: "slideDown 0.15s ease",
              }}
            >
              <select
                size={Math.min(preloadedStudents.length, 6)}
                onChange={handleSelectFromDropdown}
                defaultValue=""
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: "var(--text)",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                  padding: 0,
                  colorScheme: "dark",
                }}
              >
                <option value="" disabled style={{ color: "var(--text-muted)", padding: "8px 14px" }}>
                  — Sélectionner un étudiant —
                </option>
                {preloadedStudents.map((e) => (
                  <option
                    key={e.id}
                    value={e.id}
                    style={{ padding: "8px 14px" }}
                  >
                    {e.prenom} {e.nom}
                    {e.matricule ? `  ·  ${e.matricule}` : ""}
                    {e.filiere_nom ? `  —  ${e.filiere_nom}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sélecteur de statut visuel (boutons grille) ──────────────────────────────
function StatutPicker({ value, onChange }) {
  return (
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
        <Tag size={14} color="var(--accent)" />
        Statut d'inscription
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {STATUTS.map((s) => {
          const active = value === s;
          const colors = {
            actif: { bg: "#22c55e", ring: "rgba(34,197,94,0.22)" },
            suspendu: { bg: "#f59e0b", ring: "rgba(245,158,11,0.22)" },
            diplome: { bg: "#4f8ef7", ring: "rgba(79,142,247,0.22)" },
            abandonne: { bg: "#ef4444", ring: "rgba(239,68,68,0.22)" },
            transfere: { bg: "#8b5cf6", ring: "rgba(139,92,246,0.22)" },
          };
          const c = colors[s] || {
            bg: "var(--accent)",
            ring: "rgba(79,142,247,0.2)",
          };
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              style={{
                padding: "10px 12px",
                background: active ? c.bg : "var(--surface2)",
                border: `1.5px solid ${active ? c.bg : "var(--border)"}`,
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
                boxShadow: active ? `0 0 0 3px ${c.ring}` : "none",
              }}
            >
              {active && <CheckCircle size={13} />}
              {STATUT_LABELS[s] || s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal nouvelle inscription ───────────────────────────────────────────────
function InscriptionModal({ onClose, onSaved, onSuccess, onError }) {
  const [filieres, setFilieres] = useState([]);
  const [filiereLoading, setFiliereLoading] = useState(true);
  const [filiereError, setFiliereError] = useState(false);
  const [selected, setSelected] = useState(null);

  const [completedStudents, setCompletedStudents] = useState([]);
  const [completedLoading, setCompletedLoading] = useState(true);

  const [form, setForm] = useState({
    etudiant_id: "",
    filiere_id: "",
    niveau: "L1",
    statut: "actif",
    annee_universitaire: getCurrentAcademicYear(),
    date_inscription: getTodayDate(),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/filieres")
      .then((r) => setFilieres(r.data?.data ?? r.data ?? []))
      .catch(() => setFiliereError(true))
      .finally(() => setFiliereLoading(false));

    api
      .get("/inscriptions", { params: { statut: "actif" } })
      .then((r) => {
        const inscrits = r.data?.data ?? [];
        const seen = new Set();
        const uniques = [];
        for (const ins of inscrits) {
          if (!seen.has(ins.etudiant_id)) {
            seen.add(ins.etudiant_id);
            const nomParts = ins.etudiant_nom?.split(" ") ?? [];
            uniques.push({
              id: ins.etudiant_id,
              prenom: nomParts[0] ?? "",
              nom: nomParts.slice(1).join(" ") || ins.etudiant_nom || "",
              matricule: ins.matricule ?? "",
              filiere_nom: ins.filiere_nom ?? "",
            });
          }
        }
        setCompletedStudents(uniques);
      })
      .catch(() => setCompletedStudents([]))
      .finally(() => setCompletedLoading(false));
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
      onSuccess && onSuccess(Messages.INSCRIPTION_CREATED(form.etudiant_id));
      onClose();
      setTimeout(() => {
        onSaved();
      }, 300);
    } catch (err) {
      const errMsg = formatErrorMessage(err) || Messages.INSCRIPTION_ERROR;
      setError(errMsg);
      onError && onError(errMsg);
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
          {/* ── Section Étudiant ── */}
          <FormSection title="Étudiant" icon={Users}>
            <StudentSearch
              onSelect={(s) => {
                setSelected(s);
                setForm((f) => ({ ...f, etudiant_id: s.id }));
              }}
              preloadedStudents={completedStudents}
              loadingPreloaded={completedLoading}
            />
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

          {/* ── Section Cursus ── */}
          <FormSection title="Cursus académique" icon={BookOpen}>
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
                    colorScheme: "dark",
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
            icon={<UserPlus size={15} />}
          >
            Inscrire l'étudiant
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Transfert ─────────────────────────────────────────────────────────
function TransfertModal({ onClose, onSaved, onSuccess, onError }) {
  const [filieres, setFilieres] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    etudiant_id: "",
    etablissement_origine: "",
    filiere_origine: "",
    filiere_destination_id: "",
    niveau: "L1",
    annee_universitaire: getCurrentAcademicYear(),
    motif: "",
  });

  useEffect(() => {
    api
      .get("/filieres")
      .then((r) => setFilieres(r.data?.data ?? r.data ?? []))
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isValid =
    form.etudiant_id &&
    form.etablissement_origine &&
    form.filiere_origine &&
    form.filiere_destination_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/transferts", form);
      onSuccess && onSuccess("Demande de transfert créée avec succès.");
      onClose();
      setTimeout(() => onSaved(), 300);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Erreur lors de la création du transfert.";
      setError(msg);
      onError && onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Nouvelle demande de transfert"
      subtitle="Transfert depuis un autre établissement"
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

          {/* ── Établissement origine ── */}
          <FormSection title="Établissement d'origine" icon={GraduationCap}>
            <FormRow>
              <Input
                label="Code établissement *"
                value={form.etablissement_origine}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    etablissement_origine: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="ex: TOL"
                hint="Code court ex: TOL, FNR, TNR"
              />
              <Input
                label="Filière d'origine *"
                value={form.filiere_origine}
                onChange={set("filiere_origine")}
                placeholder="ex: Informatique"
              />
            </FormRow>
          </FormSection>

          {/* ── Destination ── */}
          <FormSection title="Cursus académique" icon={BookOpen}>
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
                <BookOpen size={14} color="var(--accent)" />
                Filière destination{" "}
                <span style={{ color: "var(--danger, #ef4444)" }}>*</span>
              </label>
              <select
                value={form.filiere_destination_id}
                onChange={set("filiere_destination_id")}
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--surface2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: form.filiere_destination_id
                    ? "var(--text)"
                    : "var(--text-muted)",
                  padding: "10px 14px",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                <option value="">— Sélectionner une filière —</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom} ({f.code})
                  </option>
                ))}
              </select>
            </div>
            <FormRow>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-soft)",
                  }}
                >
                  Niveau *
                </label>
                <select
                  value={form.niveau}
                  onChange={set("niveau")}
                  style={{
                    background: "var(--surface2)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text)",
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                >
                  {NIVEAUX.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Année universitaire *"
                value={form.annee_universitaire}
                onChange={set("annee_universitaire")}
                placeholder="2026-2027"
              />
            </FormRow>
          </FormSection>

          {/* ── Motif ── */}
          <FormSection title="Motif du transfert" icon={Tag}>
            <textarea
              value={form.motif}
              onChange={set("motif")}
              placeholder="Raison du transfert (optionnel)"
              style={{
                width: "100%",
                minHeight: 80,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                background: "var(--surface2)",
                color: "var(--text)",
                fontSize: 14,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
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
            icon={<ArrowLeftRight size={15} />}
          >
            Créer la demande
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal changement de statut ───────────────────────────────────────────────
function StatutModal({ inscription, onClose, onSaved, onSuccess, onError }) {
  const [statut, setStatut] = useState(inscription.statut);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/inscriptions/${inscription.id}/statut`, { statut });
      onSuccess &&
        onSuccess(Messages.INSCRIPTION_UPDATED(inscription.etudiant_nom));
      onClose();
      setTimeout(() => {
        onSaved();
      }, 300);
    } catch (err) {
      const errMsg = formatErrorMessage(err) || Messages.INSCRIPTION_ERROR;
      setError(errMsg);
      onError && onError(errMsg);
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
          <Badge
            color={STATUT_COLOR[getStatutDisplay(inscription)] || "muted"}
            dot
          >
            {STATUT_LABELS[getStatutDisplay(inscription)] || inscription.statut}
          </Badge>
        </div>

        <StatutPicker value={statut} onChange={setStatut} />

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

// ─── Ligne skeleton ───────────────────────────────────────────────────────────
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
      {[80, 130, 90, 36, 75, 64, 80].map((w, i) => (
        <td key={i} style={{ padding: "14px 12px" }}>
          <div
            style={{
              ...pulse,
              width: w,
              height: i === 3 || i === 5 ? 22 : i === 6 ? 30 : 13,
              borderRadius: i === 3 || i === 5 ? 20 : i === 6 ? 8 : 6,
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function InscriptionsPage() {
  const { user } = useAuth();
  const canEdit = ["administrateur", "secretaire"].includes(user?.role);
  const {
    notification,
    hideNotification,
    success: showSuccess,
    error: showError,
  } = useNotification();

  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransfertModal, setShowTransfertModal] = useState(false);
  const [statutModal, setStatutModal] = useState(null);
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
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes spin { to { transform: translateY(-50%) rotate(360deg) } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          minHeight: "100vh",
          padding: "24px 0 40px",
          background: "transparent",
        }}
      >
        <PageHeader
          title="Inscriptions"
          subtitle={`${inscriptions.length} inscription${inscriptions.length !== 1 ? "s" : ""}${hasFilters ? " (filtrées)" : ""}`}
          action={
            canEdit && (
              <div style={{ display: "flex", gap: 10 }}>
                <Btn
                  onClick={() => setShowTransfertModal(true)}
                  icon={<ArrowLeftRight size={16} />}
                  variant="ghost"
                >
                  Transfert
                </Btn>
                <Btn
                  onClick={() => setShowModal(true)}
                  icon={<UserPlus size={16} />}
                >
                  Nouvelle inscription
                </Btn>
              </div>
            )
          }
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: 20,
            borderRadius: "28px",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background: "rgba(59,130,246,0.18)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Layers size={26} color="#2563eb" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <Sparkles size={16} color="#60a5fa" />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text)",
                  }}
                >
                  Vitrine de gestion
                </span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  color: "var(--text)",
                }}
              >
                Administration des inscriptions universitaires
              </h2>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(59,130,246,0.08)",
                color: "var(--text)",
                fontSize: 13,
                border: "1px solid rgba(59,130,246,0.18)",
              }}
            >
              <Calendar size={13} color="var(--accent)" /> Année :{" "}
              {getCurrentAcademicYear()}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(59,130,246,0.08)",
                color: "var(--text)",
                fontSize: 13,
                border: "1px solid rgba(59,130,246,0.18)",
              }}
            >
              <Users size={13} color="var(--accent)" /> Étudiants inscrits :{" "}
              {inscriptions.length}
            </span>
          </div>
        </div>

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

        {showFilters && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
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
                <Tag size={14} color="var(--accent)" />
                Filtrer par statut
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 8,
                }}
              >
                {[
                  { key: "", label: "Tous" },
                  ...STATUTS.map((s) => ({ key: s, label: STATUT_LABELS[s] })),
                ].map(({ key, label }) => {
                  const active = filters.statut === key;
                  const colors = {
                    "": { bg: "var(--accent)", ring: "rgba(79,142,247,0.22)" },
                    actif: { bg: "#22c55e", ring: "rgba(34,197,94,0.22)" },
                    suspendu: { bg: "#f59e0b", ring: "rgba(245,158,11,0.22)" },
                    diplome: { bg: "#4f8ef7", ring: "rgba(79,142,247,0.22)" },
                    abandonne: { bg: "#ef4444", ring: "rgba(239,68,68,0.22)" },
                    transfere: { bg: "#8b5cf6", ring: "rgba(139,92,246,0.22)" },
                  };
                  const c = colors[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, statut: key }))}
                      style={{
                        padding: "9px 10px",
                        background: active ? c.bg : "var(--surface2)",
                        border: `1.5px solid ${active ? c.bg : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)",
                        color: active ? "#fff" : "var(--text)",
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        fontFamily: "inherit",
                        boxShadow: active ? `0 0 0 3px ${c.ring}` : "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {active && <CheckCircle size={12} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
                  <Td>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>
                      {i.etudiant_nom}
                    </div>
                  </Td>
                  <Td>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {i.filiere_nom || "—"}
                    </span>
                  </Td>
                  <Td>
                    <Badge color="info">{i.niveau}</Badge>
                  </Td>
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
                  <Td>
                    <Badge
                      color={STATUT_COLOR[getStatutDisplay(i)] || "muted"}
                      dot
                    >
                      {STATUT_LABELS[getStatutDisplay(i)] || i.statut}
                    </Badge>
                  </Td>
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

      {showModal && (
        <InscriptionModal
          onClose={() => setShowModal(false)}
          onSaved={() => { load(); }}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}
      {statutModal && (
        <StatutModal
          inscription={statutModal}
          onClose={() => setStatutModal(null)}
          onSaved={() => { load(); }}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}
      {showTransfertModal && (
        <TransfertModal
          onClose={() => setShowTransfertModal(false)}
          onSaved={() => { load(); }}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}
      <NotificationDisplay
        notification={notification}
        onClose={hideNotification}
      />
    </>
  );
}
