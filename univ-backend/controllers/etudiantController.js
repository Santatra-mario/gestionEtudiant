// controllers/etudiantController.js – CRUD Étudiants
const db = require("../config/db");
const path = require("path");
const bcrypt = require("bcrypt");

// ── Générer un matricule unique (Format: 20XX H-F) ──────────────────────────────
const genMatricule = async () => {
  // 1. Trouver le dernier numéro utilisé (ex: extraire 2042 de "2042 H-F")
  const [rows] = await db.query(
    "SELECT matricule FROM etudiants WHERE matricule REGEXP '^[0-9]{4} H-F$' ORDER BY CAST(SUBSTRING_INDEX(matricule, ' ', 1) AS UNSIGNED) DESC LIMIT 1",
  );

  let nextNum = 2000; // Valeur de départ demandée
  if (rows.length > 0) {
    const lastMatricule = rows[0].matricule;
    const lastNum = parseInt(lastMatricule.split(" ")[0], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  // 2. Formater avec le suffixe fixe "H-F"
  return `${nextNum} H-F`;
};

// ── GET /etudiants  (liste + filtres) ────────────────────────────────────────
const getAll = async (req, res) => {
  const {
    filiere,
    niveau,
    annee,
    search,
    page = 1,
    limit = 20,
    avec_inscription,
  } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Si avec_inscription=true : INNER JOIN pour n'avoir que les étudiants inscrits (actif)
  const joinType = avec_inscription === "true" ? "INNER" : "LEFT";
  const inscriptionFilter =
    avec_inscription === "true"
      ? "ON i.etudiant_id = e.id AND i.statut = 'actif'"
      : "ON i.etudiant_id = e.id";

  let sql = `
        SELECT e.*, f.nom AS filiere_nom, i.niveau, i.statut, i.annee_universitaire
        FROM etudiants e
        ${joinType} JOIN inscriptions i ${inscriptionFilter}
        LEFT JOIN filieres f ON i.filiere_id = f.id
        WHERE 1=1
    `;
  const params = [];

  if (search) {
    sql += " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (filiere) {
    sql += " AND f.code = ?";
    params.push(filiere);
  }
  if (niveau) {
    sql += " AND i.niveau = ?";
    params.push(niveau);
  }
  if (annee) {
    sql += " AND i.annee_universitaire = ?";
    params.push(annee);
  }

  // GROUP BY évite les doublons quand un étudiant a plusieurs inscriptions
  sql += " GROUP BY e.id ORDER BY e.created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);

  try {
    const [rows] = await db.query(sql, params);
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM etudiants",
      [],
    );
    return res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("getAll etudiants:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── GET /etudiants/:id ────────────────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, f.nom AS filiere_nom, i.niveau, i.statut, i.annee_universitaire, i.id AS inscription_id
             FROM etudiants e
             LEFT JOIN inscriptions i ON i.etudiant_id = e.id
             LEFT JOIN filieres f     ON i.filiere_id  = f.id
             WHERE e.id = ?`,
      [req.params.id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Étudiant introuvable." });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── POST /etudiants ───────────────────────────────────────────────────────────
const create = async (req, res) => {
  const {
    nom,
    prenom,
    date_naissance,
    sexe,
    adresse,
    telephone,
    email,
    password,
  } = req.body;

  if (!nom || !prenom || !date_naissance || !sexe) {
    return res
      .status(400)
      .json({ success: false, message: "Champs obligatoires manquants." });
  }
  if (!["M", "F"].includes(sexe)) {
    return res
      .status(400)
      .json({ success: false, message: "Sexe invalide (M ou F)." });
  }

  try {
    const matricule = await genMatricule();
    const photo = req.file ? req.file.path : null;

    let hashedPassword = null;
    if (password && typeof password === "string") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const [result] = await db.query(
      `INSERT INTO etudiants (matricule, nom, prenom, date_naissance, sexe, adresse, telephone, email, photo, password)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matricule,
        nom,
        prenom,
        date_naissance,
        sexe,
        adresse || null,
        telephone || null,
        email || null,
        photo,
        hashedPassword,
      ],
    );

    // Créer l'inscription si demandée (inscription immédiate)
    let inscriptionId = null;
    if (req.body.inscription) {
      try {
        const inscData = JSON.parse(req.body.inscription);
        if (
          inscData.filiere_id &&
          inscData.niveau &&
          inscData.date_inscription
        ) {
          const [inscResult] = await db.query(
            `INSERT INTO inscriptions (etudiant_id, filiere_id, niveau, annee_universitaire, date_inscription, statut)
                   VALUES (?, ?, ?, ?, ?, 'actif')`,
            [
              result.insertId,
              inscData.filiere_id,
              inscData.niveau,
              inscData.annee_universitaire,
              inscData.date_inscription,
            ],
          );
          inscriptionId = inscResult.insertId;
        }
      } catch (e) {
        console.error("Erreur création inscription:", e.message);
      }
    }

    return res.status(201).json({
      success: true,
      message:
        "Étudiant créé." + (inscriptionId ? " Inscription effectuée." : ""),
      data: { id: result.insertId, matricule, inscription_id: inscriptionId },
    });
  } catch (err) {
    console.error("create etudiant:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── PUT /etudiants/:id ────────────────────────────────────────────────────────
const update = async (req, res) => {
  const { nom, prenom, date_naissance, sexe, adresse, telephone, email } =
    req.body;
  const { id } = req.params;

  // Validation des champs obligatoires
  if (!nom || !prenom || !date_naissance || !sexe) {
    return res.status(400).json({
      success: false,
      message:
        "Champs obligatoires manquants (nom, prenom, date_naissance, sexe).",
    });
  }
  if (!["M", "F"].includes(sexe)) {
    return res
      .status(400)
      .json({ success: false, message: "Sexe invalide (M ou F)." });
  }

  try {
    const [exist] = await db.query("SELECT id FROM etudiants WHERE id = ?", [
      id,
    ]);
    if (exist.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Étudiant introuvable." });

    // Construire les champs à mettre à jour
    // On utilise null explicitement pour effacer les champs optionnels vides
    const fields = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      date_naissance,
      sexe,
      adresse: adresse ? adresse.trim() : null,
      telephone: telephone ? telephone.trim() : null,
      email: email ? email.trim() : null,
    };

    // Ajouter la photo seulement si un nouveau fichier est envoyé
    if (req.file) fields.photo = req.file.path;

    const keys = Object.keys(fields);
    const sets = keys.map((k) => `${k} = ?`).join(", ");
    const vals = keys.map((k) => fields[k]);

    if (!sets) {
      return res.json({
        success: true,
        message: "Aucune modification détectée.",
      });
    }

    await db.query(`UPDATE etudiants SET ${sets} WHERE id = ?`, [...vals, id]);
    return res.json({ success: true, message: "Étudiant mis à jour." });
  } catch (err) {
    console.error("update etudiant:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── DELETE /etudiants/:id ─────────────────────────────────────────────────────
// Suppression en cascade manuelle dans le bon ordre :
// notes → presences → transferts → inscriptions → etudiant
// IMPORTANT : notes et presences n'ont PAS de colonne etudiant_id —
//             elles sont liées via inscription_id. On récupère d'abord
//             les IDs d'inscription, puis on supprime dans cet ordre.
const remove = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;

    // 1. Vérifier que l'étudiant existe
    const [rows] = await conn.query(
      "SELECT id, nom, prenom, matricule FROM etudiants WHERE id = ?",
      [id],
    );
    if (!rows.length) {
      conn.release();
      return res
        .status(404)
        .json({ success: false, message: "Étudiant introuvable." });
    }
    const etudiant = rows[0];

    // 2. Récupérer tous les IDs d'inscription de cet étudiant
    const [inscriptions] = await conn.query(
      "SELECT id FROM inscriptions WHERE etudiant_id = ?",
      [id],
    );
    const inscriptionIds = inscriptions.map((i) => i.id);

    await conn.beginTransaction();

    if (inscriptionIds.length > 0) {
      // 3. Supprimer les notes liées aux inscriptions
      await conn.query("DELETE FROM notes WHERE inscription_id IN (?)", [
        inscriptionIds,
      ]);

      // 4. Supprimer les présences liées aux inscriptions
      await conn.query("DELETE FROM presences WHERE inscription_id IN (?)", [
        inscriptionIds,
      ]);
    }

    // 5. Supprimer les transferts liés à l'étudiant
    await conn.query("DELETE FROM transferts WHERE etudiant_id = ?", [id]);

    // 6. Supprimer les inscriptions liées
    await conn.query("DELETE FROM inscriptions WHERE etudiant_id = ?", [id]);

    // 7. Supprimer l'étudiant
    await conn.query("DELETE FROM etudiants WHERE id = ?", [id]);

    await conn.commit();
    conn.release();

    return res.json({
      success: true,
      message: `Étudiant ${etudiant.prenom} ${etudiant.nom} (${etudiant.matricule}) supprimé avec toutes ses données liées.`,
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    console.error("delete etudiant:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erreur serveur : " + err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
