import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeftRight, Plus, Check, X, Clock, Search,
  Building2, GraduationCap, User, FileText, ChevronDown
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  PageHeader, Btn, Table, Tr, Td, Badge, Modal,
  Input, Select, FormRow, FormSection, Alert, Spinner, EmptyState
} from "../components/ui";

const STATUT_CONFIG = {
  en_attente: { label: "En attente", color: "warning", icon: Clock },
  accepte:    { label: "Accepté",    color: "success", icon: Check },
  refuse:     { label: "Refusé",     color: "danger",  icon: X },
};

function TransfertModal({ onClose, onSaved }) {
  const [etudiants, setEtudiants] = useState([]);
  const [filieres, setFilieres]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [form, setForm] = useState({
    etudiant_id: "", etablissement_origine: "", filiere_origine: "",
    filiere_destination_id: "", niveau: "L1", annee_universitaire: "2026-2027", motif: ""
  });

  useEffect(() => {
    api.get("/etudiants?limit=200").then(r => setEtudiants(r.data.data || []));
    api.get("/filieres").then(r => setFilieres(r.data.data || []));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const isValid = form.etudiant_id && form.etablissement_origine &&
                  form.filiere_origine && form.filiere_destination_id &&
                  form.niveau && form.annee_universitaire;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/transferts", form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Nouvelle demande de transfert" onClose={onClose} width={600}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "8px 0" }}>
        {error && <Alert type="danger">{error}</Alert>}

        <FormSection title="Étudiant" icon={User}>
          <Select label="Étudiant *" value={form.etudiant_id} onChange={set("etudiant_id")}>
            <option value="">-- Sélectionner un étudiant --</option>
            {etudiants.map(e => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.matricule}</option>
            ))}
          </Select>
        </FormSection>

        <FormSection title="Établissement d'origine" icon={Building2}>
          <FormRow>
            <Input label="Code établissement *" value={form.etablissement_origine}
              onChange={set("etablissement_origine")} placeholder="ex: TOL" />
            <Input label="Filière d'origine *" value={form.filiere_origine}
              onChange={set("filiere_origine")} placeholder="ex: Informatique" />
          </FormRow>
        </FormSection>

        <FormSection title="Destination" icon={GraduationCap}>
          <FormRow>
            <Select label="Filière destination *" value={form.filiere_destination_id}
              onChange={set("filiere_destination_id")}>
              <option value="">-- Choisir --</option>
              {filieres.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </Select>
            <Select label="Niveau *" value={form.niveau} onChange={set("niveau")}>
              {["L1","L2","L3","M1","M2"].map(n => <option key={n}>{n}</option>)}
            </Select>
          </FormRow>
          <Input label="Année universitaire *" value={form.annee_universitaire}
            onChange={set("annee_universitaire")} placeholder="2026-2027" />
        </FormSection>

        <FormSection title="Motif" icon={FileText}>
          <textarea value={form.motif} onChange={set("motif")}
            placeholder="Motif du transfert (optionnel)"
            style={{
              width: "100%", minHeight: 80, padding: "10px 14px", borderRadius: 8,
              border: "1.5px solid var(--border)", background: "var(--surface)",
              color: "var(--text)", fontSize: 14, resize: "vertical", boxSizing: "border-box"
            }}
          />
        </FormSection>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end",
          paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Btn variant="ghost" onClick={onClose} icon={<X size={15}/>}>Annuler</Btn>
          <Btn onClick={handleSubmit} loading={loading} disabled={!isValid}
            icon={<Plus size={15}/>}>Créer la demande</Btn>
        </div>
      </div>
    </Modal>
  );
}

function RefusModal({ transfert, onClose, onSaved }) {
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRefuser = async () => {
    if (!motif.trim()) return;
    setLoading(true);
    try {
      await api.put(`/transferts/${transfert.id}/refuser`, { motif_refus: motif });
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Refuser le transfert" onClose={onClose} width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
        <Alert type="warning">
          Vous allez refuser le transfert de <strong>{transfert.etudiant_prenom} {transfert.etudiant_nom}</strong>
        </Alert>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>
            Motif du refus *
          </label>
          <textarea value={motif} onChange={e => setMotif(e.target.value)}
            placeholder="Expliquez la raison du refus..."
            style={{
              width: "100%", minHeight: 100, padding: "10px 14px", borderRadius: 8,
              border: "1.5px solid var(--border)", background: "var(--surface)",
              color: "var(--text)", fontSize: 14, resize: "vertical", boxSizing: "border-box"
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end",
          paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="danger" onClick={handleRefuser} loading={loading}
            disabled={!motif.trim()} icon={<X size={15}/>}>Confirmer le refus</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function TransfertPage() {
  const { user } = useAuth();
  const [transferts, setTransferts] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [modal, setModal]           = useState(null);
  const [refusModal, setRefusModal] = useState(null);
  const canEdit = ["administrateur", "secretaire"].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/transferts");
      setTransferts(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccepter = async (id) => {
    await api.put(`/transferts/${id}/accepter`);
    load();
  };

  const filtered = transferts.filter(t =>
    `${t.etudiant_nom} ${t.etudiant_prenom} ${t.matricule_transfert} ${t.etablissement_origine}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <PageHeader
          title="Transferts"
          subtitle={`${transferts.length} demande${transferts.length > 1 ? "s" : ""}`}
          action={canEdit && (
            <Btn onClick={() => setModal("create")} icon={<Plus size={16}/>}>
              Nouvelle demande
            </Btn>
          )}
        />

        <div style={{ marginBottom: 24, position: "relative", maxWidth: 460 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par étudiant, matricule, établissement..."
            style={{
              width: "100%", boxSizing: "border-box", background: "var(--surface)",
              border: "1.5px solid var(--border)", borderRadius: 40, color: "var(--text)",
              padding: "11px 18px 11px 44px", fontSize: 14, outline: "none"
            }}
          />
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)",
          border: "2px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <Table headers={["Matricule transfert", "Étudiant", "Origine", "Destination",
            "Niveau", "Année", "Statut", "Actions"]}>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
                <Spinner />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState icon={ArrowLeftRight} title="Aucun transfert"
                  description="Aucune demande de transfert pour le moment." />
              </td></tr>
            ) : filtered.map(t => {
              const statut = STATUT_CONFIG[t.statut] || STATUT_CONFIG.en_attente;
              return (
                <Tr key={t.id}>
                  <Td>
                    <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                      color: "var(--accent-light)", background: "rgba(99,102,241,0.08)",
                      padding: "3px 8px", borderRadius: 6 }}>
                      {t.matricule_transfert}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ fontWeight: 600 }}>{t.etudiant_prenom} {t.etudiant_nom}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.matricule}</div>
                  </Td>
                  <Td>
                    <div style={{ fontWeight: 500 }}>{t.etablissement_origine}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.filiere_origine}</div>
                  </Td>
                  <Td>{t.filiere_destination}</Td>
                  <Td><Badge variant="accent">{t.niveau}</Badge></Td>
                  <Td>{t.annee_universitaire}</Td>
                  <Td><Badge variant={statut.color}>{statut.label}</Badge></Td>
                  <Td>
                    {canEdit && t.statut === "en_attente" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn small variant="success" icon={<Check size={13}/>}
                          onClick={() => handleAccepter(t.id)}>Accepter</Btn>
                        <Btn small variant="danger" icon={<X size={13}/>}
                          onClick={() => setRefusModal(t)}>Refuser</Btn>
                      </div>
                    )}
                    {t.statut !== "en_attente" && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {t.date_traitement ? new Date(t.date_traitement).toLocaleDateString("fr-FR") : "—"}
                      </span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </div>
      </div>

      {modal === "create" && (
        <TransfertModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
      {refusModal && (
        <RefusModal transfert={refusModal}
          onClose={() => setRefusModal(null)}
          onSaved={() => { setRefusModal(null); load(); }} />
      )}
    </>
  );
}
