const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/etudiantController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(verifyToken);
router.get ('/',     ctrl.getAll);
router.get ('/:id',  ctrl.getOne);
router.post('/',     authorizeRoles('administrateur','secretaire'), upload.single('photo'), ctrl.create);
router.put ('/:id',  authorizeRoles('administrateur','secretaire'), upload.single('photo'), ctrl.update);
router.delete('/:id', authorizeRoles('administrateur','secretaire'), ctrl.remove);
module.exports = router;