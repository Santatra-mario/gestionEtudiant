import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Trash2, Save, Download, Search, Filter } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PageHeader,
  Card,
  Btn,
  Badge,
  Alert,
  Spinner,
  Select,
  Input,
  Modal,
} from "../components/ui";

const mentionColor = {
  Admis: "success",
  Rattrapage: "warning",
  Ajourné: "danger",
};

// Modal de confirmation
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

export default function NotesSaisiePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [inscriptions, setInscriptions] = useState([]);
  const [filteredInscriptions, setFilteredInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState("");
  const [bulletin, setBulletin] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [editNotes, setEditNotes] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [inscLoading, setInscLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");

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

  // Chargement des inscriptions
  useEffect(() => {
    api
      .get("/inscriptions")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setInscriptions(list);
        setFilteredInscriptions(list);
        const paramId = searchParams.get("inscription");
        if (paramId && list.some((i) => String(i.id) === String(paramId))) {
          setSelectedInscription(paramId);
        }
      })
      .catch((err) => {
        console.error("Erreur chargement inscriptions:", err);
        setInscriptions([]);
        setFilteredInscriptions([]);
      })
      .finally(() => setInscLoading(false));
  }, []);

  // Filtrage des inscriptions
  useEffect(() => {
    let filtered = inscriptions;

    if (searchTerm) {
      filtered = filtered.filter(i => 
        i.etudiant_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterFiliere) {
      filtered = filtered.filter(i => i.filiere_id == filterFiliere);
    }

    if (filterNiveau) {
      filtered = filtered.filter(i => i.niveau === filterNiveau);
    }

    setFilteredInscriptions(filtered);
  }, [searchTerm, filterFiliere, filterNiveau, inscriptions]);

  // Chargement du bulletin
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
        const inscInfo = inscriptions.find((i) => String(i.id) === String(inscriptionId));
        const bulletinPromise = api.get(`/notes/bulletin/${inscriptionId}`);
        let matieresPromise = Promise.resolve({ data: [] });
        if (inscInfo?.filiere_id) {
          matieresPromise = api
            .get(`/filieres/${inscInfo.filiere_id}/matieres`)
            .catch(() => api.get(`/matieres?filiere_id=${inscInfo.filiere_id}`).catch(() => ({ data: [] })));
        }

        const [bRes, mRes] = await Promise.all([bulletinPromise, matieresPromise]);
        const bData = bRes.data;
        setBulletin(bData);

        const matList = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data ?? mRes.data?.matieres ?? []);
        setMatieres(matList);

        const init = {};
        const bulletinObj = bData.bulletin || {};
        Object.values(bulletinObj).forEach((sem) => {
          (sem.notes || []).forEach((n) => {
            if (n.matiere_id !== undefined && n.matiere_id !== null) {
              init[String(n.matiere_id)] = parseFloat(n.note) || 0;
            }
          });
        });

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

  useEffect(() => {
    if (!selectedInscription) {
      setBulletin(null);
      setEditNotes({});
      setMatieres([]);
      return;
    }
    loadBulletin(selectedInscription);
  }, [selectedInscription]);

  // Enregistrement des notes
  const handleSave = async () => {
    setSaving(true);
    setMsg({ text: "", type: "" });
    try {
      const notes = Object.entries(editNotes)
        .map(([matiere_id, note]) => ({
          matiere_id: parseInt(matiere_id, 10),
          note: parseFloat(note),
        }))
        .filter((n) => !isNaN(n.matiere_id) && !isNaN(n.note) && n.note >= 0 && n.note <= 20);

      if (notes.length === 0) {
        setMsg({ text: "Aucune note valide à enregistrer. Vérifiez les valeurs (0–20).", type: "danger" });
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
      setMsg({ text: `${notes.length} note(s) enregistrée(s) avec succès.`, type: "success" });

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
      const serverMsg = err.response?.data?.message || err.response?.data?.error || "Erreur lors de l'enregistrement.";
      setMsg({ text: serverMsg, type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // Suppression d'une note
  const performDeleteNote = async (noteId, matiereId) => {
    setConfirmState(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/notes/${noteId}`);
      setMsg({ text: "Note supprimée.", type: "success" });
      setEditNotes((prev) => ({ ...prev, [String(matiereId)]: 0 }));
      const r = await api.get(`/notes/bulletin/${selectedInscription}`);
      setBulletin(r.data);
      closeConfirm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur suppression.", type: "danger" });
      closeConfirm();
    }
  };

  // Génération du PDF
  const generatePDF = async () => {
    if (!bulletin) return;
    setPdfGenerating(true);
    try {
      const pdfContent = document.createElement('div');
      pdfContent.style.width = '800px';
      pdfContent.style.padding = '20px';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.color = '#000';
      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0;">UNIVERSITÉ DE ...</h1>
          <h2 style="margin: 5px 0;">RELEVÉ DE NOTES</h2>
          <hr />
        </div>
        <div style="margin-bottom: 20px;">
          <p><strong>Étudiant :</strong> ${bulletin.inscription?.etudiant_nom || '-'}</p>
          <p><strong>Matricule :</strong> ${bulletin.inscription?.matricule || '-'}</p>
          <p><strong>Filière :</strong> ${bulletin.inscription?.filiere_nom || '-'} (${bulletin.inscription?.niveau || '-'})</p>
          <p><strong>Année universitaire :</strong> ${bulletin.inscription?.annee_universitaire || '-'}</p>
        </div>
      `;

      const bulletinObj = bulletin.bulletin || {};
      for (const [semestre, data] of Object.entries(bulletinObj)) {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
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
            ${(data.notes || []).map(n => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${n.matiere}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${n.coefficient}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${n.note}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(parseFloat(n.note) * parseFloat(n.coefficient)).toFixed(2)}</td>
              </tr>
            `).join('')}
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

      document.body.appendChild(pdfContent);
      const canvas = await html2canvas(pdfContent, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`releve_notes_${bulletin.inscription?.matricule || 'etudiant'}.pdf`);
      document.body.removeChild(pdfContent);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      setMsg({ text: "Erreur lors de la génération du PDF.", type: "danger" });
    } finally {
      setPdfGenerating(false);
    }
  };

  // Permissions selon le rôle
  const canDelete = user?.role === 'administrateur' || user?.role === 'secretaire';
  const canEdit = user?.role === 'administrateur' || user?.role === 'secretaire' || user?.role === 'enseignant';

  // Rendu d'un semestre
  const renderSemestre = (semestre, data) => (
    <Card key={semestre}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", margin: 0 }}>
          Semestre {semestre}
        </h3>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Moyenne :{" "}
            <strong style={{ color: parseFloat(data.moyenne) >= 10 ? "var(--success)" : "var(--danger)", fontSize: 16 }}>
              {data.moyenne}/20
            </strong>
          </span>
          <Badge color={mentionColor[data.mention] || "muted"}>{data.mention}</Badge>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {["Matière", "Coefficient", "Note /20", "Pondérée", ...(canDelete ? ["Action"] : [])].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-muted)", fontSize: 12, borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(data.notes || []).map((n, idx) => {
            const key = n.matiere_id !== undefined && n.matiere_id !== null ? String(n.matiere_id) : `idx-${idx}`;
            const currentNote = editNotes[key] !== undefined ? editNotes[key] : (parseFloat(n.note) ?? 0);
            return (
              <tr key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px", color: "var(--text)" }}>{n.matiere}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{n.coefficient}</td>
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
                        setEditNotes((prev) => ({ ...prev, [key]: val === "" ? "" : parseFloat(val) }));
                      }}
                      style={{ width: 70, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", padding: "4px 8px", fontSize: 14, outline: "none" }}
                    />
                  ) : (
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{currentNote}</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{(parseFloat(currentNote || 0) * parseFloat(n.coefficient)).toFixed(2)}</td>
                {canDelete && (
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    {n.note_id && (
                      <Btn small variant="danger" onClick={() => openConfirm(n.note_id, key, "Supprimer cette note ? Cette action est irréversible.")}>
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

  // Saisie initiale
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
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", marginBottom: 16 }}>Semestre {sem} — Saisie initiale</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["Matière", "Coefficient", "Note /20"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-muted)", fontSize: 12, borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--text)" }}>{m.nom}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{m.coefficient}</td>
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
                          setEditNotes((prev) => ({ ...prev, [String(m.id)]: val === "" ? "" : parseFloat(val) }));
                        }}
                        style={{ width: 70, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", padding: "4px 8px", fontSize: 14, outline: "none" }}
                      />
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ));
  };

  const hasNotes = bulletin && Object.keys(bulletin.bulletin || {}).length > 0;

  return (
    <div>
      <PageHeader
        title="Saisie des Notes"
        subtitle="Gestion complète des notes et bulletins par inscription"
      />

      {/* Filtres de recherche */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="Rechercher par nom ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ minWidth: 150 }}>
            <Select
              value={filterFiliere}
              onChange={(e) => setFilterFiliere(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">Toutes les filières</option>
              {[...new Set(inscriptions.map(i => i.filiere_nom).filter(Boolean))].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
          </div>
          <div style={{ minWidth: 120 }}>
            <Select
              value={filterNiveau}
              onChange={(e) => setFilterNiveau(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">Tous niveaux</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="M1">M1</option>
              <option value="M2">M2</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Sélection de l'inscription */}
      <Card style={{ marginBottom: 20 }}>
        {inscLoading ? (
          <Spinner />
        ) : (
          <Select
            label="Sélectionner une inscription"
            value={selectedInscription}
            onChange={(e) => {
              setBulletin(null);
              setEditNotes({});
              setMatieres([]);
              setMsg({ text: "", type: "" });
              setSelectedInscription(e.target.value);
            }}
          >
            <option value="">— Choisir une inscription —</option>
            {filteredInscriptions.length === 0 ? (
              <option disabled>Aucune inscription disponible</option>
            ) : (
              filteredInscriptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.etudiant_nom} ({i.matricule}) — {i.filiere_nom} {i.niveau} {i.annee_universitaire}
                </option>
              ))
            )}
          </Select>
        )}
      </Card>

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
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{v || "—"}</div>
                  </div>
                ))}
              </div>
            </Card>

            {msg.text && (
              <Alert type={msg.type === "success" ? "success" : "danger"}>
                {msg.text}
              </Alert>
            )}

            {hasNotes ? (
              Object.entries(bulletin.bulletin).map(([semestre, data]) => renderSemestre(semestre, data))
            ) : (
              <>
                {matieres.length > 0 ? (
                  renderSaisieInitiale()
                ) : (
                  <Card>
                    <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px 0", fontSize: 14 }}>
                      Aucune note enregistrée. Aucune matière trouvée pour cette filière.
                    </p>
                  </Card>
                )}
              </>
            )}

            {/* Boutons d'action */}
            {Object.keys(editNotes).length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }} className="no-print">
                {canEdit && (
                  <Btn onClick={handleSave} disabled={saving}>
                    <Save size={16} style={{ marginRight: 6 }} />
                    {saving ? "Enregistrement..." : "Enregistrer les notes"}
                  </Btn>
                )}
                <Btn variant="secondary" onClick={generatePDF} disabled={pdfGenerating || !hasNotes}>
                  <Download size={16} style={{ marginRight: 6 }} />
                  {pdfGenerating ? "Génération..." : "Télécharger PDF"}
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedInscription && !loading && (
        <Card>
          <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
            Sélectionnez une inscription pour consulter ou saisir les notes.
          </p>
        </Card>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => performDeleteNote(confirmState.noteId, confirmState.matiereId)}
        onCancel={closeConfirm}
        loading={confirmState.loading}
      />
    </div>
  );
}
