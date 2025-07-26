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
    
    // Demo data for now - will be replaced with real Railway integration
    this.demoApps = this.createDemoApps();
    this.systemStats = {
      totalApps: this.demoApps.length,
      healthyApps: this.demoApps.filter(app => app.status === 'SUCCESS').length,
      errorApps: this.demoApps.filter(app => app.errors.length > 0).length,
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
    // Configure helmet with relaxed CSP for development
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*"]
        }
      }
    }));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(`Railway Auto-Healer Demo started on port ${this.port}`);
      logger.info(`Dashboard available at http://localhost:${this.port}`);
      logger.info('Demo mode active - showing simulated Railway apps from your GitHub repos');
    });
  }
}

// Start the demo application
const autoHealer = new RailwayAutoHealerDemo();
autoHealer.start();

module.exports = RailwayAutoHealerDemo;
