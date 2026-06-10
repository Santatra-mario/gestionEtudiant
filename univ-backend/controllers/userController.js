// controllers/userController.js – Gestion CRUD des utilisateurs (admin uniquement)
const bcrypt = require('bcrypt');
const db     = require('../config/db');

// Colonnes sûres à retourner (jamais le password)
const SAFE_COLS = 'id, nom, prenom, email, role, is_active, created_at, updated_at';

// ── GET /users  (liste de tous les utilisateurs) ──────────────────────────────
const getAll = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${SAFE_COLS} FROM users ORDER BY created_at DESC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getAll users:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /users/:id ────────────────────────────────────────────────────────────
const getOne = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${SAFE_COLS} FROM users WHERE id = ?`,
            [req.params.id]
        );
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('getOne user:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── PUT /users/:id  (modifier nom, prénom, email, rôle) ──────────────────────
const update = async (req, res) => {
    const { nom, prenom, email, role } = req.body;
    const { id } = req.params;

    if (!nom || !prenom || !email || !role) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }

    const rolesValides = ['administrateur', 'secretaire', 'enseignant'];
    if (!rolesValides.includes(role)) {
        return res.status(400).json({ success: false, message: 'Rôle invalide.' });
    }

    try {
        // Vérifier l'existence de l'utilisateur
        const [exist] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (exist.length === 0)
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

        // Vérifier l'unicité de l'email (excluant l'utilisateur courant)
        const [emailExist] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?', [email, id]
        );
        if (emailExist.length > 0)
            return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });

        await db.query(
            'UPDATE users SET nom = ?, prenom = ?, email = ?, role = ? WHERE id = ?',
            [nom, prenom, email, role, id]
        );

        return res.json({ success: true, message: 'Utilisateur mis à jour.' });
    } catch (err) {
        console.error('update user:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── PATCH /users/:id/password  (changer le mot de passe) ─────────────────────
// Accessible par un admin (pour n'importe quel user) ou par l'user lui-même
const changePassword = async (req, res) => {
    const { newPassword, currentPassword } = req.body;
    const { id } = req.params;
    const isAdmin   = req.user.role === 'administrateur';
    const isSelf    = String(req.user.id) === String(id);

    if (!isAdmin && !isSelf) {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
        });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

        const user = rows[0];

        // Si ce n'est pas un admin, vérifier l'ancien mot de passe
        if (!isAdmin) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Le mot de passe actuel est requis.'
                });
            }
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                return res.status(401).json({
                    success: false,
                    message: 'Mot de passe actuel incorrect.'
                });
            }
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);

        return res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
    } catch (err) {
        console.error('changePassword:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── PATCH /users/:id/toggle  (activer / désactiver) ──────────────────────────
const toggleActive = async (req, res) => {
    const { id } = req.params;

    // Empêcher l'admin de se désactiver lui-même
    if (String(req.user.id) === String(id)) {
        return res.status(400).json({
            success: false,
            message: 'Vous ne pouvez pas désactiver votre propre compte.'
        });
    }

    try {
        const [rows] = await db.query('SELECT id, is_active FROM users WHERE id = ?', [id]);
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

        const newState = rows[0].is_active ? 0 : 1;
        await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newState, id]);

        return res.json({
            success: true,
            message: newState ? 'Compte activé.' : 'Compte désactivé.',
            is_active: newState
        });
    } catch (err) {
        console.error('toggleActive:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── DELETE /users/:id  (suppression définitive) ───────────────────────────────
const remove = async (req, res) => {
    const { id } = req.params;

    // Empêcher l'admin de se supprimer lui-même
    if (String(req.user.id) === String(id)) {
        return res.status(400).json({
            success: false,
            message: 'Vous ne pouvez pas supprimer votre propre compte.'
        });
    }

    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

        return res.json({ success: true, message: 'Utilisateur supprimé.' });
    } catch (err) {
        console.error('delete user:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = { getAll, getOne, update, changePassword, toggleActive, remove };
