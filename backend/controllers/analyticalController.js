const Report = require('../models/Report');
const mongoose = require('mongoose');

async function monthlyTrends(req, res, next) {
  try {
    const { months = 6 } = req.query;
    const monthsInt = parseInt(months, 10);
    const since = new Date();
    since.setMonth(since.getMonth() - monthsInt + 1);

    const agg = [
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, type: '$type' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          data: { $push: { year: '$_id.year', month: '$_id.month', count: '$count' } }
        }
      }
    ];
    const results = await Report.aggregate(agg);
    res.json({ results });
  } catch (err) { next(err); }
}

async function topHotspots(req, res, next) {
  try {
    const { limit = 20 } = req.query;
    const agg = [
      { $match: {} },
      {
        $project: {
          lng: { $arrayElemAt: ['$location.coordinates', 0] },
          lat: { $arrayElemAt: ['$location.coordinates', 1] },
          score: { $cond: [{ $eq: ['$status', 'verified'] }, 3, 1] }
        }
      },
      {
        $group: {
          _id: { lng: { $round: ['$lng', 3] }, lat: { $round: ['$lat', 3] } },
          count: { $sum: 1 },
          score: { $sum: '$score' }
        }
      },
      { $sort: { score: -1, count: -1 } },
      { $limit: parseInt(limit, 10) }
    ];
    const hotspots = await Report.aggregate(agg);
    res.json({ hotspots });
  } catch (err) { next(err); }
}

async function typeBreakdown(req, res, next) {
  try {
    const agg = [
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];
    const breakdown = await Report.aggregate(agg);
    res.json({ breakdown });
  } catch (err) { next(err); }
}

module.exports = { monthlyTrends, topHotspots, typeBreakdown };
