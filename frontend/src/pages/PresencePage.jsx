import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Save,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Download,
  RefreshCw,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  FileText,
  AlertTriangle,
  BarChart3,
  BookOpen,
  User,
  StickyNote,
  Timer,
  X,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Btn,
  Badge,
  Alert,
  Spinner,
  Modal,
} from "../components/ui";

// ══════════════════════════════════════════════════════════════════════════════
// STYLES GLOBAUX DES INPUTS MODERNES
// ══════════════════════════════════════════════════════════════════════════════

const fieldWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  position: "relative",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const requiredDotStyle = {
  color: "#ef4444",
  fontSize: 16,
  lineHeight: 1,
};

// Input/Select de base — utilisé pour la barre de filtres
const baseInputStyle = {
  width: "100%",
  padding: "10px 13px",
  fontSize: 14,
  background: "var(--surface2)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm, 8px)",
  color: "var(--text)",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

const baseSelectStyle = {
  ...baseInputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
  paddingRight: 36,
  colorScheme: "dark",
};

// Input moderne pour le modal (avec icône gauche)
const modalInputBase = {
  width: "100%",
  padding: "11px 40px 11px 38px",
  fontSize: 14,
  background: "var(--surface2)",
  border: "1.5px solid var(--border)",
  borderRadius: 10,
  color: "var(--text)",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
  boxSizing: "border-box",
};

const modalSelectBase = {
  ...modalInputBase,
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
  colorScheme: "dark",
};

// Couleur d'accentuation quand rempli
function getInputStyle(value, hasError = false) {
  return {
    ...modalInputBase,
    borderColor: hasError ? "#ef4444" : value ? "var(--accent)" : "var(--border)",
    boxShadow: value ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
  };
}

function getSelectStyle(value, hasError = false) {
  return {
    ...modalSelectBase,
    borderColor: hasError ? "#ef4444" : value ? "var(--accent)" : "var(--border)",
    boxShadow: value ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : SELECT NATIF (barre de filtres)
// ══════════════════════════════════════════════════════════════════════════════

function NativeSelect({ label, value, onChange, children, disabled }) {
  return (
    <div style={fieldWrapStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={baseSelectStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          style={{
            position: "absolute", right: 11, top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)", pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : CHAMP INPUT MODAL (avec icône)
// ══════════════════════════════════════════════════════════════════════════════

function ModalField({ label, required, icon: Icon, error, children }) {
  return (
    <div style={fieldWrapStyle}>
      <label style={labelStyle}>
        {Icon && <Icon size={13} style={{ opacity: 0.7 }} />}
        {label}
        {required && <span style={requiredDotStyle}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        {children}
      </div>
      {error && (
        <span style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function extractArray(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.matieres)) return responseData.matieres;
  return [];
}

function getStudentFullName(student) {
  if (!student) return "";
  const nom = student.etudiant_nom || student.nom || "";
  const prenom = student.prenom || "";
  if (prenom && nom) return `${nom} ${prenom}`;
  return nom || prenom || "Étudiant inconnu";
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : RECHERCHE DYNAMIQUE D'ÉTUDIANT
// ══════════════════════════════════════════════════════════════════════════════

function StudentSearch({ inscriptions, value, onChange, hasError }) {
  const [query, setQuery]           = useState("");
  const [open, setOpen]             = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef  = React.useRef(null);
  const inputRef = React.useRef(null);
  const listRef  = React.useRef(null);

  /* ── étudiant actuellement sélectionné ── */
  const selectedStudent = inscriptions.find((s) => String(s.id) === String(value));
  const displayName = selectedStudent
    ? getStudentFullName(selectedStudent) +
      (selectedStudent.matricule ? ` (${selectedStudent.matricule})` : "")
    : "";

  /* ── ce que l'input affiche : si ouvert → ce qu'on tape,
                                  sinon    → le nom de l'étudiant choisi (ou vide) ── */
  const inputValue = open ? query : displayName;

  /* ── liste filtrée en temps réel ── */
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inscriptions.slice(0, 8);
    return inscriptions.filter((s) =>
      getStudentFullName(s).toLowerCase().includes(q) ||
      (s.matricule   || "").toLowerCase().includes(q) ||
      (s.filiere_nom || "").toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, inscriptions]);

  /* ── sélection ── */
  const handleSelect = (student) => {
    onChange(String(student.id));
    setQuery("");
    setOpen(false);
  };

  /* ── saisie ── */
  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setHighlighted(0);
    setOpen(true);
    if (v === "") onChange("");      // effacer la sélection si on vide
  };

  /* ── focus : ouvrir le dropdown et pré-remplir avec le nom si déjà choisi ── */
  const handleFocus = () => {
    setQuery(displayName);          // commence avec le nom actuel → tape pour filtrer
    setOpen(true);
    setHighlighted(0);
  };

  /* ── clavier ── */
  const handleKeyDown = (e) => {
    if (!open) { setOpen(true); return; }
    if (e.key === "ArrowDown")  { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter")     { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]); }
    else if (e.key === "Escape")    { setOpen(false); setQuery(""); }
  };

  /* ── fermer si clic hors du composant ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── scroll auto vers l'élément highlighted ── */
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[highlighted];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  /* ── styles dynamiques ── */
  const active = !!(value || query);
  const borderColor = hasError ? "#ef4444" : active ? "var(--accent)" : "var(--border)";
  const boxShadow   = active ? "0 0 0 3px rgba(99,102,241,0.12)" : "none";

  /* ── surlignage du terme recherché ── */
  const highlightText = (text) => {
    const q = query.trim().toLowerCase();
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q);
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark style={{
          background: "rgba(99,102,241,0.28)",
          color: "var(--accent)",
          borderRadius: 3,
          padding: "0 2px",
          fontWeight: 700,
        }}>
          {text.slice(i, i + q.length)}
        </mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>

      {/* ── champ texte ── */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{
          position: "absolute", left: 12, top: "50%",
          transform: "translateY(-50%)",
          color: active ? "var(--accent)" : "var(--text-muted)",
          pointerEvents: "none", transition: "color 0.2s", zIndex: 1,
        }} />

        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Tapez un nom ou matricule…"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          style={{
            ...modalInputBase,
            borderColor,
            boxShadow,
            paddingLeft: 38,
            paddingRight: value ? 34 : 14,
          }}
        />

        {/* bouton ✕ pour effacer */}
        {value && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("");
              setQuery("");
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            style={{
              position: "absolute", right: 8, top: "50%",
              transform: "translateY(-50%)",
              background: "var(--surface3)", border: "none",
              borderRadius: "50%", width: 20, height: 20,
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              padding: 0, color: "var(--text-muted)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--danger)20"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface3)"}
            title="Effacer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── dropdown ── */}
      {open && (
        <div
          ref={listRef}
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "var(--surface)",
            border: "1.5px solid var(--accent)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
            maxHeight: 240, overflowY: "auto", zIndex: 99999,
            animation: "ssDropIn 0.14s cubic-bezier(0.34,1.2,0.64,1)",
          }}
        >
          {/* en-tête compteur */}
          <div style={{
            padding: "6px 14px 5px",
            fontSize: 11, fontWeight: 700,
            color: "var(--text-muted)",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface2)",
            borderRadius: "10px 10px 0 0",
            letterSpacing: "0.04em",
          }}>
            {filtered.length === 0
              ? `Aucun résultat pour « ${query} »`
              : `${filtered.length} étudiant${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "18px 16px", textAlign: "center" }}>
              <User size={28} style={{ opacity: 0.2, marginBottom: 6 }} />
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Aucun étudiant ne correspond à <strong>« {query} »</strong>
              </div>
            </div>
          ) : (
            filtered.map((s, idx) => {
              const name        = getStudentFullName(s);
              const isHovered   = idx === highlighted;
              const isSelected  = String(s.id) === String(value);

              return (
                <div
                  key={s.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                  onMouseEnter={() => setHighlighted(idx)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px",
                    background: isSelected
                      ? "rgba(99,102,241,0.10)"
                      : isHovered
                        ? "var(--surface2)"
                        : "transparent",
                    borderBottom: idx < filtered.length - 1
                      ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                    transition: "background 0.1s",
                    borderLeft: isSelected
                      ? "3px solid var(--accent)"
                      : isHovered
                        ? "3px solid rgba(99,102,241,0.3)"
                        : "3px solid transparent",
                  }}
                >
                  {/* avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    flexShrink: 0,
                    background: isSelected ? "rgba(99,102,241,0.18)" : "var(--surface2)",
                    border: isSelected
                      ? "2px solid var(--accent)"
                      : "2px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800,
                    color: isSelected ? "var(--accent)" : "var(--text-muted)",
                    transition: "all 0.15s",
                  }}>
                    {name.charAt(0).toUpperCase()}
                  </div>

                  {/* infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: "var(--text)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {highlightText(name)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {[s.matricule && highlightText(s.matricule), s.filiere_nom, s.niveau]
                        .filter(Boolean)
                        .reduce((acc, el, i) => i === 0 ? [el] : [...acc, " · ", el], [])}
                    </div>
                  </div>

                  {/* badge sélectionné */}
                  {isSelected && (
                    <CheckCircle size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <style>{`
        @keyframes ssDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : MODAL D'AJOUT D'ABSENCE (moderne)
// ══════════════════════════════════════════════════════════════════════════════

function AddAbsenceModal({ open, onClose, onSave, saving, inscriptions, matieres, matLoading }) {
  const [form, setForm] = useState({
    inscription_id: "",
    matiere_id: "",
    date: "",
    statut: "absent",
    motif: "",
    duree: "",
  });
  const [touched, setTouched] = useState({});

  // Réinitialiser quand on ouvre
  useEffect(() => {
    if (open) {
      setForm({ inscription_id: "", matiere_id: "", date: "", statut: "absent", motif: "", duree: "" });
      setTouched({});
    }
  }, [open]);

  if (!open) return null;

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const touch = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  // Validation
  const errors = {
    inscription_id: touched.inscription_id && !form.inscription_id ? "Étudiant requis" : "",
    matiere_id: touched.matiere_id && !form.matiere_id ? "Matière requise" : "",
    date: touched.date && !form.date ? "Date requise" : "",
  };

  const isFormValid = !!form.inscription_id && !!form.matiere_id && !!form.date && !!form.statut;

  const handleSubmit = () => {
    setTouched({ inscription_id: true, matiere_id: true, date: true });
    if (isFormValid) onSave(form);
  };

  // Icône de statut
  const statutIcons = {
    absent: <XCircle size={15} style={{ color: "#ef4444" }} />,
    retard: <Clock size={15} style={{ color: "#f59e0b" }} />,
    excuse: <AlertCircle size={15} style={{ color: "#3b82f6" }} />,
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 580,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          animation: "modalIn 0.25s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        {/* ── En-tête ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(99,102,241,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <UserPlus size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text)" }}>
                Ajouter une absence
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                Les champs marqués <span style={{ color: "#ef4444" }}>*</span> sont obligatoires
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 8, cursor: "pointer", padding: 6,
              color: "var(--text-muted)", display: "flex", alignItems: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface3)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Corps du formulaire ── */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Ligne 1 : Étudiant + Matière */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Étudiant — recherche dynamique */}
            <ModalField label="Étudiant" required icon={User} error={errors.inscription_id}>
              <StudentSearch
                inscriptions={inscriptions}
                value={form.inscription_id}
                onChange={(id) => {
                  setForm((prev) => ({ ...prev, inscription_id: id }));
                  setTouched((prev) => ({ ...prev, inscription_id: true }));
                }}
                hasError={!!errors.inscription_id}
              />
            </ModalField>

            {/* Matière */}
            <ModalField label="Matière" required icon={BookOpen} error={errors.matiere_id}>
              <select
                value={form.matiere_id}
                onChange={set("matiere_id")}
                onBlur={touch("matiere_id")}
                disabled={matLoading}
                style={getSelectStyle(form.matiere_id, !!errors.matiere_id)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
              >
                <option value="">{matLoading ? "Chargement…" : "Choisir une matière…"}</option>
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}{m.filiere_nom ? ` — ${m.filiere_nom}` : ""}
                  </option>
                ))}
              </select>
              <BookOpen size={15} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)",
                color: form.matiere_id ? "var(--accent)" : "var(--text-muted)",
                pointerEvents: "none", transition: "color 0.2s",
              }} />
              <ChevronDown size={14} style={{
                position: "absolute", right: 11, top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }} />
            </ModalField>
          </div>

          {/* Ligne 2 : Date + Statut + Durée */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {/* Date */}
            <ModalField label="Date" required icon={Calendar} error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={set("date")}
                onBlur={touch("date")}
                style={getInputStyle(form.date, !!errors.date)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlurCapture={(e) => { if (!form.date) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; } }}
              />
              <Calendar size={15} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)",
                color: form.date ? "var(--accent)" : "var(--text-muted)",
                pointerEvents: "none", transition: "color 0.2s",
              }} />
            </ModalField>

            {/* Statut */}
            <ModalField label="Statut" required icon={AlertCircle}>
              <select
                value={form.statut}
                onChange={set("statut")}
                style={getSelectStyle(form.statut)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
              >
                <option value="absent">🔴 Absent</option>
                <option value="retard">🟡 Retard</option>
                <option value="excuse">🔵 Excusé</option>
              </select>
              <AlertCircle size={15} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)",
                color: form.statut ? "var(--accent)" : "var(--text-muted)",
                pointerEvents: "none",
              }} />
              <ChevronDown size={14} style={{
                position: "absolute", right: 11, top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }} />
            </ModalField>

            {/* Durée */}
            <ModalField label="Durée" icon={Timer}>
              <input
                type="text"
                value={form.duree}
                onChange={set("duree")}
                placeholder="Ex : 2h, 1 jour…"
                style={getInputStyle(form.duree)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { if (!form.duree) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; } }}
              />
              <Timer size={15} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)",
                color: form.duree ? "var(--accent)" : "var(--text-muted)",
                pointerEvents: "none", transition: "color 0.2s",
              }} />
            </ModalField>
          </div>

          {/* Motif */}
          <ModalField label="Motif de l'absence" icon={StickyNote}>
            <textarea
              value={form.motif}
              onChange={set("motif")}
              placeholder="Décrire le motif de l'absence (facultatif)…"
              rows={3}
              style={{
                ...getInputStyle(form.motif),
                padding: "11px 14px 11px 38px",
                resize: "vertical",
                minHeight: 80,
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
              onBlur={(e) => { if (!form.motif) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; } }}
            />
            <StickyNote size={15} style={{
              position: "absolute", left: 12, top: 13,
              color: form.motif ? "var(--accent)" : "var(--text-muted)",
              pointerEvents: "none", transition: "color 0.2s",
            }} />
          </ModalField>

          {/* Indicateur de progression */}
          <div style={{
            padding: "10px 14px",
            background: "var(--surface2)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {/* Barre de complétion */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                Complétion du formulaire
              </div>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  borderRadius: 4,
                  background: isFormValid ? "var(--success)" : "var(--accent)",
                  width: `${[form.inscription_id, form.matiere_id, form.date, form.statut].filter(Boolean).length / 4 * 100}%`,
                  transition: "width 0.3s ease, background 0.3s",
                }} />
              </div>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: isFormValid ? "var(--success)" : "var(--accent)",
            }}>
              {[form.inscription_id, form.matiere_id, form.date, form.statut].filter(Boolean).length}/4
            </span>
          </div>
        </div>

        {/* ── Pied du modal ── */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "flex-end", gap: 10,
          background: "var(--surface)",
        }}>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Btn>

          {/* ─── BOUTON ENREGISTRER — désactivé si formulaire incomplet ─── */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || saving}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: !isFormValid || saving ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              background: !isFormValid || saving
                ? "var(--surface3)"
                : "var(--accent)",
              color: !isFormValid || saving
                ? "var(--text-muted)"
                : "#fff",
              opacity: !isFormValid ? 0.6 : 1,
              boxShadow: isFormValid && !saving
                ? "0 2px 8px rgba(99,102,241,0.35)"
                : "none",
            }}
            title={!isFormValid ? "Veuillez remplir tous les champs obligatoires" : ""}
          >
            {saving ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                <Save size={15} />
                Enregistrer
                {!isFormValid && (
                  <span style={{
                    fontSize: 10, background: "rgba(0,0,0,0.15)",
                    borderRadius: 4, padding: "1px 5px",
                  }}>
                    incomplet
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : MODAL DE CONFIRMATION DE SUPPRESSION
// ══════════════════════════════════════════════════════════════════════════════

function ConfirmDeleteModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, maxWidth: 440, width: "100%",
        padding: 28, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        animation: "modalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(239,68,68,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Trash2 size={18} style={{ color: "#ef4444" }} />
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
        </div>
        <p style={{ margin: "0 0 22px 0", color: "var(--text-muted)", lineHeight: 1.6, fontSize: 14 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>Annuler</Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Suppression…" : "Supprimer"}
          </Btn>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(.93) translateY(10px);} to { opacity:1; transform:scale(1) translateY(0);} }`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════

export default function PresencePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // ── Données ──────────────────────────────────────────────────────────────
  const [inscriptions, setInscriptions] = useState([]);
  const [filteredInscriptions, setFilteredInscriptions] = useState([]);
  const [absenceData, setAbsenceData] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [allMatieres, setAllMatieres] = useState([]);
  const [filieres, setFilieres] = useState([]);

  // ── Filtres ───────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMatiere, setSelectedMatiere] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inscLoading, setInscLoading] = useState(true);
  const [matLoading, setMatLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [showStats, setShowStats] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [presenceData, setPresenceData] = useState({});
  const [confirmState, setConfirmState] = useState({
    open: false, title: "", message: "", onConfirm: null, loading: false,
  });

  // ── Permissions ───────────────────────────────────────────────────────────
  const canManagePresence = ["administrateur", "secretaire", "enseignant"].includes(user?.role);
  const canViewStats = ["administrateur", "secretaire"].includes(user?.role);

  // ── Couleurs par statut ───────────────────────────────────────────────────
  const presenceColors = {
    present: { label: "Présent", color: "#fff", bg: "#22c55e", icon: CheckCircle },
    absent:  { label: "Absent",  color: "#fff", bg: "#ef4444", icon: XCircle },
    retard:  { label: "Retard",  color: "#fff", bg: "#f59e0b", icon: Clock },
    excuse:  { label: "Excusé",  color: "#fff", bg: "#3b82f6", icon: AlertCircle },
    "":      { label: "Non défini", color: "var(--text-muted)", bg: "var(--surface2)", icon: null },
  };

  // ── Chargement : inscriptions ─────────────────────────────────────────────
  useEffect(() => {
    setInscLoading(true);
    api.get("/inscriptions")
      .then((r) => {
        const list = extractArray(r.data);
        setInscriptions(list);
        setFilteredInscriptions(list);
      })
      .catch(() => { setInscriptions([]); setFilteredInscriptions([]); })
      .finally(() => setInscLoading(false));
  }, []);

  // ── Chargement : filières ─────────────────────────────────────────────────
  useEffect(() => {
    api.get("/filieres")
      .then((r) => setFilieres(extractArray(r.data)))
      .catch(() => setFilieres([]));
  }, []);

  // ── Chargement : toutes les matières ─────────────────────────────────────
  useEffect(() => {
    setMatLoading(true);
    api.get("/filieres")
      .then(async (fRes) => {
        const filieresData = extractArray(fRes.data);
        const all = [];
        for (const fil of filieresData) {
          try {
            const mRes = await api.get(`/filieres/${fil.id}/matieres`);
            extractArray(mRes.data).forEach((m) =>
              all.push({ ...m, filiere_nom: fil.nom, filiere_id: fil.id })
            );
          } catch { /* silencieux */ }
        }
        setAllMatieres(all);
      })
      .catch(() => setAllMatieres([]))
      .finally(() => setMatLoading(false));
  }, []);

  // ── Filtrer matières selon filière sélectionnée ───────────────────────────
  useEffect(() => {
    setMatieres(filterFiliere
      ? allMatieres.filter((m) => m.filiere_nom === filterFiliere)
      : allMatieres
    );
  }, [filterFiliere, allMatieres]);

  // ── Filtrer inscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    let f = [...inscriptions];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter((i) =>
        i.etudiant_nom?.toLowerCase().includes(q) ||
        i.matricule?.toLowerCase().includes(q)
      );
    }
    if (filterFiliere) f = f.filter((i) => i.filiere_nom === filterFiliere);
    if (filterNiveau)  f = f.filter((i) => i.niveau === filterNiveau);
    setFilteredInscriptions(f);
  }, [searchTerm, filterFiliere, filterNiveau, inscriptions]);

  // ── Chargement absences ───────────────────────────────────────────────────
  // afterSave=true + studentName => affiche le message succès vert après ajout
  const loadAbsenceData = useCallback(async (afterSave = false, studentName = "") => {
    setLoading(true);
    if (!afterSave) setMsg({ text: "", type: "" });
    try {
      let query = "/presences?";
      if (selectedDate)    query += `date=${selectedDate}`;
      if (selectedMatiere) query += `&matiere_id=${selectedMatiere}`;
      if (selectedFiliere) query += `&filiere=${selectedFiliere}`;
      if (selectedNiveau)  query += `&niveau=${selectedNiveau}`;
      if (searchTerm)      query += `&search=${encodeURIComponent(searchTerm)}`;

      const pRes = await api.get(query);
      const absences = Array.isArray(pRes.data) ? pRes.data : [];
      const filtered = absences.filter((p) =>
        ["absent", "retard", "excuse"].includes(p.statut)
      );
      setAbsenceData(filtered);

      // Message succès vert après ajout, sinon message de comptage vert aussi
      if (afterSave && studentName) {
        setMsg({
          text: `✅ Absence enregistrée avec succès pour ${studentName}. ${filtered.length} absence(s) au total.`,
          type: "success",
        });
      } else {
        setMsg({
          text: filtered.length === 0
            ? "📋 Aucune absence enregistrée pour les critères sélectionnés."
            : `✅ ${filtered.length} absence(s) trouvée(s) pour la période sélectionnée.`,
          type: "success",
        });
      }
    } catch (e) {
      setMsg({
        text: `❌ Erreur : ${e.response?.data?.message || "Impossible de charger les absences"}`,
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedMatiere, selectedFiliere, selectedNiveau, searchTerm]);

  // ── Chargement automatique au montage (absences du jour dès l'ouverture) ──
  useEffect(() => {
    loadAbsenceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-dismiss du message : fondu à 3 s, disparu à 6 s ──────────────────
  const [msgVisible, setMsgVisible] = useState(true);
  useEffect(() => {
    if (!msg.text) { setMsgVisible(true); return; }
    setMsgVisible(true);
    // À 3 s : transition de fondu (opacity 1 → 0 en CSS sur 1.5 s)
    const fadeTimer  = setTimeout(() => setMsgVisible(false), 3000);
    // À 6 s : suppression complète du DOM (après la fin du fondu)
    const clearTimer = setTimeout(() => setMsg({ text: "", type: "" }), 6000);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [msg.text]);

  // ── Grouper les absences retournées par l'API par statut ─────────────────
  // absenceData = tableau brut venant de GET /presences
  // Chaque entrée contient : statut, inscription_id, etudiant_nom, matricule,
  // filiere_nom, niveau, etc. — on l'affiche directement sans croiser avec
  // filteredInscriptions (qui reste vide si presenceData n'est pas rempli).
  const getStudentsByStatus = () => {
    const result = { present: [], absent: [], retard: [], excuse: [] };
    absenceData.forEach((absence) => {
      const status = absence.statut || "";
      if (!result[status]) return;
      result[status].push({
        // Champs communs normalisés
        id:          absence.id,               // id de la présence (pour suppression)
        inscription_id: absence.inscription_id,
        fullName:    absence.etudiant_nom
                       ? absence.etudiant_nom + (absence.prenom ? ` ${absence.prenom}` : "")
                       : getStudentFullName(absence),
        matricule:   absence.matricule   || "",
        filiere_nom: absence.filiere_nom || "",
        niveau:      absence.niveau      || "",
        motif:       absence.motif       || "",
        duree:       absence.duree       || "",
        status,
      });
    });
    return result;
  };
  const studentsByStatus = getStudentsByStatus();

  // ── Statistiques ──────────────────────────────────────────────────────────
  const stats = {
    absent:  studentsByStatus.absent.length,
    retard:  studentsByStatus.retard.length,
    excuse:  studentsByStatus.excuse.length,
    present: studentsByStatus.present.length,
    total:   absenceData.length,
  };

  // ── Ajouter une absence ───────────────────────────────────────────────────
  const handleAddAbsence = async (formData) => {
    setSaving(true);
    try {
      await api.post("/presences", formData);
      const student = inscriptions.find((i) => i.id === parseInt(formData.inscription_id));
      const studentName = getStudentFullName(student);
      setShowAddModal(false);
      // Recharger la liste PUIS afficher le message succès (en dernier pour ne pas être écrasé)
      await loadAbsenceData(true, studentName);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur lors de l'enregistrement.", type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // ── Supprimer une absence ─────────────────────────────────────────────────
  const handleDeleteAbsence = (absenceId, studentName) => {
    setConfirmState({
      open: true,
      title: "Supprimer l'absence",
      message: `Confirmez-vous la suppression de l'absence de ${studentName} ? Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        try {
          await api.delete(`/presences/${absenceId}`);
          setMsg({ text: `✅ Absence de ${studentName} supprimée.`, type: "success" });
          await loadAbsenceData();
        } catch (err) {
          setMsg({ text: err.response?.data?.message || "Erreur de suppression.", type: "danger" });
        } finally {
          setConfirmState({ open: false, title: "", message: "", onConfirm: null, loading: false });
        }
      },
      onCancel: () => setConfirmState({ open: false, title: "", message: "", onConfirm: null, loading: false }),
    });
  };

  const filiereOptions = [...new Set(inscriptions.map((i) => i.filiere_nom).filter(Boolean))];
  const niveauOptions  = ["L1", "L2", "L3", "M1", "M2"];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── En-tête de page ── */}
      <PageHeader
        title="Gestion des Absences"
        subtitle="Suivi, classification et enregistrement des absences des étudiants"
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {canManagePresence && (
              <Btn onClick={() => setShowAddModal(true)} icon={<UserPlus size={16} />}>
                Ajouter une absence
              </Btn>
            )}
            {canViewStats && (
              <Btn
                variant="ghost"
                onClick={() => setShowStats((v) => !v)}
                icon={showStats ? <ChevronUp size={16} /> : <BarChart3 size={16} />}
              >
                {showStats ? "Masquer stats" : "Statistiques"}
              </Btn>
            )}
          </div>
        }
      />

      {/* ── Barre de filtres ── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* Recherche */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>
              <Search size={13} style={{ opacity: 0.7 }} />
              Rechercher un étudiant
            </label>
            <div style={{ position: "relative", marginTop: 6 }}>
              <input
                type="text"
                placeholder="Nom ou matricule…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={baseInputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)";  e.currentTarget.style.boxShadow = "none"; }}
              />
              <Search size={14} style={{
                position: "absolute", left: 11, top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }} />
            </div>
          </div>

          {/* Filière */}
          <div style={{ minWidth: 160 }}>
            <NativeSelect label="Filière" value={filterFiliere} onChange={(e) => setFilterFiliere(e.target.value)}>
              <option value="">Toutes les filières</option>
              {filiereOptions.map((f) => <option key={f} value={f}>{f}</option>)}
            </NativeSelect>
          </div>

          {/* Niveau */}
          <div style={{ minWidth: 130 }}>
            <NativeSelect label="Niveau" value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}>
              <option value="">Tous niveaux</option>
              {niveauOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </NativeSelect>
          </div>

          {/* Matière */}
          <div style={{ minWidth: 160 }}>
            <NativeSelect label="Matière" value={selectedMatiere} onChange={(e) => setSelectedMatiere(e.target.value)} disabled={matLoading}>
              <option value="">{matLoading ? "Chargement…" : "Toutes les matières"}</option>
              {matieres.map((m) => (
                <option key={m.id} value={m.id}>{m.nom} — {m.filiere_nom}</option>
              ))}
            </NativeSelect>
          </div>

          {/* Date */}
          <div style={{ minWidth: 150 }}>
            <label style={{ ...labelStyle, marginBottom: 6, display: "flex" }}>
              <Calendar size={13} style={{ opacity: 0.7 }} /> Date
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ ...baseInputStyle, paddingLeft: 34 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)";  e.currentTarget.style.boxShadow = "none"; }}
              />
              <Calendar size={14} style={{
                position: "absolute", left: 11, top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }} />
            </div>
          </div>

          {/* Bouton Rechercher */}
          <div style={{ alignSelf: "flex-end" }}>
            <Btn onClick={loadAbsenceData} disabled={loading} loading={loading} icon={<Search size={15} />}>
              {loading ? "Chargement…" : "Rechercher"}
            </Btn>
          </div>
        </div>
      </Card>

      {/* ── Message de feedback ── */}
      {msg.text && (
        <div style={{
          marginBottom: 20,
          opacity: msgVisible ? 1 : 0,
          transition: "opacity 1.5s ease",
          pointerEvents: msgVisible ? "auto" : "none",
        }}>
          <Alert
            type={msg.type === "success" ? "success" : msg.type === "warning" ? "warning" : msg.type === "info" ? "info" : "danger"}
          >
            {msg.text}
          </Alert>
        </div>
      )}

      {/* ── Statistiques ── */}
      {showStats && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <BarChart3 size={20} style={{ color: "var(--accent)" }} />
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>Statistiques des Absences</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            {[
              { key: "absent",  label: "Absents",  color: "#ef4444", icon: XCircle },
              { key: "retard",  label: "Retards",  color: "#f59e0b", icon: Clock },
              { key: "excuse",  label: "Excusés",  color: "#3b82f6", icon: AlertCircle },
              { key: "present", label: "Présents", color: "#22c55e", icon: CheckCircle },
            ].map(({ key, label, color, icon: Icon }) => (
              <div key={key} style={{
                textAlign: "center", padding: "18px 12px",
                background: "var(--surface2)", borderRadius: 10,
                border: `1px solid ${color}22`,
              }}>
                <Icon size={22} style={{ color, marginBottom: 6 }} />
                <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 4 }}>
                  {stats[key]}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Colonnes par statut ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18, marginBottom: 20 }}>
        {[
          { key: "absent",  label: "Absents",  icon: XCircle,      color: "#ef4444" },
          { key: "retard",  label: "Retards",  icon: Clock,        color: "#f59e0b" },
          { key: "excuse",  label: "Excusés",  icon: AlertCircle,  color: "#3b82f6" },
        ].map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon size={18} style={{ color }} />
              <h3 style={{ margin: 0, fontSize: 15, color: "var(--text)" }}>
                {label}
                <span style={{
                  marginLeft: 8, fontSize: 12, fontWeight: 700,
                  background: `${color}22`, color, padding: "2px 7px", borderRadius: 20,
                }}>
                  {studentsByStatus[key].length}
                </span>
              </h3>
            </div>

            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {studentsByStatus[key].length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                  <Icon size={28} style={{ opacity: 0.25, marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>Aucun étudiant</div>
                </div>
              ) : (
                studentsByStatus[key].map((student) => (
                  <div
                    key={student.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 4px", borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: `${color}20`, border: `2px solid ${color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color }}>
                        {student.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {student.fullName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {[student.matricule, student.filiere_nom, student.niveau].filter(Boolean).join(" · ")}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        title="Modifier"
                        style={{
                          background: "var(--surface2)", border: "1px solid var(--border)",
                          borderRadius: 6, cursor: "pointer", padding: "5px 8px",
                          color: "var(--text-muted)", display: "flex", alignItems: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        title="Supprimer"
                        onClick={() => handleDeleteAbsence(student.id, student.fullName)}
                        style={{
                          background: "var(--surface2)", border: "1px solid var(--border)",
                          borderRadius: 6, cursor: "pointer", padding: "5px 8px",
                          color: "var(--text-muted)", display: "flex", alignItems: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#ef4444"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* ── Modal d'ajout d'absence ── */}
      <AddAbsenceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAbsence}
        saving={saving}
        inscriptions={filteredInscriptions}
        matieres={matieres}
        matLoading={matLoading}
      />

      {/* ── Modal de confirmation de suppression ── */}
      <ConfirmDeleteModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
        loading={confirmState.loading}
      />
    </div>
  );
}
