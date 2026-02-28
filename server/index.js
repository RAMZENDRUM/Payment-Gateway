const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware (CORS - ALLOW ALL)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json());
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/external', require('./routes/external'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/apps', require('./routes/apps')); // Developer API Keys
app.use('/api/notifications', require('./routes/notifications'));


// Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 [SERVER ERROR]', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({ message: 'Internal Server Error' });
});

// Basic health check (Moved to /api/health)
app.get('/api/health', (req, res) => {
    res.json({
        message: 'ZenWallet API is running...',
        websocket: 'disabled (using Supabase Realtime instead)',
        timestamp: new Date().toISOString()
    });
});

// SPA Fallback: Serve index.html for any unknown routes (e.g., /scan)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Export for Vercel Serverless
module.exports = app;
