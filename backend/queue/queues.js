const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

const moderationQueue = new Queue('moderation', { connection });
new QueueScheduler('moderation', { connection });

const aiQueue = new Queue('ai-prediction', { connection });
new QueueScheduler('ai-prediction', { connection });

const notifyQueue = new Queue('notifications', { connection });
new QueueScheduler('notifications', { connection });

module.exports = { moderationQueue, aiQueue, notifyQueue, connection };
