const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
    logger.error('Request failed', {
        message: err.message,
        stack: err.stack,
        method: req.method,
        path: req.originalUrl
    });

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.statusCode
            ? err.message
            : 'Internal server error'
    });
}

module.exports = errorHandler;