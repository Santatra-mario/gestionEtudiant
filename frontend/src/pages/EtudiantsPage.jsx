import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Edit,
  Trash2,
  X,
  Save,
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

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];

// Palette de couleurs pour les avatars sans photo
const AVATAR_COLORS = [
  ["#4f8ef7", "#2d6ee0"],
  ["#22c55e", "#16a34a"],
  ["#a78bfa", "#7c3aed"],
  ["#f59e0b", "#d97706"],
  ["#ec4899", "#be185d"],
  ["#14b8a6", "#0d9488"],
  ["#ef4444", "#dc2626"],
];

// Avatar circulaire : photo ou initiales
function Avatar({ photo, prenom, nom, size = 40 }) {
  // Couleur déterministe basée sur la première lettre
  const idx = (prenom?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  const initiales = `${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`;

  if (photo) {
    return (
      <img
        src={`/uploads/${photo}`}
        alt={`${prenom} ${nom}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid var(--border)",
          display: "block",
          flexShrink: 0,
        }}
        onError={(e) => {
          // Si l'image est cassée → afficher les initiales
          e.currentTarget.style.display = "none";
          e.currentTarget.nextSibling.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "#fff",
        letterSpacing: "0.03em",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initiales}
    </div>
  );
}

// --- MODAL ÉTUDIANT (style compact et centré) ---
function EtudiantModal({ onClose, onSaved, initial }) {
  const [form, setForm] = useState(
    initial || {
      nom: "",
      prenom: "",
      date_naissance: "",
      sexe: "M",
      adresse: "",
      telephone: "",
      email: "",
    },
  );
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Validation simple
  const isFormValid =
    form.nom.trim() !== "" &&
    form.prenom.trim() !== "" &&
    form.date_naissance !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append("photo", photo);
      if (initial?.id) {
        await api.put(`/etudiants/${initial.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/etudiants", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initial ? "Modifier étudiant" : "Nouvel étudiant"}
      onClose={onClose}
      width={520}
      top={90}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
        }}
      >
        {error && <Alert style={{ width: "100%" }}>{error}</Alert>}

        <div style={{ width: "100%", maxWidth: 360 }}>
          <FormRow style={{ gap: 12 }}>
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
        </div>

        <div style={{ width: "100%", maxWidth: 360 }}>
          <FormRow style={{ gap: 12 }}>
            <Input
              label="Date naissance *"
              type="date"
              value={form.date_naissance}
              onChange={set("date_naissance")}
              required
            />
            <Select
              label="Sexe *"
              value={form.sexe}
              onChange={set("sexe")}
              required
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </Select>
          </FormRow>
        </div>

        <div style={{ width: "100%", maxWidth: 360 }}>
          <FormRow style={{ gap: 12 }}>
            <Input
              label="Téléphone"
              value={form.telephone}
              onChange={set("telephone")}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set("email")}
            />
          </FormRow>
        </div>

        <div style={{ width: "100%", maxWidth: 360 }}>
          <Input
            label="Adresse"
            value={form.adresse}
            onChange={set("adresse")}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Photo (JPG/PNG, max 2Mo)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              style={{ fontSize: 13, color: "var(--text-muted)" }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            marginTop: 8,
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            <X size={16} style={{ marginRight: 6 }} /> Annuler
          </Btn>
          <Btn type="submit" disabled={loading || !isFormValid}>
            <Save size={16} style={{ marginRight: 6 }} />{" "}
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// --- MODAL DE CONFIRMATION STYLISÉE ---
function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;
  return (
    <Modal title={title || "Confirmation"} onClose={onCancel} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>
            Annuler
          </Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Suppression..." : "Confirmer"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// --- PAGE PRINCIPALE ---
export default function EtudiantsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = ["administrateur", "secretaire"].includes(user?.role);

  const [etudiants, setEtudiants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/etudiants", {
        params: { search, page, limit: 20 },
      });
      setEtudiants(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/etudiants/${deleteId}`);
      setDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageHeader
        title="Étudiants"
        subtitle={`${total} étudiant(s) enregistré(s)`}
        action={
          canEdit && (
            <Btn
              onClick={() => setModal("create")}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <UserPlus size={16} /> Nouvel étudiant
            </Btn>
          )
        }
      />

      {/* Barre de recherche améliorée */}
      <div style={{ marginBottom: 24, position: "relative", maxWidth: 400 }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          placeholder="Rechercher par nom, prénom, matricule…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "40px",
            color: "var(--text)",
            padding: "10px 16px 10px 40px",
            fontSize: 14,
            width: "100%",
            outline: "none",
            transition: "all 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </div>

      <div
        style={{
          background: "var(--surface)",
          borderRadius: "1rem",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          transition: "box-shadow 0.2s",
        }}
      >
        {loading ? (
          <Spinner />
        ) : (
          <Table
            headers={[
              "",
              "Matricule",
              "Nom complet",
              "Filière",
              "Niveau",
              "Statut",
              "Actions",
            ]}
          >
            {etudiants.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "var(--text-muted)",
                  }}
                >
                  Aucun étudiant trouvé.
                </td>
              </tr>
            ) : (
              etudiants.map((e) => (
                <Tr
                  key={e.id}
                  onClick={() => navigate(`/etudiants/${e.id}`)}
                  style={{ cursor: "pointer", transition: "background 0.15s" }}
                >
                  {/* Colonne photo */}
                  <Td style={{ width: 56, paddingRight: 0 }}>
                    <div
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      {e.photo ? (
                        <>
                          <img
                            src={`/uploads/${e.photo}`}
                            alt={`${e.prenom} ${e.nom}`}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid var(--border)",
                              display: "block",
                            }}
                            onError={(ev) => {
                              ev.currentTarget.style.display = "none";
                              ev.currentTarget.nextSibling.style.display =
                                "flex";
                            }}
                          />
                          {/* Fallback si image cassée */}
                          <Avatar
                            photo={null}
                            prenom={e.prenom}
                            nom={e.nom}
                            size={40}
                            style={{
                              display: "none",
                              position: "absolute",
                              top: 0,
                              left: 0,
                            }}
                          />
                        </>
                      ) : (
                        <Avatar
                          photo={null}
                          prenom={e.prenom}
                          nom={e.nom}
                          size={40}
                        />
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span
                      style={{
                        color: "var(--accent-light)",
                        fontFamily: "monospace",
                        fontWeight: 500,
                      }}
                    >
                      {e.matricule}
                    </span>
                  </Td>
                  <Td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span style={{ fontWeight: 500 }}>
                        {e.prenom} {e.nom}
                      </span>
                    </div>
                  </Td>
                  <Td>{e.filiere_nom || "—"}</Td>
                  <Td>
                    {e.niveau ? (
                      <Badge color="muted" style={{ borderRadius: "20px" }}>
                        {e.niveau}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    {e.statut ? (
                      <Badge
                        color={
                          {
                            actif: "success",
                            suspendu: "warning",
                            diplome: "accent",
                            abandonne: "danger",
                          }[e.statut] || "muted"
                        }
                      >
                        {e.statut}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    <div
                      onClick={(ev) => ev.stopPropagation()}
                      style={{ display: "flex", gap: 8 }}
                    >
                      {canEdit && (
                        <>
                          <Btn
                            small
                            variant="ghost"
                            onClick={() => setModal(e)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Edit size={14} /> Modifier
                          </Btn>
                          <Btn
                            small
                            variant="danger"
                            onClick={() => setDeleteId(e.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Trash2 size={14} /> Suppr.
                          </Btn>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        )}

        {/* Pagination améliorée */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface2)",
            }}
          >
            <Btn
              small
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <ChevronLeft size={14} /> Précédent
            </Btn>
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                background: "var(--surface)",
                padding: "6px 12px",
                borderRadius: "20px",
              }}
            >
              Page {page} / {totalPages}
            </span>
            <Btn
              small
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              Suivant <ChevronRight size={14} />
            </Btn>
          </div>
        )}
      </div>

      {/* Modale d'édition / création */}
      {modal && (
        <EtudiantModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {/* Modale de confirmation suppression */}
      <ConfirmModal
        open={!!deleteId}
        title="Supprimer l'étudiant"
        message="Supprimer cet étudiant ? Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
