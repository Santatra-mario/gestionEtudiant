import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// ── Styles dynamiques avec support du thème ─────────────────────────────────
const getStyles = (isDark) => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');

  :root {
    --uni-bg:          ${isDark ? '#0b1120' : '#f0f4f8'};
    --uni-surface:     ${isDark ? '#111827' : '#ffffff'};
    --uni-surface2:    ${isDark ? '#1a2538' : '#f8fafc'};
    --uni-border:      ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
    --uni-border-h:    ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)'};
    --uni-accent:      #c9a227;
    --uni-accent-dark: #a07c18;
    --uni-accent-glow: ${isDark ? 'rgba(201,162,39,0.22)' : 'rgba(201,162,39,0.15)'};
    --uni-text:        ${isDark ? '#f0eadc' : '#000000'};
    --uni-text-muted:  ${isDark ? '#8a9ab8' : '#4a5568'};
    --uni-danger:      #e57373;
    --uni-success:     #4caf7d;
    --uni-navy:        ${isDark ? '#162040' : '#e2e8f0'};
    --uni-navy-light:  ${isDark ? '#1e2d52' : '#f1f5f9'};
    --font-display:    'Playfair Display', Georgia, serif;
    --font-body:       'DM Sans', system-ui, sans-serif;
  }

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
  @keyframes lgGlow {
    0%,100% { box-shadow: 0 0 18px var(--uni-accent-glow); }
    50%     { box-shadow: 0 0 36px var(--uni-accent-glow), 0 0 6px rgba(201,162,39,.35); }
  }

  .lg-card     { animation: lgSlideUp .5s cubic-bezier(.16,1,.3,1) both; font-family: var(--font-body); }
  .lg-logo-box { animation: lgPopIn .6s cubic-bezier(.34,1.56,.64,1) .2s both, lgGlow 3s ease-in-out 1s infinite; }

  .lg-field { animation: lgFadeIn .3s ease both; }

  .lg-input {
    width: 100%; padding: 10px 12px;
    border: 1px solid var(--uni-border);
    border-radius: 8px;
    background: var(--uni-surface2);
    color: var(--uni-text);
    font-size: 14px;
    font-family: var(--font-body);
    outline: none;
    box-sizing: border-box;
    transition: border-color .18s, box-shadow .18s, transform .12s;
  }
  .lg-input::placeholder { color: var(--uni-text-muted); opacity: 0.6; }
  .lg-input:hover  { border-color: var(--uni-border-h); }
  .lg-input:focus  {
    border-color: var(--uni-accent);
    box-shadow: 0 0 0 3px var(--uni-accent-glow);
    transform: scale(1.012);
  }
  .lg-input.lg-err {
    border-color: var(--uni-danger) !important;
    box-shadow: 0 0 0 3px rgba(229,115,115,.14);
  }

  .lg-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${isDark ? '%238a9ab8' : '%234a5568'}' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
    cursor: pointer;
  }
  .lg-select option { background: var(--uni-surface2); color: var(--uni-text); }

  .lg-btn {
    width: 100%; padding: 12px 20px;
    background: linear-gradient(135deg, var(--uni-accent), var(--uni-accent-dark));
    color: ${isDark ? '#0b1120' : '#ffffff'};
    border: none; border-radius: 8px;
    font-size: 15px; font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .15s, transform .12s, filter .15s, box-shadow .2s;
    margin-top: 4px;
    letter-spacing: 0.02em;
  }
  .lg-btn:hover:not(:disabled)  { transform: translateY(-2px); box-shadow: 0 6px 20px var(--uni-accent-glow); filter: brightness(1.08); }
  .lg-btn:active:not(:disabled) { transform: scale(.98); }
  .lg-btn:disabled               { opacity: .5; cursor: not-allowed; }

  .lg-ripple {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.22);
    transform: scale(0);
    animation: lgRipple .55s linear;
  }

  .lg-spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(11,17,32,.35);
    border-top-color: ${isDark ? '#0b1120' : '#ffffff'};
    border-radius: 50%;
    animation: lgSpin .7s linear infinite;
  }

  .lg-tab-active {
    background: linear-gradient(135deg, var(--uni-accent), var(--uni-accent-dark)) !important;
    color: ${isDark ? '#0b1120' : '#ffffff'} !important;
    transform: scale(1.02);
    box-shadow: 0 2px 12px var(--uni-accent-glow);
  }
  .lg-tab-inactive { background: transparent; color: var(--uni-text-muted); }
  .lg-tab-inactive:hover { color: var(--uni-text); background: rgba(255,255,255,.04); }

  .lg-alert-err {
    animation: lgShake .4s both;
    background: rgba(229,115,115,.10);
    border: 1px solid var(--uni-danger);
    border-radius: 8px; padding: 10px 14px;
    color: ${isDark ? '#ffb3b3' : '#c62828'};
    font-size: 14px; margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
  }
  .lg-alert-ok {
    animation: lgFadeIn .3s ease both;
    background: rgba(76,175,125,.10);
    border: 1px solid var(--uni-success);
    border-radius: 8px; padding: 10px 14px;
    color: ${isDark ? '#a7f3ce' : '#2e7d32'};
    font-size: 14px; margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
  }

  .lg-pwd-track {
    height: 3px; border-radius: 2px; margin-top: 5px;
    background: var(--uni-border); overflow: hidden;
  }
  .lg-pwd-bar {
    height: 100%; border-radius: 2px;
    transition: width .4s cubic-bezier(.4,0,.2,1), background .3s;
  }

  .lg-blob {
    position: fixed; border-radius: 50%;
    pointer-events: none; filter: blur(80px); opacity: .1;
  }
  .lg-blob1 {
    width: 560px; height: 560px;
    background: #1e3a8a;
    top: -200px; right: -200px;
    animation: lgDrift1 10s ease-in-out infinite;
  }
  .lg-blob2 {
    width: 380px; height: 380px;
    background: #c9a227;
    bottom: -140px; left: -140px;
    animation: lgDrift2 12s ease-in-out infinite;
  }
  .lg-blob3 {
    width: 260px; height: 260px;
    background: #162040;
    top: 45%; left: 30%;
    animation: lgDrift1 14s ease-in-out 2s infinite;
    opacity: .07;
  }

  .lg-divider {
    width: 48px; height: 2px;
    background: linear-gradient(90deg, var(--uni-accent), transparent);
    border-radius: 2px;
    margin: 6px auto 0;
  }

  .lg-admin-notice {
    background: rgba(201,162,39,.08);
    border: 1px solid rgba(201,162,39,.25);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--uni-text-muted);
    animation: lgFadeIn .3s ease both;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-body);
  }

  .lg-label {
    font-size: 12px;
    color: var(--uni-text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: var(--font-body);
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
      <label className="lg-label" style={{ fontWeight: 600 }}>{label}</label>
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
          background: 'none', border: 'none', color: 'var(--uni-text-muted)',
          cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1,
          transition: 'transform .15s, color .15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.color = 'var(--uni-accent)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(-50%)'; e.currentTarget.style.color = 'var(--uni-text-muted)' }}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true // Default to dark mode
  })

  const [tab, setTab] = useState('connexion')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    nom: '', prenom: '', email: '', password: '', confirmPassword: '', role: 'secretaire',
  })

  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const [fieldKey, setFieldKey] = useState(0)

  const switchTab = (t) => {
    setTab(t)
    setError('')
    setSuccess('')
    setFieldKey(k => k + 1)
  }

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      return newTheme
    })
  }

  // Injecte les styles CSS à chaque changement de thème
  useEffect(() => {
    const id = 'lg-styles'
    const existing = document.getElementById(id)
    if (existing) existing.remove()
    
    const el = document.createElement('style')
    el.id = id
    el.textContent = getStyles(isDarkMode)
    document.head.appendChild(el)
    
    return () => {
      if (document.getElementById(id)) document.getElementById(id).remove()
    }
  }, [isDarkMode])

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
      justifyContent: 'center',
      background: 'var(--uni-bg)',
      padding: 20,
      fontFamily: 'var(--font-body)',
      transition: 'background 0.3s ease',
    }}>
      {/* Bouton de changement de thème avec icônes Tailwind */}
      <button 
        onClick={toggleTheme} 
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          background: 'var(--uni-surface)',
          border: '1px solid var(--uni-border)',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          color: 'var(--uni-accent)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.borderColor = 'var(--uni-accent)'
          e.currentTarget.style.boxShadow = '0 0 15px var(--uni-accent-glow)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.borderColor = 'var(--uni-border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Blobs animés */}
      <div className="lg-blob lg-blob1" />
      <div className="lg-blob lg-blob2" />
      <div className="lg-blob lg-blob3" />

      {/* Carte principale */}
      <div
        className="lg-card"
        style={{
          background: 'var(--uni-surface)',
          border: '1px solid var(--uni-border)',
          borderRadius: 20,
          padding: '40px 44px',
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Ligne dorée décorative en haut de la carte */}
        <div style={{
          position: 'absolute', top: 0, left: 40, right: 40, height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--uni-accent), transparent)',
          borderRadius: '0 0 2px 2px',
        }} />

        {/* Logo & Titre */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            className="lg-logo-box"
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(145deg, #1e3a8a, #162040)',
              border: '1.5px solid rgba(201,162,39,0.4)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
              color: 'var(--uni-accent)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 30, height: 30, strokeWidth: 1.5 }}>
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            color: 'var(--uni-text)',
            marginBottom: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            fontWeight: 'bold'
          }}>
            Gestion Des Étudiants
          </h1>
          <div className="lg-divider" />
          <p style={{ color: 'var(--uni-text-muted)', fontSize: 13, marginTop: 10, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>
            Plateforme de gestion universitaire
          </p>
        </div>

        {/* Onglets */}
        <div style={{
          display: 'flex',
          background: 'var(--uni-navy)',
          border: '1px solid var(--uni-border)',
          borderRadius: 12, padding: 4, marginBottom: 28, gap: 4,
        }}>
          {[
            { key: 'connexion', label: 'Connexion', icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) },
            { key: 'inscription', label: 'Inscription', icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={tab === key ? 'lg-tab-active' : 'lg-tab-inactive'}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.03em',
                transition: 'all .22s cubic-bezier(.4,0,.2,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Messages d'état */}
        {error && (
          <div className="lg-alert-err" style={{ fontWeight: 500 }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="lg-alert-ok" style={{ fontWeight: 500 }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* ── FORMULAIRE CONNEXION ── */}
        {tab === 'connexion' && (
          <form key={`cnx-${fieldKey}`} onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Adresse email" delay={0.05}>
              <div style={{ position: 'relative' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--uni-accent)', opacity: 0.7, width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  placeholder="exemple@univ.mg"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  className="lg-input"
                  style={{ paddingLeft: 38, fontWeight: 500 }}
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

            <button type="submit" disabled={loading || !isLoginValid} className="lg-btn" style={{ fontWeight: 'bold' }}>
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
                  style={{ fontWeight: 500 }}
                />
              </Field>
              <Field label="Prénom *" delay={0.08}>
                <input
                  type="text" placeholder="Jean" required
                  value={registerForm.prenom}
                  onChange={e => setRegisterForm({ ...registerForm, prenom: e.target.value })}
                  className="lg-input"
                  style={{ fontWeight: 500 }}
                />
              </Field>
            </div>

            <Field label="Adresse email *" delay={0.11}>
              <div style={{ position: 'relative' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--uni-accent)', opacity: 0.7, width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email" placeholder="jean.rakoto@univ.mg" required
                  value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="lg-input"
                  style={{ paddingLeft: 38, fontWeight: 500 }}
                />
              </div>
            </Field>

            <Field label="Rôle *" delay={0.14}>
              <div style={{ position: 'relative' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--uni-accent)', opacity: 0.7, width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <select
                  value={registerForm.role}
                  onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}
                  required
                  className="lg-input lg-select"
                  style={{ paddingLeft: 38, fontWeight: 500 }}
                >
                  <option value="secretaire">Secrétaire</option>
                  <option value="enseignant">Enseignant</option>
                  <option value="administrateur">Administrateur</option>
                </select>
              </div>
            </Field>

            <Field
              label={<>Mot de passe * <span style={{ fontWeight: 400, opacity: .7, fontSize: 11 }}>(min. 6 caractères)</span></>}
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
                <span style={{ fontSize: 11, color: strength.color, marginTop: 2, fontWeight: 500 }}>
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
                <span style={{ fontSize: 12, color: '#ffb3b3', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontWeight: 500 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 12, height: 12 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Les mots de passe ne correspondent pas
                </span>
              )}
              {registerForm.confirmPassword && !pwdMatch && registerForm.password && (
                <span style={{ fontSize: 12, color: 'var(--uni-success)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontWeight: 500 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 12, height: 12 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Les mots de passe correspondent
                </span>
              )}
            </Field>

            {registerForm.role === 'administrateur' && (
              <div className="lg-admin-notice" style={{ fontWeight: 500 }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 14, height: 14, color: 'var(--uni-accent)', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ℹ️ La création d'un compte administrateur nécessite un token d'administrateur existant.
              </div>
            )}

            <button type="submit" disabled={loading || !isRegisterValid()} className="lg-btn" style={{ fontWeight: 'bold' }}>
              {loading ? <><span className="lg-spinner" /> Création…</> : 'Créer le compte'}
            </button>
          </form>
        )}

        {/* Pied de carte discret */}
        <p style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 11,
          color: 'var(--uni-text-muted)',
          opacity: 0.5,
          letterSpacing: '0.04em',
          fontWeight: 500
        }}>
          © {new Date().getFullYear()} Établissement Universitaire · Système sécurisé
        </p>
      </div>
    </div>
  )
}