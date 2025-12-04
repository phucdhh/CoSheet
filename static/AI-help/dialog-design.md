# AI Help Dialog Design cho CoSheet (2025)

## Mục tiêu
Tạo một trợ lý AI thông minh (dùng Groq hoặc Gemini) giúp học sinh & giáo viên:
- Tự động tạo công thức thống kê
- Giải thích từng bước
- Hỗ trợ 100% tiếng Việt

## Vị trí & dạng hiển thị
- **Sidebar bên phải** (khuyến nghị chính) → không che bảng tính
- Có thể thu gọn/minimize
- Mobile: full-screen modal khi nhấn nút AI

## Cấu trúc giao diện (từ trên xuống dưới)
┌──────────────────────────────────────────────────────────────┐
│  AI Assistant                                                │
├──────────────────────────────────────────────────────────────┤
│  Nhập yêu cầu cho ô mà bạn đang chọn:                        │
│  <Ô người dùng nhập yêu cầu>                                 │
│                             [Gửi]                            │
|--------------------------------------------------------------|
|  Lệnh gợi ý:     <Người dùng nhập yêu cầu vào đây>           │
│  AI: =AVERAGE(B2:B36)                                        │
│  Giải thích: Lấy trung bình cộng các ô từ B2 đến B36         |
|                       <giải thích thêm, nếu có>              |
│      [Để tôi suy nghĩ đã]         [Chèn ngay]                │
└──────────────────────────────────────────────────────────────┘

Giải thích các nút bấm:
[Gửi]: Gửi yêu cầu đến AI, bao gồm lệnh gợi ý mà người dùng nhập và các ràng buộc (System Prompt tối ưu, ở phần sau)
[Để tôi suy nghĩ đã]: Đóng AI Assistant dialog
[Chèn ngay]: Chèn công thức mà AI đã đề xuất vào ô mà người dùng đã chọn.

## System Prompt tối ưu (dùng cho Groq hoặc các AI khác)
- Bạn là trợ lý AI chuyên về thống kê dành cho học sinh và giáo viên Việt Nam.
- Luôn trả lời bằng tiếng Việt dễ hiểu, thân thiện.
- Ưu tiên công thức Excel/Google Sheets.
- Luôn kèm giải thích ngắn gọn ý nghĩa thống kê.
- Kèm theo phần bảng tính mà người dùng muốn sử dụng dữ liệu trong đó (nếu ít dữ liệu).
- Output định dạng JSON khi cần:
  {
    "formula": "=AVERAGE(B2:B36)",
    "explanation": "Tính trung bình cộng các điểm từ ô B2 đến B36"
  }


File này có thể dùng làm tài liệu thiết kế chính thức cho CoSheet AI Feature.