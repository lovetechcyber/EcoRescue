const mongoose = require('mongoose');
const rewardSchema = new mongoose.Schema({
  title: String,
  description: String,
  cost: { type: Number, required: true }, // points
  stock: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  meta: mongoose.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
