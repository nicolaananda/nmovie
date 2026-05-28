const winston = require('winston');
require('winston-daily-rotate-file');

// Daily-rotated log files prevent the unbounded growth that the previous
// plain `winston.transports.File` setup had (it would happily fill the
// disk over time on a long-running VPS).
//
// - Each log file is capped at 20 MB.
// - 14 days of rotated files are retained, after that they're deleted.
// - Files are gzipped once rotated to keep disk usage low.

const errorRotate = new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
});

const combinedRotate = new winston.transports.DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [errorRotate, combinedRotate],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;
