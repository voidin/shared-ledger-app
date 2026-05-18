const CORS_OPTIONS = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:8080'];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

export function cors(req, res, next) {
  const origin = req.headers.origin;
  
  if (CORS_OPTIONS.origin) {
    CORS_OPTIONS.origin(origin, (err, allow) => {
      if (err) {
        return next(err);
      }
      
      if (allow) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      }
      
      res.setHeader('Access-Control-Allow-Credentials', CORS_OPTIONS.credentials);
      res.setHeader('Access-Control-Allow-Methods', CORS_OPTIONS.methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', CORS_OPTIONS.allowedHeaders.join(', '));
      res.setHeader('Access-Control-Expose-Headers', CORS_OPTIONS.exposedHeaders.join(', '));
      res.setHeader('Access-Control-Max-Age', CORS_OPTIONS.maxAge);
      
      if (req.method === 'OPTIONS') {
        return res.status(CORS_OPTIONS.optionsSuccessStatus).end();
      }
      
      next();
    });
  } else {
    next();
  }
}

export default cors;
