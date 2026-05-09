import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PageHeader,
  Card,
  Btn,
  Badge,
  Alert,
  Spinner,
  Modal,
} from "../components/ui";

const mentionColor = {
  Admis: "success",
  Rattrapage: "warning",
  Ajourné: "danger",
};

// --- MODAL DE CONFIRMATION STYLISÉE ---
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading = false }) {
  if (!open) return null;
  return (
    <Modal title={title || "Confirmation"} onClose={onCancel} width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>Annuler</Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suppression...' : 'Confirmer'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function NotesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState("");
  const [bulletin, setBulletin] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [editNotes, setEditNotes] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [inscLoading, setInscLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // État pour la confirmation
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    noteId: null,
    matiereId: null,
    loading: false,
  });

  const openConfirm = (noteId, matiereId, message) => {
    setConfirmState({
      open: true,
      title: "Suppression",
      message: message || "Supprimer cette note ? Cette action est irréversible.",
      noteId,
      matiereId,
      loading: false,
    });
  };

  const closeConfirm = () => {
    setConfirmState({ open: false, title: "", message: "", noteId: null, matiereId: null, loading: false });
  };

  // ── Chargement des inscriptions ──────────────────────────────────────────────
  // FIX : Le backend retourne { success: true, data: [...] }
  // On extrait correctement avec data?.data ?? data (fallback si tableau direct)
  useEffect(() => {
    setInscLoading(true);
    api
      .get("/inscriptions")
      .then((r) => {
        // Support { success, data: [] } ET réponse tableau direct
        const raw = r.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];

        setInscriptions(list);

        // Pré-sélection depuis l'URL ?inscription=...
        const paramId = searchParams.get("inscription");
        if (paramId && list.some((i) => String(i.id) === String(paramId))) {
          setSelectedInscription(paramId);
        }
      })
      .catch((err) => {
        console.error("Erreur chargement inscriptions:", err);
        setInscriptions([]);
      })
      .finally(() => setInscLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chargement du bulletin ───────────────────────────────────────────────────
  const loadBulletin = useCallback(
    async (inscriptionId) => {
      if (!inscriptionId) {
        setBulletin(null);
        setEditNotes({});
        setMatieres([]);
        return;
      }

      setLoading(true);
      setMsg({ text: "", type: "" });

      try {
        // FIX : on cherche l'inscription dans la liste courante
        const inscInfo = inscriptions.find(
          (i) => String(i.id) === String(inscriptionId)
        );

        const bulletinPromise = api.get(`/notes/bulletin/${inscriptionId}`);

        let matieresPromise = Promise.resolve({ data: [] });
        if (inscInfo?.filiere_id) {
          matieresPromise = api
            .get(`/filieres/${inscInfo.filiere_id}/matieres`)
            .catch(() =>
              api
                .get(`/matieres?filiere_id=${inscInfo.filiere_id}`)
                .catch(() => ({ data: [] }))
            );
        }

        const [bRes, mRes] = await Promise.all([bulletinPromise, matieresPromise]);
        const bData = bRes.data;
        setBulletin(bData);

        // FIX : support { data: [] } ET { matieres: [] } ET tableau direct
        const matRaw = mRes.data;
        const matList = Array.isArray(matRaw)
          ? matRaw
          : Array.isArray(matRaw?.data)
          ? matRaw.data
          : Array.isArray(matRaw?.matieres)
          ? matRaw.matieres
          : [];
        setMatieres(matList);

        // Initialisation des notes éditables
        const init = {};
        const bulletinObj = bData.bulletin || {};
        Object.values(bulletinObj).forEach((sem) => {
          (sem.notes || []).forEach((n) => {
            if (n.matiere_id !== undefined && n.matiere_id !== null) {
              init[String(n.matiere_id)] = parseFloat(n.note) || 0;
            }
          });
        });

        // Si aucune note encore, on initialise à 0 pour chaque matière
        if (Object.keys(init).length === 0 && matList.length > 0) {
          matList.forEach((m) => {
            init[String(m.id)] = 0;
          });
        }
        setEditNotes(init);
      } catch (err) {
        console.error("Erreur bulletin:", err);
        setBulletin(null);
        setMsg({ text: "Impossible de charger le bulletin.", type: "danger" });
      } finally {
        setLoading(false);
      }
    },
    [inscriptions]
  );

  // FIX : on déclenche loadBulletin quand selectedInscription change
  // ET quand loadBulletin est reconstruit (après chargement de inscriptions)
  useEffect(() => {
    if (!selectedInscription) {
      setBulletin(null);
      setEditNotes({});
      setMatieres([]);
      return;
    }
    loadBulletin(selectedInscription);
  }, [selectedInscription, loadBulletin]);

  // ── Enregistrement des notes ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMsg({ text: "", type: "" });
    try {
      const notes = Object.entries(editNotes)
        .map(([matiere_id, note]) => ({
          matiere_id: parseInt(matiere_id, 10),
          note: parseFloat(note),
        }))
        .filter(
          (n) =>
            !isNaN(n.matiere_id) &&
            !isNaN(n.note) &&
            n.note >= 0 &&
            n.note <= 20
        );

      if (notes.length === 0) {
        setMsg({
          text: "Aucune note valide à enregistrer. Vérifiez les valeurs (0–20).",
          type: "danger",
        });
        setSaving(false);
        return;
      }

      const inscriptionIdInt = parseInt(selectedInscription, 10);
      if (isNaN(inscriptionIdInt)) {
        setMsg({ text: "Inscription invalide.", type: "danger" });
        setSaving(false);
        return;
      }

      await api.post("/notes/batch", { inscription_id: inscriptionIdInt, notes });
      setMsg({
        text: `${notes.length} note(s) enregistrée(s) avec succès.`,
        type: "success",
      });

      const r = await api.get(`/notes/bulletin/${selectedInscription}`);
      setBulletin(r.data);
      const init = {};
      Object.values(r.data.bulletin || {}).forEach((sem) => {
        (sem.notes || []).forEach((n) => {
          if (n.matiere_id !== undefined && n.matiere_id !== null) {
            init[String(n.matiere_id)] = parseFloat(n.note) || 0;
          }
        });
      });
      setEditNotes(init);
    } catch (err) {
      console.error("Erreur batch save:", err.response?.data || err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de l'enregistrement.";
      setMsg({ text: serverMsg, type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // ── Suppression d'une note ───────────────────────────────────────────────────
  const performDeleteNote = async (noteId, matiereId) => {
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await api.delete(`/notes/${noteId}`);
      setMsg({ text: "Note supprimée.", type: "success" });
      setEditNotes((prev) => ({ ...prev, [String(matiereId)]: 0 }));
      const r = await api.get(`/notes/bulletin/${selectedInscription}`);
      setBulletin(r.data);
      closeConfirm();
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || "Erreur suppression.",
        type: "danger",
      });
      closeConfirm();
    }
  };

  // ── Génération PDF ───────────────────────────────────────────────────────────
  const generatePDF = async () => {
    if (!bulletin) return;
    setPdfGenerating(true);
    try {
      const pdfContent = document.createElement("div");
      pdfContent.style.width = "800px";
      pdfContent.style.padding = "20px";
      pdfContent.style.backgroundColor = "white";
      pdfContent.style.fontFamily = "Arial, sans-serif";
      pdfContent.style.color = "#000";
      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0;">UNIVERSITÉ DE ...</h1>
          <h2 style="margin: 5px 0;">RELEVÉ DE NOTES</h2>
          <hr />
        </div>
        <div style="margin-bottom: 20px;">
          <p><strong>Étudiant :</strong> ${bulletin.inscription?.etudiant_nom || "-"}</p>
          <p><strong>Matricule :</strong> ${bulletin.inscription?.matricule || "-"}</p>
          <p><strong>Filière :</strong> ${bulletin.inscription?.filiere_nom || "-"} (${bulletin.inscription?.niveau || "-"})</p>
          <p><strong>Année universitaire :</strong> ${bulletin.inscription?.annee_universitaire || "-"}</p>
        </div>
      `;

      const bulletinObj = bulletin.bulletin || {};
      for (const [semestre, data] of Object.entries(bulletinObj)) {
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.marginBottom = "20px";
        table.innerHTML = `
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Matière</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Coeff.</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Note /20</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Pondérée</th>
            </tr>
          </thead>
          <tbody>
            ${(data.notes || [])
              .map(
                (n) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${n.matiere}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${n.coefficient}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${n.note}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(parseFloat(n.note) * parseFloat(n.coefficient)).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        `;
        pdfContent.appendChild(table);
        pdfContent.innerHTML += `
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <p><strong>Semestre ${semestre}</strong></p>
            <p>Moyenne : <strong>${data.moyenne}/20</strong> | Mention : <strong>${data.mention}</strong></p>
          </div>
          <hr />
        `;
      }

      if (bulletin.moyenne_generale !== undefined) {
        pdfContent.innerHTML += `
          <div style="text-align: right; margin-top: 20px;">
            <p><strong>Moyenne générale : ${bulletin.moyenne_generale}/20</strong></p>
          </div>
        `;
      }

      document.body.appendChild(pdfContent);
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(
        `releve_notes_${bulletin.inscription?.matricule || "etudiant"}.pdf`
      );
      document.body.removeChild(pdfContent);
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      setMsg({ text: "Erreur lors de la génération du PDF.", type: "danger" });
    } finally {
      setPdfGenerating(false);
    }
  };

  // ── Permissions selon le rôle ──────────────────────────────────────────────
  const canDelete =
    user?.role === "administrateur" || user?.role === "secretaire";
  const canEdit =
    user?.role === "administrateur" ||
    user?.role === "secretaire" ||
    user?.role === "enseignant";

  // ── Rendu d'un semestre ────────────────────────────────────────────────────
  const renderSemestre = (semestre, data) => (
    <Card key={semestre}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            color: "var(--text)",
            margin: 0,
          }}
        >
          Semestre {semestre}
        </h3>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Moyenne :{" "}
            <strong
              style={{
                color:
                  parseFloat(data.moyenne) >= 10
                    ? "var(--success)"
                    : "var(--danger)",
                fontSize: 16,
              }}
            >
              {data.moyenne}/20
            </strong>
          </span>
          <Badge color={mentionColor[data.mention] || "muted"}>
            {data.mention}
          </Badge>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {[
              "Matière",
              "Coefficient",
              "Note /20",
              "Pondérée",
              ...(canDelete ? ["Action"] : []),
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  color: "var(--text-muted)",
                  fontSize: 12,
                  borderBottom: "1px solid var(--border)",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(data.notes || []).map((n, idx) => {
            const key =
              n.matiere_id !== undefined && n.matiere_id !== null
                ? String(n.matiere_id)
                : `idx-${idx}`;
            const currentNote =
              editNotes[key] !== undefined
                ? editNotes[key]
                : parseFloat(n.note) ?? 0;
            return (
              <tr key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px", color: "var(--text)" }}>
                  {n.matiere}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>
                  {n.coefficient}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {canEdit ? (
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={currentNote}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditNotes((prev) => ({
                          ...prev,
                          [key]: val === "" ? "" : parseFloat(val),
                        }));
                      }}
                      style={{
                        width: 70,
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        color: "var(--text)",
                        padding: "4px 8px",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  ) : (
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>
                      {currentNote}
                    </span>
                  )}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>
                  {(
                    parseFloat(currentNote || 0) * parseFloat(n.coefficient)
                  ).toFixed(2)}
                </td>
                {canDelete && (
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    {n.note_id && (
                      <Btn
                        small
                        variant="danger"
                        onClick={() =>
                          openConfirm(
                            n.note_id,
                            key,
                            "Supprimer cette note ? Cette action est irréversible."
                          )
                        }
                      >
                        <Trash2 size={14} style={{ marginRight: 4 }} /> Supprimer
                      </Btn>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );

  // ── Saisie initiale (aucune note encore) ────────────────────────────────────
  const renderSaisieInitiale = () => {
    if (matieres.length === 0) return null;
    const parSemestre = {};
    matieres.forEach((m) => {
      const sem = m.semestre ?? "S1";
      if (!parSemestre[sem]) parSemestre[sem] = [];
      parSemestre[sem].push(m);
    });
    return Object.entries(parSemestre)
      .sort()
      .map(([sem, list]) => (
        <Card key={sem}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Semestre {sem} — Saisie initiale
          </h3>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr>
                {["Matière", "Coefficient", "Note /20"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      color: "var(--text-muted)",
                      fontSize: 12,
                      borderBottom: "1px solid var(--border)",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--text)" }}>
                    {m.nom}
                  </td>
                  <td
                    style={{ padding: "10px 12px", color: "var(--text-muted)" }}
                  >
                    {m.coefficient}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {canEdit ? (
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={editNotes[String(m.id)] ?? 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditNotes((prev) => ({
                            ...prev,
                            [String(m.id)]: val === "" ? "" : parseFloat(val),
                          }));
                        }}
                        style={{
                          width: 70,
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          color: "var(--text)",
                          padding: "4px 8px",
                          fontSize: 14,
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ));
  };

  const hasNotes =
    bulletin && Object.keys(bulletin.bulletin || {}).length > 0;

  // ── Helper : label d'une inscription dans le select ────────────────────────
  // FIX : le backend fait CONCAT(nom, ' ', prenom) donc etudiant_nom = "RAKOTO Jean"
  // On affiche : "RAKOTO Jean (MAT001) — Filière L1 2024-2025"
  const inscriptionLabel = (i) => {
    const nom = i.etudiant_nom || `Étudiant #${i.etudiant_id}`;
    const mat = i.matricule ? ` (${i.matricule})` : "";
    const filiere = i.filiere_nom ? ` — ${i.filiere_nom}` : "";
    const niveau = i.niveau ? ` ${i.niveau}` : "";
    const annee = i.annee_universitaire ? ` ${i.annee_universitaire}` : "";
    return `${nom}${mat}${filiere}${niveau}${annee}`;
  };

  return (
    <div>
      <PageHeader
        title="Notes & Bulletins"
        subtitle="Saisie et consultation des notes par inscription"
      />

      {/* ── Sélecteur d'inscription ── */}
      <div style={{ marginBottom: 20, maxWidth: 600 }} className="no-print">
        {inscLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Spinner />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Chargement des inscriptions…
            </span>
          </div>
        ) : (
          <>
            {/* Label */}
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: 6,
            }}>
              Sélectionner une inscription
              {inscriptions.length > 0 && (
                <span style={{ fontWeight: 400, marginLeft: 6 }}>
                  ({inscriptions.length} disponible{inscriptions.length > 1 ? "s" : ""})
                </span>
              )}
            </label>

            {/* Select natif — fiable avec des données async */}
            <div style={{ position: "relative" }}>
              <select
                value={selectedInscription}
                onChange={(e) => {
                  setBulletin(null);
                  setEditNotes({});
                  setMatieres([]);
                  setMsg({ text: "", type: "" });
                  setSelectedInscription(e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "10px 36px 10px 13px",
                  fontSize: 14,
                  background: "var(--surface2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm, 8px)",
                  color: selectedInscription ? "var(--text)" : "var(--text-muted)",
                  outline: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                  colorScheme: "dark",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
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
                <option value="">— Choisir une inscription —</option>
                {inscriptions.map((i) => (
                  <option key={i.id} value={String(i.id)}>
                    {inscriptionLabel(i)}
                  </option>
                ))}
              </select>

              {/* Flèche custom */}
              <div style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "var(--text-muted)",
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Message si liste vide */}
            {inscriptions.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--danger)", marginTop: 8 }}>
                ⚠ Aucune inscription trouvée. Vérifiez que des étudiants sont
                bien inscrits dans le module <strong>Inscriptions</strong>.
              </p>
            )}
          </>
        )}
      </div>

      {loading && <Spinner />}

      {bulletin && !loading && (
        <div className="print-area">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Info étudiant */}
            <Card>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  ["Étudiant", bulletin.inscription?.etudiant_nom],
                  ["Matricule", bulletin.inscription?.matricule],
                  ["Filière", bulletin.inscription?.filiere_nom],
                  ["Niveau", bulletin.inscription?.niveau],
                  ["Année", bulletin.inscription?.annee_universitaire],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 2,
                      }}
                    >
                      {k}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {v || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {msg.text && (
              <Alert
                type={msg.type === "success" ? "success" : "danger"}
                className="no-print"
              >
                {msg.text}
              </Alert>
            )}

            {hasNotes ? (
              Object.entries(bulletin.bulletin).map(([semestre, data]) =>
                renderSemestre(semestre, data)
              )
            ) : (
              <>
                {matieres.length > 0 ? (
                  renderSaisieInitiale()
                ) : (
                  <Card>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        textAlign: "center",
                        padding: "24px 0",
                        fontSize: 14,
                      }}
                    >
                      Aucune note enregistrée. Aucune matière trouvée pour cette
                      filière.
                    </p>
                  </Card>
                )}
              </>
            )}

            {/* Boutons d'action */}
            {Object.keys(editNotes).length > 0 && (
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
                className="no-print"
              >
                {canEdit && (
                  <Btn onClick={handleSave} disabled={saving}>
                    {saving ? "Enregistrement…" : "💾 Enregistrer les notes"}
                  </Btn>
                )}
                <Btn
                  variant="secondary"
                  onClick={generatePDF}
                  disabled={pdfGenerating || !hasNotes}
                >
                  {pdfGenerating ? "Génération..." : "📄 Télécharger PDF"}
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedInscription && !loading && (
        <Card className="no-print">
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            Sélectionnez une inscription pour consulter ou saisir les notes.
          </p>
        </Card>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() =>
          performDeleteNote(confirmState.noteId, confirmState.matiereId)
        }
        onCancel={closeConfirm}
        loading={confirmState.loading}
      />
    </div>
  );
}
