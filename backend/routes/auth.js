const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { protect } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/emailService');

// Multer config for profile picture uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user._id}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        message: 'An account already exists with this email address. Please login or use forgot password.' 
      });
    }

    // Create user
    const user = await User.create({ name, email, password });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/change-email
// @desc    Change user email (requires password verification + new password)
// @access  Private
router.post('/change-email', protect, async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newEmail || !newPassword) {
      return res.status(400).json({ message: 'Please provide current password, new email and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // Check if new email is already in use by another user
    const emailExists = await User.findOne({ email: newEmail.toLowerCase() });
    if (emailExists && emailExists._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'This email is already registered to another account' });
    }

    // Update email and password
    user.email = newEmail.toLowerCase();
    user.password = newPassword;
    await user.save();

    res.json({ 
      message: 'Email and password updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Change email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to email for password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ message: 'Please provide email address' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email not registered' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    // Save OTP to database
    await OTP.create({ email, otp });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please try again later.' 
      });
    }

    res.json({ 
      message: 'OTP has been sent to your email address',
      email: email 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    // Find OTP
    const otpRecord = await OTP.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP verification
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide email, OTP and new password' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete OTP after successful reset
    await OTP.deleteMany({ email });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/update-name
// @desc    Update user name
// @access  Private
router.put('/update-name', protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Please provide a name' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true }
    );

    res.json({
      message: 'Name updated successfully',
      user: { _id: user._id, name: user.name, email: user.email, profilePicture: user.profilePicture }
    });
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/upload-photo
// @desc    Upload profile picture
// @access  Private
router.post('/upload-photo', protect, (req, res) => {
  upload.single('profilePicture')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Max 5MB allowed' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file' });
    }

    try {
      // Delete old profile picture if exists
      const currentUser = await User.findById(req.user._id);
      if (currentUser.profilePicture) {
        const oldPath = path.join(__dirname, '..', currentUser.profilePicture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const profilePicture = `/uploads/profiles/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture },
        { new: true }
      );

      res.json({
        message: 'Profile picture updated successfully',
        user: { _id: user._id, name: user.name, email: user.email, profilePicture: user.profilePicture }
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// @route   DELETE /api/auth/remove-photo
// @desc    Remove profile picture
// @access  Private
router.delete('/remove-photo', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profilePicture = '';
    await user.save();

    res.json({
      message: 'Profile picture removed',
      user: { _id: user._id, name: user.name, email: user.email, profilePicture: '' }
    });
  } catch (error) {
    console.error('Remove photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/send-reset-account-otp
// @desc    Send OTP for account reset verification
// @access  Private
router.post('/send-reset-account-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete any existing OTPs for this user with purpose 'reset-account'
    await OTP.deleteMany({ user: user._id, purpose: 'reset-account' });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create OTP document
    const otp = await OTP.create({
      user: user._id,
      email: user.email,
      otp: otpCode,
      purpose: 'reset-account',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP email
    await sendOTPEmail(user.email, otpCode, 'Account Reset Verification');

    res.json({ message: 'OTP sent to your email address' });
  } catch (error) {
    console.error('Send reset account OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// @route   POST /api/auth/reset-account
// @desc    Verify OTP and delete all user data
// @access  Private
router.post('/reset-account', protect, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find OTP
    const otpDoc = await OTP.findOne({
      user: user._id,
      otp: otp,
      purpose: 'reset-account',
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Delete all user data from different collections
    const Expense = require('../models/Expense');
    const Salary = require('../models/Salary');
    const Budget = require('../models/Budget');
    const MoneyLent = require('../models/MoneyLent');
    const MoneyBorrowed = require('../models/MoneyBorrowed');

    await Promise.all([
      Expense.deleteMany({ user: user._id }),
      Salary.deleteMany({ user: user._id }),
      Budget.deleteMany({ user: user._id }),
      MoneyLent.deleteMany({ user: user._id }),
      MoneyBorrowed.deleteMany({ user: user._id })
    ]);

    // Delete the OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    res.json({ message: 'Account reset successfully. All your data has been deleted.' });
  } catch (error) {
    console.error('Reset account error:', error);
    res.status(500).json({ message: 'Failed to reset account. Please try again.' });
  }
});

// Send Delete Account OTP
router.post('/send-delete-account-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing delete-account OTPs for this user
    await OTP.deleteMany({ user: user._id, purpose: 'delete-account' });

    // Create new OTP
    const otpDoc = new OTP({
      user: user._id,
      otp: otp,
      purpose: 'delete-account',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await otpDoc.save();

    // Send OTP email
    await sendOTPEmail(user.email, otp, 'Delete Account');

    res.json({ message: 'OTP sent successfully to your email' });
  } catch (error) {
    console.error('Send delete account OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// Delete Account with OTP verification
router.post('/delete-account', protect, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find OTP
    const otpDoc = await OTP.findOne({
      user: user._id,
      otp: otp,
      purpose: 'delete-account',
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Delete all user data from different collections
    const Expense = require('../models/Expense');
    const Salary = require('../models/Salary');
    const Budget = require('../models/Budget');
    const MoneyLent = require('../models/MoneyLent');
    const MoneyBorrowed = require('../models/MoneyBorrowed');

    await Promise.all([
      Expense.deleteMany({ user: user._id }),
      Salary.deleteMany({ user: user._id }),
      Budget.deleteMany({ user: user._id }),
      MoneyLent.deleteMany({ user: user._id }),
      MoneyBorrowed.deleteMany({ user: user._id })
    ]);

    // Delete all OTPs for this user
    await OTP.deleteMany({ user: user._id });

    // Delete the user account itself
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Account deleted successfully. Your account and all associated data have been permanently removed.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account. Please try again.' });
  }
});

module.exports = router;
