const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transfertController');

router.get('/',                 ctrl.getAll);
router.get('/:id',              ctrl.getOne);
router.post('/',                ctrl.create);
router.put('/:id/accepter',     ctrl.accepter);
router.put('/:id/refuser',      ctrl.refuser);

module.exports = router;
