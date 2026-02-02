const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Validation helpers
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (pw) => {
  // Minimum 8 chars and at least one special character
  return /(?=.{8,})(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~])/.
    test(pw);
};
const isPhone = (p) => /^\+?[0-9\s\-]{7,15}$/.test(p);

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1; // 1 == connected

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    if (!isDbConnected()) {
      console.warn('Attempted registration while DB not connected');
      return res.status(503).json({ success: false, error: 'Database not connected. Please configure MONGODB_URI.' });
    }

    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({ success: false, error: 'First name, last name, phone, email and password are required' });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    if (!isPhone(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters and include a special character' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = new User({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), email: email.toLowerCase(), password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    res.json({ success: true, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, email: user.email }, token });
  } catch (error) {
    console.error('Auth register error:', error);
    const message = (process.env.NODE_ENV === 'production') ? 'Registration failed' : (error.message || 'Registration failed');
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    if (!isDbConnected()) {
      console.warn('Attempted login while DB not connected');
      return res.status(503).json({ success: false, error: 'Database not connected. Please configure MONGODB_URI.' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    res.json({ success: true, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, email: user.email }, token });
  } catch (error) {
    console.error('Auth login error:', error);
    const message = (process.env.NODE_ENV === 'production') ? 'Login failed' : (error.message || 'Login failed');
    res.status(500).json({ success: false, error: message });
  }
});

module.exports = router;
