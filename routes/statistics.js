const express = require('express');
const statsController = require('../controllers/statsController');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.get('/', isAuthenticated, statsController.index);

module.exports = router;
