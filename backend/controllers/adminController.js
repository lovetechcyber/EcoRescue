const IoTDevice = require('../models/IoTDevice');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const User = require('../models/User');
const Reward = require('../models/Reward');
const json2csv = require('json2csv').parse;
const fs = require('fs');
const path = require('path');

async function overview(req, res, next) {
  try {
    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    const totalVerified = await Report.countDocuments({ status: 'verified' });
    const activeDevices = await IoTDevice.countDocuments({ active: true });
    const openAlerts = await Alert.countDocuments({ notified: false });

    res.json({ totalUsers, totalReports, totalVerified, activeDevices, openAlerts });
  } catch (err) { next(err); }
}

async function listDevices(req, res, next) {
  try {
    const devices = await IoTDevice.find().limit(1000);
    res.json({ devices });
  } catch (err) { next(err); }
}

async function deactivateDevice(req,res,next) {
  try {
    const id = req.params.id;
    await IoTDevice.findByIdAndUpdate(id, { active: false });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function listAlerts(req,res,next) {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(1000);
    res.json({ alerts });
  } catch (err) { next(err); }
}

async function resolveAlert(req,res,next) {
  try {
    const id = req.params.id;
    const action = req.body.action || 'resolve';
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: 'Not found' });
    alert.notified = true;
    alert.notifiedChannels = alert.notifiedChannels || [];
    if(action==='resolve') { alert.severity='low'; }
    await alert.save();
    res.json({ alert });
  } catch (err) { next(err); }
}

async function listReports(req,res,next) {
  try {
    const page = Math.max(0, parseInt(req.query.page||0,10));
    const limit = Math.min(200, parseInt(req.query.limit||50,10));
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.type) q.type = req.query.type;
    const reports = await Report.find(q).sort({ createdAt: -1 }).skip(page*limit).limit(limit);
    res.json({ reports, page, limit });
  } catch (err) { next(err); }
}

async function exportReportCSV(req,res,next) {
  try {
    const id = req.params.id;
    const report = await Report.findById(id).lean();
    if (!report) return res.status(404).json({ error: 'Not found' });
    const csv = json2csv(report);
    const fname = `report-${id}.csv`;
    const p = path.join(process.env.EXPORT_CSV_DIR || '/tmp', fname);
    fs.writeFileSync(p, csv);
    res.download(p, fname);
  } catch (err) { next(err); }
}

async function listUsers(req,res,next) {
  try { const users = await User.find().limit(1000).select('-passwordHash'); res.json({ users }); } catch (err) { next(err); }
}

async function blockUser(req,res,next) {
  try { await User.findByIdAndUpdate(req.params.id, { isBlocked: true }); res.json({ ok:true }); } catch (err) { next(err); }
}

async function listRewards(req,res,next) { try { const rewards = await Reward.find(); res.json({ rewards }); } catch (err) { next(err); } }
async function createReward(req,res,next) { try { const reward = await Reward.create(req.body); res.json({ reward }); } catch (err) { next(err); } }
async function updateReward(req,res,next) { try { const r = await Reward.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ reward: r }); } catch (err) { next(err); } }

module.exports = {
  overview, listDevices, deactivateDevice, listAlerts, resolveAlert,
  listReports, exportReportCSV, listUsers, blockUser, listRewards, createReward, updateReward
};
