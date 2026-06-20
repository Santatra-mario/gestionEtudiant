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
  useEffect(() => {
    setInscLoading(true);
    api
      .get("/inscriptions")
      .then((r) => {
        const raw = r.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];

        setInscriptions(list);

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

  useEffect(() => {
    if (!selectedInscription) {
      setBulletin(null);
      setMatieres([]);
      return;
    }
    loadBulletin(selectedInscription);
  }, [selectedInscription, loadBulletin]);

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
  // La structure du bulletin est { "S1": { notes: [...], moyenne: ..., mention: ... } }
  const generatePDF = async () => {
    if (!bulletin) return;
    setPdfGenerating(true);
    try {
      const pdfContent = document.createElement("div");
      pdfContent.style.cssText =
        "width:800px;padding:40px 45px;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.4;";

      // ── Calcul des stats globales (sessions normale + rattrapage) ─────────────
      let totalPond = 0,
        totalCoeff = 0,
        nbNotes = 0;
      const bulletinObj = bulletin.bulletin || {};

      for (const semestreData of Object.values(bulletinObj)) {
        for (const sessionKey of ["session_normale", "session_rattrapage"]) {
          const sessionData = semestreData[sessionKey];
          if (!sessionData?.notes) continue;
          for (const n of sessionData.notes) {
            const coeff = parseFloat(n.coefficient || n.credit || 0);
            const note = parseFloat(n.note || 0);
            totalPond += note * coeff;
            totalCoeff += coeff;
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

      const today = new Date();
      const dateStr = today.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // ── En-tête université + badge PDF sécurisé ─────────────────────────────
      pdfContent.innerHTML = `
      <table style="width:100%;border:none;border-collapse:collapse;background-color:#ffffff;margin-bottom:14px;">
        <tr>
          <td style="width:60%;border:none;padding:0;background-color:#ffffff;vertical-align:top;">
            <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#1e40af;font-weight:800;margin-bottom:4px;">UNIVERSIT\u00c9</div>
            <div style="font-size:26px;font-weight:900;color:#1e40af;letter-spacing:0.01em;">Relev\u00e9 de notes</div>
            <div style="font-size:11px;color:#6b7280;margin-top:4px;">Document officiel de notation</div>
          </td>
          <td style="width:40%;border:none;padding:0;background-color:#ffffff;text-align:right;vertical-align:top;">
            <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Ann\u00e9e universitaire</div>
            <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:6px;">${bulletin.inscription?.annee_universitaire || "\u2014"}</div>
            <div style="display:inline-block;padding:4px 14px;border-radius:20px;background-color:#1e40af;color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.05em;">\ud83d\udcc4 PDF s\u00e9curis\u00e9</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:6px;">\u00c9dit\u00e9 le ${dateStr}</div>
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:3px solid #1e40af;margin:0 0 3px 0;">
      <hr style="border:none;border-top:1px solid #93c5fd;margin:0 0 24px 0;">
    `;

      // ── Informations étudiant (aérée, bordure gauche bleue) ─────────────────
      pdfContent.innerHTML += `
      <table style="width:100%;border-collapse:collapse;background-color:#ffffff;margin-bottom:24px;">
        <tr>
          <td style="width:6px;background-color:#1e40af;padding:0;border:none;"></td>
          <td style="border:none;padding:8px 12px;background-color:#ffffff;font-size:13px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Informations \u00e9tudiant</td>
        </tr>
      </table>

      <div style="border-left:4px solid #1e40af;padding:12px 20px;margin-bottom:28px;background-color:#ffffff;">
        <table style="width:100%;border:none;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td style="width:50%;border:none;padding:8px 4px;background-color:#ffffff;font-size:14px;vertical-align:top;">
              <div style="color:#6b7280;font-weight:700;font-size:13px;margin-bottom:2px;">Nom &amp; Pr\u00e9noms</div>
              <div style="color:#111827;font-weight:600;font-size:15px;">${bulletin.inscription?.etudiant_nom || "\u2014"}</div>
            </td>
            <td style="width:50%;border:none;padding:8px 4px;background-color:#ffffff;font-size:14px;vertical-align:top;">
              <div style="color:#6b7280;font-weight:700;font-size:13px;margin-bottom:2px;">Matricule</div>
              <div style="color:#111827;font-weight:600;font-size:15px;">${bulletin.inscription?.matricule || "\u2014"}</div>
            </td>
          </tr>
          <tr>
            <td style="width:50%;border:none;padding:8px 4px;background-color:#ffffff;font-size:14px;vertical-align:top;">
              <div style="color:#6b7280;font-weight:700;font-size:13px;margin-bottom:2px;">Fili\u00e8re</div>
              <div style="color:#111827;font-weight:600;font-size:15px;">${bulletin.inscription?.filiere_nom || "\u2014"}</div>
            </td>
            <td style="width:50%;border:none;padding:8px 4px;background-color:#ffffff;font-size:14px;vertical-align:top;">
              <div style="color:#6b7280;font-weight:700;font-size:13px;margin-bottom:2px;">Niveau</div>
              <div style="color:#111827;font-weight:600;font-size:15px;">${bulletin.inscription?.niveau || "\u2014"}</div>
            </td>
          </tr>
        </table>
      </div>
    `;

      // ── Tableaux par semestre → session normale + rattrapage ─────────────
      const SESSION_PDF_LABELS = {
        session_normale: "Session Normale",
        session_rattrapage: "Session Rattrapage",
      };
      const SESSION_PDF_COLORS = {
        session_normale: { color: "#1e40af", bg: "#eff6ff" },
        session_rattrapage: { color: "#ca8a04", bg: "#fefce8" },
      };

      for (const [semestre, semestreData] of Object.entries(bulletinObj)) {
        for (const [sessionKey, sessionData] of Object.entries(semestreData)) {
          const notes = sessionData?.notes || [];
          if (notes.length === 0) continue;

          const label = SESSION_PDF_LABELS[sessionKey] || sessionKey;
          const { color: sessionColor, bg: sessionBg } = SESSION_PDF_COLORS[
            sessionKey
          ] || {
            color: "#1e40af",
            bg: "#eff6ff",
          };

          let semPond = 0,
            semCoeff = 0;

          // Titre semestre (section header)
          pdfContent.innerHTML += `
          <table style="width:100%;border-collapse:collapse;background-color:#ffffff;margin-bottom:6px;">
            <tr>
              <td style="width:5px;background-color:${sessionColor};padding:0;border:none;"></td>
              <td style="border:none;padding:6px 10px;background-color:${sessionBg};font-size:14px;font-weight:700;color:${sessionColor};">
                Semestre ${semestre} — ${label}
              </td>
            </tr>
          </table>
        `;

          // Tableau des notes
          const table = document.createElement("table");
          table.style.cssText =
            "width:100%;border-collapse:collapse;margin-bottom:4px;background-color:#ffffff;color:#111827;";

          table.innerHTML = `
          <thead>
            <tr style="background-color:${sessionColor};">
              <th style="width:36px;border:1px solid ${sessionColor};padding:10px 4px;text-align:center;color:black;font-weight:700;font-size:12px;">N\u00b0</th>
              <th style="border:1px solid ${sessionColor};padding:10px 14px;text-align:left;color:black;font-weight:700;font-size:12px;">Mati\u00e8re</th>
              <th style="width:55px;border:1px solid ${sessionColor};padding:10px 4px;text-alignblack;color:#black;font-weight:800;font-size:12px;">Coeff.</th>
              <th style="width:80px;border:1px solid ${sessionColor};padding:10px 4px;text-align:center;color:black;font-weight:800;font-size:12px;">Note /20</th>
              <th style="width:70px;border:1px solid ${sessionColor};padding:10px 4px;text-align:center;color:black;font-weight:800;font-size:12px;">Coeff * Note.</th>
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
                const noteColor = note >= 10 ? "#16a34a" : "#dc2626";
                const noteBg =
                  note >= 10 ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)";
                return `
            <tr style="background-color:${bgColor};">
              <td style="border:1px solid #e2e8f0;padding:10px 4px;text-align:center;color:#6b7280;background-color:${bgColor};font-size:13px;">${idx + 1}</td>
              <td style="border:1px solid #e2e8f0;padding:10px 14px;color:#111827;background-color:${bgColor};font-size:13px;">${n.matiere}</td>
              <td style="border:1px solid #d1d5db;padding:10px 4px;text-align:center;font-weight:700;font-size:14px;color:#111827;background-color:${bgColor};border-left:2px solid ${sessionColor}40;">${coeff}</td>
              <td style="border:1px solid #d1d5db;padding:10px 4px;text-align:center;color:#111827;background-color:${bgColor};font-size:13px;">
                <span style="display:inline-block;padding:2px 10px;border-radius:6px;font-weight:700;font-size:14px;color:${noteColor};background-color:${noteBg};border:1px solid ${noteColor}40;">${note.toFixed(2)}</span>
              </td>
              <td style="border:1px solid #d1d5db;padding:10px 4px;text-align:center;font-weight:700;font-size:14px;color:#111827;background-color:${bgColor};border-left:2px solid ${sessionColor}40;">${pond}</td>
            </tr>`;
              })
              .join("")}
          </tbody>
        `;
          pdfContent.appendChild(table);

          // Résumé de la session (bordure supérieure + badge agrandi)
          const semMoy =
            semCoeff > 0 ? (semPond / semCoeff).toFixed(2) : "\u2014";
          const mention = sessionData.mention || "\u2014";
          const mentionC =
            mention === "Admis"
              ? "#16a34a"
              : mention === "Rattrapage"
                ? "#ca8a04"
                : mention === "Ajourn\u00e9"
                  ? "#dc2626"
                  : "#6b7280";
          const mentionBg =
            mention === "Admis"
              ? "#f0fdf4"
              : mention === "Rattrapage"
                ? "#fefce8"
                : mention === "Ajourn\u00e9"
                  ? "#fef2f2"
                  : "#f3f4f6";

          const sumDiv = document.createElement("div");
          sumDiv.style.cssText =
            "margin-bottom:22px;padding:12px 16px;border:1px solid #e2e8f0;border-top:2px solid #e2e8f0;border-radius:0 0 6px 6px;background-color:#f8fafc;color:#111827;";
          sumDiv.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <div style="font-size:13px;color:#374151;">
              <strong style="color:#111827;">Total coefficient :</strong> ${semCoeff}
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <strong style="color:#111827;">Moyenne :</strong> <span style="font-weight:700;font-size:15px;color:#111827;">${semMoy}/20</span>
            </div>
            <div>
              <span style="display:inline-block;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700;background-color:${mentionBg};color:${mentionC};border:1px solid ${mentionC}50;">
                ${mention}
              </span>
            </div>
          </div>
        `;
          pdfContent.appendChild(sumDiv);
        }
      }

      // ── Résultat général (refondu : deux lignes distinctes, sans tableau) ─────
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
      <hr style="border:none;border-top:2px solid #1e40af;margin:28px 0 20px 0;">

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
        <div style="width:6px;height:24px;background-color:#1e40af;border-radius:3px;"></div>
        <div style="font-size:15px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.06em;">R\u00e9sultat g\u00e9n\u00e9ral</div>
      </div>

      <!-- Première ligne : moyenne à gauche, décision à droite -->
      <div style="display:flex;align-items:stretch;gap:0;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px;background-color:#ffffff;">
        <!-- Bloc moyenne -->
        <div style="flex:1;padding:22px 28px;background-color:#ffffff;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.10em;margin-bottom:6px;font-weight:600;">Moyenne g\u00e9n\u00e9rale</div>
          <div style="font-size:36px;font-weight:900;color:#111827;line-height:1.1;">${moyenneGenerale}<span style="font-size:18px;color:#6b7280;font-weight:600;">/20</span></div>
          <div style="font-size:13px;color:#6b7280;margin-top:6px;">${nbNotes} note${nbNotes > 1 ? "s" : ""} \u2022 ${totalCoeff} coefficient${totalCoeff > 1 ? "s" : ""}</div>
        </div>
        <!-- Séparateur vertical -->
        <div style="width:1px;background-color:#e2e8f0;"></div>
        <!-- Bloc décision -->
        <div style="flex:1;padding:22px 28px;background-color:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
          <div style="display:inline-block;padding:10px 32px;border-radius:40px;font-size:18px;font-weight:800;background-color:${decisionBg};color:${decisionColor};border:3px solid ${decisionColor};">
            ${decision}
          </div>
          <span style="display:inline-block;padding:4px 18px;border-radius:20px;font-size:12px;font-weight:700;background-color:${globMentionBg};color:${globMentionC};border:1px solid ${globMentionC}50;">
            ${mentionGlobale}
          </span>
        </div>
      </div>

      <!-- Deuxième ligne : observation (pleine largeur) -->
      <div style="border-left:4px solid ${decisionColor};padding:16px 20px;margin-bottom:26px;background-color:#f8fafc;color:#374151;font-size:13px;line-height:1.7;border-radius:0 8px 8px 0;">
        <strong style="color:#111827;">Observation :</strong> ${observation}
      </div>
    `;

      // ── Pied de page ────────────────────────────────────────────────────────────
      pdfContent.innerHTML += `
      <hr style="border:none;border-top:1px solid #d1d5db;margin:20px 0 14px 0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div style="font-size:11px;color:#6b7280;">
          Fait \u00e0 Fianarantsoa, le ${dateStr}
        </div>
        <div style="font-size:11px;color:#6b7280;text-align:right;">
          Cachet et signature de l'\u00e9tablissement
        </div>
      </div>
      <div style="margin-top:14px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#6b7280;text-align:center;">
        G\u00e9n\u00e9r\u00e9 par <strong>UniGest</strong> \u2014 ${dateStr} \u2014 Relev\u00e9 officiel de notes \u2014 Document non contractuel
      </div>
    `;

      // ── Rendu html2canvas → jsPDF (page 1 : tableaux, page 2 : résultat) ────
      // Extraire le contenu du résultat général dans un conteneur séparé
      const pdfPage1 = document.createElement("div");
      pdfPage1.style.cssText = pdfContent.style.cssText;
      pdfPage1.innerHTML = pdfContent.innerHTML;

      // Créer la page 2 avec uniquement le résultat général + footer
      const pdfPage2 = document.createElement("div");
      pdfPage2.style.cssText = pdfContent.style.cssText;
      // Reprendre depuis le <hr> qui précède "Résultat général"
      pdfPage2.innerHTML = pdfContent.innerHTML.substring(
        pdfContent.innerHTML.lastIndexOf(
          '<hr style="border:none;border-top:2px solid #1e40af;',
        ),
      );

      // Supprimer ce bloc de la page 1 (tout depuis le <hr>)
      pdfPage1.innerHTML = pdfPage1.innerHTML.substring(
        0,
        pdfPage1.innerHTML.lastIndexOf(
          '<hr style="border:none;border-top:2px solid #1e40af;',
        ),
      );

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;

      // ── Page 1 : tableaux des notes ──
      document.body.appendChild(pdfPage1);
      const canvas1 = await html2canvas(pdfPage1, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: pdfPage1.scrollWidth,
        height: pdfPage1.scrollHeight,
      });
      const imgData1 = canvas1.toDataURL("image/png");
      const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
      pdf.addImage(imgData1, "PNG", 0, 0, imgWidth, imgHeight1);
      document.body.removeChild(pdfPage1);

      // ── Saut de page ──
      pdf.addPage();

      // ── Page 2 : résultat général + footer ──
      document.body.appendChild(pdfPage2);
      const canvas2 = await html2canvas(pdfPage2, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: pdfPage2.scrollWidth,
        height: pdfPage2.scrollHeight,
      });
      const imgData2 = canvas2.toDataURL("image/png");
      const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
      pdf.addImage(imgData2, "PNG", 0, 0, imgWidth, imgHeight2);
      document.body.removeChild(pdfPage2);

      pdf.save(
        `releve_notes_${bulletin.inscription?.matricule || "etudiant"}.pdf`,
      );
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      setMsg({ text: "Erreur lors de la génération du PDF.", type: "danger" });
    } finally {
      setPdfGenerating(false);
    }
  };

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
                {["Matière", "Coefficient", "Note /20", "Coeff * Note /20"].map(
                  (h) => (
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
                  ),
                )}
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

  // ── Rendu d'un semestre (avec ses sessions normale + rattrapage) ───────────
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

            <div className="no-print flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={generatePDF}
                disabled={pdfGenerating || !hasNotes}
                className="flex items-center justify-center gap-2 bg-transparent border-none cursor-pointer transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Télécharger le relevé de notes au format PDF"
              >
                <img
                  src="/src/assets/pdf-icon.svg"
                  alt="Télécharger PDF"
                  className="w-12 h-12 object-contain"
                />
                <span className="text-red dark:text-yellow transition-colors duration-400 ease-in-out text-sm font-semibold">
                  Télécharger PDF
                </span>
              </button>
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
