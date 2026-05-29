// controllers/transfertController.js — Logique transferts UniGest
//
// Fonctions exportées :
//   getAll         → liste tous les transferts
//   getOne         → détail d'un transfert
//   create         → nouvelle demande inter-établissement
//   changerFiliere → transaction interne : archive inscription + crée nouvelle (secrétaire + admin)
//   accepter       → accepte une demande en_attente + crée inscription automatique
//   refuser        → refuse une demande en_attente avec motif
//   annuler        → remet un transfert traité en en_attente (admin seulement)

const db = require('../config/db');

/* ── helpers ────────────────────────────────────────────────────────────── */

/**
 * Récupère une inscription active d'un étudiant.
 * Retourne null si introuvable.
 */
async function getInscriptionActive(etudiantId) {
    const [rows] = await db.query(
        `SELECT i.*, f.nom as filiere_nom
         FROM inscriptions i
         LEFT JOIN filieres f ON i.filiere_id = f.id
         WHERE i.etudiant_id = ? AND i.statut = 'actif'
         LIMIT 1`,
        [etudiantId]
    );
    return rows[0] || null;
}

/* ══════════════════════════════════════════════════════════════════════════
   GET /transferts — Liste tous les transferts
   ══════════════════════════════════════════════════════════════════════════ */
exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*,
                   COALESCE(e.nom,    t.etudiant_nom_snapshot)    AS etudiant_nom,
                   COALESCE(e.prenom, t.etudiant_prenom_snapshot)  AS etudiant_prenom,
                   COALESCE(e.matricule, t.matricule_etudiant_snapshot) AS matricule,
                   f.nom        AS filiere_destination,
                   u.nom        AS traite_par_nom
            FROM   transferts t
            LEFT JOIN etudiants  e ON t.etudiant_id           = e.id
            LEFT JOIN filieres   f ON t.filiere_destination_id = f.id
            LEFT JOIN users      u ON t.traite_par             = u.id
            ORDER  BY t.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   GET /transferts/:id — Détail d'un transfert
   ══════════════════════════════════════════════════════════════════════════ */
exports.getOne = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*,
                   COALESCE(e.nom,      t.etudiant_nom_snapshot)       AS etudiant_nom,
                   COALESCE(e.prenom,   t.etudiant_prenom_snapshot)    AS etudiant_prenom,
                   COALESCE(e.matricule,t.matricule_etudiant_snapshot)  AS matricule,
                   e.date_naissance,
                   e.sexe,
                   e.telephone,
                   e.email           AS etudiant_email,
                   f.nom             AS filiere_destination,
                   u.nom             AS traite_par_nom
            FROM   transferts t
            LEFT JOIN etudiants  e ON t.etudiant_id           = e.id
            LEFT JOIN filieres   f ON t.filiere_destination_id = f.id
            LEFT JOIN users      u ON t.traite_par             = u.id
            WHERE  t.id = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Transfert introuvable' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   POST /transferts — Créer une demande de transfert inter-établissement
   Droits : secrétaire + administrateur  (garanti par le middleware de la route)
   ══════════════════════════════════════════════════════════════════════════ */
exports.create = async (req, res) => {
    try {
        const {
            etudiant_id, etablissement_origine, filiere_origine,
            filiere_destination_id, niveau, annee_universitaire, motif
        } = req.body;

        if (!etudiant_id || !etablissement_origine || !filiere_origine ||
            !filiere_destination_id || !niveau || !annee_universitaire) {
            return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
        }

        const [etudiantRows] = await db.query(
            'SELECT nom, prenom, matricule FROM etudiants WHERE id = ?',
            [etudiant_id]
        );
        if (!etudiantRows.length) {
            return res.status(404).json({ success: false, message: 'Étudiant introuvable' });
        }
        const etud = etudiantRows[0];

        await db.query(`
            INSERT INTO transferts
              (etudiant_id, etudiant_nom_snapshot, etudiant_prenom_snapshot, matricule_etudiant_snapshot,
               etablissement_origine, filiere_origine,
               filiere_destination_id, niveau, annee_universitaire, motif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            etudiant_id,
            etud.nom,
            etud.prenom,
            etud.matricule,
            etablissement_origine.toUpperCase(),
            filiere_origine,
            filiere_destination_id,
            niveau,
            annee_universitaire,
            motif || null
        ]);

        const [rows] = await db.query('SELECT * FROM transferts ORDER BY id DESC LIMIT 1');
        res.status(201).json({
            success: true,
            data: rows[0],
            message: 'Demande de transfert créée'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   POST /transferts/changer-filiere — Changement filière/niveau interne
   Droits : secrétaire + administrateur
   ══════════════════════════════════════════════════════════════════════════ */
exports.changerFiliere = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const {
            etudiant_id, inscription_id,
            nouvelle_filiere_id, nouveau_niveau,
            annee_universitaire, motif
        } = req.body;

        if (!etudiant_id || !inscription_id || !nouvelle_filiere_id || !nouveau_niveau || !annee_universitaire) {
            conn.release();
            return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
        }

        const [inscriptions] = await conn.query(
            'SELECT * FROM inscriptions WHERE id = ? AND etudiant_id = ?',
            [inscription_id, etudiant_id]
        );
        if (!inscriptions.length) {
            conn.release();
            return res.status(404).json({ success: false, message: 'Inscription introuvable pour cet étudiant' });
        }

        const insc = inscriptions[0];

        const [existant] = await conn.query(
            `SELECT id FROM inscriptions
             WHERE etudiant_id = ? AND filiere_id = ? AND niveau = ? AND annee_universitaire = ? AND statut = 'actif'`,
            [etudiant_id, nouvelle_filiere_id, nouveau_niveau, annee_universitaire]
        );
        if (existant.length) {
            conn.release();
            return res.status(400).json({
                success: false,
                message: 'Une inscription active existe déjà dans cette filière/niveau pour cette année'
            });
        }

        await conn.beginTransaction();

        await conn.query(
            `UPDATE inscriptions SET statut = 'abandonne' WHERE id = ?`,
            [inscription_id]
        );

        await conn.query(
            `INSERT INTO inscriptions
               (etudiant_id, filiere_id, niveau, annee_universitaire, statut, date_inscription)
             VALUES (?, ?, ?, ?, 'actif', CURDATE())`,
            [etudiant_id, nouvelle_filiere_id, nouveau_niveau, annee_universitaire]
        );

        await conn.commit();
        conn.release();

        res.json({ success: true, message: 'Changement de filière effectué avec succès' });
    } catch (err) {
        await conn.rollback().catch(() => {});
        conn.release();
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   PUT /transferts/:id/accepter — Accepter une demande en_attente
   Droits : secrétaire + administrateur

   FIX : La vérification de doublon a été supprimée — un transfert inter-
   établissement vers la même filière est parfaitement valide. L'inscription
   active de l'ancien établissement est archivée (statut → abandonne) avant
   de créer la nouvelle inscription dans la filière destination.
   ══════════════════════════════════════════════════════════════════════════ */
exports.accepter = async (req, res) => {
    try {
        const { id }      = req.params;
        const traite_par  = req.user?.id || null;

        const [transferts] = await db.query('SELECT * FROM transferts WHERE id = ?', [id]);
        if (!transferts.length) {
            return res.status(404).json({ success: false, message: 'Transfert introuvable' });
        }

        const t = transferts[0];
        if (t.statut !== 'en_attente') {
            return res.status(409).json({ success: false, message: 'Ce transfert a déjà été traité par un autre administrateur.' });
        }

        // Archiver toutes les inscriptions actives de l'étudiant (ancien établissement)
        // Un transfert inter-établissement vers la même filière est autorisé :
        // on archive d'abord, puis on crée la nouvelle inscription destination.
        await db.query(
            `UPDATE inscriptions SET statut = 'abandonne'
             WHERE etudiant_id = ? AND statut = 'actif'`,
            [t.etudiant_id]
        );

        // Accepter le transfert
        await db.query(
            `UPDATE transferts SET statut = 'accepte', traite_par = ?, date_traitement = NOW() WHERE id = ?`,
            [traite_par, id]
        );

        // Créer la nouvelle inscription dans la filière destination
        await db.query(
            `INSERT INTO inscriptions
               (etudiant_id, filiere_id, niveau, annee_universitaire, statut, date_inscription)
             VALUES (?, ?, ?, ?, 'actif', CURDATE())`,
            [t.etudiant_id, t.filiere_destination_id, t.niveau, t.annee_universitaire]
        );

        // Supprimer l'étudiant de la liste — il appartient désormais au nouvel établissement
        await db.query('DELETE FROM etudiants WHERE id = ?', [t.etudiant_id]);

        res.json({
            success: true,
            message: 'Transfert accepté : inscription créée et étudiant retiré de la liste.',
            etudiant_id: t.etudiant_id
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   PUT /transferts/:id/refuser — Refuser une demande en_attente
   Droits : secrétaire + administrateur
   ══════════════════════════════════════════════════════════════════════════ */
exports.refuser = async (req, res) => {
    try {
        const { id }        = req.params;
        const { motif_refus } = req.body;
        const traite_par    = req.user?.id || null;

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

        await db.query(
            `UPDATE transferts SET statut = 'refuse', motif_refus = ?, traite_par = ?, date_traitement = NOW() WHERE id = ?`,
            [motif_refus, traite_par, id]
        );

        res.json({ success: true, message: 'Transfert refusé' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   PUT /transferts/:id/annuler — Annuler / corriger un transfert traité
   Droits : administrateur seulement  (garanti par le middleware de la route)
   ══════════════════════════════════════════════════════════════════════════ */
exports.annuler = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { id }               = req.params;
        const { motif_annulation } = req.body;
        const annule_par           = req.user?.id || null;

        const [transferts] = await conn.query('SELECT * FROM transferts WHERE id = ?', [id]);
        if (!transferts.length) {
            conn.release();
            return res.status(404).json({ success: false, message: 'Transfert introuvable' });
        }

        const t = transferts[0];
        if (t.statut === 'en_attente') {
            conn.release();
            return res.status(400).json({ success: false, message: 'Ce transfert est déjà en attente' });
        }

        await conn.beginTransaction();

        if (t.statut === 'accepte') {
            await conn.query(
                `UPDATE inscriptions
                 SET statut = 'abandonne'
                 WHERE etudiant_id = ? AND filiere_id = ? AND niveau = ?
                   AND annee_universitaire = ? AND statut = 'actif'`,
                [t.etudiant_id, t.filiere_destination_id, t.niveau, t.annee_universitaire]
            );

            const [existEtud] = await conn.query(
                'SELECT id FROM etudiants WHERE id = ? OR matricule = ?',
                [t.etudiant_id, t.matricule_etudiant_snapshot || '']
            );

            if (!existEtud.length && t.matricule_etudiant_snapshot) {
                await conn.query(
                    `INSERT INTO etudiants
                       (id, matricule, nom, prenom, date_naissance, sexe)
                     VALUES (?, ?, ?, ?, CURDATE(), 'M')
                     ON DUPLICATE KEY UPDATE
                       nom    = VALUES(nom),
                       prenom = VALUES(prenom)`,
                    [
                        t.etudiant_id,
                        t.matricule_etudiant_snapshot,
                        t.etudiant_nom_snapshot    || 'Inconnu',
                        t.etudiant_prenom_snapshot || 'Inconnu'
                    ]
                );
            }
        }

        await conn.query(
            `UPDATE transferts
             SET statut           = 'en_attente',
                 traite_par       = NULL,
                 date_traitement  = NULL,
                 motif_refus      = NULL,
                 motif_annulation = ?,
                 annule_par       = ?
             WHERE id = ?`,
            [motif_annulation || null, annule_par, id]
        );

        await conn.commit();
        conn.release();

        res.json({
            success: true,
            message: t.statut === 'accepte'
                ? 'Transfert annulé : étudiant remis dans la liste, inscription archivée, demande en attente.'
                : 'Transfert annulé et remis en attente.'
        });
    } catch (err) {
        await conn.rollback().catch(() => {});
        conn.release();
        res.status(500).json({ success: false, message: err.message });
    }
};
