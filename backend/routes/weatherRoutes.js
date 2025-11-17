// weatherRoutes.js
const express = require('express');
const router = express.Router();
const { getWeatherProxy } = require('../controllers/weatherController').default;
const { authenticate } = require('../middleware/authMiddleware'); // optional to protect the route

// Public route or choose to protect
router.get('/weather', /* authenticate, */ getWeatherProxy);

module.exports = router;
