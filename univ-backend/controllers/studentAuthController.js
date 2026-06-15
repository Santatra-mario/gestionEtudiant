// controllers/studentAuthController.js – Authentification étudiant
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "uniggest_secret_key_change_in_prod";
const JWT_EXPIRES = "24h";

// ── POST /api/student/login ──────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email et mot de passe requis." });
    }

    // Chercher l'étudiant par email
    console.log(
      "STUDENT_LOGIN_DEBUG: Searching for student with email:",
      email,
    );
    const [rows] = await db.query(
      "SELECT id, nom, prenom, matricule, email, password FROM etudiants WHERE email = ?",
      [email],
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect." });
    }

    const etudiant = rows[0];

    // Vérifier le mot de passe
    if (!etudiant.password) {
      console.log(
        "STUDENT_LOGIN_DEBUG: Student found but password is null for email:",
        email,
      );
      return res.status(401).json({
        success: false,
        message:
          "Compte non activé. Veuillez définir un mot de passe via l'administration ou créer un nouvel étudiant.",
      });
    }

    const validPassword = await bcrypt.compare(password, etudiant.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect." });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: etudiant.id, email: etudiant.email, role: "etudiant" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES },
    );

    return res.json({
      success: true,
      message: "Connexion réussie.",
      data: {
        token,
        user: {
          id: etudiant.id,
          nom: etudiant.nom,
          prenom: etudiant.prenom,
          matricule: etudiant.matricule,
          email: etudiant.email,
          role: "etudiant",
        },
      },
    });
  } catch (err) {
    console.error("Erreur login étudiant:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── GET /api/student/profile ────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.nom, e.prenom, e.matricule, e.email, e.telephone, e.date_naissance, e.sexe, e.adresse, e.photo,
              i.niveau, i.annee_universitaire, i.statut, i.id AS inscription_id,
              f.nom AS filiere_nom
       FROM etudiants e
       LEFT JOIN inscriptions i ON i.etudiant_id = e.id AND i.statut = 'actif'
       LEFT JOIN filieres f ON i.filiere_id = f.id
       WHERE e.id = ?`,
      [req.user.id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Étudiant introuvable." });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Erreur profil étudiant:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── GET /api/student/notes ──────────────────────────────────
exports.getNotes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.note, m.nom_matiere AS matiere, m.nom AS matiere_old,
              m.code_matiere AS code, m.codemat AS code_old,
              m.credit, m.coefficient,
              m.semestre, i.niveau, i.annee_universitaire,
              f.nom AS filiere
       FROM notes n
       JOIN matieres m ON n.matiere_id = m.id
       JOIN inscriptions i ON n.inscription_id = i.id
       JOIN filieres f ON i.filiere_id = f.id
       WHERE i.etudiant_id = ?
       ORDER BY i.annee_universitaire DESC, m.semestre`,
      [req.user.id],
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Erreur notes étudiant:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── GET /api/student/presences ──────────────────────────────
exports.getPresences = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, m.nom_matiere AS matiere_nom, m.code_matiere AS matiere_code
       FROM presences p
       JOIN inscriptions i ON p.inscription_id = i.id
       LEFT JOIN matieres m ON p.matiere_id = m.id
       WHERE i.etudiant_id = ?
       ORDER BY p.date DESC, p.id DESC`,
      [req.user.id],
    );

    return res.json({ success: true, presences: rows, data: rows });
  } catch (err) {
    console.error("Erreur présences étudiant:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};
