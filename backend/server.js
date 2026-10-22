// server.js

require('dotenv').config();

const app = require('./src/app');
const pool = require('./src/config/database');

const PORT = process.env.PORT || 3000;

let server;
let isShuttingDown = false;

async function startServer() {
    try {
        const connection = await pool.getConnection();

        try {
            await connection.ping();
            console.log('MySQL connected successfully');
        } finally {
            connection.release();
        }

        server = app.listen(PORT, () => {
            console.log(`CloudOps API running on port ${PORT}`);
        });

        server.on('error', (error) => {
            console.error('HTTP server error:', error.message);
            process.exitCode = 1;
        });

    } catch (error) {
        console.error('Failed to start application:', error.message);

        try {
            await pool.end();
        } catch (shutdownError) {
            console.error(
                'Failed to close MySQL pool:',
                shutdownError.message
            );
        }

        process.exitCode = 1;
    }
}

async function shutdown(signal) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    const forceShutdownTimer = setTimeout(() => {
        console.error('Graceful shutdown timed out');
        process.exit(1);
    }, 10000);

    forceShutdownTimer.unref();

    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }

        await pool.end();

        console.log('MySQL connection pool closed');
        console.log('Application shut down successfully');

        process.exitCode = 0;
    } catch (error) {
        console.error('Error during shutdown:', error.message);
        process.exitCode = 1;
    } finally {
        clearTimeout(forceShutdownTimer);
    }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();