// controllers/dashboardController.js – Statistiques tableau de bord
const db = require('../config/db');

const getStats = async (req, res) => {
    try {
        // Nombre total d'étudiants
        const [[{ total_etudiants }]] = await db.query(
            'SELECT COUNT(*) AS total_etudiants FROM etudiants'
        );

        // Nombre de filières actives
        const [[{ total_filieres }]] = await db.query(
            'SELECT COUNT(*) AS total_filieres FROM filieres WHERE is_active = 1'
        );

        // Inscriptions en attente (pas de notes)
        const [[{ inscriptions_en_attente }]] = await db.query(
            `SELECT COUNT(*) AS inscriptions_en_attente
             FROM inscriptions i
             WHERE i.statut = 'actif'
             AND NOT EXISTS (SELECT 1 FROM notes n WHERE n.inscription_id = i.id)`
        );

        // Taux de réussite (moyenne >= 10)
        const [[{ admis, total_avec_notes }]] = await db.query(
            `SELECT
                SUM(IF(vb.moyenne >= 10, 1, 0)) AS admis,
                COUNT(*) AS total_avec_notes
             FROM vue_bulletins vb
             WHERE vb.semestre = 'S1'`
        );
        const taux_reussite = total_avec_notes > 0
            ? Math.round((admis / total_avec_notes) * 100)
            : 0;

        // Répartition par filière
        const [par_filiere] = await db.query(
            `SELECT f.nom AS filiere, COUNT(i.id) AS nb_etudiants
             FROM inscriptions i
             JOIN filieres f ON i.filiere_id = f.id
             WHERE i.statut = 'actif'
             GROUP BY f.id
             ORDER BY nb_etudiants DESC`
        );

        // Répartition par niveau
        const [par_niveau] = await db.query(
            `SELECT niveau, COUNT(*) AS nb
             FROM inscriptions
             WHERE statut = 'actif'
             GROUP BY niveau
             ORDER BY FIELD(niveau,'L1','L2','L3','M1','M2')`
        );

        // Derniers inscrits (5 derniers) avec décision
        const [derniers_inscrits] = await db.query(
            `SELECT e.matricule, CONCAT(e.nom,' ',e.prenom) AS nom_complet,
                    f.nom AS filiere, i.niveau, i.statut, i.date_inscription,
                    COALESCE(vb.mention, 'En attente') AS decision
             FROM inscriptions i
             JOIN etudiants e ON i.etudiant_id = e.id
             JOIN filieres  f ON i.filiere_id  = f.id
             LEFT JOIN (
                SELECT i2.id, 
                       CASE
                           WHEN SUM(n.note * m.coefficient) / SUM(m.coefficient) >= 10 THEN 'Admis'
                           WHEN SUM(n.note * m.coefficient) / SUM(m.coefficient) >= 8  THEN 'Rattrapage'
                           ELSE 'Ajourné'
                       END AS mention
                FROM notes n
                JOIN inscriptions i2 ON n.inscription_id = i2.id
                JOIN matieres m ON n.matiere_id = m.id
                GROUP BY i2.id
             ) vb ON i.id = vb.id
             ORDER BY i.date_inscription DESC
             LIMIT 5`
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
                derniers_inscrits
            }
        });
    } catch (err) {
        console.error('getStats dashboard:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = { getStats };
