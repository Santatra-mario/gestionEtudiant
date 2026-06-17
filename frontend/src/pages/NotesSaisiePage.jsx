import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification, NotificationDisplay } from "../hooks/useNotification";
import { Trash2, Save, Download, TrendingUp, Hash, Sigma, Award } from "lucide-react";
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

// ── Styles partagés ──────────────────────────────────────────────────────────
const selectStyle = {
  width: "100%",
  padding: "10px 36px 10px 13px",
  fontSize: 14,
  background: "var(--surface2)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm, 8px)",
  color: "var(--text)",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
  colorScheme: "dark",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

const inputNoteStyle = {
  width: 75,
  background: "var(--surface2)",
  border: "1.5px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  padding: "5px 8px",
  fontSize: 14,
  outline: "none",
  textAlign: "center",
};

const sectionTitleStyle = {
  fontFamily: "var(--font-display)",
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: "0.01em",
  color: "var(--text)",
};

function NativeSelect({ label, value, onChange, children, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={onChange}
          style={{ ...selectStyle, ...style }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.18)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {children}
        </select>
        <div
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--text-muted)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

const mentionColor = {
  Admis: "success",
  Rattrapage: "warning",
  Ajourné: "danger",
};

function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;
  return (
    <Modal title={title || "Confirmation"} onClose={onCancel} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          {message}
        </p>
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

// ── Helper : extraire le tableau depuis n'importe quelle réponse API ─────────
function extractArray(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.matieres)) return responseData.matieres;
  return [];
}

export default function NotesSaisiePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [inscriptions, setInscriptions] = useState([]);
  const [filteredInscriptions, setFilteredInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState("");

  const [matieres, setMatieres] = useState([]);
  const [bulletin, setBulletin] = useState(null);
  const [editNotes, setEditNotes] = useState({});

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [inscLoading, setInscLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    noteId: null,
    matiereId: null,
    loading: false,
  });

  const openConfirm = (noteId, matiereId, message) =>
    setConfirmState({
      open: true,
      title: "Suppression",
      message,
      noteId,
      matiereId,
      loading: false,
    });

  const closeConfirm = () =>
    setConfirmState({
      open: false,
      title: "",
      message: "",
      noteId: null,
      matiereId: null,
      loading: false,
    });

  // ── Chargement des inscriptions ─────────────────────────────────────────────
  useEffect(() => {
    setInscLoading(true);
    api
      .get("/inscriptions")
      .then((r) => {
        const list = extractArray(r.data);
        setInscriptions(list);
        setFilteredInscriptions(list);
        const paramId = searchParams.get("inscription");
        if (paramId && list.some((i) => String(i.id) === String(paramId))) {
          setSelectedInscription(paramId);
        }
      })
      .catch(() => {
        setInscriptions([]);
        setFilteredInscriptions([]);
      })
      .finally(() => setInscLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtrage ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let f = inscriptions;
    if (searchTerm.trim()) {
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

  // ── Chargement matières + bulletin ──────────────────────────────────────────
  const loadData = useCallback(
    async (inscriptionId) => {
      if (!inscriptionId) {
        setBulletin(null);
        setMatieres([]);
        setEditNotes({});
        return;
      }

      setLoading(true);
      setMsg({ text: "", type: "" });

      const insc = inscriptions.find(
        (i) => String(i.id) === String(inscriptionId),
      );

      try {
        let matList = [];
        if (insc?.filiere_id) {
          try {
            const mRes = await api.get(`/filieres/${insc.filiere_id}/matieres`);
            matList = extractArray(mRes.data);
          } catch (e) {
            console.warn("Impossible de charger les matières:", e);
            setMsg({
              text: "Impossible de charger les matières de cette filière.",
              type: "warning",
            });
          }
        } else {
          setMsg({
            text: "Cette inscription n'est associée à aucune filière.",
            type: "warning",
          });
        }
        setMatieres(matList);

        let bData = { inscription: insc ?? {}, bulletin: {} };
        try {
          const bRes = await api.get(`/notes/bulletin/${inscriptionId}`);
          bData = bRes.data;
        } catch (e) {
          console.info("Aucune note existante pour cette inscription.");
        }
        setBulletin(bData);

        const init = {};
        matList.forEach((m) => {
          init[String(m.id)] = "";
        });

        Object.values(bData?.bulletin ?? {}).forEach((sem) => {
          (sem.notes ?? []).forEach((n) => {
            if (n.matiere_id != null) {
              init[String(n.matiere_id)] = String(parseFloat(n.note));
            }
          });
        });

        setEditNotes(init);
      } catch (err) {
        console.error("Erreur chargement:", err);
        setMsg({
          text: "Impossible de charger les données de cette inscription.",
          type: "danger",
        });
      } finally {
        setLoading(false);
      }
    },
    [inscriptions],
  );

  useEffect(() => {
    if (!selectedInscription) {
      setBulletin(null);
      setMatieres([]);
      setEditNotes({});
      return;
    }
    loadData(selectedInscription);
  }, [selectedInscription, loadData]);

  // ── Enregistrement des notes ────────────────────────────────────────────────
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
            n.note <= 20,
        );

      if (notes.length === 0) {
        setMsg({
          text: "Aucune note valide (0–20) à enregistrer.",
          type: "danger",
        });
        setSaving(false);
        return;
      }

      const inscId = parseInt(selectedInscription, 10);
      await api.post("/notes/batch", { inscription_id: inscId, notes });
      setMsg({
        text: `✓ ${notes.length} note(s) enregistrée(s) avec succès.`,
        type: "success",
      });

      const r = await api.get(`/notes/bulletin/${selectedInscription}`);
      setBulletin(r.data);

      const updated = {};
      matieres.forEach((m) => {
        updated[String(m.id)] = "";
      });
      Object.values(r.data?.bulletin ?? {}).forEach((sem) => {
        (sem.notes ?? []).forEach((n) => {
          if (n.matiere_id != null)
            updated[String(n.matiere_id)] = String(parseFloat(n.note));
        });
      });
      setEditNotes(updated);
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de l'enregistrement.";
      setMsg({ text: serverMsg, type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // ── Suppression d'une note ──────────────────────────────────────────────────
  const performDeleteNote = async (noteId, matiereId) => {
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await api.delete(`/notes/${noteId}`);
      setMsg({ text: "Note supprimée.", type: "success" });
      setEditNotes((prev) => ({ ...prev, [String(matiereId)]: "" }));
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

  // ── Génération PDF ──────────────────────────────────────────────────────────
  const generatePDF = async () => {
    if (!bulletin || !hasNotes) return;
    setPdfGenerating(true);
    try {
      const pdfContent = document.createElement("div");
      pdfContent.style.cssText =
        "width:800px;padding:32px;background:#fff;font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.5;";
      pdfContent.innerHTML = `
        <div style="padding-bottom: 20px; margin-bottom: 28px; border-bottom: 1px solid #e5e7eb;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
            <div>
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#4338ca;font-weight:700;margin-bottom:10px;">Université</div>
              <h1 style="margin:0;font-size:30px;font-weight:800;color:#111827;">Relevé de notes</h1>
            </div>
            <div style="text-align:right;min-width:160px;color:#374151;">
              <div style="font-size:12px;">Année universitaire</div>
              <div style="font-size:15px;font-weight:700;color:#111827;">${bulletin.inscription?.annee_universitaire || "—"}</div>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-bottom:26px;font-size:14px;color:#374151;">
          <div><strong>Étudiant :</strong> ${bulletin.inscription?.etudiant_nom || "—"}</div>
          <div><strong>Matricule :</strong> ${bulletin.inscription?.matricule || "—"}</div>
          <div><strong>Filière :</strong> ${bulletin.inscription?.filiere_nom || "—"} (${bulletin.inscription?.niveau || "—"})</div>
          <div><strong>Option :</strong> ${bulletin.inscription?.option || "—"}</div>
        </div>
      `;
      for (const [semestre, data] of Object.entries(bulletin.bulletin || {})) {
        const table = document.createElement("table");
        table.style.cssText =
          "width:100%;border-collapse:collapse;margin-bottom:20px;";
        table.innerHTML = `
          <thead><tr style="background:#f0f0f0;">
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">Matière</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:center;">Coeff.</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:center;">Note /20</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:center;">Pondérée</th>
          </tr></thead>
          <tbody>${(data.notes || [])
            .map(
              (n) => `
            <tr>
              <td style="border:1px solid #ddd;padding:8px;">${n.matiere}</td>
              <td style="border:1px solid #ddd;padding:8px;text-align:center;">${n.coefficient}</td>
              <td style="border:1px solid #ddd;padding:8px;text-align:center;">${n.note}</td>
              <td style="border:1px solid #ddd;padding:8px;text-align:center;">${(parseFloat(n.note) * parseFloat(n.coefficient)).toFixed(2)}</td>
            </tr>`,
            )
            .join("")}
          </tbody>
        `;
        pdfContent.appendChild(table);
        const summary = document.createElement("div");
        summary.style.cssText =
          "margin-bottom:24px;padding:18px 20px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px;color:#374151;";
        summary.innerHTML = `
          <div style="font-weight:700;color:#111827;">Semestre ${semestre}</div>
          <div>Moyenne : <strong>${data.moyenne}/20</strong> | Mention : <strong>${data.mention}</strong></div>
        `;
        pdfContent.appendChild(summary);
      }
      const footer = document.createElement("div");
      footer.style.cssText =
        "margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;";
      footer.textContent =
        "Document généré par UniGest - relevé officiel de l'université";
      pdfContent.appendChild(footer);
      document.body.appendChild(pdfContent);
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        210,
        (canvas.height * 210) / canvas.width,
      );
      pdf.save(
        `releve_notes_${bulletin.inscription?.matricule || "etudiant"}.pdf`,
      );
      document.body.removeChild(pdfContent);
    } catch (err) {
      console.error("Erreur PDF:", err);
      setMsg({ text: "Erreur lors de la génération du PDF.", type: "danger" });
    } finally {
      setPdfGenerating(false);
    }
  };

  // ── Permissions ─────────────────────────────────────────────────────────────
  const canDelete = ["administrateur", "secretaire"].includes(user?.role);
  const canEdit = ["administrateur", "secretaire", "enseignant"].includes(
    user?.role,
  );

  // ── Dérivés ──────────────────────────────────────────────────────────────────
  const hasNotes = bulletin && Object.keys(bulletin.bulletin || {}).length > 0;
  const filiereOptions = [
    ...new Set(inscriptions.map((i) => i.filiere_nom).filter(Boolean)),
  ];

  const getNoteExistante = (matiereId) => {
    if (!bulletin) return null;
    for (const sem of Object.values(bulletin.bulletin || {})) {
      const found = (sem.notes || []).find(
        (n) => String(n.matiere_id) === String(matiereId),
      );
      if (found) return found;
    }
    return null;
  };

  const matieresBySemestre = matieres.reduce((acc, m) => {
    const sem = m.semestre || "S1";
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(m);
    return acc;
  }, {});

  const computeSemestreStats = (list) => {
    let totalPond = 0,
      totalCoeff = 0,
      totalNote = 0,
      validCount = 0;
    list.forEach((m) => {
      const value = editNotes[String(m.id)];
      const note = parseFloat(value);
      if (!isNaN(note) && note >= 0 && note <= 20) {
        totalPond += note * parseFloat(m.credit);
        totalCoeff += parseFloat(m.credit);
        totalNote += note;
        validCount += 1;
      }
    });

    const moyennePonderee = totalCoeff > 0 ? totalPond / totalCoeff : null;
    const moyenneSimple = validCount > 0 ? totalNote / validCount : null;
    const mentionTemp =
      moyennePonderee !== null
        ? parseFloat(moyennePonderee) >= 10
          ? "Admis"
          : parseFloat(moyennePonderee) >= 8
            ? "Rattrapage"
            : "Ajourné"
        : null;

    return {
      totalPond,
      totalCoeff,
      totalNote,
      validCount,
      moyennePonderee,
      moyenneSimple,
      moyenneTemp: moyennePonderee !== null ? moyennePonderee.toFixed(2) : null,
      mentionTemp,
    };
  };

  const nbNotesRemplies = Object.values(editNotes).filter((v) => {
    const n = parseFloat(v);
    return v !== "" && !isNaN(n) && n >= 0 && n <= 20;
  }).length;

  // ── Rendu d'un tableau de saisie pour un semestre ────────────────────────────
  const renderSaisieTable = (sem, list) => {
    let totalPond = 0,
      totalCoeff = 0,
      totalNote = 0,
      validCount = 0;
    list.forEach((m) => {
      const value = editNotes[String(m.id)];
      const note = parseFloat(value);
      if (!isNaN(note) && note >= 0 && note <= 20) {
        totalPond += note * parseFloat(m.credit);
        totalCoeff += parseFloat(m.credit);
        totalNote += note;
        validCount += 1;
      }
    });
    const moyenneTemp =
      totalCoeff > 0 ? (totalPond / totalCoeff).toFixed(2) : null;
    const moyenneRaw =
      validCount > 0 ? (totalNote / validCount).toFixed(2) : null;
    const mentionTemp = moyenneTemp
      ? parseFloat(moyenneTemp) >= 10
        ? "Admis"
        : parseFloat(moyenneTemp) >= 8
          ? "Rattrapage"
          : "Ajourné"
      : null;

    return (
      <Card key={sem}>
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
              fontSize: 17,
              color: "var(--text)",
              margin: 0,
            }}
          >
            Semestre {sem}
          </h3>
          {moyenneTemp && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Moyenne :{" "}
                <strong
                  style={{
                    color:
                      parseFloat(moyenneTemp) >= 10
                        ? "var(--success)"
                        : "var(--danger)",
                    fontSize: 15,
                  }}
                >
                  {moyenneTemp}/20
                </strong>
              </span>
              <Badge color={mentionColor[mentionTemp]}>{mentionTemp}</Badge>
            </div>
          )}
        </div>

        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead>
            <tr>
              {[
                "Matière",
                "Code",
                "Coeff.",
                "Note /20",
                "Pondérée",
                ...(canDelete ? ["Action"] : []),
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    color: "var(--text)",
                    fontSize: 12,
                    fontWeight: 700,
                    borderBottom: "1px solid var(--border)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((m) => {
              const key = String(m.id);
              const valSaisie = editNotes[key] ?? "";
              const noteExistante = getNoteExistante(m.id);
              const valNum = parseFloat(valSaisie);
              const isInvalid =
                valSaisie !== "" &&
                (isNaN(valNum) || valNum < 0 || valNum > 20);
              const pond =
                !isNaN(valNum) && valNum >= 0 && valNum <= 20
                  ? (valNum * parseFloat(m.credit)).toFixed(2)
                  : "—";

              return (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.15s",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "var(--text)",
                      fontWeight: 500,
                    }}
                  >
                    {m.nom_matiere}
                    {noteExistante && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          color: "var(--success)",
                          background: "rgba(34,197,94,0.12)",
                          borderRadius: 4,
                          padding: "1px 6px",
                        }}
                      >
                        ✓ enregistrée
                      </span>
                    )}
                  </td>

                  <td
                    style={{
                      padding: "10px 12px",
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    {m.code_matiere}
                  </td>

                  <td
                    style={{ padding: "10px 12px", color: "var(--text-muted)" }}
                  >
                    {m.credit}
                  </td>

                  <td style={{ padding: "8px 12px" }}>
                    {canEdit ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <input
                        
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          placeholder="—"
                          value={valSaisie}
                          onChange={(e) => {
                            setEditNotes((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }));
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent)";
                            e.currentTarget.style.boxShadow =
                              "0 0 0 3px rgba(99,102,241,0.18)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = isInvalid
                              ? "var(--danger)"
                              : "var(--border)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                          style={{
                            ...inputNoteStyle,
                            borderColor: isInvalid
                              ? "var(--danger)"
                              : "var(--border)",
                          }}
                        />
                        {isInvalid && (
                          <span
                            style={{ fontSize: 11, color: "var(--danger)" }}
                          >
                            0 – 20
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>
                        {valSaisie !== "" ? valSaisie : "—"}
                      </span>
                    )}
                  </td>

                  <td
                    style={{ padding: "10px 12px", color: "var(--text-muted)" }}
                  >
                    {pond}
                  </td>

                  {canDelete && (
                    <td
                      style={{ padding: "10px 12px", verticalAlign: "middle" }}
                    >
                      {noteExistante?.note_id && (
                        <Btn
                          small
                          variant="danger"
                          onClick={() =>
                            openConfirm(
                              noteExistante.note_id,
                              m.id,
                              `Supprimer la note de "${m.nom_matiere}" ? Cette action est irréversible.`,
                            )
                          }
                        >
                          <Trash2 size={13} style={{ marginRight: 4 }} /> Suppr.
                        </Btn>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--surface2)" }}>
              <td
                colSpan={3}
                style={{
                  padding: "10px 12px",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Total semestre
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {validCount > 0 ? totalNote.toFixed(2) : "—"}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {moyenneTemp ?? "—"}
              </td>
              {canDelete && <td />}
            </tr>
          </tfoot>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            marginTop: 14,
            padding: "14px 16px",
            borderTop: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Total notes :{" "}
            <strong>{validCount > 0 ? totalNote.toFixed(2) : "—"}</strong>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Moyenne pondérée : <strong>{moyenneTemp ?? "—"}/20</strong>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Total coefficient : <strong>{totalCoeff}</strong>
          </div>
        </div>
      </Card>
    );
  };

  const inscriptionLabel = (i) => {
    const nom = i.etudiant_nom || `Étudiant #${i.etudiant_id}`;
    const mat = i.matricule ? ` (${i.matricule})` : "";
    const filiere = i.filiere_nom ? ` — ${i.filiere_nom}` : "";
    const niveau = i.niveau ? ` ${i.niveau}` : "";
    const annee = i.annee_universitaire ? ` ${i.annee_universitaire}` : "";
    return `${nom}${mat}${filiere}${niveau}${annee}`;
  };

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Saisie des Notes"
        subtitle="Gestion complète des notes et bulletins par inscription"
      />

      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Rechercher
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Nom ou matricule…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...selectStyle,
                  padding: "10px 13px 10px 36px",
                  color: "var(--text)",
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
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </div>

          <div style={{ minWidth: 180 }}>
            <NativeSelect
              label="Filière"
              value={filterFiliere}
              onChange={(e) => setFilterFiliere(e.target.value)}
            >
              <option value="">Toutes les filières</option>
              {filiereOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div style={{ minWidth: 130 }}>
            <NativeSelect
              label="Niveau"
              value={filterNiveau}
              onChange={(e) => setFilterNiveau(e.target.value)}
            >
              <option value="">Tous niveaux</option>
              {["L1", "L2", "L3", "M1", "M2"].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
          </div>

          {(searchTerm || filterFiliere || filterNiveau) && (
            <div style={{ alignSelf: "flex-end", paddingBottom: 2 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {filteredInscriptions.length} résultat
                {filteredInscriptions.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Sélecteur inscription ─────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        {inscLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Spinner />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Chargement des inscriptions…
            </span>
          </div>
        ) : (
          <NativeSelect
            label={`Sélectionner une inscription${
              inscriptions.length > 0
                ? ` (${filteredInscriptions.length} / ${inscriptions.length})`
                : ""
            }`}
            value={selectedInscription}
            onChange={(e) => {
              setMsg({ text: "", type: "" });
              setSelectedInscription(e.target.value);
            }}
          >
            <option value="">— Choisir une inscription —</option>
            {filteredInscriptions.length === 0 ? (
              <option disabled>Aucune inscription trouvée</option>
            ) : (
              filteredInscriptions.map((i) => (
                <option key={i.id} value={String(i.id)}>
                  {inscriptionLabel(i)}
                </option>
              ))
            )}
          </NativeSelect>
        )}
        {!inscLoading && inscriptions.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--danger)", marginTop: 10 }}>
            ⚠ Aucune inscription enregistrée. Ajoutez d'abord des inscriptions
            dans le module <strong>Inscriptions</strong>.
          </p>
        )}
      </Card>

      {/* ── Spinner chargement ────────────────────────────────────────────── */}
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <Spinner />
        </div>
      )}

      {/* ── Zone principale saisie ───────────────────────────────────────── */}
      {!loading && selectedInscription && bulletin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Fiche étudiant */}
          <Card>
            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
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
                      fontSize: 10,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: 3,
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--text)",
                      fontWeight: 600,
                    }}
                  >
                    {v || "—"}
                  </div>
                </div>
              ))}
              <div style={{ marginLeft: "auto" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 3,
                  }}
                >
                  Matières / Notes saisies
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {matieres.length > 0 ? (
                    `${nbNotesRemplies} / ${matieres.length}`
                  ) : (
                    <span style={{ color: "var(--danger)" }}>
                      Aucune matière
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                💡 Consultez et gérez la présence de cet étudiant
              </div>
              <Btn
                variant="secondary"
                size="small"
                onClick={() =>
                  window.open(
                    `/presence?inscription=${selectedInscription}`,
                    "_blank",
                  )
                }
              >
                📋 Voir la présence
              </Btn>
            </div>
          </Card>

          {/* Message feedback */}
          {msg.text && (
            <Alert type={msg.type === "success" ? "success" : "danger"}>
              {msg.text}
            </Alert>
          )}

          {/* Tableaux de saisie par semestre */}
          {matieres.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                  }}
                >
                  Aucune matière définie pour la filière{" "}
                  <strong>{bulletin.inscription?.filiere_nom}</strong>.
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Allez dans <strong>Filières &amp; Matières</strong> pour
                  ajouter les matières avant de saisir des notes.
                </p>
                <div style={{ marginTop: 16 }}>
                  <Btn
                    variant="secondary"
                    onClick={() => (window.location.href = "/filieres")}
                  >
                    → Gérer les filières et matières
                  </Btn>
                </div>
              </div>
            </Card>
          ) : (
            (() => {
              const sortSemestres = (keys) =>
                keys.slice().sort((a, b) => {
                  const aNum = parseInt(String(a).replace(/\D/g, ""), 10);
                  const bNum = parseInt(String(b).replace(/\D/g, ""), 10);
                  if (!Number.isNaN(aNum) && !Number.isNaN(bNum))
                    return aNum - bNum;
                  return String(a).localeCompare(String(b));
                });

              const semestreData = Object.entries(matieresBySemestre)
                .map(([sem, list]) => ({
                  sem,
                  list,
                  stats: computeSemestreStats(list),
                }))
                .sort(
                  (a, b) =>
                    sortSemestres([a.sem, b.sem]).indexOf(a.sem) -
                    sortSemestres([a.sem, b.sem]).indexOf(b.sem),
                );

              const semestreKeys = semestreData.map((item) => item.sem);
              const sortedSemKeys = sortSemestres(semestreKeys);
              const semesterRangeLabel =
                sortedSemKeys.length === 0
                  ? "—"
                  : sortedSemKeys.length === 1
                    ? sortedSemKeys[0]
                    : `${sortedSemKeys[0]}–${sortedSemKeys[sortedSemKeys.length - 1]}`;

              const totalMoyennesSemestres = semestreData.reduce(
                (sum, item) => sum + (item.stats.moyennePonderee ?? 0),
                0,
              );
              const semCount = semestreData.filter(
                (item) => item.stats.moyennePonderee !== null,
              ).length;
              const moyennesSemestresTotal =
                semCount > 0 ? totalMoyennesSemestres.toFixed(2) : null;
              const totalNotesSemestres = semestreData.reduce(
                (sum, item) => sum + item.stats.totalNote,
                0,
              );
              const totalCoeffSemestres = semestreData.reduce(
                (sum, item) => sum + item.stats.totalCoeff,
                0,
              );
              const totalPondSemestres = semestreData.reduce(
                (sum, item) => sum + item.stats.totalPond,
                0,
              );
              const moyenneGenerale =
                totalCoeffSemestres > 0
                  ? (totalPondSemestres / totalCoeffSemestres).toFixed(2)
                  : null;

              // Mention générale
              const mentionGenerale = moyenneGenerale
                ? parseFloat(moyenneGenerale) >= 10
                  ? "Admis"
                  : parseFloat(moyenneGenerale) >= 8
                    ? "Rattrapage"
                    : "Ajourné"
                : null;

              const mentionGeneraleColor = {
                Admis: "var(--success)",
                Rattrapage: "var(--warning, #f59e0b)",
                Ajourné: "var(--danger)",
              };

              // Statistiques des cartes résumé
              const resumeCards = [
                {
                  icon: <Hash size={18} />,
                  label: `Total notes (${semesterRangeLabel})`,
                  value: totalNotesSemestres.toFixed(2),
                  accent: "var(--accent)",
                  accentBg: "rgba(99,102,241,0.10)",
                },
                {
                  icon: <Sigma size={18} />,
                  label: "Somme moyennes semestrielles",
                  value: moyennesSemestresTotal ?? "—",
                  accent: "var(--accent)",
                  accentBg: "rgba(99,102,241,0.10)",
                },
                {
                  icon: <TrendingUp size={18} />,
                  label: "Moyenne générale",
                  value: moyenneGenerale ? `${moyenneGenerale}/20` : "—",
                  accent: moyenneGenerale
                    ? mentionGeneraleColor[mentionGenerale]
                    : "var(--text-muted)",
                  accentBg: moyenneGenerale
                    ? mentionGenerale === "Admis"
                      ? "rgba(34,197,94,0.10)"
                      : mentionGenerale === "Rattrapage"
                        ? "rgba(245,158,11,0.10)"
                        : "rgba(239,68,68,0.10)"
                    : "var(--surface2)",
                  badge: mentionGenerale,
                },
                {
                  icon: <Award size={18} />,
                  label: "Total coefficient",
                  value: String(totalCoeffSemestres),
                  accent: "var(--accent)",
                  accentBg: "rgba(99,102,241,0.10)",
                },
              ];

              return (
                <>
                  {semestreData.map(({ sem, list }) =>
                    renderSaisieTable(sem, list),
                  )}

                  {/* ── Résumé général – VERSION CORRIGÉE ── */}
                  <Card>
                    {/* En-tête */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 18,
                        paddingBottom: 14,
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
                            color: "var(--accent)",
                          }}
                        >
                          <TrendingUp size={18} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "var(--text)",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            Résumé général
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Synthèse sur {semesterRangeLabel}
                          </div>
                        </div>
                      </div>
                      {mentionGenerale && (
                        <Badge color={mentionColor[mentionGenerale]}>
                          {mentionGenerale}
                        </Badge>
                      )}
                    </div>

                    {/* Grille de 4 cartes */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {resumeCards.map((card, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "14px 16px",
                            borderRadius: 12,
                            background: "var(--surface2)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          {/* Icône + label */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: card.accentBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: card.accent,
                                flexShrink: 0,
                              }}
                            >
                              {card.icon}
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                                lineHeight: 1.3,
                              }}
                            >
                              {card.label}
                            </span>
                          </div>

                          {/* Valeur + badge optionnel */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span
                              style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: card.accent,
                                fontFamily: "var(--font-display)",
                                letterSpacing: "-0.02em",
                              }}
                            >
                              {card.value}
                            </span>
                            {card.badge && (
                              <Badge color={mentionColor[card.badge]}>
                                {card.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              );
            })()
          )}

          {/* Boutons d'action */}
          {matieres.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                padding: "4px 0",
              }}
            >
              {canEdit && (
                <Btn
                  onClick={handleSave}
                  disabled={saving || nbNotesRemplies === 0}
                >
                  <Save size={16} style={{ marginRight: 6 }} />
                  {saving
                    ? "Enregistrement…"
                    : `Enregistrer${nbNotesRemplies > 0 ? ` (${nbNotesRemplies})` : ""}`}
                </Btn>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── État vide ─────────────────────────────────────────────────────── */}
      {!selectedInscription && !loading && (
        <Card>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            Sélectionnez une inscription ci-dessus pour consulter ou saisir les
            notes.
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
