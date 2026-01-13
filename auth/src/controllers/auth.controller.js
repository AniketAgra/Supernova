const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');

async function registerUser(req, res) {
    try{
        const {username, email, password, fullName: {firstName, lastName}, role } = req.body;

        const isUserAlreadyRegistered = await userModel.findOne({
            $or:[
                { username },
                { email }
            ]
        });

        if (isUserAlreadyRegistered) {
            return res.status(409).json({
                success: false,
                message: 'Username or email already in use'
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash,
            fullName: {
                firstName,
                lastName
            },
            role: role || 'user'  // default role is 'user'
        });

        const token = jwt.sign(
            { id: user._id, 
            username: user.username, 
            email: user.email,
            role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,   //makes sure cookie is only sent over https & cant be accessed by client side js
            sameSite: 'Strict', //mitigates CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                address: user.address
            }
        });
    }
    catch(error){
        console.error('Error registering user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
    
}

const loginUser = async (req, res) => {
    try {
        const { username,email, password } = req.body;

        const user = await userModel.findOne({ $or:[{ email }, {username}] }).select('+password');  // Explicitly select password field
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user._id, 
            username: user.username, 
            email: user.email,
            role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,   //makes sure cookie is only sent over https & cant be accessed by client side js
            sameSite: 'Strict', //mitigates CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
        });

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

async function getCurrentUser(req, res) {
    return res.status(200).json({
        success: true,
        message: 'Current user fetched successfully',
        user: req.user
    });
}

async function logoutUser(req, res) {
    const token = req.cookies.token;

    if (token) {
        // Optionally, you can blacklist the token in Redis to invalidate it before its expiry
        await redis.set(`blacklist:${token}`, 'true', 'EX', 7 * 24 * 60 * 60); // Set expiry to match token expiry i.e., 7 days
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict'
    });

    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    });
}

async function getUserAddresses(req, res) {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select('addresses defaultAddressId');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }   
        res.status(200).json({
            success: true,
            addresses: user.addresses,
            defaultAddressId: user.defaultAddressId
        });
    } catch (error) {
        console.error('Error fetching user addresses:', error);
        return res.status(500).json({   
            success: false,
            message: 'Internal server error'
        });
    }
}

async function addUserAddress(req, res) {

    const userId = req.user.id;
    const { street, city, state, pincode, country, isDefault } = req.body;

    const user = await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { addresses: { street, city, state, zip: pincode, country, isDefault } } },  // push operator adds a value to an array
        { new: true }
    )
    return res.status(201).json({
        success: true,
        message: 'Address added successfully',
        address: user.addresses[user.addresses.length - 1] // return the newly added address
    });
}

async function deleteUserAddress(req, res) {
    
    const id = req.user.id;
    const addressId = req.params.addressId;

    const isAddressExist = await userModel.findOne(
        { _id: id, 'addresses._id': addressId }  // checks if address with given addressId exists for the user
    );
    if (!isAddressExist) {
        return res.status(404).json({
            success: false,
            message: 'Address not found'
        });
    }

    const user =  await userModel.findByIdAndUpdate(
        { _id: id },
        { $pull:                               // pull operator removes from an existing array all instances of a value or values that match a specified condition
            { addresses: { _id: addressId } } 
        },
        { new: true }
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const addressExists = user.addresses.some(addr => addr._id.toString() === addressId);
    if (addressExists) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete address'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
        addresses: user.addresses
    });
}


module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    getUserAddresses,
    addUserAddress,
    deleteUserAddress
};