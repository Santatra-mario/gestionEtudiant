import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── Styles dynamiques avec support du thème ─────────────────────────────────
const getStyles = (isDark) => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');

  :root {
    --uni-bg:          ${isDark ? "#0b1120" : "#f0f4f8"};
    --uni-surface:     ${isDark ? "rgba(17, 24, 39, 0.65)" : "rgba(255, 255, 255, 0.65)"};
    --uni-surface2:    ${isDark ? "rgba(26, 37, 56, 0.7)" : "rgba(248, 250, 252, 0.7)"};
    --uni-border:      ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"};
    --uni-border-h:    ${isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)"};
    --uni-accent:      #c9a227;
    --uni-accent-dark: #a07c18;
    --uni-accent-glow: ${isDark ? "rgba(201,162,39,0.25)" : "rgba(201,162,39,0.2)"};
    --uni-text:        ${isDark ? "#f0eadc" : "#000000"};
    --uni-text-muted:  ${isDark ? "#a0aec0" : "#4a5568"};
    --uni-danger:      #e57373;
    --uni-success:     #4caf7d;
    --uni-navy:        ${isDark ? "rgba(22, 32, 64, 0.7)" : "rgba(226, 232, 240, 0.7)"};
    --uni-navy-light:  ${isDark ? "rgba(30, 45, 82, 0.7)" : "rgba(241, 245, 249, 0.7)"};
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

  .lg-card     { animation: lgSlideUp .5s cubic-bezier(.16,1,.3,1) both; font-family: var(--font-body); backdrop-filter: blur(8px); }
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
    backdrop-filter: blur(4px);
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
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${isDark ? "%23a0aec0" : "%234a5568"}' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
    cursor: pointer;
  }
  .lg-select option { background: var(--uni-surface2); color: var(--uni-text); }

  .lg-btn {
    width: 100%; padding: 12px 20px;
    background: linear-gradient(135deg, var(--uni-accent), var(--uni-accent-dark));
    color: ${isDark ? "#0b1120" : "#ffffff"};
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
    border-top-color: ${isDark ? "#0b1120" : "#ffffff"};
    border-radius: 50%;
    animation: lgSpin .7s linear infinite;
  }

  .lg-tab-active {
    background: linear-gradient(135deg, var(--uni-accent), var(--uni-accent-dark)) !important;
    color: ${isDark ? "#0b1120" : "#ffffff"} !important;
    transform: scale(1.02);
    box-shadow: 0 2px 12px var(--uni-accent-glow);
  }
  .lg-tab-inactive { background: rgba(255,255,255,0.1); color: var(--uni-text-muted); backdrop-filter: blur(4px); }
  .lg-tab-inactive:hover { color: var(--uni-text); background: rgba(255,255,255,0.2); }

  .lg-alert-err {
    animation: lgShake .4s both;
    background: rgba(229,115,115,.2);
    border: 1px solid var(--uni-danger);
    border-radius: 8px; padding: 10px 14px;
    color: ${isDark ? "#ffb3b3" : "#c62828"};
    font-size: 14px; margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
    backdrop-filter: blur(4px);
  }
  .lg-alert-ok {
    animation: lgFadeIn .3s ease both;
    background: rgba(76,175,125,.2);
    border: 1px solid var(--uni-success);
    border-radius: 8px; padding: 10px 14px;
    color: ${isDark ? "#a7f3ce" : "#2e7d32"};
    font-size: 14px; margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
    backdrop-filter: blur(4px);
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
    pointer-events: none; filter: blur(80px); opacity: 0.2;
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
    opacity: 0.12;
  }

  .lg-divider {
    width: 48px; height: 2px;
    background: linear-gradient(90deg, var(--uni-accent), transparent);
    border-radius: 2px;
    margin: 6px auto 0;
  }

  .lg-admin-notice {
    background: rgba(201,162,39,.15);
    border: 1px solid rgba(201,162,39,.3);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--uni-text-muted);
    animation: lgFadeIn .3s ease both;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-body);
    backdrop-filter: blur(4px);
  }

  .lg-label {
    font-size: 12px;
    color: var(--uni-text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: var(--font-body);
  }

  .lg-field-err {
    font-size: 11px;
    color: #ffb3b3;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-weight: 500;
    animation: lgFadeIn .2s ease both;
  }
`;

// ── Utilitaire : force du mot de passe ──────────────────────────────────────
function passwordStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: "Très faible", color: "#e24b4a", width: "20%" },
    { label: "Faible", color: "#ef9f27", width: "40%" },
    { label: "Moyen", color: "#facc15", width: "60%" },
    { label: "Fort", color: "#4ade80", width: "80%" },
    { label: "Très fort", color: "#22c55e", width: "100%" },
  ];
  return levels[Math.min(score - 1, 4)];
}

// ── Effet ripple sur bouton ──────────────────────────────────────────────────
function addRipple(btn, e) {
  const r = document.createElement("span");
  r.className = "lg-ripple";
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

// ── NOUVEAU : Validation champ texte (pas d'espace ni caractères spéciaux) ──
// Autorise : lettres (avec accents), chiffres, tirets, apostrophes
// Interdit  : espaces, et tout autre caractère spécial
const TEXT_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'\-]+$/;

function validateTextField(value) {
  if (!value) return null;
  if (/\s/.test(value)) return "Les espaces ne sont pas autorisés";
  if (!TEXT_REGEX.test(value))
    return "Caractères spéciaux non autorisés (ex: /* ; : ! …)";
  return null;
}

// ── NOUVEAU : Validation mot de passe (pas d'espace) ────────────────────────
function validatePasswordField(value) {
  if (!value) return null;
  if (/\s/.test(value))
    return "Les espaces ne sont pas autorisés dans le mot de passe";
  return null;
}

// ── Icône d'erreur inline ────────────────────────────────────────────────────
function ErrIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      style={{ width: 11, height: 11, flexShrink: 0 }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// ── Composant champ avec label ───────────────────────────────────────────────
function Field({ label, delay = 0, children }) {
  return (
    <div
      className="lg-field"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        animationDelay: `${delay}s`,
      }}
    >
      <label className="lg-label" style={{ fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Composant input mot de passe avec icônes ─────────────────────────────────
function PwdInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  hasError,
  ...rest
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--uni-accent)",
          opacity: 1,
          width: 16,
          height: 16,
          pointerEvents: "none",
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`lg-input${hasError ? " lg-err" : ""}`}
        style={{ paddingRight: 40, paddingLeft: 38 }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "var(--uni-text-muted)",
          cursor: "pointer",
          padding: 0,
          fontSize: 16,
          lineHeight: 1,
          transition: "transform .15s, color .15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
          e.currentTarget.style.color = "var(--uni-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.color = "var(--uni-text-muted)";
        }}
      >
        {show ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ width: 16, height: 16 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ width: 16, height: 16 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Configuration des 2 machines (Administrateur / Secrétaire) ───────────────
const MACHINE_CONFIG = {
  administrateur: {
    label: "Administrateur",
    subtitle: "Accès complet au système",
    accent: "#4f8ef7",
    accentDark: "#2d6ee0",
    accentGlow: "rgba(79,142,247,0.25)",
    badge: "⚙️ Poste Administration",
    description: "Accès complet",
  },
  secretaire: {
    label: "Secrétaire",
    subtitle: "Gestion étudiants & inscriptions",
    accent: "#22c55e",
    accentDark: "#16a34a",
    accentGlow: "rgba(34,197,94,0.25)",
    badge: "📋 Poste Secrétariat",
    description: "Gestion étudiants",
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  // ── Machine sélectionnée (null = écran de choix) ─────────────────────────
  const [machine, setMachine] = useState(null);

  const [tab, setTab] = useState("connexion");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "secretaire",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [fieldKey, setFieldKey] = useState(0);

  // ── NOUVEAU : erreurs dynamiques par champ ───────────────────────────────
  const [loginFieldErrors, setLoginFieldErrors] = useState({ password: "" });
  const [registerFieldErrors, setRegisterFieldErrors] = useState({
    nom: "",
    prenom: "",
    password: "",
    confirmPassword: "",
  });

  const switchTab = (t) => {
    setTab(t);
    setError("");
    setSuccess("");
    setFieldKey((k) => k + 1);
    setLoginFieldErrors({ password: "" });
    setRegisterFieldErrors({
      nom: "",
      prenom: "",
      password: "",
      confirmPassword: "",
    });
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  useEffect(() => {
    const id = "lg-styles";
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const el = document.createElement("style");
    el.id = id;
    el.textContent = getStyles(isDarkMode);
    document.head.appendChild(el);

    return () => {
      if (document.getElementById(id)) document.getElementById(id).remove();
    };
  }, [isDarkMode]);

  // ── NOUVEAU : handlers avec validation en temps réel ────────────────────

  const handleLoginPasswordChange = (e) => {
    const val = e.target.value;
    setLoginForm({ ...loginForm, password: val });
    setLoginFieldErrors((prev) => ({
      ...prev,
      password: validatePasswordField(val) || "",
    }));
  };

  const handleRegisterNomChange = (e) => {
    const val = e.target.value;
    setRegisterForm({ ...registerForm, nom: val });
    setRegisterFieldErrors((prev) => ({
      ...prev,
      nom: validateTextField(val) || "",
    }));
  };

  const handleRegisterPrenomChange = (e) => {
    const val = e.target.value;
    setRegisterForm({ ...registerForm, prenom: val });
    setRegisterFieldErrors((prev) => ({
      ...prev,
      prenom: validateTextField(val) || "",
    }));
  };

  const handleRegisterPasswordChange = (e) => {
    const val = e.target.value;
    setRegisterForm({ ...registerForm, password: val });
    setRegisterFieldErrors((prev) => ({
      ...prev,
      password: validatePasswordField(val) || "",
    }));
  };

  const handleRegisterConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setRegisterForm({ ...registerForm, confirmPassword: val });
    setRegisterFieldErrors((prev) => ({
      ...prev,
      confirmPassword: validatePasswordField(val) || "",
    }));
  };

  // ── NOUVEAU : vérification globale des erreurs champ ────────────────────
  const hasRegisterFieldError = () =>
    !!(
      registerFieldErrors.nom ||
      registerFieldErrors.prenom ||
      registerFieldErrors.password ||
      registerFieldErrors.confirmPassword
    );

  const isLoginValid =
    loginForm.email.trim() !== "" &&
    loginForm.password.trim() !== "" &&
    !loginFieldErrors.password;

  const isRegisterValid = () => {
    const { nom, prenom, email, password, confirmPassword, role } =
      registerForm;
    const allFieldsFilled =
      nom.trim() &&
      prenom.trim() &&
      email.trim() &&
      password &&
      confirmPassword &&
      role;
    const passwordsMatch = password === confirmPassword;
    const passwordLengthOk = password.length >= 6;
    return (
      allFieldsFilled &&
      passwordsMatch &&
      passwordLengthOk &&
      !hasRegisterFieldError()
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
    if (submitBtn) addRipple(submitBtn, e);
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const loggedUser = await login(loginForm.email, loginForm.password);
      // ── Vérification machine : la secrétaire ne peut pas utiliser le poste Admin
      if (
        machine === "administrateur" &&
        loggedUser?.role !== "administrateur"
      ) {
        setError(
          "Ce compte n'a pas les droits Administrateur. Utilisez le poste Secrétaire.",
        );
        setLoading(false);
        return;
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }
    if (registerForm.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register", {
        nom: registerForm.nom,
        prenom: registerForm.prenom,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role,
      });
      setSuccess(
        "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
      );
      setRegisterForm({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "secretaire",
      });
      setTimeout(() => {
        switchTab("connexion");
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la création du compte.",
      );
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(registerForm.password);
  const pwdMatch =
    registerForm.confirmPassword &&
    registerForm.password !== registerForm.confirmPassword;

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* ===== IMAGE DE FOND ===== */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url('https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          zIndex: 0,
        }}
      />

      {/* ===== OVERLAY TRÈS LÉGER POUR LISIBILITÉ ===== */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode ? "rgba(0,0,0,0.3)" : "rgba(240,244,248,0.3)",
          backdropFilter: "blur(2px)",
          zIndex: 1,
          transition: "background 0.3s ease",
        }}
      />

      {/* Bouton de changement de thème */}
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 1000,
          background: "var(--uni-surface)",
          border: "1px solid var(--uni-border)",
          borderRadius: "50%",
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          color: "var(--uni-accent)",
          backdropFilter: "blur(10px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.borderColor = "var(--uni-accent)";
          e.currentTarget.style.boxShadow = "0 0 15px var(--uni-accent-glow)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.borderColor = "var(--uni-border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {isDarkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ width: 20, height: 20 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ width: 20, height: 20 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* Blobs animés */}
      <div className="lg-blob lg-blob1" style={{ zIndex: 2 }} />
      <div className="lg-blob lg-blob2" style={{ zIndex: 2 }} />
      <div className="lg-blob lg-blob3" style={{ zIndex: 2 }} />

      {/* ===== CONTENU CENTRÉ ===== */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          position: "relative",
          zIndex: 3,
        }}
      >
        {/* ══════════════════════════════════════════════════
            ÉTAPE 1 : Sélection de la machine (si pas encore choisie)
        ══════════════════════════════════════════════════ */}
        {!machine ? (
          <div
            className="lg-card"
            style={{
              background: "var(--uni-surface)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--uni-border)",
              borderRadius: 20,
              padding: "40px 44px",
              width: "100%",
              maxWidth: 480,
              position: "relative",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.1) inset",
            }}
          >
            {/* Ligne dorée décorative */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 40,
                right: 40,
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, var(--uni-accent), transparent)",
                borderRadius: "0 0 2px 2px",
              }}
            />

            {/* Logo & Titre */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                className="lg-logo-box"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: "linear-gradient(145deg, #1e3a8a, #162040)",
                  border: "1.5px solid rgba(201,162,39,0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  color: "var(--uni-accent)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ width: 30, height: 30, strokeWidth: 1.5 }}
                >
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                  />
                </svg>
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  color: "var(--uni-text)",
                  marginBottom: 4,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                  fontWeight: "bold",
                }}
              >
                Gestion Des Étudiants
              </h1>
              <div className="lg-divider" />
              <p
                style={{
                  color: "var(--uni-text-muted)",
                  fontSize: 13,
                  marginTop: 10,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                Sélectionnez votre poste de travail
              </p>
            </div>

            {/* ── Sélecteur de machine ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              {/* Machine Administrateur */}
              <button
                onClick={() => {
                  setMachine("administrateur");
                  setError("");
                  setLoginForm({ email: "", password: "" });
                }}
                style={{
                  flex: 1,
                  padding: "18px 12px",
                  borderRadius: 14,
                  border: "2px solid rgba(79,142,247,0.4)",
                  background: "rgba(79,142,247,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  transition: "all .22s ease",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#4f8ef7";
                  e.currentTarget.style.background = "rgba(79,142,247,0.16)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(79,142,247,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(79,142,247,0.4)";
                  e.currentTarget.style.background = "rgba(79,142,247,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: "rgba(79,142,247,0.15)",
                    border: "1.5px solid rgba(79,142,247,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4f8ef7",
                  }}
                >
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    style={{ width: 24, height: 24 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-2.026-.504-3.94-1.393-5.618L12 2.714z"
                    />
                  </svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--uni-text)",
                      marginBottom: 3,
                    }}
                  >
                    Administrateur
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--uni-text-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    Accès complet
                  </div>
                </div>
              </button>

              {/* Machine Secrétaire */}
              <button
                onClick={() => {
                  setMachine("secretaire");
                  setError("");
                  setLoginForm({ email: "", password: "" });
                }}
                style={{
                  flex: 1,
                  padding: "18px 12px",
                  borderRadius: 14,
                  border: "2px solid rgba(34,197,94,0.4)",
                  background: "rgba(34,197,94,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  transition: "all .22s ease",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#22c55e";
                  e.currentTarget.style.background = "rgba(34,197,94,0.16)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(34,197,94,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)";
                  e.currentTarget.style.background = "rgba(34,197,94,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: "rgba(34,197,94,0.15)",
                    border: "1.5px solid rgba(34,197,94,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#22c55e",
                  }}
                >
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    style={{ width: 24, height: 24 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--uni-text)",
                      marginBottom: 3,
                    }}
                  >
                    Secrétaire
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--uni-text-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    Gestion étudiants
                  </div>
                </div>
              </button>
            </div>

            <p
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--uni-text-muted)",
                opacity: 0.5,
                letterSpacing: "0.04em",
                fontWeight: 500,
              }}
            >
              © {new Date().getFullYear()} Établissement Universitaire · Système
              sécurisé
            </p>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════
            ÉTAPE 2 : Carte de connexion existante (avec badge machine)
        ══════════════════════════════════════════════════ */
          <div
            className="lg-card"
            style={{
              background: "var(--uni-surface)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--uni-border)",
              borderRadius: 20,
              padding: "40px 44px",
              width: "100%",
              maxWidth: 480,
              position: "relative",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.1) inset",
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
          >
            {/* Ligne décorative couleur selon machine */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 40,
                right: 40,
                height: "2px",
                background:
                  machine === "administrateur"
                    ? "linear-gradient(90deg, transparent, #4f8ef7, transparent)"
                    : "linear-gradient(90deg, transparent, #22c55e, transparent)",
                borderRadius: "0 0 2px 2px",
              }}
            />

            {/* ── Badge machine + bouton retour ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 99,
                  background:
                    machine === "administrateur"
                      ? "rgba(79,142,247,0.12)"
                      : "rgba(34,197,94,0.12)",
                  border: `1px solid ${machine === "administrateur" ? "rgba(79,142,247,0.35)" : "rgba(34,197,94,0.35)"}`,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background:
                      machine === "administrateur" ? "#4f8ef7" : "#22c55e",
                    boxShadow: `0 0 6px ${machine === "administrateur" ? "rgba(79,142,247,0.7)" : "rgba(34,197,94,0.7)"}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: machine === "administrateur" ? "#4f8ef7" : "#22c55e",
                    fontFamily: "var(--font-body)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {MACHINE_CONFIG[machine]?.label}
                </span>
              </div>
              {/* Bouton retour pour changer de machine */}
              <button
                onClick={() => {
                  setMachine(null);
                  setError("");
                }}
                title="Changer de poste"
                style={{
                  background: "var(--uni-surface2)",
                  border: "1px solid var(--uni-border)",
                  borderRadius: 8,
                  padding: "5px 10px",
                  cursor: "pointer",
                  color: "var(--uni-text-muted)",
                  fontSize: 12,
                  fontFamily: "var(--font-body)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--uni-text)";
                  e.currentTarget.style.borderColor = "var(--uni-border-h)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--uni-text-muted)";
                  e.currentTarget.style.borderColor = "var(--uni-border)";
                }}
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ width: 13, height: 13 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                Changer
              </button>
            </div>

            {/* Logo & Titre (identique à l'original) */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                className="lg-logo-box"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: "linear-gradient(145deg, #1e3a8a, #162040)",
                  border: "1.5px solid rgba(201,162,39,0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  color: "var(--uni-accent)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ width: 30, height: 30, strokeWidth: 1.5 }}
                >
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                  />
                </svg>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  color: "var(--uni-text)",
                  marginBottom: 4,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                  fontWeight: "bold",
                }}
              >
                Gestion Des Étudiants
              </h1>
              <div className="lg-divider" />
              <p
                style={{
                  color: "var(--uni-text-muted)",
                  fontSize: 13,
                  marginTop: 10,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                Plateforme de gestion universitaire
              </p>
            </div>

            {/* Onglets */}
            <div
              style={{
                display: "flex",
                background: "var(--uni-navy)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--uni-border)",
                borderRadius: 12,
                padding: 4,
                marginBottom: 28,
                gap: 4,
              }}
            >
              {[
                {
                  key: "connexion",
                  label: "Connexion",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ width: 14, height: 14 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ),
                },
                {
                  key: "inscription",
                  label: "Inscription",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ width: 14, height: 14 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ),
                },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => switchTab(key)}
                  className={tab === key ? "lg-tab-active" : "lg-tab-inactive"}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 9,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.03em",
                    transition: "all .22s cubic-bezier(.4,0,.2,1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Messages d'état */}
            {error && (
              <div className="lg-alert-err" style={{ fontWeight: 500 }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ width: 16, height: 16 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="lg-alert-ok" style={{ fontWeight: 500 }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ width: 16, height: 16 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {success}
              </div>
            )}

            {/* FORMULAIRE CONNEXION */}
            {tab === "connexion" && (
              <form
                key={`cnx-${fieldKey}`}
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <Field label="Adresse email" delay={0.05}>
                  <div style={{ position: "relative" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--uni-accent)",
                        opacity: 1,
                        width: 16,
                        height: 16,
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <input
                      type="email"
                      placeholder="exemple@univ.mg"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      required
                      className="lg-input"
                      style={{ paddingLeft: 38, fontWeight: 500 }}
                    />
                  </div>
                </Field>

                <Field label="Mot de passe" delay={0.1}>
                  {/* ── MODIFIÉ : onChange remplacé par handler avec validation ── */}
                  <PwdInput
                    value={loginForm.password}
                    onChange={handleLoginPasswordChange}
                    hasError={!!loginFieldErrors.password}
                    required
                  />
                  {/* ── NOUVEAU : notification dynamique sous le champ ── */}
                  {loginFieldErrors.password && (
                    <span className="lg-field-err">
                      <ErrIcon /> {loginFieldErrors.password}
                    </span>
                  )}
                </Field>

                <button
                  type="submit"
                  disabled={loading || !isLoginValid}
                  className="lg-btn"
                  style={{ fontWeight: "bold" }}
                >
                  {loading ? (
                    <>
                      <span className="lg-spinner" /> Connexion…
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>
            )}

            {/* FORMULAIRE INSCRIPTION */}
            {tab === "inscription" && (
              <form
                key={`ins-${fieldKey}`}
                onSubmit={handleRegister}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <Field label="Nom *" delay={0.05}>
                    {/* ── MODIFIÉ : onChange avec validation ── */}
                    <input
                      type="text"
                      placeholder="Rakoto"
                      required
                      value={registerForm.nom}
                      onChange={handleRegisterNomChange}
                      className={`lg-input${registerFieldErrors.nom ? " lg-err" : ""}`}
                      style={{ fontWeight: 500 }}
                    />
                    {/* ── NOUVEAU : notification dynamique ── */}
                    {registerFieldErrors.nom && (
                      <span className="lg-field-err">
                        <ErrIcon /> {registerFieldErrors.nom}
                      </span>
                    )}
                  </Field>
                  <Field label="Prénom *" delay={0.08}>
                    {/* ── MODIFIÉ : onChange avec validation ── */}
                    <input
                      type="text"
                      placeholder="Jean"
                      required
                      value={registerForm.prenom}
                      onChange={handleRegisterPrenomChange}
                      className={`lg-input${registerFieldErrors.prenom ? " lg-err" : ""}`}
                      style={{ fontWeight: 500 }}
                    />
                    {/* ── NOUVEAU : notification dynamique ── */}
                    {registerFieldErrors.prenom && (
                      <span className="lg-field-err">
                        <ErrIcon /> {registerFieldErrors.prenom}
                      </span>
                    )}
                  </Field>
                </div>

                <Field label="Adresse email *" delay={0.11}>
                  {/* ── EMAIL : inchangé, validation native du navigateur (type="email") ── */}
                  <div style={{ position: "relative" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--uni-accent)",
                        opacity: 1,
                        width: 16,
                        height: 16,
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <input
                      type="email"
                      placeholder="jean.rakoto@univ.mg"
                      required
                      value={registerForm.email}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          email: e.target.value,
                        })
                      }
                      className="lg-input"
                      style={{ paddingLeft: 38, fontWeight: 500 }}
                    />
                  </div>
                </Field>

                <Field label="Rôle *" delay={0.14}>
                  <div style={{ position: "relative" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--uni-accent)",
                        opacity: 1,
                        width: 16,
                        height: 16,
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <select
                      value={registerForm.role}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          role: e.target.value,
                        })
                      }
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
                  label={
                    <>
                      Mot de passe *{" "}
                      <span
                        style={{ fontWeight: 400, opacity: 0.7, fontSize: 11 }}
                      >
                        (min. 6 caractères)
                      </span>
                    </>
                  }
                  delay={0.17}
                >
                  {/* ── MODIFIÉ : onChange avec validation ── */}
                  <PwdInput
                    value={registerForm.password}
                    onChange={handleRegisterPasswordChange}
                    hasError={!!registerFieldErrors.password}
                    required
                    minLength={6}
                  />
                  {/* ── NOUVEAU : notification dynamique ── */}
                  {registerFieldErrors.password && (
                    <span className="lg-field-err">
                      <ErrIcon /> {registerFieldErrors.password}
                    </span>
                  )}
                  <div className="lg-pwd-track">
                    <div
                      className="lg-pwd-bar"
                      style={{
                        width: strength ? strength.width : "0%",
                        background: strength ? strength.color : "transparent",
                      }}
                    />
                  </div>
                  {strength && (
                    <span
                      style={{
                        fontSize: 11,
                        color: strength.color,
                        marginTop: 2,
                        fontWeight: 500,
                      }}
                    >
                      {strength.label}
                    </span>
                  )}
                </Field>

                <Field label="Confirmer le mot de passe *" delay={0.2}>
                  {/* ── MODIFIÉ : onChange avec validation ── */}
                  <PwdInput
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterConfirmPasswordChange}
                    required
                    hasError={
                      !!pwdMatch || !!registerFieldErrors.confirmPassword
                    }
                  />
                  {/* ── NOUVEAU : notification dynamique espace ── */}
                  {registerFieldErrors.confirmPassword && (
                    <span className="lg-field-err">
                      <ErrIcon /> {registerFieldErrors.confirmPassword}
                    </span>
                  )}
                  {pwdMatch && !registerFieldErrors.confirmPassword && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#ffb3b3",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ width: 12, height: 12 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Les mots de passe ne correspondent pas
                    </span>
                  )}
                  {registerForm.confirmPassword &&
                    !pwdMatch &&
                    registerForm.password &&
                    !registerFieldErrors.confirmPassword && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--uni-success)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                          fontWeight: 500,
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          style={{ width: 12, height: 12 }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Les mots de passe correspondent
                      </span>
                    )}
                </Field>

                {registerForm.role === "administrateur" && (
                  <div className="lg-admin-notice" style={{ fontWeight: 500 }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{
                        width: 14,
                        height: 14,
                        color: "var(--uni-accent)",
                        flexShrink: 0,
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    ℹ️ La création d'un compte administrateur nécessite un token
                    d'administrateur existant.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isRegisterValid()}
                  className="lg-btn"
                  style={{ fontWeight: "bold" }}
                >
                  {loading ? (
                    <>
                      <span className="lg-spinner" /> Création…
                    </>
                  ) : (
                    "Créer le compte"
                  )}
                </button>
              </form>
            )}

            <p
              style={{
                textAlign: "center",
                marginTop: 24,
                fontSize: 11,
                color: "var(--uni-text-muted)",
                opacity: 0.5,
                letterSpacing: "0.04em",
                fontWeight: 500,
              }}
            >
              © {new Date().getFullYear()} Établissement Universitaire · Système
              sécurisé
            </p>
          </div>
        )}{" "}
        {/* fin du ternaire machine */}
      </div>
    </div>
  );
}
