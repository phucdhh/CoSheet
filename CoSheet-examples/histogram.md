# Biểu Đồ Tần Suất (Histogram) - Dữ Liệu Liên Tục

## Mục Đích
Tập dữ liệu này chứa 100 giá trị liên tục (nhiệt độ trung bình hàng ngày trong 100 ngày). Dữ liệu này giúp bạn:
- Hiểu cách tạo **histogram** để xem phân phối tần suất
- Học cách nhóm dữ liệu liên tục thành các khoảng (bins)
- Phân tích hình dạng phân phối (đối xứng, lệch trái, lệch phải)

## Cấu Trúc Dữ Liệu
- **Biến (Value)**: Nhiệt độ (°C) - dữ liệu định lượng liên tục
- **Số dòng**: 101 (1 header + 100 dữ liệu)
- **Khoảng giá trị**: Khoảng 15°C - 31°C

## Thực Hành Trên CoSheet

### 1. Tính Các Tham Số Định Tâm
- **Trung bình (Mean)**: `=AVERAGE(A2:A101)`
- **Trung vị (Median)**: `=MEDIAN(A2:A101)`
- **Mode**: Giá trị xuất hiện nhiều nhất (dùng `=MODE(A2:A101)` nếu có)

### 2. Tính Các Tham Số Độ Phân Tán
- **Phạm vi (Range)**: `=MAX(A2:A101) - MIN(A2:A101)`
- **Phương sai (Variance)**: `=VAR(A2:A101)` hoặc `=VARP(A2:A101)`
- **Độ lệch chuẩn (Standard Deviation)**: `=STDEV(A2:A101)` hoặc `=STDEVP(A2:A101)`

### 3. Tính Tứ Phân Vị
- **Q1** (Tứ phân vị thứ nhất): `=QUARTILE(A2:A101, 1)`
- **Q2** (Trung vị): `=QUARTILE(A2:A101, 2)`
- **Q3** (Tứ phân vị thứ ba): `=QUARTILE(A2:A101, 3)`
- **IQR** (Khoảng tứ phân vị): `=QUARTILE(A2:A101, 3) - QUARTILE(A2:A101, 1)`

### 4. Tạo Histogram
1. Chọn cột dữ liệu A2:A101
2. Chuyển sang tab **Graph**
3. Chọn biểu đồ **Histogram** hoặc **Column Chart**
4. Quan sát phân phối tần suất

### 5. Phân Tích Phân Phối
- Hình dạng: Đối xứng hay lệch?
- Có outliers (giá trị ngoại lai) không?
- Phân phối có gần với phân phối chuẩn không?

## Khái Niệm Học Được
✓ **Mean, Median, Mode** - Các tham số định tâm  
✓ **Variance, Standard Deviation** - Độ phân tán  
✓ **Quartiles, IQR** - Tứ phân vị  
✓ **Histogram** - Biểu đồ tần suất cho dữ liệu liên tục  
✓ Phân tích hình dạng phân phối  
