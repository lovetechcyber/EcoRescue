const bcrypt = require('bcrypt');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  verifyRefreshJwt
} = require('../utils/token');
const { registerSchema, loginSchema } = require('../utils/validators');

const { generateOTP } = require("../utils/otp");
const { sendSMS } = require("../services/smsService");

const SALT_ROUNDS = 12;

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { fullName, phone, email, password } = value;

    const existing = await User.findOne({ $or: [{ phone }, { email }] });
    if (existing) return res.status(409).json({ error: 'User with this phone/email already exists' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ fullName, phone, email, passwordHash });

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const { jwtToken, tokenId, expiresAt, createdByIp } = signRefreshToken(user._id.toString(), req.ip);
    await saveRefreshToken(tokenId, user._id, createdByIp, expiresAt);

    res.status(201).json({
      message: 'Registered successfully',
      user: { id: user._id, fullName: user.fullName, phone: user.phone, role: user.role, ecoPoints: user.ecoPoints },
      tokens: { accessToken, refreshToken: jwtToken }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { phoneOrEmail, password } = value;
    const user = await User.findOne({ $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail }] });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.isBlocked) return res.status(403).json({ error: 'Account blocked. Contact support.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLoginAt = new Date();
      await user.save();
      // optional: lock account after N tries
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lastFailedLoginAt = null;
    await user.save();

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const { jwtToken, tokenId, expiresAt, createdByIp } = signRefreshToken(user._id.toString(), req.ip);
    await saveRefreshToken(tokenId, user._id, createdByIp, expiresAt);

    res.json({
      message: 'Logged in',
      user: { id: user._id, fullName: user.fullName, phone: user.phone, role: user.role, ecoPoints: user.ecoPoints },
      tokens: { accessToken, refreshToken: jwtToken }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const payload = await verifyRefreshJwt(refreshToken).catch(() => null);
    if (!payload) return res.status(401).json({ error: 'Invalid refresh token' });

    const { tokenId, userId } = payload;
    const stored = await RefreshToken.findOne({ tokenId, user: userId });
    if (!stored || stored.revoked) return res.status(401).json({ error: 'Refresh token revoked or not found' });

    // rotate refresh token: revoke old and issue new
    await revokeRefreshToken(tokenId);

    const accessToken = signAccessToken({ sub: userId });
    const { jwtToken: newRefreshJwt, tokenId: newTokenId, expiresAt, createdByIp } = signRefreshToken(userId, req.ip);
    await saveRefreshToken(newTokenId, userId, createdByIp, expiresAt);

    res.json({ accessToken, refreshToken: newRefreshJwt });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const payload = await verifyRefreshJwt(refreshToken).catch(() => null);
    if (!payload) return res.status(200).json({ message: 'Logged out' }); // idempotent

    await revokeRefreshToken(payload.tokenId);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

exports.resetPassword = async (req, res) => {
  const { phone, newPassword } = req.body;

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = newPassword;

  // 🚨 Revoke ALL old refresh tokens
  user.refreshTokens = [];

  await user.save();

  res.json({
    message: "Password reset successful. All devices logged out."
  });
};

exports.sendOTP = async (req, res) => {
  const { phone } = req.body;

  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone });
  }

  const otp = generateOTP();

  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
  await user.save();

  await sendSMS(phone, `Your EcoRescue OTP is ${otp}`);

  res.json({ message: "OTP sent successfully" });
};

exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  if (user.otpExpires < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  user.isPhoneVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  const { accessToken, refreshToken } = await generateTokens(user._id);

  res.json({
    message: "OTP verified",
    accessToken,
    refreshToken,
    user
  });
};


module.exports = { register, login, refresh, logout };
