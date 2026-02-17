const productModel = require('../models/product.model');
const {uploadImage } = require('../services/imagekit.service');

async function createProduct(req, res) {
    try {
        const { title, description, priceAmount, priceCurrency = 'INR' } = req.body;
        const seller = req.user.id; // Extract seller from authenticated user

        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency,
        };

        const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));


        const product = await productModel.create({ title, description, price, seller, images });

        return res.status(201).json({
            message: 'Product created',
            data: product,
        });
    } catch (err) {
        console.error('Create product error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProducts(req, res) {
    //this is basically for filtering the products based on the query parameters, we can have q for text search, minprice and maxprice for price range filtering, skip and limit for pagination
    const {q, minprice, maxprice, skip = 0, limit=20} = req.query;

    const filter = {};

    if (q) {
        filter.$text = { $search: q};
    }

    if (minprice){
        filter['price.amount'] = { ...filter['price.amount'], $gte: Number(minprice) };
    }

    if (maxprice){
        filter['price.amount'] = { ...filter['price.amount'], $lte: Number(maxprice) };
    }

    try {
        const products = await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20)); // Limit to 20 products per page
        return res.status(200).json({
            message: 'Products retrieved',
            data: products,
        });
    } catch (err) {
        console.error('Get products error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProductById(req, res) {
    const { id } = req.params;

    try {
        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json({
            message: 'Product retrieved',
            product: product,
        });
    } catch (err) {
        console.error('Get product by ID error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { createProduct, getProducts, getProductById };