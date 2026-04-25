const orderModel = require('../models/order.model');
const axios = require('axios');

async function createOrder(req, res) {

    const user = req.user;
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[ 1 ];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token is required' });
    }

    try{
        //fetch user cart from cart service

        // const cartResponse = await axios.get('http://localhost:3002/api/cart', {
        //     headers: {
        //         Authorization: `Bearer ${token}`
        //     }
        // });

        const cartResponse = await axios.get(`http://localhost:3002/api/cart`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const cartItems = cartResponse.data?.cart?.items || [];

        if (!cartItems.length) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const products = await Promise.all(cartItems.map(async (item) => {
            const productId = item.productId || item.product;

            if (!productId) {
                throw new Error('Cart item does not contain a valid product id');
            }

            console.log('Fetching product details for productId:', productId);
            const productResponse = await axios.get(`http://localhost:3001/api/products/${productId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return productResponse.data?.data || productResponse.data;

        }))

        let priceAmount = 0;

        const orderItems = cartItems.map((item) => {

            const productId = item.productId || item.product;

            const product = products.find(p => String(p._id) === String(productId))

            if (!product) {
                throw new Error(`Product details not found for product id: ${productId}`)
            }

            // if not in stock, does not allow order creation

            if (product.stock < item.quantity) {
                throw new Error(`Product ${product.title} is out of stock or insufficient stock`)
            }

            const itemTotal = product.price.amount * item.quantity;
            priceAmount += itemTotal;

            return {
                product: productId,
                quantity: item.quantity,
                price: {
                    amount: itemTotal,
                    currency: product.price.currency
                }
            }
        })

        const order = await orderModel.create({
            user: user.id,
            items: orderItems,
            status: "PENDING",
            totalPrice: {
                amount: priceAmount,
                currency: "INR"
            },
            shippingAddress: {
                street: req.body.shippingAddress.street,
                city: req.body.shippingAddress.city,
                state: req.body.shippingAddress.state,
                zip: req.body.shippingAddress.pincode,
                country: req.body.shippingAddress.country,
            }
        });

        return res.status(201).json({
            message: 'Order data prepared successfully',
            order
        });

    }catch(err){
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Internal server error' , error: err.message });
    }
}

async function getMyOrders(req, res) {
    const user = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try{
        const orders = await orderModel.find({ user: user.id })
        const totalOrders = await orderModel.countDocuments({ user: user.id });

        res.status(200).json({
            orders,
            meta: {
                total: totalOrders,
                page,
                limit,

            }
        });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

async function getOrderById(req, res) {
    const user = req.user;
    const orderId = req.params.id;

    try{
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if(order.user.toString() !== user.id) {
            return res.status(403).json({ message: 'Forbidden: You do not have access' });
        }

        res.status(200).json({ order });
    }catch(err){
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

async function cancelOrderById(req, res) {
    // Implementation for cancelling an order
    const user = req.user;
    const orderId = req.params.id;

    try{
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if(order.user.toString() !== user.id) {
            return res.status(403).json({ message: 'Forbidden: You do not have access' });
        }

        if(order.status !== 'PENDING') {
            return res.status(409).json({ message: 'Order cannot be cancelled at this stage' });
        }

        order.status = 'CANCELLED';
        // order.timeline.push({ type: 'CANCELLED', at: new Date() });
        await order.save();

        res.status(200).json({ order });
    }catch(err){
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrderById
}