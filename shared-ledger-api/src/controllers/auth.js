const UserModel = require('../models/user.js');
const { generateToken } = require('../config/jwt.js');
const { success, error } = require('../utils/response.js');

const verificationCodes = new Map();

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function login(req, res) {
  try {
    const { phone, code, openid, nickname, avatar } = req.body;

    if (!phone) {
      return error(res, '请提供手机号', 400);
    }

    if (!code) {
      return error(res, '请提供验证码', 400);
    }

    const storedCode = verificationCodes.get(phone);
    const isDevMode = process.env.NODE_ENV !== 'production';
    const codeValid = isDevMode ? (code === '123456' || storedCode?.code === code) : (storedCode?.code === code);
    if (!codeValid) {
      return error(res, '验证码错误或已过期', 400);
    }

    if (storedCode && Date.now() > storedCode.expiresAt) {
      verificationCodes.delete(phone);
      return error(res, '验证码已过期', 400);
    }

    verificationCodes.delete(phone);

    let user = await UserModel.findByPhone(phone);

    if (!user && openid) {
      user = await UserModel.create({
        phone,
        openid,
        nickname: nickname || null,
        avatar: avatar || null
      });
    } else if (!user) {
      user = await UserModel.create({
        phone,
        nickname: nickname || null,
        avatar: avatar || null
      });
    }

    if (user.status !== 1) {
      return error(res, '账号已被禁用', 403);
    }

    const token = generateToken({
      userId: user.id,
      phone: user.phone
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        created_at: user.created_at
      }
    }, '登录成功');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, '登录失败，请稍后重试', 500);
  }
}

async function sendCode(req, res) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return error(res, '请提供手机号', 400);
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return error(res, '手机号格式不正确', 400);
    }

    const code = generateVerificationCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    verificationCodes.set(phone, { code, expiresAt });

    console.log(`[模拟短信] 向 ${phone} 发送验证码: ${code}`);

    return success(res, {
      message: '验证码已发送',
      expiresIn: 300
    }, '发送成功');
  } catch (err) {
    console.error('Send code error:', err);
    return error(res, '发送验证码失败，请稍后重试', 500);
  }
}

async function register(req, res) {
  try {
    const { phone, code, nickname, avatar } = req.body;

    if (!phone) {
      return error(res, '请提供手机号', 400);
    }

    if (!code) {
      return error(res, '请提供验证码', 400);
    }

    const storedCode = verificationCodes.get(phone);
    const isDevMode = process.env.NODE_ENV !== 'production';
    const codeValid = isDevMode ? (code === '123456' || storedCode?.code === code) : (storedCode?.code === code);
    if (!codeValid) {
      return error(res, '验证码错误或已过期', 400);
    }

    if (Date.now() > storedCode.expiresAt) {
      verificationCodes.delete(phone);
      return error(res, '验证码已过期', 400);
    }

    verificationCodes.delete(phone);

    const existingUser = await UserModel.findByPhone(phone);
    if (existingUser) {
      return error(res, '该手机号已注册', 400);
    }

    const user = await UserModel.create({
      phone,
      nickname: nickname || null,
      avatar: avatar || null
    });

    const token = generateToken({
      userId: user.id,
      phone: user.phone
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        created_at: user.created_at
      }
    }, '注册成功');
  } catch (err) {
    console.error('Register error:', err);
    return error(res, '注册失败，请稍后重试', 500);
  }
}

async function wechatLogin(req, res) {
  try {
    const { code, nickname, avatar } = req.body;

    if (!code) {
      return error(res, '请提供微信授权码', 400);
    }

    const openid = code;

    let user = await UserModel.findByOpenid(openid);

    if (!user) {
      user = await UserModel.create({
        openid,
        nickname: nickname || null,
        avatar: avatar || null
      });
    }

    if (user.status !== 1) {
      return error(res, '账号已被禁用', 403);
    }

    const token = generateToken({
      userId: user.id,
      openid: user.openid
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        created_at: user.created_at
      }
    }, '登录成功');
  } catch (err) {
    console.error('WeChat login error:', err);
    return error(res, '微信登录失败，请稍后重试', 500);
  }
}

module.exports = {
  login,
  sendCode,
  register,
  wechatLogin
};
