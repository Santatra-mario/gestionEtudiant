import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, CartesianGrid,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import {
  Users, BookOpen, Clock, Trophy,
  BarChart3, PieChart as PieChartIcon,
  CheckCircle, AlertCircle, TrendingUp,
  TrendingDown, Activity, Calendar,
  UserPlus, GraduationCap, DollarSign,
  Award, Zap, Shield, Sparkles, LayoutGrid,
} from 'lucide-react'
import api from '../services/api'
import { PageHeader, Card, Badge, Spinner } from '../components/ui'

/* ── Palette professionnelle moderne ──────────────────────────────────────── */
const PALETTE = {
  primary: '#4f46e5',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
}

const CHART_COLORS = [PALETTE.primary, PALETTE.success, PALETTE.warning, PALETTE.danger, PALETTE.info, PALETTE.purple]

/* ── Tooltip personnalisé moderne ─────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '12px 18px',
      fontSize: 13,
      color: 'var(--text)',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)',
      backdropFilter: 'blur(10px)',
    }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: PALETTE.primary }}>{label}</p>
      <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
        {payload[0].name} : <strong style={{ color: payload[0].color, fontSize: 16 }}>{payload[0].value}</strong>
      </p>
    </div>
  )
}

/* ── Carte statistique améliorée avec effet glassmorphism ─────────────────── */
function StatCard({ label, value, color, icon: Icon, trend, trendValue }) {
  const [isHovered, setIsHovered] = useState(false);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '2px solid var(--border)',
      borderTop: `4px solid ${color}`,
      borderRadius: '20px',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      boxShadow: isHovered ? '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)' : '0 1px 3px 0 rgba(0,0,0,0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ flex: 1 }}>
        <p style={{ 
          fontSize: 13, 
          color: 'var(--text-muted)', 
          marginBottom: 8, 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em', 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {label}
        </p>
        <p style={{ 
          fontSize: 36, 
          fontWeight: 800, 
          color: 'var(--text)', 
          lineHeight: 1, 
          margin: 0,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {value}
        </p>
        {trend && trendValue && (
          <p style={{
            fontSize: 12,
            color: trend === 'up' ? PALETTE.success : PALETTE.danger,
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <TrendIcon size={14} />
            <span>{trendValue}</span>
          </p>
        )}
      </div>
      <div style={{
        width: 56, 
        height: 56, 
        borderRadius: 16, 
        flexShrink: 0,
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        border: `2px solid ${color}40`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1) rotate(0deg)',
      }}>
        <Icon size={26} style={{ color, filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' : 'none' }} />
      </div>
    </div>
  )
}

/* ─── Badge de statut étudiant amélioré ───────────────────────────────────── */
function StatutBadge({ statut }) {
  const config = {
    actif:     { bg: 'rgba(16,185,129,0.12)', color: PALETTE.success, icon: CheckCircle, label: 'Actif' },
    suspendu:  { bg: 'rgba(245,158,11,0.12)', color: PALETTE.warning, icon: AlertCircle, label: 'Suspendu' },
    diplome:   { bg: 'rgba(79,70,229,0.12)',  color: PALETTE.primary, icon: Award, label: 'Diplômé' },
    abandonne: { bg: 'rgba(239,68,68,0.12)',  color: PALETTE.danger,  icon: AlertCircle, label: 'Abandonné' },
  }
  const c = config[statut] || { bg: 'var(--surface2)', color: 'var(--text-muted)', icon: null, label: statut || 'Non défini' }
  const Icon = c.icon

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px',
      borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      background: c.bg, 
      color: c.color,
      border: `1px solid ${c.color}30`,
    }}>
      {Icon && <Icon size={12} />}
      {c.label}
    </span>
  )
}

/* ─── Badge de décision amélioré ──────────────────────────────────────────── */
function DecisionBadge({ decision }) {
  const normalizedDecision = (decision || 'en attente').toLowerCase().trim();
  
  const config = {
    'admis':      { color: PALETTE.success, bg: 'rgba(16,185,129,0.12)', icon: CheckCircle, label: 'Admis' },
    'rattrapage': { color: PALETTE.warning, bg: 'rgba(245,158,11,0.12)', icon: AlertCircle, label: 'Rattrapage' },
    'ajourné':    { color: PALETTE.danger,  bg: 'rgba(239,68,68,0.12)',  icon: AlertCircle, label: 'Ajourné' },
    'ajourne':    { color: PALETTE.danger,  bg: 'rgba(239,68,68,0.12)',  icon: AlertCircle, label: 'Ajourné' },
    'en attente': { color: PALETTE.info,    bg: 'rgba(6,182,212,0.12)',   icon: Clock, label: 'En attente' },
  };

  const c = config[normalizedDecision] || { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: null, label: decision || 'Non défini' };
  const Icon = c.icon;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px',
      borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.color}30`,
      whiteSpace: 'nowrap',
    }}>
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {c.label}
    </span>
  );
}

/* ─── Section graphique moderne avec layout amélioré ────────────────────────── */
function ModernChartCard({ title, icon: Icon, children, subtitle, color = PALETTE.primary }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '2px solid var(--border)',
      borderRadius: '24px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '2px solid var(--border)',
          background: `linear-gradient(135deg, ${color}08 0%, var(--surface) 100%)`,
          cursor: 'pointer',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: `linear-gradient(135deg, ${color}25, ${color}10)`,
            border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
          }}>
            <Icon size={24} style={{ color }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          transition: 'all 0.3s ease',
        }}>
          {!isExpanded && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cliquer pour agrandir</span>
          )}
          <div style={{ 
            transition: 'transform 0.3s ease', 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-muted)',
          }}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>
      <div style={{ 
        transition: 'all 0.3s ease', 
        padding: isExpanded ? '24px' : '20px',
        minHeight: isExpanded ? '400px' : '360px',
      }}>
        {children}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState('bar')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats')
        setStats(response.data.data)
      } catch (error) {
        console.error('Erreur chargement stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <Spinner text="Chargement du tableau de bord..." />
    </div>
  )

  // Calcul des tendances
  const trends = {
    students: { trend: 'up', value: '+12%' },
    filieres: { trend: 'up', value: '+2%' },
    waiting: { trend: 'down', value: '-5%' },
    success: { trend: 'up', value: '+8%' },
  }

  return (
    <div className="page-enter" style={{ padding: '0 0 24px 0' }}>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble et analyses de la gestion universitaire"
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <Badge color="success" dot>Live</Badge>
          <Badge color="info">
            <Calendar size={12} style={{ marginRight: 4 }} />
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </PageHeader>

      {/* 4 Cartes statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20,
        marginBottom: 32,
      }}>
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

      {/* SECTION GRAPHIQUE - Layout amélioré et professionnel */}
      <div style={{ marginBottom: 32 }}>
        {/* En-tête de la section graphique */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          padding: '0 4px',
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Analyses et Statistiques
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Visualisation des données académiques
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              display: 'flex',
              gap: 4,
              background: 'var(--surface2)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}>
              <button
                onClick={() => setActiveChart('bar')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: activeChart === 'bar' ? PALETTE.primary : 'transparent',
                  color: activeChart === 'bar' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Barres
              </button>
              <button
                onClick={() => setActiveChart('pie')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: activeChart === 'pie' ? PALETTE.primary : 'transparent',
                  color: activeChart === 'pie' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Camembert
              </button>
            </div>
          </div>
        </div>

        {/* 2 Graphiques côte à côte - Layout professionnel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
        }}>
          {/* Graphique 1 - Étudiants par filière */}
          <div style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: '20px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              padding: '18px 20px',
              borderBottom: '2px solid var(--border)',
              background: `linear-gradient(135deg, ${PALETTE.primary}05, var(--surface))`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${PALETTE.primary}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={20} color={PALETTE.primary} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    Étudiants par filière
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Évolution des effectifs
                  </p>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {stats?.par_filiere?.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.par_filiere} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PALETTE.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="filiere" 
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                      axisLine={false} 
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="nb_etudiants" 
                      name="Étudiants" 
                      stroke={PALETTE.primary} 
                      strokeWidth={3}
                      fill="url(#colorStudents)"
                      dot={{ r: 4, fill: PALETTE.primary, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: PALETTE.primary, stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <GraduationCap size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Graphique 2 - Répartition par niveau */}
          <div style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: '20px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              padding: '18px 20px',
              borderBottom: '2px solid var(--border)',
              background: `linear-gradient(135deg, ${PALETTE.success}05, var(--surface))`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${PALETTE.success}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LayoutGrid size={20} color={PALETTE.success} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    Répartition par niveau
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Distribution des étudiants
                  </p>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {stats?.par_niveau?.length ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      background: 'var(--surface2)',
                      padding: '4px',
                      borderRadius: '10px',
                    }}>
                      <button
                        onClick={() => setActiveChart('bar')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          background: activeChart === 'bar' ? PALETTE.primary : 'transparent',
                          color: activeChart === 'bar' ? '#fff' : 'var(--text-muted)',
                          border: 'none',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Vue barres
                      </button>
                      <button
                        onClick={() => setActiveChart('pie')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          background: activeChart === 'pie' ? PALETTE.primary : 'transparent',
                          color: activeChart === 'pie' ? '#fff' : 'var(--text-muted)',
                          border: 'none',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Vue circulaire
                      </button>
                    </div>
                  </div>
                  
                  {activeChart === 'bar' ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.par_niveau} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="niveau" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="nb" name="Nombre" radius={[8, 8, 0, 0]} barSize={45}>
                          {stats.par_niveau.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
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
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                        >
                          {stats.par_niveau.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <PieChartIcon size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dernières inscriptions */}
      <Card style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--border)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '2px solid var(--border)',
          background: 'linear-gradient(135deg, var(--surface2) 0%, var(--surface) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${PALETTE.purple}20, ${PALETTE.purple}10)`,
              border: `2px solid ${PALETTE.purple}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus size={22} style={{ color: PALETTE.purple }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Dernières inscriptions</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {stats?.derniers_inscrits?.length || 0} inscription(s) récente(s)
              </p>
            </div>
          </div>
          <Badge color="accent" size="lg">
            <Sparkles size={12} style={{ marginRight: 4 }} />
            Actualisé en temps réel
          </Badge>
        </div>

        {stats?.derniers_inscrits?.length ? (
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface2)' }}>
                  {['Matricule', 'Nom complet', 'Filière', 'Niveau', 'Statut', "Date d'inscription", 'Notes', 'Décision'].map(h => (
                    <th key={h} scope="col" style={{
                      padding: '14px 20px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.derniers_inscrits.map((r, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    background: i % 2 === 0 ? 'transparent' : 'var(--surface2)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${PALETTE.primary}10`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--surface2)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: PALETTE.primary, fontWeight: 700, fontSize: 12 }}>
                      {r.matricule}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text)', fontWeight: 600 }}>
                      {r.nom_complet}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text)' }}>
                      {r.filiere}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: 99, 
                        fontSize: 11, 
                        fontWeight: 700, 
                        background: 'var(--surface2)', 
                        color: 'var(--text-muted)', 
                        border: '1px solid var(--border)',
                      }}>
                        {r.niveau}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatutBadge statut={r.statut} />
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(r.date_inscription).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text)', fontSize: 12 }}>
                      {r.notes_list ? (
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 4, color: PALETTE.primary }}>
                            Moyenne: {r.moyenne && !isNaN(r.moyenne) ? parseFloat(r.moyenne).toFixed(2) : 'N/A'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: '200px', wordBreak: 'break-word' }}>
                            {r.notes_list}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pas de notes</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <DecisionBadge decision={r.decision || 'En attente'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <UserPlus size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucune inscription récente à afficher</p>
          </div>
        )}
      </Card>
    </div>
  )
}