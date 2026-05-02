import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Eye, EyeOff, Mail, Lock, User, Users, CheckCircle, AlertCircle } from 'lucide-react'

// ── Keyframes injectés une seule fois ───────────────────────────────────────
const STYLES = `
  @keyframes lgSlideUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lgPopIn {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes lgFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lgShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-6px); }
    40%     { transform: translateX(6px); }
    60%     { transform: translateX(-4px); }
    80%     { transform: translateX(3px); }
  }
  @keyframes lgDrift1 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(-20px,15px) scale(1.08); }
  }
  @keyframes lgDrift2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(15px,-10px) scale(1.1); }
  }
  @keyframes lgRipple {
    to { transform: scale(4); opacity: 0; }
  }
  @keyframes lgSpin {
    to { transform: rotate(360deg); }
  }

  .lg-card     { animation: lgSlideUp .5s cubic-bezier(.16,1,.3,1) both; }
  .lg-logo-box { animation: lgPopIn .6s cubic-bezier(.34,1.56,.64,1) .2s both; }

  .lg-field { animation: lgFadeIn .3s ease both; }

  .lg-input {
    width: 100%; padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface2);
    color: var(--text);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    transition: border-color .18s, box-shadow .18s, transform .12s;
  }
  .lg-input:hover  { border-color: var(--accent); }
  .lg-input:focus  {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,142,247,.18);
    transform: scale(1.012);
  }
  .lg-input.lg-err {
    border-color: var(--danger) !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,.14);
  }

  .lg-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
    cursor: pointer;
  }

  .lg-btn {
    width: 100%; padding: 11px 20px;
    background: var(--accent); color: #fff;
    border: none; border-radius: 8px;
    font-size: 15px; font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .15s, transform .12s, filter .15s;
    margin-top: 4px;
  }
  .lg-btn:hover:not(:disabled)  { transform: translateY(-1px); filter: brightness(1.08); }
  .lg-btn:active:not(:disabled) { transform: scale(.98); }
  .lg-btn:disabled               { opacity: .65; cursor: not-allowed; }

  .lg-ripple {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.28);
    transform: scale(0);
    animation: lgRipple .55s linear;
  }

  .lg-spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lgSpin .7s linear infinite;
  }

  .lg-tab-active   { background: var(--accent) !important; color: #fff !important; transform: scale(1.02); }
  .lg-tab-inactive { background: transparent; color: var(--text-muted); }
  .lg-tab-inactive:hover { color: var(--text); background: rgba(255,255,255,.05); }

  .lg-alert-err {
    animation: lgShake .4s both;
    background: rgba(239,68,68,.10);
    border: 1px solid var(--danger);
    border-radius: 8px; padding: 10px 14px;
    color: #fca5a5; font-size: 14px; margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lg-alert-ok {
    animation: lgFadeIn .3s ease both;
    background: rgba(34,197,94,.10);
    border: 1px solid #22c55e;
    border-radius: 8px; padding: 10px 14px;
    color: #86efac; font-size: 14px; margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lg-pwd-track {
    height: 3px; border-radius: 2px; margin-top: 5px;
    background: var(--border); overflow: hidden;
  }
  .lg-pwd-bar {
    height: 100%; border-radius: 2px;
    transition: width .4s cubic-bezier(.4,0,.2,1), background .3s;
  }

  .lg-blob {
    position: fixed; border-radius: 50%;
    pointer-events: none; filter: blur(70px); opacity: .12;
  }
  .lg-blob1 {
    width: 520px; height: 520px;
    background: #4f8ef7;
    top: -180px; right: -180px;
    animation: lgDrift1 9s ease-in-out infinite;
  }
  .lg-blob2 {
    width: 340px; height: 340px;
    background: #a78bfa;
    bottom: -120px; left: -120px;
    animation: lgDrift2 11s ease-in-out infinite;
  }
`

// ── Utilitaire : force du mot de passe ──────────────────────────────────────
function passwordStrength(pwd) {
  if (!pwd) return null
  let score = 0
  if (pwd.length >= 6)  score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  const levels = [
    { label: 'Très faible', color: '#e24b4a', width: '20%' },
    { label: 'Faible',      color: '#ef9f27', width: '40%' },
    { label: 'Moyen',       color: '#facc15', width: '60%' },
    { label: 'Fort',        color: '#4ade80', width: '80%' },
    { label: 'Très fort',   color: '#22c55e', width: '100%' },
  ]
  return levels[Math.min(score - 1, 4)]
}

// ── Effet ripple sur bouton ──────────────────────────────────────────────────
function addRipple(btn, e) {
  const r = document.createElement('span')
  r.className = 'lg-ripple'
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`
  btn.appendChild(r)
  setTimeout(() => r.remove(), 600)
}

// ── Composant champ avec label ───────────────────────────────────────────────
function Field({ label, delay = 0, children }) {
  return (
    <div
      className="lg-field"
      style={{ display: 'flex', flexDirection: 'column', gap: 5, animationDelay: `${delay}s` }}
    >
      <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

// ── Composant input mot de passe avec icônes ─────────────────────────────────
function PwdInput({ id, value, onChange, placeholder = '••••••••', hasError, ...rest }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`lg-input${hasError ? ' lg-err' : ''}`}
        style={{ paddingRight: 40 }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1,
          transition: 'transform .15s, color .15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(-50%)' }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [tab, setTab] = useState('connexion')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    nom: '', prenom: '', email: '', password: '', confirmPassword: '', role: 'secretaire',
  })

  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Ré-anime les champs à chaque changement d'onglet
  const [fieldKey, setFieldKey] = useState(0)

  const switchTab = (t) => {
    setTab(t)
    setError('')
    setSuccess('')
    setFieldKey(k => k + 1)
  }

  // Injecte les styles CSS une seule fois
  useEffect(() => {
    const id = 'lg-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id
      el.textContent = STYLES
      document.head.appendChild(el)
    }
  }, [])

  // ── Vérification formulaire connexion ─────────────────────────────────────
  const isLoginValid = loginForm.email.trim() !== '' && loginForm.password.trim() !== ''

  // ── Vérification formulaire inscription ───────────────────────────────────
  const isRegisterValid = () => {
    const { nom, prenom, email, password, confirmPassword, role } = registerForm
    const allFieldsFilled = nom.trim() && prenom.trim() && email.trim() && password && confirmPassword && role
    const passwordsMatch = password === confirmPassword
    const passwordLengthOk = password.length >= 6
    return allFieldsFilled && passwordsMatch && passwordLengthOk
  }

  // ── Connexion ────────────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault()
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]')
    if (submitBtn) addRipple(submitBtn, e)
    setError(''); setSuccess(''); setLoading(true)
    try {
      await login(loginForm.email, loginForm.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  // ── Inscription ──────────────────────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }
    if (registerForm.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/register', {
        nom:      registerForm.nom,
        prenom:   registerForm.prenom,
        email:    registerForm.email,
        password: registerForm.password,
        role:     registerForm.role,
      })
      setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
      setRegisterForm({ nom: '', prenom: '', email: '', password: '', confirmPassword: '', role: 'secretaire' })
      setTimeout(() => { switchTab('connexion'); setSuccess('') }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  const strength = passwordStrength(registerForm.password)
  const pwdMatch = registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 20,
    }}>
      {/* Blobs animés */}
      <div className="lg-blob lg-blob1" />
      <div className="lg-blob lg-blob2" />

      {/* Carte principale */}
      <div
        className="lg-card"
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 40, width: '100%', maxWidth: 460,
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            className="lg-logo-box"
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color: '#fff', marginBottom: 12,
              fontFamily: 'var(--font-display)',
            }}
          >G</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--text)', marginBottom: 4 }}>
            Gestion Des Étudiants
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Plateforme de gestion des étudiants</p>
        </div>

        {/* Onglets */}
        <div style={{
          display: 'flex', background: 'var(--surface2)',
          borderRadius: 10, padding: 4, marginBottom: 24, gap: 4,
        }}>
          {[
            { key: 'connexion',  label: 'Connexion', icon: <Lock size={14} /> },
            { key: 'inscription', label: 'Inscription', icon: <User size={14} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={tab === key ? 'lg-tab-active' : 'lg-tab-inactive'}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all .22s cubic-bezier(.4,0,.2,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Messages d'état */}
        {error   && <div className="lg-alert-err"><AlertCircle size={16} /> {error}</div>}
        {success && <div className="lg-alert-ok"><CheckCircle size={16} /> {success}</div>}

        {/* ── FORMULAIRE CONNEXION ── */}
        {tab === 'connexion' && (
          <form key={`cnx-${fieldKey}`} onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Adresse email" delay={0.05}>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                <input
                  type="email"
                  placeholder="exemple@univ.mg"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  className="lg-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </Field>

            <Field label="Mot de passe" delay={0.1}>
              <PwdInput
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </Field>

            <button type="submit" disabled={loading || !isLoginValid} className="lg-btn">
              {loading ? <><span className="lg-spinner" /> Connexion…</> : 'Se connecter'}
            </button>
          </form>
        )}

        {/* ── FORMULAIRE INSCRIPTION ── */}
        {tab === 'inscription' && (
          <form key={`ins-${fieldKey}`} onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Nom *" delay={0.05}>
                <input
                  type="text" placeholder="Rakoto" required
                  value={registerForm.nom}
                  onChange={e => setRegisterForm({ ...registerForm, nom: e.target.value })}
                  className="lg-input"
                />
              </Field>
              <Field label="Prénom *" delay={0.08}>
                <input
                  type="text" placeholder="Jean" required
                  value={registerForm.prenom}
                  onChange={e => setRegisterForm({ ...registerForm, prenom: e.target.value })}
                  className="lg-input"
                />
              </Field>
            </div>

            <Field label="Adresse email *" delay={0.11}>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                <input
                  type="email" placeholder="jean.rakoto@univ.mg" required
                  value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="lg-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </Field>

            <Field label="Rôle *" delay={0.14}>
              <div style={{ position: 'relative' }}>
                <Users size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6, pointerEvents: 'none' }} />
                <select
                  value={registerForm.role}
                  onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}
                  required
                  className="lg-input lg-select"
                  style={{ paddingLeft: 36 }}
                >
                  <option value="secretaire">Secrétaire</option>
                  <option value="enseignant">Enseignant</option>
                  <option value="administrateur">Administrateur</option>
                </select>
              </div>
            </Field>

            <Field
              label={<>Mot de passe * <span style={{ fontWeight: 400, opacity: .7 }}>(min. 6 caractères)</span></>}
              delay={0.17}
            >
              <PwdInput
                value={registerForm.password}
                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                minLength={6}
              />
              <div className="lg-pwd-track">
                <div
                  className="lg-pwd-bar"
                  style={{
                    width:      strength ? strength.width : '0%',
                    background: strength ? strength.color : 'transparent',
                  }}
                />
              </div>
              {strength && (
                <span style={{ fontSize: 11, color: strength.color, marginTop: 2 }}>
                  {strength.label}
                </span>
              )}
            </Field>

            <Field label="Confirmer le mot de passe *" delay={0.2}>
              <PwdInput
                value={registerForm.confirmPassword}
                onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                required
                hasError={!!pwdMatch}
              />
              {pwdMatch && (
                <span style={{ fontSize: 12, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AlertCircle size={12} /> Les mots de passe ne correspondent pas
                </span>
              )}
              {registerForm.confirmPassword && !pwdMatch && registerForm.password && (
                <span style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <CheckCircle size={12} /> Les mots de passe correspondent
                </span>
              )}
            </Field>

            {registerForm.role === 'administrateur' && (
              <div style={{
                background: 'rgba(79,142,247,.08)', border: '1px solid rgba(79,142,247,.3)',
                borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)',
                animation: 'lgFadeIn .3s ease both',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <AlertCircle size={14} /> ℹ️ La création d'un compte administrateur nécessite un token d'administrateur existant.
              </div>
            )}

            <button type="submit" disabled={loading || !isRegisterValid()} className="lg-btn">
              {loading ? <><span className="lg-spinner" /> Création…</> : 'Créer le compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}