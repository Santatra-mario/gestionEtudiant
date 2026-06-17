// controllers/dashboardController.js – Statistiques tableau de bord
const db = require("../config/db");

const getStats = async (req, res) => {
  try {
    // Nombre total d'étudiants
    const [[{ total_etudiants }]] = await db.query(
      "SELECT COUNT(*) AS total_etudiants FROM etudiants",
    );

    // Nombre de filières actives
    const [[{ total_filieres }]] = await db.query(
      "SELECT COUNT(*) AS total_filieres FROM filieres WHERE is_active = 1",
    );

    // Inscriptions en attente (statut actif sans notes)
    const [[{ inscriptions_en_attente }]] = await db.query(
      `SELECT COUNT(*) AS inscriptions_en_attente
       FROM inscriptions i
       WHERE i.statut = 'actif'
       AND NOT EXISTS (SELECT 1 FROM notes n WHERE n.inscription_id = i.id)`,
    );

    // Taux de réussite (calculé sur les inscriptions actives ET transférées disposant de notes)
    const [[{ admis, total_avec_notes }]] = await db.query(
      `SELECT
          SUM(IF(sub.moyenne >= 10, 1, 0)) AS admis,
          COUNT(*) AS total_avec_notes
       FROM (
           SELECT i.id AS inscription_id,
                  SUM(n.note * m.credit) / SUM(m.credit) AS moyenne
           FROM notes n
           JOIN inscriptions i ON n.inscription_id = i.id
           JOIN matieres m ON n.matiere_id = m.id
           WHERE i.statut IN ('actif', 'transfere')
           GROUP BY i.id
       ) AS sub`,
    );
    const taux_reussite =
      total_avec_notes > 0 ? Math.round((admis / total_avec_notes) * 100) : 0;

    // Répartition par filière (tous statuts pertinents incluant transfere)
    const [par_filiere] = await db.query(
      `SELECT COALESCE(f.nom, 'Sans filière') AS filiere, COUNT(i.id) AS nb_etudiants
       FROM inscriptions i
       LEFT JOIN filieres f ON i.filiere_id = f.id
       WHERE i.statut IN ('actif', 'suspendu', 'diplome', 'transfere')
       GROUP BY f.id
       ORDER BY nb_etudiants DESC`,
    );

    // Répartition par niveau (tous statuts pertinents incluant transfere)
    const [par_niveau] = await db.query(
      `SELECT niveau, COUNT(*) AS nb
       FROM inscriptions
       WHERE statut IN ('actif', 'suspendu', 'diplome', 'transfere')
       GROUP BY niveau
       ORDER BY FIELD(niveau,'L1','L2','L3','M1','M2')`,
    );

    // Derniers inscrits (10 derniers) – tous statuts, avec décision et notes
    const [derniers_inscrits] = await db.query(
      `SELECT
          COALESCE(e.matricule, i.id)                          AS matricule,
          CONCAT(COALESCE(e.prenom,''),' ',COALESCE(e.nom,'')) AS nom_complet,
          COALESCE(f.nom, 'Inconnue')                          AS filiere,
          i.niveau,
          i.statut,
          i.date_inscription,
          i.id                                                  AS inscription_id,
          COALESCE(vb.mention, 'En attente')                   AS decision,
          vb.moyenne,
          vb.notes_list
       FROM inscriptions i
       LEFT JOIN etudiants e ON i.etudiant_id = e.id
       LEFT JOIN filieres  f ON i.filiere_id  = f.id
       LEFT JOIN (
           SELECT
               i2.id,
               CASE
                   WHEN SUM(n.note * m.credit) / SUM(m.credit) >= 10 THEN 'Admis'
                   WHEN SUM(n.note * m.credit) / SUM(m.credit) >= 8  THEN 'Rattrapage'
                   ELSE 'Ajourné'
               END                                                              AS mention,
               ROUND(SUM(n.note * m.credit) / SUM(m.credit), 2)               AS moyenne,
               GROUP_CONCAT(
                   CONCAT(m.nom_matiere, ':', n.note)
                   ORDER BY m.nom_matiere
                   SEPARATOR ', '
               )                                                                AS notes_list
           FROM notes n
           JOIN inscriptions i2 ON n.inscription_id = i2.id
           JOIN matieres      m  ON n.matiere_id     = m.id
           GROUP BY i2.id
       ) vb ON i.id = vb.id
       ORDER BY i.date_inscription DESC
       LIMIT 10`,
    );

    return res.json({
      success: true,
      data: {
        total_etudiants,
        total_filieres,
        inscriptions_en_attente,
        taux_reussite,
        par_filiere,
        par_niveau,
        derniers_inscrits,
      },
    });
  } catch (err) {
    console.error("getStats dashboard:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

module.exports = { getStats };