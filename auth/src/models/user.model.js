const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false,  required: true }, // select is used to exclude password field by default - whenever we query user data like by using find(),findOne(),etc. It will not return password field unless we explicitly ask for it
    fullName: {
        firstName: { type: String , required: true},
        lastName : { type: String, required: true}
    },
    role: {
        type: String,
        enum: ['user', 'seller'],
        default: 'user'
    },
    address: [addressSchema]
}, { timestamps: true });

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;