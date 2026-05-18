const express = require('express');
const router = express.Router();
const { 
  getSummaryStats, 
  getMemberStats, 
  getCategoryStats,
  getTimelineStats 
} = require('../controllers/statistics.js');
const { authenticate } = require('../middleware/auth.js');

router.get('/:id/stats/summary', authenticate, getSummaryStats);

router.get('/:id/stats/by-member', authenticate, getMemberStats);

router.get('/:id/stats/by-category', authenticate, getCategoryStats);

router.get('/:id/stats/timeline', authenticate, getTimelineStats);

module.exports = router;
