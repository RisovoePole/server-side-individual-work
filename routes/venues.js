const express = require('express');
const venueController = require('../controllers/venueController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { venueRules, venueQueryRules, idParamRule, handleValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/', venueQueryRules, handleValidation, venueController.index);
router.get('/new', isAuthenticated, isAdmin, venueController.new);
router.post('/', isAuthenticated, isAdmin, venueRules, venueController.create);

router.get('/:id', idParamRule, handleValidation, venueController.show);
router.get('/:id/edit', isAuthenticated, isAdmin, idParamRule, handleValidation, venueController.edit);
router.post('/:id', isAuthenticated, isAdmin, venueRules, venueController.update);
router.post('/:id/delete', isAuthenticated, isAdmin, idParamRule, handleValidation, venueController.remove);

module.exports = router;
