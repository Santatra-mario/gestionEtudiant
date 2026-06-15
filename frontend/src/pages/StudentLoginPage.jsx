// pages/StudentLoginPage.jsx – Portail étudiant (connexion)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../services/api";

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setMsg({ text: "Veuillez remplir tous les champs.", type: "danger" });
      return;
    }
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await api.post("/student/login", form);
      const data = res.data;
      if (data.success) {
        localStorage.setItem("student_token", data.data.token);
        localStorage.setItem("student_user", JSON.stringify(data.data.user));
        setMsg({ text: "Connexion réussie !", type: "success" });
        setTimeout(() => navigate("/etudiant/profil"), 800);
      }
    } catch (err) {
      const msgErr = err.response?.data?.message || "Erreur de connexion.";
      setMsg({ text: msgErr, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1.5px solid var(--border)",
    background: "var(--surface2)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s ease",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #0b0f1a 0%, #1a1040 30%, #1a1a2e 60%, #0b0f1a 100%)",
        backgroundSize: "400% 400%",
        animation: "bgShift 5s ease infinite",
      }}
    >
      <style>{`
        @keyframes bgShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Overlay semi-transparent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Cercles décoratifs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--surface)",
          borderRadius: 20,
          border: "1px solid var(--border)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          padding: "40px 36px",
          position: "relative",
          zIndex: 1,
          animation: "fadeSlideIn 0.4s ease",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(79,142,247,0.3)",
            }}
          >
            <GraduationCap size={30} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text)",
              margin: 0,
            }}
          >
            Portail Étudiant
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
            Connectez-vous pour consulter vos notes et informations
          </p>
        </div>

        {/* Message */}
        {msg.text && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              marginBottom: 16,
              background:
                msg.type === "success"
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(239,68,68,0.12)",
              border: `1px solid ${msg.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              fontSize: 13,
              color: msg.type === "success" ? "#22c55e" : "#ef4444",
              fontWeight: 500,
            }}
          >
            {msg.type === "success" ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {msg.text}
          </div>
        )}

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              <Mail
                size={13}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Email institutionnel
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="votre.email@univ.mg"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.borderColor = "#4f8ef7";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(79,142,247,0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              <Lock
                size={13}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.borderColor = "#4f8ef7";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(79,142,247,0.25)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 12,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading
                ? "var(--surface3)"
                : "linear-gradient(135deg, #1e40af 0%, #6366f1 50%, #1e40af 100%)",
              backgroundSize: "200% 200%",
              animation: loading ? "none" : "bgShift 3s ease infinite",
              color: loading ? "var(--text-muted)" : "#fff",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s ease",
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? "none" : "0 6px 20px rgba(79,142,247,0.4)",
              transform: "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = "0.92";
                e.currentTarget.style.boxShadow =
                  "0 8px 28px rgba(79,142,247,0.55)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(79,142,247,0.4)";
              }
            }}
            onMouseDown={(e) => {
              if (!loading) e.currentTarget.style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              if (!loading) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {loading ? (
              <span
                className="spinner"
                style={{ width: 18, height: 18, borderWidth: 2 }}
              />
            ) : (
              <>
                <LogIn size={18} /> Se connecter
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a
            href="/login"
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            ← Administration
          </a>
        </div>
      </div>
    </div>
  );
}
