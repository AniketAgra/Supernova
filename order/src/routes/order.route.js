const express = require('express');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const orderController = require('../controllers/order.controller');
const validator = require('../middlewares/validator.middleware');

const router = express.Router();

router.post('/', createAuthMiddleware(["user"]), validator.createOrderValidation, orderController.createOrder);

router.get('/me', createAuthMiddleware(["user"]), orderController.getMyOrders);

router.get('/:id', createAuthMiddleware(["user", "admin"]), orderController.getOrderById);

router.post('/:id/cancel', createAuthMiddleware(["user"]), orderController.cancelOrderById);

router.patch('/:id/address', createAuthMiddleware(["user"]), validator.updateAddressValidation, orderController.updateOrderAddress);

module.exports = router;