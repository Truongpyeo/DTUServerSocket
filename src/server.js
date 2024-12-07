require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const geoip = require('geoip-lite');
const axios = require('axios');

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

// Hàm lấy IP thực của client
function getClientIp(socket) {
    // Thứ tự ưu tiên để lấy IP
    const ip = socket.handshake.headers['x-forwarded-for'] || // IP từ proxy
              socket.handshake.headers['x-real-ip'] ||        // IP thực từ Nginx
              socket.handshake.address;                       // IP trực tiếp
              
    // Nếu có nhiều IP (qua proxy), lấy IP đầu tiên
    return ip?.split(',')[0]?.trim() || '127.0.0.1';
}

// Thêm hàm xử lý chung cho tất cả events
function handleSocketEvent(eventName, socket, data) {
    console.log('\n=== START: Event Received ===');
    console.log('Event Name:', eventName);
    console.log('Socket ID:', socket.id);
    console.log('Data:', data);
    console.log('Time:', new Date().toLocaleTimeString());
    console.log('=== END ===\n');

    try {
        // Kiểm tra event có được enable không
        if (!activeSocketEvents.get(eventName)) {
            console.log(`Event ${eventName} is disabled`);
            throw new Error('Event is disabled');
        }

        // Xử lý event và gửi response
        const responseData = {
            userId: socket.id,
            data: data,
            timestamp: new Date().toISOString(),
            eventName: eventName
        };

        console.log('\n=== Broadcasting Response ===');
        console.log('Response Data:', responseData);
        console.log('=== END ===\n');

        // Broadcast cho tất cả clients
        io.emit(`${eventName}_response`, responseData);

        // Gửi acknowledgment về cho sender
        socket.emit(`${eventName}_ack`, {
            status: 'success',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('\n=== Event Error ===');
        console.error('Event:', eventName);
        console.error('Error:', error.message);
        console.error('=== END ===\n');
        
        socket.emit('error', {
            event: eventName,
            message: error.message
        });
    }
}

// Sửa lại phần xử lý socket connection
io.on('connection', async (socket) => {
    // Kiểm tra admin
    const isAdmin = socket.handshake.auth?.token;
    if (isAdmin) {
        adminSockets.add(socket.id);
        socket.emit('clients_count', getActualClientCount());
        socket.emit('clients_list', Array.from(connectedClients.values()));
        return;
    }

    // Lấy IP thực của client
    const clientIp = getClientIp(socket);
    console.log('Client IP:', clientIp);
    
    // Lấy thông tin địa lý từ IP
    const geo = geoip.lookup(clientIp);
    console.log('Geo lookup result:', geo);
    
    // Lưu thông tin client ban đu với IP local
    const clientInfo = {
        id: socket.id,
        ip: socket.handshake.address,
        connectTime: new Date(),
        location: null,
        realLocation: null
    };
    
    connectedClients.set(socket.id, clientInfo);

    socket.emit('get_public_ip');
    
    socket.on('public_ip', async (publicIp) => {
        const client = connectedClients.get(socket.id);
        if (client) {
            const geo = geoip.lookup(publicIp);
            client.ip = publicIp;
            client.location = geo ? {
                country: geo.country,
                region: geo.region,
                city: geo.city,
                ll: geo.ll
            } : null;
            
            connectedClients.set(socket.id, client);
            io.emit('clients_list', Array.from(connectedClients.values()));
        }
    });

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

    // Đăng ký handler cho tất cả events (cả mặc định và tùy chỉnh)
    activeSocketEvents.forEach((enabled, eventName) => {
        socket.removeAllListeners(eventName);
        socket.on(eventName, (data) => {
            handleSocketEvent(eventName, socket, data);
        });
    });

    // Khi thêm event mới
    socket.on('new_event_added', (eventName) => {
        if (activeSocketEvents.has(eventName)) {
            socket.removeAllListeners(eventName);
            socket.on(eventName, (data) => {
                handleSocketEvent(eventName, socket, data);
            });
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

// Thêm vào đầu file, cùng với defaultCorsOrigins
const defaultSocketEvents = new Map([
    ['send_message', true],
    ['send_location', true],
    ['sos', true]
]);

// Biến để lưu cấu hình hiện tại
const activeSocketEvents = new Map(defaultSocketEvents);

// Thêm API endpoint để lấy danh sách events
app.get('/api/admin/socket-events', authenticateAdmin, (req, res) => {
    try {
        // Chuyển đổi Map thành mảng các objects
        const events = Array.from(activeSocketEvents.entries()).map(([name, enabled]) => ({
            name,
            enabled
        }));

        res.json(events);
    } catch (error) {
        console.error('Error getting socket events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API để cập nhật trạng thái của events
app.post('/api/admin/socket-events', authenticateAdmin, (req, res) => {
    const { events } = req.body;
    
    try {
        if (!Array.isArray(events)) {
            return res.status(400).json({ error: 'Events must be an array' });
        }

        events.forEach(event => {
            if (typeof event.name === 'string') {
                if (event.delete) {
                    if (defaultSocketEvents.has(event.name)) {
                        // Chỉ disable event mặc định
                        activeSocketEvents.set(event.name, false);
                    } else {
                        // Xóa event tùy chỉnh
                        activeSocketEvents.delete(event.name);
                    }
                } else {
                    // Thêm hoặc cập nhật event
                    activeSocketEvents.set(event.name, event.enabled);
                    // Thông báo cho tất cả clients về event mới
                    io.emit('new_event_added', event.name);
                }
            }
        });

        const updatedEvents = Array.from(activeSocketEvents.entries())
            .map(([name, enabled]) => ({
                name,
                enabled,
                isDefault: defaultSocketEvents.has(name)
            }));

        res.json({
            success: true,
            events: updatedEvents
        });
    } catch (error) {
        console.error('Error updating events:', error);
        res.status(400).json({ error: error.message });
    }
});

// Thêm API endpoint để client lấy danh sách events đang hoạt động
app.get('/api/available-events', (req, res) => {
    try {
        // Lọc các events đang enabled và chuyển thành array
        const availableEvents = Array.from(activeSocketEvents.entries())
            .filter(([_, enabled]) => enabled) // Chỉ lấy các events đang enabled
            .map(([name]) => ({
                name,
                responseEvent: `${name}_response`, // Event để lắng nghe response
                ackEvent: `${name}_ack`,          // Event để lắng nghe acknowledgment
                isDefault: defaultSocketEvents.has(name)
            }));

        console.log('Available events for client:', availableEvents);
        
        res.json({
            success: true,
            events: availableEvents
        });
    } catch (error) {
        console.error('Error getting available events:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to get available events' 
        });
    }
});

// Thêm API endpoint để thêm event mới
app.post('/api/admin/add-event', authenticateAdmin, (req, res) => {
    const { eventName, eventConfig } = req.body;
    
    try {
        // Validate input
        if (!eventName || typeof eventName !== 'string') {
            return res.status(400).json({ error: 'Invalid event name' });
        }

        // Kiểm tra event đã tồn tại chưa
        if (activeSocketEvents.has(eventName)) {
            return res.status(400).json({ 
                error: `Event "${eventName}" already exists` 
            });
        }

        console.log('Adding new event:', {
            name: eventName,
            config: eventConfig
        });

        // Thêm event mới vào danh sách
        activeSocketEvents.set(eventName, true);

        // Thông báo cho tất cả clients về event mới
        io.emit('new_event_added', eventName);

        // Trả về danh sách events đã cập nhật
        const updatedEvents = Array.from(activeSocketEvents.entries())
            .map(([name, enabled]) => ({
                name,
                enabled,
                isDefault: defaultSocketEvents.has(name)
            }));

        res.json({
            success: true,
            message: `Event ${eventName} added successfully`,
            events: updatedEvents
        });

    } catch (error) {
        console.error('Error adding new event:', error);
        res.status(400).json({ error: error.message });
    }
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