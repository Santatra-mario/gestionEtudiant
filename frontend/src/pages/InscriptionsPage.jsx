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

  const searchInputId = "student-search-input";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* FIX IHM : label lié au champ via htmlFor/id pour l'accessibilité */}
      <label
        htmlFor={searchInputId}
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
        Étudiant <span style={{ color: "var(--danger, #ef4444)" }} aria-hidden="true">*</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
          (obligatoire)
        </span>
      </label>

      {/* ── Champ de recherche ── */}
      <div style={{ position: "relative" }}>
        <Search
          size={15}
          aria-hidden="true"
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
          id={searchInputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tapez le nom, prénom ou matricule…"
          autoComplete="off"
          aria-label="Rechercher un étudiant par nom, prénom ou matricule"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
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
        {/* FIX IHM : spinner corrigé — le translateY ne doit pas être dans le keyframe */}
        {fetching && (
          <div
            aria-label="Recherche en cours…"
            role="status"
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
                animation: "spinOnly 0.7s linear infinite",
              }}
            />
          </div>
        )}
        {open && results.length > 0 && (
          <div
            role="listbox"
            aria-label="Résultats de recherche"
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
                role="option"
                aria-selected="false"
                tabIndex={0}
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
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    onSelect({
                      id: e.id,
                      label: `${e.prenom} ${e.nom} (${e.matricule})`,
                      prenom: e.prenom,
                      nom: e.nom,
                    });
                    setQuery(`${e.prenom} ${e.nom} (${e.matricule})`);
                    setOpen(false);
                  }
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
        {/* FIX IHM : message si aucun résultat trouvé (feedback utilisateur) */}
        {open && results.length === 0 && query.length >= 2 && !fetching && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 4px)",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              fontSize: 13,
              color: "var(--text-muted)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={14} />
            Aucun étudiant trouvé pour « {query} »
          </div>
        )}
      </div>

      {/* ── Liste déroulante des étudiants avec inscription complète ── */}
      {(preloadedStudents.length > 0 || loadingPreloaded) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          <button
            type="button"
            aria-expanded={dropdownOpen}
            aria-controls="preloaded-students-list"
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
              aria-hidden="true"
              style={{
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {dropdownOpen && !loadingPreloaded && (
            <div
              id="preloaded-students-list"
              style={{
                border: "1.5px solid rgba(99,102,241,0.25)",
                borderTop: "none",
                borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                background: "var(--surface2)",
                overflow: "hidden",
                animation: "slideDown 0.15s ease",
              }}
            >
              {/* FIX IHM : label lié au select via htmlFor/id */}
              <label htmlFor="preloaded-select" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                Sélectionner un étudiant dans la liste
              </label>
              <select
                id="preloaded-select"
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
      {/* FIX IHM : role="group" + aria-labelledby pour grouper les boutons radio visuels */}
      <span
        id="statut-picker-label"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-soft)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Tag size={14} color="var(--accent)" aria-hidden="true" />
        Statut d'inscription
      </span>
      {/* FIX IHM : grille 3 colonnes pour équilibre visuel (5 boutons → 3+2 au lieu de 2+2+1) */}
      <div
        role="group"
        aria-labelledby="statut-picker-label"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
      >
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
              role="radio"
              aria-checked={active}
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
              {active && <CheckCircle size={13} aria-hidden="true" />}
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

  // FIX IHM : calcul précis des champs manquants pour guider l'utilisateur
  const missingFields = [];
  if (!form.etudiant_id) missingFields.push("un étudiant");
  if (!form.filiere_id) missingFields.push("une filière");
  const isValid = missingFields.length === 0;

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
        noValidate
      >
        {error && (
          <div style={{ marginBottom: 16 }} role="alert" aria-live="assertive">
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
                role="status"
                aria-live="polite"
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
                    <CheckCircle size={14} color="#22c55e" aria-hidden="true" />
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
                <AlertCircle size={14} color="var(--text-muted)" aria-hidden="true" />
                Recherchez et sélectionnez un étudiant ci-dessus
              </div>
            )}
          </FormSection>

          {/* ── Section Cursus ── */}
          <FormSection title="Cursus académique" icon={BookOpen}>
            {/* FIX IHM : label lié au select filière via htmlFor/id */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="filiere-select"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-soft)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <BookOpen size={14} color="var(--accent)" aria-hidden="true" />
                Filière{" "}
                <span style={{ color: "var(--danger, #ef4444)" }} aria-hidden="true">*</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>(obligatoire)</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  id="filiere-select"
                  value={form.filiere_id}
                  onChange={set("filiere_id")}
                  disabled={filiereLoading}
                  required
                  aria-required="true"
                  aria-invalid={!form.filiere_id}
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
                  aria-hidden="true"
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

        {/* FIX IHM : message d'aide sur le bouton désactivé pour guider l'utilisateur */}
        {!isValid && (
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            role="note"
          >
            <AlertCircle size={12} aria-hidden="true" />
            Pour continuer, veuillez sélectionner {missingFields.join(" et ")}.
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 16,
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
            aria-disabled={!isValid}
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

  // FIX IHM : calcul des champs manquants pour guider l'utilisateur
  const missingTransfertFields = [];
  if (!form.etudiant_id) missingTransfertFields.push("un étudiant");
  if (!form.etablissement_origine) missingTransfertFields.push("le code établissement");
  if (!form.filiere_origine) missingTransfertFields.push("la filière d'origine");
  if (!form.filiere_destination_id) missingTransfertFields.push("la filière de destination");

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
        noValidate
      >
        {error && (
          <div style={{ marginBottom: 16 }} role="alert" aria-live="assertive">
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
                role="status"
                aria-live="polite"
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
                    <CheckCircle size={14} color="#22c55e" aria-hidden="true" />
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
                <AlertCircle size={14} color="var(--text-muted)" aria-hidden="true" />
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

          {/* ── Destination ── FIX IHM : style harmonisé avec InscriptionModal */}
          <FormSection title="Cursus académique" icon={BookOpen}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="filiere-destination-select"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-soft)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <BookOpen size={14} color="var(--accent)" aria-hidden="true" />
                Filière destination{" "}
                <span style={{ color: "var(--danger, #ef4444)" }} aria-hidden="true">*</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>(obligatoire)</span>
              </label>
              {/* FIX IHM : même style que le select filière dans InscriptionModal */}
              <div style={{ position: "relative" }}>
                <select
                  id="filiere-destination-select"
                  value={form.filiere_destination_id}
                  onChange={set("filiere_destination_id")}
                  required
                  aria-required="true"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "var(--surface2)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: form.filiere_destination_id
                      ? "var(--text)"
                      : "var(--text-muted)",
                    padding: "10px 36px 10px 14px",
                    fontSize: 14,
                    outline: "none",
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    appearance: "none",
                    colorScheme: "dark",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.18)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="">— Sélectionner une filière —</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.code})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
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
              {/* FIX IHM : label lié au select niveau + style harmonisé */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  htmlFor="niveau-transfert-select"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-soft)",
                  }}
                >
                  Niveau *
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    id="niveau-transfert-select"
                    value={form.niveau}
                    onChange={set("niveau")}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "var(--surface2)",
                      border: "1.5px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text)",
                      padding: "10px 36px 10px 14px",
                      fontSize: 14,
                      outline: "none",
                      cursor: "pointer",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      appearance: "none",
                      colorScheme: "dark",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.18)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {NIVEAUX.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
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
            {/* FIX IHM : label lié au textarea */}
            <label
              htmlFor="motif-textarea"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-soft)",
                marginBottom: 4,
                display: "block",
              }}
            >
              Motif (optionnel)
            </label>
            <textarea
              id="motif-textarea"
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
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.18)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </FormSection>
        </div>

        {/* FIX IHM : message d'aide sur les champs manquants */}
        {!isValid && missingTransfertFields.length > 0 && (
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            role="note"
          >
            <AlertCircle size={12} aria-hidden="true" />
            Pour continuer, veuillez renseigner : {missingTransfertFields.join(", ")}.
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 16,
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
            aria-disabled={!isValid}
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
          <div style={{ marginBottom: 16 }} role="alert" aria-live="assertive">
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
            aria-disabled={statut === inscription.statut}
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
    <tr style={{ borderBottom: "1px solid var(--border)" }} aria-hidden="true">
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
      {/* FIX IHM : @keyframes corrigés
          - shimmer : inchangé, correct
          - spinOnly : UNIQUEMENT la rotation, sans translateY (qui est géré par le parent)
          - slideDown : inchangé, correct
          - Filtre statut responsive : sur petit écran passage à 2 colonnes
      */}
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes spinOnly { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
        @media (max-width: 640px) {
          .statut-filter-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
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
                  aria-label="Créer une demande de transfert"
                >
                  Transfert
                </Btn>
                <Btn
                  onClick={() => setShowModal(true)}
                  icon={<UserPlus size={16} />}
                  aria-label="Créer une nouvelle inscription"
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
              aria-hidden="true"
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
                <Sparkles size={16} color="#60a5fa" aria-hidden="true" />
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
              <Calendar size={13} color="var(--accent)" aria-hidden="true" /> Année :{" "}
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
              <Users size={13} color="var(--accent)" aria-hidden="true" /> Étudiants inscrits :{" "}
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
            aria-expanded={showFilters}
            aria-controls="filters-panel"
          >
            Filtres
            {filterCount > 0 && (
              <span
                aria-label={`${filterCount} filtre${filterCount > 1 ? "s" : ""} actif${filterCount > 1 ? "s" : ""}`}
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
              aria-label="Réinitialiser tous les filtres"
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
              <Calendar size={12} aria-hidden="true" /> {filters.annee}
              {/* FIX IHM : aria-label sur le bouton X pour indiquer son action */}
              <button
                onClick={() => setFilters((f) => ({ ...f, annee: "" }))}
                aria-label={`Supprimer le filtre année ${filters.annee}`}
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
              {/* FIX IHM : aria-label sur le bouton X */}
              <button
                onClick={() => setFilters((f) => ({ ...f, statut: "" }))}
                aria-label={`Supprimer le filtre statut ${STATUT_LABELS[filters.statut] || filters.statut}`}
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
            id="filters-panel"
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
              <span
                id="statut-filter-label"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-soft)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Tag size={14} color="var(--accent)" aria-hidden="true" />
                Filtrer par statut
              </span>
              {/* FIX IHM : grille responsive avec classe CSS pour breakpoint mobile */}
              <div
                className="statut-filter-grid"
                role="group"
                aria-labelledby="statut-filter-label"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
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
                      role="radio"
                      aria-checked={active}
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
                      {active && <CheckCircle size={12} aria-hidden="true" />}
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
          {/* FIX IHM : aria-live sur le tableau pour annoncer les changements de données */}
          <div role="status" aria-live="polite" aria-atomic="false" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            {loading ? "Chargement des inscriptions…" : `${inscriptions.length} inscription${inscriptions.length !== 1 ? "s" : ""} affichée${inscriptions.length !== 1 ? "s" : ""}`}
          </div>
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
                        aria-label={`Modifier le statut de ${i.etudiant_nom}`}
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
