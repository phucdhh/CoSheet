# CoSheet

**CoSheet** là một nền tảng bảng tính trực tuyến hỗ trợ cộng tác thời gian thực, được phát triển dựa trên mã nguồn mở [EtherCalc](https://ethercalc.net/). Dự án này tập trung vào việc cải thiện trải nghiệm người dùng, đặc biệt là trên thiết bị di động, và bổ sung các tính năng trực quan hóa dữ liệu mạnh mẽ.

## Tính năng nổi bật

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
*   **Công thức & Hàm**: Hỗ trợ đầy đủ các hàm tính toán thông dụng của OpenOffice/Excel.

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
Mặc định CoSheet sẽ chạy ở cổng `8000`. Truy cập: `http://<IP-Cua-Ban>:8000`

### 2. Triển khai trên LXC (Linux Containers)

Nếu bạn sử dụng Proxmox hoặc LXC thuần:

1.  Tạo một container Ubuntu/Debian mới.
2.  Truy cập vào container (SSH hoặc Console).
3.  Thực hiện các bước cài đặt tương tự như phần **"Cài đặt trên VPS / Server"** ở trên.
4.  Đảm bảo cấu hình Network Forwarding nếu container nằm sau NAT.

### 3. Cấu hình Nginx Reverse Proxy (Tùy chọn)

Để chạy CoSheet dưới tên miền (ví dụ `sheet.example.com`) và SSL:

```nginx
server {
    listen 80;
    server_name sheet.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Phát triển & Đóng góp

Dự án này được phát triển bởi **phucdhh**. Mọi đóng góp đều được hoan nghênh!

1.  Fork dự án.
2.  Tạo nhánh tính năng (`git checkout -b feature/TinhNangMoi`).
3.  Commit thay đổi (`git commit -m 'Thêm tính năng mới'`).
4.  Push lên branch (`git push origin feature/TinhNangMoi`).
5.  Tạo Pull Request.

## Bản quyền

Dựa trên [EtherCalc](https://github.com/audreyt/ethercalc) của Audrey Tang và cộng đồng.
Giấy phép tuân theo dự án gốc (Common Public Attribution License).
