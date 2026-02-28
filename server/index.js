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

// Export for Vercel Serverless
module.exports = app;

// Start server locally if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Local Server running on port ${PORT}`);
        console.log(`🔌 API initialized without websockets (Delegated to Supabase Realtime)`);
    });
}
