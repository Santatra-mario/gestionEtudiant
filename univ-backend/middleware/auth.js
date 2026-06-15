// middleware/auth.js – Vérification JWT + contrôle des rôles
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Vérifie le token JWT dans l'en-tête Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token manquant ou invalide.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // { id, email, role, etudiant_id }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expiré ou invalide.' });
    }
};

/**
 * Usine de middleware : autorise seulement certains rôles
 * Usage : authorizeRoles('administrateur', 'secretaire')
 */
const authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`
        });
    }
    next();
};

module.exports = { verifyToken, authorizeRoles };
