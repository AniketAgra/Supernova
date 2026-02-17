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

router.get('/', 
    productController.getProducts
);

router.patch('/:id',
    createAuthMiddleware(['seller']),
    productController.updateProduct
);

router.delete('/:id',
    createAuthMiddleware(['seller']),
    productController.deleteProduct
);

router.get('/seller',
    createAuthMiddleware(['seller']),
    productController.getProductsBySeller
);

// this route is moved to the end because it can conflict with the /seller route if placed before it, since both routes start with /:id and /seller can be mistaken for an id. By placing it at the end, we ensure that the /seller route is matched first before trying to match any id routes.
router.get('/:id',
    productController.getProductById
);


module.exports = router;