const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RoomActivity = require('../models/RoomActivity');
const authMiddleware = require('../middleware/auth');

// JWT Generator
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret_key_123',
    { expiresIn: '7d' }
  );
};

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    // Create user (hashing is done in model hooks)
    user = new User({ username, email, password });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats
      }
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;
  try {
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile (me)
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// Update profile settings
router.put('/profile', authMiddleware, async (req, res) => {
  const { username, avatar } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats
      }
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Statistics & Recent Activity
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const activities = await RoomActivity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(10);
      
    res.json({
      stats: req.user.stats,
      activities
    });
  } catch (err) {
    console.error('Stats fetch error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
