const winston = require('winston');

class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'railway-auto-healer' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Only add file transports if in development or logs directory exists
    if (process.env.NODE_ENV === 'development') {
      try {
        this.logger.add(new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          handleExceptions: false
        }));
        this.logger.add(new winston.transports.File({ 
          filename: 'logs/combined.log',
          handleExceptions: false
        }));
      } catch (error) {
        // Ignore file logging errors in production
        console.log('File logging disabled in production environment');
      }
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  errorDetected(errorData, meta = {}) {
    this.logger.error('Error detected in Railway app', {
      ...meta,
      errorData,
      timestamp: new Date().toISOString()
    });
  }

  healingAction(action, meta = {}) {
    this.logger.info(`Healing action: ${action}`, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  fixApplied(fixData, meta = {}) {
    this.logger.info('Auto-fix applied successfully', {
      ...meta,
      fixData,
      timestamp: new Date().toISOString()
    });
  }

  fixFailed(fixData, error, meta = {}) {
    this.logger.error('Auto-fix failed', {
      ...meta,
      fixData,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new Logger();
