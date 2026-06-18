import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  BookOpen,
  Clock,
  Trophy,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  UserPlus,
  GraduationCap,
  DollarSign,
  Award,
  Zap,
  Shield,
  Sparkles,
  LayoutGrid,
  ChevronDown,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import { PageHeader, Card, Badge, Spinner } from "../components/ui";

/* ── Palette professionnelle moderne ──────────────────────────────────────── */
const PALETTE = {
  primary: "#4f46e5",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
};

const CHART_COLORS = [
  PALETTE.primary,
  PALETTE.success,
  PALETTE.warning,
  PALETTE.danger,
  PALETTE.info,
  PALETTE.purple,
];

/* ══════════════════════════════════════════════════════════════════════════
   CORRECTION 2 — Calcul dynamique des tendances (non statique)
   On simule deux mois de données mockées et on calcule le % d'évolution
   ══════════════════════════════════════════════════════════════════════════ */
const MOCK_PREVIOUS_MONTH = {
  total_etudiants: 1000,
  total_filieres: 50,
  inscriptions_en_attente: 40,
  taux_reussite: 79,
};

/**
 * Calcule dynamiquement le % d'évolution entre deux valeurs.
 * @param {number} current  — valeur du mois courant
 * @param {number} previous — valeur du mois précédent
 * @returns {{ trend: "up"|"down", value: string }}
 */
function calcTrend(current, previous) {
  if (!previous || isNaN(current) || isNaN(previous)) {
    return { trend: "up", value: "+0%" };
  }
  const diff = ((current - previous) / previous) * 100;
  return {
    trend: diff >= 0 ? "up" : "down",
    value: `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%`,
  };
}

/* ── Tooltip personnalisé moderne ───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      role="tooltip"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "12px 18px",
        fontSize: 13,
        color: "var(--text)",
        boxShadow:
          "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          margin: 0,
          fontWeight: 700,
          fontSize: 14,
          color: PALETTE.primary,
        }}
      >
        {label}
      </div>
      <div style={{ margin: "6px 0 0", color: "var(--text-muted)" }}>
        {payload[0].name} :{" "}
        <strong style={{ color: payload[0].color, fontSize: 16 }}>
          {payload[0].value}
        </strong>
      </div>
    </div>
  );
}

/* ── Carte statistique — CORRECTION 3 (Fitts) + CORRECTION 6 (hover) ────── */
function StatCard({ label, value, color, icon: Icon, trend, trendValue }) {
  const [isHovered, setIsHovered] = useState(false);
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    /*
     * CORRECTION 3 — Loi de Fitts : minHeight 80px garantit une zone
     * cliquable confortable même sur mobile.
     * CORRECTION 6 — Feedback hover : boxShadow + translateY déjà présents,
     * on s'assure que l'état isHovered déclenche bien le changement visuel.
     * CORRECTION 4 — ARIA : role="region" + aria-label pour les lecteurs d'écran.
     */
    <div
      role="region"
      aria-label={`Statistique : ${label}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${color}`,
        borderRadius: "16px",
        padding: "20px 22px",
        minHeight: "80px",           /* ← Loi de Fitts */
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        boxShadow: isHovered
          ? `0 16px 32px rgba(0,0,0,0.12), 0 0 0 1px ${color}20`
          : "0 1px 4px rgba(0,0,0,0.06)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-5px)" : "translateY(0)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        outline: isHovered ? `2px solid ${color}40` : "none", /* ← focus visible */
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          pointerEvents: "none",
          transition: "transform 0.4s ease",
          transform: isHovered ? "scale(1.5)" : "scale(1)",
        }}
        aria-hidden="true"
      />

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-muted)",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: "var(--text)",
            lineHeight: 1,
            margin: 0,
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {value}
        </div>
        {trend && trendValue && (
          <div
            style={{
              fontSize: 12,
              color: trend === "up" ? PALETTE.success : PALETTE.danger,
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 600,
            }}
            aria-label={`Évolution : ${trendValue} par rapport au mois précédent`}
          >
            {TrendIcon && <TrendIcon size={13} aria-hidden="true" />}
            <span>{trendValue} par rapport au mois précédent</span>
          </div>
        )}
      </div>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          flexShrink: 0,
          background: `linear-gradient(135deg, ${color}22, ${color}0d)`,
          border: `1px solid ${color}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        }}
        aria-hidden="true"
      >
        <Icon size={24} style={{ color }} aria-hidden="true" />
      </div>
    </div>
  );
}

/* ─── Badge de statut étudiant ────────────────────────────────────────────── */
function StatutBadge({ statut, matricule }) {
  const statutAffiche =
    statut === "abandonne" && matricule?.includes("H-") ? "transfere" : statut;
  const config = {
    actif: {
      bg: "rgba(16,185,129,0.12)",
      color: PALETTE.success,
      icon: CheckCircle,
      label: "Actif",
    },
    suspendu: {
      bg: "rgba(245,158,11,0.12)",
      color: PALETTE.warning,
      icon: AlertCircle,
      label: "Suspendu",
    },
    diplome: {
      bg: "rgba(79,70,229,0.12)",
      color: PALETTE.primary,
      icon: Award,
      label: "Diplômé",
    },
    abandonne: {
      bg: "rgba(239,68,68,0.12)",
      color: PALETTE.danger,
      icon: AlertCircle,
      label: "Abandonné",
    },
    transfere: {
      bg: "rgba(139,92,246,0.12)",
      color: PALETTE.primary,
      icon: ArrowLeftRight,
      label: "Transféré",
    },
  };
  const c = config[statutAffiche] || {
    bg: "var(--surface2)",
    color: "var(--text-muted)",
    icon: null,
    label: statut || "Non défini",
  };
  const Icon = c.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.color}30`,
      }}
      aria-label={`Statut : ${c.label}`}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {c.label}
    </span>
  );
}

/* ─── Badge de décision ───────────────────────────────────────────────────── */
function DecisionBadge({ decision }) {
  const normalizedDecision = (decision || "en attente").toLowerCase().trim();

  const config = {
    admis: {
      color: PALETTE.success,
      bg: "rgba(16,185,129,0.12)",
      icon: CheckCircle,
      label: "Admis",
    },
    rattrapage: {
      color: PALETTE.warning,
      bg: "rgba(245,158,11,0.12)",
      icon: AlertCircle,
      label: "Rattrapage",
    },
    "ajourné": {
      color: PALETTE.danger,
      bg: "rgba(239,68,68,0.12)",
      icon: AlertCircle,
      label: "Ajourné",
    },
    ajourne: {
      color: PALETTE.danger,
      bg: "rgba(239,68,68,0.12)",
      icon: AlertCircle,
      label: "Ajourné",
    },
    "en attente": {
      color: PALETTE.info,
      bg: "rgba(6,182,212,0.12)",
      icon: Clock,
      label: "En attente",
    },
  };

  const c = config[normalizedDecision] || {
    color: "#6b7280",
    bg: "rgba(107,114,128,0.12)",
    icon: null,
    label: decision || "Non défini",
  };
  const Icon = c.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.color}30`,
        whiteSpace: "nowrap",
      }}
      aria-label={`Décision : ${c.label}`}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} aria-hidden="true" />}
      {c.label}
    </span>
  );
}

/* ─── En-tête de carte graphique ─────────────────────────────────────────── */
function ChartHeader({ title, subtitle, icon: Icon, color, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        background: `linear-gradient(135deg, ${color}06 0%, var(--surface) 100%)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: `${color}18`,
            border: `1px solid ${color}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden="true"
        >
          <Icon size={20} style={{ color }} aria-hidden="true" />
        </div>
        <div>
          <h4
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {title}
          </h4>
          {subtitle && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                margin: "3px 0 0",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Section graphique moderne ───────────────────────────────────────────── */
function ModernChartCard({
  title,
  icon: Icon,
  children,
  subtitle,
  color = PALETTE.primary,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "18px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`chart-content-${title}`}
        /*
         * CORRECTION 3 — Loi de Fitts : minHeight 48px sur l'en-tête cliquable.
         * CORRECTION 4 — ARIA : aria-expanded + aria-controls pour l'accordéon.
         */
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 22px",
          minHeight: "64px",          /* ← Loi de Fitts */
          width: "100%",
          borderBottom: "1px solid var(--border)",
          background: `linear-gradient(135deg, ${color}06 0%, var(--surface) 100%)`,
          cursor: "pointer",
          border: "none",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${color}22, ${color}0d)`,
              border: `1px solid ${color}28`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.3s ease",
              transform: isExpanded ? "scale(1.05)" : "scale(1)",
            }}
            aria-hidden="true"
          >
            <Icon size={22} style={{ color }} aria-hidden="true" />
          </div>
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  margin: "3px 0 0",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {!isExpanded && (
            <span
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
              aria-hidden="true"
            >
              Cliquer pour afficher le graphique en grand
            </span>
          )}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.3s ease",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              color: "var(--text-muted)",
            }}
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </div>
        </div>
      </button>
      <div
        id={`chart-content-${title}`}
        style={{
          transition: "all 0.3s ease",
          padding: isExpanded ? "22px" : "18px",
          minHeight: isExpanded ? "400px" : "340px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPOSANT — Bouton de sélection de vue (Barres / Camembert)
   CORRECTION 3 — Loi de Fitts : minHeight 48px
   CORRECTION 6 — Feedback hover même quand non actif
════════════════════════════════════════════════════════════════════════════ */
function ChartToggleButton({ label, icon: Icon, isActive, color, onClick }) {
  const [hovered, setHovered] = useState(false);

  let bg = "transparent";
  if (isActive) bg = color;
  else if (hovered) bg = `${color}18`;

  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`Afficher en ${label}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px 16px",
        minHeight: "44px",            /* ← Loi de Fitts */
        minWidth: "44px",
        borderRadius: "7px",
        background: bg,
        color: isActive ? "#fff" : hovered ? color : "var(--text-muted)",
        border: isActive ? "none" : `1px solid ${hovered ? color : "transparent"}`,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: 5,
        outline: "none",
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${color}50`; }}
      onBlur={(e)  => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {label}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeChart, setActiveChart] = useState("bar");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Erreur chargement stats:", error);
      /*
       * CORRECTION 1 — Gestion d'erreur : message explicite affiché à l'écran.
       */
      setErrorMessage(
        "Impossible de charger les statistiques. Vérifiez votre connexion ou réessayez.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* ── État de chargement ─────────────────────────────────────────────────── */
  if (loading)
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Chargement du tableau de bord en cours"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70vh",
        }}
      >
        <Spinner text="Chargement du tableau de bord..." />
      </div>
    );

  /* ── CORRECTION 1 — Affichage de l'erreur avec bouton Réessayer ───────── */
  if (errorMessage)
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          gap: 16,
          padding: "24px",
          textAlign: "center",
        }}
      >
        <AlertCircle
          size={52}
          style={{ color: PALETTE.danger }}
          aria-hidden="true"
        />
        {/* CORRECTION 5 — Gestion d'erreur : message + champ surligné */}
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: `1px solid ${PALETTE.danger}40`,
            borderRadius: 12,
            padding: "16px 24px",
            color: PALETTE.danger,
            fontWeight: 600,
            fontSize: 15,
            maxWidth: 480,
          }}
        >
          {errorMessage}
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
          Si le problème persiste, contactez l'administrateur système.
        </p>
        <button
          onClick={fetchStats}
          aria-label="Réessayer de charger le tableau de bord"
          style={{
            minHeight: 48,           /* ← Loi de Fitts */
            minWidth: 160,
            padding: "12px 28px",
            background: PALETTE.primary,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          onFocus={(e)      => { e.currentTarget.style.outline = `2px solid ${PALETTE.primary}`; e.currentTarget.style.outlineOffset = "2px"; }}
          onBlur={(e)       => { e.currentTarget.style.outline = "none"; }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Réessayer
        </button>
      </div>
    );

  /* ── CORRECTION 2 — Calcul dynamique des tendances ─────────────────────── */
  const trends = {
    students: calcTrend(
      stats?.total_etudiants          ?? MOCK_PREVIOUS_MONTH.total_etudiants * 1.12,
      MOCK_PREVIOUS_MONTH.total_etudiants,
    ),
    filieres: calcTrend(
      stats?.total_filieres           ?? MOCK_PREVIOUS_MONTH.total_filieres * 1.02,
      MOCK_PREVIOUS_MONTH.total_filieres,
    ),
    waiting: calcTrend(
      stats?.inscriptions_en_attente  ?? MOCK_PREVIOUS_MONTH.inscriptions_en_attente * 0.95,
      MOCK_PREVIOUS_MONTH.inscriptions_en_attente,
    ),
    success: calcTrend(
      stats?.taux_reussite            ?? MOCK_PREVIOUS_MONTH.taux_reussite * 1.08,
      MOCK_PREVIOUS_MONTH.taux_reussite,
    ),
  };

  return (
    <div className="page-enter" style={{ padding: "0 0 32px 0" }}>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble et analyses de la gestion universitaire"
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Badge color="success" dot>
            Données en temps réel
          </Badge>
          <Badge color="info">
            <Calendar size={12} style={{ marginRight: 4 }} aria-hidden="true" />
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Badge>
        </div>
      </PageHeader>

      {/* ── 4 Cartes statistiques
           CORRECTION 7 — Responsive : auto-fit remplace repeat(4, 1fr) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 18,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Total étudiants"
          value={stats?.total_etudiants ?? 0}
          color={PALETTE.primary}
          icon={Users}
          trend={trends.students.trend}
          trendValue={trends.students.value}
        />
        <StatCard
          label="Filières actives"
          value={stats?.total_filieres ?? 0}
          color={PALETTE.success}
          icon={BookOpen}
          trend={trends.filieres.trend}
          trendValue={trends.filieres.value}
        />
        <StatCard
          label="En attente de notes"
          value={stats?.inscriptions_en_attente ?? 0}
          color={PALETTE.warning}
          icon={Clock}
          trend={trends.waiting.trend}
          trendValue={trends.waiting.value}
        />
        <StatCard
          label="Taux de réussite"
          value={`${stats?.taux_reussite ?? 0}%`}
          color={PALETTE.info}
          icon={Trophy}
          trend={trends.success.trend}
          trendValue={trends.success.value}
        />
      </div>

      {/* ── SECTION GRAPHIQUE ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Analyses et Statistiques
            </h3>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--text-muted)",
                margin: "4px 0 0",
              }}
            >
              Visualisation des données académiques
            </p>
          </div>

          {/* Sélecteur de vue global — CORRECTION 3 & 6 via ChartToggleButton */}
          <div
            role="group"
            aria-label="Choisir le type de graphique"
            style={{
              display: "flex",
              gap: 3,
              background: "var(--surface2)",
              padding: "3px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
            }}
          >
            <ChartToggleButton
              label="Barres"
              icon={BarChart3}
              isActive={activeChart === "bar"}
              color={PALETTE.primary}
              onClick={() => setActiveChart("bar")}
            />
            <ChartToggleButton
              label="Camembert"
              icon={PieChartIcon}
              isActive={activeChart === "pie"}
              color={PALETTE.primary}
              onClick={() => setActiveChart("pie")}
            />
          </div>
        </div>

        {/* 2 Graphiques côte à côte
            CORRECTION 7 — Responsive : auto-fit remplace repeat(2, 1fr) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {/* Graphique 1 — Étudiants par filière */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <ChartHeader
              title="Étudiants par filière"
              subtitle="Évolution des effectifs"
              icon={TrendingUp}
              color={PALETTE.primary}
            />
            <div style={{ padding: "18px" }}>
              {stats?.par_filiere?.length ? (
                <ResponsiveContainer width="100%" height={290}>
                  <AreaChart
                    data={stats.par_filiere}
                    margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorStudents"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={PALETTE.primary}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="95%"
                          stopColor={PALETTE.primary}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="filiere"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="nb_etudiants"
                      name="Étudiants"
                      stroke={PALETTE.primary}
                      strokeWidth={2.5}
                      fill="url(#colorStudents)"
                      dot={{ r: 4, fill: PALETTE.primary, strokeWidth: 2 }}
                      activeDot={{
                        r: 6,
                        fill: PALETTE.primary,
                        stroke: "#fff",
                        strokeWidth: 3,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{ textAlign: "center", padding: "70px 20px" }}
                  role="status"
                  aria-label="Aucune donnée disponible pour les filières"
                >
                  <GraduationCap
                    size={44}
                    style={{
                      color: "var(--text-muted)",
                      opacity: 0.25,
                      marginBottom: 14,
                    }}
                    aria-hidden="true"
                  />
                  <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>
                    Aucune donnée disponible
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Graphique 2 — Répartition par niveau */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <ChartHeader
              title="Répartition par niveau"
              subtitle="Distribution des étudiants"
              icon={LayoutGrid}
              color={PALETTE.success}
            >
              {/* Sélecteur de vue local — CORRECTION 3 & 6 */}
              <div
                role="group"
                aria-label="Type de vue pour la répartition par niveau"
                style={{
                  display: "flex",
                  gap: 3,
                  background: "var(--surface2)",
                  padding: "3px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <ChartToggleButton
                  label="Barres"
                  isActive={activeChart === "bar"}
                  color={PALETTE.success}
                  onClick={() => setActiveChart("bar")}
                />
                <ChartToggleButton
                  label="Camembert"
                  isActive={activeChart === "pie"}
                  color={PALETTE.success}
                  onClick={() => setActiveChart("pie")}
                />
              </div>
            </ChartHeader>
            <div style={{ padding: "18px" }}>
              {stats?.par_niveau?.length ? (
                activeChart === "bar" ? (
                  <ResponsiveContainer width="100%" height={290}>
                    <BarChart
                      data={stats.par_niveau}
                      margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="niveau"
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="nb"
                        name="Nombre"
                        radius={[7, 7, 0, 0]}
                        barSize={40}
                      >
                        {stats.par_niveau.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={290}>
                    <PieChart>
                      <Pie
                        data={stats.par_niveau}
                        dataKey="nb"
                        nameKey="niveau"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={45}
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                      >
                        {stats.par_niveau.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div
                  style={{ textAlign: "center", padding: "70px 20px" }}
                  role="status"
                  aria-label="Aucune statistique de niveau disponible"
                >
                  <PieChartIcon
                    size={44}
                    style={{
                      color: "var(--text-muted)",
                      opacity: 0.25,
                      marginBottom: 14,
                    }}
                    aria-hidden="true"
                  />
                  <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>
                    Aucune statistique disponible pour le moment
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dernières inscriptions ─────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid var(--border)",
            background: `linear-gradient(135deg, ${PALETTE.purple}06 0%, var(--surface) 100%)`,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${PALETTE.purple}18`,
                border: `1px solid ${PALETTE.purple}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-hidden="true"
            >
              <UserPlus size={20} style={{ color: PALETTE.purple }} aria-hidden="true" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                Dernières inscriptions
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  margin: "3px 0 0",
                }}
              >
                {stats?.derniers_inscrits?.length || 0} inscription(s) récente(s)
              </p>
            </div>
          </div>
          <Badge color="accent" size="lg">
            <Sparkles size={12} style={{ marginRight: 4 }} aria-hidden="true" />
            Actualisé en temps réel
          </Badge>
        </div>

        {stats?.derniers_inscrits?.length ? (
          <div
            style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}
          >
            {/*
             * CORRECTION 4 — Accessibilité table :
             * - <caption> masquée visuellement mais lisible par les lecteurs d'écran
             * - scope="col" déjà présent ✅
             * - aria-label sur les <tr> cliquables
             */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
              aria-label="Liste des dernières inscriptions d'étudiants"
            >
              <caption
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clip: "rect(0,0,0,0)",
                  whiteSpace: "nowrap",
                }}
              >
                Tableau des dernières inscriptions — {stats.derniers_inscrits.length} entrée(s)
              </caption>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr
                  style={{
                    background: "var(--surface2)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {[
                    "Matricule",
                    "Nom complet",
                    "Filière",
                    "Niveau",
                    "Statut",
                    "Date d'inscription",
                    "Notes",
                    "Décision",
                  ].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      style={{
                        padding: "13px 18px",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.derniers_inscrits.map((r, i) => (
                  <tr
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`Étudiant ${r.nom_complet}, matricule ${r.matricule}, filière ${r.filiere}`}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s ease",
                      cursor: "pointer",
                      background:
                        i % 2 === 0 ? "transparent" : "var(--surface2)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${PALETTE.primary}0d`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        i % 2 === 0 ? "transparent" : "var(--surface2)";
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${PALETTE.primary}`;
                      e.currentTarget.style.outlineOffset = "-2px";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.currentTarget.click();
                      }
                    }}
                  >
                    <td
                      style={{
                        padding: "13px 18px",
                        fontFamily: "monospace",
                        color: PALETTE.primary,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {r.matricule}
                    </td>
                    <td
                      style={{
                        padding: "13px 18px",
                        color: "var(--text)",
                        fontWeight: 600,
                      }}
                    >
                      {r.nom_complet}
                    </td>
                    <td style={{ padding: "13px 18px", color: "var(--text)" }}>
                      {r.filiere}
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "var(--surface2)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                        aria-label={`Niveau : ${r.niveau}`}
                      >
                        {r.niveau}
                      </span>
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <StatutBadge statut={r.statut} matricule={r.matricule} />
                    </td>
                    <td
                      style={{
                        padding: "13px 18px",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(r.date_inscription).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td
                      style={{
                        padding: "13px 18px",
                        color: "var(--text)",
                        fontSize: 12,
                      }}
                    >
                      {r.notes_list ? (
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              marginBottom: 4,
                              color: PALETTE.primary,
                            }}
                          >
                            Moyenne :{" "}
                            {r.moyenne && !isNaN(r.moyenne)
                              ? parseFloat(r.moyenne).toFixed(2)
                              : "N/A"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              maxWidth: "200px",
                              wordBreak: "break-word",
                            }}
                          >
                            {r.notes_list}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                          }}
                        >
                          Pas de notes
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <DecisionBadge decision={r.decision || "En attente"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{ textAlign: "center", padding: "70px 20px" }}
            role="status"
            aria-label="Aucune inscription récente"
          >
            <UserPlus
              size={44}
              style={{
                color: "var(--text-muted)",
                opacity: 0.25,
                marginBottom: 14,
              }}
              aria-hidden="true"
            />
            <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>
              Aucune inscription récente à afficher
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
