const express = require('express');
const router = express.Router();
const { login, sendCode, register, wechatLogin } = require('../controllers/auth.js');

router.post('/login', login);

router.post('/send-code', sendCode);

router.post('/register', register);

router.post('/wechat-login', wechatLogin);

module.exports = router;
