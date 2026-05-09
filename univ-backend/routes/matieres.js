// routes/matieres.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/matiereController');
const { verifyToken } = require('../middleware/auth');

// Tous les endpoints nécessitent une authentification
router.use(verifyToken);

// Lecture : tous les rôles authentifiés
router.get('/', ctrl.getAllMatieres);
router.get('/:id', ctrl.getMatiereById);
router.get('/filiere/:filiereId', ctrl.getMatieresByFiliere);

module.exports = router;
