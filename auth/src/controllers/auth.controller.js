const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');

async function registerUser(req, res) {
    try{
        const {username, email, password, fullName: {firstName, lastName} } = req.body;

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
            }
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

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser
};