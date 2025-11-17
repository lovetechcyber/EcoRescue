const express = require('express');
const router = express.Router();
const {
  verifyEmail,
  requestPasswordReset,
  resetPassword
} = require('../controllers/verificationController');

// Verify email (POST body { token })
router.post('/verify-email', verifyEmail);

// Request password reset: { emailOrPhone }
router.post('/password/request-reset', requestPasswordReset);

// Reset password: { token, newPassword }
router.post('/password/reset', resetPassword);

module.exports = router;
