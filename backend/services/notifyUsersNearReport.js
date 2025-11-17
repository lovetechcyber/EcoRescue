const User = require('../models/User');
const { sendPushNotification } = require('./pushService');

async function notifyUsersNearReport(report) {
  const { location } = report;

  const nearbyUsers = await User.find({
    location: {
      $near: {
        $geometry: location,
        $maxDistance: parseInt(process.env.ALERT_RADIUS_METERS || 5000),
      },
    },
  });

  for (const user of nearbyUsers) {
    await sendPushNotification(user.deviceToken, {
      title: 'Severe Report Nearby',
      body: `A ${report.type} report was verified near your area.`,
      data: { reportId: report._id },
    });
  }
}
