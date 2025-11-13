const crypto = require('crypto');

/**
 * Session Middleware to prevent cross-tab/browser media access
 * Generates a unique session identifier for each client
 */
const sessionMiddleware = (req, res, next) => {
  // Generate a unique session ID for this client
  if (req.headers['x-session-id']) {
    // Use provided session ID from frontend
    req.clientSessionId = req.headers['x-session-id'];
  } else {
    // Generate session ID from user agent + IP + timestamp
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    const timestamp = Date.now().toString();
    
    req.clientSessionId = crypto
      .createHash('md5')
      .update(userAgent + ip + timestamp)
      .digest('hex');
  }
  
  // Log session for debugging (optional)
  console.log(`Session ID: ${req.clientSessionId}, IP: ${req.ip}, User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  
  next();
};

module.exports = sessionMiddleware;