// routes/matieres.js – Routes matières
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/matiereController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.use(verifyToken);

// Lecture : tous les rôles authentifiés
router.get("/", ctrl.getAllMatieres);
router.get("/:id", ctrl.getMatiereById);

// Écriture : admin + secrétaire
router.post(
  "/",
  authorizeRoles("administrateur", "secretaire"),
  ctrl.createMatiere,
);
router.put(
  "/:id",
  authorizeRoles("administrateur", "secretaire"),
  ctrl.updateMatiere,
);
router.delete(
  "/:id",
  authorizeRoles("administrateur", "secretaire"),
  ctrl.deleteMatiere,
);

module.exports = router;
