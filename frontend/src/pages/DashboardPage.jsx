import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, BookOpen, Clock, Trophy, BarChart3, PieChart as PieChartIcon, History } from 'lucide-react'
import api from '../services/api'
import { PageHeader, StatCard, Card, Badge, Spinner } from '../components/ui'

const COLORS = ['#4f8ef7', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#ec489a', '#14b8a6']

const statutBadge = s => {
  const map = { actif: 'success', suspendu: 'warning', diplome: 'accent', abandonne: 'danger' }
  return <Badge color={map[s] || 'muted'}>{s}</Badge>
}

// Composant de carte statistique avec icône Lucide
const ModernStatCard = ({ label, value, color, icon: Icon }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)`,
    backdropFilter: 'blur(4px)',
    borderRadius: '1.5rem',
    padding: '1.25rem 1rem',
    border: `1px solid ${color}30`,
    boxShadow: '0 8px 20px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
     onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
    <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      {Icon && <Icon size={18} strokeWidth={1.5} />}
      <span>{label}</span>
    </div>
    <div style={{ fontSize: 32, fontWeight: 700, color: color, lineHeight: 1.2 }}>{value}</div>
  </div>
)

// Tooltip personnalisé pour les graphiques
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(18, 25, 45, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        padding: '8px 14px',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        color: '#fff'
      }}>
        <p style={{ margin: 0, fontWeight: 500 }}>{label}</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8 }}>
          {payload[0].name} : <strong>{payload[0].value}</strong>
        </p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageHeader
        title="Tableau de bord"
        subtitle={`Vue d'ensemble de la gestion universitaire`}
      />

      {/* Stats modernes avec icônes Lucide */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <ModernStatCard 
          label="Total étudiants" 
          value={stats?.total_etudiants ?? '—'} 
          color="#4f8ef7" 
          icon={Users}
        />
        <ModernStatCard 
          label="Filières actives" 
          value={stats?.total_filieres ?? '—'} 
          color="#22c55e" 
          icon={BookOpen}
        />
        <ModernStatCard 
          label="En attente de notes" 
          value={stats?.inscriptions_en_attente ?? '—'} 
          color="#f59e0b" 
          icon={Clock}
        />
        <ModernStatCard 
          label="Taux de réussite" 
          value={`${stats?.taux_reussite ?? 0}%`} 
          color="#a78bfa" 
          icon={Trophy}
        />
      </div>

      {/* Graphiques améliorés */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <Card style={{
          borderRadius: '1.5rem',
          padding: '1.5rem',
          background: 'var(--surface)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
          transition: 'box-shadow 0.2s'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 24,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <BarChart3 size={20} strokeWidth={1.5} /> Étudiants par filière
          </h3>
          {stats?.par_filiere?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.par_filiere} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis 
                  dataKey="filiere" 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 142, 247, 0.1)' }} />
                <Bar 
                  dataKey="nb_etudiants" 
                  fill="url(#barGradient)" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                  animationDuration={800}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f8ef7" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Aucune donnée.</p>}
        </Card>

        <Card style={{
          borderRadius: '1.5rem',
          padding: '1.5rem',
          background: 'var(--surface)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 24,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <PieChartIcon size={20} strokeWidth={1.5} /> Répartition par niveau
          </h3>
          {stats?.par_niveau?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie 
                  data={stats.par_niveau} 
                  dataKey="nb" 
                  nameKey="niveau" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ niveau, percent }) => `${niveau} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                  animationDuration={800}
                >
                  {stats.par_niveau.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--surface)" strokeWidth={2} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Aucune donnée.</p>}
        </Card>
      </div>

      {/* Derniers inscrits */}
      <Card style={{
        borderRadius: '1.5rem',
        padding: '1.5rem',
        background: 'var(--surface)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)'
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 20,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <History size={20} strokeWidth={1.5} /> Dernières inscriptions
        </h3>
        {stats?.derniers_inscrits?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'rgba(79, 142, 247, 0.05)', borderRadius: '12px' }}>
                  {['Matricule', 'Nom', 'Filière', 'Niveau', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderBottom: '2px solid var(--border)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.derniers_inscrits.map((r, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                    cursor: 'pointer'
                  }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                     onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', color: '#4f8ef7', fontFamily: 'monospace', fontWeight: 500 }}>{r.matricule}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text)', fontWeight: 500 }}>{r.nom_complet}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text)' }}>{r.filiere}</td>
                    <td style={{ padding: '14px 16px' }}><Badge color="muted" style={{ background: 'var(--surface3)', borderRadius: '30px' }}>{r.niveau}</Badge></td>
                    <td style={{ padding: '14px 16px' }}>{statutBadge(r.statut)}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 13 }}>{new Date(r.date_inscription).toLocaleDateString('fr', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Aucune inscription récente.</p>}
      </Card>
    </div>
  )
}