// routes/inscriptions.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/inscriptionController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get ('/',                          ctrl.getAll);
router.get ('/historique/:etudiantId',    ctrl.getHistorique);
router.post('/',    authorizeRoles('administrateur','secretaire'), ctrl.create);
router.patch('/:id/statut', authorizeRoles('administrateur','secretaire'), ctrl.updateStatut);
router.delete('/:id', authorizeRoles('administrateur'), ctrl.remove);

module.exports = router;

// ─────────────────────────────────────────────────────────
// routes/notes.js  (fichier séparé dans votre projet)
// ─────────────────────────────────────────────────────────
// const express = require('express');
// const router  = express.Router();
// const ctrl    = require('../controllers/noteController');
// const { verifyToken, authorizeRoles } = require('../middleware/auth');
//
// router.use(verifyToken);
// router.get ('/inscription/:inscriptionId', ctrl.getNotesByInscription);
// router.get ('/bulletin/:inscriptionId',    ctrl.getBulletin);
// router.post('/',       authorizeRoles('administrateur','enseignant'), ctrl.upsertNote);
// router.post('/batch',  authorizeRoles('administrateur','enseignant'), ctrl.batchUpsertNotes);
// router.delete('/:id',  authorizeRoles('administrateur'), ctrl.remove);
// module.exports = router;
