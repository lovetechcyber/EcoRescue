require('dotenv').config();
const mqtt = require('mqtt');
const IoTDevice = require('../src/models/IoTDevice');
const IoTData = require('../src/models/IoTData');
const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'ecorescue/devices';

client.on('connect', () => {
  client.subscribe(`${TOPIC_PREFIX}/+/telemetry`, { qos: 1 }, () => console.log('subscribed to telemetry'));
});

client.on('message', async (topic, payload) => {
  try {
    const parts = topic.split('/');
    const deviceId = parts[2]; // e.g. ecorescue/devices/{deviceId}/telemetry
    const json = JSON.parse(payload.toString());
    const device = await IoTDevice.findOne({ deviceId });
    if (!device) return console.warn('Unknown device', deviceId);

    const data = await IoTData.create({
      deviceId,
      waterLevel: json.waterLevel,
      battery: json.battery,
      temperature: json.temperature,
      gps: json.gps ? { type: 'Point', coordinates: [json.gps.lng, json.gps.lat] } : device.location,
      raw: json
    });

    device.lastSeenAt = new Date();
    await device.save();

    const { checkAndCreateAlertsForIoT } = require('../src/services/alertsService');
    await checkAndCreateAlertsForIoT(data, device);

    // optionally enqueue AI
  } catch (err) { console.error('mqtt message error', err); }
});
console.log('MQTT worker connected to broker');