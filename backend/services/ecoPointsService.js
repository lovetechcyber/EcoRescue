const User = require('../models/User');
const EcoPointTransaction = require('../models/EcoPointTransaction');
const Reward = require('../models/Reward');

async function awardPointsForReport(report) {
  // award points based on severity / verification
  if (report.status !== 'verified') return;
  const userId = report.reporter;
  let points = 10;
  if (report.severity === 'medium') points = 20;
  if (report.severity === 'high') points = 50;
  await User.findByIdAndUpdate(userId, { $inc: { ecoPoints: points }});
  await EcoPointTransaction.create({ user: userId, change: points, reason: 'report_verified', related: report._id.toString() });
  return points;
}

async function redeemReward(userId, rewardId) {
  const reward = await Reward.findById(rewardId);
  if (!reward || !reward.active) throw new Error('Reward not available');
  const user = await User.findById(userId);
  if (user.ecoPoints < reward.cost) throw new Error('Insufficient ecoPoints');
  // reduce points and reduce stock
  user.ecoPoints -= reward.cost;
  await user.save();
  reward.stock = Math.max(0, reward.stock - 1);
  await reward.save();
  await EcoPointTransaction.create({ user: userId, change: -reward.cost, reason: 'redeem', related: rewardId });
  return { success: true, reward };
}

module.exports = { awardPointsForReport, redeemReward };
