import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { PageHeader, Card, Badge, Btn, Spinner } from "../components/ui";

const statutColor = {
  actif: "success",
  suspendu: "warning",
  diplome: "accent",
  abandonne: "danger",
};
const mentionColor = {
  Admis: "success",
  Rattrapage: "warning",
  Ajourné: "danger",
};

export default function EtudiantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [etudiant, setEtudiant] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/etudiants/${id}`),
      api.get(`/inscriptions/historique/${id}`),
    ])
      .then(([e, h]) => {
        setEtudiant(e.data.data);
        setHistorique(h.data.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!etudiant)
    return <p style={{ color: "var(--text-muted)" }}>Étudiant introuvable.</p>;

  // En dev, Vite proxifie /uploads → localhost:3000/uploads
  // En prod, les deux sont sur le même serveur → chemin relatif
  const photoUrl = etudiant.photo ? `/uploads/${etudiant.photo}` : null;

  return (
    <div>
      <PageHeader
        title={`${etudiant.prenom} ${etudiant.nom}`}
        subtitle={etudiant.matricule}
        action={
          <Btn variant="ghost" onClick={() => navigate(-1)}>
            ← Retour
          </Btn>
        }
      />

      <div
        style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}
      >
        {/* Fiche étudiant */}
        <Card>
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Photo"
              style={{
                width: "100%",
                borderRadius: 8,
                marginBottom: 16,
                aspectRatio: "1",
                objectFit: "cover",
              }}
            />
          )}
          {!photoUrl && (
            <div
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 8,
                marginBottom: 16,
                background: "var(--surface2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                color: "var(--text-muted)",
                fontFamily: "var(--font-display)",
              }}
            >
              {etudiant.prenom[0]}
            </div>
          )}

          <dl style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Matricule", etudiant.matricule],
              ["Sexe", etudiant.sexe === "M" ? "Masculin" : "Féminin"],
              [
                "Date naissance",
                etudiant.date_naissance
                  ? new Date(etudiant.date_naissance).toLocaleDateString("fr")
                  : "—",
              ],
              ["Téléphone", etudiant.telephone || "—"],
              ["Email", etudiant.email || "—"],
              ["Adresse", etudiant.adresse || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 2,
                  }}
                >
                  {k}
                </dt>
                <dd style={{ fontSize: 14, color: "var(--text)" }}>{v}</dd>
              </div>
            ))}
          </dl>

          {etudiant.statut && (
            <div style={{ marginTop: 16 }}>
              <Badge color={statutColor[etudiant.statut] || "muted"}>
                {etudiant.statut}
              </Badge>
            </div>
          )}
        </Card>

        {/* Historique */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              color: "var(--text)",
            }}
          >
            Historique académique
          </h2>

          {historique.length === 0 && (
            <Card>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Aucune inscription enregistrée.
              </p>
            </Card>
          )}

          {historique.map((h) => (
            <Card
              key={h.id}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: "var(--text)",
                    }}
                  >
                    {h.filiere_nom}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {h.annee_universitaire} · {h.niveau}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge color={statutColor[h.statut] || "muted"}>
                    {h.statut}
                  </Badge>
                  {h.mention && (
                    <Badge color={mentionColor[h.mention] || "muted"}>
                      {h.mention}
                    </Badge>
                  )}
                </div>
              </div>

              {h.moyenne != null && (
                <div
                  style={{
                    background: "var(--surface2)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    gap: 24,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Moyenne S1
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontFamily: "var(--font-display)",
                        color:
                          parseFloat(h.moyenne) >= 10
                            ? "var(--success)"
                            : "var(--danger)",
                      }}
                    >
                      {parseFloat(h.moyenne).toFixed(2)} / 20
                    </div>
                  </div>
                </div>
              )}

              <Btn
                small
                variant="ghost"
                onClick={() =>
                  (window.location.href = `/notes?inscription=${h.id}`)
                }
              >
                Voir les notes
              </Btn>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
