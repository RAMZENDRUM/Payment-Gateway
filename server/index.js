const express = require('express');
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../')); // Serve HTML files from the root directory for demo purposes

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

// Basic health check
app.get('/', (req, res) => {
    res.json({
        message: 'ZenWallet API is running...',
        websocket: 'enabled',
        timestamp: new Date().toISOString()
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket enabled for real-time updates`);
});
