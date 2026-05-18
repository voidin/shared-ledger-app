import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = process.env.LOG_LEVEL || 'info';

function shouldLog(level) {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function formatLog(level, message, meta = {}) {
  const timestamp = format(toZonedTime(new Date(), 'Asia/Shanghai'), 'yyyy-MM-dd HH:mm:ss');
  const logObject = {
    timestamp,
    level,
    message,
    ...meta
  };
  return JSON.stringify(logObject);
}

export function logger(level, message, meta = {}) {
  if (shouldLog(level)) {
    const formattedLog = formatLog(level, message, meta);
    
    if (level === 'error') {
      console.error(formattedLog);
    } else if (level === 'warn') {
      console.warn(formattedLog);
    } else {
      console.log(formattedLog);
    }
  }
}

export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logData = {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip: ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    if (statusCode >= 500) {
      logger('error', 'Server error', logData);
    } else if (statusCode >= 400) {
      logger('warn', 'Client error', logData);
    } else {
      logger('info', 'Request completed', logData);
    }
  });

  next();
}

export function errorLogger(error, req, res, next) {
  logger('error', error.message, {
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress
  });
  next(error);
}

export default {
  logger,
  requestLogger,
  errorLogger
};
