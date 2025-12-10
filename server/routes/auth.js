const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

//generaate JWT token

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public

router.post('/register', async (req, res) => {
    try {
        const {username, email, password} = req.body;

        const userExists = await User.findOne({ $or: [{email}, {username}]});
        if(userExists){
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        const user = await User.create({
            username, 
            email, 
            password
        });

        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            token,
            user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;

        //validate email & password

        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        //check for user
        const user = await User.findOne({email}).select('+password');

        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid user'
            });
        }

        // check password

        const isMatch = await user.comparePassword(password);

        if(!isMatch){
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token, 
            user
        });
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private


router.get('/users', protect, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id}})
        .select('username email avatar status lastSeen')
        .limit(50);

        res.json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;