# Độ Phân Tán - Variance & Standard Deviation

## Mục Đích
Tập dữ liệu này chứa 100 giá trị với một số **outliers** (giá trị ngoại lai). Dữ liệu này giúp bạn:
- Hiểu **độ phân tán** của dữ liệu
- Tính **phương sai** (variance) và **độ lệch chuẩn** (standard deviation)
- Nhận biết outliers và ảnh hưởng của chúng
- So sánh VAR vs VARP, STDEV vs STDEVP

## Cấu Trúc Dữ Liệu
- **Biến (Value)**: Giá trị số thực
- **Số dòng**: 101 (1 header + 100 dữ liệu)
- **Đặc điểm**: Có khoảng 6-8 outliers (giá trị rất lớn hoặc rất nhỏ)

## Thực Hành Trên CoSheet

### 1. Tính Các Tham Số Cơ Bản
- **Trung bình**: `=AVERAGE(A2:A101)`
- **Trung vị**: `=MEDIAN(A2:A101)`
- **Min**: `=MIN(A2:A101)`
- **Max**: `=MAX(A2:A101)`
- **Range (Phạm vi)**: `=MAX(A2:A101) - MIN(A2:A101)`

### 2. Tính Phương Sai (Variance)

**Phương sai mẫu (Sample Variance)**:
```
=VAR(A2:A101)
```
Dùng khi dữ liệu là mẫu từ quần thể lớn hơn (chia cho n-1)

**Phương sai tổng thể (Population Variance)**:
```
=VARP(A2:A101)
```
Dùng khi dữ liệu là toàn bộ quần thể (chia cho n)

### 3. Tính Độ Lệch Chuẩn (Standard Deviation)

**Độ lệch chuẩn mẫu**:
```
=STDEV(A2:A101)
```

**Độ lệch chuẩn tổng thể**:
```
=STDEVP(A2:A101)
```

**Mối quan hệ**:  
Standard Deviation = √Variance

Kiểm tra:
```
=SQRT(VAR(A2:A101))  ← Phải bằng STDEV(A2:A101)
```

### 4. Nhận Biết Outliers

Sử dụng **quy tắc 3-sigma** (68-95-99.7):
- Khoảng 68% dữ liệu nằm trong [Mean ± 1×SD]
- Khoảng 95% dữ liệu nằm trong [Mean ± 2×SD]
- Khoảng 99.7% dữ liệu nằm trong [Mean ± 3×SD]

Tính ngưỡng outlier:
- **Cận dưới**: `=AVERAGE(A2:A101) - 3*STDEV(A2:A101)`
- **Cận trên**: `=AVERAGE(A2:A101) + 3*STDEV(A2:A101)`

Đếm outliers:
```
=COUNTIF(A2:A101, "<"&(AVERAGE(A2:A101)-3*STDEV(A2:A101))) + 
 COUNTIF(A2:A101, ">"&(AVERAGE(A2:A101)+3*STDEV(A2:A101)))
```

### 5. So Sánh Mean vs Median
Nếu có outliers:
- Mean sẽ bị "kéo" về phía outliers
- Median ít bị ảnh hưởng hơn
- So sánh hai giá trị để đánh giá ảnh hưởng của outliers

### 6. Hệ Số Biến Thiên (Coefficient of Variation)
```
=STDEV(A2:A101) / AVERAGE(A2:A101) * 100
```
Đơn vị: % - Cho biết độ phân tán tương đối

## Khái Niệm Học Được
✓ **Variance** - Phương sai  
✓ **Standard Deviation** - Độ lệch chuẩn  
✓ VAR vs VARP, STDEV vs STDEVP  
✓ **Outliers** - Giá trị ngoại lai  
✓ **3-sigma rule** - Quy tắc 3-sigma  
✓ **Coefficient of Variation** - Hệ số biến thiên  
✓ Ảnh hưởng của outliers lên mean vs median  
