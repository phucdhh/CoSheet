# Biểu Đồ Tròn (Pie Chart) & Doughnut Chart - Tỷ Lệ Phần Trăm

## Mục Đích
Tập dữ liệu này chứa 15 nhóm dữ liệu phân tích tỷ lệ phần trăm khác nhau. Dữ liệu này giúp bạn:
- Hiểu cách tạo **Pie Chart** (biểu đồ tròn) và **Doughnut Chart** (biểu đồ vòng)
- Phân tích **cơ cấu tỷ lệ** của các bộ phận trong tổng thể
- So sánh tỷ trọng của các thành phần
- Kiểm tra tính nhất quán của dữ liệu (tổng = 100%)

## Cấu Trúc Dữ Liệu
- **Số nhóm**: 15 nhóm khác nhau (ngân sách, sản phẩm, khu vực, v.v.)
- **Mỗi nhóm**: 3-7 danh mục với tỷ lệ %
- **Dòng cuối mỗi nhóm**: Tổng (phải = 100)
- **Tổng số dòng**: 101

## Thực Hành Trên CoSheet

### 1. Tạo Pie Chart
1. Chọn một nhóm dữ liệu, ví dụ **Housing Budget** (A2:B8)
2. Chuyển sang tab **Graph**
3. Chọn **Pie Chart** hoặc **Doughnut Chart**
4. Quan sát tỷ lệ các thành phần

### 2. Tạo Doughnut Chart
- Tương tự Pie Chart nhưng chọn **Doughnut**
- Ưu điểm: Có lỗ ở giữa, dễ nhìn và hiện đại hơn

### 3. So Sánh Pie vs Doughnut
- **Pie Chart**: Phù hợp khi có ít danh mục (3-6 mục)
- **Doughnut Chart**: Phù hợp khi muốn nhấn mạnh tỷ lệ, có thể thêm text vào giữa
- Cả hai đều không phù hợp khi có quá nhiều danh mục (>7)

### 4. Kiểm Tra Tính Nhất Quán

Mỗi nhóm phải có tổng = 100%. Kiểm tra:
```
=SUM(B2:B7)  → Phải = 100
```

Nếu tổng ≠ 100:
- Dữ liệu có lỗi
- Cần chuẩn hóa lại: chia mỗi giá trị cho tổng và nhân 100

### 5. Tìm Thành Phần Chiếm Tỷ Trọng Lớn Nhất

Trong một nhóm (ví dụ B2:B7):
```
=MAX(B2:B7)         → Tỷ lệ lớn nhất
=INDEX(A2:A7, MATCH(MAX(B2:B7), B2:B7, 0))  → Tên danh mục
```

### 6. Phân Tích Các Nhóm Dữ Liệu Có Sẵn

**Nhóm 1 (A2:B8)**: Phân bổ ngân sách gia đình
- Housing chiếm 30% - cao nhất
- Food chiếm 25% - thứ hai

**Nhóm 2 (A9:B14)**: Thị phần sản phẩm
- Product A chiếm tỷ trọng lớn nhất

**Nhóm 3 (A15:B19)**: Phân bổ theo khu vực
- Khá đồng đều giữa các vùng

**Và nhiều nhóm khác...**

### 7. Khi Nào Dùng Pie/Doughnut Chart?

✅ **Nên dùng khi**:
- Muốn xem tỷ lệ % của các phần trong tổng thể
- Có 3-7 danh mục
- Tổng các phần = 100%
- Muốn nhấn mạnh thành phần chiếm tỷ trọng lớn

❌ **Không nên dùng khi**:
- Có quá nhiều danh mục (>7) → khó phân biệt
- Muốn so sánh chính xác các giá trị → dùng bar chart
- Dữ liệu theo thời gian → dùng line chart
- Các phần có giá trị gần bằng nhau → khó quan sát

### 8. Tính Phần Trăm Tích Lũy

Để tính % tích lũy (cumulative %):
```
Cột C2: =B2
Cột C3: =C2+B3
Cột C4: =C3+B4
...
```

## Khái Niệm Học Được
✓ **Pie Chart** - Biểu đồ tròn  
✓ **Doughnut Chart** - Biểu đồ vòng  
✓ Phân tích tỷ lệ % và cơ cấu  
✓ Kiểm tra tính nhất quán (tổng = 100%)  
✓ MAX, SUM, INDEX/MATCH  
✓ Khi nào nên/không nên dùng pie chart  
✓ So sánh Pie vs Doughnut  
