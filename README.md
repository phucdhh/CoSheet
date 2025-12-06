# CoSheet v1.1

**CoSheet** là một nền tảng bảng tính trực tuyến hỗ trợ cộng tác thời gian thực, được phát triển dựa trên mã nguồn mở [EtherCalc](https://ethercalc.net/). Dự án này tập trung vào việc cải thiện trải nghiệm người học (học sinh, sinh viên), đặc biệt là trên thiết bị di động, và bổ sung các tính năng trực quan hóa dữ liệu mạnh mẽ.


## Tính năng nổi bật

*   **🆕 Drag & Drop Upload (v1.1)**: Kéo thả file CSV/XLSX trực tiếp vào browser
    *   Hỗ trợ multi-sheet XLSX tự động
    *   Visual feedback với overlay toàn màn hình
    *   Validation file types và error handling
*   **Cộng tác thời gian thực**: Nhiều người dùng có thể chỉnh sửa cùng một bảng tính cùng lúc.
*   **Giao diện Chart nâng cao**:
    *   Hỗ trợ nhiều loại biểu đồ: Bar, Line, Pie, Doughnut, Scatter, Radar, Polar Area.
    *   **Mới**: Histogram (Biểu đồ phân phối), Grouped Bar, Stacked Bar, và Box Plot.
    *   Giao diện Ribbon trực quan với icons minh họa sinh động.
*   **Tối ưu hóa cho Mobile**:
    *   Cuộn mượt mà (Smooth scrolling) với cơ chế giảm tốc (damping).
    *   Thanh công cụ biểu đồ trượt ngang dễ dàng.
    *   Cơ chế "Smart Scrolling": Ưu tiên cuộn nội dung bảng tính trước khi cuộn trang.
*   **Nhập liệu & Xuất dữ liệu**: Hỗ trợ CSV, XLSX, ODS.
#*   **Công thức & Hàm**: Hỗ tr
 đầy đủ các hàm tính toán thông dụng của OpenOffice/Excel.
*   **Bảo mật & Hiệu suất (v1.0)**:
    *   Rate limiting (đề kháng spam/DDoS)
    *   CSRF protection
    *   Security headers (Helmet)
    *   Centralized logging (Winston)
    *   Health check endpoints (/health, /metrics)
    *   Cloudflare CDN optimization

## Hướng dẫn Cài đặt & Triển khai

CoSheet chạy trên nền tảng Node.js. Bạn có thể triển khai trên VPS, LXC container hoặc Server vật lý.

### Yêu cầu hệ thống
*   Node.js (phiên bản 14.x hoặc mới hơn, khuyến nghị 16.x trở lên)
*   Redis (để lưu trữ dữ liệu)
*   Git

### 1. Cài đặt trên VPS / Server (Ubuntu/Debian)

**Bước 1: Cài đặt Node.js và Redis**
```bash
# Cài đặt Redis
sudo apt update
sudo apt install redis-server -y

# Cài đặt Node.js (ví dụ bản 16.x)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```

**Bước 2: Tải mã nguồn CoSheet**
```bash
git clone https://github.com/phucdhh/CoSheet.git
cd CoSheet
```

**Bước 3: Cài đặt thư viện phụ thuộc**
```bash
npm install
```

**Bước 4: Chạy ứng dụng**
```bash
# Chạy trực tiếp
npm start

# Hoặc chạy với PM2 (khuyên dùng cho production)
sudo npm install -g pm2
pm2 start app.js --name cosheet
pm2 save
pm2 startup
```
Mặc nh CoSheet sẽ chạy ở cổng `1234`. Truy cập: `http://<IP-Cua-Ban>:1234`

### 2. Triển khai trên LXC (Linux Containers)

Nếu bạn sử dụng Proxmox hoặc LXC thuần:

1.  Tạo một container Ubuntu/Debian mới.
2.  Truy cập vào container (SSH hoặc Console).
3.  Thực hiện các bước cài đặt tương tự như phần **"Cài đặt trên VPS / Server"** ở trên.
4.  Đảm bảo cấu hình Network Forwarding nếu container nằm sau NAT.

### 3. Cấu hình Nginx Reverse Proxy (Tùy chn)

 chạy CoSheet dưới tên miền (ví dụ `cosheet.example.com`) và SSL:

```nginx
server {
    listen 80;
    server_name cosheet.example.com;

    location / {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Sử dụng tính năng Drag & Drop

### Upload file bằng kéo thả

1. Mở CoSheet trong browser
2. Kéo file CSV hoặc XLSX t file explorer
3. Thả file vào cửa sổ browser
4. File sẽ được upload và load tự động

### Hỗ trợ multi-sheet XLSX

- File XLSX nhiều sheets sẽ tự động được chuyển sang multi-view
- Mỗi sheet trở thành một tab riêng
- Table of Contents (TOC) được tạo tự động

Chi tiết kỹ thuật: [DRAG-DROP-FEATURE.md](./DRAG-DROP-FEATURE.md)

## Phát triển & Đóng góp

Dự án này được phát triển bởi **phucdhh**. Mọi đóng góp đều được hoan nghênh!

1.  Fork dự án.
2.  Tạo nhánh tính năng (`git checkout -b feature/TinhNangMoi`).
3.  Commit thay đổi (`git commit -m 'Thêm tính năng mới'`).
4.  Push lên branch (`git push origin feature/TinhNangMoi`).
5.  Tạo Pull Request.

### Tài liệu bổ sung

- [DRAG-DROP-FEATURE.md](./DRAG-DROP-FEATURE.md) - Chi tiết tính năng ko thả
- [ROADMAP.md](./ROADMAP.md) - Lộ trình phát triển 4 giai đoạn
- [ENHANCEMENT.md](./ENHANCEMENT.md) - Danh sách tính năng tương lai
- [docs/CLOUDFLARE-OPTIMIZATION.md](./docs/CLOUDFLARE-OPTIMIZATION.md) - Hướng dẫn tối ưu Cloudflare

### Monitoring & Health Checks

CoSheet v1.0+ cung cấp các endpoint monitoring:

```bash
# Health check cơ bản
curl http://localhost:1234/health

# Métrics chi tiết
curl http://localhost:1234/metrics

# Kubernetes readiness probe
curl http://localhost:1234/health/ready

# Kubernetes liveness probe
curl http://localhost:1234/health/alive
```

## Changelog

### v1.1.0 - 2025-12-03

**Added**
- ✨ Drag & Drop file upload (CSV, XLSX, ODS)
- 📊 Multi-sheet XLSX auto-conversion
- 🎨 Visual feedback overlay

**Fixed**
- 🐛 "Unknown cell type item 's'" error in XLSX parsing
- 🔧 Browser worker cache issues
- 📝 Console log spam (200+ → 0)

**Performance**
- ⚡ Improved page load time
- 🧹 Cleaner browser console

### v1.0.0 - 2025-12-01

**Added**
- 🔒 Security hardening (rate limiting, CSRF, Helmet)
- 📈 Advanced charting (Histogram, Box Plot, Grouped/Stacked Bar)
- 📱 Mobile optimization (smooth scrolling, smart scrolling)
- 🏥 Health check endpoints
- 
## Bản quyền

Dựa trên [EtherCalc](https://github.com/audreyt/ethercalc) của Audrey Tang và cộng đồng.

Giấy phép tuân theo dự án gốc (Common Public Attribution License).

---

**Maintained by**: [@phucdhh](https://github.com/phucdhh)  
**Repository**: [CoSheet](https://github.com/phucdhh/CoSheet)  
**Last updated**: December 3, 2025
