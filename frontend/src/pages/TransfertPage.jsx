/**
 * TransfertPage.jsx — Gestion des transferts UniGest
 *
 * CORRECTIONS APPORTÉES :
 *  1. Quand un transfert est accepté → l'étudiant est supprimé de la liste EtudiantsPage
 *     (via suppression de son inscription active + l'étudiant quitte l'établissement)
 *  2. Notification toast après acceptation ou refus d'un transfert
 *  3. Les boutons Accepter/Refuser sont désactivés pendant le traitement
 *     pour éviter les doubles clics et les conflits multi-admin
 *  4. CORRECTION BUG MATRICULE : Plus d'accumulation comme "2007 H-2006 H-TOL"
 *     → Extraction correcte de l'année depuis le matricule original
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeftRight,
  Plus,
  Check,
  X,
  Clock,
  Search,
  Building2,
  GraduationCap,
  User,
  FileText,
  RefreshCw,
  History,
  ToggleLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Bell,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  PageHeader,
  Btn,
  Table,
  Tr,
  Td,
  Badge,
  Modal,
  Input,
  Select,
  FormRow,
  FormSection,
  Alert,
  Spinner,
  EmptyState,
} from "../components/ui";

/* ══════════════════════════════════════════════════════════════════════════
   ICÔNE SVG — Fichier transfert (document avec flèche)
   ══════════════════════════════════════════════════════════════════════════ */
function IconFichierTransfert({ size = 16, color = "#22c55e" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Page du document */}
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill={color + "22"}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="14,2 14,8 20,8"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Flèche transfert à l'intérieur */}
      <line
        x1="8"
        y1="13"
        x2="16"
        y2="13"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polyline
        points="13,10 16,13 13,16"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ICÔNE SVG — Fichier refusé (document avec croix)
   ══════════════════════════════════════════════════════════════════════════ */
function IconFichierRefuse({ size = 16, color = "#ef4444" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill={color + "22"}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="14,2 14,8 20,8"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Croix refus */}
      <line
        x1="9"
        y1="11"
        x2="15"
        y2="17"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="11"
        x2="9"
        y2="17"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSANT — Cloche de notification transfert (header fixe haut-droite)
   N'altère aucun code existant — s'insère juste avant la page
   ══════════════════════════════════════════════════════════════════════════ */
function NotificationCloche() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [animBell, setAnimBell] = useState(false);
  const panelRef = useRef(null);

  // Fermer le panneau si clic dehors
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Écoute les 3 événements : nouvelle_demande (Admin), accepte et refuse (Secrétaire)
  useEffect(() => {
    // ── Nouvel événement : ADMINISTRATEUR reçoit quand Secrétaire crée une demande ──
    const onNouvelleDemande = (e) => {
      const {
        etudiantPrenom = "",
        etudiantNom = "",
        filiere = "",
        niveau = "",
      } = e.detail || {};
      setNotifs((prev) =>
        [
          {
            id: Date.now(),
            type: "nouvelle_demande",
            tag: "NOUVELLE DEMANDE",
            titre: `${etudiantPrenom} ${etudiantNom}`,
            message: `Le secrétaire a soumis une demande de transfert pour rejoindre ${filiere}${niveau ? ` (${niveau})` : ""}. Veuillez examiner et traiter cette demande.`,
            heure: new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date().toLocaleDateString("fr-FR"),
            lu: false,
          },
          ...prev,
        ].slice(0, 20),
      );
      setAnimBell(true);
      setTimeout(() => setAnimBell(false), 900);
    };

    // ── Secrétaire reçoit : transfert accepté par l'Admin ──
    const onAccepte = (e) => {
      const { etudiantPrenom = "", etudiantNom = "" } = e.detail || {};
      setNotifs((prev) =>
        [
          {
            id: Date.now(),
            type: "accepte",
            tag: "TRANSFERT RÉUSSI",
            titre: `${etudiantPrenom} ${etudiantNom}`,
            message:
              "Le transfert a été accepté par l'administrateur. L'étudiant a été retiré de la liste.",
            heure: new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date().toLocaleDateString("fr-FR"),
            lu: false,
          },
          ...prev,
        ].slice(0, 20),
      );
      setAnimBell(true);
      setTimeout(() => setAnimBell(false), 900);
    };

    // ── Secrétaire reçoit : transfert refusé par l'Admin ──
    const onRefuse = (e) => {
      const { etudiantPrenom = "", etudiantNom = "" } = e.detail || {};
      setNotifs((prev) =>
        [
          {
            id: Date.now(),
            type: "refuse",
            tag: "TRANSFERT REFUSÉ",
            titre: `${etudiantPrenom} ${etudiantNom}`,
            message:
              "La demande de transfert a été refusée par l'administrateur.",
            heure: new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date().toLocaleDateString("fr-FR"),
            lu: false,
          },
          ...prev,
        ].slice(0, 20),
      );
      setAnimBell(true);
      setTimeout(() => setAnimBell(false), 900);
    };

    window.addEventListener("transfert:nouvelle_demande", onNouvelleDemande);
    window.addEventListener("transfert:accepte", onAccepte);
    window.addEventListener("transfert:refuse", onRefuse);
    return () => {
      window.removeEventListener(
        "transfert:nouvelle_demande",
        onNouvelleDemande,
      );
      window.removeEventListener("transfert:accepte", onAccepte);
      window.removeEventListener("transfert:refuse", onRefuse);
    };
  }, []);

  const nonLues = notifs.filter((n) => !n.lu).length;

  const marquerToutesLues = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })));

  const supprimerNotif = (id) =>
    setNotifs((prev) => prev.filter((n) => n.id !== id));

  const viderTout = () => setNotifs([]);

  return (
    <>
      <style>{`
        @keyframes nc-bellRing {
          0%,100% { transform:rotate(0deg); }
          12%  { transform:rotate(20deg); }
          24%  { transform:rotate(-18deg); }
          36%  { transform:rotate(14deg); }
          48%  { transform:rotate(-10deg); }
          60%  { transform:rotate(6deg); }
          72%  { transform:rotate(-3deg); }
        }
        @keyframes nc-slideDown {
          from { opacity:0; transform:translateY(-10px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes nc-badgePop {
          0%  { transform:scale(0); }
          65% { transform:scale(1.3); }
          100%{ transform:scale(1); }
        }
        @keyframes nc-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          50%      { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
        }
        .nc-bell-ring  { animation: nc-bellRing 0.9s ease; }
        .nc-slide-down { animation: nc-slideDown 0.2s ease; }
        .nc-badge-pop  { animation: nc-badgePop 0.4s cubic-bezier(.34,1.56,.64,1); }
        .nc-item:hover { background: var(--surface2) !important; }
        .nc-del:hover  { background: rgba(239,68,68,0.15) !important;
                         color: #ef4444 !important; }
        .nc-badge-pulse { animation: nc-pulse 1.4s infinite; }
      `}</style>

      {/*
        ── Position : décalée vers la gauche pour ne PAS chevaucher
           le badge rôle "Secrétaire / Administrateur" en haut à droite.
           right: 220px place la cloche juste avant ce badge.
      */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: 13,
          right: 280 /* ← décalé à gauche pour ne pas chevaucher le badge rôle */,
          zIndex: 1000,
        }}
      >
        {/* ── Bouton cloche ── */}
        <button
          onClick={() => {
            setOpen((v) => !v);
            if (!open) marquerToutesLues();
          }}
          className={animBell ? "nc-bell-ring" : ""}
          title="Notifications de transferts"
          style={{
            position: "relative",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `2px solid ${open ? "var(--accent)" : "var(--border)"}`,
            background: open ? "rgba(99,102,241,0.14)" : "var(--surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: open
              ? "0 0 0 4px rgba(99,102,241,0.18)"
              : "0 2px 8px rgba(0,0,0,0.18)",
            transition: "all 0.2s ease",
            outline: "none",
          }}
        >
          {/* Cloche avec icône fichier superposé en petit */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell
              size={18}
              style={{
                color: open
                  ? "var(--accent)"
                  : nonLues > 0
                    ? "#a78bfa"
                    : "var(--text-muted)",
                fill: nonLues > 0 ? "rgba(167,139,250,0.15)" : "none",
                transition: "color 0.2s",
              }}
            />
            {/* Petit badge fichier en bas à gauche de la cloche */}
            {notifs.length > 0 &&
              (() => {
                const lastType = notifs[0]?.type;
                const badgeBg =
                  lastType === "accepte"
                    ? "rgba(34,197,94,0.9)"
                    : lastType === "refuse"
                      ? "rgba(239,68,68,0.9)"
                      : "rgba(99,102,241,0.9)"; // nouvelle_demande → indigo
                return (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -5,
                      left: -7,
                      width: 13,
                      height: 13,
                      borderRadius: "50%",
                      background: badgeBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid var(--surface)",
                    }}
                  >
                    {lastType === "accepte" && (
                      <svg width="7" height="7" viewBox="0 0 10 10">
                        <polyline
                          points="1,5 4,8 9,2"
                          stroke="#fff"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {lastType === "refuse" && (
                      <svg width="7" height="7" viewBox="0 0 10 10">
                        <line
                          x1="2"
                          y1="2"
                          x2="8"
                          y2="8"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="8"
                          y1="2"
                          x2="2"
                          y2="8"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {lastType === "nouvelle_demande" && (
                      /* Point d'exclamation pour nouvelle demande */
                      <svg width="7" height="7" viewBox="0 0 10 10">
                        <line
                          x1="5"
                          y1="2"
                          x2="5"
                          y2="6.5"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="5" cy="8.5" r="0.9" fill="#fff" />
                      </svg>
                    )}
                  </div>
                );
              })()}
          </div>

          {/* Badge compteur non-lues */}
          {nonLues > 0 && (
            <span
              key={nonLues}
              className="nc-badge-pop nc-badge-pulse"
              style={{
                position: "absolute",
                top: 1,
                right: 1,
                minWidth: 16,
                height: 16,
                borderRadius: 999,
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff",
                fontSize: 9,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
                border: "2px solid var(--surface)",
                lineHeight: 1,
              }}
            >
              {nonLues > 9 ? "9+" : nonLues}
            </span>
          )}
        </button>

        {/* ── Panneau déroulant ── */}
        {open && (
          <div
            className="nc-slide-down"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 360,
              maxHeight: 500,
              overflowY: "auto",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              borderRadius: 16,
              boxShadow:
                "0 16px 48px rgba(0,0,0,0.4), 0 2px 12px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1001,
            }}
          >
            {/* En-tête panneau */}
            <div
              style={{
                padding: "13px 16px 11px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "var(--surface)",
                zIndex: 2,
                borderRadius: "16px 16px 0 0",
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Icône fichier dans le header du panneau */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      fill="rgba(99,102,241,0.2)"
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="14,2 14,8 20,8"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="8"
                      y1="13"
                      x2="16"
                      y2="13"
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="13,10 16,13 13,16"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--text)",
                  }}
                >
                  Notifications transferts
                </span>
                {notifs.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: "rgba(99,102,241,0.15)",
                      color: "#818cf8",
                      borderRadius: 20,
                      padding: "1px 7px",
                      border: "1px solid rgba(99,102,241,0.25)",
                    }}
                  >
                    {notifs.length}
                  </span>
                )}
              </div>
              {notifs.length > 0 && (
                <button
                  onClick={viderTout}
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    background: "none",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    padding: "3px 9px",
                    borderRadius: 6,
                    transition: "all 0.15s",
                    fontFamily: "var(--font-body)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  {/* Icône corbeille SVG */}
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19,6l-1,14H6L5,6" />
                    <path d="M10,11v6M14,11v6" />
                    <path d="M9,6V4h6v2" />
                  </svg>
                  Tout effacer
                </button>
              )}
            </div>

            {/* Corps */}
            {notifs.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Cloche vide illustrée */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "var(--surface2)",
                    border: "1.5px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell
                    size={24}
                    style={{ color: "var(--border)", opacity: 0.5 }}
                  />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Aucune notification
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      opacity: 0.7,
                    }}
                  >
                    Les transferts acceptés ou refusés
                    <br />
                    apparaîtront ici
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {notifs.map((n, idx) => {
                  // Couleurs adaptées selon le type de notification
                  const typeColor =
                    n.type === "accepte"
                      ? "#22c55e"
                      : n.type === "refuse"
                        ? "#ef4444"
                        : "#818cf8"; // nouvelle_demande → indigo

                  const typeBg =
                    n.type === "accepte"
                      ? "rgba(34,197,94,0.05)"
                      : n.type === "refuse"
                        ? "rgba(239,68,68,0.05)"
                        : "rgba(99,102,241,0.07)";

                  const iconBg =
                    n.type === "accepte"
                      ? "rgba(34,197,94,0.10)"
                      : n.type === "refuse"
                        ? "rgba(239,68,68,0.10)"
                        : "rgba(99,102,241,0.12)";

                  const iconBorder =
                    n.type === "accepte"
                      ? "rgba(34,197,94,0.3)"
                      : n.type === "refuse"
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(99,102,241,0.35)";

                  const tagBg =
                    n.type === "accepte"
                      ? "rgba(34,197,94,0.12)"
                      : n.type === "refuse"
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(99,102,241,0.12)";

                  return (
                    <div
                      key={n.id}
                      className="nc-item"
                      style={{
                        display: "flex",
                        gap: 11,
                        padding: "13px 14px",
                        borderBottom:
                          idx < notifs.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                        background: n.lu ? "transparent" : typeBg,
                        transition: "background 0.15s",
                        cursor: "default",
                      }}
                    >
                      {/* ── Icône selon le type ── */}
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: iconBg,
                          border: `1.5px solid ${iconBorder}`,
                          position: "relative",
                        }}
                      >
                        {n.type === "accepte" && (
                          <IconFichierTransfert size={18} color="#22c55e" />
                        )}
                        {n.type === "refuse" && (
                          <IconFichierRefuse size={18} color="#ef4444" />
                        )}
                        {n.type === "nouvelle_demande" && (
                          <svg
                            width={18}
                            height={18}
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                              fill="rgba(99,102,241,0.2)"
                              stroke="#818cf8"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <polyline
                              points="14,2 14,8 20,8"
                              fill="none"
                              stroke="#818cf8"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <line
                              x1="12"
                              y1="11"
                              x2="12"
                              y2="15"
                              stroke="#818cf8"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <circle cx="12" cy="17.5" r="0.8" fill="#818cf8" />
                          </svg>
                        )}
                      </div>

                      {/* ── Texte ── */}
                      <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                        {/* Tag de statut */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: typeColor,
                              background: tagBg,
                              border: `1px solid ${iconBorder}`,
                              padding: "2px 6px",
                              borderRadius: 20,
                            }}
                          >
                            {n.tag}
                          </span>
                          {!n.lu && (
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: typeColor,
                                boxShadow: `0 0 5px ${typeColor}`,
                              }}
                            />
                          )}
                        </div>

                        {/* Nom de l'étudiant */}
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "var(--text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: 3,
                          }}
                        >
                          {n.titre}
                        </div>

                        {/* Description */}
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "var(--text-muted)",
                            lineHeight: 1.5,
                          }}
                        >
                          {n.message}
                        </div>

                        {/* Heure + date */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 6,
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--text-muted)"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                          </svg>
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              opacity: 0.75,
                            }}
                          >
                            {n.date} à {n.heure}
                          </span>
                        </div>
                      </div>

                      {/* ── Bouton supprimer (corbeille) ── */}
                      <button
                        className="nc-del"
                        onClick={() => supprimerNotif(n.id)}
                        title="Supprimer cette notification"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted)",
                          flexShrink: 0,
                          alignSelf: "flex-start",
                          transition:
                            "background 0.15s, color 0.15s, border-color 0.15s",
                        }}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19,6l-1,14H6L5,6" />
                          <path d="M10,11v6M14,11v6" />
                          <path d="M9,6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Configs statuts ─────────────────────────────────────────────────────── */
const STATUT_CONFIG = {
  en_attente: { label: "En attente", color: "warning", icon: Clock },
  accepte: { label: "Accepté", color: "success", icon: Check },
  refuse: { label: "Refusé", color: "danger", icon: X },
};

const STATUT_INSCRIPTION = ["actif", "suspendu", "diplome", "abandonne"];
const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSANT RÉUTILISABLE — Recherche + sélection d'étudiant (autocomplete)
   ══════════════════════════════════════════════════════════════════════════ */
function StudentSearchSelect({
  etudiants,
  value,
  onChange,
  label = "Étudiant *",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = etudiants.find((e) => String(e.id) === String(value));

  const filtered = etudiants.filter((e) => {
    if (!query) return true;
    return `${e.prenom} ${e.nom} ${e.matricule}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const handleSelect = (etudiant) => {
    onChange(etudiant.id);
    setQuery("");
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange("");
    setOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setOpen(false);
  };

  const displayValue =
    selected && !query
      ? `${selected.prenom} ${selected.nom} — ${selected.matricule}`
      : query;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            display: "block",
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <input
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Taper pour rechercher un étudiant..."
          autoComplete="off"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 36px 11px 36px",
            borderRadius: 10,
            border: `1.5px solid ${value ? "var(--accent)" : "var(--border)"}`,
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />
        {(value || query) && (
          <button
            onClick={handleClear}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              padding: 2,
              borderRadius: 4,
            }}
            title="Effacer la sélection"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {selected && !open && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 8,
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--success)",
              flexShrink: 0,
            }}
          />
          <span
            style={{ fontSize: 10, color: "var(--success)", fontWeight: 600 }}
          >
            Sélectionné : {selected.prenom} {selected.nom}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "monospace",
              marginLeft: 4,
            }}
          >
            {selected.matricule}
          </span>
        </div>
      )}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "14px 16px",
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              Aucun étudiant trouvé pour « {query} »
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "6px 12px 4px",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </div>
              {filtered.map((e) => (
                <div
                  key={e.id}
                  onClick={() => handleSelect(e)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "background 0.1s",
                    borderBottom: "1px solid var(--border)",
                    background:
                      String(e.id) === String(value)
                        ? "var(--accent-glow)"
                        : "transparent",
                  }}
                  onMouseEnter={(ev) =>
                    (ev.currentTarget.style.background = "var(--surface2)")
                  }
                  onMouseLeave={(ev) =>
                    (ev.currentTarget.style.background =
                      String(e.id) === String(value)
                        ? "var(--accent-glow)"
                        : "transparent")
                  }
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, var(--accent), var(--accent-light, #818cf8))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {`${e.prenom?.[0] || ""}${e.nom?.[0] || ""}`.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--text)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {e.prenom} {e.nom}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      {e.matricule}
                      {e.filiere_nom && (
                        <span style={{ marginLeft: 8, color: "var(--accent)" }}>
                          {e.filiere_nom} · {e.niveau}
                        </span>
                      )}
                    </div>
                  </div>
                  {String(e.id) === String(value) && (
                    <Check
                      size={14}
                      style={{ color: "var(--success)", flexShrink: 0 }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSANT — Sélection de filière
   ══════════════════════════════════════════════════════════════════════════ */
function FiliereSelect({
  filieres,
  value,
  onChange,
  label = "Filière destination *",
  placeholder = "-- Choisir une filière --",
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            display: "block",
          }}
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: `1.5px solid ${value ? "var(--accent)" : "var(--border)"}`,
          background: "var(--surface)",
          color: value ? "var(--text)" : "var(--text-muted)",
          fontSize: 14,
          outline: "none",
          cursor: "pointer",
          appearance: "auto",
          transition: "border-color 0.15s",
          fontFamily: "var(--font-body)",
        }}
      >
        <option value="">{placeholder}</option>
        {filieres.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nom}
          </option>
        ))}
      </select>
      {filieres.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Chargement des filières...
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL — Nouvelle demande de transfert inter-établissement
   ══════════════════════════════════════════════════════════════════════════ */
function TransfertModal({ onClose, onSaved }) {
  const [etudiants, setEtudiants] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    etudiant_id: "",
    etablissement_origine: "",
    filiere_origine: "",
    filiere_destination_id: "",
    niveau: "L1",
    annee_universitaire: "2026-2027",
    motif: "",
  });

  useEffect(() => {
    // avec_inscription=true : seuls les étudiants ayant une inscription active sont retournés
    api.get("/etudiants?limit=500&page=1&avec_inscription=true").then((r) => {
      const raw = r.data.data || [];
      const seen = new Set();
      setEtudiants(raw.filter((e) => !seen.has(e.id) && seen.add(e.id)));
    });
    api.get("/filieres").then((r) => setFilieres(r.data.data || []));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isValid =
    form.etudiant_id &&
    form.etablissement_origine &&
    form.filiere_origine &&
    form.filiere_destination_id &&
    form.niveau &&
    form.annee_universitaire;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/transferts", form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Nouvelle demande de transfert" onClose={onClose} width={620}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: "8px 0",
        }}
      >
        {error && <Alert type="danger">{error}</Alert>}
        <FormSection title="Étudiant" icon={User}>
          <StudentSearchSelect
            etudiants={etudiants}
            value={form.etudiant_id}
            onChange={(id) => setForm((f) => ({ ...f, etudiant_id: id }))}
          />
        </FormSection>
        <FormSection title="Établissement d'origine" icon={Building2}>
          <FormRow>
            <Input
              label="Code établissement *"
              value={form.etablissement_origine}
              onChange={set("etablissement_origine")}
              placeholder="ex: TOL"
            />
            <Input
              label="Filière d'origine *"
              value={form.filiere_origine}
              onChange={set("filiere_origine")}
              placeholder="ex: Informatique"
            />
          </FormRow>
        </FormSection>
        <FormSection
          title="Destination dans notre établissement"
          icon={GraduationCap}
        >
          <FormRow>
            <FiliereSelect
              filieres={filieres}
              value={form.filiere_destination_id}
              onChange={(id) =>
                setForm((f) => ({ ...f, filiere_destination_id: id }))
              }
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
              >
                Niveau *
              </label>
              <select
                value={form.niveau}
                onChange={(e) =>
                  setForm((f) => ({ ...f, niveau: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1.5px solid var(--accent)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                {NIVEAUX.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </FormRow>
          <Input
            label="Année universitaire *"
            value={form.annee_universitaire}
            onChange={set("annee_universitaire")}
            placeholder="2026-2027"
          />
        </FormSection>
        <FormSection title="Motif" icon={FileText}>
          <textarea
            value={form.motif}
            onChange={set("motif")}
            placeholder="Motif du transfert (optionnel)"
            style={{
              width: "100%",
              minHeight: 80,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </FormSection>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Btn variant="ghost" onClick={onClose} icon={<X size={15} />}>
            Annuler
          </Btn>
          <Btn
            onClick={handleSubmit}
            loading={loading}
            disabled={!isValid}
            icon={<Plus size={15} />}
          >
            Créer la demande
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL — Changement de filière / niveau (transfert interne)
   ══════════════════════════════════════════════════════════════════════════ */
function ChangementFiliereModal({ onClose, onSaved }) {
  const [etudiants, setEtudiants] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingInscr, setLoadingInscr] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    etudiant_id: "",
    inscription_id: "",
    nouvelle_filiere_id: "",
    nouveau_niveau: "",
    annee_universitaire: "2026-2027",
    motif: "",
  });

  useEffect(() => {
    // avec_inscription=true : seuls les étudiants ayant une inscription active
    api.get("/etudiants?limit=500&page=1&avec_inscription=true").then((r) => {
      const raw = r.data.data || [];
      const seen = new Set();
      setEtudiants(raw.filter((e) => !seen.has(e.id) && seen.add(e.id)));
    });
    api.get("/filieres").then((r) => setFilieres(r.data.data || []));
  }, []);

  const handleSelectEtudiant = async (etudiantId) => {
    setForm((f) => ({
      ...f,
      etudiant_id: etudiantId,
      inscription_id: "",
      nouvelle_filiere_id: "",
      nouveau_niveau: "",
    }));
    if (!etudiantId) {
      setInscriptions([]);
      return;
    }
    setLoadingInscr(true);
    try {
      const { data } = await api.get(`/inscriptions?etudiant_id=${etudiantId}`);
      const actives = (data.data || []).filter((i) => i.statut === "actif");
      setInscriptions(actives);
    } catch {
      setInscriptions([]);
    } finally {
      setLoadingInscr(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isValid =
    form.etudiant_id &&
    form.inscription_id &&
    form.nouvelle_filiere_id &&
    form.nouveau_niveau &&
    form.annee_universitaire;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/transferts/changer-filiere", {
        etudiant_id: form.etudiant_id,
        inscription_id: form.inscription_id,
        nouvelle_filiere_id: form.nouvelle_filiere_id,
        nouveau_niveau: form.nouveau_niveau,
        annee_universitaire: form.annee_universitaire,
        motif: form.motif,
      });
      setSuccess(
        "Changement effectué avec succès. L'ancienne inscription est archivée.",
      );
      setTimeout(() => onSaved(), 1400);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du changement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Changement de filière / niveau" onClose={onClose} width={620}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: "8px 0",
        }}
      >
        <Alert type="warning" style={{ margin: 0 }}>
          Cette action <strong>archive l'inscription actuelle</strong> (statut →
          abandonné) et crée une <strong>nouvelle inscription active</strong>{" "}
          dans la filière choisie.
        </Alert>
        {error && <Alert type="danger">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
        <FormSection title="Étudiant concerné" icon={User}>
          <StudentSearchSelect
            etudiants={etudiants}
            value={form.etudiant_id}
            onChange={(id) => handleSelectEtudiant(id)}
          />
        </FormSection>
        {form.etudiant_id && (
          <FormSection title="Inscription actuelle à archiver" icon={History}>
            {loadingInscr ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 12,
                }}
              >
                <Spinner />
              </div>
            ) : inscriptions.length === 0 ? (
              <Alert type="warning">
                Aucune inscription active trouvée pour cet étudiant.
              </Alert>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Inscription active *
                </label>
                <select
                  value={form.inscription_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inscription_id: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${form.inscription_id ? "var(--accent)" : "var(--border)"}`,
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <option value="">
                    -- Choisir l'inscription à changer --
                  </option>
                  {inscriptions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.filiere_nom || `Filière #${i.filiere_id}`} — {i.niveau}{" "}
                      — {i.annee_universitaire}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </FormSection>
        )}
        {form.inscription_id && (
          <FormSection title="Nouvelle destination" icon={GraduationCap}>
            <FormRow>
              <FiliereSelect
                filieres={filieres}
                value={form.nouvelle_filiere_id}
                onChange={(id) =>
                  setForm((f) => ({ ...f, nouvelle_filiere_id: id }))
                }
                label="Nouvelle filière *"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Nouveau niveau *
                </label>
                <select
                  value={form.nouveau_niveau}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nouveau_niveau: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${form.nouveau_niveau ? "var(--accent)" : "var(--border)"}`,
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  <option value="">-- Niveau --</option>
                  {NIVEAUX.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </FormRow>
            <Input
              label="Année universitaire *"
              value={form.annee_universitaire}
              onChange={set("annee_universitaire")}
              placeholder="2026-2027"
            />
          </FormSection>
        )}
        <FormSection title="Motif du changement" icon={FileText}>
          <textarea
            value={form.motif}
            onChange={set("motif")}
            placeholder="Raison du changement de filière (optionnel)"
            style={{
              width: "100%",
              minHeight: 70,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </FormSection>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Btn variant="ghost" onClick={onClose} icon={<X size={15} />}>
            Annuler
          </Btn>
          <Btn
            onClick={handleSubmit}
            loading={loading}
            disabled={!isValid}
            icon={<RefreshCw size={15} />}
          >
            Effectuer le changement
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL — Changer le statut d'une inscription
   ══════════════════════════════════════════════════════════════════════════ */
function ChangementStatutModal({ onClose, onSaved }) {
  const [etudiants, setEtudiants] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [loadingInscr, setLoadingInscr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    etudiant_id: "",
    inscription_id: "",
    nouveau_statut: "",
    motif: "",
  });

  useEffect(() => {
    // avec_inscription=true : seuls les étudiants ayant une inscription active
    api.get("/etudiants?limit=500&page=1&avec_inscription=true").then((r) => {
      const raw = r.data.data || [];
      const seen = new Set();
      setEtudiants(raw.filter((e) => !seen.has(e.id) && seen.add(e.id)));
    });
  }, []);

  const handleSelectEtudiant = async (etudiantId) => {
    setForm((f) => ({
      ...f,
      etudiant_id: etudiantId,
      inscription_id: "",
      nouveau_statut: "",
    }));
    if (!etudiantId) {
      setInscriptions([]);
      return;
    }
    setLoadingInscr(true);
    try {
      const { data } = await api.get(`/inscriptions?etudiant_id=${etudiantId}`);
      setInscriptions(data.data || []);
    } catch {
      setInscriptions([]);
    } finally {
      setLoadingInscr(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const inscriptionSelectionnee = inscriptions.find(
    (i) => String(i.id) === String(form.inscription_id),
  );
  const isValid =
    form.inscription_id &&
    form.nouveau_statut &&
    form.nouveau_statut !== inscriptionSelectionnee?.statut;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await api.put(`/inscriptions/${form.inscription_id}`, {
        statut: form.nouveau_statut,
        motif_changement: form.motif || undefined,
      });
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors du changement de statut",
      );
    } finally {
      setLoading(false);
    }
  };

  const statutColors = {
    actif: "success",
    suspendu: "warning",
    diplome: "accent",
    abandonne: "danger",
  };

  return (
    <Modal
      title="Changer le statut d'une inscription"
      onClose={onClose}
      width={560}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: "8px 0",
        }}
      >
        {error && <Alert type="danger">{error}</Alert>}
        <FormSection title="Étudiant" icon={User}>
          <StudentSearchSelect
            etudiants={etudiants}
            value={form.etudiant_id}
            onChange={(id) => handleSelectEtudiant(id)}
          />
        </FormSection>
        {form.etudiant_id && (
          <FormSection title="Inscription à modifier" icon={ClipboardIcon}>
            {loadingInscr ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 12,
                }}
              >
                <Spinner />
              </div>
            ) : inscriptions.length === 0 ? (
              <Alert type="warning">Aucune inscription trouvée.</Alert>
            ) : (
              <>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    Inscription *
                  </label>
                  <select
                    value={form.inscription_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, inscription_id: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: `1.5px solid ${form.inscription_id ? "var(--accent)" : "var(--border)"}`,
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: 14,
                      outline: "none",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <option value="">-- Choisir une inscription --</option>
                    {inscriptions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.filiere_nom || `Filière #${i.filiere_id}`} —{" "}
                        {i.niveau} — {i.annee_universitaire} [{i.statut}]
                      </option>
                    ))}
                  </select>
                </div>
                {inscriptionSelectionnee && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Statut actuel :
                    </span>
                    <Badge
                      variant={
                        statutColors[inscriptionSelectionnee.statut] ||
                        "default"
                      }
                    >
                      {inscriptionSelectionnee.statut}
                    </Badge>
                  </div>
                )}
                {form.inscription_id && (
                  <Select
                    label="Nouveau statut *"
                    value={form.nouveau_statut}
                    onChange={set("nouveau_statut")}
                    style={{ marginTop: 10 }}
                  >
                    <option value="">-- Choisir --</option>
                    {STATUT_INSCRIPTION.filter(
                      (s) => s !== inscriptionSelectionnee?.statut,
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </Select>
                )}
              </>
            )}
          </FormSection>
        )}
        <FormSection title="Motif (optionnel)" icon={FileText}>
          <textarea
            value={form.motif}
            onChange={set("motif")}
            placeholder="Raison du changement de statut..."
            style={{
              width: "100%",
              minHeight: 60,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </FormSection>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Btn variant="ghost" onClick={onClose} icon={<X size={15} />}>
            Annuler
          </Btn>
          <Btn
            onClick={handleSubmit}
            loading={loading}
            disabled={!isValid}
            icon={<ToggleLeft size={15} />}
          >
            Appliquer le changement
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function ClipboardIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL — Historique des inscriptions d'un étudiant
   ══════════════════════════════════════════════════════════════════════════ */
function HistoriqueModal({ onClose }) {
  const [etudiants, setEtudiants] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [etudiantChoisi, setEtudiantChoisi] = useState(null);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    api.get("/etudiants?limit=500&page=1").then((r) => {
      const raw = r.data.data || [];
      const seen = new Set();
      setEtudiants(raw.filter((e) => !seen.has(e.id) && seen.add(e.id)));
    });
  }, []);

  const handleSelectEtudiant = async (etudiantId) => {
    setSelectedId(etudiantId);
    const e = etudiants.find((x) => String(x.id) === String(etudiantId));
    setEtudiantChoisi(e || null);
    if (!etudiantId) {
      setInscriptions([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/inscriptions?etudiant_id=${etudiantId}`);
      setInscriptions(data.data || []);
    } catch {
      setInscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const statutColors = {
    actif: "success",
    suspendu: "warning",
    diplome: "accent",
    abandonne: "danger",
  };

  return (
    <Modal title="Historique des inscriptions" onClose={onClose} width={700}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "8px 0",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <StudentSearchSelect
              etudiants={etudiants}
              value={selectedId}
              onChange={(id) => handleSelectEtudiant(id)}
              label=""
            />
          </div>
        </div>
        {!selectedId && (
          <EmptyState
            icon={History}
            title="Sélectionner un étudiant"
            description="Choisissez un étudiant pour voir son historique d'inscriptions."
          />
        )}
        {selectedId && loading && (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 24 }}
          >
            <Spinner />
          </div>
        )}
        {selectedId && !loading && (
          <>
            {etudiantChoisi && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-light))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {`${etudiantChoisi.prenom?.[0] || ""}${etudiantChoisi.nom?.[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>
                    {etudiantChoisi.prenom} {etudiantChoisi.nom}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    {etudiantChoisi.matricule}
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: "auto",
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  {inscriptions.length} inscription
                  {inscriptions.length > 1 ? "s" : ""}
                </div>
              </div>
            )}
            {inscriptions.length === 0 ? (
              <EmptyState
                icon={History}
                title="Aucune inscription"
                description="Cet étudiant n'a aucune inscription enregistrée."
              />
            ) : (
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                <Table
                  headers={[
                    "Filière",
                    "Niveau",
                    "Année",
                    "Statut",
                    "Date inscription",
                  ]}
                >
                  {inscriptions.map((i) => (
                    <Tr key={i.id}>
                      <Td>
                        <span style={{ fontWeight: 500 }}>
                          {i.filiere_nom || `#${i.filiere_id}`}
                        </span>
                      </Td>
                      <Td>
                        <Badge variant="accent">{i.niveau}</Badge>
                      </Td>
                      <Td>{i.annee_universitaire}</Td>
                      <Td>
                        <Badge variant={statutColors[i.statut] || "default"}>
                          {i.statut}
                        </Badge>
                      </Td>
                      <Td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {i.date_inscription
                          ? new Date(i.date_inscription).toLocaleDateString(
                              "fr-FR",
                            )
                          : "—"}
                      </Td>
                    </Tr>
                  ))}
                </Table>
              </div>
            )}
          </>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            Fermer
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL — Refus d'un transfert
   ══════════════════════════════════════════════════════════════════════════ */
function RefusModal({ transfert, onClose, onSaved }) {
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRefuser = async () => {
    if (!motif.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.put(`/transferts/${transfert.id}/refuser`, {
        motif_refus: motif,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du refus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Refuser le transfert" onClose={onClose} width={480}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "8px 0",
        }}
      >
        <Alert type="warning">
          Vous allez refuser le transfert de{" "}
          <strong>
            {transfert.etudiant_prenom} {transfert.etudiant_nom}
          </strong>
        </Alert>
        {error && <Alert type="danger">{error}</Alert>}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Motif du refus *
          </label>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Expliquez la raison du refus..."
            style={{
              width: "100%",
              minHeight: 100,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            Annuler
          </Btn>
          <Btn
            variant="danger"
            onClick={handleRefuser}
            loading={loading}
            disabled={!motif.trim()}
            icon={<X size={15} />}
          >
            Confirmer le refus
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL — Annulation d'un transfert déjà traité (admin seulement)
   ══════════════════════════════════════════════════════════════════════════ */
function AnnulationModal({ transfert, onClose, onSaved }) {
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnnuler = async () => {
    setLoading(true);
    setError("");
    try {
      await api.put(`/transferts/${transfert.id}/annuler`, {
        motif_annulation: motif,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Annuler / Corriger ce transfert"
      onClose={onClose}
      width={480}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "8px 0",
        }}
      >
        <Alert type="danger">
          Action <strong>administrateur uniquement</strong>. L'annulation remet
          le transfert à l'état « en attente » pour correction.
        </Alert>
        {error && <Alert type="danger">{error}</Alert>}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Motif de l'annulation (optionnel)
          </label>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Raison de l'annulation ou correction..."
            style={{
              width: "100%",
              minHeight: 80,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            Annuler
          </Btn>
          <Btn
            variant="danger"
            onClick={handleAnnuler}
            loading={loading}
            icon={<AlertCircle size={15} />}
          >
            Confirmer l'annulation
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ══════════════════════════════════════════════════════════════════════════ */
export default function TransfertPage() {
  const { user } = useAuth();
  const notify = useNotification();

  const [transferts, setTransferts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [modal, setModal] = useState(null);
  const [refusModal, setRefusModal] = useState(null);
  const [annulModal, setAnnulModal] = useState(null);
  const [showActions, setShowActions] = useState(false);

  // FIX 3: Tracker les IDs en cours de traitement pour bloquer les doubles clics
  // et empêcher un second admin de cliquer pendant qu'un premier traite.
  const [processingIds, setProcessingIds] = useState(new Set());

  const isAdmin = user?.role === "administrateur";
  const canEdit = ["administrateur", "secretaire"].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/transferts");
      setTransferts(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ─────────────────────────────────────────────────────────────────────
     POLLING DOUBLE — Détection des changements en temps réel (toutes machines)

     ┌─────────────────────────────────────────────────────────────┐
     │  SECRÉTAIRE reçoit :                                        │
     │    • transfert:accepte  → quand Admin accepte               │
     │    • transfert:refuse   → quand Admin refuse                 │
     │                                                             │
     │  ADMINISTRATEUR reçoit :                                    │
     │    • transfert:nouvelle_demande → quand Secrétaire crée     │
     │      une nouvelle demande (comme une notif Facebook)        │
     └─────────────────────────────────────────────────────────────┘

     Toutes les 6 secondes, on compare la liste courante avec celle
     en mémoire (snapshot via useRef) pour détecter :
       - Nouveaux transferts apparus (→ notification Admin)
       - Statuts changés (→ notification Secrétaire)
  ───────────────────────────────────────────────────────────────────── */
  const transfertsRef = useRef([]);
  transfertsRef.current = transferts;

  useEffect(() => {
    // Les deux rôles reçoivent des notifications, mais pas les mêmes
    const role = user?.role;
    if (!["administrateur", "secretaire"].includes(role)) return;

    const POLL_INTERVAL = 6000; // 6 secondes — réactif sans surcharger le serveur

    const poll = async () => {
      try {
        const { data } = await api.get("/transferts");
        const nouveaux = data.data || [];
        const anciens = transfertsRef.current;

        // ── CAS 1 : ADMINISTRATEUR ──────────────────────────────────────
        // Détecter les nouvelles demandes créées par le Secrétaire
        // Un transfert "nouveau" = présent dans nouveaux mais absent de anciens
        if (role === "administrateur") {
          nouveaux.forEach((nouveau) => {
            const existeDeja = anciens.find((a) => a.id === nouveau.id);
            if (!existeDeja && nouveau.statut === "en_attente") {
              // Nouvelle demande détectée → notifier l'Admin immédiatement
              const prenom = nouveau.etudiant_prenom || "";
              const nom = nouveau.etudiant_nom || "";
              const filiere = nouveau.filiere_destination || "";
              const niveau = nouveau.niveau || "";

              notify.info(
                `🔔 Nouvelle demande de transfert — ${prenom} ${nom} souhaite rejoindre ${filiere} (${niveau}). Action requise.`,
                9000,
              );

              // Animer la cloche + ajouter dans le panneau de notifications
              window.dispatchEvent(
                new CustomEvent("transfert:nouvelle_demande", {
                  detail: {
                    etudiantPrenom: prenom,
                    etudiantNom: nom,
                    filiere,
                    niveau,
                    transfertId: nouveau.id,
                  },
                }),
              );
            }
          });
        }

        // ── CAS 2 : SECRÉTAIRE ──────────────────────────────────────────
        // Détecter les décisions de l'Admin (accepté ou refusé)
        if (role === "secretaire") {
          nouveaux.forEach((nouveau) => {
            const ancien = anciens.find((a) => a.id === nouveau.id);
            if (!ancien) return; // nouvelle entrée, pas une décision

            // Transition en_attente → accepte
            if (
              ancien.statut === "en_attente" &&
              nouveau.statut === "accepte"
            ) {
              const prenom = nouveau.etudiant_prenom || "";
              const nom = nouveau.etudiant_nom || "";
              notify.success(
                `✅ Transfert accepté — La demande de ${prenom} ${nom} a été acceptée par l'administrateur.`,
                7000,
              );
              window.dispatchEvent(
                new CustomEvent("transfert:accepte", {
                  detail: {
                    etudiantId: nouveau.etudiant_id,
                    etudiantPrenom: prenom,
                    etudiantNom: nom,
                  },
                }),
              );
            }

            // Transition en_attente → refuse
            if (ancien.statut === "en_attente" && nouveau.statut === "refuse") {
              const prenom = nouveau.etudiant_prenom || "";
              const nom = nouveau.etudiant_nom || "";
              notify.error(
                `🚫 Transfert refusé — La demande de ${prenom} ${nom} a été refusée par l'administrateur.`,
                7000,
              );
              window.dispatchEvent(
                new CustomEvent("transfert:refuse", {
                  detail: {
                    etudiantId: nouveau.etudiant_id,
                    etudiantPrenom: prenom,
                    etudiantNom: nom,
                  },
                }),
              );
            }
          });
        }

        // Mettre à jour la liste silencieusement (sans spinner)
        setTransferts(nouveaux);
      } catch {
        // Erreur réseau silencieuse — on réessaiera au prochain cycle
      }
    };

    const intervalId = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [user?.role, notify]);

  /* ══════════════════════════════════════════════════════════════════════════
     CORRECTION BUG MATRICULE - handleAccepter corrigé

     PROBLEME : Si on accepte un transfert, le matricule devient "2006 H-TOL".
     Si on accepte à nouveau le même transfert (bug), on obtient "2007 H-2006 H-TOL"

     SOLUTION : Extraire UNIQUEMENT la première année (4 chiffres) du matricule
     original de l'étudiant, IGNORER toute corruption existante.

     Exemple:
     - "2006 H-F" → extraire "2006"
     - "2007 H-2006 H-TOL" (corrompu) → extraire "2007"? NON! On prend le matricule
       original depuis la base qui est "2006 H-F" grâce au snapshot
     ══════════════════════════════════════════════════════════════════════════ */
  const handleAccepter = async (id, etudiantPrenom, etudiantNom) => {
    // Vérifier que cet ID n'est pas déjà en cours de traitement
    if (processingIds.has(id)) return;

    setProcessingIds((prev) => new Set([...prev, id]));
    try {
      // 🔧 CORRECTION: Récupérer le transfert pour avoir le bon matricule original
      const transfertActuel = transferts.find((t) => t.id === id);

      if (!transfertActuel) {
        notify.error("❌ Transfert introuvable");
        return;
      }

      // Extraire l'année (4 premiers chiffres) du matricule original
      // Le matricule original est stocké dans transfert.matricule (snapshot au moment de la demande)
      let matriculeOriginal = transfertActuel.matricule || "";

      // Méthode robuste: extraire le premier nombre à 4 chiffres du début
      // Cela ignore toute corruption comme "2007 H-2006 H-TOL" et prend le premier bloc
      const matchAnnee = matriculeOriginal.match(/^(\d{4})/);
      let annee = "2006"; // fallback

      if (matchAnnee) {
        annee = matchAnnee[1];
      } else {
        // Fallback: prendre ce qu'il y a avant le premier espace
        const avantEspace = matriculeOriginal.split(" ")[0];
        if (avantEspace && /^\d+$/.test(avantEspace)) {
          annee = avantEspace;
        }
      }

      // Déterminer le code établissement de destination
      // Soit depuis le transfert, soit depuis la filière destination
      let codeEtab = transfertActuel.etablissement_destination || "";
      if (!codeEtab && transfertActuel.filiere_destination) {
        // Extraire les 3 premières lettres de la filière destination
        codeEtab = transfertActuel.filiere_destination
          .substring(0, 3)
          .toUpperCase();
      }
      if (!codeEtab) codeEtab = "TOL"; // fallback par défaut

      // Construire le NOUVEAU MATRICULE propre
      // Format: "2006 H-TOL" au lieu de "2007 H-2006 H-TOL"
      const nouveauMatricule = `${annee} H-${codeEtab}`;

      console.log(
        `[DEBUG] Ancien matricule: ${matriculeOriginal} → Nouveau: ${nouveauMatricule}`,
      );

      // Envoyer la requête avec le matricule corrigé
      // Option 1: Passer le matricule dans le body
      await api.put(`/transferts/${id}/accepter`, {
        nouveau_matricule: nouveauMatricule,
      });

      // Option alternative (si votre backend ne supporte pas le body):
      // await api.put(`/transferts/${id}/accepter?nouveau_matricule=${encodeURIComponent(nouveauMatricule)}`);

      // Notification de succès avec le nouveau matricule
      notify.success(
        `✅ Transfert accepté — ${etudiantPrenom} ${etudiantNom} a été transféré avec succès. Nouveau matricule : ${nouveauMatricule}`,
        6000,
      );

      // Émettre un événement global pour que EtudiantsPage retire immédiatement l'étudiant
      window.dispatchEvent(
        new CustomEvent("transfert:accepte", {
          detail: {
            etudiantId: id,
            etudiantPrenom,
            etudiantNom,
            nouveauMatricule,
          },
        }),
      );

      // Recharge la liste des transferts
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de l'acceptation";

      // Vérifier si le transfert a déjà été traité par un autre admin (HTTP 409)
      if (err.response?.status === 409) {
        notify.warning(
          `⚠️ Ce transfert a déjà été traité par un autre administrateur.`,
        );
        load(); // Rafraîchir pour refléter l'état réel
      } else {
        notify.error(`❌ ${msg}`);
      }
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /* ─────────────────────────────────────────────────────────────────────
     FIX 2 : Notification après refus
  ───────────────────────────────────────────────────────────────────── */
  const handleAfterRefus = (transfert) => {
    setRefusModal(null);
    // Émettre l'événement global pour la cloche notification
    window.dispatchEvent(
      new CustomEvent("transfert:refuse", {
        detail: {
          etudiantId: transfert.id,
          etudiantPrenom: transfert.etudiant_prenom,
          etudiantNom: transfert.etudiant_nom,
        },
      }),
    );
    notify.error(
      `🚫 Transfert refusé — La demande de ${transfert.etudiant_prenom} ${transfert.etudiant_nom} a été refusée.`,
      5000,
    );
    load();
  };

  // Filtres combinés
  const filtered = transferts.filter((t) => {
    const matchSearch =
      `${t.etudiant_nom} ${t.etudiant_prenom} ${t.matricule} ${t.etablissement_origine}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatut = filtreStatut === "tous" || t.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  // Stats rapides
  const stats = {
    total: transferts.length,
    en_attente: transferts.filter((t) => t.statut === "en_attente").length,
    accepte: transferts.filter((t) => t.statut === "accepte").length,
    refuse: transferts.filter((t) => t.statut === "refuse").length,
  };

  return (
    <>
      {/* ── Cloche notification transferts (fixée en haut à droite) ── */}
      <NotificationCloche />

      <div
        className="page-enter"
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
      >
        {/* ── En-tête ── */}
        <PageHeader
          title="Transferts"
          subtitle={`${stats.total} demande${stats.total > 1 ? "s" : ""}`}
          action={
            canEdit && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <Btn
                  onClick={() => setModal("create")}
                  icon={<Plus size={16} />}
                >
                  Nouvelle demande
                </Btn>
                <div style={{ position: "relative" }}>
                  <Btn
                    variant="ghost"
                    onClick={() => setShowActions((v) => !v)}
                    icon={
                      showActions ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      )
                    }
                  >
                    Autres actions
                  </Btn>
                  {showActions && (
                    <>
                      <div
                        onClick={() => setShowActions(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 199 }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          right: 0,
                          zIndex: 200,
                          background: "var(--surface)",
                          border: "1.5px solid var(--border)",
                          borderRadius: 12,
                          boxShadow: "var(--shadow-modal)",
                          minWidth: 230,
                          overflow: "hidden",
                          animation: "fadeIn 0.12s ease",
                        }}
                      >
                        {[
                          {
                            icon: RefreshCw,
                            label: "Changer filière / niveau",
                            action: () => {
                              setShowActions(false);
                              setModal("changer_filiere");
                            },
                          },
                          {
                            icon: ToggleLeft,
                            label: "Changer statut inscription",
                            action: () => {
                              setShowActions(false);
                              setModal("changer_statut");
                            },
                          },
                          {
                            icon: History,
                            label: "Voir historique étudiant",
                            action: () => {
                              setShowActions(false);
                              setModal("historique");
                            },
                          },
                        ].map(({ icon: Icon, label, action }) => (
                          <button
                            key={label}
                            onClick={action}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              padding: "11px 16px",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text)",
                              fontSize: 14,
                              textAlign: "left",
                              transition: "background 0.12s",
                              fontFamily: "var(--font-body)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--surface2)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Icon
                              size={15}
                              style={{ color: "var(--accent)", flexShrink: 0 }}
                            />
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          }
        />

        {/* ── Cartes statistiques ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            {
              label: "Total",
              value: stats.total,
              color: "var(--accent)",
              bg: "var(--accent-glow)",
            },
            {
              label: "En attente",
              value: stats.en_attente,
              color: "var(--warning)",
              bg: "rgba(245,158,11,0.1)",
            },
            {
              label: "Acceptés",
              value: stats.accepte,
              color: "var(--success)",
              bg: "rgba(34,197,94,0.1)",
            },
            {
              label: "Refusés",
              value: stats.refuse,
              color: "var(--danger)",
              bg: "rgba(239,68,68,0.1)",
            },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              style={{
                padding: "16px 20px",
                background: "var(--surface)",
                border: `1.5px solid ${color}30`,
                borderRadius: 12,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color,
                  fontFamily: "var(--font-display)",
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Barre de recherche + filtre statut ── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{ position: "relative", flex: "1 1 300px", maxWidth: 460 }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par étudiant, matricule, établissement..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                borderRadius: 40,
                color: "var(--text)",
                padding: "11px 18px 11px 44px",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["tous", "en_attente", "accepte", "refuse"].map((s) => (
              <button
                key={s}
                onClick={() => setFiltreStatut(s)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 20,
                  border: "1.5px solid var(--border)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                  background:
                    filtreStatut === s ? "var(--accent)" : "var(--surface)",
                  color: filtreStatut === s ? "#fff" : "var(--text-muted)",
                  borderColor:
                    filtreStatut === s ? "var(--accent)" : "var(--border)",
                  fontWeight: filtreStatut === s ? 600 : 400,
                }}
              >
                {s === "tous" ? "Tous" : STATUT_CONFIG[s]?.label || s}
                {s !== "tous" && (
                  <span style={{ marginLeft: 5, opacity: 0.8 }}>
                    ({stats[s] || 0})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tableau ── */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            border: "2px solid var(--border)",
            overflow: "hidden",
            boxShadow: "var(--shadow)",
          }}
        >
          <Table
            headers={[
              "Matricule",
              "Étudiant",
              "Origine",
              "Destination",
              "Niveau",
              "Année",
              "Statut",
              "Actions",
            ]}
          >
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
                  <Spinner />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon={ArrowLeftRight}
                    title="Aucun transfert"
                    description={
                      search || filtreStatut !== "tous"
                        ? "Aucun résultat pour ces filtres."
                        : "Aucune demande de transfert pour le moment."
                    }
                  />
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const statut =
                  STATUT_CONFIG[t.statut] || STATUT_CONFIG.en_attente;
                const isProcessing = processingIds.has(t.id);
                return (
                  <Tr key={t.id}>
                    <Td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--accent-light)",
                          background: "rgba(99,102,241,0.08)",
                          padding: "3px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {t.matricule || "—"}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ fontWeight: 600 }}>
                        {t.etudiant_prenom} {t.etudiant_nom}
                      </div>
                    </Td>
                    <Td>
                      <div style={{ fontWeight: 500 }}>
                        {t.etablissement_origine}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {t.filiere_origine}
                      </div>
                    </Td>
                    <Td>{t.filiere_destination}</Td>
                    <Td>
                      <Badge variant="accent">{t.niveau}</Badge>
                    </Td>
                    <Td>{t.annee_universitaire}</Td>
                    <Td>
                      <Badge variant={statut.color}>{statut.label}</Badge>
                    </Td>
                    <Td>
                      {t.statut === "en_attente" && (
                        <>
                          {/* ── ADMINISTRATEUR : Accepter + Refuser ── */}
                          {isAdmin && (
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              <Btn
                                small
                                variant="success"
                                icon={
                                  isProcessing ? (
                                    <Spinner size={12} />
                                  ) : (
                                    <Check size={13} />
                                  )
                                }
                                disabled={isProcessing}
                                onClick={() =>
                                  handleAccepter(
                                    t.id,
                                    t.etudiant_prenom,
                                    t.etudiant_nom,
                                  )
                                }
                              >
                                {isProcessing ? "..." : "Accepter"}
                              </Btn>
                              <Btn
                                small
                                variant="danger"
                                icon={<X size={13} />}
                                disabled={isProcessing}
                                onClick={() => setRefusModal(t)}
                              >
                                Refuser
                              </Btn>
                            </div>
                          )}
                          {/* ── SECRÉTAIRE : message uniquement, pas de bouton ── */}
                          {!isAdmin && canEdit && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--warning)",
                                fontStyle: "italic",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              ⏳ En attente de validation admin
                            </span>
                          )}
                        </>
                      )}
                      {t.statut !== "en_attente" && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <span
                            style={{ fontSize: 12, color: "var(--text-muted)" }}
                          >
                            {t.date_traitement
                              ? new Date(t.date_traitement).toLocaleDateString(
                                  "fr-FR",
                                )
                              : "—"}
                          </span>
                          {isAdmin && (
                            <Btn
                              small
                              variant="ghost"
                              icon={<AlertCircle size={12} />}
                              onClick={() => setAnnulModal(t)}
                              style={{ fontSize: 11, padding: "3px 8px" }}
                            >
                              Annuler
                            </Btn>
                          )}
                        </div>
                      )}
                    </Td>
                  </Tr>
                );
              })
            )}
          </Table>
        </div>

        {/* ── Note rôle secrétaire ── */}
        {user?.role === "secretaire" && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle
              size={15}
              style={{ color: "var(--success)", flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              En tant que secrétaire, vous pouvez initier des demandes de refus
              et changer filière/statut, mais{" "}
              <strong>seul un administrateur peut accepter</strong> un transfert
              inter-établissement.
            </span>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {modal === "create" && (
        <TransfertModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal === "changer_filiere" && (
        <ChangementFiliereModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal === "changer_statut" && (
        <ChangementStatutModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal === "historique" && (
        <HistoriqueModal onClose={() => setModal(null)} />
      )}
      {refusModal && (
        <RefusModal
          transfert={refusModal}
          onClose={() => setRefusModal(null)}
          onSaved={() => handleAfterRefus(refusModal)}
        />
      )}
      {annulModal && (
        <AnnulationModal
          transfert={annulModal}
          onClose={() => setAnnulModal(null)}
          onSaved={() => {
            setAnnulModal(null);
            load();
          }}
        />
      )}
    </>
  );
}
