const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fieldSize: 5 * 1024 * 1024 } });
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/adminMiddleware');

const {
  createReport,
  getReport,
  verifyReport,
  getNearbyReports,
  getHeatmap
} = require('../controllers/reportController');

router.post('/', authenticate, upload.array('images', 6), createReport);
router.get('/:id', authenticate, getReport);
router.get('/nearby', authenticate, getNearbyReports);
router.get('/heatmap', authenticate, getHeatmap);

// admin actions
router.post('/:id/verify', authenticate, requireRole('admin'), verifyReport);

module.exports = router;
