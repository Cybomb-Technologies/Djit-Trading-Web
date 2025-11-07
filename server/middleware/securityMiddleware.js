const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting for media requests
const mediaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many media requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://www.youtube.com", "https://s.ytimg.com"],
      frameSrc: ["'self'", "https://www.youtube.com"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Anti-hotlinking middleware
const preventHotlinking = (req, res, next) => {
  const referer = req.get('Referer');
  const host = req.get('Host');
  
  if (req.path.includes('/secure-media/') && referer) {
    const refererHost = new URL(referer).host;
    if (refererHost !== host && !refererHost.includes('localhost')) {
      return res.status(403).json({
        success: false,
        message: 'Hotlinking not allowed'
      });
    }
  }
  next();
};

module.exports = {
  mediaLimiter,
  securityHeaders,
  preventHotlinking
};