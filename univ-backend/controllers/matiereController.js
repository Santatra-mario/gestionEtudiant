// controllers/matiereController.js – Gestion des matières
const db = require('../config/db');

// ── GET /matieres ─────────────────────────────────────
const getAllMatieres = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.*, f.nom AS filiere_nom,
                    CONCAT(u.nom, ' ', u.prenom) AS enseignant_nom
             FROM matieres m
             JOIN filieres f ON m.filiere_id = f.id
             LEFT JOIN users u ON u.id = m.enseignant_id
             ORDER BY f.nom, m.semestre, m.nom`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /matieres/:id ─────────────────────────────────────
const getMatiereById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.*, f.nom AS filiere_nom,
                    CONCAT(u.nom, ' ', u.prenom) AS enseignant_nom
             FROM matieres m
             JOIN filieres f ON m.filiere_id = f.id
             LEFT JOIN users u ON u.id = m.enseignant_id
             WHERE m.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Matière introuvable.' });
        }
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /matieres/filiere/:filiereId ─────────────────────
const getMatieresByFiliere = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.*, CONCAT(u.nom, ' ', u.prenom) AS enseignant_nom
             FROM matieres m
             LEFT JOIN users u ON u.id = m.enseignant_id AND u.role = 'enseignant'
             WHERE m.filiere_id = ?
             ORDER BY m.semestre, m.nom`,
            [req.params.filiereId]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = {
    getAllMatieres,
    getMatiereById,
    getMatieresByFiliere
};
