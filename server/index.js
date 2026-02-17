const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // In production, specify exact origins
        methods: ['GET', 'POST']
    }
});

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

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join room for specific order/reference
    socket.on('join-order', (orderId) => {
        socket.join(orderId);
        console.log(`📦 Client ${socket.id} joined order room: ${orderId}`);
    });

    // Join room for specific user notifications
    socket.on('join-user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} connected as ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
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
        websocket: 'enabled',
        timestamp: new Date().toISOString()
    });
});

// SPA Fallback: Serve index.html for any unknown routes (e.g., /scan)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket enabled for real-time updates`);
});
