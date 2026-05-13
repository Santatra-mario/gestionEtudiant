import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Calendar, CheckCircle, XCircle, Clock, Save, Search,
  ChevronDown, ChevronUp, AlertCircle, UserPlus, Edit,
  Trash2, BarChart3, BookOpen, User, StickyNote, Timer, X,
  InboxIcon,
} from "lucide-react";
import { PageHeader, Card, Btn, Alert } from "../components/ui";

// ══════════════════════════════════════════════════════════════════════════════
// STYLES GLOBAUX
// ══════════════════════════════════════════════════════════════════════════════
const labelStyle = {
  fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
  textTransform: "uppercase", letterSpacing: "0.05em",
  display: "flex", alignItems: "center", gap: 4,
};
const baseInputStyle = {
  width: "100%", padding: "10px 13px 10px 36px", fontSize: 14,
  background: "var(--surface2)", border: "1.5px solid var(--border)",
  borderRadius: 8, color: "var(--text)", outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
};
const baseSelectStyle = {
  ...baseInputStyle, paddingLeft: 13,
  appearance: "none", WebkitAppearance: "none",
  cursor: "pointer", paddingRight: 36, colorScheme: "dark",
};
const modalInputBase = {
  width: "100%", padding: "11px 14px 11px 38px", fontSize: 14,
  background: "var(--surface2)", border: "1.5px solid var(--border)",
  borderRadius: 10, color: "var(--text)", outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
};
const getInputStyle = (value, hasError = false) => ({
  ...modalInputBase,
  borderColor: hasError ? "#ef4444" : value ? "var(--accent)" : "var(--border)",
  boxShadow:   value    ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
});
const getSelectStyle = (value, hasError = false) => ({
  ...modalInputBase,
  appearance: "none", WebkitAppearance: "none",
  cursor: "pointer", paddingRight: 36, colorScheme: "dark",
  borderColor: hasError ? "#ef4444" : value ? "var(--accent)" : "var(--border)",
  boxShadow:   value    ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
});

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function extractArray(d) {
  if (Array.isArray(d))          return d;
  if (Array.isArray(d?.data))    return d.data;
  if (Array.isArray(d?.matieres)) return d.matieres;
  return [];
}
function getStudentFullName(s) {
  if (!s) return "";
  const nom    = s.etudiant_nom || s.nom || "";
  const prenom = s.prenom || "";
  if (nom && prenom) return `${nom} ${prenom}`;
  return nom || prenom || "Étudiant inconnu";
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : NativeSelect
// ══════════════════════════════════════════════════════════════════════════════
function NativeSelect({ label, value, onChange, children, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ position: "relative" }}>
        <select value={value} onChange={onChange} disabled={disabled} style={baseSelectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)";  e.currentTarget.style.boxShadow = "none"; }}
        >{children}</select>
        <ChevronDown size={15} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : ModalField
// ══════════════════════════════════════════════════════════════════════════════
function ModalField({ label, required, icon: Icon, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle}>
        {Icon && <Icon size={13} style={{ opacity: 0.7 }} />}
        {label}
        {required && <span style={{ color: "#ef4444", fontSize: 16, lineHeight: 1 }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>{children}</div>
      {error && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{error}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : StudentSearch — recherche dynamique avec dropdown
// ══════════════════════════════════════════════════════════════════════════════
function StudentSearch({ inscriptions, value, onChange, hasError }) {
  const [query,       setQuery]       = useState("");
  const [open,        setOpen]        = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  const selectedStudent = inscriptions.find((s) => String(s.id) === String(value));
  const displayName     = selectedStudent
    ? getStudentFullName(selectedStudent) + (selectedStudent.matricule ? ` (${selectedStudent.matricule})` : "")
    : "";

  const inputValue = open ? query : displayName;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inscriptions.slice(0, 8);
    return inscriptions.filter((s) =>
      getStudentFullName(s).toLowerCase().includes(q) ||
      (s.matricule   || "").toLowerCase().includes(q) ||
      (s.filiere_nom || "").toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, inscriptions]);

  const handleSelect = (student) => { onChange(String(student.id)); setQuery(""); setOpen(false); };
  const handleChange = (e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true); if (e.target.value === "") onChange(""); };
  const handleFocus  = () => { setQuery(displayName); setOpen(true); setHighlighted(0); };
  const handleKeyDown = (e) => {
    if (!open) { setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp")  { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter")    { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]); }
    else if (e.key === "Escape")   { setOpen(false); setQuery(""); }
  };

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[highlighted + 1];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const active      = !!(value || query);
  const borderColor = hasError ? "#ef4444" : active ? "var(--accent)" : "var(--border)";
  const boxShadow   = active ? "0 0 0 3px rgba(99,102,241,0.12)" : "none";

  const hl = (text) => {
    const q = query.trim().toLowerCase();
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q);
    if (i === -1) return text;
    return (<>{text.slice(0, i)}<mark style={{ background: "rgba(99,102,241,0.28)", color: "var(--accent)", borderRadius: 3, padding: "0 2px", fontWeight: 700 }}>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: active ? "var(--accent)" : "var(--text-muted)", pointerEvents: "none", transition: "color 0.2s", zIndex: 1 }} />
        <input ref={inputRef} type="text" autoComplete="off" spellCheck={false}
          placeholder="Tapez un nom ou matricule…"
          value={inputValue} onChange={handleChange} onFocus={handleFocus} onKeyDown={handleKeyDown}
          style={{ ...modalInputBase, borderColor, boxShadow, paddingLeft: 38, paddingRight: value ? 34 : 14 }}
        />
        {value && (
          <button type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(""); setQuery(""); setTimeout(() => inputRef.current?.focus(), 0); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "var(--surface3)", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--text-muted)" }}
            title="Effacer"
          ><X size={12} /></button>
        )}
      </div>

      {open && (
        <div ref={listRef} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--surface)", border: "1.5px solid var(--accent)", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.22)", maxHeight: 240, overflowY: "auto", zIndex: 99999, animation: "ssDropIn 0.14s cubic-bezier(0.34,1.2,0.64,1)" }}>
          {/* En-tête compteur */}
          <div style={{ padding: "6px 14px 5px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "10px 10px 0 0", letterSpacing: "0.04em" }}>
            {filtered.length === 0 ? `Aucun résultat pour « ${query} »` : `${filtered.length} étudiant${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: "18px 16px", textAlign: "center" }}>
              <User size={28} style={{ opacity: 0.2, display: "block", margin: "0 auto 6px" }} />
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucun étudiant ne correspond à <strong>« {query} »</strong></div>
            </div>
          ) : filtered.map((s, idx) => {
            const name  = getStudentFullName(s);
            const isHov = idx === highlighted;
            const isSel = String(s.id) === String(value);
            return (
              <div key={s.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                onMouseEnter={() => setHighlighted(idx)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: isSel ? "rgba(99,102,241,0.10)" : isHov ? "var(--surface2)" : "transparent", borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", transition: "background 0.1s", borderLeft: isSel ? "3px solid var(--accent)" : isHov ? "3px solid rgba(99,102,241,0.3)" : "3px solid transparent" }}
              >
                <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: isSel ? "rgba(99,102,241,0.18)" : "var(--surface2)", border: isSel ? "2px solid var(--accent)" : "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: isSel ? "var(--accent)" : "var(--text-muted)" }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hl(name)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{[s.matricule, s.filiere_nom, s.niveau].filter(Boolean).join(" · ")}</div>
                </div>
                {isSel && <CheckCircle size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes ssDropIn { from { opacity:0; transform:translateY(-6px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : EmptyState — état vide d'une colonne (EN ROUGE)
// ══════════════════════════════════════════════════════════════════════════════
function EmptyState({ label, Icon, color, isFiltered }) {
  return (
    <div style={{
      textAlign: "center", padding: "32px 16px",
      background: "rgba(239,68,68,0.04)",
      border: "1.5px dashed rgba(239,68,68,0.35)",
      borderRadius: 10, margin: "4px 0",
    }}>
      {/* Icône cercle rouge */}
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "rgba(239,68,68,0.10)",
        border: "2px solid rgba(239,68,68,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 12px",
      }}>
        <Icon size={22} style={{ color: "#ef4444", opacity: 0.7 }} />
      </div>

      {/* Texte principal */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>
        Aucun étudiant {label.toLowerCase()}
      </div>

      {/* Sous-texte contextuel */}
      <div style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", lineHeight: 1.5 }}>
        {isFiltered
          ? "Aucun résultat ne correspond à votre filtre."
          : "Aucune absence enregistrée pour cette catégorie."}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : StudentCard — carte d'un étudiant dans une colonne
// ══════════════════════════════════════════════════════════════════════════════
function StudentCard({ student, color, canManage, onDelete }) {
  const statusLabel = student.statut === "retard" ? "En retard le" : student.statut === "excuse" ? "Excusé le" : "Absent le";

  return (
    <div
      style={{ padding: "12px 8px", borderBottom: "1px solid var(--border)", borderRadius: 6, transition: "background 0.15s" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      {/* ── Ligne 1 : Avatar + Nom + Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: `${color}18`, border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color }}>
          {student.fullName.charAt(0).toUpperCase()}
        </div>

        {/* Nom */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {student.fullName}
          </div>
        </div>

        {/* Boutons action */}
        {canManage && (
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button title="Modifier"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", padding: "5px 8px", color: "var(--text-muted)", display: "flex", alignItems: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            ><Edit size={13} /></button>
            <button title="Supprimer" onClick={() => onDelete(student.id, student.fullName)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", padding: "5px 8px", color: "var(--text-muted)", display: "flex", alignItems: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#ef4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            ><Trash2 size={13} /></button>
          </div>
        )}
      </div>

      {/* ── Grille d'informations détaillées ── */}
      <div style={{ marginTop: 10, marginLeft: 50, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>

        {/* Matricule */}
        {student.matricule && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <User size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{student.matricule}</span>
          </div>
        )}

        {/* Niveau */}
        {student.niveau && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <BarChart3 size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Niveau <span style={{ fontWeight: 700, color: "var(--text)" }}>{student.niveau}</span>
            </span>
          </div>
        )}

        {/* Matière (pleine largeur) */}
        {student.matiere_nom && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, gridColumn: "1 / -1" }}>
            <BookOpen size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>{student.matiere_nom}</span>
              {student.filiere_nom && <span style={{ color: "var(--text-muted)" }}> — {student.filiere_nom}</span>}
            </span>
          </div>
        )}

        {/* Date d'absence (pleine largeur) */}
        {student.date && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, gridColumn: "1 / -1" }}>
            <Calendar size={11} style={{ color, flexShrink: 0 }} />
            <span style={{ fontSize: 11 }}>
              <span style={{ color: "var(--text-muted)" }}>{statusLabel} </span>
              <span style={{ fontWeight: 700, color }}>{formatDate(student.date)}</span>
            </span>
          </div>
        )}

        {/* Durée */}
        {student.duree && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Timer size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Durée : <span style={{ fontWeight: 700, color: "var(--text)" }}>{student.duree}</span>
            </span>
          </div>
        )}

        {/* Motif (pleine largeur) */}
        {student.motif && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 5, gridColumn: "1 / -1" }}>
            <StickyNote size={11} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {student.motif}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : AddAbsenceModal
// ══════════════════════════════════════════════════════════════════════════════
function AddAbsenceModal({ open, onClose, onSave, saving, inscriptions, matieres, matLoading }) {
  const [form, setForm]     = useState({ inscription_id: "", matiere_id: "", date: "", statut: "absent", motif: "", duree: "" });
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (open) { setForm({ inscription_id: "", matiere_id: "", date: "", statut: "absent", motif: "", duree: "" }); setTouched({}); }
  }, [open]);

  if (!open) return null;

  const set   = (field) => (e) => { setForm((p) => ({ ...p, [field]: e.target.value })); setTouched((p) => ({ ...p, [field]: true })); };
  const touch = (field) => ()  => setTouched((p) => ({ ...p, [field]: true }));

  const errors = {
    inscription_id: touched.inscription_id && !form.inscription_id ? "Étudiant requis"  : "",
    matiere_id:     touched.matiere_id     && !form.matiere_id     ? "Matière requise"  : "",
    date:           touched.date           && !form.date           ? "Date requise"     : "",
  };
  const isFormValid      = !!form.inscription_id && !!form.matiere_id && !!form.date && !!form.statut;
  const completedFields  = [form.inscription_id, form.matiere_id, form.date, form.statut].filter(Boolean).length;

  const handleSubmit = () => {
    setTouched({ inscription_id: true, matiere_id: true, date: true });
    if (isFormValid) onSave(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", animation: "modalIn 0.25s cubic-bezier(0.34,1.4,0.64,1)" }}>

        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserPlus size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Ajouter une absence</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Les champs <span style={{ color: "#ef4444" }}>*</span> sont obligatoires</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: 6, color: "var(--text-muted)", display: "flex", alignItems: "center", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface3)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          ><X size={16} /></button>
        </div>

        {/* Corps */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Étudiant */}
          <ModalField label="Étudiant" required icon={User} error={errors.inscription_id}>
            <StudentSearch
              inscriptions={inscriptions}
              value={form.inscription_id}
              onChange={(id) => { setForm((p) => ({ ...p, inscription_id: id })); setTouched((p) => ({ ...p, inscription_id: true })); }}
              hasError={!!errors.inscription_id}
            />
          </ModalField>

          {/* Matière */}
          <ModalField label="Matière" required icon={BookOpen} error={errors.matiere_id}>
            <select value={form.matiere_id} onChange={set("matiere_id")} onBlur={touch("matiere_id")} disabled={matLoading}
              style={getSelectStyle(form.matiere_id, !!errors.matiere_id)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
            >
              <option value="">{matLoading ? "Chargement…" : "Choisir une matière…"}</option>
              {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}{m.filiere_nom ? ` — ${m.filiere_nom}` : ""}</option>)}
            </select>
            <BookOpen size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: form.matiere_id ? "var(--accent)" : "var(--text-muted)", pointerEvents: "none" }} />
            <ChevronDown size={14} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          </ModalField>

          {/* Date + Statut + Durée */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <ModalField label="Date" required icon={Calendar} error={errors.date}>
              <input type="date" value={form.date} onChange={set("date")} onBlur={touch("date")}
                style={getInputStyle(form.date, !!errors.date)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlurCapture={(e) => { if (!form.date) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; } }}
              />
              <Calendar size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: form.date ? "var(--accent)" : "var(--text-muted)", pointerEvents: "none" }} />
            </ModalField>

            <ModalField label="Statut" required icon={AlertCircle}>
              <select value={form.statut} onChange={set("statut")} style={getSelectStyle(form.statut)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
              >
                <option value="absent">🔴 Absent</option>
                <option value="retard">🟡 Retard</option>
                <option value="excuse">🔵 Excusé</option>
              </select>
              <AlertCircle size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--accent)", pointerEvents: "none" }} />
              <ChevronDown size={14} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            </ModalField>

            <ModalField label="Durée" icon={Timer}>
              <input type="text" value={form.duree} onChange={set("duree")} placeholder="Ex : 2h, 1 jour…"
                style={getInputStyle(form.duree)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { if (!form.duree) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; } }}
              />
              <Timer size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: form.duree ? "var(--accent)" : "var(--text-muted)", pointerEvents: "none" }} />
            </ModalField>
          </div>

          {/* Motif */}
          <ModalField label="Motif de l'absence" icon={StickyNote}>
            <textarea value={form.motif} onChange={set("motif")} placeholder="Décrire le motif (facultatif)…" rows={3}
              style={{ ...getInputStyle(form.motif), padding: "11px 14px 11px 38px", resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
              onBlur={(e) => { if (!form.motif) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; } }}
            />
            <StickyNote size={15} style={{ position: "absolute", left: 12, top: 13, color: form.motif ? "var(--accent)" : "var(--text-muted)", pointerEvents: "none" }} />
          </ModalField>

          {/* Barre de progression */}
          <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>Complétion du formulaire</div>
              <div style={{ height: 5, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, transition: "width 0.35s ease, background 0.35s", width: `${(completedFields / 4) * 100}%`, background: isFormValid ? "#22c55e" : "var(--accent)" }} />
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: isFormValid ? "#22c55e" : "var(--accent)", minWidth: 28, textAlign: "right" }}>{completedFields}/4</span>
          </div>
        </div>

        {/* Pied */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Annuler</Btn>
          <button onClick={handleSubmit} disabled={!isFormValid || saving}
            title={!isFormValid ? "Remplissez tous les champs obligatoires" : ""}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: !isFormValid || saving ? "not-allowed" : "pointer", transition: "all 0.2s", background: !isFormValid || saving ? "var(--surface3)" : "var(--accent)", color: !isFormValid || saving ? "var(--text-muted)" : "#fff", opacity: !isFormValid ? 0.55 : 1, boxShadow: isFormValid && !saving ? "0 2px 10px rgba(99,102,241,0.35)" : "none" }}
          >
            {saving
              ? (<><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Enregistrement…</>)
              : (<><Save size={15} />Enregistrer{!isFormValid && <span style={{ fontSize: 10, background: "rgba(0,0,0,0.12)", borderRadius: 4, padding: "1px 6px" }}>incomplet</span>}</>)
            }
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin    { from { transform:rotate(0deg); }                          to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : ConfirmDeleteModal
// ══════════════════════════════════════════════════════════════════════════════
function ConfirmDeleteModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, maxWidth: 440, width: "100%", padding: 28, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", animation: "modalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={18} style={{ color: "#ef4444" }} />
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
        </div>
        <p style={{ margin: "0 0 22px 0", color: "var(--text-muted)", lineHeight: 1.6, fontSize: 14 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>Annuler</Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>{loading ? "Suppression…" : "Supprimer"}</Btn>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(.93) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function PresencePage() {
  const { user } = useAuth();

  // ── Données ───────────────────────────────────────────────────────────────
  const [inscriptions,  setInscriptions]  = useState([]);
  const [allAbsences,   setAllAbsences]   = useState([]);
  const [allMatieres,   setAllMatieres]   = useState([]);
  const [matieres,      setMatieres]      = useState([]);

  // ── Filtres ───────────────────────────────────────────────────────────────
  const [searchTerm,      setSearchTerm]      = useState("");
  const [filterFiliere,   setFilterFiliere]   = useState("");
  const [filterNiveau,    setFilterNiveau]    = useState("");
  const [selectedMatiere, setSelectedMatiere] = useState("");
  const [selectedDate,    setSelectedDate]    = useState("");

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [inscLoading,  setInscLoading]  = useState(true);
  const [matLoading,   setMatLoading]   = useState(true);
  const [msg,          setMsg]          = useState({ text: "", type: "" });
  const [msgVisible,   setMsgVisible]   = useState(true);
  const [showStats,    setShowStats]    = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", onConfirm: null, loading: false });

  // ── Permissions ───────────────────────────────────────────────────────────
  const canManage = ["administrateur", "secretaire", "enseignant"].includes(user?.role);
  const canStats  = ["administrateur", "secretaire"].includes(user?.role);

  // ══════════════════════════════════════════════════════════════════════════
  // CHARGEMENTS INITIAUX
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    setInscLoading(true);
    api.get("/inscriptions")
      .then((r) => setInscriptions(extractArray(r.data)))
      .catch(() => setInscriptions([]))
      .finally(() => setInscLoading(false));
  }, []);

  useEffect(() => {
    setMatLoading(true);
    api.get("/filieres").then(async (fRes) => {
      const fils = extractArray(fRes.data);
      const all  = [];
      for (const f of fils) {
        try {
          const mRes = await api.get(`/filieres/${f.id}/matieres`);
          extractArray(mRes.data).forEach((m) => all.push({ ...m, filiere_nom: f.nom, filiere_id: f.id }));
        } catch { /**/ }
      }
      setAllMatieres(all); setMatieres(all);
    }).catch(() => { setAllMatieres([]); setMatieres([]); }).finally(() => setMatLoading(false));
  }, []);

  useEffect(() => {
    setMatieres(filterFiliere ? allMatieres.filter((m) => m.filiere_nom === filterFiliere) : allMatieres);
  }, [filterFiliere, allMatieres]);

  // ══════════════════════════════════════════════════════════════════════════
  // MESSAGE HELPER + AUTO-DISMISS
  // ══════════════════════════════════════════════════════════════════════════
  const showMsg = useCallback((text, type) => {
    setMsg({ text, type });
    setMsgVisible(true);
  }, []);

  useEffect(() => {
    if (!msg.text) { setMsgVisible(true); return; }
    setMsgVisible(true);
    const t1 = setTimeout(() => setMsgVisible(false), 3000);
    const t2 = setTimeout(() => setMsg({ text: "", type: "" }), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [msg.text]);

  // ══════════════════════════════════════════════════════════════════════════
  // CHARGEMENT ABSENCES
  // ══════════════════════════════════════════════════════════════════════════
  const loadAbsences = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate)    params.set("date",       selectedDate);
      if (selectedMatiere) params.set("matiere_id", selectedMatiere);

      const res      = await api.get(`/presences?${params.toString()}`);
      const raw      = Array.isArray(res.data) ? res.data : [];
      const absences = raw.filter((p) => ["absent", "retard", "excuse"].includes(p.statut));
      setAllAbsences(absences);

      if (opts.afterSave && opts.studentName) {
        showMsg(`✅ Absence enregistrée pour ${opts.studentName}. Total : ${absences.length} absence(s).`, "success");
      } else if (!opts.silent) {
        showMsg(
          absences.length === 0
            ? "📋 Aucune absence pour les critères sélectionnés."
            : `✅ ${absences.length} absence(s) trouvée(s).`,
          "success"
        );
      }
    } catch (e) {
      showMsg(`❌ Erreur : ${e.response?.data?.message || "Impossible de charger les absences"}`, "danger");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedMatiere, showMsg]);

  // Chargement silencieux au montage
  useEffect(() => {
    loadAbsences({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTRAGE CLIENT (temps réel)
  // ══════════════════════════════════════════════════════════════════════════
  const displayedAbsences = useMemo(() => {
    let list = [...allAbsences];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((a) =>
        (a.etudiant_nom || "").toLowerCase().includes(q) ||
        (a.prenom       || "").toLowerCase().includes(q) ||
        (a.matricule    || "").toLowerCase().includes(q)
      );
    }
    if (filterFiliere) list = list.filter((a) => a.filiere_nom === filterFiliere);
    if (filterNiveau)  list = list.filter((a) => a.niveau      === filterNiveau);
    return list;
  }, [allAbsences, searchTerm, filterFiliere, filterNiveau]);

  const byStatus = useMemo(() => {
    const r = { absent: [], retard: [], excuse: [] };
    displayedAbsences.forEach((a) => {
      const st = a.statut;
      if (!r[st]) return;
      r[st].push({
        id:           a.id,
        inscription_id: a.inscription_id,
        fullName:     a.etudiant_nom ? a.etudiant_nom + (a.prenom ? ` ${a.prenom}` : "") : getStudentFullName(a),
        matricule:    a.matricule    || "",
        filiere_nom:  a.filiere_nom  || "",
        niveau:       a.niveau       || "",
        matiere_nom:  a.matiere_nom  || a.matiere || "",
        date:         a.date         || "",
        motif:        a.motif        || "",
        duree:        a.duree        || "",
        statut:       st,
      });
    });
    return r;
  }, [displayedAbsences]);

  const stats          = { absent: byStatus.absent.length, retard: byStatus.retard.length, excuse: byStatus.excuse.length, total: displayedAbsences.length };
  const isFiltered     = !!(searchTerm || filterFiliere || filterNiveau);
  const filiereOptions = [...new Set(allAbsences.map((a) => a.filiere_nom).filter(Boolean))];
  const niveauOptions  = ["L1", "L2", "L3", "M1", "M2"];

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  const handleAddAbsence = async (formData) => {
    setSaving(true);
    try {
      await api.post("/presences", formData);
      const student = inscriptions.find((i) => i.id === parseInt(formData.inscription_id));
      setShowAddModal(false);
      await loadAbsences({ afterSave: true, studentName: getStudentFullName(student) });
    } catch (err) {
      showMsg(err.response?.data?.message || "Erreur lors de l'enregistrement.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAbsence = (absenceId, studentName) => {
    setConfirmState({
      open: true,
      title: "Supprimer l'absence",
      message: `Confirmez-vous la suppression de l'absence de ${studentName} ? Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, loading: true }));
        try {
          await api.delete(`/presences/${absenceId}`);
          showMsg(`✅ Absence de ${studentName} supprimée.`, "success");
          await loadAbsences({ silent: true });
        } catch (err) {
          showMsg(err.response?.data?.message || "Erreur de suppression.", "danger");
        } finally {
          setConfirmState({ open: false, title: "", message: "", onConfirm: null, loading: false });
        }
      },
      onCancel: () => setConfirmState({ open: false, title: "", message: "", onConfirm: null, loading: false }),
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── En-tête ── */}
      <PageHeader
        title="Gestion des Absences"
        subtitle="Suivi, classification et enregistrement des absences des étudiants"
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {canManage && (
              <Btn onClick={() => setShowAddModal(true)} icon={<UserPlus size={16} />}>
                Ajouter une absence
              </Btn>
            )}
            {canStats && (
              <Btn variant="ghost" onClick={() => setShowStats((v) => !v)} icon={showStats ? <ChevronUp size={16} /> : <BarChart3 size={16} />}>
                {showStats ? "Masquer stats" : "Statistiques"}
              </Btn>
            )}
          </div>
        }
      />

      {/* ── Barre de filtres ── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* Recherche texte */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ ...labelStyle, marginBottom: 6, display: "flex" }}>
              <Search size={13} style={{ opacity: 0.7 }} />Rechercher un étudiant
            </label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input type="text" placeholder="Nom, prénom ou matricule…" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...baseInputStyle }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)";  e.currentTarget.style.boxShadow = "none"; }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                  <X size={14} />
                </button>
              )}
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
              {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom} — {m.filiere_nom}</option>)}
            </NativeSelect>
          </div>

          {/* Date optionnelle */}
          <div style={{ minWidth: 160 }}>
            <label style={{ ...labelStyle, marginBottom: 6, display: "flex" }}>
              <Calendar size={13} style={{ opacity: 0.7 }} />Date (optionnel)
            </label>
            <div style={{ position: "relative" }}>
              <Calendar size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                style={{ ...baseInputStyle }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)";  e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Bouton Rechercher */}
          <div style={{ alignSelf: "flex-end" }}>
            <Btn onClick={() => loadAbsences()} disabled={loading} icon={<Search size={15} />}>
              {loading ? "Chargement…" : "Rechercher"}
            </Btn>
          </div>
        </div>
      </Card>

      {/* ── Badges filtres actifs ── */}
      {isFiltered && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Filtre actif :</span>
          {searchTerm && (
            <span style={{ fontSize: 12, background: "rgba(99,102,241,0.12)", color: "var(--accent)", borderRadius: 20, padding: "2px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              « {searchTerm} »
              <button onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 0, display: "flex" }}><X size={11} /></button>
            </span>
          )}
          {filterFiliere && (
            <span style={{ fontSize: 12, background: "rgba(99,102,241,0.12)", color: "var(--accent)", borderRadius: 20, padding: "2px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              {filterFiliere}
              <button onClick={() => setFilterFiliere("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 0, display: "flex" }}><X size={11} /></button>
            </span>
          )}
          {filterNiveau && (
            <span style={{ fontSize: 12, background: "rgba(99,102,241,0.12)", color: "var(--accent)", borderRadius: 20, padding: "2px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              {filterNiveau}
              <button onClick={() => setFilterNiveau("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 0, display: "flex" }}><X size={11} /></button>
            </span>
          )}
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>→ {displayedAbsences.length} résultat(s)</span>
        </div>
      )}

      {/* ── Message feedback ── */}
      {msg.text && (
        <div style={{ marginBottom: 20, opacity: msgVisible ? 1 : 0, transition: "opacity 1.5s ease", pointerEvents: msgVisible ? "auto" : "none" }}>
          <Alert type={msg.type === "success" ? "success" : msg.type === "warning" ? "warning" : "danger"}>
            {msg.text}
          </Alert>
        </div>
      )}

      {/* ── Statistiques ── */}
      {showStats && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <BarChart3 size={20} style={{ color: "var(--accent)" }} />
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>Statistiques</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
            {[
              { key: "absent", label: "Absents",  color: "#ef4444",        Icon: XCircle    },
              { key: "retard", label: "Retards",  color: "#f59e0b",        Icon: Clock      },
              { key: "excuse", label: "Excusés",  color: "#3b82f6",        Icon: AlertCircle },
              { key: "total",  label: "Total",    color: "var(--accent)",  Icon: BarChart3  },
            ].map(({ key, label, color, Icon }) => (
              <div key={key} style={{ textAlign: "center", padding: "16px 10px", background: "var(--surface2)", borderRadius: 10, border: `1px solid ${color}22` }}>
                <Icon size={20} style={{ color, marginBottom: 6 }} />
                <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 3 }}>{stats[key]}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Colonnes Absent / Retard / Excusé ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 12px", opacity: 0.4 }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          <div style={{ fontSize: 13 }}>Chargement des absences…</div>
          <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18, marginBottom: 20 }}>
          {[
            { key: "absent", label: "Absents",  Icon: XCircle,     color: "#ef4444" },
            { key: "retard", label: "Retards",  Icon: Clock,       color: "#f59e0b" },
            { key: "excuse", label: "Excusés",  Icon: AlertCircle, color: "#3b82f6" },
          ].map(({ key, label, Icon, color }) => (
            <Card key={key}>
              {/* En-tête colonne */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{label}</h3>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, background: byStatus[key].length === 0 ? "rgba(239,68,68,0.12)" : `${color}18`, color: byStatus[key].length === 0 ? "#ef4444" : color, padding: "3px 10px", borderRadius: 20 }}>
                  {byStatus[key].length}
                </span>
              </div>

              {/* Liste */}
              <div style={{ maxHeight: 460, overflowY: "auto" }}>
                {byStatus[key].length === 0
                  ? <EmptyState label={label} Icon={Icon} color={color} isFiltered={isFiltered} />
                  : byStatus[key].map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        color={color}
                        canManage={canManage}
                        onDelete={handleDeleteAbsence}
                      />
                    ))
                }
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <AddAbsenceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAbsence}
        saving={saving}
        inscriptions={inscriptions}
        matieres={matieres}
        matLoading={matLoading}
      />
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
