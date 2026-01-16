const mongoose = require('mongoose');

async function connectDB() {
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log('MongoDB Connected')
    }
    catch(err){
        console.log('MongoDB connection error:', err);
        process.exit(1);
    }
}

module.exports = connectDB;