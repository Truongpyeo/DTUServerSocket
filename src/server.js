require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Danh sách CORS origins mặc định
const defaultCorsOrigins = ["*"];

// Khởi tạo Socket.IO với cấu hình CORS
const io = require('socket.io')(http, {
    cors: {
        origin: defaultCorsOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware để handle CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.static('public'));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: true, message: 'Socket Server is running' });
});

// Socket events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Gửi số lượng clients cho tất cả admin
    io.emit('clients_count', io.engine.clientsCount);

    socket.on('send_message', (data) => {
        io.emit('receive_message', {
            message: data.message,
            userId: socket.id,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Cập nhật số lượng clients khi có người ngắt kết nối
        io.emit('clients_count', io.engine.clientsCount);
    });
});

// Middleware xác thực admin
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// API đăng nhập admin
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/admin/config', authenticateAdmin, (req, res) => {
    res.json({
        corsOrigins: defaultCorsOrigins,
        connectedClients: io.engine.clientsCount
    });
});

app.post('/api/admin/config', authenticateAdmin, (req, res) => {
    const { corsOrigins } = req.body;
    
    try {
        io.engine.corsOptions = {
            origin: corsOrigins,
            methods: ["GET", "POST"],
            credentials: true
        };
        
        defaultCorsOrigins.length = 0;
        defaultCorsOrigins.push(...corsOrigins);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3555;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Socket Server running on port ${PORT}`);
}); 