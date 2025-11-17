const { createClient } = require('redis');

let client;

async function connectRedis(url) {
  client = createClient({ url });
  client.on('error', err => console.error('Redis Client Error', err));
  await client.connect();
  console.log('Redis connected');
  return client;
}

function getRedis() {
  if (!client) throw new Error('Redis client not initialized');
  return client;
}

module.exports = { connectRedis, getRedis };
