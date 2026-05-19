const express = require('express');
const router = express.Router();
const { 
  getSummaryStats, 
  getMemberStats, 
  getCategoryStats,
  getTimelineStats 
} = require('../controllers/statistics.js');
const { authenticate } = require('../middleware/auth.js');

function extractLedgerId(req, res, next) {
  const urlParts = req.originalUrl.split('/');
  const ledgersIndex = urlParts.findIndex(p => p === 'ledgers');
  if (ledgersIndex !== -1 && urlParts[ledgersIndex + 1]) {
    req.params.ledgerId = urlParts[ledgersIndex + 1];
  }
  next();
}

router.get('/summary', authenticate, extractLedgerId, getSummaryStats);

router.get('/by-member', authenticate, extractLedgerId, getMemberStats);

router.get('/by-category', authenticate, extractLedgerId, getCategoryStats);

router.get('/timeline', authenticate, extractLedgerId, getTimelineStats);

module.exports = router;
