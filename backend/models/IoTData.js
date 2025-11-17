const mongoose = require('mongoose');

const ioTDataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  waterLevel: Number,      // in cm or chosen unit
  battery: Number,         // percent
  temperature: Number,
  conductivity: Number,
  gps: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } },
  raw: mongoose.Mixed      // raw payload
}, { timestamps: true });

ioTDataSchema.index({ gps: '2dsphere' });

module.exports = mongoose.model('IoTData', ioTDataSchema);
