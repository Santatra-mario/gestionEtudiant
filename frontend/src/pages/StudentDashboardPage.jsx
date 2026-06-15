// pages/StudentDashboardPage.jsx – Tableau de bord étudiant
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LogOut,
  BookOpen,
  Award,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) {
      navigate("/etudiant/login");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("student_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, nRes] = await Promise.all([
        api.get("/student/profile", { headers }),
        api.get("/student/notes", { headers }),
      ]);
      setProfile(pRes.data.data);
      setNotes(nRes.data.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("student_user");
        navigate("/etudiant/login");
        return;
      }
      setError("Impossible de charger vos données.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("student_token");
    localStorage.removeItem("student_user");
    navigate("/etudiant/login");
  };

  // Grouper les notes par année et semestre
  const notesBySem = {};
  notes.forEach((n) => {
    const key = `${n.annee_universitaire} - ${n.semestre}`;
    if (!notesBySem[key]) notesBySem[key] = [];
    notesBySem[key].push(n);
  });

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
          <p
            style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 14 }}
          >
            Chargement de vos données...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          padding: 20,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
          <p style={{ color: "#ef4444", fontSize: 15 }}>{error}</p>
          <button
            onClick={loadData}
            style={{
              marginTop: 12,
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(11,15,26,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "2px solid var(--border)",
          padding: "0 28px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <GraduationCap size={22} color="var(--accent)" />
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            Portail Étudiant
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "var(--font-body)",
          }}
        >
          <LogOut size={15} /> Déconnexion
        </button>
      </div>

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Carte profil */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: 24,
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "center",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {profile?.prenom?.[0]}
            {profile?.nom?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {profile?.prenom} {profile?.nom}
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "var(--text-muted)",
                fontFamily: "monospace",
              }}
            >
              {profile?.matricule}
            </p>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginTop: 10,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              {profile?.email && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Mail size={13} /> {profile.email}
                </span>
              )}
              {profile?.telephone && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Phone size={13} /> {profile.telephone}
                </span>
              )}
              {profile?.filiere_nom && (
                <span>
                  <GraduationCap size={13} style={{ marginRight: 4 }} />
                  {profile.filiere_nom}
                </span>
              )}
              {profile?.niveau && (
                <span>
                  <Award size={13} style={{ marginRight: 4 }} />
                  {profile.niveau}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text)",
              margin: "0 0 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BookOpen size={18} color="var(--accent)" /> Mes notes
          </h3>

          {Object.keys(notesBySem).length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "var(--surface)",
                borderRadius: 16,
                border: "1px solid var(--border)",
              }}
            >
              <BookOpen
                size={40}
                color="var(--text-muted)"
                style={{ opacity: 0.3, marginBottom: 12 }}
              />
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Aucune note disponible pour le moment.
              </p>
            </div>
          ) : (
            Object.entries(notesBySem).map(([key, semNotes]) => {
              const totalPond = semNotes.reduce(
                (sum, n) =>
                  sum +
                  parseFloat(n.note) *
                    parseFloat(n.credit || n.coefficient || 1),
                0,
              );
              const totalCoeff = semNotes.reduce(
                (sum, n) => sum + parseFloat(n.credit || n.coefficient || 1),
                0,
              );
              const moyenne =
                totalCoeff > 0 ? (totalPond / totalCoeff).toFixed(2) : "—";

              return (
                <div
                  key={key}
                  style={{
                    marginBottom: 16,
                    background: "var(--surface)",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 18px",
                      background: "var(--surface2)",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--text)",
                        fontSize: 14,
                      }}
                    >
                      {key}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Moyenne :{" "}
                      <strong
                        style={{
                          color:
                            parseFloat(moyenne) >= 10
                              ? "var(--success)"
                              : "var(--danger)",
                        }}
                      >
                        {moyenne}/20
                      </strong>
                    </span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          <th
                            style={{
                              padding: "10px 14px",
                              textAlign: "left",
                              color: "var(--text-muted)",
                              fontWeight: 600,
                              fontSize: 11,
                              textTransform: "uppercase",
                            }}
                          >
                            Matière
                          </th>
                          <th
                            style={{
                              padding: "10px 14px",
                              textAlign: "center",
                              color: "var(--text-muted)",
                              fontWeight: 600,
                              fontSize: 11,
                              textTransform: "uppercase",
                            }}
                          >
                            Code
                          </th>
                          <th
                            style={{
                              padding: "10px 14px",
                              textAlign: "center",
                              color: "var(--text-muted)",
                              fontWeight: 600,
                              fontSize: 11,
                              textTransform: "uppercase",
                            }}
                          >
                            Coeff.
                          </th>
                          <th
                            style={{
                              padding: "10px 14px",
                              textAlign: "center",
                              color: "var(--text-muted)",
                              fontWeight: 600,
                              fontSize: 11,
                              textTransform: "uppercase",
                            }}
                          >
                            Note /20
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {semNotes.map((n, idx) => (
                          <tr
                            key={idx}
                            style={{ borderBottom: "1px solid var(--border)" }}
                          >
                            <td
                              style={{
                                padding: "10px 14px",
                                color: "var(--text)",
                                fontWeight: 500,
                              }}
                            >
                              {n.matiere || n.matiere_old}
                            </td>
                            <td
                              style={{
                                padding: "10px 14px",
                                textAlign: "center",
                                color: "var(--text-muted)",
                                fontFamily: "monospace",
                                fontSize: 12,
                              }}
                            >
                              {n.code || n.code_old}
                            </td>
                            <td
                              style={{
                                padding: "10px 14px",
                                textAlign: "center",
                                color: "var(--text-muted)",
                              }}
                            >
                              {n.credit || n.coefficient}
                            </td>
                            <td
                              style={{
                                padding: "10px 14px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: 14,
                                  color:
                                    parseFloat(n.note) >= 10
                                      ? "var(--success)"
                                      : "var(--danger)",
                                }}
                              >
                                {parseFloat(n.note).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
