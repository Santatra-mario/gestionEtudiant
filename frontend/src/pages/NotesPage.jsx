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
      message:
        message || "Supprimer cette note ? Cette action est irréversible.",
      noteId,
      matiereId,
      loading: false,
    });
  };

  const closeConfirm = () => {
    setConfirmState({
      open: false,
      title: "",
      message: "",
      noteId: null,
      matiereId: null,
      loading: false,
    });
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
          (i) => String(i.id) === String(inscriptionId),
        );

        const bulletinPromise = api.get(`/notes/bulletin/${inscriptionId}`);

        let matieresPromise = Promise.resolve({ data: [] });
        if (inscInfo?.filiere_id) {
          matieresPromise = api
            .get(`/filieres/${inscInfo.filiere_id}/matieres`)
            .catch(() =>
              api
                .get(`/matieres?filiere_id=${inscInfo.filiere_id}`)
                .catch(() => ({ data: [] })),
            );
        }

        const [bRes, mRes] = await Promise.all([
          bulletinPromise,
          matieresPromise,
        ]);
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
    [inscriptions],
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
      // ── Main container ────────────────────────────────────────────────────────
      const pdfContent = document.createElement("div");
      pdfContent.style.cssText =
        "width:800px;padding:40px 45px;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.4;";

      // ── Calculate overall stats ───────────────────────────────────────────────
      let totalPond = 0,
        totalCoeff = 0,
        totalNotes = 0,
        nbNotes = 0;
      const bulletinObj = bulletin.bulletin || {};
      for (const data of Object.values(bulletinObj)) {
        for (const sessionKey of ["session_normale", "session_rattrapage"]) {
          const sessionData = data[sessionKey];
          if (!sessionData?.notes) continue;
          for (const n of sessionData.notes) {
            const coeff = parseFloat(n.coefficient || n.credit || 0);
            const note = parseFloat(n.note || 0);
            totalPond += note * coeff;
            totalCoeff += coeff;
            totalNotes += note;
            nbNotes++;
          }
        }
      }
      const moyenneGenerale =
        totalCoeff > 0 ? (totalPond / totalCoeff).toFixed(2) : "\u2014";
      const moyenneNum = parseFloat(moyenneGenerale);

      // Decision & observation
      let decision, observation, decisionColor, decisionBg;
      if (moyenneGenerale === "\u2014") {
        decision = "Non \u00e9valu\u00e9";
        decisionColor = "#6b7280";
        decisionBg = "#f3f4f6";
        observation = "Aucune note disponible pour cet \u00e9tudiant.";
      } else if (moyenneNum >= 16) {
        decision = "Tr\u00e8s bien";
        decisionColor = "#16a34a";
        decisionBg = "#f0fdf4";
        observation =
          "L'\u00e9tudiant a fourni un excellent travail tout au long de l'ann\u00e9e. F\u00e9licitations !";
      } else if (moyenneNum >= 14) {
        decision = "Bien";
        decisionColor = "#2563eb";
        decisionBg = "#eff6ff";
        observation =
          "Bon travail d'ensemble. L'\u00e9tudiant a fait preuve de s\u00e9rieux et de r\u00e9gularit\u00e9.";
      } else if (moyenneNum >= 12) {
        decision = "Assez bien";
        decisionColor = "#ca8a04";
        decisionBg = "#fefce8";
        observation =
          "R\u00e9sultats satisfaisants. Des efforts suppl\u00e9mentaires permettraient d'atteindre un niveau sup\u00e9rieur.";
      } else if (moyenneNum >= 10) {
        decision = "Passable";
        decisionColor = "#ea580c";
        decisionBg = "#fff7ed";
        observation =
          "R\u00e9sultats justes. L'\u00e9tudiant doit fournir davantage d'efforts pour am\u00e9liorer ses performances.";
      } else {
        decision = "Insuffisant";
        decisionColor = "#dc2626";
        decisionBg = "#fef2f2";
        observation =
          "R\u00e9sultats insuffisants. Un travail plus soutenu est n\u00e9cessaire pour progresser.";
      }

      // ── Build today's date ───────────────────────────────────────────────────
      const today = new Date();
      const dateStr = today.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // ── Build HTML content ──────────────────────────────────────────────────
      // University header
      pdfContent.innerHTML = `
      <table style="width:100%;border:none;border-collapse:collapse;background-color:#ffffff;margin-bottom:18px;">
        <tr>
          <td style="width:60%;border:none;padding:0;background-color:#ffffff;vertical-align:top;">
            <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#1e40af;font-weight:700;margin-bottom:2px;">UNIVERSIT\u00c9</div>
            <div style="font-size:22px;font-weight:800;color:#1e40af;letter-spacing:0.02em;">Relev\u00e9 de notes</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px;">Document officiel de notation</div>
          </td>
          <td style="width:40%;border:none;padding:0;background-color:#ffffff;text-align:right;vertical-align:top;">
            <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Ann\u00e9e universitaire</div>
            <div style="font-size:14px;font-weight:700;color:#111827;">${bulletin.inscription?.annee_universitaire || "\u2014"}</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:4px;">\u00c9dit\u00e9 le ${dateStr}</div>
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:3px solid #1e40af;margin:0 0 2px 0;">
      <hr style="border:none;border-top:1px solid #93c5fd;margin:0 0 20px 0;">
    `;

      // Student info
      pdfContent.innerHTML += `
      <table style="width:100%;border-collapse:collapse;background-color:#ffffff;margin-bottom:22px;">
        <tr>
          <td style="width:8px;background-color:#1e40af;padding:0;border:none;"></td>
          <td style="border:none;padding:6px 8px;background-color:#f8fafc;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Informations \u00e9tudiant</td>
        </tr>
      </table>
      <table style="width:100%;border:none;border-collapse:collapse;background-color:#ffffff;margin-bottom:24px;">
        <tr>
          <td style="width:50%;border:none;padding:4px 0;background-color:#ffffff;font-size:13px;">
            <span style="color:#6b7280;">Nom &amp; Pr\u00e9noms :</span><br>
            <span style="color:#111827;font-weight:600;">${bulletin.inscription?.etudiant_nom || "\u2014"}</span>
          </td>
          <td style="width:50%;border:none;padding:4px 0;background-color:#ffffff;font-size:13px;">
            <span style="color:#6b7280;">Matricule :</span><br>
            <span style="color:#111827;font-weight:600;">${bulletin.inscription?.matricule || "\u2014"}</span>
          </td>
        </tr>
        <tr>
          <td style="width:50%;border:none;padding:4px 0;background-color:#ffffff;font-size:13px;">
            <span style="color:#6b7280;">Fili\u00e8re :</span><br>
            <span style="color:#111827;font-weight:600;">${bulletin.inscription?.filiere_nom || "\u2014"}</span>
          </td>
          <td style="width:50%;border:none;padding:4px 0;background-color:#ffffff;font-size:13px;">
            <span style="color:#6b7280;">Niveau :</span><br>
            <span style="color:#111827;font-weight:600;">${bulletin.inscription?.niveau || "\u2014"}</span>
          </td>
        </tr>
      </table>
    `;

      // ── Per-semester tables ─────────────────────────────────────────────────
      let semIndex = 0;
      for (const [semestre, data] of Object.entries(bulletinObj)) {
        semIndex++;

        // Parcourir les sessions (normale et rattrapage)
        const SESSION_KEYS = [
          ["session_normale", "Session Normale"],
          ["session_rattrapage", "Session Rattrapage"],
        ];

        for (const [sessionKey, sessionLabel] of SESSION_KEYS) {
          const sessionData = data[sessionKey];
          if (!sessionData?.notes?.length) continue;

          // Section title
          pdfContent.innerHTML += `
          <table style="width:100%;border-collapse:collapse;background-color:#ffffff;margin-bottom:6px;">
            <tr>
              <td style="width:4px;background-color:#1e40af;padding:0;border:none;border-radius:2px;"></td>
              <td style="border:none;padding:4px 8px;background-color:#ffffff;font-size:13px;font-weight:700;color:#1e40af;">Semestre ${semestre} — ${sessionLabel}</td>
            </tr>
          </table>
        `;

          // Notes table
          const table = document.createElement("table");
          table.style.cssText =
            "width:100%;border-collapse:collapse;margin-bottom:10px;background-color:#ffffff;color:#111827;";

          const notes = sessionData.notes || [];
          let semPond = 0,
            semCoeff = 0;

          table.innerHTML = `
          <thead>
            <tr style="background-color:#1e40af;">
              <th style="width:36px;border:1px solid #1e40af;padding:8px 6px;text-align:center;color:#ffffff;background-color:#1e40af;font-weight:600;font-size:11px;">N\u00b0</th>
              <th style="border:1px solid #1e40af;padding:8px 12px;text-align:left;color:#ffffff;background-color:#1e40af;font-weight:600;font-size:11px;">Mati\u00e8re</th>
              <th style="width:50px;border:1px solid #1e40af;padding:8px 6px;text-align:center;color:#ffffff;background-color:#1e40af;font-weight:600;font-size:11px;">Coeff.</th>
              <th style="width:70px;border:1px solid #1e40af;padding:8px 6px;text-align:center;color:#ffffff;background-color:#1e40af;font-weight:600;font-size:11px;">Note /20</th>
              <th style="width:65px;border:1px solid #1e40af;padding:8px 6px;text-align:center;color:#ffffff;background-color:#1e40af;font-weight:600;font-size:11px;">Pond.</th>
            </tr>
          </thead>
          <tbody>
            ${notes
              .map((n, idx) => {
                const coeff = parseFloat(n.coefficient || n.credit || 0);
                const note = parseFloat(n.note || 0);
                const pond = (note * coeff).toFixed(2);
                semPond += note * coeff;
                semCoeff += coeff;
                const bgColor = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
                return `
            <tr style="background-color:${bgColor};">
              <td style="border:1px solid #e2e8f0;padding:7px 6px;text-align:center;color:#6b7280;background-color:${bgColor};font-size:12px;">${idx + 1}</td>
              <td style="border:1px solid #e2e8f0;padding:7px 12px;color:#111827;background-color:${bgColor};font-size:12px;">${n.matiere}</td>
              <td style="border:1px solid #e2e8f0;padding:7px 6px;text-align:center;color:#111827;background-color:${bgColor};font-size:12px;">${coeff}</td>
              <td style="border:1px solid #e2e8f0;padding:7px 6px;text-align:center;color:#111827;background-color:${bgColor};font-size:12px;font-weight:600;">${note.toFixed(2)}</td>
              <td style="border:1px solid #e2e8f0;padding:7px 6px;text-align:center;color:#111827;background-color:${bgColor};font-size:12px;">${pond}</td>
            </tr>`;
              })
              .join("")}
          </tbody>
        `;
          pdfContent.appendChild(table);

          // Summary line for this session
          const moy = semCoeff > 0 ? (semPond / semCoeff).toFixed(2) : "—";
          pdfContent.innerHTML += `
          <div style="margin-bottom:16px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#374151;">
            <span><strong>${sessionLabel}</strong> — Moyenne : <strong>${moy}/20</strong></span>
          </div>
        `;
        } // end for sessions

        // Semester summary
        const semMoy =
          semCoeff > 0 ? (semPond / semCoeff).toFixed(2) : "\u2014";
        const mentionC =
          data.mention === "Admis"
            ? "#16a34a"
            : data.mention === "Rattrapage"
              ? "#ca8a04"
              : data.mention === "Ajourn\u00e9"
                ? "#dc2626"
                : "#6b7280";
        const mentionBg =
          data.mention === "Admis"
            ? "#f0fdf4"
            : data.mention === "Rattrapage"
              ? "#fefce8"
              : data.mention === "Ajourn\u00e9"
                ? "#fef2f2"
                : "#f3f4f6";

        const sumDiv = document.createElement("div");
        sumDiv.style.cssText =
          "margin-bottom:22px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:4px;background-color:#f8fafc;color:#111827;";
        sumDiv.innerHTML = `
        <table style="width:100%;border:none;border-collapse:collapse;background-color:#f8fafc;">
          <tr>
            <td style="border:none;padding:2px 0;background-color:#f8fafc;font-size:12px;color:#374151;">
              <strong style="color:#111827;">Total coefficient :</strong> ${semCoeff}
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <strong style="color:#111827;">Moyenne :</strong> <span style="font-weight:700;color:#111827;">${semMoy}/20</span>
            </td>
            <td style="border:none;padding:2px 0;background-color:#f8fafc;text-align:right;">
              <span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;background-color:${mentionBg};color:${mentionC};border:1px solid ${mentionC}40;">
                ${data.mention || "\u2014"}
              </span>
            </td>
          </tr>
        </table>
      `;
        pdfContent.appendChild(sumDiv);
      }

      // ── Overall result section ─────────────────────────────────────────────
      const mentionGlobale =
        moyenneNum >= 10
          ? "Admis"
          : moyenneNum >= 8
            ? "Rattrapage"
            : moyenneNum >= 0
              ? "Ajourn\u00e9"
              : "\u2014";
      const globMentionC =
        mentionGlobale === "Admis"
          ? "#16a34a"
          : mentionGlobale === "Rattrapage"
            ? "#ca8a04"
            : mentionGlobale === "Ajourn\u00e9"
              ? "#dc2626"
              : "#6b7280";
      const globMentionBg =
        mentionGlobale === "Admis"
          ? "#f0fdf4"
          : mentionGlobale === "Rattrapage"
            ? "#fefce8"
            : mentionGlobale === "Ajourn\u00e9"
              ? "#fef2f2"
              : "#f3f4f6";

      pdfContent.innerHTML += `
      <hr style="border:none;border-top:2px solid #1e40af;margin:26px 0 18px 0;">

      <table style="width:100%;border-collapse:collapse;background-color:#ffffff;margin-bottom:16px;">
        <tr>
          <td style="width:8px;background-color:#1e40af;padding:0;border:none;"></td>
          <td style="border:none;padding:4px 8px;background-color:#ffffff;font-size:13px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.05em;">R\u00e9sultat g\u00e9n\u00e9ral</td>
        </tr>
      </table>

      <table style="width:100%;border:2px solid #e2e8f0;border-collapse:collapse;background-color:#ffffff;margin-bottom:16px;">
        <tr>
          <td style="width:55%;border:none;padding:18px 20px;background-color:#ffffff;">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Moyenne g\u00e9n\u00e9rale</div>
            <div style="font-size:26px;font-weight:800;color:#111827;">${moyenneGenerale}<span style="font-size:16px;color:#6b7280;">/20</span></div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">${nbNotes} note${nbNotes > 1 ? "s" : ""} \u2022 ${totalCoeff} coefficient${totalCoeff > 1 ? "s" : ""}</div>
          </td>
          <td style="width:45%;border:none;padding:18px 20px;background-color:#ffffff;text-align:center;">
            <div style="display:inline-block;padding:8px 24px;border-radius:30px;font-size:15px;font-weight:700;background-color:${decisionBg};color:${decisionColor};border:2px solid ${decisionColor};">
              ${decision}
            </div>
            <div style="margin-top:8px;">
              <span style="display:inline-block;padding:3px 14px;border-radius:12px;font-size:11px;font-weight:600;background-color:${globMentionBg};color:${globMentionC};border:1px solid ${globMentionC}40;">
                ${mentionGlobale}
              </span>
            </div>
          </td>
        </tr>
      </table>

      <div style="border-left:4px solid ${decisionColor};padding:12px 16px;margin-bottom:22px;background-color:#ffffff;color:#374151;font-size:12px;line-height:1.6;">
        <strong style="color:#111827;">Observation :</strong> ${observation}
      </div>
    `;

      // ── Validation section ──────────────────────────────────────────────────
      pdfContent.innerHTML += `
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0 16px 0;">
      <table style="width:100%;border:none;border-collapse:collapse;background-color:#ffffff;">
        <tr>
          <td style="width:50%;border:none;padding:4px 0;background-color:#ffffff;font-size:11px;color:#6b7280;">
            Fait \u00e0 Fianarantsoa, le ${dateStr}
          </td>
          <td style="width:50%;border:none;padding:4px 0;background-color:#ffffff;text-align:right;font-size:11px;color:#6b7280;">
            Cachet et signature de l'\u00e9tablissement
          </td>
        </tr>
      </table>
      <div style="margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center;">
        Document g\u00e9n\u00e9r\u00e9 par <strong>UniGest</strong> \u2014 Relev\u00e9 officiel de notes \u2014 Document non contractuel
      </div>
    `;

      // ── Render with html2canvas ───────────────────────────────────────────────
      document.body.appendChild(pdfContent);
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: pdfContent.scrollWidth,
        height: pdfContent.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(
        `releve_notes_${bulletin.inscription?.matricule || "etudiant"}.pdf`,
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

  // ── Rendu d'une session d'un semestre ─────────────────────────────────────
  const renderSessionTable = (semestre, sessionKey, sessionData) => {
    const sessionLabel =
      sessionKey === "session_rattrapage" ? "Rattrapage" : "Normal";
    return (
      <div key={`${semestre}-${sessionKey}`} style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h4
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                color: "var(--text)",
                margin: 0,
                fontWeight: 600,
              }}
            >
              Semestre {semestre}
            </h4>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
                background:
                  sessionKey === "session_rattrapage"
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(99,102,241,0.12)",
                color:
                  sessionKey === "session_rattrapage"
                    ? "var(--warning)"
                    : "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Session {sessionLabel}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Moyenne :{" "}
              <strong
                style={{
                  color:
                    parseFloat(sessionData.moyenne) >= 10
                      ? "var(--success)"
                      : "var(--danger)",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {sessionData.moyenne}/20
              </strong>
            </span>
            <Badge
              color={mentionColor[sessionData.mention] || "muted"}
              style={{
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {sessionData.mention}
            </Badge>
          </div>
        </div>
        <div
          style={{
            overflowX: "auto",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "var(--surface2)" }}>
                {["Matière", "Coefficient", "Note /20", "Pondérée"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: "var(--text-muted)",
                      fontSize: 11,
                      fontWeight: 700,
                      borderBottom: "2px solid var(--border)",
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
              {(sessionData.notes || []).map((n, idx) => {
                const key =
                  n.matiere_id !== undefined && n.matiere_id !== null
                    ? String(n.matiere_id)
                    : `idx-${idx}`;
                const noteValue = parseFloat(n.note || 0);
                return (
                  <tr
                    key={key}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {n.matiere}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      {n.coefficient}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            noteValue >= 10
                              ? "var(--success)"
                              : "var(--danger)",
                          fontSize: 14,
                          background:
                            noteValue >= 10
                              ? "rgba(76, 175, 125, 0.1)"
                              : "rgba(229, 115, 115, 0.1)",
                          padding: "3px 7px",
                          borderRadius: "6px",
                          border: `1px solid ${noteValue >= 10 ? "rgba(76, 175, 125, 0.3)" : "rgba(229, 115, 115, 0.3)"}`,
                        }}
                      >
                        {noteValue.toFixed(2)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      {(noteValue * parseFloat(n.coefficient || 0)).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Rendu d'un semestre (avec ses sessions) ────────────────────────────────
  const renderSemestre = (semestre, data) => {
    const sessions = [];
    if (data.session_normale?.notes?.length) {
      sessions.push(["session_normale", data.session_normale]);
    }
    if (data.session_rattrapage?.notes?.length) {
      sessions.push(["session_rattrapage", data.session_rattrapage]);
    }
    if (sessions.length === 0) return null;

    return (
      <Card key={semestre} style={{ marginBottom: 20 }}>
        {sessions.map(([sessionKey, sessionData]) =>
          renderSessionTable(semestre, sessionKey, sessionData),
        )}
      </Card>
    );
  };

  const hasNotes = bulletin && Object.keys(bulletin.bulletin || {}).length > 0;

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
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Sélectionner une inscription
              {inscriptions.length > 0 && (
                <span style={{ fontWeight: 400, marginLeft: 6 }}>
                  ({inscriptions.length} disponible
                  {inscriptions.length > 1 ? "s" : ""})
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
                  color: selectedInscription
                    ? "var(--text)"
                    : "var(--text-muted)",
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
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.18)";
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
            <Card
              style={{
                border: "2px solid var(--border)",
                background:
                  "linear-gradient(135deg, var(--surface), var(--surface2))",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 32,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {[
                  ["Étudiant", bulletin.inscription?.etudiant_nom],
                  ["Matricule", bulletin.inscription?.matricule],
                  ["Filière", bulletin.inscription?.filiere_nom],
                  ["Niveau", bulletin.inscription?.niveau],
                  ["Année", bulletin.inscription?.annee_universitaire],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      textAlign: "center",
                      padding: "8px 16px",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      minWidth: "120px",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
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
                renderSemestre(semestre, data),
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
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
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
