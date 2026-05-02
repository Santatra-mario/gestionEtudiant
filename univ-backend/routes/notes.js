// routes/notes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/noteController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// ✅ Tous les rôles connectés peuvent lire
router.get('/inscription/:inscriptionId', ctrl.getNotesByInscription);
router.get('/bulletin/:inscriptionId',    ctrl.getBulletin);

// ✅ Tous les rôles connectés peuvent ajouter/modifier des notes
router.post('/',      ctrl.upsertNote);
router.post('/batch', ctrl.batchUpsertNotes);

// ✅ Suppression : tous les rôles aussi
router.delete('/:id', ctrl.remove);

module.exports = router;
