// controllers/authController.js – Inscription & Connexion
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
require('dotenv').config();

// ── Connexion ─────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
        }

        // Ajout de etudiant_id dans le payload JWT (null si pas étudiant)
        const token = jwt.sign(
            {
                id:          user.id,
                email:       user.email,
                role:        user.role,
                etudiant_id: user.etudiant_id || null,   // ← AJOUT
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return res.json({
            success: true,
            token,
            user: {
                id:          user.id,
                nom:         user.nom,
                prenom:      user.prenom,
                email:       user.email,
                role:        user.role,
                etudiant_id: user.etudiant_id || null,   // ← AJOUT
            }
        });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── Inscription publique (secrétaire / enseignant uniquement) ─────────────────
// Un administrateur connecté peut créer n'importe quel rôle via la route protégée.
const register = async (req, res) => {
    const { nom, prenom, email, password, role } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }

    // Validation du rôle
    const rolesValides = ['administrateur', 'secretaire', 'enseignant', 'etudiant'];  // ← AJOUT 'etudiant'
    if (!rolesValides.includes(role)) {
        return res.status(400).json({ success: false, message: 'Rôle invalide.' });
    }

    // Longueur minimale du mot de passe
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    // Si la route n'est pas protégée (inscription publique), on interdit la création d'admin
    // La propriété req.user est définie uniquement si le middleware verifyToken a été appelé.
    const isPublicRegister = !req.user;
    if (isPublicRegister && role === 'administrateur') {
        return res.status(403).json({
            success: false,
            message: 'La création d\'un compte administrateur nécessite une authentification.'
        });
    }

    // Si l'utilisateur connecté n'est pas admin, il ne peut pas créer un admin
    if (req.user && req.user.role !== 'administrateur' && role === 'administrateur') {
        return res.status(403).json({
            success: false,
            message: 'Seul un administrateur peut créer un compte administrateur.'
        });
    }

    try {
        // Vérification de l'unicité de l'email
        const [exist] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (exist.length > 0) {
            return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
        }

        // Hashage du mot de passe
        const hash = await bcrypt.hash(password, 10);

        // etudiant_id : obligatoire si rôle etudiant, ignoré sinon
        const etudiantId = (role === 'etudiant' && req.body.etudiant_id)
            ? req.body.etudiant_id
            : null;

        // Si rôle etudiant, vérifier que l'etudiant_id existe et n'est pas déjà lié
        if (role === 'etudiant') {
            if (!etudiantId) {
                return res.status(400).json({ success: false, message: 'etudiant_id requis pour le rôle étudiant.' });
            }
            const [etCheck] = await db.query('SELECT id FROM etudiants WHERE id = ?', [etudiantId]);
            if (etCheck.length === 0) {
                return res.status(404).json({ success: false, message: 'Étudiant introuvable.' });
            }
            const [alreadyLinked] = await db.query('SELECT id FROM users WHERE etudiant_id = ?', [etudiantId]);
            if (alreadyLinked.length > 0) {
                return res.status(409).json({ success: false, message: 'Cet étudiant a déjà un compte.' });
            }
        }

        // Insertion en base
        const [result] = await db.query(
            'INSERT INTO users (nom, prenom, email, password, role, etudiant_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nom, prenom, email, hash, role, etudiantId]
        );

        return res.status(201).json({
            success: true,
            message: 'Compte créé avec succès.',
            userId: result.insertId
        });
    } catch (err) {
        console.error('register error:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── Profil de l'utilisateur connecté ─────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, nom, prenom, email, role, etudiant_id, is_active, created_at, updated_at FROM users WHERE id = ?',  // ← AJOUT etudiant_id
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        return res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('getProfile error:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = { login, register, getProfile };
