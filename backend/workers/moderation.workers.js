require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('../src/queues/queue');
const { moderateImageBuffer } = require('../src/services/moderationService');
const Report = require('../src/models/Report');
const { getRedis } = require('../src/config/redis');

const worker = new Worker('moderation', async job => {
  // job.data = { reportId, imagePublicId, imageUrl } or { bufferBase64 }
  const { reportId, imagePublicId, imageBufferBase64 } = job.data;
  let buffer;
  if (imageBufferBase64) {
    buffer = Buffer.from(imageBufferBase64, 'base64');
  } else {
    // Optionally download image from cloudinary url. Implement if needed.
    throw new Error('imageBufferBase64 required');
  }

  const result = await moderateImageBuffer(buffer);

  // update report metadata: append moderation results under metadata.moderation array
  const report = await Report.findById(reportId);
  if (!report) throw new Error('Report not found for moderation');

  report.metadata = report.metadata || {};
  report.metadata.moderation = report.metadata.moderation || [];
  report.metadata.moderation.push({ result, at: new Date(), imagePublicId });

  // if flagged, set isFlaggedForReview true
  if (result.flagged) {
    report.isFlaggedForReview = true;
    report.status = 'pending'; // keep pending for human review
  }
  await report.save();

  return { ok: true };
}, { connection });

worker.on('failed', (job, err) => {
  console.error('Moderation job failed', job.id, err);
});

console.log('Moderation worker listening');
