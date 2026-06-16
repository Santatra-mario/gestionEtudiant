import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
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
  MessageSquare,
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

function getInputStyle(value, hasError = false) {
  return {
    ...modalInputBase,
    borderColor: hasError
      ? "#ef4444"
      : value
        ? "var(--accent)"
        : "var(--border)",
    boxShadow: value ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
  };
}

function getSelectStyle(value, hasError = false) {
  return {
    ...modalSelectBase,
    borderColor: hasError
      ? "#ef4444"
      : value
        ? "var(--accent)"
        : "var(--border)",
    boxShadow: value ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : SELECT NATIF
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
            position: "absolute",
            right: 11,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT : CHAMP INPUT MODAL
// ══════════════════════════════════════════════════════════════════════════════

function ModalField({ label, required, icon: Icon, error, children }) {
  return (
    <div style={fieldWrapStyle}>
      <label style={labelStyle}>
        {Icon && <Icon size={13} style={{ opacity: 0.7 }} />}
        {label}
        {required && <span style={requiredDotStyle}>*</span>}
      </label>
      <div style={{ position: "relative" }}>{children}</div>
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
// COMPOSANT : MODAL D'AJOUT D'ABSENCE
// ══════════════════════════════════════════════════════════════════════════════

function AddAbsenceModal({
  open,
  onClose,
  onSave,
  saving,
  inscriptions,
  matieres,
  matLoading,
}) {
  const [form, setForm] = useState({
    inscription_id: "",
    matiere_id: "",
    date: "",
    statut: "absent",
    motif: "",
    duree: "",
    heure: "",
    observation: "",
  });
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        inscription_id: "",
        matiere_id: "",
        date: "",
        statut: "absent",
        motif: "",
        duree: "",
        heure: "",
        observation: "",
      });
      setTouched({});
    }
  }, [open]);

  if (!open) return null;

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const touch = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const errors = {
    inscription_id:
      touched.inscription_id && !form.inscription_id ? "Étudiant requis" : "",
    matiere_id: touched.matiere_id && !form.matiere_id ? "Matière requise" : "",
    date: touched.date && !form.date ? "Date requise" : "",
    heure: touched.heure && !form.heure ? "Veuillez renseigner l'heure de l'absence." : "",
  };

  const isFormValid =
    !!form.inscription_id && !!form.matiere_id && !!form.date && !!form.statut && !!form.heure;

  const handleSubmit = () => {
    setTouched({ inscription_id: true, matiere_id: true, date: true, heure: true });
    if (isFormValid) onSave(form);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
        {/* En-tête */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(99,102,241,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserPlus size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Ajouter une absence
              </h3>
              <p
                style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}
              >
                Les champs marqués <span style={{ color: "#ef4444" }}>*</span>{" "}
                sont obligatoires
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              padding: 6,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface3)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface2)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps du formulaire */}
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Ligne 1 : Étudiant + Matière */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <ModalField
              label="Étudiant"
              required
              icon={User}
              error={errors.inscription_id}
            >
              <select
                value={form.inscription_id}
                onChange={set("inscription_id")}
                onBlur={touch("inscription_id")}
                style={getSelectStyle(
                  form.inscription_id,
                  !!errors.inscription_id,
                )}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.15)";
                }}
              >
                <option value="">Choisir un étudiant…</option>
                {inscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {getStudentFullName(s)}
                    {s.matricule ? ` (${s.matricule})` : ""}
                  </option>
                ))}
              </select>
              <User
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: form.inscription_id
                    ? "var(--accent)"
                    : "var(--text-muted)",
                  pointerEvents: "none",
                  transition: "color 0.2s",
                }}
              />
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
            </ModalField>

            <ModalField
              label="Matière"
              required
              icon={BookOpen}
              error={errors.matiere_id}
            >
              <select
                value={form.matiere_id}
                onChange={set("matiere_id")}
                onBlur={touch("matiere_id")}
                disabled={matLoading}
                style={getSelectStyle(form.matiere_id, !!errors.matiere_id)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.15)";
                }}
              >
                <option value="">
                  {matLoading ? "Chargement…" : "Choisir une matière…"}
                </option>
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom_matiere || m.nom}
                    {m.filiere_nom ? ` — ${m.filiere_nom}` : ""}
                  </option>
                ))}
              </select>
              <BookOpen
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: form.matiere_id
                    ? "var(--accent)"
                    : "var(--text-muted)",
                  pointerEvents: "none",
                  transition: "color 0.2s",
                }}
              />
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
            </ModalField>
          </div>

          {/* Ligne 2 : Date + Statut + Durée */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 14,
            }}
          >
            <ModalField
              label="Date"
              required
              icon={Calendar}
              error={errors.date}
            >
              <input
                type="date"
                value={form.date}
                onChange={set("date")}
                onBlur={touch("date")}
                style={getInputStyle(form.date, !!errors.date)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.15)";
                }}
                onBlurCapture={(e) => {
                  if (!form.date) {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
              <Calendar
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: form.date ? "var(--accent)" : "var(--text-muted)",
                  pointerEvents: "none",
                  transition: "color 0.2s",
                }}
              />
            </ModalField>

            {/* ── Heure de l'absence (nouveau champ obligatoire) ── */}
            <ModalField
              label="Heure"
              required
              icon={Clock}
              error={errors.heure}
            >
              <input
                type="time"
                value={form.heure}
                onChange={set("heure")}
                onBlur={touch("heure")}
                style={getInputStyle(form.heure, !!errors.heure)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.15)";
                }}
                onBlurCapture={(e) => {
                  if (!form.heure) {
                    e.currentTarget.style.borderColor = errors.heure
                      ? "#DC2626"
                      : "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
              <Clock
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: form.heure ? "var(--accent)" : "var(--text-muted)",
                  pointerEvents: "none",
                  transition: "color 0.2s",
                }}
              />
            </ModalField>

            <ModalField label="Statut" required icon={AlertCircle}>
              <select
                value={form.statut}
                onChange={set("statut")}
                style={getSelectStyle(form.statut)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.15)";
                }}
              >
                <option value="absent">🔴 Absent</option>
                <option value="retard">🟡 Retard</option>
                <option value="excuse">🔵 Excusé</option>
              </select>
              <AlertCircle
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: form.statut ? "var(--accent)" : "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
            </ModalField>

            <ModalField label="Durée" icon={Timer}>
              <input
                type="text"
                value={form.duree}
                onChange={set("duree")}
                placeholder="Ex : 2h, 1 jour…"
                style={getInputStyle(form.duree)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.15)";
                }}
                onBlur={(e) => {
                  if (!form.duree) {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
              <Timer
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: form.duree ? "var(--accent)" : "var(--text-muted)",
                  pointerEvents: "none",
                  transition: "color 0.2s",
                }}
              />
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
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(99,102,241,0.15)";
              }}
              onBlur={(e) => {
                if (!form.motif) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />
            <StickyNote
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: 13,
                color: form.motif ? "var(--accent)" : "var(--text-muted)",
                pointerEvents: "none",
                transition: "color 0.2s",
              }}
            />
          </ModalField>

          {/* ── Observation / Remarque (nouveau champ facultatif) ── */}
          <ModalField label="Observation / Remarque" icon={MessageSquare}>
            <textarea
              value={form.observation}
              onChange={set("observation")}
              placeholder="Ajouter une remarque ou un commentaire libre (facultatif)…"
              rows={3}
              style={{
                ...getInputStyle(form.observation),
                padding: "11px 14px 11px 38px",
                resize: "vertical",
                minHeight: 80,
                fontFamily: "inherit",
                width: "100%",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(99,102,241,0.15)";
              }}
              onBlur={(e) => {
                if (!form.observation) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />
            <MessageSquare
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: 13,
                color: form.observation ? "var(--accent)" : "var(--text-muted)",
                pointerEvents: "none",
                transition: "color 0.2s",
              }}
            />
          </ModalField>

          {/* Barre de progression */}
          <div
            style={{
              padding: "10px 14px",
              background: "var(--surface2)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Complétion du formulaire
              </div>
              <div
                style={{
                  height: 4,
                  background: "var(--border)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: isFormValid
                      ? "var(--success)"
                      : "var(--accent)",
                    width: `${([form.inscription_id, form.matiere_id, form.date, form.statut, form.heure].filter(Boolean).length / 5) * 100}%`,
                    transition: "width 0.3s ease, background 0.3s",
                  }}
                />
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isFormValid ? "var(--success)" : "var(--accent)",
              }}
            >
              {
                [
                  form.inscription_id,
                  form.matiere_id,
                  form.date,
                  form.statut,
                  form.heure,
                ].filter(Boolean).length
              }
              /5
            </span>
          </div>
        </div>

        {/* Pied du modal */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            background: "var(--surface)",
          }}
        >
          <Btn variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Btn>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: !isFormValid || saving ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              background:
                !isFormValid || saving ? "var(--surface3)" : "var(--accent)",
              color: !isFormValid || saving ? "var(--text-muted)" : "#fff",
              opacity: !isFormValid ? 0.6 : 1,
              boxShadow:
                isFormValid && !saving
                  ? "0 2px 8px rgba(99,102,241,0.35)"
                  : "none",
            }}
            title={
              !isFormValid
                ? "Veuillez remplir tous les champs obligatoires"
                : ""
            }
          >
            {saving ? (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                <Save size={15} />
                Enregistrer
                {!isFormValid && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "rgba(0,0,0,0.15)",
                      borderRadius: 4,
                      padding: "1px 5px",
                    }}
                  >
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

function ConfirmDeleteModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          maxWidth: 440,
          width: "100%",
          padding: 28,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          animation: "modalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(239,68,68,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={18} style={{ color: "#ef4444" }} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            {title}
          </h3>
        </div>
        <p
          style={{
            margin: "0 0 22px 0",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>
            Annuler
          </Btn>
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
  const location = useLocation();

  // ── Données ──────────────────────────────────────────────────────────────
  const [inscriptions, setInscriptions] = useState([]);
  const [filteredInscriptions, setFilteredInscriptions] = useState([]);
  const [absenceData, setAbsenceData] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [allMatieres, setAllMatieres] = useState([]);
  const [filieres, setFilieres] = useState([]);

  // ── Filtres ───────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
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
  // showAddModal : persiste via sessionStorage (navigation) mais reset au F5/rechargement
  const [showAddModal, setShowAddModal] = useState(() => {
    try {
      // history.state est null lors d'un vrai rechargement (F5)
      // Il contient des données lors d'une navigation SPA (react-router)
      const isNavigation = window.history.state && window.history.state.key;
      if (isNavigation) {
        return sessionStorage.getItem("presence_showAddModal") === "true";
      }
      // F5 ou accès direct → toujours fermer le modal + nettoyer
      sessionStorage.removeItem("presence_showAddModal");
      return false;
    } catch {
      return false;
    }
  });

  // Persister dans sessionStorage à chaque changement
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "presence_showAddModal",
        showAddModal ? "true" : "false",
      );
    } catch {
      /* silencieux */
    }
  }, [showAddModal]);

  // Restaurer à la navigation SPA (retour depuis autre page)
  useEffect(() => {
    try {
      const isNavigation = window.history.state && window.history.state.key;
      if (isNavigation) {
        const saved =
          sessionStorage.getItem("presence_showAddModal") === "true";
        setShowAddModal(saved);
      }
    } catch {
      /* silencieux */
    }
  }, [location.pathname]);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

  // ✅ Flag pour éviter le chargement automatique au montage
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ── Permissions ───────────────────────────────────────────────────────────
  const canManagePresence = [
    "administrateur",
    "secretaire",
    "enseignant",
  ].includes(user?.role);
  const canViewStats = ["administrateur", "secretaire"].includes(user?.role);

  // ══════════════════════════════════════════════════════════════════════════
  // CHARGEMENT DES DONNÉES DE BASE (inscriptions, filières, matières)
  // Ces données ne changent pas et sont persistées
  // ══════════════════════════════════════════════════════════════════════════

  // Inscriptions
  useEffect(() => {
    setInscLoading(true);
    api
      .get("/inscriptions")
      .then((r) => {
        const list = extractArray(r.data);
        setInscriptions(list);
        setFilteredInscriptions(list);
      })
      .catch(() => {
        setInscriptions([]);
        setFilteredInscriptions([]);
      })
      .finally(() => setInscLoading(false));
  }, []);

  // Filières
  useEffect(() => {
    api
      .get("/filieres")
      .then((r) => setFilieres(extractArray(r.data)))
      .catch(() => setFilieres([]));
  }, []);

  // Toutes les matières
  useEffect(() => {
    setMatLoading(true);
    api
      .get("/filieres")
      .then(async (fRes) => {
        const filieresData = extractArray(fRes.data);
        const all = [];
        for (const fil of filieresData) {
          try {
            const mRes = await api.get(`/filieres/${fil.id}/matieres`);
            extractArray(mRes.data).forEach((m) =>
              all.push({ ...m, filiere_nom: fil.nom, filiere_id: fil.id }),
            );
          } catch {
            /* silencieux */
          }
        }
        setAllMatieres(all);
      })
      .catch(() => setAllMatieres([]))
      .finally(() => setMatLoading(false));
  }, []);

  // Filtrer matières selon filière
  useEffect(() => {
    setMatieres(
      filterFiliere
        ? allMatieres.filter((m) => m.filiere_nom === filterFiliere)
        : allMatieres,
    );
  }, [filterFiliere, allMatieres]);

  // Filtrer inscriptions
  useEffect(() => {
    let f = [...inscriptions];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter(
        (i) =>
          i.etudiant_nom?.toLowerCase().includes(q) ||
          i.matricule?.toLowerCase().includes(q),
      );
    }
    if (filterFiliere) f = f.filter((i) => i.filiere_nom === filterFiliere);
    if (filterNiveau) f = f.filter((i) => i.niveau === filterNiveau);
    setFilteredInscriptions(f);
  }, [searchTerm, filterFiliere, filterNiveau, inscriptions]);

  // ══════════════════════════════════════════════════════════════════════════
  // ✅ CHARGEMENT INITIAL DES ABSENCES - UNE SEULE FOIS AU MONTAGE
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    // Ne charger qu'une seule fois au montage du composant
    if (!initialLoadDone) {
      loadAbsenceData();
      setInitialLoadDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Dépendances vides = exécution unique au montage

  // ══════════════════════════════════════════════════════════════════════════
  // CHARGEMENT ABSENCES DEPUIS L'API
  // Cette fonction ne doit PAS être appelée automatiquement lors des changements
  // de filtres, seulement explicitement via le bouton "Rechercher"
  // ══════════════════════════════════════════════════════════════════════════

  const loadAbsenceData = useCallback(
    async (showMessage = false, useFilters = false) => {
      setLoading(true);
      try {
        // Chargement initial : aucun filtre → toutes les absences
        // Recherche manuelle : appliquer les filtres sélectionnés
        const params = new URLSearchParams();
        if (useFilters) {
          if (selectedDate) params.append("date", selectedDate);
          if (selectedMatiere) params.append("matiere_id", selectedMatiere);
          if (selectedFiliere) params.append("filiere", selectedFiliere);
          if (selectedNiveau) params.append("niveau", selectedNiveau);
          if (searchTerm) params.append("search", searchTerm);
        }

        const pRes = await api.get(`/presences?${params.toString()}`);
        const absences = extractArray(pRes.data);
        const filtered = absences.filter((p) =>
          ["absent", "retard", "excuse"].includes(p.statut),
        );
        setAbsenceData(filtered);

        if (showMessage) {
          showAutoMsg(
            filtered.length === 0
              ? "Aucune absence trouvée pour les critères sélectionnés."
              : `${filtered.length} absence(s) trouvée(s).`,
            filtered.length === 0 ? "info" : "success",
          );
        }
      } catch (e) {
        if (showMessage) {
          showAutoMsg(
            `❌ Erreur : ${e.response?.data?.message || "Impossible de charger les absences"}`,
            "danger",
          );
        }
        setAbsenceData([]);
      } finally {
        setLoading(false);
      }
    },
    [
      selectedDate,
      selectedMatiere,
      selectedFiliere,
      selectedNiveau,
      searchTerm,
    ],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RECHERCHE MANUELLE (bouton "Rechercher") — appelle l'API avec les filtres
  // ══════════════════════════════════════════════════════════════════════════

  const handleManualSearch = async () => {
    // Recherche avec filtres actifs
    await loadAbsenceData(true, true);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // GROUPER absenceData PAR STATUT
  // ══════════════════════════════════════════════════════════════════════════

  const getStudentsByStatus = useCallback(() => {
    const result = { absent: [], retard: [], excuse: [] };

    absenceData.forEach((absence) => {
      const statut = absence.statut;
      if (!result[statut]) return;

      const matchedInscription = inscriptions.find(
        (i) =>
          i.id ===
          (absence.inscription_id ?? absence.inscriptionId ?? absence.id),
      );

      const enriched = {
        absenceId: absence.id,
        statut,
        date: absence.date,
        motif: absence.motif,
        duree: absence.duree,
        matiere_nom: absence.matiere_nom || absence.matiere?.nom || "",
        id: matchedInscription?.id ?? absence.inscription_id,
        matricule:
          matchedInscription?.matricule ??
          absence.matricule ??
          absence.etudiant_matricule ??
          "",
        filiere_nom:
          matchedInscription?.filiere_nom ??
          absence.filiere_nom ??
          absence.filiere ??
          "",
        niveau: matchedInscription?.niveau ?? absence.niveau ?? "",
        fullName: matchedInscription
          ? getStudentFullName(matchedInscription)
          : absence.etudiant_nom ||
            absence.nom ||
            `${absence.prenom ?? ""} ${absence.nom ?? ""}`.trim() ||
            "Étudiant inconnu",
      };

      result[statut].push(enriched);
    });

    return result;
  }, [absenceData, inscriptions]);

  const studentsByStatus = getStudentsByStatus();

  const stats = {
    absent: studentsByStatus.absent.length,
    retard: studentsByStatus.retard.length,
    excuse: studentsByStatus.excuse.length,
    total: absenceData.length,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // HELPER : afficher un message qui disparaît automatiquement après 4s
  // ══════════════════════════════════════════════════════════════════════════

  const msgTimerRef = useRef(null);

  const showAutoMsg = (text, type = "success") => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    setMsg({ text, type });
    msgTimerRef.current = setTimeout(
      () => setMsg({ text: "", type: "" }),
      4000,
    );
  };

  // Labels selon statut
  const statutLabel = { absent: "Absent", retard: "Retard", excuse: "Excusé" };

  // ══════════════════════════════════════════════════════════════════════════
  // AJOUTER UNE ABSENCE
  // ══════════════════════════════════════════════════════════════════════════

  const handleAddAbsence = async (formData) => {
    setSaving(true);
    try {
      const response = await api.post("/presences", formData);
      const created = response.data;

      const matchedInscription = inscriptions.find(
        (i) => i.id === parseInt(formData.inscription_id),
      );
      const matiere = allMatieres.find(
        (m) => m.id === parseInt(formData.matiere_id),
      );

      const newEntry = {
        id: created?.id ?? Date.now(),
        statut: formData.statut,
        date: formData.date,
        motif: formData.motif || "",
        duree: formData.duree || "",
        inscription_id: parseInt(formData.inscription_id),
        matiere_nom:
          matiere?.nom_matiere || matiere?.nom || created?.matiere_nom || "",
        etudiant_nom: matchedInscription
          ? getStudentFullName(matchedInscription)
          : created?.etudiant_nom || "Étudiant inconnu",
        matricule: matchedInscription?.matricule || "",
        filiere_nom: matchedInscription?.filiere_nom || "",
        niveau: matchedInscription?.niveau || "",
      };

      setAbsenceData((prev) => [...prev, newEntry]);

      const label = statutLabel[formData.statut] || "Absence";
      const studentName = getStudentFullName(matchedInscription);
      showAutoMsg(`✅ ${label} enregistré(e) pour ${studentName}.`, "success");

      setShowAddModal(false); // Fermer après ajout réussi → retour à la liste
      await loadAbsenceData(false, false); // Recharger la liste complète
    } catch (err) {
      showAutoMsg(
        err.response?.data?.message || "Erreur lors de l'enregistrement.",
        "danger",
      );
    } finally {
      setSaving(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MODIFIER UNE ABSENCE
  // ══════════════════════════════════════════════════════════════════════════

  const handleEditAbsence = async (absenceId, newStatut, newMotif) => {
    try {
      const response = await api.put(`/presences/${absenceId}`, {
        statut: newStatut,
        motif: newMotif,
      });

      // Mettre à jour localement
      setAbsenceData((prev) =>
        prev.map((a) =>
          a.id === absenceId ? { ...a, statut: newStatut, motif: newMotif } : a,
        ),
      );

      showAutoMsg(`✅ Absence modifiée avec succès.`, "success");
    } catch (err) {
      showAutoMsg(
        err.response?.data?.message || "Erreur lors de la modification.",
        "danger",
      );
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SUPPRIMER UNE ABSENCE
  // ══════════════════════════════════════════════════════════════════════════

  const handleDeleteAbsence = (absenceId, studentName) => {
    setConfirmState({
      open: true,
      title: "Supprimer l'absence",
      message: `Confirmez-vous la suppression de l'absence de ${studentName} ? Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        try {
          await api.delete(`/presences/${absenceId}`);
          // ✅ Retirer directement de la liste locale sans recharger l'API
          setAbsenceData((prev) => prev.filter((a) => a.id !== absenceId));
          showAutoMsg(`✅ Absence de ${studentName} supprimée.`, "success");
        } catch (err) {
          showAutoMsg(
            err.response?.data?.message || "Erreur de suppression.",
            "danger",
          );
        } finally {
          setConfirmState({
            open: false,
            title: "",
            message: "",
            onConfirm: null,
            loading: false,
          });
        }
      },
      onCancel: () =>
        setConfirmState({
          open: false,
          title: "",
          message: "",
          onConfirm: null,
          loading: false,
        }),
    });
  };

  const filiereOptions =
    filieres.length > 0
      ? filieres
      : [
          ...new Set(inscriptions.map((i) => i.filiere_nom).filter(Boolean)),
        ].map((nom) => ({ nom }));
  const niveauOptions = ["L1", "L2", "L3", "M1", "M2"];

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* En-tête de page */}
      <PageHeader
        title="Gestion des Absences"
        subtitle="Suivi, classification et enregistrement des absences des étudiants"
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {canManagePresence && (
              <Btn
                onClick={() => setShowAddModal(true)}
                icon={<UserPlus size={16} />}
              >
                Ajouter une absence
              </Btn>
            )}
            {canViewStats && (
              <Btn
                variant="ghost"
                onClick={() => setShowStats((v) => !v)}
                icon={
                  showStats ? <ChevronUp size={16} /> : <BarChart3 size={16} />
                }
              >
                {showStats ? "Masquer stats" : "Statistiques"}
              </Btn>
            )}
          </div>
        }
      />

      {/* Barre de filtres */}
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
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
                style={{ ...baseInputStyle, paddingLeft: 34 }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              />
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* Filière */}
          <div style={{ minWidth: 160 }}>
            <NativeSelect
              label="Filière"
              value={filterFiliere}
              onChange={(e) => setFilterFiliere(e.target.value)}
            >
              <option value="">Toutes les filières</option>
              {filiereOptions.map((f) => (
                <option key={f.id ?? f.nom} value={f.nom}>
                  {f.nom}
                </option>
              ))}
            </NativeSelect>
          </div>

          {/* Niveau */}
          <div style={{ minWidth: 130 }}>
            <NativeSelect
              label="Niveau"
              value={filterNiveau}
              onChange={(e) => setFilterNiveau(e.target.value)}
            >
              <option value="">Tous niveaux</option>
              {niveauOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
          </div>

          {/* Matière */}
          <div style={{ minWidth: 160 }}>
            <NativeSelect
              label="Matière"
              value={selectedMatiere}
              onChange={(e) => setSelectedMatiere(e.target.value)}
              disabled={matLoading}
            >
              <option value="">
                {matLoading ? "Chargement…" : "Toutes les matières"}
              </option>
              {matieres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom_matiere || m.nom} — {m.filiere_nom}
                </option>
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
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <Calendar
                size={14}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* ✅ Bouton Rechercher → appelle handleManualSearch avec message */}
          <div style={{ alignSelf: "flex-end" }}>
            <Btn
              onClick={handleManualSearch}
              disabled={loading}
              loading={loading}
              icon={<Search size={15} />}
            >
              {loading ? "Chargement…" : "Rechercher"}
            </Btn>
          </div>
        </div>
      </Card>

      {/* ── TOAST NOTIFICATION ── disparaît après 4s ─────────────────────── */}
      {msg.text && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 99999,
            minWidth: 320,
            maxWidth: 440,
            background:
              msg.type === "success"
                ? "#166534"
                : msg.type === "info"
                  ? "#1e3a5f"
                  : msg.type === "warning"
                    ? "#78350f"
                    : "#7f1d1d",
            border: `1px solid ${msg.type === "success" ? "#22c55e44" : msg.type === "info" ? "#3b82f644" : msg.type === "warning" ? "#f59e0b44" : "#ef444444"}`,
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            overflow: "hidden",
            animation: "toastIn 0.3s cubic-bezier(0.34,1.4,0.64,1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                flexShrink: 0,
                background:
                  msg.type === "success"
                    ? "rgba(34,197,94,0.2)"
                    : msg.type === "info"
                      ? "rgba(59,130,246,0.2)"
                      : "rgba(239,68,68,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {msg.type === "success" && (
                <CheckCircle size={17} style={{ color: "#22c55e" }} />
              )}
              {msg.type === "info" && (
                <AlertCircle size={17} style={{ color: "#3b82f6" }} />
              )}
              {msg.type === "danger" && (
                <XCircle size={17} style={{ color: "#ef4444" }} />
              )}
              {msg.type === "warning" && (
                <AlertTriangle size={17} style={{ color: "#f59e0b" }} />
              )}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#fff",
                flex: 1,
                lineHeight: 1.45,
              }}
            >
              {msg.text}
            </span>
            <button
              onClick={() => setMsg({ text: "", type: "" })}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: 2,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.1)" }}>
            <div
              style={{
                height: "100%",
                background:
                  msg.type === "success"
                    ? "#22c55e"
                    : msg.type === "info"
                      ? "#3b82f6"
                      : msg.type === "warning"
                        ? "#f59e0b"
                        : "#ef4444",
                animation: "toastProgress 4s linear forwards",
                transformOrigin: "left",
              }}
            />
          </div>
        </div>
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* Statistiques */}
      {showStats && (
        <Card style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <BarChart3 size={20} style={{ color: "var(--accent)" }} />
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>
              Statistiques des Absences
            </h3>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                key: "absent",
                label: "Absents",
                color: "#ef4444",
                icon: XCircle,
              },
              {
                key: "retard",
                label: "Retards",
                color: "#f59e0b",
                icon: Clock,
              },
              {
                key: "excuse",
                label: "Excusés",
                color: "#3b82f6",
                icon: AlertCircle,
              },
            ].map(({ key, label, color, icon: Icon }) => (
              <div
                key={key}
                style={{
                  textAlign: "center",
                  padding: "18px 12px",
                  background: "var(--surface2)",
                  borderRadius: 10,
                  border: `1px solid ${color}22`,
                }}
              >
                <Icon size={22} style={{ color, marginBottom: 6 }} />
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color,
                    lineHeight: 1.1,
                    marginBottom: 4,
                  }}
                >
                  {stats[key]}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Bouton Rafraîchir ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <Btn
          variant="ghost"
          onClick={() => loadAbsenceData(true, false)}
          disabled={loading}
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          }
        >
          Rafraîchir
        </Btn>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          COLONNES PAR STATUT
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 18,
          marginBottom: 20,
        }}
      >
        {[
          { key: "absent", label: "Absents", icon: XCircle, color: "#ef4444" },
          { key: "retard", label: "Retards", icon: Clock, color: "#f59e0b" },
          {
            key: "excuse",
            label: "Excusés",
            icon: AlertCircle,
            color: "#3b82f6",
          },
        ].map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <Icon size={18} style={{ color }} />
              <h3 style={{ margin: 0, fontSize: 15, color: "var(--text)" }}>
                {label}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: `${color}22`,
                    color,
                    padding: "2px 7px",
                    borderRadius: 20,
                  }}
                >
                  {studentsByStatus[key].length}
                </span>
              </h3>
            </div>

            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {studentsByStatus[key].length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 16px",
                    color: "var(--text-muted)",
                  }}
                >
                  <Icon size={28} style={{ opacity: 0.25, marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>Aucun étudiant</div>
                </div>
              ) : (
                studentsByStatus[key].map((student, idx) => (
                  <div
                    key={student.absenceId ?? `${student.id}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 4px",
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: `${color}20`,
                        border: `2px solid ${color}40`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700, color }}>
                        {(student.fullName || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text)",
                          fontSize: 14,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {student.fullName}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {[
                          student.matricule,
                          student.filiere_nom,
                          student.niveau,
                          student.matiere_nom,
                          student.date,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      {student.motif && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                            marginTop: 2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {student.motif}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        title="Modifier"
                        onClick={() => {
                          const newStatut = prompt(
                            "Nouveau statut (absent/retard/excuse) :",
                            student.statut,
                          );
                          if (
                            newStatut &&
                            ["absent", "retard", "excuse"].includes(newStatut)
                          ) {
                            const newMotif = prompt(
                              "Nouveau motif :",
                              student.motif || "",
                            );
                            handleEditAbsence(
                              student.absenceId,
                              newStatut,
                              newMotif || "",
                            );
                          }
                        }}
                        style={{
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          cursor: "pointer",
                          padding: "5px 8px",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--accent)";
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.borderColor = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--surface2)";
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.borderColor = "var(--border)";
                        }}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        title="Supprimer"
                        onClick={() =>
                          handleDeleteAbsence(
                            student.absenceId,
                            student.fullName,
                          )
                        }
                        style={{
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          cursor: "pointer",
                          padding: "5px 8px",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ef4444";
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.borderColor = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--surface2)";
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.borderColor = "var(--border)";
                        }}
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

      {/* Modal d'ajout d'absence */}
      <AddAbsenceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAbsence}
        saving={saving}
        inscriptions={inscriptions}
        matieres={matieres}
        matLoading={matLoading}
      />

      {/* Modal de confirmation de suppression */}
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
