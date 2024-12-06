require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const geoip = require('geoip-lite');

// Danh sách CORS origins mặc định
const defaultCorsOrigins = ["*"];

// Thêm dòng này
const connectedClients = new Map(); // Lưu trữ thông tin clients

// Khởi tạo Socket.IO với cấu hình CORS
const io = require('socket.io')(http, {
    cors: {
        origin: defaultCorsOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware CORS được tách riêng
const corsMiddleware = (req, res, next) => {
    const allowedOrigins = defaultCorsOrigins;
    const origin = req.headers.origin;

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
};

app.use(corsMiddleware);

app.use(express.static('public'));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: true, message: 'Socket Server is running' });
});

// Thêm biến để lưu trữ các admin socket và đếm số client thực
const adminSockets = new Set();

// Hàm để lấy số lượng clients thực (không tính admin)
function getActualClientCount() {
    return connectedClients.size;
}

// Sửa lại phần xử lý kết nối socket
io.on('connection', (socket) => {
    // Kiểm tra xem kết nối có phải là admin không
    const isAdmin = socket.handshake.auth?.token;
    if (isAdmin) {
        adminSockets.add(socket.id);
        // Chỉ gửi thông tin clients cho admin
        socket.emit('clients_count', getActualClientCount());
        socket.emit('clients_list', Array.from(connectedClients.values()));
        return;
    }

    const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                    socket.handshake.address;
    const geo = geoip.lookup(clientIp);
    
    // Lưu thông tin client ban đầu
    const clientInfo = {
        id: socket.id,
        ip: clientIp,
        connectTime: new Date(),
        location: geo ? {
            country: geo.country,
            region: geo.region,
            city: geo.city,
            ll: geo.ll
        } : null,
        realLocation: null
    };
    
    connectedClients.set(socket.id, clientInfo);
    console.log('Client connected:', clientInfo);

    // Gửi số lượng và danh sách clients mới cho tất cả admin
    io.emit('clients_count', getActualClientCount());
    io.emit('clients_list', Array.from(connectedClients.values()));

    // Lắng nghe sự kiện client gửi vị trí thực
    socket.on('send_location', (location) => {
        try {
            const client = connectedClients.get(socket.id);
            if (client) {
                client.realLocation = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    timestamp: new Date()
                };
                connectedClients.set(socket.id, client);
                
                // Gửi danh sách clients đã cập nhật cho tất cả admin
                io.emit('clients_list', Array.from(connectedClients.values()));
            }
        } catch (error) {
            console.error('Error handling location:', error);
        }
    });

    socket.on('send_message', (data) => {
        try {
            // Validate dữ liệu đầu vào
            if (!data.message || typeof data.message !== 'string') {
                throw new Error('Invalid message format');
            }

            io.emit('receive_message', {
                message: data.message.trim(),
                userId: socket.id,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('error', { message: 'Failed to process message' });
        }
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('disconnect', () => {
        if (adminSockets.has(socket.id)) {
            adminSockets.delete(socket.id);
        } else {
            console.log('Client disconnected:', socket.id);
            connectedClients.delete(socket.id);
            
            // Cập nhật danh sách clients cho admin
            io.emit('clients_count', getActualClientCount());
            io.emit('clients_list', Array.from(connectedClients.values()));
        }
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

// Thêm rate limiter cho API login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5 // giới hạn 5 lần request
});

// Sửa lại API login với hash password
app.post('/api/admin/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', {
        username,
        providedPassword: password,
        expectedUsername: process.env.ADMIN_USERNAME,
        expectedPassword: process.env.ADMIN_PASSWORD
    });
    
    try {
        if (username === process.env.ADMIN_USERNAME && 
            password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ username }, process.env.JWT_SECRET, { 
                expiresIn: '1d' 
            });
            console.log('Login successful');
            res.json({ token });
        } else {
            console.log('Login failed: Invalid credentials');
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/config', authenticateAdmin, (req, res) => {
    res.json({
        corsOrigins: defaultCorsOrigins,
        connectedClients: io.engine.clientsCount
    });
});

// Middleware validate dữ liệu
const validateConfig = (req, res, next) => {
    const { corsOrigins } = req.body;
    
    if (!Array.isArray(corsOrigins)) {
        return res.status(400).json({ 
            error: 'corsOrigins must be an array' 
        });
    }

    if (!corsOrigins.every(origin => 
        typeof origin === 'string' && 
        (origin === '*' || origin.startsWith('http'))
    )) {
        return res.status(400).json({ 
            error: 'Invalid origin format' 
        });
    }

    next();
};

// Sử dụng middleware validation
app.post('/api/admin/config', 
    authenticateAdmin, 
    validateConfig, 
    (req, res) => {
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

// Sửa lại API endpoint lấy danh sách clients
app.get('/api/admin/clients', authenticateAdmin, (req, res) => {
    res.json({
        count: getActualClientCount(),
        clients: Array.from(connectedClients.values())
    });
});

const PORT = process.env.PORT || 3555;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Socket Server running on port ${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Xử lý unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
}); 