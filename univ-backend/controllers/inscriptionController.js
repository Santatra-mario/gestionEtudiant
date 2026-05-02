// controllers/inscriptionController.js – Gestion des inscriptions
const db = require('../config/db');

// ── GET /inscriptions ─────────────────────────────────────────────────────────
const getAll = async (req, res) => {
    const { annee, statut, filiere } = req.query;
    let sql = `
        SELECT i.*, CONCAT(e.nom,' ',e.prenom) AS etudiant_nom, e.matricule,
               f.nom AS filiere_nom
        FROM inscriptions i
        JOIN etudiants e ON i.etudiant_id = e.id
        JOIN filieres  f ON i.filiere_id  = f.id
        WHERE 1=1
    `;
    const params = [];

    if (annee)   { sql += ' AND i.annee_universitaire = ?'; params.push(annee); }
    if (statut)  { sql += ' AND i.statut = ?';             params.push(statut); }
    if (filiere) { sql += ' AND f.code = ?';               params.push(filiere); }

    sql += ' ORDER BY i.date_inscription DESC';

    try {
        const [rows] = await db.query(sql, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getAll inscriptions:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /inscriptions/historique/:etudiantId ──────────────────────────────────
const getHistorique = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT i.*, f.nom AS filiere_nom,
                    vb.moyenne, vb.mention
             FROM inscriptions i
             JOIN filieres f ON i.filiere_id = f.id
             LEFT JOIN vue_bulletins vb ON vb.inscription_id = i.id AND vb.semestre = 'S1'
             WHERE i.etudiant_id = ?
             ORDER BY i.annee_universitaire DESC`,
            [req.params.etudiantId]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── POST /inscriptions ────────────────────────────────────────────────────────
const create = async (req, res) => {
    const { etudiant_id, filiere_id, niveau, annee_universitaire, date_inscription } = req.body;

    if (!etudiant_id || !filiere_id || !niveau || !annee_universitaire || !date_inscription) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
    }

    const niveauxValides = ['L1','L2','L3','M1','M2'];
    if (!niveauxValides.includes(niveau)) {
        return res.status(400).json({ success: false, message: 'Niveau invalide.' });
    }

    try {
        // Vérifier doublon
        const [exist] = await db.query(
            'SELECT id FROM inscriptions WHERE etudiant_id = ? AND annee_universitaire = ? AND niveau = ?',
            [etudiant_id, annee_universitaire, niveau]
        );
        if (exist.length > 0) {
            return res.status(409).json({ success: false, message: 'Cet étudiant est déjà inscrit à ce niveau pour cette année.' });
        }

        const [result] = await db.query(
            `INSERT INTO inscriptions (etudiant_id, filiere_id, niveau, annee_universitaire, date_inscription)
             VALUES (?, ?, ?, ?, ?)`,
            [etudiant_id, filiere_id, niveau, annee_universitaire, date_inscription]
        );

        return res.status(201).json({ success: true, message: 'Inscription créée.', id: result.insertId });
    } catch (err) {
        console.error('create inscription:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── PUT /inscriptions/:id/statut ──────────────────────────────────────────────
const updateStatut = async (req, res) => {
    const { statut } = req.body;
    const statutsValides = ['actif','suspendu','diplome','abandonne'];

    if (!statutsValides.includes(statut)) {
        return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE inscriptions SET statut = ? WHERE id = ?',
            [statut, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Inscription introuvable.' });
        return res.json({ success: true, message: 'Statut mis à jour.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── DELETE /inscriptions/:id ──────────────────────────────────────────────────
const remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM inscriptions WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Introuvable.' });
        return res.json({ success: true, message: 'Inscription supprimée.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = { getAll, getHistorique, create, updateStatut, remove };
