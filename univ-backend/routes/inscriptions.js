// routes/inscriptions.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/inscriptionController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.use(verifyToken);

router.get("/", ctrl.getAll);
router.get("/historique/:etudiantId", ctrl.getHistorique);
router.post("/", authorizeRoles("administrateur", "secretaire"), ctrl.create);
router.patch(
  "/:id/statut",
  authorizeRoles("administrateur", "secretaire"),
  ctrl.updateStatut,
);
router.delete("/:id", authorizeRoles("administrateur"), ctrl.remove);

module.exports = router;
