// routes/transferts.js — Routes transferts UniGest
// Middleware verifyToken + authorizeRoles appliqués sur toutes les routes sensibles

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/transfertController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Toutes les routes nécessitent d'être connecté
router.use(verifyToken);

// ── Lecture ─────────────────────────────────────────────────────────────────
// Tous les rôles connectés peuvent lister et voir le détail
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);

// ── Création d'une demande (secrétaire + admin) ──────────────────────────────
router.post('/',
  authorizeRoles('administrateur', 'secretaire'),
  ctrl.create
);

// ── Changement filière/niveau interne — transaction (secrétaire + admin) ─────
router.post('/changer-filiere',
  authorizeRoles('administrateur', 'secretaire'),
  ctrl.changerFiliere
);

// ── Accepter / Refuser — ADMINISTRATEUR SEULEMENT ───────────────────────────
// La secrétaire crée la demande mais c'est l'admin qui valide
router.put('/:id/accepter',
  authorizeRoles('administrateur'),
  ctrl.accepter
);
router.put('/:id/refuser',
  authorizeRoles('administrateur'),
  ctrl.refuser
);

// ── Annulation / correction d'un transfert déjà traité (admin seulement) ─────
router.put('/:id/annuler',
  authorizeRoles('administrateur'),
  ctrl.annuler
);

module.exports = router;
