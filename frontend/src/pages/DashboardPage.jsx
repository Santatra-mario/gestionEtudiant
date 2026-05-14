import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  Users, BookOpen, Clock, Trophy,
  BarChart3, PieChart as PieChartIcon,
  CheckCircle, AlertCircle,
} from 'lucide-react'
import api from '../services/api'
import { PageHeader, Card, Badge, Spinner } from '../components/ui'
 
/* ── Palette réduite et cohérente (4 couleurs sémantiques) ──────────────── */
const PALETTE = {
  primary: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
  info:    'var(--info)',
}
 
/* Couleurs pour graphiques circulaires — max 6 teintes distinctes */
const CHART_COLORS = ['#4f8ef7', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']
 
/* ── Tooltip personnalisé ─────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 14px',
      fontSize: 13,
      color: 'var(--text)',
      boxShadow: 'var(--shadow)',
    }}>
      <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
        {payload[0].name} : <strong style={{ color: 'var(--accent)' }}>{payload[0].value}</strong>
      </p>
    </div>
  )
}
 
/* ── Carte statistique simple et accessible ──────────────────────────────── */
function StatCard({ label, value, color, icon: Icon }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '2px solid var(--border)',
      borderLeft: `4px solid ${color}`,
      borderRadius: 'var(--radius-lg)',
      padding: '24px 26px',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      boxShadow: isHovered ? 'var(--shadow)' : 'var(--shadow-sm)',
      transition: 'all 0.3s ease',
      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      cursor: 'pointer',
    }}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: `${color}20`,
        border: `2px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}>
        <Icon size={22} aria-hidden="true" style={{ color, filter: isHovered ? 'brightness(1.2)' : 'none' }} />
      </div>
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}
 
/* ── Badge de statut étudiant ─────────────────────────────────────────────── */
function StatutBadge({ statut }) {
  const config = {
    actif:     { bg: 'rgba(34,197,94,0.12)',  color: 'var(--success)', label: 'Actif' },
    suspendu:  { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)', label: 'Suspendu' },
    diplome:   { bg: 'rgba(79,142,247,0.12)', color: 'var(--accent)',  label: 'Diplômé' },
    abandonne: { bg: 'rgba(239,68,68,0.12)',  color: 'var(--danger)',  label: 'Abandonné' },
  }
  const c = config[statut] || { bg: 'var(--surface2)', color: 'var(--text-muted)', label: statut }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.color,
      textTransform: 'capitalize',
    }}>{c.label}</span>
  )
}
 
/* ── Badge de décision ────────────────────────────────────────────────────── */
function DecisionBadge({ decision }) {
  // Debug: Afficher la valeur reçue dans la console
  console.log('DecisionBadge received:', decision);

  // Normalisation de la valeur pour gérer les variations de casse et d'espaces
  const normalizedDecision = (decision || '').toLowerCase().trim();

  const config = {
    'admis':      { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', icon: CheckCircle, label: 'Admis' },
    'rattrapage': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: AlertCircle, label: 'Rattrapage' },
    'ajourné':    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', icon: AlertCircle, label: 'Ajourné' },
    'ajourne':    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', icon: AlertCircle, label: 'Ajourné' },
    'en attente': { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', icon: Clock, label: 'En attente' },
  };

  const c = config[normalizedDecision] || { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', icon: null, label: decision || 'Non défini' };
  const Icon = c.icon;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px',
      borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {Icon && <Icon size={13} aria-hidden="true" strokeWidth={2.5} />}
      {c.label}
    </span>
  );
}
 
/* ── Section graphique ────────────────────────────────────────────────────── */
function ChartCard({ title, icon: Icon, children }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card style={{
      border: '2px solid var(--border)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isExpanded ? 'var(--shadow-lg)' : 'var(--shadow)',
    }}
    onClick={() => setIsExpanded(!isExpanded)}
    hover={false}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid var(--border)', transition: 'all 0.3s ease', transform: isExpanded ? 'rotate(5deg)' : 'rotate(0deg)' }}>
          <Icon size={20} aria-hidden="true" style={{ color: 'var(--accent)' }} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{title}</h2>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', transition: 'transform 0.3s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </div>
      </div>
      <div style={{ transition: 'opacity 0.3s ease', opacity: isExpanded ? 1 : 0.9 }}>
        {children}
      </div>
    </Card>
  )
}
 
/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data.data))
      .finally(() => setLoading(false))
  }, [])
 
  if (loading) return <Spinner />
 
  return (
    <div className="page-enter">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la gestion universitaire"
      />
 
      {/* Statistiques — 4 cartes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        <StatCard label="Total étudiants"       value={stats?.total_etudiants ?? '—'}       color="var(--accent)"   icon={Users}    />
        <StatCard label="Filières actives"       value={stats?.total_filieres ?? '—'}        color="var(--success)"  icon={BookOpen}  />
        <StatCard label="En attente de notes"    value={stats?.inscriptions_en_attente ?? '—'} color="var(--warning)"  icon={Clock}     />
        <StatCard label="Taux de réussite"       value={`${stats?.taux_reussite ?? 0} %`}    color="var(--info)"     icon={Trophy}    />
      </div>
 
      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 32 }}>
        <ChartCard title="Étudiants par filière" icon={BarChart3}>
          {stats?.par_filiere?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.par_filiere} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="filiere" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,142,247,0.08)' }} />
                <Bar dataKey="nb_etudiants" name="Étudiants" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0', fontSize: 14 }}>Aucune donnée disponible.</p>
          )}
        </ChartCard>
 
        <ChartCard title="Répartition par niveau" icon={PieChartIcon}>
          {stats?.par_niveau?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.par_niveau}
                  dataKey="nb"
                  nameKey="niveau"
                  cx="50%" cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ niveau, percent }) => `${niveau} ${Math.round(percent * 100)}%`}
                  labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                >
                  {stats.par_niveau.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0', fontSize: 14 }}>Aucune donnée disponible.</p>
          )}
        </ChartCard>
      </div>
 
      {/* Tableau des dernières inscriptions */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={18} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Dernières inscriptions</h2>
        </div>
 
        {stats?.derniers_inscrits?.length ? (
          <div style={{ overflowX: 'auto', border: '2px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
              aria-label="Dernières inscriptions"
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface2)' }}>
                  {['Matricule', 'Nom complet', 'Filière', 'Niveau', 'Statut', "Date d'inscription", 'Décision'].map(h => (
                    <th key={h} scope="col" style={{
                      padding: '14px 18px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                      borderRight: '1px solid var(--border)',
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
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--surface2)';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  >
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600, fontSize: 13, borderRight: '1px solid var(--border)' }}>{r.matricule}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text)', fontWeight: 500, borderRight: '1px solid var(--border)' }}>{r.nom_complet}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{r.filiere}</td>
                    <td style={{ padding: '14px 18px', borderRight: '1px solid var(--border)' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {r.niveau}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', borderRight: '1px solid var(--border)' }}><StatutBadge statut={r.statut} /></td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: 13, borderRight: '1px solid var(--border)' }}>
                      {new Date(r.date_inscription).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 18px' }}><DecisionBadge decision={r.decision || 'En attente'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
            Aucune inscription récente.
          </p>
        )}
      </Card>
    </div>
  )
}
 
