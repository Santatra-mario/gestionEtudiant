import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Save, 
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  Clock3
} from 'lucide-react';

import { PageHeader, Card, Btn, NativeSelect, Alert, Badge, Spinner, ConfirmModal } from "../components/ui";

// ── Helper pour extraire les tableaux des réponses API ───────────────────────
function extractArray(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.matieres)) return responseData.matieres;
  return [];
}

// ── Helper pour formater le nom complet des étudiants ─────────────────────
function getStudentFullName(student) {
  if (!student) return "";
  
  const nom = student.etudiant_nom || student.nom || "";
  const prenom = student.prenom || "";
  
  if (prenom && nom) {
    return `${nom} ${prenom}`;
  } else if (nom) {
    return nom;
  } else if (prenom) {
    return prenom;
  }
  
  return "Étudiant inconnu";
}

// ── Composant Modal de confirmation ─────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: "var(--surface)", color: "var(--text)",
        padding: "24px", borderRadius: "12px", maxWidth: "400px",
        width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        border: "1px solid var(--border)"
      }}>
        <h3 style={{ margin: "0 0 16px 0", color: "var(--text)" }}>{title}</h3>
        <p style={{ margin: "0 0 24px 0", color: "var(--text-muted)", lineHeight: "1.5" }}>{message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onCancel} disabled={loading}>
            Annuler
          </Btn>
          <Btn onClick={onConfirm} disabled={loading}>
            {loading ? "Traitement..." : "Confirmer"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export default function PresencePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // ── États principaux ────────────────────────────────────────────────────────
  const [inscriptions, setInscriptions] = useState([]);
  const [filteredInscriptions, setFilteredInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMatiere, setSelectedMatiere] = useState("");
  
  // ── Données de présence ─────────────────────────────────────────────────────
  const [presenceData, setPresenceData] = useState({});
  const [matieres, setMatieres] = useState([]);
  const [allMatieres, setAllMatieres] = useState([]); // Toutes les matières disponibles
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inscLoading, setInscLoading] = useState(true);
  const [matLoading, setMatLoading] = useState(true);
  
  // ── États UI ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [showStats, setShowStats] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", onConfirm: null, loading: false });

  // ── Permissions ───────────────────────────────────────────────────────────
  const canManagePresence = ["administrateur", "secretaire", "enseignant"].includes(user?.role);
  const canViewStats = ["administrateur", "secretaire"].includes(user?.role);

  // ── Styles réutilisables ───────────────────────────────────────────────────
  const inputStyle = {
    width: "100%",
    padding: "10px 13px",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    transition: "all 0.2s ease",
  };

  // ── Couleurs pour les statuts de présence ───────────────────────────────
  const presenceColors = {
    present: { label: "Présent", color: "#ffffff", bg: "#22c55e", icon: CheckCircle },
    absent: { label: "Absent", color: "#ffffff", bg: "#ef4444", icon: XCircle },
    retard: { label: "Retard", color: "#ffffff", bg: "#f59e0b", icon: Clock },
    excuse: { label: "Excusé", color: "#ffffff", bg: "#3b82f6", icon: AlertCircle },
    "": { label: "Non défini", color: "var(--text-muted)", bg: "var(--surface2)", icon: null },
  };

  // ── Chargement des inscriptions ───────────────────────────────────────────────
  useEffect(() => {
    setInscLoading(true);
    api.get("/inscriptions")
      .then((r) => {
        const list = extractArray(r.data);
        setInscriptions(list);
        setFilteredInscriptions(list);
        const paramId = searchParams.get("inscription");
        if (paramId && list.some((i) => String(i.id) === String(paramId))) {
          setSelectedInscription(paramId);
        }
      })
      .catch(() => { 
        setInscriptions([]); 
        setFilteredInscriptions([]); 
      })
      .finally(() => setInscLoading(false));
  }, []);

  // ── Chargement de toutes les matières disponibles ─────────────────────────────
  useEffect(() => {
    setMatLoading(true);
    
    // D'abord charger toutes les filières
    api.get("/filieres")
      .then(async (fRes) => {
        const filieres = extractArray(fRes.data);
        const allMatieresList = [];
        
        // Pour chaque filière, charger ses matières
        for (const filiere of filieres) {
          try {
            const mRes = await api.get(`/filieres/${filiere.id}/matieres`);
            const matieresList = extractArray(mRes.data);
            
            // Ajouter les informations de la filière à chaque matière
            matieresList.forEach(m => {
              allMatieresList.push({
                ...m,
                filiere_nom: filiere.nom,
                filiere_id: filiere.id
              });
            });
          } catch (error) {
            console.warn(`Impossible de charger les matières pour la filière ${filiere.nom}:`, error);
          }
        }
        
        setAllMatieres(allMatieresList);
      })
      .catch(() => setAllMatieres([]))
      .finally(() => setMatLoading(false));
  }, []);

  // ── Filtrer les matières selon la filière sélectionnée ─────────────────────
  useEffect(() => {
    if (filterFiliere) {
      const filtered = allMatieres.filter(m => m.filiere_nom === filterFiliere);
      setMatieres(filtered);
    } else {
      setMatieres(allMatieres);
    }
  }, [filterFiliere, allMatieres]);

  // ── Chargement des données de présence ───────────────────────────────────────
  const loadPresenceData = useCallback(async () => {
    if (!selectedMatiere || !selectedDate) {
      setPresenceData({});
      return;
    }

    setLoading(true);
    setMsg({ text: "", type: "" });

    try {
      // Charger les données de présence existantes
      const pRes = await api.get(`/presences?matiere_id=${selectedMatiere}&date=${selectedDate}`);
      const existingPresence = {};
      if (Array.isArray(pRes.data)) {
        pRes.data.forEach(p => {
          existingPresence[String(p.inscription_id)] = p.statut;
        });
      }
      setPresenceData(existingPresence);
      
      const count = Object.keys(existingPresence).length;
      if (count > 0) {
        console.log("✅ Données de présence chargées:", count, "entrées");
      } else {
        setMsg({ 
          text: "📋 Aucune présence enregistrée pour cette matière et date. Commencez la saisie.", 
          type: "success" 
        });
        console.info("ℹ️ Aucune donnée de présence existante pour cette matière/date");
      }
    } catch (e) {
      // Erreur de chargement
      const errorMsg = e.response?.data?.message || "Erreur lors du chargement des présences";
      setMsg({ 
        text: `❌ Erreur de chargement : ${errorMsg}`, 
        type: "danger" 
      });
      console.error("Erreur de chargement des présences:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedMatiere, selectedDate]);

  // ── Filtrage des inscriptions ───────────────────────────────────────────────
  useEffect(() => {
    let f = [...inscriptions];
    if (searchTerm) {
      f = f.filter((i) =>
        i.etudiant_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterFiliere) f = f.filter((i) => i.filiere_nom === filterFiliere);
    if (filterNiveau) f = f.filter((i) => i.niveau === filterNiveau);
    setFilteredInscriptions(f);
  }, [searchTerm, filterFiliere, filterNiveau, inscriptions]);

  // ── Options pour les filtres ───────────────────────────────────────────────
  const filiereOptions = [...new Set(inscriptions.map((i) => i.filiere_nom).filter(Boolean))];
  const niveauOptions = ["L1", "L2", "L3", "M1", "M2"];

  // ── Gestion du changement de statut ─────────────────────────────────────────────
  const handlePresenceChange = useCallback((inscriptionId, statut) => {
    setPresenceData(prev => ({
      ...prev,
      [inscriptionId]: statut,
    }));

    // Message informatif pour le changement de statut
    const student = filteredInscriptions.find(i => String(i.id) === String(inscriptionId));
    const studentName = student ? getStudentFullName(student) : 'Étudiant';
    
    if (statut) {
      console.log(`📋 ${studentName}: Statut changé vers "${statut}"`);
    } else {
      console.log(`📋 ${studentName}: Statut réinitialisé`);
    }
  }, [filteredInscriptions]);

  // ── Sauvegarde de la présence ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMsg({ text: "", type: "" });

    try {
      const presenceRecords = Object.entries(presenceData)
        .filter(([_, statut]) => statut && statut !== "")
        .map(([inscriptionId, statut]) => ({
          inscription_id: parseInt(inscriptionId, 10),
          matiere_id: parseInt(selectedMatiere, 10),
          date: selectedDate,
          statut,
          enregistre_par: user.id
        }));

      if (presenceRecords.length === 0) {
        setMsg({ 
          text: "⚠️ Aucune présence à enregistrer. Veuillez sélectionner au moins un statut de présence.", 
          type: "warning" 
        });
        setSaving(false);
        return;
      }

      // Utiliser des appels individuels pour chaque présence
      const savePromises = presenceRecords.map(record => 
        api.post("/presences", record)
      );

      const results = await Promise.all(savePromises);
      setMsg({ 
        text: `✅ ${presenceRecords.length} présence(s) enregistrée(s) avec succès!`, 
        type: "success" 
      });

      // Recharger les données
      await loadPresenceData();
    } catch (err) {
      const serverMsg = err.response?.data?.message || "Erreur lors de l'enregistrement.";
      setMsg({ text: serverMsg, type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // ── Calcul des statistiques ─────────────────────────────────────────────────────
  const getStats = () => {
    const total = Object.keys(presenceData).length;
    const stats = {
      present: 0,
      absent: 0,
      retard: 0,
      excuse: 0,
    };

    Object.values(presenceData).forEach(statut => {
      if (stats[statut] !== undefined) {
        stats[statut]++;
      }
    });

    return { total, ...stats };
  };

  const stats = getStats();

  // ── Rendu principal ────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Gestion de Présence Universitaire"
        subtitle="Suivi et enregistrement de la présence des étudiants"
        action={
          canViewStats && (
            <Btn 
              variant="secondary" 
              onClick={() => setShowStats(!showStats)}
              icon={showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            >
              {showStats ? "Masquer" : "Afficher"} les statistiques
            </Btn>
          )
        }
      />

      {/* ── Filtres ──────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600,
              color: "var(--text-muted)", marginBottom: 6,
            }}>
              Rechercher un étudiant
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Nom ou matricule…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, padding: "10px 13px 10px 36px" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.18)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <Search size={15} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }} />
            </div>
          </div>

          <div style={{ minWidth: 180 }}>
            <NativeSelect label="Filière" value={filterFiliere}
              onChange={(e) => setFilterFiliere(e.target.value)}>
              <option value="">Toutes les filières</option>
              {filiereOptions.map((f) => <option key={f} value={f}>{f}</option>)}
            </NativeSelect>
          </div>

          <div style={{ minWidth: 130 }}>
            <NativeSelect label="Niveau" value={filterNiveau}
              onChange={(e) => setFilterNiveau(e.target.value)}>
              <option value="">Tous niveaux</option>
              {niveauOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </NativeSelect>
          </div>

          {(searchTerm || filterFiliere || filterNiveau) && (
            <div style={{ alignSelf: "flex-end", paddingBottom: 2 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {filteredInscriptions.length} résultat{filteredInscriptions.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Contrôles de présence ─────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 200 }}>
            <NativeSelect label="Matière" value={selectedMatiere}
              onChange={(e) => setSelectedMatiere(e.target.value)}
              disabled={matLoading}>
              <option value="">— Choisir une matière —</option>
              {matLoading ? (
                <option disabled>Chargement des matières...</option>
              ) : (
                matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom} ({m.code}) - {m.filiere_nom}
                  </option>
                ))
              )}
            </NativeSelect>
          </div>

          <div style={{ minWidth: 160 }}>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600,
              color: "var(--text-muted)", marginBottom: 6,
            }}>
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                ...inputStyle,
                maxWidth: 160,
              }}
            />
          </div>

          {canManagePresence && (
            <Btn 
              onClick={handleSave}
              disabled={saving || !selectedMatiere}
              loading={saving}
              icon={<Save size={16} />}
            >
              {saving ? "Enregistrement..." : "Enregistrer la présence"}
            </Btn>
          )}
        </div>
      </Card>

      {/* ── Message de feedback ─────────────────────────────────────────────────── */}
      {msg.text && (
        <Alert type={msg.type === "success" ? "success" : msg.type === "warning" ? "warning" : "danger"} style={{ marginBottom: 20 }}>
          {msg.text}
        </Alert>
      )}

      {/* ── Vue d'ensemble de la gestion universitaire de l'absence ─────── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <AlertCircle size={20} style={{ color: "var(--danger)" }} />
          <h3 style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>
            Vue d'ensemble de la gestion universitaire de l'absence
          </h3>
        </div>
        
        {/* Statistiques des absences */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20, padding: 16, background: "var(--surface2)", borderRadius: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--danger)" }}>
              {stats.absent || 0}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Total absents
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--warning)" }}>
              {stats.retard || 0}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Total retards
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--info)" }}>
              {stats.excuse || 0}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Total excusés
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--success)" }}>
              {stats.present || 0}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Total présents
            </div>
          </div>
        </div>

        {/* Liste des absences */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {[
                  "Date", "Étudiant", "Matricule", "Filière", "Niveau", "Matière", "Statut"
                ].map((h) => (
                  <th key={h} style={{
                    padding: "8px", textAlign: "left",
                    color: "var(--text-muted)", fontSize: 11,
                    borderBottom: "2px solid var(--border)",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    fontWeight: 600,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInscriptions.map((inscription) => {
                const key = String(inscription.id);
                const currentStatus = presenceData[key] || "";
                
                // Afficher seulement les absences, retards et excusés
                if (!currentStatus || currentStatus === "present") return null;
                
                const statusConfig = presenceColors[currentStatus] || presenceColors[""];
                
                return (
                  <tr key={inscription.id} style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.15s",
                    background: currentStatus === "absent" ? "rgba(239,68,68,0.05)" : 
                             currentStatus === "retard" ? "rgba(245,158,11,0.05)" : 
                             currentStatus === "excuse" ? "rgba(59,130,246,0.05)" : "transparent"
                  }}>
                    <td style={{ padding: "8px", color: "var(--text-muted)" }}>
                      {selectedDate}
                    </td>
                    <td style={{ padding: "8px", color: "var(--text)", fontWeight: 500 }}>
                      {getStudentFullName(inscription)}
                    </td>
                    <td style={{ 
                      padding: "8px", 
                      color: "var(--text-muted)",
                      fontFamily: "monospace", 
                      fontSize: 11 
                    }}>
                      {inscription.matricule}
                    </td>
                    <td style={{ padding: "8px", color: "var(--text-muted)" }}>
                      {inscription.filiere_nom}
                    </td>
                    <td style={{ padding: "8px", color: "var(--text-muted)" }}>
                      {inscription.niveau}
                    </td>
                    <td style={{ padding: "8px", color: "var(--text-muted)" }}>
                      {matieres.find(m => String(m.id) === selectedMatiere)?.nom || "-"}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <Badge 
                        color={currentStatus} 
                        style={{ 
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          background: statusConfig.bg,
                          color: statusConfig.color
                        }}
                      >
                        {statusConfig.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              
              {filteredInscriptions.filter(i => {
                const key = String(i.id);
                const status = presenceData[key] || "";
                return status && status !== "present";
              }).length === 0 && (
                <tr>
                  <td colSpan={7} style={{
                    textAlign: "center", padding: "20px",
                    color: "var(--text-muted)", fontSize: 13,
                  }}>
                    Aucune absence enregistrée pour la période sélectionnée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Tableau de présence ─────────────────────────────────────────────────── */}
      {selectedMatiere ? (
        <Card>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <Spinner />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: "12px", textAlign: "left",
                      borderBottom: "2px solid var(--border)",
                      color: "var(--text-muted)", fontSize: 12,
                      fontWeight: 600, position: "sticky", top: 0,
                      background: "var(--surface)", zIndex: 10,
                    }}>
                      Étudiant
                    </th>
                    <th style={{
                      padding: "12px", textAlign: "left",
                      borderBottom: "2px solid var(--border)",
                      color: "var(--text-muted)", fontSize: 12,
                      fontWeight: 600, position: "sticky", top: 0,
                      background: "var(--surface)", zIndex: 10,
                    }}>
                      Matricule
                    </th>
                    <th style={{
                      padding: "12px", textAlign: "left",
                      borderBottom: "2px solid var(--border)",
                      color: "var(--text-muted)", fontSize: 12,
                      fontWeight: 600, position: "sticky", top: 0,
                      background: "var(--surface)", zIndex: 10,
                    }}>
                      Filière
                    </th>
                    <th style={{
                      padding: "12px", textAlign: "left",
                      borderBottom: "2px solid var(--border)",
                      color: "var(--text-muted)", fontSize: 12,
                      fontWeight: 600, position: "sticky", top: 0,
                      background: "var(--surface)", zIndex: 10,
                    }}>
                      Niveau
                    </th>
                    <th style={{
                      padding: "12px", textAlign: "center",
                      borderBottom: "2px solid var(--border)",
                      color: "var(--text-muted)", fontSize: 12,
                      fontWeight: 600, position: "sticky", top: 0,
                      background: "var(--surface)", zIndex: 10,
                    }}>
                      Présent
                    </th>
                    <th style={{
                      padding: "12px", textAlign: "center",
                      borderBottom: "2px solid var(--border)",
                      color: "var(--text-muted)", fontSize: 12,
                      fontWeight: 600, position: "sticky", top: 0,
                      background: "var(--surface)", zIndex: 10,
                    }}>
                      Absent
                    </th>
                    <th style={{
                      padding: "12px", textAlign: "center",
                      borderBottom: "2px solid var(--border)",
                      color: "var(--text-muted)", fontSize: 12,
                      fontWeight: 600, position: "sticky", top: 0,
                      background: "var(--surface)", zIndex: 10,
                    }}>
                      Retard
                    </th>
                    <th style={{
                      padding: "12px", textAlign: "center",
                      borderBottom: "2px solid var(--border)",
                      color: "var(--text-muted)", fontSize: 12,
                      fontWeight: 600, position: "sticky", top: 0,
                      background: "var(--surface)", zIndex: 10,
                    }}>
                      Excusé
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInscriptions.map((inscription) => {
                    const key = String(inscription.id);
                    const currentStatus = presenceData[key] || "";
                    const statusConfig = presenceColors[currentStatus];

                    return (
                      <tr key={inscription.id} style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s",
                      }}>
                        <td style={{ padding: "12px", color: "var(--text)", fontWeight: 500 }}>
                          {getStudentFullName(inscription)}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          color: "var(--text-muted)",
                          fontFamily: "monospace", 
                          fontSize: 12 
                        }}>
                          {inscription.matricule}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                          {inscription.filiere_nom}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                          {inscription.niveau}
                        </td>
                        {["present", "absent", "retard", "excuse"].map((statut) => (
                          <td key={statut} style={{ 
                            padding: "12px", textAlign: "center",
                            background: currentStatus === statut ? presenceColors[statut]?.bg : "transparent",
                          }}>
                            <input
                              type="radio"
                              name={`presence-${inscription.id}`}
                              value={statut}
                              checked={currentStatus === statut}
                              onChange={() => handlePresenceChange(inscription.id, statut)}
                              disabled={!canManagePresence}
                              style={{
                                width: 18, height: 18,
                                cursor: canManagePresence ? "pointer" : "not-allowed",
                                accentColor: presenceColors[statut]?.bg,
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {filteredInscriptions.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{
                        textAlign: "center", padding: "40px",
                        color: "var(--text-muted)", fontSize: 14,
                      }}>
                        {inscLoading ? "Chargement des étudiants..." : "Aucun étudiant trouvé"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "var(--text-muted)", fontSize: 16,
          }}>
            <Calendar size={48} style={{ marginBottom: 16, color: "var(--text-muted)" }} />
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text)" }}>
              Sélectionnez une matière pour commencer
            </h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Choisissez une matière et une date pour enregistrer la présence des étudiants.
            </p>
          </div>
        </Card>
      )}

      {/* ── Modal de confirmation ─────────────────────────────────────────────── */}
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, title: "", message: "", onConfirm: null, loading: false })}
        loading={confirmState.loading}
      />
    </div>
  );
}
