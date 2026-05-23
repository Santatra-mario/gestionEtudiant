const db = require('../config/db');

// Liste tous les transferts
exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, 
                   e.nom as etudiant_nom, e.prenom as etudiant_prenom, e.matricule,
                   f.nom as filiere_destination,
                   u.nom as traite_par_nom
            FROM transferts t
            LEFT JOIN etudiants e ON t.etudiant_id = e.id
            LEFT JOIN filieres f ON t.filiere_destination_id = f.id
            LEFT JOIN users u ON t.traite_par = u.id
            ORDER BY t.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Créer une demande de transfert
exports.create = async (req, res) => {
    try {
        const { etudiant_id, etablissement_origine, filiere_origine,
                filiere_destination_id, niveau, annee_universitaire, motif } = req.body;

        if (!etudiant_id || !etablissement_origine || !filiere_origine ||
            !filiere_destination_id || !niveau || !annee_universitaire) {
            return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
        }

        await db.query(`
            INSERT INTO transferts 
            (etudiant_id, etablissement_origine, filiere_origine,
             filiere_destination_id, niveau, annee_universitaire, motif)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [etudiant_id, etablissement_origine.toUpperCase(), filiere_origine,
            filiere_destination_id, niveau, annee_universitaire, motif || null]);

        const [rows] = await db.query(
            'SELECT * FROM transferts ORDER BY id DESC LIMIT 1'
        );
        res.status(201).json({ success: true, data: rows[0], message: 'Demande de transfert créée' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Accepter un transfert → crée l'inscription automatiquement
exports.accepter = async (req, res) => {
    try {
        const { id } = req.params;
        const traite_par = req.user?.id || null;

        const [transferts] = await db.query('SELECT * FROM transferts WHERE id = ?', [id]);
        if (!transferts.length) {
            return res.status(404).json({ success: false, message: 'Transfert introuvable' });
        }

        const t = transferts[0];
        if (t.statut !== 'en_attente') {
            return res.status(400).json({ success: false, message: 'Transfert déjà traité' });
        }

        // Vérifier que l'étudiant n'est pas déjà inscrit dans cette filière/niveau/année
        const [existant] = await db.query(`
            SELECT id FROM inscriptions 
            WHERE etudiant_id = ? AND filiere_id = ? AND niveau = ? AND annee_universitaire = ?
        `, [t.etudiant_id, t.filiere_destination_id, t.niveau, t.annee_universitaire]);

        if (existant.length) {
            return res.status(400).json({ success: false, message: 'Étudiant déjà inscrit dans cette filière' });
        }

        // Mise à jour statut → trigger génère automatiquement le matricule H-TOL
        await db.query(`
            UPDATE transferts SET statut = 'accepte', traite_par = ? WHERE id = ?
        `, [traite_par, id]);

        // Création inscription automatique
        await db.query(`
            INSERT INTO inscriptions 
            (etudiant_id, filiere_id, niveau, annee_universitaire, statut, date_inscription)
            VALUES (?, ?, ?, ?, 'actif', CURDATE())
        `, [t.etudiant_id, t.filiere_destination_id, t.niveau, t.annee_universitaire]);

        res.json({ success: true, message: 'Transfert accepté et inscription créée automatiquement' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Refuser un transfert
exports.refuser = async (req, res) => {
    try {
        const { id } = req.params;
        const { motif_refus } = req.body;
        const traite_par = req.user?.id || null;

        if (!motif_refus) {
            return res.status(400).json({ success: false, message: 'Motif de refus obligatoire' });
        }

        const [transferts] = await db.query('SELECT * FROM transferts WHERE id = ?', [id]);
        if (!transferts.length) {
            return res.status(404).json({ success: false, message: 'Transfert introuvable' });
        }

        if (transferts[0].statut !== 'en_attente') {
            return res.status(400).json({ success: false, message: 'Transfert déjà traité' });
        }

        await db.query(`
            UPDATE transferts SET statut = 'refuse', motif_refus = ?, traite_par = ? WHERE id = ?
        `, [motif_refus, traite_par, id]);

        res.json({ success: true, message: 'Transfert refusé' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Détail d'un transfert
exports.getOne = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, 
                   e.nom as etudiant_nom, e.prenom as etudiant_prenom, e.matricule,
                   e.date_naissance, e.sexe, e.telephone, e.email as etudiant_email,
                   f.nom as filiere_destination,
                   u.nom as traite_par_nom
            FROM transferts t
            LEFT JOIN etudiants e ON t.etudiant_id = e.id
            LEFT JOIN filieres f ON t.filiere_destination_id = f.id
            LEFT JOIN users u ON t.traite_par = u.id
            WHERE t.id = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Transfert introuvable' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
