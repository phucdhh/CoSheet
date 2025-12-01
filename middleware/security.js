/**
 * CoSheet Security Middleware v1.0
 * Rate limiting, CSRF protection, Security headers
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

/**
 * Rate limiter for general API requests
 * Limit: 60 requests per minute per IP (1 req/s average)
 * Allows bursts while protecting against abuse
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for localhost in development
    const testIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return testIPs.includes(req.ip) && process.env.NODE_ENV === 'development';
  }
});

/**
 * Rate limiter for sheet creation/modification
 * Limit: 30 requests per minute per IP (0.5 req/s)
 * Stricter than general API but still usable
 */
const sheetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 sheet operations per minute
  message: 'Too many sheet operations, please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  skip: (req) => {
    const testIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return testIPs.includes(req.ip) && process.env.NODE_ENV === 'development';
  }
});

/**
 * Rate limiter for file uploads
 * Limit: 10 uploads per 5 minutes per IP
 * Stricter to prevent abuse of expensive operations
 */
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 uploads per 5 minutes
  message: 'Too many file uploads, please try again later.',
  skip: (req) => {
    const testIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return testIPs.includes(req.ip) && process.env.NODE_ENV === 'development';
  }
});

/**
 * Configure Helmet for security headers
 */
function configureHelmet(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", // Required for SocialCalc
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net"
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'same-origin' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  }));
}

/**
 * Simple CSRF protection for POST/PUT/DELETE requests
 * Uses double-submit cookie pattern
 */
function csrfProtection(req, res, next) {
  // Skip CSRF for websocket upgrade and GET/HEAD/OPTIONS
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  if (req.headers.upgrade === 'websocket') {
    return next();
  }

  // Check if CSRF token matches
  const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
  const cookieToken = req.cookies['XSRF-TOKEN'];

  if (!token || !cookieToken || token !== cookieToken) {
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      message: 'CSRF validation failed. Please refresh the page.'
    });
  }

  next();
}

/**
 * Generate and set CSRF token
 */
function generateCsrfToken(req, res, next) {
  if (!req.cookies['XSRF-TOKEN']) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Accessible to JS for AJAX requests
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
  next();
}

/**
 * Trust proxy (for Cloudflare/nginx)
 */
function trustProxy(app) {
  app.set('trust proxy', 1); // Trust first proxy
}

module.exports = {
  apiLimiter,
  sheetLimiter,
  uploadLimiter,
  configureHelmet,
  csrfProtection,
  generateCsrfToken,
  trustProxy,
  cookieParser
};
