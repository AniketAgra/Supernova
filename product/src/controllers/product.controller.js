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

async function updateProduct(req, res) {    
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await productModel.findById({
        _id: id,
    });

    if(!product){
        return res.status(404).json({ message: 'Product not found or you do not have permission to edit' });
    }

    if(product.seller.toString() !== req.user.id){
        return res.status(403).json({ message: 'You do not have permission to edit this product' });
    }

    const allowedUpdates = [ 'title', 'description', 'price' ];
    for (const key of Object.keys(req.body)) {
        if (allowedUpdates.includes(key)) {
            if (key === 'price' && typeof req.body.price === 'object') {
                if (req.body.price.amount !== undefined) {
                    product.price.amount = Number(req.body.price.amount);
                }
                if (req.body.price.currency !== undefined) {
                    product.price.currency = req.body.price.currency;
                }
            } else {
                product[ key ] = req.body[ key ];
            }

        }
    }
    await product.save();
    return res.status(200).json({
        message: 'Product updated',
        data: product,
    });
}

async function deleteProduct(req, res) {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await productModel.findById({
        _id: id,
    });

    if(!product){
        return res.status(404).json({ message: 'Product not found or you do not have permission to delete' });
    }

    if(product.seller.toString() !== req.user.id){
        return res.status(403).json({ message: 'You do not have permission to delete this product' });
    }

    await productModel.findOneAndDelete({ _id: id });
    return res.status(200).json({
        message: 'Product deleted',
    });
}

async function getProductsBySeller(req, res) {
    const seller = req.user.id;
    const { skip = 0, limit = 20 } = req.query;

    try {
        const products = await productModel.find({ seller }).skip(Number(skip)).limit(Math.min(Number(limit), 20));
        return res.status(200).json({
            message: 'Products retrieved',
            data: products,
        });
    } catch (err) {
        console.error('Get products by seller error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { createProduct, getProducts, getProductById, deleteProduct, updateProduct, getProductsBySeller };