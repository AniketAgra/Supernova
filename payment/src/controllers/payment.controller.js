const payemntModel = require('../models/payment.model');
const axios = require('axios');
const {publishToQueue} = require('../broker/broker');

const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPayment(req, res) {

    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    try {
        const orderId = req.params.orderId;

        const orderResponse = await axios.get("http://localhost:3003/api/orders/" + orderId, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const price = orderResponse.data.order.totalPrice;

        const order = await razorpay.orders.create(price);
        const payment = await payemntModel.create({
            order: orderId,
            razorpayOrderId: order.id,
            user: req.user.id,
            price: {
                amount: order.amount,
                currency: order.currency
            }
        });

        await publishToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED', payment);
        await publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_INITIATED', {
            email: req.user.email,
            orderId: orderId,
            amount: price.amount,
            currency: price.currency,
            username: req.user.username,
    })

        res.status(201).json({ message: 'Payment initialized successfully', payment });

    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function verifyPayment(req, res) {
    const { razorpayOrderId, paymentId, signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    try {

        const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils.js')

        const isValid = validatePaymentVerification({
            order_id: razorpayOrderId,
            payemnt_id: paymentId,
        }, signature, secret);

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const payment = await payemntModel.findOne({ razorpayOrderId, status: 'PENDING' });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found or already processed' });
        }

        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.status = 'COMPLETED';

        await payment.save();

        await publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_COMPLETED', {
            email: req.user.email,
            orderId: payment.order,
            paymentId: payment.paymentId,
            amount: payment.price.amount,
            currency: payment.price.currency,
            fullName: req.user.fullName,
        });

        await publishToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED', payment);

        res.status(200).json({ message: 'Payment verified successfully', payment });

    } catch (error) {
        console.error('Error verifying payment:', error);

        await publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_FAILED', {
            email: req.user.email,
            paymentId: paymentId,
            orderId: razorpayOrderId,
            fullName: req.user.fullName,
        });

        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createPayment,
    verifyPayment
};