const crypto = require('crypto');
const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const { sendMail } = require('../utils/email');
const bcrypt = require('bcrypt');

const TOKEN_EXPIRY_EMAIL_VERIFY_HOURS = 72; // 3 days
const TOKEN_EXPIRY_RESET_HOURS = 2;
const SALT_ROUNDS = 12;

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendVerificationEmail(user, req) {
  const token = makeToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_EMAIL_VERIFY_HOURS * 60 * 60 * 1000);
  await VerificationToken.create({ token, user: user._id, type: 'email_verify', expiresAt });

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const subject = 'Verify your EcoRescue account';
  const html = `
    <p>Hi ${user.fullName},</p>
    <p>Thanks for joining EcoRescue! Please verify your email by clicking the link below:</p>
    <p><a href="${verifyUrl}">Verify my email</a></p>
    <p>If clicking doesn't work, copy & paste this URL into your browser:</p>
    <p>${verifyUrl}</p>
    <p>This link expires in ${TOKEN_EXPIRY_EMAIL_VERIFY_HOURS} hours.</p>
  `;

  await sendMail({ to: user.email, subject, html });
}

async function registerWithVerification(req, res, next) {
  // This function is an alternative to the earlier register; or integrate it into existing register
  try {
    const { fullName, phone, email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required for verification' });

    const existing = await User.findOne({ $or: [{ phone }, { email }] });
    if (existing) return res.status(409).json({ error: 'User with this phone/email already exists' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ fullName, phone, email, passwordHash, isVerified: false });

    await sendVerificationEmail(user, req);

    // Do not issue full privileges until verified (optional)
    res.status(201).json({ message: 'Registered. Verification email sent.' });
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body; // or req.query.token if using link
    if (!token) return res.status(400).json({ error: 'Token required' });

    const t = await VerificationToken.findOne({ token, type: 'email_verify' }).populate('user');
    if (!t) return res.status(400).json({ error: 'Invalid token' });
    if (t.used) return res.status(400).json({ error: 'Token already used' });
    if (t.expiresAt < new Date()) return res.status(400).json({ error: 'Token expired' });

    const user = t.user;
    user.isVerified = true;
    await user.save();

    t.used = true;
    await t.save();

    // Optionally: generate auth tokens here (access + refresh). For safety we require login.
    res.json({ message: 'Email verified. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) return res.status(400).json({ error: 'Email or phone required' });

    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
    if (!user || !user.email) {
      // Do not reveal whether user exists for security — respond same message
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const token = makeToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_RESET_HOURS * 60 * 60 * 1000);
    await VerificationToken.create({ token, user: user._id, type: 'password_reset', expiresAt });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const subject = 'EcoRescue password reset request';
    const html = `
      <p>Hi ${user.fullName},</p>
      <p>We received a request to reset your EcoRescue password. Use the link below to set a new password (expires in ${TOKEN_EXPIRY_RESET_HOURS} hours):</p>
      <p><a href="${resetUrl}">Reset my password</a></p>
      <p>If you didn't request this, ignore this email.</p>
    `;
    await sendMail({ to: user.email, subject, html });

    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and newPassword required' });

    const t = await VerificationToken.findOne({ token, type: 'password_reset' }).populate('user');
    if (!t) return res.status(400).json({ error: 'Invalid token' });
    if (t.used) return res.status(400).json({ error: 'Token already used' });
    if (t.expiresAt < new Date()) return res.status(400).json({ error: 'Token expired' });

    const user = t.user;
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    t.used = true;
    await t.save();

    // Revoke refresh tokens associated with user (optional): find and revoke
    // (Left as exercise — integrate revokeRefreshToken if required)

    res.json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerWithVerification,
  sendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  resetPassword
};
