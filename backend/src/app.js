const express = require('express');
const taskRoutes = require('./routes/task.routes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CloudOps API is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/tasks', taskRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use(errorHandler);

module.exports = app;