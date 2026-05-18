const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/user.js');
const { authenticate } = require('../middleware/auth.js');

router.get('/profile', authenticate, getProfile);

router.put('/profile', authenticate, updateProfile);

module.exports = router;
