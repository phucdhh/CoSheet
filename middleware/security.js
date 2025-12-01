/**
 * CoSheet Security Middleware v1.0
 * Rate limiting, CSRF protection, Security headers
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

/**
 * Rate limiter for general API requests
 * Limit: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Rate limiter for sheet creation/modification
 * Stricter limits to prevent spam
 */
const sheetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 sheet operations per hour
  message: 'Too many sheet operations, please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});

/**
 * Rate limiter for file uploads
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
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
