require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('../src/queues/queue');
const axios = require('axios');
const Report = require('../src/models/Report');

const worker = new Worker('ai-prediction', async job => {
  const payload = job.data; // { reports: [{...}] }
  // call external AI prediction service
  const res = await axios.post(process.env.AI_PREDICTION_URL, payload, { timeout: 30_000 });
  const prediction = res.data;

  // store prediction results somewhere (e.g., a Prediction model or attach to reports)
  // Example: attach to a Predictions collection or to each report metadata
  if (prediction && prediction.reports) {
    for (const p of prediction.reports) {
      // p.reportId, p.riskScore
      if (p.reportId) {
        await Report.findByIdAndUpdate(p.reportId, { $set: { 'metadata.prediction': p } });
      }
    }
  }
  return { ok: true, prediction };
}, { connection });

worker.on('failed', (job, err) => console.error('AI job failed', job.id, err));
console.log('AI worker listening');
