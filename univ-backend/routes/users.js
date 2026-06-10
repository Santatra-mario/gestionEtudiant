// routes/users.js – Gestion des utilisateurs (admin uniquement sauf changement de mot de passe)
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Toutes les routes nécessitent un token valide
router.use(verifyToken);

// Liste & détail : admin uniquement
router.get ('/',    authorizeRoles('administrateur'), ctrl.getAll);
router.get ('/:id', authorizeRoles('administrateur'), ctrl.getOne);

// Modifier les infos : admin uniquement
router.put ('/:id', authorizeRoles('administrateur'), ctrl.update);

// Changer le mot de passe : admin ou l'utilisateur lui-même (contrôlé dans le handler)
router.patch('/:id/password', ctrl.changePassword);

// Activer / désactiver : admin uniquement
router.patch('/:id/toggle', authorizeRoles('administrateur'), ctrl.toggleActive);

// Supprimer définitivement : admin uniquement
router.delete('/:id', authorizeRoles('administrateur'), ctrl.remove);

module.exports = router;
