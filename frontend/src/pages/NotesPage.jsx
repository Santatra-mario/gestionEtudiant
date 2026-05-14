import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
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
      setMatieres([]);
      return;
    }
    loadBulletin(selectedInscription);
  }, [selectedInscription, loadBulletin]);

  // ── Consultation uniquement : pas d'enregistrement de notes sur cette page.

  // ── Suppression d'une note ───────────────────────────────────────────────────
  const performDeleteNote = async (noteId) => {
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await api.delete(`/notes/${noteId}`);
      setMsg({ text: "Note supprimée.", type: "success" });
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
      pdfContent.style.padding = "32px";
      pdfContent.style.backgroundColor = "#ffffff";
      pdfContent.style.fontFamily = "Inter, Arial, sans-serif";
      pdfContent.style.color = "#111827";
      pdfContent.style.lineHeight = "1.5";
      pdfContent.innerHTML = `
        <div style="padding-bottom: 20px; margin-bottom: 28px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
            <div>
              <div style="font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #4338ca; font-weight: 700; margin-bottom: 10px;">Université</div>
              <h1 style="margin: 0; font-size: 30px; font-weight: 800; color: #111827;">Relevé de notes</h1>
            </div>
            <div style="text-align: right; min-width: 160px;">
              <div style="font-size: 12px; color: #6b7280;">Année universitaire</div>
              <div style="font-size: 15px; font-weight: 700; color: #111827;">${bulletin.inscription?.annee_universitaire || "-"}</div>
            </div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 26px; font-size: 14px; color: #374151;">
          <div><strong>Étudiant :</strong> ${bulletin.inscription?.etudiant_nom || "-"}</div>
          <div><strong>Matricule :</strong> ${bulletin.inscription?.matricule || "-"}</div>
          <div><strong>Filière :</strong> ${bulletin.inscription?.filiere_nom || "-"} (${bulletin.inscription?.niveau || "-"})</div>
          <div><strong>Option :</strong> ${bulletin.inscription?.option || "-"}</div>
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
        const sectionSummary = document.createElement("div");
        sectionSummary.style.cssText = "margin-bottom: 30px; padding: 18px 20px; border: 1px solid #e5e7eb; border-radius: 16px; background: #f8fafc;";
        sectionSummary.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="font-weight: 700; color: #111827;">Semestre ${semestre}</div>
            <div style="color: #374151; font-size: 13px;">
              Moyenne : <strong>${data.moyenne}/20</strong> &middot; Mention : <strong>${data.mention}</strong>
            </div>
          </div>
        `;
        pdfContent.appendChild(sectionSummary);
      }

      if (bulletin.moyenne_generale !== undefined) {
        pdfContent.innerHTML += `
          <div style="margin-top: 10px; padding-top: 18px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 16px; font-size: 14px; color: #111827;">
            <div><strong>Moyenne générale :</strong> ${bulletin.moyenne_generale}/20</div>
          </div>
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            Document généré par UniGest - relevé officiel de l'université
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

  // ── Consultation uniquement : désactiver toutes les actions d'édition
  const canDelete = false;
  const canEdit = false;

  // ── Rendu d'un semestre ────────────────────────────────────────────────────
  const renderSemestre = (semestre, data) => (
    <Card key={semestre} style={{
      border: '2px solid var(--border)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      transform: 'scale(1)',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'scale(1.01)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = 'var(--shadow)';
    }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            color: "var(--text)",
            margin: 0,
            fontWeight: 700,
          }}
        >
          Semestre {semestre}
        </h3>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Moyenne :{" "}
            <strong
              style={{
                color:
                  parseFloat(data.moyenne) >= 10
                    ? "var(--success)"
                    : "var(--danger)",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {data.moyenne}/20
            </strong>
          </span>
          <Badge color={mentionColor[data.mention] || "muted"} style={{
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
          }}>
            {data.mention}
          </Badge>
        </div>
      </div>
      <div style={{ overflowX: 'auto', border: '2px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {[
                "Matière",
                "Coefficient",
                "Note /20",
                "Pondérée",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    color: "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 700,
                    borderBottom: "2px solid var(--border)",
                    textTransform: "uppercase",
                    letterSpacing: '0.08em',
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
              const noteValue = parseFloat(n.note || 0);
              return (
                <tr key={key} style={{
                  borderBottom: "1px solid var(--border)",
                  transition: 'background 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: "14px 16px", color: "var(--text)", fontWeight: 500 }}>
                    {n.matiere}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontWeight: 600 }}>
                    {n.coefficient}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontWeight: 700,
                      color: noteValue >= 10 ? "var(--success)" : "var(--danger)",
                      fontSize: 15,
                      background: noteValue >= 10 ? 'rgba(76, 175, 125, 0.1)' : 'rgba(229, 115, 115, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${noteValue >= 10 ? 'rgba(76, 175, 125, 0.3)' : 'rgba(229, 115, 115, 0.3)'}`,
                    }}>
                      {noteValue.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontWeight: 600 }}>
                    {(noteValue * parseFloat(n.coefficient || 0)).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );

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
            <Card style={{
              border: '2px solid var(--border)',
              background: 'linear-gradient(135deg, var(--surface), var(--surface2))',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: 'center' }}>
                {[
                  ["Étudiant", bulletin.inscription?.etudiant_nom],
                  ["Matricule", bulletin.inscription?.matricule],
                  ["Filière", bulletin.inscription?.filiere_nom],
                  ["Niveau", bulletin.inscription?.niveau],
                  ["Année", bulletin.inscription?.annee_universitaire],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    textAlign: 'center',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    minWidth: '120px',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 4,
                        fontWeight: 600,
                      }}
                    >
                      {k}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "var(--text)",
                        fontWeight: 700,
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
              <Card>
                <p
                  style={{
                    color: "var(--text-muted)",
                    textAlign: "center",
                    padding: "24px 0",
                    fontSize: 14,
                  }}
                >
                  Aucune note enregistrée pour cette inscription.
                </p>
              </Card>
            )}

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
              className="no-print"
            >
              <Btn
                variant="secondary"
                onClick={generatePDF}
                disabled={pdfGenerating || !hasNotes}
              >
                {pdfGenerating ? "Génération..." : "📄 Télécharger PDF"}
              </Btn>
            </div>
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
            Sélectionnez une inscription pour consulter les notes.
          </p>
        </Card>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => performDeleteNote(confirmState.noteId)}
        onCancel={closeConfirm}
        loading={confirmState.loading}
      />
    </div>
  );
}
