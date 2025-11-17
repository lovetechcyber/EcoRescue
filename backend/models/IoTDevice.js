const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: String,
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } },
  apiKey: { type: String, required: true },
  active: { type: Boolean, default: true },
  lastSeenAt: Date,
  meta: mongoose.Mixed // hardware info, model, firmware
}, { timestamps: true });

deviceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('IoTDevice', deviceSchema);
