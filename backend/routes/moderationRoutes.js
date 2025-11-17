const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/adminMiddleware');
const { getFlaggedReports, resolveFlaggedReport } = require('../controllers/moderationController');

router.get('/', authenticate, requireRole('admin'), getFlaggedReports);
router.post('/:id/resolve', authenticate, requireRole('admin'), resolveFlaggedReport);

module.exports = router;
