// server/src/controllers/authController.js
const User = require('../models/User');
const { createAccessToken, createRefreshToken } = require('../utils/token');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' });
    }
    // Set default role if not provided or empty
    const userRole = role && role.trim() !== '' ? role : 'user';
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ name, email, password, role: userRole });
    await user.save();

    const accessToken = createAccessToken({ userId: user._id, role: user.role });
    const refreshToken = createRefreshToken({ userId: user._id, role: user.role });

    // send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log(`[Login] No user found for email: ${email}`);
      return res.status(401).json({ message: 'No account found with this email. Please register first.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`[Login] Wrong password for email: ${email}`);
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const accessToken = createAccessToken({ userId: user._id, role: user.role });
    const refreshToken = createRefreshToken({ userId: user._id, role: user.role });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ message: 'Logged out' });
};

const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });
      const payload = { userId: decoded.userId, role: decoded.role };
      const accessToken = createAccessToken(payload);
      res.json({ accessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only update allowed fields (role is NOT updatable via this endpoint)
    const { name, email } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// TEMPORARY DEV HELPERS — remove before production
const debugUsers = async (req, res) => {
  const users = await User.find({}).select('email role createdAt').lean();
  res.json({ count: users.length, database: 'test', users });
};

// DEV ONLY: reset a user's password by email
const devResetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: 'email and newPassword required' });
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.password = newPassword; // pre-save hook will hash it
  await user.save();
  res.json({ message: `Password reset for ${email}`, role: user.role });
};

module.exports = { register, login, logout, refreshAccessToken, getProfile, updateProfile, debugUsers, devResetPassword };