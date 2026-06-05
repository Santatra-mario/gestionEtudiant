// controllers/matiereController.js – Gestion des matières (module complet)
const db = require("../config/db");

// ── GET /matieres ─────────────────────────────────────
exports.getAllMatieres = async (req, res) => {
  try {
    const { niveau, search } = req.query;
    let sql = `
            SELECT m.*,
                   CONCAT(u.nom, ' ', u.prenom) AS enseignant_nom,
                   f.nom AS filiere_nom
            FROM matieres m
            LEFT JOIN users u ON u.id = m.enseignant_id
            LEFT JOIN filieres f ON m.filiere_id = f.id
            WHERE 1=1
        `;
    const params = [];

    if (niveau) {
      sql += " AND m.niveau = ?";
      params.push(niveau);
    }
    if (search) {
      sql += " AND (m.code_matiere LIKE ? OR m.nom_matiere LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like);
    }

    sql += " ORDER BY m.niveau, m.semestre, m.nom_matiere";

    const [rows] = await db.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getAllMatieres:", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── GET /matieres/:id ─────────────────────────────────────
exports.getMatiereById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*,
                    CONCAT(u.nom, ' ', u.prenom) AS enseignant_nom,
                    f.nom AS filiere_nom
             FROM matieres m
             LEFT JOIN users u ON u.id = m.enseignant_id
             LEFT JOIN filieres f ON m.filiere_id = f.id
             WHERE m.id = ?`,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Matière introuvable." });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── POST /matieres ─────────────────────────────────────
exports.createMatiere = async (req, res) => {
  const {
    code_matiere,
    nom_matiere,
    filiere_id,
    niveau,
    semestre,
    credit,
    volume_horaire,
    enseignant_id,
  } = req.body;

  if (!code_matiere || !code_matiere.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Le code matière est obligatoire." });
  }
  if (!nom_matiere || !nom_matiere.trim()) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Le nom de la matière est obligatoire.",
      });
  }
  if (!niveau) {
    return res
      .status(400)
      .json({ success: false, message: "Le niveau est obligatoire (L1-L5)." });
  }

  const NIVEAUX_VALIDES = ["L1", "L2", "L3", "M1", "M2"];
  if (!NIVEAUX_VALIDES.includes(niveau)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Niveau invalide. Valeurs : L1, L2, L3, M1, M2.",
      });
  }

  const SEMESTRES_VALIDES = [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10",
  ];
  if (semestre && !SEMESTRES_VALIDES.includes(semestre)) {
    return res
      .status(400)
      .json({ success: false, message: "Semestre invalide." });
  }

  if (credit && isNaN(parseFloat(credit))) {
    return res
      .status(400)
      .json({ success: false, message: "Le crédit doit être un nombre." });
  }
  if (volume_horaire && isNaN(parseInt(volume_horaire))) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Le volume horaire doit être un nombre.",
      });
  }

  try {
    const [exist] = await db.query(
      "SELECT id FROM matieres WHERE code_matiere = ?",
      [code_matiere.trim().toUpperCase()],
    );
    if (exist.length > 0) {
      return res
        .status(409)
        .json({
          success: false,
          message: `Le code "${code_matiere.toUpperCase()}" est déjà utilisé.`,
        });
    }

    const ensId = enseignant_id ? parseInt(enseignant_id, 10) : null;
    const filId = filiere_id ? parseInt(filiere_id, 10) : null;

    const [result] = await db.query(
      `INSERT INTO matieres (code_matiere, nom_matiere, filiere_id, niveau, semestre, credit, volume_horaire, enseignant_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code_matiere.trim().toUpperCase(),
        nom_matiere.trim(),
        filId,
        niveau,
        semestre || "S1",
        credit || 1.0,
        volume_horaire || null,
        ensId,
      ],
    );

    return res.status(201).json({
      success: true,
      message: `Matière "${nom_matiere.trim()}" créée avec succès.`,
      id: result.insertId,
    });
  } catch (err) {
    console.error("createMatiere:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ success: false, message: "Code matière déjà utilisé." });
    }
    return res
      .status(500)
      .json({
        success: false,
        message: "Erreur lors de la création : " + err.message,
      });
  }
};

// ── PUT /matieres/:id ─────────────────────────────────────
exports.updateMatiere = async (req, res) => {
  const {
    code_matiere,
    nom_matiere,
    filiere_id,
    niveau,
    semestre,
    credit,
    volume_horaire,
    enseignant_id,
  } = req.body;
  const { id } = req.params;

  try {
    const [exist] = await db.query("SELECT id FROM matieres WHERE id = ?", [
      id,
    ]);
    if (exist.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Matière introuvable." });
    }

    if (code_matiere) {
      const [dup] = await db.query(
        "SELECT id FROM matieres WHERE code_matiere = ? AND id != ?",
        [code_matiere.trim().toUpperCase(), id],
      );
      if (dup.length > 0) {
        return res
          .status(409)
          .json({ success: false, message: "Code matière déjà utilisé." });
      }
    }

    const ensId =
      enseignant_id !== undefined
        ? enseignant_id === "" || enseignant_id === null
          ? null
          : parseInt(enseignant_id, 10)
        : undefined;
    const filId =
      filiere_id !== undefined
        ? filiere_id === "" || filiere_id === null
          ? null
          : parseInt(filiere_id, 10)
        : undefined;

    const fields = {};
    if (code_matiere !== undefined)
      fields.code_matiere = code_matiere.trim().toUpperCase();
    if (nom_matiere !== undefined) fields.nom_matiere = nom_matiere.trim();
    if (filId !== undefined) fields.filiere_id = filId;
    if (niveau !== undefined) fields.niveau = niveau;
    if (semestre !== undefined) fields.semestre = semestre;
    if (credit !== undefined) fields.credit = parseFloat(credit);
    if (volume_horaire !== undefined)
      fields.volume_horaire = volume_horaire ? parseInt(volume_horaire) : null;
    if (ensId !== undefined) fields.enseignant_id = ensId;

    const sets = Object.keys(fields)
      .map((k) => `${k} = ?`)
      .join(", ");
    const vals = Object.values(fields);

    await db.query(`UPDATE matieres SET ${sets} WHERE id = ?`, [...vals, id]);
    return res.json({ success: true, message: "Matière mise à jour." });
  } catch (err) {
    console.error("updateMatiere:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Erreur serveur : " + err.message });
  }
};

// ── DELETE /matieres/:id ─────────────────────────────────────
exports.deleteMatiere = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM matieres WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Matière introuvable." });
    }
    return res.json({ success: true, message: "Matière supprimée." });
  } catch (err) {
    console.error("deleteMatiere:", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};
