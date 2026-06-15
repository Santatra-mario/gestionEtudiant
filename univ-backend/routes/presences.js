const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/presences - Récupérer les présences avec filtres
router.get("/", async (req, res) => {
  try {
    const { matiere_id, date, inscription_id, filiere, niveau, search } =
      req.query;
    let query = `
      SELECT p.*, COALESCE(e.nom, '') as etudiant_nom, COALESCE(e.prenom, '') as etudiant_prenom, COALESCE(e.matricule, '') as matricule, COALESCE(f.nom, 'Inconnue') as filiere_nom, i.niveau as niveau_inscription,
             COALESCE(m.nom_matiere, '') as matiere_nom, COALESCE(m.code_matiere, '') as matiere_code
      FROM presences p
      JOIN inscriptions i ON p.inscription_id = i.id
      LEFT JOIN etudiants e ON i.etudiant_id = e.id
      LEFT JOIN filieres f ON i.filiere_id = f.id
      LEFT JOIN matieres m ON p.matiere_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (matiere_id) {
      query += " AND p.matiere_id = ?";
      params.push(matiere_id);
    }

    if (date) {
      query += " AND p.date = ?";
      params.push(date);
    }

    if (inscription_id) {
      query += " AND p.inscription_id = ?";
      params.push(inscription_id);
    }

    if (filiere) {
      query += " AND f.nom = ?";
      params.push(filiere);
    }

    if (niveau) {
      query += " AND i.niveau = ?";
      params.push(niveau);
    }

    if (search) {
      query += " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)";
      const like = "%" + search + "%";
      params.push(like, like, like);
    }

    query += " ORDER BY p.date DESC, p.id DESC";

    const [presences] = await db.execute(query, params);
    res.json({ success: true, data: presences });
  } catch (error) {
    console.error("Erreur récupération présences:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST /api/presences - Créer une présence
router.post("/", async (req, res) => {
  try {
    const { inscription_id, matiere_id, date, statut, enregistre_par } =
      req.body;

    // Validation
    if (!inscription_id || !matiere_id || !date || !statut) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const statutsValides = ["present", "absent", "retard", "excuse"];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    // Vérifier si une présence existe déjà pour cette inscription/matière/date
    const [existing] = await db.execute(
      "SELECT id FROM presences WHERE inscription_id = ? AND matiere_id = ? AND date = ?",
      [inscription_id, matiere_id, date],
    );

    if (existing.length > 0) {
      // Mettre à jour la présence existante
      await db.execute(
        "UPDATE presences SET statut = ?, enregistre_par = ?, updated_at = NOW() WHERE id = ?",
        [statut, enregistre_par || null, existing[0].id],
      );
      return res.json({
        message: "Présence mise à jour avec succès",
        id: existing[0].id,
      });
    }

    // Créer une nouvelle présence
    const [result] = await db.execute(
      "INSERT INTO presences (inscription_id, matiere_id, date, statut, enregistre_par, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [inscription_id, matiere_id, date, statut, enregistre_par || null],
    );

    res.json({
      message: "Présence enregistrée avec succès",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Erreur création présence:", error);

    // Gestion d'erreurs détaillée
    let errorMessage = "Erreur serveur";
    let statusCode = 500;

    if (error.code === "ER_NO_SUCH_TABLE") {
      errorMessage =
        "La table presences n'existe pas. Veuillez exécuter le script SQL.";
      statusCode = 503;
    } else if (error.code === "ER_DUP_ENTRY") {
      errorMessage = "Cette présence existe déjà pour cet étudiant.";
      statusCode = 409;
    } else if (error.code === "ER_NO_REFERENCED_ROW_2") {
      errorMessage = "L'inscription ou la matière spécifiée n'existe pas.";
      statusCode = 400;
    } else if (error.code === "ER_BAD_NULL_ERROR") {
      errorMessage = "L'ID de l'enregistreur ne peut pas être vide.";
      statusCode = 400;
    }

    res.status(statusCode).json({ message: errorMessage, error: error.code });
  }
});

// PUT /api/presences/:id - Mettre à jour une présence
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, enregistre_par } = req.body;

    const statutsValides = ["present", "absent", "retard", "excuse"];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const [result] = await db.execute(
      "UPDATE presences SET statut = ?, enregistre_par = ?, updated_at = NOW() WHERE id = ?",
      [statut, enregistre_par || null, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Présence non trouvée" });
    }

    res.json({ message: "Présence mise à jour avec succès" });
  } catch (error) {
    console.error("Erreur mise à jour présence:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE /api/presences/:id - Supprimer une présence
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute("DELETE FROM presences WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Présence non trouvée" });
    }

    res.json({ message: "Présence supprimée avec succès" });
  } catch (error) {
    console.error("Erreur suppression présence:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/presences/stats/:matiere_id/:date - Statistiques de présence
router.get("/stats/:matiere_id/:date", async (req, res) => {
  try {
    const { matiere_id, date } = req.params;

    const [stats] = await db.execute(
      `
      SELECT
        statut,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM presences WHERE matiere_id = ? AND date = ?), 1) as percentage
      FROM presences
      WHERE matiere_id = ? AND date = ?
      GROUP BY statut
    `,
      [matiere_id, date, matiere_id, date],
    );

    const [total] = await db.execute(
      "SELECT COUNT(*) as total FROM presences WHERE matiere_id = ? AND date = ?",
      [matiere_id, date],
    );

    res.json({
      total: total[0]?.total || 0,
      stats: stats,
    });
  } catch (error) {
    console.error("Erreur statistiques présence:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
