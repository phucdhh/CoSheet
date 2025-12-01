/**
 * CoSheet Health Check & Metrics Endpoint v1.0
 */

const os = require('os');
const v8 = require('v8');

class HealthCheck {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Basic health check
   */
  getHealth() {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      version: require('../package.json').version,
      node: process.version,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      },
    };
  }

  /**
   * Detailed metrics for monitoring
   */
  getMetrics() {
    const heapStats = v8.getHeapStatistics();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: {
        process: process.uptime(),
        system: os.uptime(),
      },
      memory: {
        processRSS: process.memoryUsage().rss,
        processHeapUsed: process.memoryUsage().heapUsed,
        processHeapTotal: process.memoryUsage().heapTotal,
        systemTotal: os.totalmem(),
        systemFree: os.freemem(),
        heapSizeLimit: heapStats.heap_size_limit,
      },
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'unknown',
        loadAverage: {
          '1m': loadAvg[0],
          '5m': loadAvg[1],
          '15m': loadAvg[2],
        },
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 
          ? `${((this.errorCount / this.requestCount) * 100).toFixed(2)}%`
          : '0%',
      },
      v8: {
        totalHeapSize: heapStats.total_heap_size,
        usedHeapSize: heapStats.used_heap_size,
        mallocedMemory: heapStats.malloced_memory,
      },
    };
  }

  /**
   * Readiness check (for k8s/docker)
   */
  async getReadiness() {
    try {
      // Check if Redis is available
      // For now, just return true
      // TODO: Add actual Redis ping check
      
      return {
        ready: true,
        checks: {
          redis: 'ok', // TODO: implement actual check
          disk: 'ok',
          memory: process.memoryUsage().heapUsed < (process.memoryUsage().heapTotal * 0.9) ? 'ok' : 'warn',
        }
      };
    } catch (error) {
      return {
        ready: false,
        error: error.message,
      };
    }
  }

  /**
   * Liveness check (for k8s/docker)
   */
  getLiveness() {
    const uptime = process.uptime();
    return {
      alive: uptime > 0,
      uptime: `${Math.floor(uptime)}s`,
    };
  }

  /**
   * Middleware to count requests
   */
  requestCounter() {
    return (req, res, next) => {
      this.requestCount++;
      
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 500) {
          healthCheck.errorCount++;
        }
        originalSend.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Setup health check routes
   */
  setupRoutes(app) {
    // Basic health check
    app.get('/health', (req, res) => {
      res.json(this.getHealth());
    });

    // Detailed metrics
    app.get('/metrics', (req, res) => {
      res.json(this.getMetrics());
    });

    // Kubernetes readiness
    app.get('/health/ready', async (req, res) => {
      const readiness = await this.getReadiness();
      const statusCode = readiness.ready ? 200 : 503;
      res.status(statusCode).json(readiness);
    });

    // Kubernetes liveness
    app.get('/health/alive', (req, res) => {
      const liveness = this.getLiveness();
      res.json(liveness);
    });
  }
}

// Singleton instance
const healthCheck = new HealthCheck();

module.exports = healthCheck;
