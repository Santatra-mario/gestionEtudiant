// components/ui/index.jsx — Bibliothèque de composants UniGest
import { useState, useEffect, Component } from "react";
import ReactDOM from "react-dom";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

/* ═══════════════════════════════════════════════════
   CARD
═══════════════════════════════════════════════════ */
export function Card({ children, style = {}, hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={hover ? "card-hover" : ""}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: 24,
        boxShadow: "var(--shadow-sm)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE HEADER
═══════════════════════════════════════════════════ */
export function PageHeader({ title, subtitle, action, back }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 32,
        paddingBottom: 20,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {back && (
          <button
            onClick={back}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--text-muted)",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              transition: "all var(--transition)",
              marginTop: 4,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface3)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface2)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            ←
          </button>
        )}
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              color: "var(--text)",
              marginBottom: 4,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BUTTON
═══════════════════════════════════════════════════ */
export function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  small = false,
  style = {},
  loading = false,
  icon,
}) {
  const [pressed, setPressed] = useState(false);

  const variants = {
    primary: {
      bg: "var(--accent)",
      hover: "var(--accent-dark)",
      color: "#fff",
    },
    danger: { bg: "var(--danger)", hover: "#dc2626", color: "#fff" },
    success: { bg: "var(--success)", hover: "#16a34a", color: "#fff" },
    ghost: {
      bg: "var(--surface2)",
      hover: "var(--surface3)",
      color: "var(--text)",
      border: "1px solid var(--border)",
    },
    outline: {
      bg: "transparent",
      hover: "rgba(79,142,247,.1)",
      color: "var(--accent)",
      border: "1px solid var(--accent)",
    },
  };
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = v.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = v.bg;
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: v.bg,
        color: v.color,
        border: v.border || "none",
        borderRadius: "var(--radius-sm)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: small ? 13 : 14,
        padding: small ? "7px 14px" : "10px 20px",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        opacity: disabled && !loading ? 0.45 : 1,
        transition: "background 0.15s, transform 0.1s, box-shadow 0.15s",
        transform: pressed && !disabled ? "scale(0.97)" : "scale(1)",
        boxShadow:
          variant === "primary" && !disabled
            ? "0 2px 8px rgba(79,142,247,0.3)"
            : "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {loading ? (
        <>
          <span className="spinner spinner-sm" /> Chargement…
        </>
      ) : (
        <>
          {icon && icon}
          {children}
        </>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   INPUT
═══════════════════════════════════════════════════ */
export function Input({
  label,
  error,
  hint,
  icon: Icon,
  suffix,
  required: req,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: error
              ? "var(--danger)"
              : focused
                ? "var(--accent-light)"
                : "var(--text-soft)",
            transition: "color var(--transition)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {label}
          {req && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
      )}
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        {Icon && (
          <Icon
            size={15}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: focused ? "var(--accent-light)" : "var(--text-muted)",
              transition: "color var(--transition)",
              pointerEvents: "none",
              flexShrink: 0,
            }}
          />
        )}
        <input
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={error ? "modal-shake" : ""}
          style={{
            background: focused ? "rgba(79,142,247,0.06)" : "var(--surface2)",
            border: `1.5px solid ${error ? "var(--danger)" : focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
            padding: `10px ${suffix ? "36px" : "13px"} 10px ${Icon ? "34px" : "13px"}`,
            fontSize: 14,
            width: "100%",
            outline: "none",
            transition: "all var(--transition)",
            boxShadow: focused ? "0 0 0 3px rgba(79,142,247,0.18)" : "none",
          }}
        />
        {suffix && (
          <span
            style={{
              position: "absolute",
              right: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              fontSize: 13,
              pointerEvents: "none",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span
          style={{
            fontSize: 12,
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <AlertCircle size={12} /> {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SELECT
═══════════════════════════════════════════════════ */
export function Select({
  label,
  error,
  hint,
  children,
  icon: Icon,
  required: req,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: error
              ? "var(--danger)"
              : focused
                ? "var(--accent-light)"
                : "var(--text-soft)",
            transition: "color var(--transition)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {label}
          {req && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon
            size={15}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: focused ? "var(--accent-light)" : "var(--text-muted)",
              transition: "color var(--transition)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}
        <select
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={{
            background: focused ? "rgba(79,142,247,0.06)" : "var(--surface2)",
            border: `1.5px solid ${error ? "var(--danger)" : focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
            padding: `10px 36px 10px ${Icon ? "34px" : "13px"}`,
            fontSize: 14,
            width: "100%",
            outline: "none",
            appearance: "none",
            cursor: "pointer",
            transition: "all var(--transition)",
            boxShadow: focused ? "0 0 0 3px rgba(79,142,247,0.18)" : "none",
          }}
        >
          {children}
        </select>
        {/* Flèche custom */}
        <div
          style={{
            position: "absolute",
            right: 11,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--text-muted)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {error && (
        <span
          style={{
            fontSize: 12,
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <AlertCircle size={12} /> {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TEXTAREA
═══════════════════════════════════════════════════ */
export function Textarea({
  label,
  error,
  hint,
  rows = 3,
  required: req,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: error
              ? "var(--danger)"
              : focused
                ? "var(--accent-light)"
                : "var(--text-soft)",
            transition: "color var(--transition)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {label}
          {req && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
      )}
      <textarea
        {...props}
        rows={rows}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={{
          background: focused ? "rgba(79,142,247,0.06)" : "var(--surface2)",
          border: `1.5px solid ${error ? "var(--danger)" : focused ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          color: "var(--text)",
          padding: "10px 13px",
          fontSize: 14,
          width: "100%",
          outline: "none",
          resize: "vertical",
          transition: "all var(--transition)",
          boxShadow: focused ? "0 0 0 3px rgba(79,142,247,0.18)" : "none",
          fontFamily: "var(--font-body)",
        }}
      />
      {error && (
        <span
          style={{
            fontSize: 12,
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <AlertCircle size={12} /> {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BADGE
═══════════════════════════════════════════════════ */
export function Badge({ children, color = "accent", dot = false }) {
  const colors = {
    accent: {
      bg: "rgba(79,142,247,0.15)",
      text: "var(--accent-light)",
      dot: "#4f8ef7",
    },
    success: { bg: "rgba(34,197,94,0.14)", text: "#4ade80", dot: "#22c55e" },
    warning: { bg: "rgba(245,158,11,0.14)", text: "#fbbf24", dot: "#f59e0b" },
    danger: { bg: "rgba(239,68,68,0.14)", text: "#f87171", dot: "#ef4444" },
    muted: {
      bg: "rgba(122,138,170,0.14)",
      text: "var(--text-muted)",
      dot: "#7a8aaa",
    },
    info: { bg: "rgba(6,182,212,0.14)", text: "#22d3ee", dot: "#06b6d4" },
  };
  const c = colors[color] || colors.accent;
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   TABLE
═══════════════════════════════════════════════════ */
export function Table({ headers, children, empty = "Aucun résultat." }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
      >
        <thead>
          <tr style={{ background: "var(--surface2)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: "11px 16px",
                  textAlign: "left",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: 11.5,
                  borderBottom: "1px solid var(--border)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children || (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  padding: "48px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick, style = {} }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: "1px solid var(--border)",
        cursor: onClick ? "pointer" : "default",
        transition: "background var(--transition)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = "rgba(79,142,247,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </tr>
  );
}

export function Td({ children, style = {} }) {
  return (
    <td
      style={{
        padding: "13px 16px",
        color: "var(--text)",
        verticalAlign: "middle",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

/* ═══════════════════════════════════════════════════
   MODAL — Portal ReactDOM (rendu dans #modal-root)
   Garantit le rendu au-dessus de tout élément Layout
═══════════════════════════════════════════════════ */
export function Modal({ title, children, onClose, width = 520, subtitle }) {
  // Bloquer le scroll body quand la modal est ouverte
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Cible du portal : #modal-root ou document.body en fallback
  const portalTarget = document.getElementById("modal-root") || document.body;

  const content = (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          width: "100%",
          maxWidth: width,
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          animation: "modalIn 0.28s cubic-bezier(0.34,1.4,0.64,1)",
          boxShadow: "var(--shadow-modal)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* ── En-tête collant ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                color: "var(--text)",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--text-muted)",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--transition)",
              flexShrink: 0,
              marginLeft: 12,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
              e.currentTarget.style.color = "var(--danger)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface2)";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <X size={16} />
          </button>
        </div>
        {/* ── Corps scrollable ── */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, portalTarget);
}

/* ═══════════════════════════════════════════════════
   ERROR BOUNDARY — empêche le crash total de l'app
═══════════════════════════════════════════════════ */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(239,68,68,0.3)",
            margin: "20px auto",
            maxWidth: 520,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h3
            style={{
              color: "var(--danger)",
              marginBottom: 8,
              fontFamily: "var(--font-display)",
            }}
          >
            Une erreur est survenue
          </h3>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {this.state.error?.message || "Erreur inattendue."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════ */
export function StatCard({
  label,
  value,
  sub,
  color = "var(--accent)",
  icon: Icon,
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        borderLeft: `3px solid ${color}`,
        transition: "transform var(--transition), box-shadow var(--transition)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div
          style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}
        >
          {label}
        </div>
        {Icon && <Icon size={18} color={color} />}
      </div>
      <div
        style={{
          fontSize: 30,
          fontFamily: "var(--font-display)",
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ALERT
═══════════════════════════════════════════════════ */
export function Alert({ children, type = "danger" }) {
  const map = {
    danger: {
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.3)",
      text: "#fca5a5",
      Icon: AlertCircle,
      iconColor: "#ef4444",
    },
    success: {
      bg: "rgba(34,197,94,0.1)",
      border: "rgba(34,197,94,0.3)",
      text: "#86efac",
      Icon: CheckCircle,
      iconColor: "#22c55e",
    },
    warning: {
      bg: "rgba(245,158,11,0.1)",
      border: "rgba(245,158,11,0.3)",
      text: "#fcd34d",
      Icon: AlertTriangle,
      iconColor: "#f59e0b",
    },
    info: {
      bg: "rgba(6,182,212,0.1)",
      border: "rgba(6,182,212,0.3)",
      text: "#67e8f9",
      Icon: Info,
      iconColor: "#06b6d4",
    },
  };
  const c = map[type] || map.danger;
  const { Icon } = c;
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "var(--radius-sm)",
        padding: "11px 14px",
        color: c.text,
        fontSize: 14,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        animation: "slideDown 0.2s ease",
      }}
    >
      <Icon
        size={16}
        color={c.iconColor}
        style={{ flexShrink: 0, marginTop: 1 }}
      />
      <span>{children}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SPINNER
═══════════════════════════════════════════════════ */
export function Spinner({ text = "" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px 24px",
        gap: 14,
      }}
    >
      <span className="spinner" />
      {text && (
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{text}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FORM ROW (grille 2 colonnes responsive)
═══════════════════════════════════════════════════ */
export function FormRow({ children, cols = 2 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FORM SECTION — groupe de champs avec titre
═══════════════════════════════════════════════════ */
export function FormSection({ title, icon: Icon, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingBottom: 8,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {Icon && <Icon size={15} color="var(--accent)" />}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DIVIDER
═══════════════════════════════════════════════════ */
export function Divider({ label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "4px 0",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      {label && (
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════ */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        gap: 12,
        textAlign: "center",
      }}
    >
      {Icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(79,142,247,0.1)",
            border: "1px solid rgba(79,142,247,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <Icon size={24} color="var(--accent)" />
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOOLTIP WRAPPER simple
═══════════════════════════════════════════════════ */
export function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div
          style={{
            position: "absolute",
            bottom: "110%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(20,28,50,0.95)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            padding: "5px 10px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 99999,
            animation: "fadeIn 0.15s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
