const Report = require('../models/Report');
const { createReportSchema } = require('../models/reportValidators');
const { uploadBuffer } = require('../utils/cloudinary');
const { makePoint } = require('../utils/geo');
const User = require('../models/User');
const { moderationQueue } = require('../queues/queue');
const { notifyReportVerified } = require('../services/notificationService');
const { awardPointsForReport } = require('../services/ecoPointsService');
const { notifyUsersNearReport } = require('../services/notifyUsersNearReport');
const io = req.app.get('io');




/**
 * POST /api/reports
 * Body: { type, description, lng, lat, severity, metadata }
 * Optional: images via multipart/form-data (field name: images)
 */
async function createReport(req, res, next) {
  try {
    // validate
    const { error, value } = createReportSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // check location coords
    const { type, description, lng, lat, severity, metadata } = value;

    // enqueue moderation jobs per image
for (const img of images) {
  if (!img.publicId) continue;
  // fetch image buffer from Cloudinary (or attach original buffer during upload)
  // Best: during uploadBuffer, also keep bufferBase64 or store in temp storage.
  // For now, if you have file buffer during request, send it to queue directly:
  const fileFromReq = req.files.find(f => f.originalname === img.originalName);
  if (fileFromReq && fileFromReq.buffer) {
    await moderationQueue.add('moderate-image', {
      reportId: report._id.toString(),
      imagePublicId: img.publicId,
      imageBufferBase64: fileFromReq.buffer.toString('base64')
    }, { attempts: 3 });
  } else {
    // fallback: you can download Cloudinary url server-side and push buffer
  }
}


    // process images if present (multer)
    const images = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        // optionally validate size
        if (file.size > parseInt(process.env.REPORT_IMAGE_MAX_MB || '5', 10) * 1024 * 1024) {
          return res.status(400).json({ error: 'Image too large' });
        }
        const result = await uploadBuffer(file.buffer);
        images.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    const location = makePoint(lng, lat);
    const report = await Report.create({
      reporter: req.user.id,
      type,
      description,
      images,
      location,
      severity: severity || 'low',
      metadata: metadata || {}
    });

    // optional: push notification / queue for AI moderation or admin review
    // notificationService.notifyAdmins(report) // implement later

    res.status(201).json({ message: 'Report created', report });
  } catch (err) {
    next(err);
  }
}

async function getReport(req, res, next) {
  try {
    const { id } = req.params;
    const report = await Report.findById(id).populate('reporter', 'fullName phone email').lean();
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

// Admin verifies a report
async function verifyReport(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'verify' | 'reject' | 'action_taken'
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const userId = req.user.id;
    let emitUpdate = false;

    if (action === 'verify') {
      report.status = 'verified';
      report.verifiedBy = userId;
      report.verifiedAt = new Date();
      await awardPointsForReport(report);
      emitUpdate = true; // will emit after saving
    } else if (action === 'reject') {
      report.status = 'rejected';
      report.verifiedBy = userId;
      report.verifiedAt = new Date();
    } else if (action === 'action_taken') {
      report.status = 'action_taken';
      report.verifiedBy = userId;
      report.verifiedAt = new Date();
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Save first
    await report.save();

    // Emit heatmap update and notify nearby users if verified and high severity
    if (emitUpdate) {
      const io = req.app.get("io"); // make sure io is attached to app
      io?.emit('reportVerified', {
        _id: report._id,
        type: report.type,
        severity: report.severity,
        location: report.location,
        status: report.status,
        createdAt: report.createdAt,
      });

      if (report.severity === 'high') {
        await notifyUsersNearReport(report); // notification service
      }
    }

    await notifyReportVerified(report); // notify reporter optionally

    res.json({ message: 'Report updated', report });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/nearby?lng=...&lat=...&radius=meters&type=flood
 * returns list sorted by recency or severity
 */
async function getNearbyReports(req, res, next) {
  try {
    const { lng, lat, radius = process.env.REPORT_GEO_RADIUS_METERS || 5000, type } = req.query;
    if (!lng || !lat) return res.status(400).json({ error: 'lng and lat required' });

    const query = {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius, 10)
        }
      }
    };
    if (type) query.type = type;

    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ count: reports.length, reports });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/heatmap?bbox=minLng,minLat,maxLng,maxLat or center+radius
 * returns aggregated counts by grid for frontend heatmap
 */
async function getHeatmap(req, res, next) {
  try {
    // prefer bbox
    const { bbox, centerLng, centerLat, radius = 5000, type } = req.query;
    const match = {};
    if (type) match.type = type;

    let agg;
    if (bbox) {
      const parts = bbox.split(',').map(Number);
      if (parts.length !== 4) return res.status(400).json({ error: 'bbox must be minLng,minLat,maxLng,maxLat' });
      const [minLng, minLat, maxLng, maxLat] = parts;
      match.location = {
        $geoWithin: {
          $box: [[minLng, minLat], [maxLng, maxLat]]
        }
      };
      agg = [
        { $match: match },
        {
          $project: {
            type: 1,
            status: 1,
            lng: { $arrayElemAt: ['$location.coordinates', 0] },
            lat: { $arrayElemAt: ['$location.coordinates', 1] },
            score: { $switch: {
              branches: [
                { case: { $eq: ['$status', 'verified'] }, then: 3 },
                { case: { $eq: ['$status', 'action_taken'] }, then: 2 },
              ],
              default: 1
            }}
          }
        },
        {
          $group: {
            _id: { lng: { $round: ['$lng', 3] }, lat: { $round: ['$lat', 3] } }, // coarse grid; adjust rounding for granularity
            count: { $sum: 1 },
            score: { $sum: '$score' }
          }
        },
        { $limit: 1000 }
      ];
    } else if (centerLng && centerLat) {
      match.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(centerLng), parseFloat(centerLat)] },
          $maxDistance: parseInt(radius, 10)
        }
      };
      agg = [
        { $match: match },
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
        { $limit: 1000 }
      ];
    } else {
      return res.status(400).json({ error: 'Provide bbox or centerLng & centerLat' });
    }

    const results = await Report.aggregate(agg);
    // format features for frontend
    const features = results.map(r => ({
      lng: r._id.lng,
      lat: r._id.lat,
      count: r.count,
      score: r.score
    }));
    res.json({ features });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReport,
  getReport,
  verifyReport,
  getNearbyReports,
  getHeatmap
};
