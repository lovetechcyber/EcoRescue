require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const reportRoutes = require('./routes/reportRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const iotRoutes = require('./routes/iotRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const weatherRoutes = require('./routes/weatherRoutes');


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// public routes
app.use('/api/auth', rateLimiter, authRoutes);
app.use('/api/verify', rateLimiter, verificationRoutes);
app.use('/api/reports', eportRoutes);
app.use('/api/analytics', analyticsRoutes);
const moderationRoutes = require('./routes/moderationRoutes');
app.use('/api/moderation', moderationRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/external', weatherRoutes);


// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// error handler
app.use(errorHandler);

module.exports = app;
