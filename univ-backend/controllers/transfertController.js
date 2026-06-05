// controllers/transfertController.js — Logique transferts UniGest
//
// CORRECTIONS APPORTÉES :
//  1. ensureSnapshotColumns() — crée automatiquement les colonnes snapshot
//     si elles manquent (règle l'erreur "Unknown column ... in INSERT INTO")
//  2. exports.accepter — entouré d'une transaction pour éviter les états partiels
//  3. exports.refuser  — statut 409 cohérent avec la vérification côté frontend
//  4. exports.annuler  — utilise les snapshots pour remettre l'étudiant

const db = require("../config/db");

/* ── helper : garantit l'existence des colonnes snapshot ────────────────── */

/**
 * Crée les colonnes snapshot si elles n'existent pas encore dans la table
 * transferts. Appelé avant chaque INSERT pour éviter l'erreur MySQL :
 *   "Unknown column 'etudiant_nom_snapshot' in 'INSERT INTO'"
 *
 * Compatible MySQL 5.7+ et MySQL 8+.
 */
async function ensureSnapshotColumns() {
  const cols = [
    { name: "etudiant_nom_snapshot", def: "VARCHAR(100) NULL" },
    { name: "etudiant_prenom_snapshot", def: "VARCHAR(100) NULL" },
    { name: "matricule_etudiant_snapshot", def: "VARCHAR(50)  NULL" },
  ];

  // Compatible MySQL 5.7+ : on vérifie via INFORMATION_SCHEMA avant d'ALTER
  const [existingCols] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transferts'`,
  );
  const existingNames = new Set(existingCols.map((c) => c.COLUMN_NAME));

  for (const { name, def } of cols) {
    if (!existingNames.has(name)) {
      await db.query(`ALTER TABLE transferts ADD COLUMN ${name} ${def}`);
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   GET /transferts — Liste tous les transferts
   ══════════════════════════════════════════════════════════════════════════ */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
            SELECT t.*,
                   COALESCE(e.nom,      t.etudiant_nom_snapshot)         AS etudiant_nom,
                   COALESCE(e.prenom,   t.etudiant_prenom_snapshot)      AS etudiant_prenom,
                   COALESCE(e.matricule,t.matricule_etudiant_snapshot)    AS matricule,
                   e.id                                                   AS etudiant_id,
                   f.nom  AS filiere_destination,
                   u.nom  AS traite_par_nom
            FROM   transferts t
            LEFT JOIN etudiants e ON t.etudiant_id            = e.id
            LEFT JOIN filieres  f ON t.filiere_destination_id = f.id
            LEFT JOIN users     u ON t.traite_par              = u.id
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
    const [rows] = await db.query(
      `
            SELECT t.*,
                   COALESCE(e.nom,      t.etudiant_nom_snapshot)         AS etudiant_nom,
                   COALESCE(e.prenom,   t.etudiant_prenom_snapshot)      AS etudiant_prenom,
                   COALESCE(e.matricule,t.matricule_etudiant_snapshot)    AS matricule,
                   e.date_naissance,
                   e.sexe,
                   e.telephone,
                   e.email AS etudiant_email,
                   f.nom   AS filiere_destination,
                   u.nom   AS traite_par_nom
            FROM   transferts t
            LEFT JOIN etudiants e ON t.etudiant_id            = e.id
            LEFT JOIN filieres  f ON t.filiere_destination_id = f.id
            LEFT JOIN users     u ON t.traite_par              = u.id
            WHERE  t.id = ?
        `,
      [req.params.id],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Transfert introuvable" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   POST /transferts — Créer une demande de transfert inter-établissement
   Droits : secrétaire + administrateur
   ══════════════════════════════════════════════════════════════════════════ */
exports.create = async (req, res) => {
  try {
    const {
      etudiant_id,
      etablissement_origine,
      filiere_origine,
      filiere_destination_id,
      niveau,
      annee_universitaire,
      motif,
    } = req.body;

    /* ── Validation ── */
    if (
      !etudiant_id ||
      !etablissement_origine ||
      !filiere_origine ||
      !filiere_destination_id ||
      !niveau ||
      !annee_universitaire
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Champs obligatoires manquants" });
    }

    /* ── Récupérer les infos de l'étudiant pour les snapshots ── */
    const [etudiantRows] = await db.query(
      "SELECT nom, prenom, matricule FROM etudiants WHERE id = ?",
      [etudiant_id],
    );
    if (!etudiantRows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Étudiant introuvable" });
    }
    const etud = etudiantRows[0];

    /* ── S'assurer que les colonnes snapshot existent ── */
    await ensureSnapshotColumns();

    /* ── Insérer le transfert avec les snapshots ── */
    await db.query(
      `
            INSERT INTO transferts
              (etudiant_id,
               etudiant_nom_snapshot,
               etudiant_prenom_snapshot,
               matricule_etudiant_snapshot,
               etablissement_origine,
               filiere_origine,
               filiere_destination_id,
               niveau,
               annee_universitaire,
               motif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        etudiant_id,
        etud.nom,
        etud.prenom,
        etud.matricule,
        etablissement_origine.toUpperCase(),
        filiere_origine,
        filiere_destination_id,
        niveau,
        annee_universitaire,
        motif || null,
      ],
    );

    /* ── Retourner le transfert créé avec les jointures ── */
    const [rows] = await db.query(`
            SELECT t.*,
                   COALESCE(e.nom,    t.etudiant_nom_snapshot)    AS etudiant_nom,
                   COALESCE(e.prenom, t.etudiant_prenom_snapshot) AS etudiant_prenom,
                   f.nom AS filiere_destination
            FROM   transferts t
            LEFT JOIN etudiants e ON t.etudiant_id            = e.id
            LEFT JOIN filieres  f ON t.filiere_destination_id = f.id
            ORDER  BY t.id DESC LIMIT 1
        `);

    res.status(201).json({
      success: true,
      data: rows[0],
      message: "Demande de transfert créée avec succès",
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
      etudiant_id,
      inscription_id,
      nouvelle_filiere_id,
      nouveau_niveau,
      annee_universitaire,
      motif,
    } = req.body;

    if (
      !etudiant_id ||
      !inscription_id ||
      !nouvelle_filiere_id ||
      !nouveau_niveau ||
      !annee_universitaire
    ) {
      conn.release();
      return res
        .status(400)
        .json({ success: false, message: "Champs obligatoires manquants" });
    }

    const [inscriptions] = await conn.query(
      "SELECT * FROM inscriptions WHERE id = ? AND etudiant_id = ?",
      [inscription_id, etudiant_id],
    );
    if (!inscriptions.length) {
      conn.release();
      return res
        .status(404)
        .json({
          success: false,
          message: "Inscription introuvable pour cet étudiant",
        });
    }

    const [existant] = await conn.query(
      `SELECT id FROM inscriptions
             WHERE etudiant_id = ? AND filiere_id = ? AND niveau = ?
               AND annee_universitaire = ? AND statut = 'actif'`,
      [etudiant_id, nouvelle_filiere_id, nouveau_niveau, annee_universitaire],
    );
    if (existant.length) {
      conn.release();
      return res.status(400).json({
        success: false,
        message:
          "Une inscription active existe déjà dans cette filière/niveau pour cette année",
      });
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE inscriptions SET statut = 'abandonne' WHERE id = ?`,
      [inscription_id],
    );

    await conn.query(
      `INSERT INTO inscriptions
               (etudiant_id, filiere_id, niveau, annee_universitaire, statut, date_inscription)
             VALUES (?, ?, ?, ?, 'actif', CURDATE())`,
      [etudiant_id, nouvelle_filiere_id, nouveau_niveau, annee_universitaire],
    );

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message:
        "Changement de filière effectué avec succès. L'ancienne inscription est archivée.",
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   PUT /transferts/:id/accepter — Accepter une demande en_attente
   Droits : administrateur seulement
   ══════════════════════════════════════════════════════════════════════════ */
exports.accepter = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const traite_par = req.user?.id || null;

    const [transferts] = await conn.query(
      "SELECT * FROM transferts WHERE id = ?",
      [id],
    );
    if (!transferts.length) {
      conn.release();
      return res
        .status(404)
        .json({ success: false, message: "Transfert introuvable" });
    }

    const t = transferts[0];
    if (t.statut !== "en_attente") {
      conn.release();
      return res.status(409).json({
        success: false,
        message: "Ce transfert a déjà été traité par un autre administrateur.",
      });
    }

    await conn.beginTransaction();

    // 1. Récupérer le matricule actuel de l'étudiant pour construire le nouveau
    const [etudiantRows] = await conn.query(
      "SELECT matricule FROM etudiants WHERE id = ?",
      [t.etudiant_id],
    );
    const ancienMatricule = etudiantRows.length
      ? etudiantRows[0].matricule
      : "";

    // Construire le nouveau matricule : extraire le numéro (ex: "2000") et remplacer
    // "H-F" par "H-<CODE_ETABLISSEMENT>" → ex: "2000 H-F" → "2000 H-TOL"
    const codeEtab = (t.etablissement_origine || "EXT").toUpperCase().trim();
    let nouveauMatricule = ancienMatricule;
    if (ancienMatricule) {
      // Remplace tout ce qui suit le premier espace par "H-<CODE>"
      const numPart = ancienMatricule.split(" ")[0]; // ex: "2000"
      nouveauMatricule = `${numPart} H-${codeEtab}`; // ex: "2000 H-TOL"
    }

    // 1b. Mettre à jour le matricule de l'étudiant AVANT de le supprimer
    //     (le snapshot dans la table transferts gardera ce nouveau matricule)
    await conn.query("UPDATE etudiants SET matricule = ? WHERE id = ?", [
      nouveauMatricule,
      t.etudiant_id,
    ]);

    // 1c. Mettre à jour aussi le snapshot dans le transfert avec le nouveau matricule
    await conn.query(
      "UPDATE transferts SET matricule_etudiant_snapshot = ? WHERE id = ?",
      [nouveauMatricule, id],
    );

    // 2. Archiver toutes les inscriptions actives de l'étudiant
    await conn.query(
      `UPDATE inscriptions SET statut = 'transfere'
             WHERE etudiant_id = ? AND statut = 'actif'`,
      [t.etudiant_id],
    );

    // 3. Marquer le transfert comme accepté
    await conn.query(
      `UPDATE transferts
             SET statut = 'accepte', traite_par = ?, date_traitement = NOW()
             WHERE id = ?`,
      [traite_par, id],
    );

    // 4. Créer la nouvelle inscription dans la filière destination
    await conn.query(
      `INSERT INTO inscriptions
               (etudiant_id, filiere_id, niveau, annee_universitaire, statut, date_inscription)
             VALUES (?, ?, ?, ?, 'actif', CURDATE())`,
      [
        t.etudiant_id,
        t.filiere_destination_id,
        t.niveau,
        t.annee_universitaire,
      ],
    );

    // 5. Supprimer l'étudiant (il rejoint le nouvel établissement)
    await conn.query("DELETE FROM etudiants WHERE id = ?", [t.etudiant_id]);

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: `Transfert accepté : matricule changé en "${nouveauMatricule}", inscription créée et étudiant retiré de la liste.`,
      etudiant_id: t.etudiant_id,
      nouveau_matricule: nouveauMatricule,
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   PUT /transferts/:id/refuser — Refuser une demande en_attente
   Droits : administrateur seulement
   ══════════════════════════════════════════════════════════════════════════ */
exports.refuser = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif_refus } = req.body;
    const traite_par = req.user?.id || null;

    if (!motif_refus || !motif_refus.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Motif de refus obligatoire" });
    }

    const [transferts] = await db.query(
      "SELECT * FROM transferts WHERE id = ?",
      [id],
    );
    if (!transferts.length) {
      return res
        .status(404)
        .json({ success: false, message: "Transfert introuvable" });
    }
    if (transferts[0].statut !== "en_attente") {
      return res
        .status(409)
        .json({ success: false, message: "Ce transfert a déjà été traité" });
    }

    await db.query(
      `UPDATE transferts
             SET statut = 'refuse', motif_refus = ?, traite_par = ?, date_traitement = NOW()
             WHERE id = ?`,
      [motif_refus.trim(), traite_par, id],
    );

    res.json({ success: true, message: "Transfert refusé avec succès" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   PUT /transferts/:id/annuler — Annuler un transfert traité
   Droits : administrateur seulement
   ══════════════════════════════════════════════════════════════════════════ */
exports.annuler = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { motif_annulation } = req.body;
    const annule_par = req.user?.id || null;

    const [transferts] = await conn.query(
      "SELECT * FROM transferts WHERE id = ?",
      [id],
    );
    if (!transferts.length) {
      conn.release();
      return res
        .status(404)
        .json({ success: false, message: "Transfert introuvable" });
    }

    const t = transferts[0];
    if (t.statut === "en_attente") {
      conn.release();
      return res
        .status(400)
        .json({ success: false, message: "Ce transfert est déjà en attente" });
    }

    await conn.beginTransaction();

    if (t.statut === "accepte") {
      // Archiver l'inscription destination créée lors de l'acceptation
      await conn.query(
        `UPDATE inscriptions
                 SET statut = 'abandonne'
                 WHERE etudiant_id = ? AND filiere_id = ? AND niveau = ?
                   AND annee_universitaire = ? AND statut = 'actif'`,
        [
          t.etudiant_id,
          t.filiere_destination_id,
          t.niveau,
          t.annee_universitaire,
        ],
      );

      // Remettre l'étudiant dans la liste en utilisant les snapshots
      const nomSnapshot = t.etudiant_nom_snapshot || "Inconnu";
      const prenomSnapshot = t.etudiant_prenom_snapshot || "Inconnu";
      const matriculeSnapshot = t.matricule_etudiant_snapshot || null;

      if (matriculeSnapshot) {
        await conn.query(
          `INSERT INTO etudiants (id, matricule, nom, prenom, date_naissance, sexe)
                     VALUES (?, ?, ?, ?, CURDATE(), 'M')
                     ON DUPLICATE KEY UPDATE
                       nom    = VALUES(nom),
                       prenom = VALUES(prenom)`,
          [t.etudiant_id, matriculeSnapshot, nomSnapshot, prenomSnapshot],
        );
      }
    }

    // Remettre le transfert en attente
    await conn.query(
      `UPDATE transferts
             SET statut           = 'en_attente',
                 traite_par       = NULL,
                 date_traitement  = NULL,
                 motif_refus      = NULL,
                 motif_annulation = ?,
                 annule_par       = ?
             WHERE id = ?`,
      [motif_annulation || null, annule_par, id],
    );

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message:
        t.statut === "accepter"
          ? "Transfert annulé : étudiant remis dans la liste, inscription archivée, demande en attente."
          : "Transfert annulé et remis en attente.",
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
};
