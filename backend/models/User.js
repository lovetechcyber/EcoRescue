const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'admin', 'gov', 'ngo'], default: 'citizen' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  ecoPoints: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lastFailedLoginAt: { type: Date },
  isVerified: { type: Boolean, default: false },
  refreshTokens: [
  {
    token: String,
    createdAt: { type: Date, default: Date.now }
  },
  
],
otp: String,
otpExpires: Date,
isPhoneVerified: { type: Boolean, default: false },


}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
