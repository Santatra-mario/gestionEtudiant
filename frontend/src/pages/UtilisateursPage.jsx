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
  Alert,
  Spinner,
} from "../components/ui";

const ROLES = ["administrateur", "secretaire", "enseignant"];
const roleColor = {
  administrateur: "accent",
  secretaire: "success",
  enseignant: "warning",
};

// ── Modal : créer un utilisateur ──────────────────────────────────────────────
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
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Créer un utilisateur" onClose={onClose} width={500}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {error && <Alert>{error}</Alert>}
        <FormRow>
          <Input
            label="Nom *"
            value={form.nom}
            onChange={set("nom")}
            required
          />
          <Input
            label="Prénom *"
            value={form.prenom}
            onChange={set("prenom")}
            required
          />
        </FormRow>
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={set("email")}
          required
        />
        <Input
          label="Mot de passe *"
          type="password"
          value={form.password}
          onChange={set("password")}
          required
        />
        <Select
          label="Rôle *"
          value={form.role}
          onChange={set("role")}
          required
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            <X size={14} style={{ marginRight: 4 }} />
            Annuler
          </Btn>
          <Btn type="submit" disabled={loading}>
            <Save size={14} style={{ marginRight: 4 }} />
            {loading ? "Création…" : "Créer"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal : modifier un utilisateur ──────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Modifier l'utilisateur" onClose={onClose} width={500}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {error && <Alert>{error}</Alert>}
        <FormRow>
          <Input
            label="Nom *"
            value={form.nom}
            onChange={set("nom")}
            required
          />
          <Input
            label="Prénom *"
            value={form.prenom}
            onChange={set("prenom")}
            required
          />
        </FormRow>
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={set("email")}
          required
        />
        <Select
          label="Rôle *"
          value={form.role}
          onChange={set("role")}
          required
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            <X size={14} style={{ marginRight: 4 }} />
            Annuler
          </Btn>
          <Btn type="submit" disabled={loading}>
            <Save size={14} style={{ marginRight: 4 }} />
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal : changer le mot de passe ──────────────────────────────────────────
function ChangePasswordModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.patch(`/users/${user.id}/password`, {
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
      title={`Changer le mot de passe — ${user.prenom} ${user.nom}`}
      onClose={onClose}
      width={440}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {error && <Alert>{error}</Alert>}
        <Input
          label="Nouveau mot de passe *"
          type="password"
          value={form.newPassword}
          onChange={set("newPassword")}
          required
        />
        <Input
          label="Confirmer le mot de passe *"
          type="password"
          value={form.confirm}
          onChange={set("confirm")}
          required
        />
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            <X size={14} style={{ marginRight: 4 }} />
            Annuler
          </Btn>
          <Btn type="submit" disabled={loading}>
            <Save size={14} style={{ marginRight: 4 }} />
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal : confirmation générique ────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Modal title={title} onClose={onCancel} width={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>
            Annuler
          </Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Traitement…" : "Confirmer"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function UtilisateursPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null); // user object
  const [pwdModal, setPwdModal] = useState(null); // user object
  const [confirmState, setConfirmState] = useState(null); // { type, user }

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
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

  // ── Toggle actif/inactif ──────────────────────────────────────────────────
  const handleToggle = async (u) => {
    try {
      await api.patch(`/users/${u.id}/toggle`);
      showSuccess(
        `Compte ${u.is_active ? "désactivé" : "activé"} avec succès.`,
      );
      load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors du changement de statut.",
      );
    } finally {
      setConfirmState(null);
    }
  };

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDelete = async (u) => {
    try {
      await api.delete(`/users/${u.id}`);
      showSuccess("Utilisateur supprimé avec succès.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setConfirmState(null);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes d'accès (administrateur, secrétaire, enseignant)"
        action={
          <Btn
            onClick={() => setCreateModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <UserPlus size={16} /> Créer un utilisateur
          </Btn>
        }
      />

      {/* Messages */}
      {successMsg && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="success">{successMsg}</Alert>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="danger">{error}</Alert>
        </div>
      )}

      {/* Tableau */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "1rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Spinner />
        ) : (
          <Table
            headers={[
              "Nom complet",
              "Email",
              "Rôle",
              "Statut",
              "Créé le",
              "Actions",
            ]}
          >
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "var(--text-muted)",
                  }}
                >
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <Tr key={u.id}>
                  {/* Nom complet avec icône admin */}
                  <Td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {u.role === "administrateur" && (
                        <ShieldCheck size={14} color="var(--accent-light)" />
                      )}
                      <span style={{ fontWeight: 500, color: "var(--text)" }}>
                        {u.prenom} {u.nom}
                      </span>
                      {String(u.id) === String(me?.id) && (
                        <Badge color="muted" style={{ fontSize: 10 }}>
                          Moi
                        </Badge>
                      )}
                    </div>
                  </Td>

                  {/* Email */}
                  <Td>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {u.email}
                    </span>
                  </Td>

                  {/* Rôle */}
                  <Td>
                    <Badge color={roleColor[u.role] || "muted"}>{u.role}</Badge>
                  </Td>

                  {/* Statut actif/inactif */}
                  <Td>
                    <Badge color={u.is_active ? "success" : "danger"}>
                      {u.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </Td>

                  {/* Date de création */}
                  <Td>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {new Date(u.created_at).toLocaleDateString("fr", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </Td>

                  {/* Actions */}
                  <Td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {/* Modifier */}
                      <Btn
                        small
                        variant="ghost"
                        onClick={() => setEditModal(u)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Edit size={13} /> Modifier
                      </Btn>

                      {/* Changer mot de passe */}
                      <Btn
                        small
                        variant="ghost"
                        onClick={() => setPwdModal(u)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <KeyRound size={13} /> Mot de passe
                      </Btn>

                      {/* Activer / Désactiver — impossible sur soi-même */}
                      {String(u.id) !== String(me?.id) && (
                        <Btn
                          small
                          variant={u.is_active ? "ghost" : "success"}
                          onClick={() =>
                            setConfirmState({ type: "toggle", user: u })
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Power size={13} />{" "}
                          {u.is_active ? "Désactiver" : "Activer"}
                        </Btn>
                      )}

                      {/* Supprimer — impossible sur soi-même */}
                      {String(u.id) !== String(me?.id) && (
                        <Btn
                          small
                          variant="danger"
                          onClick={() =>
                            setConfirmState({ type: "delete", user: u })
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Trash2 size={13} /> Supprimer
                        </Btn>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {createModal && (
        <CreateUserModal
          onClose={() => setCreateModal(false)}
          onSaved={() => {
            setCreateModal(false);
            showSuccess("Utilisateur créé avec succès.");
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
            showSuccess("Utilisateur mis à jour.");
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

      {confirmState?.type === "toggle" && (
        <ConfirmModal
          title={
            confirmState.user.is_active
              ? "Désactiver le compte"
              : "Activer le compte"
          }
          message={
            confirmState.user.is_active
              ? `Désactiver le compte de ${confirmState.user.prenom} ${confirmState.user.nom} ? L'utilisateur ne pourra plus se connecter.`
              : `Réactiver le compte de ${confirmState.user.prenom} ${confirmState.user.nom} ?`
          }
          onConfirm={() => handleToggle(confirmState.user)}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {confirmState?.type === "delete" && (
        <ConfirmModal
          title="Supprimer l'utilisateur"
          message={`Supprimer définitivement le compte de ${confirmState.user.prenom} ${confirmState.user.nom} ? Cette action est irréversible.`}
          onConfirm={() => handleDelete(confirmState.user)}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
