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

        

        return res.status(201).json({
            message: 'Order data prepared successfully',
            products,
        });

    }catch(err){
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Internal server error' , error: err.message });
    }
}

module.exports = {
    createOrder,
}