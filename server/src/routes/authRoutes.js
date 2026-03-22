// server/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, logout, refreshAccessToken, getProfile, updateProfile, debugUsers, devResetPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.get('/debug-users', debugUsers); // TEMP
router.post('/dev-reset-password', devResetPassword); // TEMP
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken); // client calls to get new access token (uses cookie)
router.get('/profile', protect, getProfile); // protected route to get user profile
router.put('/profile', protect, updateProfile); // protected route to update user profile

// Get any user by ID (for organization profile lookups etc.)
router.get('/user/:id', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
