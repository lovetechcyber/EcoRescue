require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('../src/queues/queue');
const { sendSMS, sendPushTokens } = require('../src/services/notificationService');
const User = require('../src/models/User');

const worker = new Worker('notifications', async job => {
  const { reportId, userPhones = [], pushTokens = [] } = job.data;
  const msg = `Alert: Report ${reportId} has been verified nearby. Take precautions. - EcoRescue`;

  // send SMS batched (Africa's Talking supports multiple recipients)
  const phones = userPhones.filter(Boolean);
  if (phones.length) {
    // chunk phones to avoid payload limits
    const chunkSize = 100;
    for (let i=0;i<phones.length;i+=chunkSize) {
      const chunk = phones.slice(i, i+chunkSize);
      await sendSMS(chunk, msg);
    }
  }

  // send push
  if (pushTokens.length) {
    await sendPushTokens(pushTokens, 'Nearby Alert', `A verified ${reportId} has been reported nearby`, { reportId });
  }

  return { ok: true };
}, { connection });

worker.on('failed', (job, err) => console.error('notify job failed', job.id, err));
console.log('Notification worker listening');
