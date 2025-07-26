const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const logger = require('./lib/logger');

class RailwayAutoHealerDemo {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
      },
      transports: ['websocket', 'polling']
    });

    this.port = process.env.PORT || 3001;
    
    this.demoApps = this.createDemoApps();
    this.systemStats = {
      totalApps: this.demoApps.length,
      healthyApps: this.demoApps.filter(app => app.status === 'SUCCESS').length,
      errorApps: this.demoApps.filter(app => app.errors && app.errors.length > 0).length,
      healingInProgress: 0,
      totalHealsToday: 3,
      successfulHeals: 2,
      failedHeals: 1
    };

    this.diagnostics = {
      serverStartTime: new Date().toISOString(),
      totalRequests: 0,
      apiRequests: 0,
      websocketConnections: 0,
      errors: [],
      lastHealthCheck: new Date().toISOString()
    };

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupMonitoring();
  }

  createDemoApps() {
    return [
      {
        id: 'thayoda-embed-service',
        name: 'Thayoda Embed',
        projectName: 'ThinkBeDo Platform',
        status: 'SUCCESS',
        url: 'https://thayoda-embed.railway.app',
        lastDeployment: '2025-07-26T14:30:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
      },
      {
        id: 'platinum-payroll-service',
        name: 'Platinum Payroll Processor',
        projectName: 'Platinum Suite',
        status: 'SUCCESS',
        url: 'https://platinum-payroll.railway.app',
        lastDeployment: '2025-07-26T12:15:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
      },
      {
        id: 'jdm-shift-connect-service',
        name: 'JDM Shift Connect',
        projectName: 'JDM Platform',
        status: 'FAILED',
        url: null,
        lastDeployment: '2025-07-26T10:45:00Z',
        lastCheck: new Date().toISOString(),
        errors: [
          {
            message: 'Environment variable DATABASE_URL is not set',
            timestamp: '2025-07-26T16:20:00Z',
            severity: 'ERROR',
            category: 'configuration',
            autoFixable: true
          }
        ]
      },
      {
        id: 'notifyre-batch-printing-service',
        name: 'Notifyre Batch Printing',
        projectName: 'Notifyre Suite',
        status: 'BUILDING',
        url: 'https://notifyre-batch.railway.app',
        lastDeployment: '2025-07-26T16:40:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
      },
      {
        id: 'scoutly-matchmaker-service',
        name: 'Scoutly MatchMaker',
        projectName: 'Scoutly Platform',
        status: 'SUCCESS',
        url: 'https://scoutly-matchmaker.railway.app',
        lastDeployment: '2025-07-26T09:30:00Z',
        lastCheck: new Date().toISOString(),
        errors: [
          {
            message: 'High memory usage detected: 85% of allocated memory',
            timestamp: '2025-07-26T16:35:00Z',
            severity: 'WARNING',
            category: 'performance',
            autoFixable: false
          }
        ]
      }
    ];
  }

  setupMiddleware() {
    // Request counter
    this.app.use((req, res, next) => {
      this.diagnostics.totalRequests++;
      if (req.path.startsWith('/api/')) {
        this.diagnostics.apiRequests++;
      }
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        totalRequests: this.diagnostics.totalRequests
      });
      next();
    });

    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*", "ws://*", "wss://*", "https://*"]
        }
      }
    }));
    
    this.app.use(cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: false
    }));
    
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      this.diagnostics.errors.push({
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      logger.error('Express error:', {
        error: error.message,
        url: req.url,
        method: req.method
      });
      
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
  }

  setupRoutes() {
    // Enhanced health check with diagnostics
    this.app.get('/api/health', (req, res) => {
      this.diagnostics.lastHealthCheck = new Date().toISOString();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        mode: 'demo',
        diagnostics: {
          serverStartTime: this.diagnostics.serverStartTime,
          totalRequests: this.diagnostics.totalRequests,
          apiRequests: this.diagnostics.apiRequests,
          websocketConnections: this.diagnostics.websocketConnections,
          errorCount: this.diagnostics.errors.length,
          memoryUsage: process.memoryUsage(),
          environment: {
            nodeEnv: process.env.NODE_ENV,
            port: this.port,
            hasRailwayToken: !!process.env.RAILWAY_API_TOKEN
          }
        }
      });
    });

    // Apps endpoint with detailed logging
    this.app.get('/api/apps', (req, res) => {
      try {
        logger.info('Apps endpoint called', {
          appsCount: this.demoApps.length,
          timestamp: new Date().toISOString()
        });

        const response = {
          apps: this.demoApps,
          stats: this.systemStats,
          meta: {
            timestamp: new Date().toISOString(),
            count: this.demoApps.length
          }
        };

        res.json(response);
        
        logger.info('Apps endpoint response sent successfully', {
          appsCount: this.demoApps.length,
          statsTotal: this.systemStats.totalApps
        });
      } catch (error) {
        logger.error('Error in apps endpoint:', error);
        res.status(500).json({ 
          error: 'Failed to get apps', 
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.app.get('/api/apps/:id/status', (req, res) => {
      const { id } = req.params;
      const app = this.demoApps.find(a => a.id === id);
      
      if (!app) {
        logger.warn('App not found:', { appId: id });
        return res.status(404).json({ error: 'App not found' });
      }

      logger.info('App status requested:', { appId: id, status: app.status });
      res.json(app);
    });

    this.app.get('/api/apps/:id/logs', (req, res) => {
      const { id } = req.params;
      const app = this.demoApps.find(a => a.id === id);
      
      if (!app) {
        return res.status(404).json({ error: 'App not found' });
      }

      const logs = [
        {
          timestamp: '2025-07-26T18:30:00Z',
          severity: 'INFO',
          message: 'Application started successfully'
        },
        {
          timestamp: '2025-07-26T18:29:30Z',
          severity: 'INFO',
          message: 'Connected to database'
        },
        {
          timestamp: '2025-07-26T18:29:15Z',
          severity: 'INFO',
          message: 'Loading configuration...'
        }
      ];

      if (app.errors && app.errors.length > 0) {
        logs.unshift(...app.errors.map(error => ({
          timestamp: error.timestamp,
          severity: error.severity,
          message: error.message
        })));
      }

      logger.info('Logs requested:', { appId: id, logCount: logs.length });
      res.json({ logs });
    });

    this.app.post('/api/apps/:id/heal', async (req, res) => {
      const { id } = req.params;
      const app = this.demoApps.find(a => a.id === id);
      
      if (!app) {
        return res.status(404).json({ error: 'App not found' });
      }

      const healingId = `healing-${id}-${Date.now()}`;
      logger.info('Manual healing triggered', { healingId, appId: id });

      // Simulate healing process
      setTimeout(() => {
        if (app.errors && app.errors.length > 0) {
          app.errors = [];
          app.status = 'SUCCESS';
          logger.info('Healing completed successfully', { healingId });
          this.broadcastUpdates();
        }
      }, 3000);

      res.json({
        healingId,
        message: 'Healing process started',
        status: 'in_progress',
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/api/stats', (req, res) => {
      res.json({
        system: this.systemStats,
        safety: {
          fixesLastHour: 2,
          fixesLast24Hours: 8,
          rollbacksLast24Hours: 1,
          pendingApprovals: 0,
          rateLimit: {
            maxPerHour: 5,
            currentUsage: 40
          }
        },
        activeHealing: 0,
        diagnostics: this.diagnostics
      });
    });

    // Diagnostic endpoint
    this.app.get('/api/diagnostics', (req, res) => {
      res.json({
        ...this.diagnostics,
        recentErrors: this.diagnostics.errors.slice(-10), // Last 10 errors
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        }
      });
    });

    this.app.get('/', (req, res) => {
      logger.info('Dashboard page requested');
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });

    // Catch-all route for debugging
    this.app.use('*', (req, res) => {
      logger.warn('Route not found:', { 
        method: req.method, 
        path: req.path,
        originalUrl: req.originalUrl 
      });
      
      res.status(404).json({ 
        error: 'Route not found',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      this.diagnostics.websocketConnections++;
      
      logger.info('Client connected to dashboard', { 
        socketId: socket.id,
        totalConnections: this.diagnostics.websocketConnections
      });

      // Send initial data immediately
      try {
        socket.emit('system_stats', this.systemStats);
        socket.emit('monitored_apps', this.demoApps);
        
        logger.info('Initial data sent to client', { 
          socketId: socket.id,
          appsCount: this.demoApps.length 
        });
      } catch (error) {
        logger.error('Error sending initial data:', error);
      }

      socket.on('disconnect', () => {
        this.diagnostics.websocketConnections--;
        logger.info('Client disconnected', { 
          socketId: socket.id,
          remainingConnections: this.diagnostics.websocketConnections
        });
      });

      socket.on('request_app_status', (appId) => {
        logger.info('App status requested via WebSocket:', { appId });
        
        const app = this.demoApps.find(a => a.id === appId);
        if (app) {
          app.lastCheck = new Date().toISOString();
          socket.emit('app_status_update', { appId, status: app });
          logger.info('App status update sent:', { appId, status: app.status });
        } else {
          logger.warn('App not found for status request:', { appId });
        }
      });

      socket.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.diagnostics.errors.push({
          type: 'websocket',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      });
    });

    // Real-time updates every 30 seconds
    setInterval(() => {
      this.simulateRealTimeUpdates();
    }, 30000);
  }

  setupMonitoring() {
    // Health monitoring every 60 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 60000);

    // Memory monitoring
    setInterval(() => {
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
        logger.warn('High memory usage detected:', memUsage);
      }
    }, 30000);
  }

  performHealthCheck() {
    const healthData = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeConnections: this.diagnostics.websocketConnections,
      totalRequests: this.diagnostics.totalRequests,
      errorCount: this.diagnostics.errors.length
    };

    logger.info('Health check performed:', healthData);

    // Check for issues and log alerts
    if (this.diagnostics.websocketConnections === 0 && this.diagnostics.totalRequests > 10) {
      logger.error('ALERT: No WebSocket connections but receiving requests - possible connection issue');
    }

    if (this.diagnostics.errors.length > 10) {
      logger.error('ALERT: High error count detected:', { errorCount: this.diagnostics.errors.length });
    }
  }

  simulateRealTimeUpdates() {
    this.demoApps.forEach(app => {
      app.lastCheck = new Date().toISOString();
      
      // Randomly simulate errors/fixes
      if (Math.random() < 0.1 && (!app.errors || app.errors.length === 0)) {
        app.errors = [{
          message: 'Simulated error for demo - auto-healing will resolve this',
          timestamp: new Date().toISOString(),
          severity: 'WARNING',
          category: 'runtime',
          autoFixable: true
        }];
        app.status = 'FAILED';
        logger.info('Simulated error added to app:', { appId: app.id });
      } else if (Math.random() < 0.2 && app.errors && app.errors.length > 0) {
        app.errors = [];
        app.status = 'SUCCESS';
        logger.info('Simulated error resolved for app:', { appId: app.id });
      }
    });

    this.updateSystemStats();
    this.broadcastUpdates();
  }

  updateSystemStats() {
    this.systemStats.totalApps = this.demoApps.length;
    this.systemStats.healthyApps = this.demoApps.filter(app => app.status === 'SUCCESS').length;
    this.systemStats.errorApps = this.demoApps.filter(app => app.errors && app.errors.length > 0).length;
  }

  broadcastUpdates() {
    try {
      this.io.emit('system_stats', this.systemStats);
      this.io.emit('monitored_apps', this.demoApps);
      
      logger.info('Broadcast updates sent', {
        connectedClients: this.diagnostics.websocketConnections,
        statsUpdate: this.systemStats
      });
    } catch (error) {
      logger.error('Error broadcasting updates:', error);
    }
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(`🚀 Railway Auto-Healer started successfully`, {
        port: this.port,
        mode: 'demo',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
      
      logger.info(`📊 Dashboard available at http://localhost:${this.port}`);
      logger.info(`🔍 Health check: http://localhost:${this.port}/api/health`);
      logger.info(`📈 Diagnostics: http://localhost:${this.port}/api/diagnostics`);
      logger.info('✅ Demo mode active - monitoring simulated Railway apps');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, starting graceful shutdown');
      this.server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });
    });
  }
}

const autoHealer = new RailwayAutoHealerDemo();
autoHealer.start();

module.exports = RailwayAutoHealerDemo;
