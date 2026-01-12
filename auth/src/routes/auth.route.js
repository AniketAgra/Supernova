const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const validators = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Register endpoint
router.post('/register', validators.registerUserValidations, authController.registerUser);
// Login endpoint
router.post('/login', validators.loginUserValidations, authController.loginUser);
// Get current user endpoint
router.get('/me', authMiddleware.authMiddleware, authController.getCurrentUser);
// Logout endpoint
router.get('/logout', authController.logoutUser);

module.exports = router;
