const express = require('express');
const router = express.Router();
const { lockLedger, updateLockSettings, getLockStatus } = require('../controllers/lock.js');
const { authenticate } = require('../middleware/auth.js');

router.put('/:id/lock', authenticate, lockLedger);

router.put('/:id/lock-settings', authenticate, updateLockSettings);

router.get('/:id/lock-status', authenticate, getLockStatus);

module.exports = router;
