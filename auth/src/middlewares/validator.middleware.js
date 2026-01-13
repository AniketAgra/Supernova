const {body, validationResult} = require('express-validator');

const respondWIthValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerUserValidations = [
    body('username')
        .isString()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email')
        .isEmail()  
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),    
    body('fullName.firstName')
        .isString()
        .withMessage('First name must be a string')
        .notEmpty()
        .withMessage('First name is required'),
    body('fullName.lastName')
        .isString()
        .withMessage('Last name must be a string')
        .notEmpty()
        .withMessage('Last name is required'),
        body('role')
        .optional()
        .isIn(['user', 'seller'])
        .withMessage('Role must be either user or seller'),
    respondWIthValidationErrors
];

const loginUserValidations = [
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('username')
        .optional()
        .isString()
        .withMessage('Username must be a string'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    respondWIthValidationErrors
];

const addressValidation = [
    body('street')
        .isString()
        .withMessage('Street must be a string')
        .notEmpty()
        .withMessage('Street is required'),
    body('city')
        .isString()
        .withMessage('City must be a string')
        .notEmpty()
        .withMessage('City is required'),
    body('state')
        .isString()
        .withMessage('State must be a string')
        .notEmpty()
        .withMessage('State is required'),
    body('pincode')
        .isPostalCode('any')
        .withMessage('Please provide a valid pincode'),
    body('country')
        .isString()
        .withMessage('Country must be a string')
        .notEmpty()
        .withMessage('Country is required'),
    respondWIthValidationErrors
];

module.exports = {
    registerUserValidations,
    loginUserValidations,
    addressValidation
};