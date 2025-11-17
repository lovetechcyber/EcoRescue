const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { monthlyTrends, topHotspots, typeBreakdown } = require('../controllers/analyticalntroller');

router.get('/monthly-trends', authenticate, monthlyTrends);
router.get('/top-hotspots', authenticate, topHotspots);
router.get('/type-breakdown', authenticate, typeBreakdown);

module.exports = router;
