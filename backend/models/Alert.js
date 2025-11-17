const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  source: { type: String, enum: ['iot','report','ai','manual'], required: true },
  sourceId: String,
  type: { type: String, enum: ['flood','waste','sensor','other'], required: true },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  message: String,
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } },
  notified: { type: Boolean, default: false },
  notifiedChannels: [String],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

alertSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Alert', alertSchema);
