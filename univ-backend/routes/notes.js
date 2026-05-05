// routes/notes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/noteController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// ✅ Tous les endpoints nécessitent un token valide
router.use(verifyToken);

// ✅ Tous les rôles connectés peuvent LIRE les notes et bulletins
router.get('/inscription/:inscriptionId', ctrl.getNotesByInscription);
router.get('/bulletin/:inscriptionId',    ctrl.getBulletin);

// ✅ Saisie de notes : administrateur, secrétaire ET enseignant peuvent saisir
router.post(
  '/',
  authorizeRoles('administrateur', 'secretaire', 'enseignant'),
  ctrl.upsertNote
);
router.post(
  '/batch',
  authorizeRoles('administrateur', 'secretaire', 'enseignant'),
  ctrl.batchUpsertNotes
);

// ✅ Suppression : réservée à l'administrateur et à la secrétaire uniquement
router.delete(
  '/:id',
  authorizeRoles('administrateur', 'secretaire'),
  ctrl.remove
);

module.exports = router;