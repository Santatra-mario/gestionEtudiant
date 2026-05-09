import { useEffect, useState, useCallback } from "react";
import {
  UserPlus,
  Edit,
  Trash2,
  Power,
  KeyRound,
  X,
  Save,
  ShieldCheck,
  Users,
  Mail,
  Lock,
  Crown,
  ClipboardList,
  GraduationCap,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  PageHeader,
  Btn,
  Table,
  Tr,
  Td,
  Badge,
  Modal,
  Input,
  Select,
  FormRow,
  FormSection,
  Alert,
  Spinner,
  EmptyState,
  Tooltip,
} from "../components/ui";

/* ─── Constantes ─────────────────────────────────────────────────────────── */
const ROLES = ["administrateur", "secretaire", "enseignant"];
const ROLE_COLOR = {
  administrateur: "accent",
  secretaire: "success",
  enseignant: "warning",
};
const ROLE_LABELS = {
  administrateur: "Administrateur",
  secretaire: "Secrétaire",
  enseignant: "Enseignant",
};
const ROLE_ICONS = {
  administrateur: Crown,
  secretaire: ClipboardList,
  enseignant: GraduationCap,
};
const AVATAR_GRAD = {
  administrateur: "linear-gradient(135deg,#4f8ef7,#2d6ee0)",
  secretaire: "linear-gradient(135deg,#22c55e,#16a34a)",
  enseignant: "linear-gradient(135deg,#a78bfa,#7c3aed)",
};

/* ─── Composant : Avatar initiales ───────────────────────────────────────── */
function Avatar({ user: u, size = 36 }) {
  const initials = `${u.prenom?.[0] || ""}${u.nom?.[0] || ""}`.toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background:
          AVATAR_GRAD[u.role] || "linear-gradient(135deg,#7a8aaa,#4a5568)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Composant : Pied de formulaire ─────────────────────────────────────── */
function ModalFooter({ onClose, loading, submitLabel, submitIcon }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "flex-end",
        marginTop: 28,
        paddingTop: 20,
        borderTop: "1px solid var(--border)",
      }}
    >
      <Btn variant="ghost" onClick={onClose} icon={<X size={15} />}>
        Annuler
      </Btn>
      <Btn type="submit" loading={loading} icon={submitIcon}>
        {submitLabel}
      </Btn>
    </div>
  );
}

/* ─── Modal : Créer un utilisateur ───────────────────────────────────────── */
function CreateUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "secretaire",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la création du compte.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Nouveau compte utilisateur"
      subtitle="Remplissez les informations pour créer un accès"
      onClose={onClose}
      width={540}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert type="danger">{error}</Alert>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section identité */}
          <FormSection title="Identité" icon={Users}>
            <FormRow>
              <Input
                label="Prénom"
                required
                value={form.prenom}
                onChange={set("prenom")}
                placeholder="Jean"
              />
              <Input
                label="Nom de famille"
                required
                value={form.nom}
                onChange={set("nom")}
                placeholder="Rakoto"
              />
            </FormRow>
            <Input
              label="Adresse e-mail"
              required
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="jean.rakoto@univ.mg"
              icon={Mail}
            />
          </FormSection>

          {/* Section accès */}
          <FormSection title="Accès & rôle" icon={Lock}>
            <div style={{ position: "relative" }}>
              <Input
                label="Mot de passe"
                required
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                icon={Lock}
                hint="Minimum 6 caractères"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 36,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Select
              label="Rôle attribué"
              required
              value={form.role}
              onChange={set("role")}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>

            {/* Aperçu du rôle sélectionné */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
              }}
            >
              {(() => {
                const RIcon = ROLE_ICONS[form.role];
                return <RIcon size={15} color="var(--accent)" />;
              })()}
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Cet utilisateur aura les droits&nbsp;
                <strong style={{ color: "var(--text)" }}>
                  {ROLE_LABELS[form.role]}
                </strong>
              </span>
            </div>
          </FormSection>
        </div>

        <ModalFooter
          onClose={onClose}
          loading={loading}
          submitLabel="Créer le compte"
          submitIcon={<UserPlus size={15} />}
        />
      </form>
    </Modal>
  );
}

/* ─── Modal : Modifier un utilisateur ────────────────────────────────────── */
function EditUserModal({ user: u, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    role: u.role,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.put(`/users/${u.id}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Modifier l'utilisateur"
      subtitle={`${u.prenom} ${u.nom} — édition du profil`}
      onClose={onClose}
      width={520}
    >
      <form onSubmit={handleSubmit}>
        {/* En-tête avec avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 16px",
            marginBottom: 20,
            background: "var(--surface2)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
          }}
        >
          <Avatar user={u} size={44} />
          <div>
            <div
              style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}
            >
              {u.prenom} {u.nom}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              {u.email}
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Badge color={ROLE_COLOR[u.role] || "muted"}>
              {ROLE_LABELS[u.role]}
            </Badge>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert type="danger">{error}</Alert>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <FormSection title="Identité" icon={Users}>
            <FormRow>
              <Input
                label="Prénom"
                required
                value={form.prenom}
                onChange={set("prenom")}
              />
              <Input
                label="Nom"
                required
                value={form.nom}
                onChange={set("nom")}
              />
            </FormRow>
            <Input
              label="Adresse e-mail"
              required
              type="email"
              value={form.email}
              onChange={set("email")}
              icon={Mail}
            />
          </FormSection>

          <FormSection title="Rôle" icon={ShieldCheck}>
            <Select
              label="Rôle attribué"
              required
              value={form.role}
              onChange={set("role")}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </FormSection>
        </div>

        <ModalFooter
          onClose={onClose}
          loading={loading}
          submitLabel="Enregistrer"
          submitIcon={<Save size={15} />}
        />
      </form>
    </Modal>
  );
}

/* ─── Modal : Changer le mot de passe ────────────────────────────────────── */
function ChangePasswordModal({ user: u, onClose, onSaved }) {
  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const mismatch = form.confirm.length > 0 && form.newPassword !== form.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mismatch) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.patch(`/users/${u.id}/password`, {
        newPassword: form.newPassword,
      });
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors du changement de mot de passe.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Changer le mot de passe"
      subtitle={`Nouveau mot de passe pour ${u.prenom} ${u.nom}`}
      onClose={onClose}
      width={460}
    >
      <form onSubmit={handleSubmit}>
        {/* Avertissement */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            padding: "12px 14px",
            marginBottom: 20,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <KeyRound
            size={16}
            color="var(--warning)"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Le nouveau mot de passe sera immédiatement actif. L'utilisateur
            devra l'utiliser lors de sa prochaine connexion.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert type="danger">{error}</Alert>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Nouveau mot de passe */}
          <div style={{ position: "relative" }}>
            <Input
              label="Nouveau mot de passe"
              required
              type={showNew ? "text" : "password"}
              value={form.newPassword}
              onChange={set("newPassword")}
              icon={Lock}
              hint="Minimum 6 caractères"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              style={{
                position: "absolute",
                right: 12,
                top: 36,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Confirmer */}
          <div style={{ position: "relative" }}>
            <Input
              label="Confirmer le mot de passe"
              required
              type={showCfm ? "text" : "password"}
              value={form.confirm}
              onChange={set("confirm")}
              icon={Lock}
              error={mismatch ? "Les mots de passe ne correspondent pas" : ""}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCfm((v) => !v)}
              style={{
                position: "absolute",
                right: 12,
                top: 36,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showCfm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Indicateur de force */}
          {form.newPassword.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                }}
              >
                Force du mot de passe
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4].map((i) => {
                  const strength =
                    form.newPassword.length >= 12
                      ? 4
                      : form.newPassword.length >= 9
                        ? 3
                        : form.newPassword.length >= 6
                          ? 2
                          : 1;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 99,
                        background:
                          i <= strength
                            ? strength >= 3
                              ? "var(--success)"
                              : strength === 2
                                ? "var(--warning)"
                                : "var(--danger)"
                            : "var(--border)",
                        transition: "background 0.3s",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <ModalFooter
          onClose={onClose}
          loading={loading}
          submitLabel="Enregistrer"
          submitIcon={<Save size={15} />}
        />
      </form>
    </Modal>
  );
}

/* ─── Modal : Confirmation ────────────────────────────────────────────────── */
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  variant = "danger",
  icon: Icon,
}) {
  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        {Icon && (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "var(--radius-sm)",
              flexShrink: 0,
              background:
                variant === "danger"
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(34,197,94,0.1)",
              border: `1px solid ${variant === "danger" ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              size={20}
              color={variant === "danger" ? "var(--danger)" : "var(--success)"}
            />
          </div>
        )}
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.7,
            margin: 0,
            paddingTop: 4,
          }}
        >
          {message}
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onCancel} icon={<X size={14} />}>
          Annuler
        </Btn>
        <Btn variant={variant} onClick={onConfirm}>
          Confirmer
        </Btn>
      </div>
    </Modal>
  );
}

/* ─── Carte de statistique rôle ──────────────────────────────────────────── */
function RoleStatCard({ role, count, total }) {
  const RIcon = ROLE_ICONS[role];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-focus)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              flexShrink: 0,
              background: AVATAR_GRAD[role],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RIcon size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {ROLE_LABELS[role]}
          </span>
        </div>
        <Badge color={ROLE_COLOR[role]}>{count}</Badge>
      </div>

      {/* Barre de progression */}
      <div>
        <div
          style={{
            height: 4,
            background: "var(--surface2)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 99,
              width: `${pct}%`,
              background: AVATAR_GRAD[role],
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 4,
            textAlign: "right",
          }}
        >
          {pct}% du total
        </div>
      </div>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function UtilisateursPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [pwdModal, setPwdModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/users");
      setUsers(data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de charger les utilisateurs.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (u) => {
    try {
      await api.patch(`/users/${u.id}/toggle`);
      showSuccess(
        `Compte de ${u.prenom} ${u.nom} ${u.is_active ? "désactivé" : "activé"}.`,
      );
      load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors du changement de statut.",
      );
    } finally {
      setConfirm(null);
    }
  };

  const handleDelete = async (u) => {
    try {
      await api.delete(`/users/${u.id}`);
      showSuccess(`L'utilisateur ${u.prenom} ${u.nom} a été supprimé.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setConfirm(null);
    }
  };

  /* Filtrage */
  const filtered = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch =
      !search ||
      `${u.prenom} ${u.nom} ${u.email}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="page-enter">
      {/* ── En-tête ── */}
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes et des droits d'accès au système"
        action={
          <Btn
            onClick={() => setCreateModal(true)}
            icon={<UserPlus size={16} />}
          >
            Nouveau compte
          </Btn>
        }
      />

      {/* ── Alertes ── */}
      {success && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="success">{success}</Alert>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="danger">{error}</Alert>
        </div>
      )}

      {/* ── Statistiques par rôle ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {ROLES.map((role) => (
          <RoleStatCard
            key={role}
            role={role}
            count={users.filter((u) => u.role === role).length}
            total={users.length}
          />
        ))}
      </div>

      {/* ── Barre de recherche & filtres ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Recherche */}
        <div
          style={{
            position: "relative",
            flex: "1 1 260px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search
            size={15}
            color="var(--text-muted)"
            style={{
              position: "absolute",
              left: 12,
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur…"
            style={{
              width: "100%",
              paddingLeft: 36,
              paddingRight: 12,
              height: 38,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--border-focus)")
            }
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Filtre rôle */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            height: 38,
            paddingLeft: 12,
            paddingRight: 28,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">Tous les rôles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>

        {/* Rafraîchir */}
        <Tooltip text="Rafraîchir">
          <Btn
            variant="ghost"
            onClick={load}
            icon={<RefreshCw size={14} />}
            small
          >
            Rafraîchir
          </Btn>
        </Tooltip>

        {/* Compteur */}
        <span
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginLeft: "auto",
          }}
        >
          {filtered.length} / {users.length} utilisateur
          {users.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Tableau ── */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <Spinner text="Chargement des utilisateurs…" />
        ) : (
          <Table
            headers={[
              "Utilisateur",
              "Email",
              "Rôle",
              "Statut",
              "Créé le",
              "Actions",
            ]}
          >
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Users}
                    title={
                      search || filterRole !== "all"
                        ? "Aucun résultat"
                        : "Aucun utilisateur"
                    }
                    description={
                      search || filterRole !== "all"
                        ? "Modifiez vos critères de recherche."
                        : "Créez le premier compte pour commencer."
                    }
                    action={
                      !search && filterRole === "all" ? (
                        <Btn
                          onClick={() => setCreateModal(true)}
                          icon={<UserPlus size={15} />}
                        >
                          Créer un compte
                        </Btn>
                      ) : null
                    }
                  />
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <Tr key={u.id}>
                  {/* Utilisateur */}
                  <Td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <Avatar user={u} size={36} />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "var(--text)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {u.role === "administrateur" && (
                            <ShieldCheck size={13} color="var(--accent)" />
                          )}
                          {u.prenom} {u.nom}
                          {String(u.id) === String(me?.id) && (
                            <Badge
                              color="muted"
                              style={{ fontSize: 10, padding: "1px 6px" }}
                            >
                              Moi
                            </Badge>
                          )}
                        </div>
                        {!u.is_active && (
                          <span
                            style={{ fontSize: 11, color: "var(--danger)" }}
                          >
                            Compte désactivé
                          </span>
                        )}
                      </div>
                    </div>
                  </Td>

                  {/* Email */}
                  <Td>
                    <a
                      href={`mailto:${u.email}`}
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--accent-light)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-muted)")
                      }
                    >
                      {u.email}
                    </a>
                  </Td>

                  {/* Rôle */}
                  <Td>
                    <Badge color={ROLE_COLOR[u.role] || "muted"}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </Td>

                  {/* Statut */}
                  <Td>
                    <Badge color={u.is_active ? "success" : "danger"} dot>
                      {u.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </Td>

                  {/* Créé le */}
                  <Td>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(u.created_at).toLocaleDateString("fr", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </Td>

                  {/* Actions */}
                  <Td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <Tooltip text="Modifier le profil">
                        <Btn
                          small
                          variant="ghost"
                          onClick={() => setEditModal(u)}
                          icon={<Edit size={13} />}
                        >
                          Modifier
                        </Btn>
                      </Tooltip>

                      <Tooltip text="Changer le mot de passe">
                        <Btn
                          small
                          variant="ghost"
                          onClick={() => setPwdModal(u)}
                          icon={<KeyRound size={13} />}
                        >
                          MDP
                        </Btn>
                      </Tooltip>

                      {String(u.id) !== String(me?.id) && (
                        <>
                          <Tooltip
                            text={
                              u.is_active
                                ? "Désactiver le compte"
                                : "Activer le compte"
                            }
                          >
                            <Btn
                              small
                              variant={u.is_active ? "ghost" : "success"}
                              onClick={() =>
                                setConfirm({ type: "toggle", user: u })
                              }
                              icon={<Power size={13} />}
                            >
                              {u.is_active ? "Désact." : "Activer"}
                            </Btn>
                          </Tooltip>

                          <Tooltip text="Supprimer définitivement">
                            <Btn
                              small
                              variant="danger"
                              onClick={() =>
                                setConfirm({ type: "delete", user: u })
                              }
                              icon={<Trash2 size={13} />}
                            >
                              Suppr.
                            </Btn>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        )}
      </div>

      {/* ── Modals ── */}
      {createModal && (
        <CreateUserModal
          onClose={() => setCreateModal(false)}
          onSaved={() => {
            setCreateModal(false);
            showSuccess("Compte créé avec succès.");
            load();
          }}
        />
      )}

      {editModal && (
        <EditUserModal
          user={editModal}
          onClose={() => setEditModal(null)}
          onSaved={() => {
            setEditModal(null);
            showSuccess("Profil mis à jour.");
            load();
          }}
        />
      )}

      {pwdModal && (
        <ChangePasswordModal
          user={pwdModal}
          onClose={() => setPwdModal(null)}
          onSaved={() => {
            setPwdModal(null);
            showSuccess("Mot de passe modifié avec succès.");
          }}
        />
      )}

      {confirm?.type === "toggle" && (
        <ConfirmModal
          title={
            confirm.user.is_active
              ? "Désactiver le compte"
              : "Activer le compte"
          }
          message={
            confirm.user.is_active
              ? `Le compte de ${confirm.user.prenom} ${confirm.user.nom} sera désactivé. L'utilisateur ne pourra plus se connecter.`
              : `Le compte de ${confirm.user.prenom} ${confirm.user.nom} sera réactivé. L'utilisateur pourra de nouveau se connecter.`
          }
          variant={confirm.user.is_active ? "danger" : "success"}
          icon={Power}
          onConfirm={() => handleToggle(confirm.user)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === "delete" && (
        <ConfirmModal
          title="Supprimer l'utilisateur"
          message={`Vous êtes sur le point de supprimer définitivement le compte de ${confirm.user.prenom} ${confirm.user.nom}. Cette action est irréversible.`}
          variant="danger"
          icon={Trash2}
          onConfirm={() => handleDelete(confirm.user)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
