const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // ms
  max: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),
  message: { error: 'Too many requests, please try again later.' }
});

module.exports = limiter;
