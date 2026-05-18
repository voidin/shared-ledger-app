const { verifyToken } = require('../config/jwt.js');
const { error } = require('../utils/response.js');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, '未提供认证令牌', 401);
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return error(res, '无效或过期的令牌', 401);
  }

  req.user = decoded;
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
}

function getCurrentUser(req) {
  return req.user || null;
}

module.exports = {
  authenticate,
  optionalAuth,
  getCurrentUser,
  default: {
    authenticate,
    optionalAuth,
    getCurrentUser
  }
};
