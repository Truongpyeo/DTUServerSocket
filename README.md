# Socket Server Dashboard

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/dtudz/socket-server-dashboard/CI)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/node/v/socket-server-dashboard)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black.svg)](https://github.com/Truongpyeo/DTUServerSocket)
[![GitLab Mirror](https://img.shields.io/badge/GitLab-Mirror-orange.svg)](https://gitlab.com/your-gitlab-username/DTUServerSocket)

Một hệ thống quản lý và giám sát kết nối Socket.IO với giao diện quản trị trực quan.

## Tính năng

### 1. Giám sát kết nối realtime
- Theo dõi số lượng clients đang kết nối
- Hiển thị danh sách chi tiết các kết nối
- Cập nhật tự động khi có client kết nối/ngắt kết nối

### 2. Thông tin chi tiết về client
- Socket ID
- Địa chỉ IP
- Thời gian kết nối
- Vị trí địa lý (dựa trên IP)
- Vị trí thực (nếu client cho phép)
- Tọa độ chính xác (latitude/longitude)

### 3. Quản lý CORS
- Cấu hình CORS Origins
- Hỗ trợ nhiều domain
- Cập nhật cấu hình không cần khởi động lại server

### 4. Bảo mật
- Xác thực admin bằng JWT
- Rate limiting cho API đăng nhập
- Phân quyền admin/client
- Bảo vệ các API nhạy cảm

### 5. Giao diện quản trị
- Dashboard trực quan
- Hiển thị trạng thái server
- Quản lý cấu hình
- Theo dõi logs realtime

## Cài đặt

1. Clone repository:

```bash
git clone git@github.com:Truongpyeo/DTUServerSocket.git
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Tạo file môi trường:

```bash
cp env.example .env
```

4. Cấu hình các biến môi trường trong `.env`:

```env
PORT=3555
JWT_SECRET=your_jwt_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
```

5. Khởi động server:

```bash
npm start
```

## Cấu trúc project

```
├── src/
│   └── server.js        # Server logic
├── public/
│   ├── dashboard.html   # Admin dashboard
│   └── login.html       # Admin login page
├── .env                 # Environment variables
├── .gitignore
└── package.json
```

## API Endpoints

### Admin Authentication
- `POST /api/admin/login` - Đăng nhập admin
- `GET /api/admin/config` - Lấy cấu hình server
- `POST /api/admin/config` - Cập nhật cấu hình
- `GET /api/admin/clients` - Lấy danh sách clients

### Server Status
- `GET /health` - Kiểm tra trạng thái server

## Socket Events

### Server to Client
- `clients_count` - Cập nhật số lượng clients
- `clients_list` - Cập nhật danh sách clients

### Client to Server
- `send_location` - Gửi vị trí thực của client

## Yêu cầu hệ thống

- Node.js >= 14.x
- NPM >= 6.x

## Dependencies chính

- Express.js - Web framework
- Socket.IO - WebSocket server
- JWT - Authentication
- GeoIP-lite - IP geolocation

## Môi trường phát triển

- Node.js
- JavaScript
- HTML/CSS
- Bootstrap 5

## License

MIT License

Copyright (c) 2024 DTU DZ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Tác giả

DTU DZ - thanhtruong23111999@gmail.com

## Đóng góp

Mọi đóng góp đều được chào đón. Vui lòng:

1. Fork project
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request
