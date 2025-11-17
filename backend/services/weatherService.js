// weatherService.js
const axios = require('axios');
const { getRedis } = require('../config/redis'); // you already have a Redis helper per earlier code
const qs = require('querystring');

const BASE = process.env.OPENWEATHER_BASE || 'https://api.openweathermap.org/data/2.5';
const KEY = process.env.OPENWEATHER_API_KEY;
const TTL = parseInt(process.env.WEATHER_CACHE_TTL || '300', 10);

if (!KEY) {
  console.warn('OPENWEATHER_API_KEY is not set — weather proxy will fail.');
}

function cacheKeyFor(lat, lng) {
  // coarse key rounded to 3 decimal places (~100m)
  const rlat = Number(lat).toFixed(3);
  const rlng = Number(lng).toFixed(3);
  return `weather:${rlat}:${rlng}`;
}

async function fetchCurrentWeather(lat, lng) {
  if (!KEY) throw new Error('OpenWeather API key not configured');

  const redis = getRedis();
  const cacheKey = cacheKeyFor(lat, lng);

  // try cache
  try {
    const raw = await redis.get(cacheKey);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Weather cache read error', e.message || e);
  }

  // call OpenWeatherMap current weather endpoint
  const url = `${BASE}/weather?${qs.stringify({ lat, lon: lng, appid: KEY, units: 'metric' })}`;
  const res = await axios.get(url, { timeout: 10_000 });
  const data = res.data;

  // normalize into smaller shape we return to client and AI
  const normalized = {
    provider: 'openweathermap',
    timestamp: Date.now(),
    coords: { lat: data.coord?.lat, lng: data.coord?.lon },
    weather: {
      main: data.weather?.[0]?.main || null,
      description: data.weather?.[0]?.description || null,
      temp: data.main?.temp ?? null,
      feels_like: data.main?.feels_like ?? null,
      humidity: data.main?.humidity ?? null,
      pressure: data.main?.pressure ?? null,
      wind_speed: data.wind?.speed ?? null,
      wind_deg: data.wind?.deg ?? null,
      visibility: data.visibility ?? null,
    },
    raw: {
      main: data.main,
      weather: data.weather,
      wind: data.wind,
      clouds: data.clouds,
      sys: data.sys
    }
  };

  // cache
  try {
    await redis.set(cacheKey, JSON.stringify(normalized), 'EX', TTL);
  } catch (e) {
    console.warn('Weather cache write error', e.message || e);
  }

  return normalized;
}

module.exports = { fetchCurrentWeather };
