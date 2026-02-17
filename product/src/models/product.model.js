const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    price: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            enum: [ 'USD', 'INR' ],
            default: 'INR'
        }
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    images: [
        {
            url: String,
            thumbnail: String,
            id: String
        }
    ],
})

// indexes for efficient querying, it basically creates a text index on title and description for text search, and an index on seller for filtering by seller
//whatever input we give in a parameter, it will search for the closest match in the title and description fields of the products collection. This allows for more flexible searching, as it can find products even if the search term is not an exact match.
productSchema.index({ title: 'text', description: 'text' }); // For text search,


const productModel = mongoose.model('product', productSchema);

module.exports = productModel;  