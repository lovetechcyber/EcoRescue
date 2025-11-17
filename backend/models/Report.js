const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['flood', 'waste', 'blocked_drain', 'other'], required: true },
  description: { type: String, trim: true },
  images: [{ url: String, publicId: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  status: { type: String, enum: ['pending','verified','action_taken','rejected'], default: 'pending' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  metadata: mongoose.Mixed // for extra sensor/phone metadata
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
