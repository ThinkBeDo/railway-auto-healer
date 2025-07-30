const express = require('express');
const http = require('http');
const path = require('path');
require('dotenv').config();

const logger = require('./lib/logger');

class RailwayAutoHealer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    
    // Railway-optimized port configuration
    this.port = process.env.PORT || 3000;
    
    // Demo data
    this.demoApps = this.createDemoApps();
    // Remove static systemStats - will be calculated dynamically
    this.systemStats = this.recalculateStats();

    this.setupMiddleware();
    this.setupRoutes();
  }

  createDemoApps() {
    return [
      {
        id: 'pdf-processor-app',
        name: 'PDF Processor App',
        projectName: 'Document Processing Suite',
        status: 'SUCCESS',
        url: 'https://pdf-processor-app-production.up.railway.app',
        lastDeployment: '2025-07-27T17:54:00Z',
        lastCheck: new Date().toISOString(),
        description: 'PDF Merger and DocuSign Packet Splitter - Automatically splits healthcare staffing packets',
        errors: []
      },
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
        id: 'notifyre-batch-printing-service',
        name: 'Notifyre Batch Printing',
        projectName: 'Notifyre Suite',
        status: 'SUCCESS',
        url: 'https://notifyre-batch.railway.app',
        lastDeployment: '2025-07-26T16:40:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
      },
      {
        id: 'caregiver-certification-app',
        name: 'Caregiver Certification App',
        projectName: 'Healthcare Platform',
        status: 'SUCCESS',
        url: 'https://caregiver-certification.railway.app',
        lastDeployment: '2025-07-26T15:20:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
      },
      {
        id: 'n8n-railway-deployment',
        name: 'N8N Workflow Automation',
        projectName: 'Automation Suite',
        status: 'SUCCESS',
        url: 'https://n8n-library-production.up.railway.app',
        lastDeployment: '2025-07-26T13:45:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
      },
      {
        id: 'ais-powerpoint-bot',
        name: 'AIS PowerPoint Bot',
        projectName: 'AI Assistant Suite',
        status: 'SUCCESS',
        url: 'https://ais-powerpoint-bot.railway.app',
        lastDeployment: '2025-07-26T11:30:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
      },
      {
        id: 'benedict-monthly-invoice-agent',
        name: 'Benedict Monthly Invoice Agent',
        projectName: 'Financial Automation',
        status: 'SUCCESS',
        url: 'https://benedict-invoice-agent.railway.app',
        lastDeployment: '2025-07-26T10:15:00Z',
        lastCheck: new Date().toISOString(),
        errors: []
      },
      {
        id: 'platinum-shift-confirmation-app',
        name: 'Platinum Shift Confirmation App',
        projectName: 'Platinum Suite',
        status: 'BUILDING',
        url: 'https://platinum-shift-confirmation.railway.app',
        lastDeployment: '2025-07-26T17:20:00Z',
        lastCheck: new Date().toISOString(),
        errors: [
          {
            message: 'Environment variable SHIFT_NOTIFICATION_WEBHOOK missing',
            timestamp: new Date().toISOString(),
            severity: 'ERROR',
            category: 'configuration',
            autoFixable: true
          }
        ]
      }
    ];
  }

  // NEW: Dynamic stats recalculation method
  recalculateStats() {
    const totalApps = this.demoApps.length;
    const healthyApps = this.demoApps.filter(app => 
      app.status === 'SUCCESS' && (!app.errors || app.errors.length === 0)
    ).length;
    const errorApps = this.demoApps.filter(app => 
      app.errors && app.errors.length > 0
    ).length;

    return {
      totalApps,
      healthyApps,
      errorApps,
      healingInProgress: 0, // This would be tracked separately in real implementation
      totalHealsToday: 5,   // This would be tracked separately in real implementation
      successfulHeals: 4,   // This would be tracked separately in real implementation
      failedHeals: 1        // This would be tracked separately in real implementation
    };
  }

  setupMiddleware() {
    // Simplified middleware for Railway
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Basic CORS for Railway
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check - CRITICAL for Railway
    this.app.get('/api/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        port: this.port,
        apps: this.demoApps.length,
        platform: 'railway'
      };
      
      console.log('Health check requested:', health);
      res.json(health);
    });

    // Apps endpoint - Core functionality with DYNAMIC stats
    this.app.get('/api/apps', (req, res) => {
      console.log(`Apps endpoint: Returning ${this.demoApps.length} apps`);
      
      // Update last check times
      this.demoApps.forEach(app => {
        app.lastCheck = new Date().toISOString();
      });

      // FIXED: Recalculate stats dynamically
      this.systemStats = this.recalculateStats();

      const response = {
        apps: this.demoApps,
        stats: this.systemStats,
        timestamp: new Date().toISOString(),
        platform: 'railway'
      };

      res.json(response);
    });

    // Individual app status
    this.app.get('/api/apps/:id/status', (req, res) => {
      const { id } = req.params;
      const app = this.demoApps.find(a => a.id === id);
      
      if (!app) {
        console.log(`App not found: ${id}`);
        return res.status(404).json({ error: 'App not found', requestedId: id });
      }

      app.lastCheck = new Date().toISOString();
      console.log(`Status requested for: ${app.name}`);
      
      // ADDED: Include fresh stats with individual app status
      const freshStats = this.recalculateStats();
      
      res.json({
        ...app,
        systemStats: freshStats
      });
    });

    // App logs
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
          message: `✅ ${app.name} running successfully on Railway`
        },
        {
          timestamp: new Date(Date.now() - 30000).toISOString(),
          severity: 'INFO',
          message: '🔧 Auto-Healer monitoring active'
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          severity: 'INFO',
          message: '🚀 Connected to Railway Auto-Healer system'
        },
        {
          timestamp: new Date(Date.now() - 90000).toISOString(),
          severity: 'INFO',
          message: '📊 Health check passed'
        }
      ];

      if (app.errors && app.errors.length > 0) {
        logs.unshift(...app.errors.map(error => ({
          timestamp: error.timestamp,
          severity: error.severity,
          message: `🚨 ${error.message}`
        })));
      }

      console.log(`Logs requested for: ${app.name} (${logs.length} entries)`);
      res.json({ logs, appName: app.name });
    });

    // FIXED: Manual healing with stats recalculation
    this.app.post('/api/apps/:id/heal', (req, res) => {
      const { id } = req.params;
      const app = this.demoApps.find(a => a.id === id);
      
      if (!app) {
        return res.status(404).json({ error: 'App not found' });
      }

      const healingId = `healing-${id}-${Date.now()}`;
      console.log(`🔧 Healing triggered for: ${app.name} (${healingId})`);

      // Simulate healing process
      setTimeout(() => {
        if (app.errors && app.errors.length > 0) {
          const errorCount = app.errors.length;
          app.errors = []; // Clear errors
          app.status = 'SUCCESS'; // Update status
          app.lastCheck = new Date().toISOString();
          
          // FIXED: Recalculate stats after healing
          this.systemStats = this.recalculateStats();
          
          console.log(`✅ Healing completed for ${app.name} - cleared ${errorCount} error(s)`);
          console.log(`📊 Updated stats - Error apps: ${this.systemStats.errorApps}`);
        }
      }, 3000);

      res.json({
        healingId,
        message: `🔧 Healing process started for ${app.name}`,
        status: 'in_progress',
        estimatedTime: '3 seconds',
        timestamp: new Date().toISOString()
      });
    });

    // System stats with dynamic calculation
    this.app.get('/api/stats', (req, res) => {
      // Always return fresh stats
      const freshStats = this.recalculateStats();
      
      res.json({
        system: freshStats,
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
        platform: 'railway',
        timestamp: new Date().toISOString()
      });
    });

    // NEW: Error apps endpoint for filtering
    this.app.get('/api/apps/errors', (req, res) => {
      const errorApps = this.demoApps.filter(app => 
        app.errors && app.errors.length > 0
      );
      
      console.log(`Error apps requested: ${errorApps.length} apps with errors`);
      res.json({
        errorApps,
        count: errorApps.length,
        timestamp: new Date().toISOString()
      });
    });

    // Debug endpoint with fresh stats
    this.app.get('/api/debug', (req, res) => {
      const freshStats = this.recalculateStats();
      
      const debug = {
        platform: 'railway',
        environment: process.env.NODE_ENV || 'production',
        port: this.port,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        apps: this.demoApps.map(app => ({
          id: app.id,
          name: app.name,
          status: app.status,
          errorCount: app.errors ? app.errors.length : 0,
          lastCheck: app.lastCheck
        })),
        system: freshStats
      };

      console.log('Debug info requested:', debug);
      res.json(debug);
    });

    // Root endpoint - Dashboard
    this.app.get('/', (req, res) => {
      console.log('Dashboard requested');
      res.sendFile(path.join(__dirname, 'public', 'railway-dashboard.html'));
    });

    // Catch all for debugging
    this.app.use('*', (req, res) => {
      console.log(`404: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        error: 'Not Found', 
        path: req.originalUrl,
        timestamp: new Date().toISOString() 
      });
    });
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`🚀 Railway Auto-Healer started on port ${this.port}`);
      console.log(`📊 Dashboard: https://railway-auto-healer-production.up.railway.app`);
      console.log(`🔧 Monitoring ${this.demoApps.length} Railway applications`);
      console.log(`⚡ Platform: Railway | Environment: ${process.env.NODE_ENV || 'production'}`);
      
      // Log all apps with error status
      this.demoApps.forEach(app => {
        const errorCount = app.errors ? app.errors.length : 0;
        console.log(`   📱 ${app.name} (${app.status}) - ${app.projectName} ${errorCount > 0 ? `⚠️ ${errorCount} errors` : '✅'}`);
      });
      
      // Log initial stats
      const initialStats = this.recalculateStats();
      console.log(`📊 Initial Stats: ${initialStats.totalApps} total, ${initialStats.healthyApps} healthy, ${initialStats.errorApps} with errors`);
    });
  }
}

const autoHealer = new RailwayAutoHealer();
autoHealer.start();

module.exports = RailwayAutoHealer;