const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, index: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revoked: { type: Boolean, default: false },
  createdByIp: String,
  replacedByToken: String,
  expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
