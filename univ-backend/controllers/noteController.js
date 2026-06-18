// controllers/noteController.js – Gestion des notes & bulletins
// ✅ Corrigé : champs réels de la table `matieres` :
//    nom_matiere (pas nom), code_matiere (pas code), credit (pas coefficient)

const db = require("../config/db");

// ── GET /notes/inscription/:inscriptionId ─────────────────────────────────────
const getNotesByInscription = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.*,
                            m.nom_matiere  AS matiere_nom,
                            m.credit       AS coefficient,
                            m.semestre,
                            (n.note * m.credit) AS note_ponderee
                     FROM notes n
                     JOIN matieres m ON n.matiere_id = m.id
                     WHERE n.inscription_id = ?
                     ORDER BY m.semestre, m.nom_matiere`,
      [req.params.inscriptionId],
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getNotesByInscription:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
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
      [req.params.inscriptionId],
    );
    if (infoRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Inscription introuvable." });
    }

    // ✅ nom_matiere AS matiere, credit AS coefficient
    const [notes] = await db.query(
      `SELECT n.note, n.id AS note_id,
                                  m.id          AS matiere_id,
                                  m.nom_matiere AS matiere,
                                  m.credit      AS coefficient,
                                  m.semestre,
                                  (n.note * m.credit) AS ponderee
                           FROM notes n
                           JOIN matieres m ON n.matiere_id = m.id
                           WHERE n.inscription_id = ?
                           ORDER BY m.semestre, m.nom_matiere`,
      [req.params.inscriptionId],
    );

    // Grouper les notes par semestre
    const resultat = {};
    notes.forEach((n) => {
      const sem = n.semestre;
      if (!resultat[sem]) {
        resultat[sem] = { notes: [], totalPonderee: 0, totalCoeff: 0 };
      }
      resultat[sem].notes.push(n);
      resultat[sem].totalPonderee += parseFloat(n.ponderee);
      resultat[sem].totalCoeff += parseFloat(n.coefficient);
    });

    // Calculer moyenne et mention pour chaque semestre
    Object.values(resultat).forEach((s) => {
      s.moyenne =
        s.totalCoeff > 0 ? (s.totalPonderee / s.totalCoeff).toFixed(2) : "—";
      s.mention =
        parseFloat(s.moyenne) >= 10
          ? "Admis"
          : parseFloat(s.moyenne) >= 8
            ? "Rattrapage"
            : "Ajourné";
    });

    return res.json({
      success: true,
      inscription: infoRows[0],
      bulletin: resultat,
    });
  } catch (err) {
    console.error("getBulletin:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── POST /notes  (créer ou mettre à jour une note) ────────────────────────────
const upsertNote = async (req, res) => {
  const { inscription_id, matiere_id, note } = req.body;

  if (
    inscription_id === undefined ||
    matiere_id === undefined ||
    note === undefined
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Champs obligatoires manquants." });
  }

  const noteNum = parseFloat(note);
  if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
    return res
      .status(400)
      .json({ success: false, message: "La note doit être entre 0 et 20." });
  }

  try {
    const [check] = await db.query(
      `SELECT m.id FROM matieres m
             JOIN inscriptions i ON i.filiere_id = m.filiere_id
             WHERE m.id = ? AND i.id = ?`,
      [matiere_id, inscription_id],
    );
    if (check.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Matière incompatible avec la filière de l'inscription.",
      });
    }

    await db.query(
      `INSERT INTO notes (inscription_id, matiere_id, note)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE note = VALUES(note)`,
      [inscription_id, matiere_id, noteNum],
    );

    return res.json({ success: true, message: "Note enregistrée." });
  } catch (err) {
    console.error("upsertNote:", err);
    return res
      .status(500)
      .json({ success: false, message: `Erreur serveur : ${err.message}` });
  }
};

// ── POST /notes/batch  (saisie multiple) ─────────────────────────────────────
const batchUpsertNotes = async (req, res) => {
  const { inscription_id, notes } = req.body;

  const inscId = parseInt(inscription_id, 10);
  if (!inscId || inscId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "inscription_id invalide." });
  }
  if (!Array.isArray(notes) || notes.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Aucune note à enregistrer." });
  }

  const notesValidees = [];
  for (const item of notes) {
    const matiereId = parseInt(item.matiere_id, 10);
    const noteVal = parseFloat(item.note);

    if (isNaN(matiereId) || matiereId <= 0) {
      return res.status(400).json({
        success: false,
        message: `matiere_id invalide : ${item.matiere_id}`,
      });
    }
    if (isNaN(noteVal) || noteVal < 0 || noteVal > 20) {
      return res.status(400).json({
        success: false,
        message: `Note invalide pour matière ${matiereId} : doit être entre 0 et 20.`,
      });
    }
    notesValidees.push({ matiere_id: matiereId, note: noteVal });
  }

  try {
    // ✅ Vérifier que toutes les matières appartiennent bien à la filière de l'inscription
    const matiereIds = notesValidees.map((n) => n.matiere_id);
    const placeholders = matiereIds.map(() => "?").join(",");
    const [checkRows] = await db.query(
      `SELECT m.id FROM matieres m
             JOIN inscriptions i ON i.filiere_id = m.filiere_id
             WHERE m.id IN (${placeholders}) AND i.id = ?`,
      [...matiereIds, inscId],
    );
    const validMatiereIds = new Set(checkRows.map((r) => r.id));
    const invalides = matiereIds.filter((id) => !validMatiereIds.has(id));
    if (invalides.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Matière(s) incompatible(s) avec la filière de l'inscription : ${invalides.join(", ")}.`,
      });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const { matiere_id, note } of notesValidees) {
        await conn.query(
          `INSERT INTO notes (inscription_id, matiere_id, note)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE note = VALUES(note)`,
          [inscId, matiere_id, note],
        );
      }
      await conn.commit();
      return res.json({
        success: true,
        message: `${notesValidees.length} note(s) enregistrée(s).`,
      });
    } catch (transactionErr) {
      await conn.rollback();
      console.error("batchUpsertNotes transaction error:", transactionErr);
      return res.status(500).json({
        success: false,
        message: `Erreur transaction : ${transactionErr.message}`,
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("batchUpsertNotes:", err);
    return res.status(500).json({
      success: false,
      message: `Erreur serveur : ${err.message}`,
    });
  }
};

// ── DELETE /notes/:id ─────────────────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM notes WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Note introuvable." });
    }
    return res.json({ success: true, message: "Note supprimée." });
  } catch (err) {
    console.error("remove note:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

module.exports = {
  getNotesByInscription,
  getBulletin,
  upsertNote,
  batchUpsertNotes,
  remove,
};
