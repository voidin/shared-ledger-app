const express = require('express');
const router = express.Router();
const { 
  getSummaryStats, 
  getMemberStats, 
  getCategoryStats,
  getTimelineStats 
} = require('../controllers/statistics.js');
const { authenticate } = require('../middleware/auth.js');

router.get('/summary', authenticate, getSummaryStats);

router.get('/by-member', authenticate, getMemberStats);

router.get('/by-category', authenticate, getCategoryStats);

router.get('/timeline', authenticate, getTimelineStats);

module.exports = router;
