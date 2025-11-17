const IoTDevice = require('../models/IoTDevice');
const IoTData = require('../models/IoTData');
const { v4: uuidv4 } = require('uuid');

// Register device (admin only)
async function registerDevice(req, res, next) {
  try {
    const { deviceId, name, lng, lat, meta } = req.body;
    const apiKey = uuidv4();
    const device = await IoTDevice.create({
      deviceId,
      name,
      apiKey,
      location: { type: 'Point', coordinates: [lng || 0, lat || 0] },
      meta
    });
    res.status(201).json({ device });
  } catch (err) { next(err); }
}

// HTTP telemetry endpoint (devices can post)
async function ingestTelemetryHTTP(req, res, next) {
  try {
    // auth by api key in header: x-iot-api-key
    const apiKey = req.headers['x-iot-api-key'] || req.query.apiKey;
    if (!apiKey) return res.status(401).json({ error: 'API key required' });
    const device = await IoTDevice.findOne({ apiKey, active: true });
    if (!device) return res.status(401).json({ error: 'Invalid API key' });

    const { waterLevel, battery, temperature, gps } = req.body; // expected JSON
    const data = await IoTData.create({
      deviceId: device.deviceId,
      waterLevel,
      battery,
      temperature,
      gps: gps && gps.lng ? { type: 'Point', coordinates: [gps.lng, gps.lat] } : device.location,
      raw: req.body
    });

    device.lastSeenAt = new Date();
    await device.save();

    // check thresholds and enqueue alerts if necessary
    const { checkAndCreateAlertsForIoT } = require('../services/alertsService');
    await checkAndCreateAlertsForIoT(data, device);

    // enqueue to AI queue optionally
    const { enqueueForPrediction } = require('../services/aiService');
    // small batch: send critical events or every N readings
    if (data.waterLevel && data.waterLevel >= parseFloat(process.env.ALERT_HIGH_WATER_LEVEL || '80')) {
      await enqueueForPrediction({ ioTData: [data] });
    }

    res.json({ status: 'ok', saved: data._id });
  } catch (err) { next(err); }
}

// Bulk ingestion (admin)
async function ingestBulk(req, res, next) {
  try {
    const { deviceId, samples } = req.body; // samples: array of telemetry
    const created = [];
    for (const s of samples) {
      const d = await IoTData.create({
        deviceId,
        waterLevel: s.waterLevel,
        battery: s.battery,
        temperature: s.temperature,
        gps: s.gps ? { type: 'Point', coordinates: [s.gps.lng, s.gps.lat] } : undefined,
        timestamp: s.timestamp || Date.now(),
        raw: s
      });
      created.push(d);
    }
    res.json({ created: created.length });
  } catch (err) { next(err); }
}

module.exports = { registerDevice, ingestTelemetryHTTP, ingestBulk };
