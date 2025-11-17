const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/adminMiddleware');
const { registerDevice, ingestTelemetryHTTP, ingestBulk } = require('../controllers/iotController');

router.post('/register', authenticate, requireRole('admin'), registerDevice);
router.post('/telemetry', ingestTelemetryHTTP); // no auth middleware: uses device api key
router.post('/telemetry/bulk', authenticate, requireRole('admin'), ingestBulk);

module.exports = router;
