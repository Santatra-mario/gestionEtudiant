// routes/etudiants.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const ctrl    = require('../controllers/etudiantController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Configuration upload photo
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads/photos'),
    filename:    (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `photo-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
    }
});

// Toutes les routes nécessitent un token JWT
router.use(verifyToken);

router.get ('/',    ctrl.getAll);
router.get ('/:id', ctrl.getOne);
router.post('/',    authorizeRoles('administrateur','secretaire'), upload.single('photo'), ctrl.create);
router.put ('/:id', authorizeRoles('administrateur','secretaire'), upload.single('photo'), ctrl.update);
router.delete('/:id', authorizeRoles('administrateur','secretaire'), ctrl.remove);

module.exports = router;
