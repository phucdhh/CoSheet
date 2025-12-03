# Tham Số Định Tâm - Mean, Median, Mode

## Mục Đích
Tập dữ liệu này chứa 100 giá trị số nguyên để thực hành tính các **tham số định tâm** (measures of central tendency). Dữ liệu này giúp bạn:
- Hiểu sự khác biệt giữa **Mean** (trung bình), **Median** (trung vị), và **Mode** (yếu vị)
- Biết khi nào nên dùng tham số nào
- Thực hành tính toán trên CoSheet

## Cấu Trúc Dữ Liệu
- **Biến (Value)**: Giá trị số nguyên
- **Số dòng**: 101 (1 header + 100 dữ liệu)
- **Đặc điểm**: Một số giá trị lặp lại nhiều lần để dễ tìm mode

## Thực Hành Trên CoSheet

### 1. Tính Mean (Trung Bình Cộng)
```
=AVERAGE(A2:A101)
```
**Ý nghĩa**: Tổng tất cả giá trị chia cho số lượng quan sát  
**Ưu điểm**: Sử dụng toàn bộ dữ liệu  
**Nhược điểm**: Bị ảnh hưởng bởi outliers (giá trị ngoại lai)

### 2. Tính Median (Trung Vị)
```
=MEDIAN(A2:A101)
```
**Ý nghĩa**: Giá trị ở chính giữa khi sắp xếp dữ liệu  
**Ưu điểm**: Không bị ảnh hưởng bởi outliers  
**Nhược điểm**: Không sử dụng hết thông tin từ dữ liệu

### 3. Tính Mode (Yếu Vị/Số Hay Gặp Nhất)
```
=MODE(A2:A101)
```
**Ý nghĩa**: Giá trị xuất hiện nhiều nhất  
**Ưu điểm**: Hữu ích cho dữ liệu phân loại  
**Nhược điểm**: Có thể có nhiều mode hoặc không có mode

### 4. So Sánh Ba Tham Số

Tạo bảng so sánh:
| Tham số | Công thức | Kết quả |
|---------|-----------|---------|
| Mean    | =AVERAGE(A2:A101) | ? |
| Median  | =MEDIAN(A2:A101)  | ? |
| Mode    | =MODE(A2:A101)    | ? |

### 5. Phân Tích
- Nếu Mean = Median = Mode → Phân phối đối xứng
- Nếu Mean > Median → Phân phối lệch phải (có giá trị lớn kéo mean lên)
- Nếu Mean < Median → Phân phối lệch trái (có giá trị nhỏ kéo mean xuống)

### 6. Tìm Tần Suất của Mode
Để đếm số lần xuất hiện của mode:
```
=COUNTIF(A2:A101, MODE(A2:A101))
```

## Khái Niệm Học Được
✓ **Mean** - Trung bình cộng  
✓ **Median** - Trung vị  
✓ **Mode** - Yếu vị  
✓ AVERAGE, MEDIAN, MODE functions  
✓ Khi nào dùng tham số nào  
✓ Phân tích hình dạng phân phối qua 3 tham số  
