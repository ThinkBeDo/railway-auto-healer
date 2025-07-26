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
    
    // Configure Socket.io for production
    this.io = socketIo(this.server, {
      cors: {
        origin: ["http://localhost:3001", "https://railway-auto-healer-production.up.railway.app", "*"],
        methods: ["GET", "POST"],
        credentials: true
      },
      allowEIO3: true,
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

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
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
        status: 'SUCCESS',
        url: 'https://jdm-shift-connect.railway.app',
        lastDeployment: '2025-07-26T10:45:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
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
    // Production-ready CORS and CSP
    this.app.use(cors({
      origin: ["http://localhost:3001", "https://railway-auto-healer-production.up.railway.app"],
      credentials: true
    }));

    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "ws://localhost:*", "wss://railway-auto-healer-production.up.railway.app", "https://railway-auto-healer-production.up.railway.app"]
        }
      }
    }));

    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Enhanced logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin')
      });
      next();
    });
  }

  setupRoutes() {
    // Enhanced health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        mode: 'demo',
        environment: process.env.NODE_ENV || 'development',
        socketConnections: this.io.engine.clientsCount,
        apps: this.demoApps.length
      });
    });

    this.app.get('/api/apps', (req, res) => {
      logger.info('Apps endpoint requested', { appsCount: this.demoApps.length });
      res.json({
        apps: this.demoApps,
        stats: this.systemStats
      });
    });

    this.app.get('/api/apps/:id/status', (req, res) => {
      const { id } = req.params;
      const app = this.demoApps.find(a => a.id === id);
      
      if (!app) {
        logger.warn('App not found', { requestedId: id });
        return res.status(404).json({ error: 'App not found' });
      }

      logger.info('App status requested', { appId: id, appName: app.name });
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
          timestamp: new Date().toISOString(),
          severity: 'INFO',
          message: `Application ${app.name} running successfully on Railway`
        },
        {
          timestamp: new Date(Date.now() - 30000).toISOString(),
          severity: 'INFO',
          message: 'Auto-Healer monitoring active'
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          severity: 'INFO',
          message: 'Connected to Railway Auto-Healer system'
        }
      ];

      if (app.errors && app.errors.length > 0) {
        logs.unshift(...app.errors.map(error => ({
          timestamp: error.timestamp,
          severity: error.severity,
          message: error.message
        })));
      }

      res.json({ logs });
    });

    this.app.post('/api/apps/:id/heal', async (req, res) => {
      const { id } = req.params;
      const app = this.demoApps.find(a => a.id === id);
      
      if (!app) {
        return res.status(404).json({ error: 'App not found' });
      }

      const healingId = `healing-${id}-${Date.now()}`;
      logger.info('Manual healing triggered', { healingId, appId: id, appName: app.name });

      // Simulate healing process
      setTimeout(() => {
        if (app.errors && app.errors.length > 0) {
          logger.info('Clearing errors for app', { appId: id, errorCount: app.errors.length });
          app.errors = [];
          app.status = 'SUCCESS';
          logger.info('Healing completed successfully', { healingId, appId: id });
          this.broadcastUpdates();
        }
      }, 3000);

      res.json({
        healingId,
        message: 'Healing process started for ' + app.name,
        status: 'in_progress',
        estimatedTime: '3 seconds'
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
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Add debugging endpoint
    this.app.get('/api/debug', (req, res) => {
      res.json({
        environment: process.env.NODE_ENV || 'development',
        port: this.port,
        socketConnections: this.io.engine.clientsCount,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        apps: this.demoApps.map(app => ({
          id: app.id,
          name: app.name,
          status: app.status,
          errorCount: app.errors ? app.errors.length : 0
        }))
      });
    });

    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected to dashboard', { 
        socketId: socket.id,
        clientsCount: this.io.engine.clientsCount,
        userAgent: socket.handshake.headers['user-agent']
      });

      // Send initial data immediately
      socket.emit('system_stats', this.systemStats);
      socket.emit('monitored_apps', this.demoApps);

      socket.on('disconnect', (reason) => {
        logger.info('Client disconnected', { 
          socketId: socket.id, 
          reason,
          clientsCount: this.io.engine.clientsCount 
        });
      });

      socket.on('request_app_status', (appId) => {
        const app = this.demoApps.find(a => a.id === appId);
        if (app) {
          app.lastCheck = new Date().toISOString();
          logger.info('App status requested via socket', { appId, appName: app.name });
          socket.emit('app_status_update', { appId, status: app });
        }
      });

      // Send heartbeat
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    // Real-time updates every 30 seconds
    setInterval(() => {
      this.simulateRealTimeUpdates();
    }, 30000);

    // Heartbeat every 10 seconds
    setInterval(() => {
      this.io.emit('heartbeat', { timestamp: new Date().toISOString() });
    }, 10000);
  }

  simulateRealTimeUpdates() {
    let hasChanges = false;

    this.demoApps.forEach(app => {
      app.lastCheck = new Date().toISOString();
      
      // Randomly introduce errors
      if (Math.random() < 0.1 && (!app.errors || app.errors.length === 0)) {
        app.errors = [{
          message: 'Simulated production error detected',
          timestamp: new Date().toISOString(),
          severity: 'WARNING',
          category: 'runtime',
          autoFixable: true
        }];
        app.status = 'FAILED';
        hasChanges = true;
        logger.info('Simulated error added to app', { appId: app.id, appName: app.name });
      } 
      // Randomly fix errors
      else if (Math.random() < 0.2 && app.errors && app.errors.length > 0) {
        app.errors = [];
        app.status = 'SUCCESS';
        hasChanges = true;
        logger.info('Simulated error fixed for app', { appId: app.id, appName: app.name });
      }
    });

    if (hasChanges) {
      this.updateSystemStats();
      this.broadcastUpdates();
      logger.info('Broadcasting updates to clients', { clientsCount: this.io.engine.clientsCount });
    }
  }

  updateSystemStats() {
    this.systemStats.totalApps = this.demoApps.length;
    this.systemStats.healthyApps = this.demoApps.filter(app => app.status === 'SUCCESS').length;
    this.systemStats.errorApps = this.demoApps.filter(app => app.errors && app.errors.length > 0).length;
  }

  broadcastUpdates() {
    this.io.emit('system_stats', this.systemStats);
    this.io.emit('monitored_apps', this.demoApps);
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      logger.info(`🚀 Railway Auto-Healer started successfully`, {
        port: this.port,
        environment: process.env.NODE_ENV || 'development',
        appsCount: this.demoApps.length,
        timestamp: new Date().toISOString()
      });
      logger.info(`📊 Dashboard available at http://localhost:${this.port}`);
      logger.info(`🔧 Demo mode active - monitoring ${this.demoApps.length} simulated Railway apps`);
    });
  }
}

const autoHealer = new RailwayAutoHealerDemo();
autoHealer.start();

module.exports = RailwayAutoHealerDemo;
