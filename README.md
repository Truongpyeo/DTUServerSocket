# Socket Server Dashboard v2.1.0

## 🌟 Giới Thiệu
 
Socket.io Service là một service được phát triển bằng SocketIO, có thể tích hợp cho nhiều nền tảng
 
## 🏆 Bối Cảnh
Service được phát triển như một phần của ứng dụng trong cuộc thi Mã Nguồn Mở năm 2024.

## ✨ Tính Năng
- Giám sát kết nối Socket.IO realtime
- Dashboard quản trị với xác thực JWT
- Theo dõi vị trí địa lý của clients
- Quản lý CORS và rate limiting
- Giao diện người dùng trực quan

## Thay đổi
### Added
- Tính năng giám sát kết nối realtime
- Dashboard quản trị
- Xác thực JWT
- Theo dõi vị trí client
- Rate limiting
- CORS configuration
- Documentation đầy đủ
- Testing framework
- CI/CD pipeline

## Cài đặt
Xem hướng dẫn chi tiết tại [Setup](docs/setup.md)

- **Tái cấu trúc project**: Cấu trúc mã nguồn được tổ chức lại nhằm nâng cao khả năng bảo trì và mở rộng.

### Fixed
- **Sửa lỗi đếm số lượng clients**: Đảm bảo rằng số liệu hiển thị trên dashboard là chính xác và đáng tin cậy.
- **Sửa lỗi hiển thị thời gian kết nối**: Cải thiện độ chính xác của thông tin thời gian kết nối hiển thị trên dashboard.

## Hướng dẫn cài đặt
- **Clone source code về**: 
```
  git clone https://github.com/Truongpyeo/DTUServerSocket.git
```

 


## 🖥️ Truy cập hệ thống

### Demo Online
Bạn có thể trải nghiệm ReliefLink tại: https://dz1.dzfullstack.com/

### Tạo tài khoản
1. Truy cập trang đăng ký: https://dz1.dzfullstack.com/user/login
2. Điền các thông tin cần thiết:
   - Email
   - Mật khẩu
3. Xác nhận email để kích hoạt tài khoản
4. Đăng nhập và bắt đầu sử dụng hệ thống

### Các portal trong hệ thống
- 👥 **Portal Người Dùng**: [relieflinknguoidung](https://dz1.dzfullstack.com/app/dtudz2-nguoidung/trang-chu-6750f44df0b1ed2b4a0eb675?branch=master&environment=production)
  - Dành cho người dân cần hỗ trợ cứu nạn
  - Theo dõi tình hình thiên tai
  - Yêu cầu hỗ trợ khẩn cấp

- 🦺 **Portal Nhân Lực**: [relieflinknhanluc](https://dz1.dzfullstack.com/app/dtudz2-nhanluc/ang-nhap-6750f4ebf0b1ed2b4a0eb697?branch=master)  
  - Dành cho đội ngũ cứu hộ
  - Quản lý nhiệm vụ cứu trợ
  - Điều phối nguồn lực

- ⚙️ **Portal Admin**: [relieflinkadmin](https://dz1.dzfullstack.com/app/dtudz2-admin/master-admin-6750f0d8f0b1ed2b4a0eb5d6?branch=master&environment=production)
  - Dành cho quản trị viên hệ thống
  - Quản lý người dùng và phân quyền
  - Theo dõi hoạt động toàn hệ thống

### Tài khoản demo
Bạn có thể dùng các tài khoản sau để trải nghiệm:

**Portal Người Dùng:**
- Email: admin1@example.com
- Password: 123456

**Portal Nhân Lực:**
- Email: nhanlucA@example.com 
- Password: 123456

**Portal Admin:**
- Email: a@example.com
- Password: 123456

> **Lưu ý**: Đây là tài khoản demo chỉ có quyền hạn giới hạn. Để sử dụng đầy đủ tính năng, vui lòng đăng ký tài khoản mới.

## 💡Nhà phát triển

- 📧 Email: thanhtruong23111999@gmail.com

- 📱 Hotline: 0376 659 652

*" 🏫 DTU_DZ - DUY TAN UNIVERSITY - SCS ✨"*

## 📞 Liên hệ
- Lê Thanh Trường       :  <u>thanhtruong23111999@gmail.com</u>
- Võ Văn Việt           :  <u>vietvo371@gmail.com</u>
- Nguyễn Ngọc Duy Thái  :  <u>kkdn011@gmail.com</u>


## 🤝 Đóng góp
Chúng tôi rất hoan nghênh mọi đóng góp! Xem [CONTRIBUTING](https://github.com/Truongpyeo/DTUServerSocket/blob/master/CONTRIBUTING.md) để biết thêm chi tiết.

## 🔄 Quy trình phát triển
1. Fork repo này
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`) 
5. Tạo Pull Request

## 🐛 Báo lỗi
Nếu bạn phát hiện lỗi, vui lòng tạo issue mới với:
- Mô tả chi tiết lỗi
- Các bước tái hiện
- Screenshots nếu có
- Môi trường (browser, OS...)

## 📜 Changelog
Xem [CHANGELOG](https://github.com/Truongpyeo/DTUServerSocket/blob/master/CHANGELOG.md) để biết lịch sử thay đổi.

## ⚖️ Code of Conduct
Xem [CODE_OF_CONDUCT](https://github.com/Truongpyeo/DTUServerSocket/blob/master/CODE_OF_CONDUCT.md) để biết các quy tắc và hành vi được chấp nhận.

## Báo cáo lỗi & Góp ý
- Issues: [GitHub Issues](https://github.com/Truongpyeo/DTURelifeLink/issues)
- Security: Đối với các vấn đề bảo mật nhạy cảm, vui lòng liên hệ trực tiếp qua email: <u>thanhtruong23111999@gmail.com</u>


### 📝 License
Dự án được phân phối dưới giấy phép [MIT License](https://github.com/Truongpyeo/DTUServerSocket/blob/master/LICENSE)

*"Được phát triển với ❤️ bởi Nhóm DTU-DZ"*
