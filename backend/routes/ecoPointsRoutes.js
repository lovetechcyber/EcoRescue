const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { redeem } = require('../controllers/ecoPointscontrller');

router.get('/catalog', authenticate, async (req,res)=>{ const Reward = require('../models/Reward'); res.json(await Reward.find({ active:true })); });
router.post('/redeem/:id', authenticate, redeem);
router.get('/leaderboard', authenticate, async (req,res) => {
  const User = require('../models/User');
  const top = await User.find().sort({ ecoPoints: -1 }).limit(50).select('fullName ecoPoints');
  res.json({ top });
});

module.exports = router;
