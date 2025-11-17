const express = require('express');
const router = express.Router();
const { ussdHandler } = require('../controllers/ussdController');

router.post('/callback', ussdHandler);

module.exports = router;
