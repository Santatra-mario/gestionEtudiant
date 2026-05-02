// routes/filieres.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/filiereController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// ✅ Tous les rôles connectés peuvent gérer les filières
router.get   ('/',        ctrl.getAllFilieres);
router.post  ('/',        ctrl.createFiliere);
router.put   ('/:id',     ctrl.updateFiliere);
router.delete('/:id',     ctrl.deleteFiliere);

// Liste des enseignants (pour le formulaire d'assignation matière)
router.get('/enseignants/liste', ctrl.getEnseignants);

// ✅ Tous les rôles connectés peuvent gérer les matières
router.get   ('/:filiereId/matieres', ctrl.getMatieresByFiliere);
router.post  ('/matieres',            ctrl.createMatiere);
router.put   ('/matieres/:id',        ctrl.updateMatiere);
router.delete('/matieres/:id',        ctrl.deleteMatiere);

module.exports = router;
