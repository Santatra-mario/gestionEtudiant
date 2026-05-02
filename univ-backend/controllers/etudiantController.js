// controllers/etudiantController.js – CRUD Étudiants
const db = require('../config/db');
const path = require('path');

// ── Générer un matricule unique ───────────────────────────────────────────────
const genMatricule = async () => {
    const annee = new Date().getFullYear();
    const [rows] = await db.query(
        "SELECT matricule FROM etudiants WHERE matricule LIKE ? ORDER BY matricule DESC LIMIT 1",
        [`ETU-${annee}-%`]
    );
    const last = rows.length > 0 ? parseInt(rows[0].matricule.split('-')[2], 10) : 0;
    return `ETU-${annee}-${String(last + 1).padStart(4, '0')}`;
};

// ── GET /etudiants  (liste + filtres) ────────────────────────────────────────
const getAll = async (req, res) => {
    const { filiere, niveau, annee, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
        SELECT e.*, f.nom AS filiere_nom, i.niveau, i.statut, i.annee_universitaire
        FROM etudiants e
        LEFT JOIN inscriptions i ON i.etudiant_id = e.id
        LEFT JOIN filieres f     ON i.filiere_id  = f.id
        WHERE 1=1
    `;
    const params = [];

    if (search) {
        sql += ' AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)';
        const like = `%${search}%`;
        params.push(like, like, like);
    }
    if (filiere) { sql += ' AND f.code = ?';  params.push(filiere); }
    if (niveau)  { sql += ' AND i.niveau = ?'; params.push(niveau); }
    if (annee)   { sql += ' AND i.annee_universitaire = ?'; params.push(annee); }

    sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    try {
        const [rows] = await db.query(sql, params);
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) AS total FROM etudiants', []
        );
        return res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error('getAll etudiants:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
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
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Étudiant introuvable.' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── POST /etudiants ───────────────────────────────────────────────────────────
const create = async (req, res) => {
    const { nom, prenom, date_naissance, sexe, adresse, telephone, email } = req.body;

    if (!nom || !prenom || !date_naissance || !sexe) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
    }
    if (!['M', 'F'].includes(sexe)) {
        return res.status(400).json({ success: false, message: 'Sexe invalide (M ou F).' });
    }

    try {
        const matricule = await genMatricule();
        const photo = req.file ? req.file.filename : null;

        const [result] = await db.query(
            `INSERT INTO etudiants (matricule, nom, prenom, date_naissance, sexe, adresse, telephone, email, photo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [matricule, nom, prenom, date_naissance, sexe, adresse || null, telephone || null, email || null, photo]
        );

        return res.status(201).json({
            success: true,
            message: 'Étudiant créé.',
            data: { id: result.insertId, matricule }
        });
    } catch (err) {
        console.error('create etudiant:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── PUT /etudiants/:id ────────────────────────────────────────────────────────
const update = async (req, res) => {
    const { nom, prenom, date_naissance, sexe, adresse, telephone, email } = req.body;
    const { id } = req.params;

    try {
        const [exist] = await db.query('SELECT id FROM etudiants WHERE id = ?', [id]);
        if (exist.length === 0) return res.status(404).json({ success: false, message: 'Étudiant introuvable.' });

        const photo = req.file ? req.file.filename : undefined;
        const fields = { nom, prenom, date_naissance, sexe, adresse, telephone, email };
        if (photo) fields.photo = photo;

        const sets = Object.keys(fields).filter(k => fields[k] !== undefined).map(k => `${k} = ?`).join(', ');
        const vals = Object.keys(fields).filter(k => fields[k] !== undefined).map(k => fields[k]);

        await db.query(`UPDATE etudiants SET ${sets} WHERE id = ?`, [...vals, id]);
        return res.json({ success: true, message: 'Étudiant mis à jour.' });
    } catch (err) {
        console.error('update etudiant:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── DELETE /etudiants/:id ─────────────────────────────────────────────────────
const remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM etudiants WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Introuvable.' });
        return res.json({ success: true, message: 'Étudiant supprimé.' });
    } catch (err) {
        console.error('delete etudiant:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = { getAll, getOne, create, update, remove };
