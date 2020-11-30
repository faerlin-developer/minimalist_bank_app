const express = require('express');
const authController = require('../controllers/authController');
const { authValidation } = require('../validators/authValidator');

const router = express.Router();

router.post('/signup', authValidation, authController.signup);
router.post('/login', authValidation, authController.login);

module.exports = router;
