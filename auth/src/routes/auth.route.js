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
// get user addresses
router.get('/users/me/addresses', authMiddleware.authMiddleware, authController.getUserAddresses);
//add new address
router.post('/users/me/addresses', authMiddleware.authMiddleware, validators.addressValidation, authController.addUserAddress);
//delete address
router.delete('/users/me/addresses/:addressId', authMiddleware.authMiddleware, authController.deleteUserAddress);

module.exports = router;
