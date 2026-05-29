// routes/filieres.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/filiereController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.use(verifyToken);

// ── ROUTES FIXES EN PREMIER (avant /:id) ──────────────────────────────────
// ⚠️ IMPORTANT : ces routes doivent être AVANT /:filiereId/matieres
// sinon Express interprète "enseignants" comme un :id et appelle le mauvais controller

// Liste des enseignants (pour le formulaire d'assignation matière)
router.get("/enseignants/liste", ctrl.getEnseignants);

// Matières : écriture pour admin et secrétaire
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
  authorizeRoles("administrateur", "secretaire"),
  ctrl.deleteMatiere,
);

// ── ROUTES AVEC PARAMÈTRE /:id APRÈS ─────────────────────────────────────
// Lecture : tous les rôles authentifiés
router.get("/", ctrl.getAllFilieres);
router.post("/", authorizeRoles("administrateur", "secretaire"), ctrl.createFiliere);
router.put("/:id", authorizeRoles("administrateur", "secretaire"), ctrl.updateFiliere);
router.delete("/:id", authorizeRoles("administrateur", "secretaire"), ctrl.deleteFiliere);

// Matières d'une filière : lecture pour tous
router.get("/:filiereId/matieres", ctrl.getMatieresByFiliere);

module.exports = router;
