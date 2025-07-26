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
        methods: ["GET", "POST"]
      }
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
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*", "ws://*", "wss://*"]
        }
      }
    }));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        mode: 'demo'
      });
    });

    this.app.get('/api/apps', (req, res) => {
      res.json({
        apps: this.demoApps,
        stats: this.systemStats
      });
    });

    this.app.get('/api/apps/:id/status', (req, res) => {
      const { id } = req.params;
      const app = this.demoApps.find(a => a.id === id);
      
      if (!app) {
        return res.status(404).json({ error: 'App not found' });
      }

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
          timestamp: '2025-07-26T16:45:00Z',
          severity: 'INFO',
          message: 'Application started successfully'
        },
        {
          timestamp: '2025-07-26T16:44:30Z',
          severity: 'INFO',
          message: 'Connected to database'
        },
        {
          timestamp: '2025-07-26T16:44:15Z',
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
        status: 'in_progress'
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
        activeHealing: 0
      });
    });

    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected to dashboard', { socketId: socket.id });

      socket.emit('system_stats', this.systemStats);
      socket.emit('monitored_apps', this.demoApps);

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });

      socket.on('request_app_status', (appId) => {
        const app = this.demoApps.find(a => a.id === appId);
        if (app) {
          app.lastCheck = new Date().toISOString();
          socket.emit('app_status_update', { appId, status: app });
        }
      });
    });

    setInterval(() => {
      this.simulateRealTimeUpdates();
    }, 30000);
  }

  simulateRealTimeUpdates() {
    this.demoApps.forEach(app => {
      app.lastCheck = new Date().toISOString();
      
      if (Math.random() < 0.1 && (!app.errors || app.errors.length === 0)) {
        app.errors = [{
          message: 'Simulated error for demo',
          timestamp: new Date().toISOString(),
          severity: 'WARNING',
          category: 'runtime',
          autoFixable: true
        }];
        app.status = 'FAILED';
      } else if (Math.random() < 0.2 && app.errors && app.errors.length > 0) {
        app.errors = [];
        app.status = 'SUCCESS';
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
    this.io.emit('system_stats', this.systemStats);
    this.io.emit('monitored_apps', this.demoApps);
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(`Railway Auto-Healer Demo started on port ${this.port}`);
      logger.info(`Dashboard available at http://localhost:${this.port}`);
      logger.info('Demo mode active - showing simulated Railway apps from your GitHub repos');
    });
  }
}

const autoHealer = new RailwayAutoHealerDemo();
autoHealer.start();

module.exports = RailwayAutoHealerDemo;
