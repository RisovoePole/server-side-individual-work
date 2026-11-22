const express = require('express');
const bookingController = require('../controllers/bookingController');
const { isAuthenticated, isAdmin, canManageBooking } = require('../middleware/auth');
const { bookingRules, idParamRule, handleValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/', bookingController.index);
router.get('/new', isAuthenticated, bookingController.new);
router.post('/', isAuthenticated, bookingRules, bookingController.create);

router.get('/:id', idParamRule, handleValidation, bookingController.show);
router.get('/:id/edit', isAuthenticated, isAdmin, idParamRule, handleValidation,
  bookingController.loadBooking, bookingController.edit);
router.post('/:id', isAuthenticated, isAdmin, idParamRule, handleValidation, bookingRules,
  bookingController.loadBooking, bookingController.update);
router.post('/:id/delete', isAuthenticated, isAdmin, idParamRule, handleValidation,
  bookingController.loadBooking, bookingController.remove);
router.post('/:id/cancel', isAuthenticated, idParamRule, handleValidation,
  bookingController.loadBooking, canManageBooking, bookingController.cancel);

module.exports = router;
