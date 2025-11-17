const AfricasTalking = require('../config/africastalking');
const admin = require('firebase-admin');
const User = require('../models/User');
const { notifyQueue } = require('../queues/queue');
const mongoose = require('mongoose');

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // private key replace escaped newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

async function sendSMS(to, message) {
  const sms = AfricasTalking.SMS;
  try {
    const res = await sms.send({ to: [to], message });
    return res;
  } catch (err) {
    console.error('SMS send error', err);
    throw err;
  }
}

async function sendPushTokens(pushTokens, title, body, data = {}) {
  if (!admin.apps.length) return;
  const message = {
    notification: { title, body },
    data,
    tokens: pushTokens
  };
  const res = await admin.messaging().sendMulticast(message);
  return res;
}

async function notifyReportVerified(report) {
  // Find users within radius using geo query on User.location.coordinates
  const radius = parseInt(process.env.NOTIFY_RADIUS_METERS || '2000', 10);
  // If report.location coordinates are 0,0 (USSD), skip SMS mass notify and maybe notify via report metadata only
  const coords = report.location && report.location.coordinates;
  if (!coords || coords[0] === 0 && coords[1] === 0) {
    // send only to reporter
    const reporter = await User.findById(report.reporter);
    if (reporter && reporter.phone) {
      await sendSMS(reporter.phone, `Your report ${report._id} has been verified.`);
    }
    return;
  }
  const [lng, lat] = coords;

  const nearbyUsers = await User.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius
      }
    },
    // only users who want notifications maybe add filter: notificationPreferences
  }).limit(500).lean();

  // send SMS and Push via queue to avoid blocking
  await notifyQueue.add('notify-verified', { reportId: report._id.toString(), userPhones: nearbyUsers.map(u => u.phone || null), pushTokens: nearbyUsers.map(u => u.pushToken || null).filter(Boolean) });
}

module.exports = { sendSMS, sendPushTokens, notifyReportVerified };
