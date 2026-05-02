import { useEffect, useState } from 'react'
import api from '../services/api'
import { PageHeader, Btn, Card, Modal, Input, Select, FormRow, Alert, Badge, Spinner } from '../components/ui'

const ROLES = ['administrateur','secretaire','enseignant']
const roleColor = { administrateur:'accent', secretaire:'success', enseignant:'warning' }

function UserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ nom:'', prenom:'', email:'', password:'', role:'secretaire' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Créer un utilisateur" onClose={onClose} width={500}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {error && <Alert>{error}</Alert>}
        <FormRow>
          <Input label="Nom *" value={form.nom} onChange={set('nom')} required />
          <Input label="Prénom *" value={form.prenom} onChange={set('prenom')} required />
        </FormRow>
        <Input label="Email *" type="email" value={form.email} onChange={set('email')} required />
        <Input label="Mot de passe *" type="password" value={form.password} onChange={set('password')} required />
        <Select label="Rôle *" value={form.role} onChange={set('role')} required>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Création…' : 'Créer'}</Btn>
        </div>
      </form>
    </Modal>
  )
}

export default function UtilisateursPage() {
  // Note: l'API ne liste pas les utilisateurs (pas de route GET /users)
  // On affiche une UI pour créer des utilisateurs uniquement
  const [modal, setModal] = useState(false)
  const [created, setCreated] = useState([])
  const [success, setSuccess] = useState('')

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes d'accès (administrateur, secrétaire, enseignant)"
        action={<Btn onClick={() => setModal(true)}>+ Créer un utilisateur</Btn>}
      />

      {success && (
        <div style={{ marginBottom:16 }}>
          <Alert type="success">{success}</Alert>
        </div>
      )}

      <Card>
        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>◈</div>
          <p style={{ fontSize:14, marginBottom:4 }}>Utilisateurs créés dans cette session :</p>
          {created.length === 0 ? (
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>Aucun utilisateur créé pour l'instant.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:16, maxWidth:400, margin:'16px auto 0' }}>
              {created.map((u, i) => (
                <div key={i} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'var(--surface2)', borderRadius:8, padding:'10px 16px',
                }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, color:'var(--text)' }}>{u.prenom} {u.nom}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <Badge color={roleColor[u.role] || 'muted'}>{u.role}</Badge>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:20, fontStyle:'italic' }}>
            Note : La liste complète des utilisateurs n'est pas exposée par l'API pour des raisons de sécurité.
          </p>
        </div>
      </Card>

      {modal && (
        <UserModal
          onClose={() => setModal(false)}
          onSaved={data => {
            setModal(false)
            setSuccess('Utilisateur créé avec succès.')
            setTimeout(() => setSuccess(''), 4000)
          }}
        />
      )}
    </div>
  )
}
