const logger = require('../config/logger');

function requestLogger(req, res, next) {
    const startTime = Date.now();

    res.on('finish', () => {
        logger.info('HTTP request completed', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startTime,
            ip: req.ip
        });
    });

    next();
}

module.exports = requestLogger;