const express = require('express');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
const { registerRules, loginRules } = require('../middleware/validation');

const router = express.Router();

router.get('/register', authController.showRegister);
router.post('/register', registerRules, authController.register);

router.get('/login', authController.showLogin);
router.post('/login', loginRules, authController.login);
router.post('/logout', isAuthenticated, authController.logout);

router.get('/profile', isAuthenticated, authController.profile);

module.exports = router;
