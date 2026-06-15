// routes/auth.js
const express = require('express');
const router  = express.Router();
const { login, register, getProfile } = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Connexion – publique
router.post('/login', login);

// Inscription – publique (secrétaire / enseignant / etudiant)
router.post('/register', register);

// Inscription réservée aux admins connectés (route alternative protégée)
router.post('/register/admin', verifyToken, authorizeRoles('administrateur'), register);

// Profil – protégé
router.get('/me', verifyToken, getProfile);

module.exports = router;
