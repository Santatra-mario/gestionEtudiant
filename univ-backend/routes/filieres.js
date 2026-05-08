// routes/filieres.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/filiereController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.use(verifyToken);

// Lecture : tous les rôles authentifiés
router.get("/", ctrl.getAllFilieres);
// Écriture : administrateur uniquement
router.post("/", authorizeRoles("administrateur"), ctrl.createFiliere);
router.put("/:id", authorizeRoles("administrateur"), ctrl.updateFiliere);
router.delete("/:id", authorizeRoles("administrateur"), ctrl.deleteFiliere);

// Liste des enseignants (pour le formulaire d'assignation matière)
router.get("/enseignants/liste", ctrl.getEnseignants);

// Matières : lecture pour tous, écriture pour admin et secrétaire
router.get("/:filiereId/matieres", ctrl.getMatieresByFiliere);
router.post(
  "/matieres",
  authorizeRoles("administrateur", "secretaire"),
  ctrl.createMatiere,
);
router.put(
  "/matieres/:id",
  authorizeRoles("administrateur", "secretaire"),
  ctrl.updateMatiere,
);
router.delete(
  "/matieres/:id",
  authorizeRoles("administrateur"),
  ctrl.deleteMatiere,
);

module.exports = router;
