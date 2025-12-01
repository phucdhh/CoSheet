/**
 * CoSheet Security Integration Wrapper
 * Injects security middleware into Zappajs app
 */

const security = require('./middleware/security');
const logger = require('./middleware/logger');
const healthCheck = require('./middleware/health');

/**
 * Wrap Zappajs app with security middleware
 */
function wrapZappaApp(zappaApp) {
  // Trust proxy (Cloudflare/nginx)
  security.trustProxy(zappaApp);
  
  // Cookie parser (required for CSRF)
  zappaApp.use(security.cookieParser());
  
  // Security headers (Helmet)
  security.configureHelmet(zappaApp);
  
  // Request logging
  zappaApp.use(logger.httpLogger);
  
  // Request counter for metrics
  zappaApp.use(healthCheck.requestCounter());
  
  // CSRF token generation
  zappaApp.use(security.generateCsrfToken);
  
  // Apply rate limiting to all routes
  zappaApp.use(security.apiLimiter);
  
  // Specific rate limits for sheet operations
  zappaApp.use('/_new', security.sheetLimiter);
  zappaApp.use('/_save', security.sheetLimiter);
  zappaApp.use('/_upload', security.uploadLimiter);
  
  // CSRF protection for state-changing operations
  // Skip for GET/HEAD/OPTIONS and WebSocket upgrades
  zappaApp.use((req, res, next) => {
    // Skip CSRF for static files
    if (req.path.startsWith('/static/') || req.path.startsWith('/images/')) {
      return next();
    }
    
    // Skip CSRF for health checks
    if (req.path.startsWith('/health') || req.path === '/metrics') {
      return next();
    }
    
    security.csrfProtection(req, res, next);
  });
  
  // Setup health check routes
  healthCheck.setupRoutes(zappaApp);
  
  // Error logging middleware (must be last)
  zappaApp.use(logger.errorLogger);
  
  logger.info('Security middleware initialized', {
    features: [
      'Rate Limiting',
      'CSRF Protection',
      'Security Headers (Helmet)',
      'Request Logging',
      'Health Checks',
      'Metrics Endpoint'
    ]
  });
}

module.exports = wrapZappaApp;
