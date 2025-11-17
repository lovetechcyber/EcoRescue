
import { fetchCurrentWeather } from '../services/weatherService.js';

async function getWeatherProxy(req, res, next) {
  try {
    // Accept either query lat/lng, or address in future
    const lat = parseFloat(req.query.lat || req.query.lat);
    const lng = parseFloat(req.query.lng || req.query.lon || req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng query params required (e.g. ?lat=6.5244&lng=3.3792)' });
    }

    const weather = await fetchCurrentWeather(lat, lng);
    return res.json(weather);
  } catch (err) {
    return next(err);
  }
}

export default { getWeatherProxy };
