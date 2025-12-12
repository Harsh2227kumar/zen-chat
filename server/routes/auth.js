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
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email, and password'
            });
        }

        // Trim and sanitize inputs
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 30 characters'
            });
        }

        if (password.length < 6 || password.length > 24) {
            return res.status(400).json({
                success: false,
                message: 'Password must be between 6 and 24 characters'
            });
        }

        const userExists = await User.findOne({ $or: [{ email: trimmedEmail }, { username: trimmedUsername }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        const user = await User.create({
            username: trimmedUsername, 
            email: trimmedEmail, 
            password
        });

        const token = generateToken(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

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
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Trim and sanitize email
        const trimmedEmail = email.trim().toLowerCase();

        // Check for user
        const user = await User.findOne({ email: trimmedEmail }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

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


// @route   POST /api/auth/logout
// @desc    Logout user / clear cookie
// @access  Private

router.post('/logout', protect, async (req, res) => {
    try {
        // Update user status to offline
        await User.findByIdAndUpdate(req.user._id, {
            status: 'offline',
            lastSeen: Date.now()
        });

        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.json({
            success: true,
            message: 'User logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/auth/users
// @desc    Get all users except current
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

// @route   GET /api/auth/users/search
// @desc    Search users by username or email
// @access  Private

router.get('/users/search', protect, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchQuery = q.trim();
        const users = await User.find({
            _id: { $ne: req.user._id },
            $or: [
                { username: { $regex: `^${searchQuery}`, $options: 'i' } },
                { email: { $regex: `^${searchQuery}`, $options: 'i' } }
            ]
        })
        .select('username email avatar status lastSeen')
        .limit(10);

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