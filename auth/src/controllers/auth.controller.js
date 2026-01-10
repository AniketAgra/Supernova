const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

module.exports = {
    registerUser
};