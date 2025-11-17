const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, index: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['email_verify', 'password_reset'], required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
