// controllers/filiereController.js – Filières & Matières
const db = require('../config/db');

// ═══════════════════════════════════════════════════════
//  FILIÈRES
// ═══════════════════════════════════════════════════════

const getAllFilieres = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT f.*, COUNT(m.id) AS nb_matieres
             FROM filieres f
             LEFT JOIN matieres m ON m.filiere_id = f.id
             WHERE f.is_active = 1
             GROUP BY f.id
             ORDER BY f.nom`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

const createFiliere = async (req, res) => {
    const { code, nom, description } = req.body;
    if (!code || !nom) {
        return res.status(400).json({ success: false, message: 'Code et nom requis.' });
    }
    try {
        const [exist] = await db.query('SELECT id FROM filieres WHERE code = ?', [code]);
        if (exist.length > 0) return res.status(409).json({ success: false, message: 'Code déjà utilisé.' });

        const [result] = await db.query(
            'INSERT INTO filieres (code, nom, description) VALUES (?, ?, ?)',
            [code, nom, description || null]
        );
        return res.status(201).json({ success: true, message: 'Filière créée.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

const updateFiliere = async (req, res) => {
    const { nom, description, is_active } = req.body;
    try {
        await db.query(
            'UPDATE filieres SET nom = ?, description = ?, is_active = ? WHERE id = ?',
            [nom, description || null, is_active !== undefined ? is_active : 1, req.params.id]
        );
        return res.json({ success: true, message: 'Filière mise à jour.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

const deleteFiliere = async (req, res) => {
    try {
        await db.query('UPDATE filieres SET is_active = 0 WHERE id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Filière désactivée.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ═══════════════════════════════════════════════════════
//  MATIÈRES
// ═══════════════════════════════════════════════════════

const getMatieresByFiliere = async (req, res) => {
    try {
        // ✅ Inclure enseignant_id + nom de l'enseignant pour l'affichage
        const [rows] = await db.query(
            `SELECT m.*,
                    CONCAT(u.nom, ' ', u.prenom) AS enseignant_nom
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

const createMatiere = async (req, res) => {
    // ✅ Accepter enseignant_id (optionnel)
    const { filiere_id, code, nom, coefficient, semestre, enseignant_id } = req.body;
    if (!filiere_id || !code || !nom || !coefficient || !semestre) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
    }
    if (!['S1','S2'].includes(semestre)) {
        return res.status(400).json({ success: false, message: 'Semestre invalide (S1 ou S2).' });
    }
    try {
        const ensId = enseignant_id ? parseInt(enseignant_id, 10) : null;

        // Vérifier que l'enseignant existe et a bien le rôle enseignant
        if (ensId) {
            const [ensCheck] = await db.query(
                `SELECT id FROM users WHERE id = ? AND role = 'enseignant' AND is_active = 1`,
                [ensId]
            );
            if (ensCheck.length === 0) {
                return res.status(400).json({ success: false, message: "Enseignant introuvable ou inactif." });
            }
        }

        const [result] = await db.query(
            'INSERT INTO matieres (filiere_id, code, nom, coefficient, semestre, enseignant_id) VALUES (?, ?, ?, ?, ?, ?)',
            [filiere_id, code, nom, coefficient, semestre, ensId]
        );
        return res.status(201).json({ success: true, message: 'Matière ajoutée.', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Code matière déjà utilisé.' });
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

const updateMatiere = async (req, res) => {
    // ✅ Accepter enseignant_id dans la mise à jour
    const { nom, coefficient, semestre, enseignant_id } = req.body;
    try {
        const ensId = enseignant_id !== undefined
            ? (enseignant_id === '' || enseignant_id === null ? null : parseInt(enseignant_id, 10))
            : undefined;

        if (ensId !== null && ensId !== undefined) {
            const [ensCheck] = await db.query(
                `SELECT id FROM users WHERE id = ? AND role = 'enseignant' AND is_active = 1`,
                [ensId]
            );
            if (ensCheck.length === 0) {
                return res.status(400).json({ success: false, message: "Enseignant introuvable ou inactif." });
            }
        }

        await db.query(
            'UPDATE matieres SET nom = ?, coefficient = ?, semestre = ?, enseignant_id = ? WHERE id = ?',
            [nom, coefficient, semestre, ensId !== undefined ? ensId : null, req.params.id]
        );
        return res.json({ success: true, message: 'Matière mise à jour.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

const deleteMatiere = async (req, res) => {
    try {
        await db.query('DELETE FROM matieres WHERE id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Matière supprimée.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ✅ NOUVEAU : liste des enseignants pour le select dans le formulaire matière
const getEnseignants = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, nom, prenom, CONCAT(nom, ' ', prenom) AS nom_complet
             FROM users WHERE role = 'enseignant' AND is_active = 1
             ORDER BY nom, prenom`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = {
    getAllFilieres, createFiliere, updateFiliere, deleteFiliere,
    getMatieresByFiliere, createMatiere, updateMatiere, deleteMatiere,
    getEnseignants
};
