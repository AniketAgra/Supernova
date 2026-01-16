const express = require('express');
const multer = require('multer');
const productController = require('../controllers/product.controller');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const productValiDators = require('../validators/product.validators');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', 
    createAuthMiddleware(['admin','seller']), 
    upload.array('images',5), 
    productValiDators.createProductValidators,
    productController.createProduct
);

module.exports = router;