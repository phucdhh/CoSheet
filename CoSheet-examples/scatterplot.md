# Biểu Đồ Phân Tán (Scatter Plot) - Tương Quan Hai Biến

## Mục Đích
Tập dữ liệu này chứa 100 cặp giá trị: số giờ học và điểm thi. Dữ liệu này giúp bạn:
- Hiểu **mối quan hệ tương quan** giữa hai biến
- Tạo **scatter plot** để trực quan hóa mối quan hệ
- Tính **hệ số tương quan** (correlation coefficient)
- Vẽ **đường hồi quy tuyến tính** (nếu có)

## Cấu Trúc Dữ Liệu
- **Biến 1 (StudyHours)**: Số giờ học mỗi ngày
- **Biến 2 (ExamScore)**: Điểm thi (0-100)
- **Số dòng**: 101 (1 header + 100 dữ liệu)

## Thực Hành Trên CoSheet

### 1. Tạo Scatter Plot
1. Chọn vùng dữ liệu A1:B101
2. Chuyển sang tab **Graph**
3. Chọn biểu đồ **Scatter Plot** (XY Chart)
4. Quan sát mối quan hệ giữa số giờ học và điểm thi

### 2. Tính Hệ Số Tương Quan
- **Correlation coefficient (r)**: `=CORREL(A2:A101, B2:B101)`
- Giá trị r gần 1: Tương quan dương mạnh
- Giá trị r gần -1: Tương quan âm mạnh
- Giá trị r gần 0: Không có tương quan tuyến tính

### 3. Phân Tích Mỗi Biến Riêng Lẻ

**Biến StudyHours:**
- Trung bình: `=AVERAGE(A2:A101)`
- Độ lệch chuẩn: `=STDEV(A2:A101)`
- Min: `=MIN(A2:A101)`
- Max: `=MAX(A2:A101)`

**Biến ExamScore:**
- Trung bình: `=AVERAGE(B2:B101)`
- Độ lệch chuẩn: `=STDEV(B2:B101)`
- Min: `=MIN(B2:B101)`
- Max: `=MAX(B2:B101)`

### 4. Phân Tích Hồi Quy (Nâng Cao)
Nếu bạn muốn tìm phương trình đường thẳng y = ax + b:
- **Hệ số góc (slope)**: `=SLOPE(B2:B101, A2:A101)`
- **Tung độ gốc (intercept)**: `=INTERCEPT(B2:B101, A2:A101)`

Dự đoán điểm thi với 4 giờ học:
- `=SLOPE(B2:B101, A2:A101) * 4 + INTERCEPT(B2:B101, A2:A101)`

### 5. Câu Hỏi Thực Hành
- Học càng nhiều giờ thì điểm thi có cao hơn không?
- Tương quan có mạnh không? (xem giá trị r)
- Nếu một học sinh học 6 giờ, dự đoán điểm thi là bao nhiêu?

## Khái Niệm Học Được
✓ **Scatter Plot** - Biểu đồ phân tán hai biến  
✓ **Correlation** - Tương quan giữa hai biến  
✓ **CORREL function** - Hàm tính hệ số tương quan  
✓ **Linear Regression** - Hồi quy tuyến tính  
✓ **SLOPE và INTERCEPT** - Tìm phương trình đường thẳng  
