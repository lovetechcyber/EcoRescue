const mongoose = require('mongoose');
const txSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  change: { type: Number, required: true }, // positive or negative
  reason: String,
  related: { type: String }, // reportId, rewardId etc
}, { timestamps: true });

module.exports = mongoose.model('EcoPointTransaction', txSchema);
