const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = format;

const logLine = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logLine
  ),
  transports: [
    // All logs → combined.log
    new transports.File({
      filename: path.join(__dirname, 'logs', 'combined.log'),
      maxsize: 5 * 1024 * 1024,   // 5 MB then rotate
      maxFiles: 5,
    }),
    // Errors only → error.log
    new transports.File({
      filename: path.join(__dirname, 'logs', 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    // Console output (coloured) — useful during development
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        logLine
      ),
    }),
  ],
});

module.exports = logger;
