import { useEffect, useState, useCallback } from 'react'
import { Search, UserPlus, Filter, Calendar, BookOpen, ChevronDown, CheckCircle, XCircle, Users, Edit } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  PageHeader, Btn, Table, Tr, Td, Badge, Modal, Input, Select,
  FormRow, Alert, Spinner
} from '../components/ui'

const NIVEAUX = ['L1','L2','L3','M1','M2']
const STATUTS = ['actif','suspendu','diplome','abandonne']
const statutColor = { actif:'success', suspendu:'warning', diplome:'accent', abandonne:'danger' }

// Composant de sélection d'étudiant avec icône
function StudentSearch({ onSelect }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (search.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    api.get('/etudiants', { params: { search, limit: 10 } })
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        setResults(data)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Users size={14} /> Rechercher étudiant *
      </label>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nom, prénom ou matricule…"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '40px',
            color: 'var(--text)',
            padding: '10px 16px 10px 38px',
            fontSize: 14,
            width: '100%',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
      </div>
      {loading && <Spinner size="small" />}
      {results.length > 0 && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: 4 }}>
          {results.map(e => (
            <div
              key={e.id}
              onClick={() => {
                onSelect({ id: e.id, label: `${e.prenom} ${e.nom} (${e.matricule})` })
                setSearch(`${e.prenom} ${e.nom} (${e.matricule})`)
                setResults([])
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: 14,
                color: 'var(--text)',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Users size={14} style={{ color: 'var(--text-muted)' }} />
              <span><strong>{e.prenom} {e.nom}</strong> — <span style={{ color: 'var(--text-muted)' }}>{e.matricule}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InscriptionModal({ onClose, onSaved }) {
  const [filieres, setFilieres] = useState([])
  const [filiereError, setFiliereError] = useState(false)
  const [filiereLoading, setFiliereLoading] = useState(true)
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [form, setForm] = useState({
    etudiant_id: '',
    filiere_id: '',
    niveau: 'L1',
    annee_universitaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    date_inscription: new Date().toISOString().split('T')[0],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFiliereLoading(true)
    setFiliereError(false)
    api.get('/filieres')
      .then(r => {
        const raw = r.data
        let list = []
        if (Array.isArray(raw)) list = raw
        else if (Array.isArray(raw?.data)) list = raw.data
        setFilieres(list)
      })
      .catch(err => {
        console.error('Erreur chargement filières:', err.response?.status, err.response?.data)
        setFiliereError(true)
        setFilieres([])
      })
      .finally(() => setFiliereLoading(false))
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/inscriptions', form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (student) => {
    setSelectedEtudiant(student)
    setForm(f => ({ ...f, etudiant_id: student.id }))
  }

  return (
    <Modal title="Nouvelle inscription" onClose={onClose} width={560} top={90}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <Alert>{error}</Alert>}

        <StudentSearch onSelect={handleStudentSelect} />

        {/* Filière avec gestion d'état */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={14} /> Filière *
          </label>
          <select
            value={form.filiere_id}
            onChange={set('filiere_id')}
            required
            disabled={filiereLoading}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text)',
              padding: '10px 14px',
              fontSize: 14,
              outline: 'none',
              opacity: filiereLoading ? 0.6 : 1,
              transition: 'border-color 0.2s',
              cursor: 'pointer',
            }}
          >
            <option value="">
              {filiereLoading
                ? 'Chargement…'
                : filiereError
                  ? 'Erreur de chargement — réessayez'
                  : '— Choisir une filière —'}
            </option>
            {!filiereLoading && !filiereError && filieres.map(f => (
              <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
            ))}
          </select>
          {filiereError && (
            <span style={{ fontSize: 12, color: 'var(--danger)' }}>
              Impossible de charger les filières. Vérifiez votre connexion ou rechargez la page.
            </span>
          )}
        </div>

        <FormRow>
          <Select label="Niveau *" value={form.niveau} onChange={set('niveau')} required>
            {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
          </Select>
          <Input
            label="Année universitaire *"
            value={form.annee_universitaire}
            onChange={set('annee_universitaire')}
            placeholder="2024-2025"
            required
          />
        </FormRow>

        <Input
          label="Date d'inscription *"
          type="date"
          value={form.date_inscription}
          onChange={set('date_inscription')}
          required
        />

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn type="submit" disabled={loading || !form.etudiant_id || !form.filiere_id}>
            {loading ? 'Enregistrement…' : 'Inscrire'}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

export default function InscriptionsPage() {
  const { user } = useAuth()
  const canEdit = ['administrateur', 'secretaire'].includes(user?.role)

  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [filters, setFilters] = useState({ annee: '', statut: '', filiere: '' })
  const [statutModal, setStatutModal] = useState(null)
  const [newStatut, setNewStatut] = useState('')
  const [filterActive, setFilterActive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/inscriptions', { params: filters })
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      setInscriptions(list)
    } catch (err) {
      console.error('Erreur chargement inscriptions:', err)
      setInscriptions([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleStatut = async () => {
    try {
      await api.patch(`/inscriptions/${statutModal}/statut`, { statut: newStatut })
      setStatutModal(null)
      load()
    } catch (err) {
      console.error('Erreur changement statut:', err)
    }
  }

  const setF = k => e => {
    setFilters(f => ({ ...f, [k]: e.target.value }))
    setFilterActive(true)
  }

  const clearFilters = () => {
    setFilters({ annee: '', statut: '', filiere: '' })
    setFilterActive(false)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageHeader
        title="Inscriptions"
        subtitle={`${inscriptions.length} inscription(s)`}
        action={canEdit && (
          <Btn onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={16} /> Nouvelle inscription
          </Btn>
        )}
      />

      {/* Filtres modernes */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Année universitaire</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              placeholder="ex: 2024-2025"
              value={filters.annee}
              onChange={setF('annee')}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '30px',
                color: 'var(--text)',
                padding: '8px 12px 8px 32px',
                fontSize: 13,
                width: '100%',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        <div style={{ minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Statut</label>
          <select
            value={filters.statut}
            onChange={setF('statut')}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '30px',
              color: 'var(--text)',
              padding: '8px 30px 8px 14px',
              fontSize: 13,
              width: '100%',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filterActive && (
          <Btn small variant="ghost" onClick={clearFilters} style={{ marginBottom: 2 }}>
            Effacer filtres
          </Btn>
        )}
      </div>

      {/* Tableau des inscriptions */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '1rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s'
      }}>
        {loading ? <Spinner /> : (
          <Table headers={['Matricule', 'Étudiant', 'Filière', 'Niveau', 'Année', 'Statut', canEdit ? 'Actions' : '']}>
            {inscriptions.length === 0 ? (
              <Tr>
                <Td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
                  Aucune inscription trouvée.
                </Td>
              </Tr>
            ) : (
              inscriptions.map(i => (
                <Tr key={i.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Td><span style={{ color: 'var(--accent-light)', fontFamily: 'monospace', fontWeight: 500 }}>{i.matricule}</span></Td>
                  <Td><span style={{ fontWeight: 500 }}>{i.etudiant_nom}</span></Td>
                  <Td>{i.filiere_nom}</Td>
                  <Td><Badge color="muted" style={{ borderRadius: '20px' }}>{i.niveau}</Badge></Td>
                  <Td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{i.annee_universitaire}</Td>
                  <Td><Badge color={statutColor[i.statut] || 'muted'} style={{ borderRadius: '20px' }}>{i.statut}</Badge></Td>
                  <Td>
                    {canEdit && (
                      <Btn small variant="ghost" onClick={() => { setStatutModal(i.id); setNewStatut(i.statut) }} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit size={14} /> Changer statut
                      </Btn>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        )}
      </div>

      {/* Modal de nouvelle inscription */}
      {modal && (
        <InscriptionModal
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load() }}
        />
      )}

      {/* Modal de changement de statut (stylisée) */}
      {statutModal && (
        <Modal title="Modifier le statut" onClose={() => setStatutModal(null)} width={400} top={80}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Select label="Nouveau statut" value={newStatut} onChange={e => setNewStatut(e.target.value)}>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setStatutModal(null)}>Annuler</Btn>
              <Btn onClick={handleStatut} variant="accent">Confirmer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}