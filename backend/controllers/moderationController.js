const Report = require('../models/Report');

async function getFlaggedReports(req, res, next) {
  try {
    const flagged = await Report.find({ isFlaggedForReview: true }).limit(200).lean();
    res.json({ flagged });
  } catch (err) { next(err); }
}

async function resolveFlaggedReport(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // accept | reject
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Not found' });

    report.isFlaggedForReview = false;
    if (action === 'accept') {
      report.status = 'verified';
    } else if (action === 'reject') {
      report.status = 'rejected';
    }
    await report.save();
    res.json({ message: 'Resolved', report });
  } catch (err) { next(err); }
}

module.exports = { getFlaggedReports, resolveFlaggedReport };
