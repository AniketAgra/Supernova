const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const validators = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.controller');

// Register endpoint
router.post('/register', validators.registerUserValidations, authController.registerUser);
// Login endpoint
router.post('/login', validators.loginUserValidations, authController.loginUser);

module.exports = router;
