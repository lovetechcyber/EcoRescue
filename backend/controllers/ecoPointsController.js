const { redeemReward } = require('../services/ecoPointsService');

async function redeem(req, res, next) {
  try {
    const userId = req.user.id;
    const rewardId = req.params.id;
    const result = await redeemReward(userId, rewardId);
    res.json({ message: 'Redeemed', reward: result.reward });
  } catch (err) { next(err); }
}

module.exports = { redeem };
