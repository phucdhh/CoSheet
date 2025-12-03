# Biểu Đồ Đường (Line Chart) - Xu Hướng Theo Thời Gian

## Mục Đích
Tập dữ liệu này chứa 100 điểm dữ liệu về doanh số bán hàng theo tháng trong 8+ năm. Dữ liệu này giúp bạn:
- Hiểu cách tạo **line chart** để xem xu hướng theo thời gian
- Phân tích **tăng trưởng** và **mùa vụ** (seasonality)
- So sánh doanh số giữa các tháng/năm
- Dự đoán xu hướng tương lai

## Cấu Trúc Dữ Liệu
- **Biến 1 (Month)**: Tháng (định tính - thời gian)
- **Biến 2 (Sales)**: Doanh số bán hàng (định lượng)
- **Số dòng**: 101 (1 header + 100 dữ liệu)
- **Chu kỳ**: Dữ liệu lặp lại theo chu kỳ 12 tháng

## Thực Hành Trên CoSheet

### 1. Tạo Line Chart
1. Chọn vùng dữ liệu A1:B101
2. Chuyển sang tab **Graph**
3. Chọn biểu đồ **Line Chart**
4. Quan sát xu hướng tăng trưởng theo thời gian

### 2. Phân Tích Xu Hướng

**Tính tốc độ tăng trưởng trung bình**:
- Doanh số đầu tiên: `=B2`
- Doanh số cuối cùng: `=B101`
- Tăng trưởng tổng: `=(B101-B2)/B2*100` → % tăng trưởng
- Tăng trưởng trung bình mỗi tháng: `=(B101-B2)/99`

### 3. Tìm Tháng Có Doanh Số Cao/Thấp Nhất
- **Doanh số cao nhất**: `=MAX(B2:B101)`
- **Doanh số thấp nhất**: `=MIN(B2:B101)`
- **Tháng có doanh số cao nhất**: Sử dụng INDEX/MATCH

```
=INDEX(A2:A101, MATCH(MAX(B2:B101), B2:B101, 0))
```

### 4. Phân Tích Mùa Vụ (Seasonality)

Nhận xét: Doanh số có xu hướng:
- **Cao nhất vào tháng 12** (mùa lễ hội, cuối năm)
- **Thấp nhất vào đầu năm** (sau mùa cao điểm)
- **Tăng dần** từ tháng 1 đến tháng 12

Tính trung bình doanh số cho mỗi tháng trong năm:
- Trung bình tháng Jan: `=AVERAGEIF(A2:A101, "Jan", B2:B101)`
- Trung bình tháng Dec: `=AVERAGEIF(A2:A101, "Dec", B2:B101)`

### 5. Tính Moving Average (Trung Bình Trượt)

Để làm mượt đường xu hướng, tính moving average 3 tháng:
- Trong cột C3: `=AVERAGE(B2:B4)`
- Trong cột C4: `=AVERAGE(B3:B5)`
- Kéo xuống đến C100

Sau đó vẽ line chart với cả dữ liệu gốc và moving average.

### 6. Dự Đoán Đơn Giản

Dự đoán doanh số tháng tiếp theo bằng **linear regression**:
```
=FORECAST(101, B2:B101, ROW(B2:B101))
```
hoặc tính trung bình tốc độ tăng:
```
=B101 + (B101-B2)/99
```

## Khái Niệm Học Được
✓ **Line Chart** - Biểu đồ đường cho dữ liệu thời gian  
✓ **Trend Analysis** - Phân tích xu hướng  
✓ **Seasonality** - Tính mùa vụ  
✓ **Moving Average** - Trung bình trượt  
✓ **FORECAST function** - Dự đoán xu hướng  
✓ **AVERAGEIF** - Tính trung bình có điều kiện  
✓ Phân tích tăng trưởng theo thời gian  
