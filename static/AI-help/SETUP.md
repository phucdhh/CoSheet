# Hướng dẫn nhanh: Cấu hình AI Assistant

## Bước 1: Lấy Groq API Key (MIỄN PHÍ)
1. Truy cập: https://console.groq.com/
2. Đăng ký/Đăng nhập
3. Click "API Keys" ở menu bên trái
4. Click "Create API Key"
5. Copy key (bắt đầu bằng `gsk_...`)

## Bước 2: Cấu hình file ai.conf
Mở file `/root/ethercalc/static/AI-help/ai.conf` và thay thế API key:

```json
{
  "provider": "groq",
  "apiKey": "gsk_PASTE_YOUR_KEY_HERE",  ← Dán key vào đây
  "apiEndpoint": "https://api.groq.com/openai/v1/chat/completions",
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.3,
  "maxTokens": 500,
  "enabled": true
}
```

Ví dụ:
```json
{
  "provider": "groq",
  "apiKey": "gsk_abc123xyz789...",
  "apiEndpoint": "https://api.groq.com/openai/v1/chat/completions",
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.3,
  "maxTokens": 500,
  "enabled": true
}
```

## Bước 3: Khởi động lại server
```bash
cd /root/ethercalc
pkill -f "node.*server.js"
node server.js --port 1234
```

## Bước 4: Test
1. Mở http://localhost:1234
2. Nhấn F12 (mở Console)
3. Reload trang (Ctrl+Shift+R)
4. Xem console, nên thấy: `[AI Assistant] Config loaded successfully`
5. Click tab "Sheet"
6. Click nút ⭐ (gradient tím)
7. Nhập: "Tính trung bình từ B2 đến B10"
8. Nhấn "Gửi"

## Nếu gặp lỗi:

### Console hiện: "Config not properly configured"
→ API key chưa đúng hoặc vẫn là "YOUR_GROQ_API_KEY_HERE"
→ Kiểm tra lại file ai.conf

### Console hiện: "Failed to load config"
→ File ai.conf không tồn tại hoặc JSON sai format
→ Kiểm tra syntax JSON (dùng https://jsonlint.com/)

### Nút AI không hiện
→ Reload lại trang với Ctrl+Shift+R
→ Kiểm tra console có lỗi gì không

### Sidebar không mở
→ Kiểm tra console có thấy "[AI Assistant] Initialized" không
→ Thử click nút vài lần

## Giới hạn Free Tier của Groq:
- 30 requests/phút
- 14,400 requests/ngày
- Đủ cho lớp học nhỏ/vừa

## Bảo mật:
- File ai.conf đã được thêm vào .gitignore
- Không commit API key lên Git
- Chỉ chia sẻ file ai.conf.template (không có key thật)
