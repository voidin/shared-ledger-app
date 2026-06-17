class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

function errorResponse(res, message, statusCode, code) {
  return res.status(statusCode).json({
    code: statusCode,
    message: message
  });
}

function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.isOperational) {
    return errorResponse(res, err.message, err.statusCode, err.code);
  }

  if (err.name === 'ValidationError') {
    return errorResponse(res, '数据验证失败', 400, 'VALIDATION_ERROR');
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, '无效的令牌', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, '令牌已过期', 401, 'TOKEN_EXPIRED');
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, '数据已存在', 409, 'DUPLICATE_ENTRY');
  }

  return errorResponse(res, '服务器内部错误', 500, 'INTERNAL_ERROR');
}

function notFoundHandler(req, res) {
  return errorResponse(res, '资源不存在', 404, 'NOT_FOUND');
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
