# AI Formula Assistant - Hướng dẫn sử dụng

## Cấu hình cho Quản trị viên

### 1. Cấu hình API Key (QUAN TRỌNG)
Mở file `/root/ethercalc/static/AI-help/ai.conf` và chỉnh sửa:

```json
{
  "provider": "groq",
  "apiKey": "gsk_your_actual_api_key_here",
  "apiEndpoint": "https://api.groq.com/openai/v1/chat/completions",
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.3,
  "maxTokens": 500,
  "enabled": true
}
```

**Lấy API Key miễn phí:**
1. Truy cập https://console.groq.com/
2. Đăng ký tài khoản (hoặc đăng nhập)
3. Vào mục "API Keys"
4. Tạo key mới và copy
5. Dán vào field `apiKey` trong file `ai.conf`
6. Lưu file và khởi động lại server

**Lưu ý bảo mật:**
- Không commit file ai.conf lên Git (đã có trong .gitignore)
- Giữ API key bí mật
- Groq free tier: 30 requests/phút

### 2. Tùy chỉnh nâng cao
- `model`: Đổi model AI (llama-3.3-70b-versatile, mixtral-8x7b-32768, ...)
- `temperature`: 0-1 (càng thấp càng chính xác, mặc định 0.3)
- `maxTokens`: Giới hạn độ dài response (mặc định 500)
- `enabled`: false để tắt tính năng AI

---

## Hướng dẫn cho Người dùng

### 1. Tìm nút AI Assistant
- Mở CoSheet tại http://localhost:1234
- Nhấp vào tab **Sheet** ở đầu trang
- Bạn sẽ thấy nút với icon ⭐ (sparkle gradient tím) ở phía bên phải các nút khác

### 2. Mở AI Assistant
- Nhấp vào nút ⭐ (gradient tím)
- Một thanh bên (sidebar) màu tím sẽ trượt ra từ bên phải màn hình

### 3. Tạo công thức
- Chọn một ô trong spreadsheet (ví dụ: C1)
- Mở AI Assistant (nút ⭐)
- Nhập yêu cầu bằng tiếng Việt, ví dụ:
  - "Tính trung bình từ B2 đến B36"
  - "Tính tổng các giá trị trong cột A"
  - "Tính lãi suất kép với số tiền ban đầu trong A1, lãi suất trong A2, thời gian trong A3"
- Nhấn nút **Gửi** (màu tím)

### 4. Xem kết quả
- AI sẽ tạo công thức và hiển thị trong khung màu xanh nhạt
- Bạn sẽ thấy:
  - **Công thức**: Ví dụ `=AVERAGE(B2:B36)`
  - **Giải thích**: Mô tả công thức bằng tiếng Việt

### 5. Chèn công thức vào ô
- Nhấn nút **Chèn ngay** (màu xanh lá)
- Công thức sẽ tự động được chèn vào ô đã chọn
- Sidebar sẽ tự động đóng lại

### 6. Các nút khác
- **Để tôi suy nghĩ đã**: Đóng sidebar mà không chèn công thức
- **Đóng (X)**: Đóng sidebar

## Xử lý lỗi

### Lỗi "Chưa cấu hình AI API Key"
- Liên hệ quản trị viên để cấu hình API key trong file `ai.conf`
- Quản trị viên cần lấy API key miễn phí tại https://console.groq.com/

### Lỗi "Không thể kết nối với AI"
- Trên màn hình < 768px, sidebar sẽ hiển thị toàn màn hình
- Vuốt hoặc nhấn nút X để đóng

## Xử lý lỗi

### Lỗi "API key không hợp lệ"
- Kiểm tra API key tại https://console.groq.com/keys
- Xóa API key cũ và nhập lại (xem phần "Thay đổi API Key")

### Lỗi "Không thể kết nối với AI"
- Kiểm tra kết nối internet
- Thử lại sau vài giây
- Kiểm tra console (F12) để xem lỗi chi tiết
- Liên hệ admin nếu lỗi vẫn tiếp tục

### Công thức không được chèn
- Đảm bảo bạn đã chọn một ô trước khi mở AI Assistant
- Kiểm tra console để xem lỗi

## Hỗ trợ mobile
- Trên màn hình < 768px, sidebar sẽ hiển thị toàn màn hình
- Vuốt hoặc nhấn nút X để đóng

## Files liên quan
- `/static/AI-help/ai.conf` - **Cấu hình API (admin)**
- `/static/AI-help/ai-assistant.js` - Logic chính
- `/static/AI-help/ai-assistant.css` - Giao diện
- `/static/sheet-layout.js` - Nút ⭐ trong toolbar
- `/index.html` - Include CSS/JS files

## API Groq
- Endpoint: https://api.groq.com/openai/v1/chat/completions
- Model mặc định: llama-3.3-70b-versatile
- Temperature: 0.3 (để công thức chính xác hơn)
- Max tokens: 500
- Free tier: 30 requests/phút

## Hỗ trợ
- Mở issue tại GitHub repository
- Hoặc liên hệ với admin
