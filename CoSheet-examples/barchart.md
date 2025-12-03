# Biểu Đồ Cột (Bar Chart) - Dữ Liệu Danh Mục

## Mục Đích
Tập dữ liệu này chứa 100 danh mục sản phẩm và giá trị bán hàng tương ứng. Dữ liệu này giúp bạn:
- Hiểu cách tạo **biểu đồ cột** (bar chart) để so sánh các danh mục
- Thực hành sắp xếp dữ liệu theo giá trị
- Xác định danh mục có giá trị cao nhất và thấp nhất

## Cấu Trúc Dữ Liệu
- **Biến 1 (Category)**: Tên danh mục sản phẩm (định tính)
- **Biến 2 (Value)**: Giá trị bán hàng (định lượng)
- **Số dòng**: 101 (1 header + 100 dữ liệu)

## Thực Hành Trên CoSheet

### 1. Tạo Biểu Đồ Cột
1. Chọn vùng dữ liệu A1:B101
2. Chuyển sang tab **Graph**
3. Chọn biểu đồ **Column Chart** (biểu đồ cột)
4. Quan sát sự so sánh giữa các danh mục

### 2. Tìm Giá Trị Lớn Nhất và Nhỏ Nhất
- **Giá trị lớn nhất**: `=MAX(B2:B101)`
- **Giá trị nhỏ nhất**: `=MIN(B2:B101)`
- **Danh mục có giá trị lớn nhất**: Sử dụng `INDEX` và `MATCH`

### 3. Sắp Xếp Dữ Liệu
1. Chọn vùng A1:B101
2. Chuyển sang tab **Format**
3. Sắp xếp theo cột **Value** (tăng dần hoặc giảm dần)

### 4. Phân Tích Mô Tả
- **Số lượng danh mục**: `=COUNTA(A2:A101)` → 100
- **Tổng giá trị**: `=SUM(B2:B101)`
- **Giá trị trung bình**: `=AVERAGE(B2:B101)`

## Khái Niệm Học Được
✓ Biểu đồ cột dùng để so sánh các danh mục rời rạc  
✓ Hàm MAX, MIN để tìm giá trị cực trị  
✓ Sắp xếp dữ liệu để dễ quan sát  
✓ Tính toán các tham số mô tả cơ bản  
