import { useEffect, useState, useCallback } from "react";
import { X, Save, Edit, Trash2 } from "lucide-react";
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

// ─── Style bouton Modifier : vert fixe ───────────────────────────────────
const BTN_VERT_STYLE = {
  background: "#16a34a",
  color: "#fff",
  border: "1px solid #15803d",
};

// --- MODAL DE CONFIRMATION STYLISÉE ---
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading = false }) {
  if (!open) return null;
  return (
    <Modal title={title || "Confirmation"} onClose={onCancel} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>{message}</p>
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

// --- MODAL FILIÈRE ---
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
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initial ? "Modifier filière" : "Nouvelle filière"}
      onClose={onClose}
      width={460}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}
      >
        {error && <Alert style={{ width: "100%" }}>{error}</Alert>}
        <div style={{ width: "100%", maxWidth: 320 }}>
          <Input label="Code *" value={form.code} onChange={set("code")} placeholder="ex: INFO" required disabled={!!initial?.id} />
        </div>
        <div style={{ width: "100%", maxWidth: 320 }}>
          <Input label="Nom *" value={form.nom} onChange={set("nom")} placeholder="ex: Informatique" required />
        </div>
        <div style={{ width: "100%", maxWidth: 320 }}>
          <Input label="Description" value={form.description || ""} onChange={set("description")} placeholder="Description optionnelle" />
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
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
const SEMESTRES_VALIDES = ["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10"];
const NIVEAU_SEMESTRES = {
  L1: ["S1", "S2"],
  L2: ["S3", "S4"],
  L3: ["S5", "S6"],
  M1: ["S7", "S8"],
  M2: ["S9", "S10"],
};

// --- MODAL MATIÈRE ---
function MatiereModal({ filiereId, onClose, onSaved, initial }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, enseignant_id: initial.enseignant_id ?? "" }
      : { filiere_id: filiereId, code: "", nom: "", coefficient: 1, semestre: "S1", enseignant_id: "" },
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
    const codeOk = form.code.trim() !== "";
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
        enseignant_id: form.enseignant_id === "" ? null : parseInt(form.enseignant_id, 10),
      };
      if (initial?.id) {
        await api.put(`/filieres/matieres/${initial.id}`, payload);
      } else {
        await api.post("/filieres/matieres", payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de la matière.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={initial ? "Modifier matière" : "Nouvelle matière"} onClose={onClose} width={440}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}
      >
        {error && <Alert style={{ width: "100%" }}>{error}</Alert>}

        <div style={{ width: "100%", maxWidth: 320 }}>
          <Input label="Code *" value={form.code} onChange={set("code")} placeholder="ex: ALGO1" required disabled={!!initial?.id} />
        </div>

        <div style={{ width: "100%", maxWidth: 320 }}>
          <Input label="Nom *" value={form.nom} onChange={set("nom")} placeholder="ex: Algorithmique 1" required />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 320 }}>
          <Input label="Coefficient *" type="number" min="1" max="10" step="0.5" value={form.coefficient} onChange={set("coefficient")} required />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Semestre *</label>
            <select
              value={form.semestre}
              onChange={set("semestre")}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                padding: "9px 12px",
                fontSize: 14,
                outline: "none",
                width: "100%",
              }}
            >
              {Object.entries(NIVEAU_SEMESTRES).map(([niveau, sems]) => (
                <optgroup key={niveau} label={`── ${niveau}`}>
                  {sems.map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 320 }}>
          <label style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 5 }}>
            Enseignant assigné
          </label>
          <select
            value={form.enseignant_id ?? ""}
            onChange={set("enseignant_id")}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              padding: "9px 12px",
              fontSize: 14,
              outline: "none",
              width: "100%",
            }}
          >
            <option value="">— Aucun enseignant assigné —</option>
            {enseignants.map((e) => (
              <option key={e.id} value={e.id}>{e.nom_complet}</option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 4 }}>
            L'enseignant assigné pourra saisir les notes de cette matière.
          </span>
        </div>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
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
  const { notification, hideNotification, success, error: showError } = useNotification();

  const canManageFilieres = user?.role === "administrateur" || user?.role === "secretaire";
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
    open: false, title: "", message: "", onConfirm: null, loading: false,
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
    setConfirmState({ open: false, title: "", message: "", onConfirm: null, loading: false });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await api.get("/filieres");
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setFilieres(list);
    } catch {
      setLoadError(true);
      setFilieres([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadMatieres = async (filiereId) => {
    try {
      const { data } = await api.get(`/filieres/${filiereId}/matieres`);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setMatieres((m) => ({ ...m, [filiereId]: list }));
    } catch {
      setMatieres((m) => ({ ...m, [filiereId]: [] }));
    }
  };

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return; }
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
      showError(err.response?.data?.message || "Erreur lors de la désactivation.");
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
      showError(err.response?.data?.message || "Erreur lors de la suppression.");
      closeConfirm();
    }
  };

  if (loadError) {
    return (
      <div>
        <PageHeader title="Filières & Matières" subtitle="Gestion des filières et de leurs matières" />
        <Card>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ color: "var(--danger)", marginBottom: 12 }}>Impossible de charger les filières.</p>
            <Btn onClick={load}>Réessayer</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <NotificationDisplay notification={notification} onClose={hideNotification} />

      <PageHeader
        title="Filières & Matières"
        subtitle={`${filieres.length} filière(s) active(s)`}
        action={
          canManageFilieres && (
            <Btn onClick={() => setModal("create")}>+ Nouvelle filière</Btn>
          )
        }
      />

      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filieres.length === 0 && (
            <Card>
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
                Aucune filière active.{" "}
                {canManageFilieres && "Créez la première filière avec le bouton ci-dessus."}
              </p>
            </Card>
          )}

          {filieres.map((f) => (
            <Card key={f.id} style={{ padding: 0 }}>
              {/* ── En-tête filière ── */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  cursor: "pointer",
                }}
                onClick={() => toggleExpand(f.id)}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <Badge color="accent">{f.code}</Badge>
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>{f.nom}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.nb_matieres} matière(s)</span>
                  {f.description && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                      — {f.description}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {canManageFilieres && (
                    // ✅ Vert fixe — plus de onMouseEnter/onMouseLeave qui écrasaient le style
                    <Btn
                      small
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveButton(`filiere-${f.id}`);
                        setModal(f);
                      }}
                      style={BTN_VERT_STYLE}
                    >
                      <Edit size={14} style={{ marginRight: 6 }} />
                      Modifier
                    </Btn>
                  )}
                  {isAdmin && (
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
                  <span style={{ color: "var(--text-muted)", padding: "0 4px", fontSize: 12 }}>
                    {expanded === f.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* ── Matières ── */}
              {expanded === f.id && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Matières</span>
                    {canManageFilieres && (
                      <Btn small onClick={() => setMatiereModal({ filiereId: f.id, initial: null })}>
                        + Ajouter matière
                      </Btn>
                    )}
                  </div>

                  {!matieres[f.id] ? (
                    <Spinner />
                  ) : matieres[f.id].length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Aucune matière pour cette filière.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {matieres[f.id].map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "var(--surface2)",
                            borderRadius: 8,
                            padding: "10px 14px",
                          }}
                        >
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <Badge color="muted">{m.semestre}</Badge>
                            <span style={{ fontSize: 14, color: "var(--text)" }}>{m.nom}</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
                              {m.code}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              Coeff. {m.coefficient}
                            </span>
                            {m.enseignant_nom ? (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "var(--success)",
                                  background: "rgba(34,197,94,0.1)",
                                  borderRadius: 4,
                                  padding: "2px 6px",
                                }}
                              >
                                👤 {m.enseignant_nom}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-muted)",
                                  background: "var(--surface)",
                                  borderRadius: 4,
                                  padding: "2px 6px",
                                  fontStyle: "italic",
                                }}
                              >
                                Aucun enseignant
                              </span>
                            )}
                          </div>

                          {canManageFilieres && (
                            <div style={{ display: "flex", gap: 6 }}>
                              {/* ✅ Vert fixe — plus de onMouseEnter/onMouseLeave */}
                              <Btn
                                small
                                variant="ghost"
                                onClick={() => {
                                  setActiveButton(`matiere-${m.id}`);
                                  setMatiereModal({ filiereId: f.id, initial: m });
                                }}
                                style={BTN_VERT_STYLE}
                              >
                                <Edit size={14} style={{ marginRight: 6 }} />
                                Modifier
                              </Btn>
                              {isAdmin && (
                                <Btn
                                  small
                                  variant="danger"
                                  onClick={() =>
                                    openConfirm(
                                      `Supprimer la matière "${m.nom}" ? Cette action est irréversible.`,
                                      () => handleDeleteMatiere(m.id, f.id, m.nom),
                                      "Suppression",
                                    )
                                  }
                                >
                                  <Trash2 size={14} style={{ marginRight: 6 }} />
                                  Suppr.
                                </Btn>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
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
          onClose={() => { setModal(null); setActiveButton(null); }}
          onSaved={() => {
            const isEdit = modal !== "create";
            success(
              isEdit
                ? `Filière "${modal.nom}" modifiée avec succès.`
                : "Nouvelle filière créée avec succès."
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
          onClose={() => { setMatiereModal(null); setActiveButton(null); }}
          onSaved={() => {
            const isEdit = !!matiereModal.initial;
            success(
              isEdit
                ? `Matière "${matiereModal.initial.nom}" modifiée avec succès.`
                : "Nouvelle matière ajoutée avec succès."
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
