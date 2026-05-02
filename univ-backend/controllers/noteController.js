// controllers/noteController.js – Gestion des notes & bulletins
const db = require('../config/db');

// ── GET /notes/inscription/:inscriptionId ─────────────────────────────────────
const getNotesByInscription = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT n.*, m.nom AS matiere_nom, m.coefficient, m.semestre,
                    (n.note * m.coefficient) AS note_ponderee
             FROM notes n
             JOIN matieres m ON n.matiere_id = m.id
             WHERE n.inscription_id = ?
             ORDER BY m.semestre, m.nom`,
            [req.params.inscriptionId]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /notes/bulletin/:inscriptionId ────────────────────────────────────────
const getBulletin = async (req, res) => {
    try {
        const [infoRows] = await db.query(
            `SELECT i.*, CONCAT(e.nom,' ',e.prenom) AS etudiant_nom, e.matricule,
                    f.nom AS filiere_nom, f.id AS filiere_id
             FROM inscriptions i
             JOIN etudiants e ON i.etudiant_id = e.id
             JOIN filieres  f ON i.filiere_id  = f.id
             WHERE i.id = ?`,
            [req.params.inscriptionId]
        );
        if (infoRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Inscription introuvable.' });
        }

        const [notes] = await db.query(
            `SELECT n.note, n.id AS note_id,
                    m.id AS matiere_id, m.nom AS matiere,
                    m.coefficient, m.semestre,
                    (n.note * m.coefficient) AS ponderee
             FROM notes n
             JOIN matieres m ON n.matiere_id = m.id
             WHERE n.inscription_id = ?
             ORDER BY m.semestre, m.nom`,
            [req.params.inscriptionId]
        );

        const semestres = {};
        notes.forEach(n => {
            if (!semestres[n.semestre]) {
                semestres[n.semestre] = { notes: [], totalPonderee: 0, totalCoeff: 0 };
            }
            semestres[n.semestre].notes.push(n);
            semestres[n.semestre].totalPonderee += parseFloat(n.ponderee);
            semestres[n.semestre].totalCoeff    += parseFloat(n.coefficient);
        });

        const resultat = {};
        Object.keys(semestres).sort().forEach(s => {
            const moy = semestres[s].totalCoeff > 0
                ? semestres[s].totalPonderee / semestres[s].totalCoeff
                : 0;
            resultat[s] = {
                notes:   semestres[s].notes,
                moyenne: Math.round(moy * 100) / 100,
                mention: moy >= 10 ? 'Admis' : moy >= 8 ? 'Rattrapage' : 'Ajourné'
            };
        });

        return res.json({
            success: true,
            inscription: infoRows[0],
            bulletin: resultat
        });
    } catch (err) {
        console.error('getBulletin:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── POST /notes  (créer ou mettre à jour une note) ────────────────────────────
const upsertNote = async (req, res) => {
    const { inscription_id, matiere_id, note } = req.body;

    if (inscription_id === undefined || matiere_id === undefined || note === undefined) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
    }

    const noteNum = parseFloat(note);
    if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
        return res.status(400).json({ success: false, message: 'La note doit être entre 0 et 20.' });
    }

    try {
        // Vérifier que la matière appartient bien à la filière de l'inscription
        const [check] = await db.query(
            `SELECT m.id FROM matieres m
             JOIN inscriptions i ON i.filiere_id = m.filiere_id
             WHERE m.id = ? AND i.id = ?`,
            [matiere_id, inscription_id]
        );
        if (check.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Matière incompatible avec la filière de l'inscription."
            });
        }

        await db.query(
            `INSERT INTO notes (inscription_id, matiere_id, note)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE note = VALUES(note)`,
            [inscription_id, matiere_id, noteNum]
        );

        return res.json({ success: true, message: 'Note enregistrée.' });
    } catch (err) {
        console.error('upsertNote:', err);
        return res.status(500).json({ success: false, message: `Erreur serveur : ${err.message}` });
    }
};

// ── POST /notes/batch  (saisie multiple) ─────────────────────────────────────
const batchUpsertNotes = async (req, res) => {
    const { inscription_id, notes } = req.body;

    const inscId = parseInt(inscription_id, 10);
    if (!inscId || inscId <= 0) {
        return res.status(400).json({ success: false, message: 'inscription_id invalide.' });
    }
    if (!Array.isArray(notes) || notes.length === 0) {
        return res.status(400).json({ success: false, message: 'Aucune note à enregistrer.' });
    }

    const notesValidees = [];
    for (const item of notes) {
        const matiereId = parseInt(item.matiere_id, 10);
        const noteVal   = parseFloat(item.note);

        if (isNaN(matiereId) || matiereId <= 0) {
            return res.status(400).json({
                success: false,
                message: `matiere_id invalide : ${item.matiere_id}`
            });
        }
        if (isNaN(noteVal) || noteVal < 0 || noteVal > 20) {
            return res.status(400).json({
                success: false,
                message: `Note invalide pour matière ${matiereId} : doit être entre 0 et 20.`
            });
        }
        notesValidees.push({ matiere_id: matiereId, note: noteVal });
    }

    try {
        // ✅ Tous les rôles peuvent saisir — pas de filtre par enseignant_id
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            for (const { matiere_id, note } of notesValidees) {
                await conn.query(
                    `INSERT INTO notes (inscription_id, matiere_id, note)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE note = VALUES(note)`,
                    [inscId, matiere_id, note]
                );
            }
            await conn.commit();
            return res.json({
                success: true,
                message: `${notesValidees.length} note(s) enregistrée(s).`
            });
        } catch (transactionErr) {
            await conn.rollback();
            console.error('batchUpsertNotes transaction error:', transactionErr);
            return res.status(500).json({
                success: false,
                message: `Erreur transaction : ${transactionErr.message}`
            });
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('batchUpsertNotes:', err);
        return res.status(500).json({
            success: false,
            message: `Erreur serveur : ${err.message}`
        });
    }
};

// ── DELETE /notes/:id ─────────────────────────────────────────────────────────
const remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Note introuvable.' });
        }
        return res.json({ success: true, message: 'Note supprimée.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = { getNotesByInscription, getBulletin, upsertNote, batchUpsertNotes, remove };
