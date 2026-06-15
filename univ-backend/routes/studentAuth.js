// routes/studentAuth.js – Routes authentification étudiant
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/studentAuthController");
const { verifyToken } = require("../middleware/auth");

// Middleware pour vérifier que l'utilisateur est un étudiant
const verifyStudent = (req, res, next) => {
  console.log(
    "VERIFY_STUDENT: user role =",
    req.user?.role,
    "user id =",
    req.user?.id,
  );
  if (req.user?.role !== "etudiant") {
    return res
      .status(403)
      .json({ success: false, message: "Accès réservé aux étudiants." });
  }
  next();
};

// Login étudiant (pas de token requis)
router.post("/login", ctrl.login);

// Profil étudiant (token requis + rôle étudiant)
router.get("/profile", verifyToken, verifyStudent, ctrl.getProfile);

// Notes étudiant
router.get("/notes", verifyToken, verifyStudent, ctrl.getNotes);

// Présences étudiant
router.get("/presences", verifyToken, verifyStudent, ctrl.getPresences);

module.exports = router;
