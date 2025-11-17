const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/adminMiddleware');
const AdminController = require('../controllers/adminController');

router.use(authenticate, requireRole('admin'));

// overview
router.get('/overview', AdminController.overview);

// sensors
router.get('/devices', AdminController.listDevices);
router.post('/devices/:id/deactivate', AdminController.deactivateDevice);

// alerts
router.get('/alerts', AdminController.listAlerts);
router.post('/alerts/:id/resolve', AdminController.resolveAlert);

// reports
router.get('/reports', AdminController.listReports);
router.post('/reports/:id/exportcsv', AdminController.exportReportCSV);

// users
router.get('/users', AdminController.listUsers);
router.post('/users/:id/block', AdminController.blockUser);

// rewards
router.get('/rewards', AdminController.listRewards);
router.post('/rewards', AdminController.createReward);
router.post('/rewards/:id/update', AdminController.updateReward);

module.exports = router;
