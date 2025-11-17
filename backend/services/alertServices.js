const Alert = require('../models/Alert');
const { notifyQueue } = require('../queues/queue');
const User = require('../models/User');

/**
 * Create an alert (deduplicated by proximity + source)
 */
async function createAlert({ source, sourceId, type, severity='medium', message, lng, lat }) {
  // Basic dedupe: if an open alert of same type within radius exists in last 15min, skip creating duplicate
  const radius = parseInt(process.env.NOTIFY_RADIUS_METERS || '2000', 10);
  const now = new Date();
  const recent = await Alert.findOne({
    type,
    severity,
    createdAt: { $gte: new Date(now.getTime() - 15 * 60 * 1000) },
    location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radius } }
  });
  if (recent) {
    // update enrich
    recent.message = recent.message + '\n' + message;
    await recent.save();
    return recent;
  }

  const alert = await Alert.create({
    source, sourceId, type, severity, message,
    location: { type: 'Point', coordinates: [lng, lat] }
  });

  // enqueue notifications (notifyQueue worker will send SMS + push)
  await notifyQueue.add('alert-notify', { alertId: alert._id.toString() });

  return alert;
}

/**
 * Called by IoT ingestion
 */
async function checkAndCreateAlertsForIoT(data, device) {
  const lng = data.gps && data.gps.coordinates ? data.gps.coordinates[0] : (device.location.coordinates[0] || 0);
  const lat = data.gps && data.gps.coordinates ? data.gps.coordinates[1] : (device.location.coordinates[1] || 0);

  // water level
  if (data.waterLevel && data.waterLevel >= parseFloat(process.env.ALERT_HIGH_WATER_LEVEL || '80')) {
    const message = `High water level detected (${data.waterLevel}). Device: ${device.deviceId}`;
    return createAlert({ source: 'iot', sourceId: data._id.toString(), type: 'flood', severity: 'high', message, lng, lat });
  }

  // battery
  if (data.battery && data.battery <= parseFloat(process.env.ALERT_LOW_BATTERY || '15')) {
    const message = `Low battery (${data.battery}%) on device ${device.deviceId}`;
    return createAlert({ source: 'iot', sourceId: data._id.toString(), type: 'sensor', severity: 'low', message, lng, lat });
  }

  return null;
}

module.exports = { createAlert, checkAndCreateAlertsForIoT };
