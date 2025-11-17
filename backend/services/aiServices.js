const { aiQueue } = require('../queues/queue');
const axios = require('axios');

// enqueue
async function enqueueForPrediction(payload) {
  // payload can be { reports: [...], sensors: [...] }
  await aiQueue.add('predict-batch', payload, { attempts: 3 });
}

// worker to call external AI microservice
module.exports = { enqueueForPrediction };
// aiService.js (updated enqueue that enriches payload with weather)
const { aiQueue } = require('../queues/queue');
const { fetchCurrentWeather } = require('./weatherService');

async function enqueueForPrediction(payload) {
  // payload may include center coords or reports array
  try {
    // if there's a center coordinate or first report with coords, fetch weather
    let lat = null, lng = null;
    if (payload.center) { lat = payload.center.lat; lng = payload.center.lng; }
    else if (payload.reports && payload.reports.length) {
      const r = payload.reports.find(r=>r.location && r.location.coordinates && r.location.coordinates.length);
      if (r) { lng = r.location.coordinates[0]; lat = r.location.coordinates[1]; }
    } else if (payload.ioTData && payload.ioTData.length) {
      const d = payload.ioTData[0];
      if (d.gps && d.gps.coordinates && d.gps.coordinates.length) { lng = d.gps.coordinates[0]; lat = d.gps.coordinates[1]; }
    }

    if (lat !== null && lng !== null) {
      payload.weather = await fetchCurrentWeather(lat, lng);
    }

  } catch (e) {
    // continue even if weather fetch fails
    console.warn('Failed to enrich prediction payload with weather:', e.message || e);
  }

  // enqueue job for AI worker
  await aiQueue.add('predict-batch', payload, { attempts: 3 });
}

module.exports = { enqueueForPrediction };
