# Biểu Đồ Radar (Radar Chart) - So Sánh Đa Chiều

## Mục Đích
Tập dữ liệu này chứa điểm đánh giá kỹ năng của 3 học sinh trên 100 kỹ năng khác nhau. Dữ liệu này giúp bạn:
- Hiểu cách tạo **Radar Chart** (biểu đồ hình nhện/radar)
- So sánh **nhiều đối tượng** trên **nhiều tiêu chí** cùng lúc
- Nhận diện **điểm mạnh** và **điểm yếu** của từng đối tượng
- Phân tích **profile** đa chiều

## Cấu Trúc Dữ Liệu
- **Biến 1 (Skill)**: 100 kỹ năng khác nhau
- **Biến 2-4**: Điểm của Student A, B, C (thang điểm 0-100)
- **Số dòng**: 101 (1 header + 100 dữ liệu)

## Thực Hành Trên CoSheet

### 1. Tạo Radar Chart (Toàn Bộ Dữ Liệu)
1. Chọn toàn bộ dữ liệu A1:D101
2. Chuyển sang tab **Graph**
3. Chọn **Radar Chart**
4. Quan sát: Với 100 kỹ năng, biểu đồ sẽ rất phức tạp!

### 2. Tạo Radar Chart (Chọn Lọc Kỹ Năng)

Để dễ quan sát hơn, chọn **một nhóm kỹ năng cụ thể** (5-10 kỹ năng):

**Ví dụ: Kỹ năng học thuật cơ bản** (A2:D7):
- Math, Physics, Chemistry, Biology, English, History

Tạo radar chart với phạm vi A2:D7 để so sánh 3 học sinh trên 6 kỹ năng này.

**Quan sát**:
- Student A mạnh về Math, Chemistry
- Student B mạnh về Biology, Physics
- Student C mạnh về Math, English

### 3. Phân Tích Từng Học Sinh

**Student A**:
- Điểm trung bình: `=AVERAGE(B2:B101)`
- Điểm cao nhất: `=MAX(B2:B101)`
- Kỹ năng mạnh nhất: `=INDEX(A2:A101, MATCH(MAX(B2:B101), B2:B101, 0))`
- Điểm thấp nhất: `=MIN(B2:B101)`
- Kỹ năng yếu nhất: `=INDEX(A2:A101, MATCH(MIN(B2:B101), B2:B101, 0))`

**Student B & C**: Làm tương tự với cột C và D

### 4. So Sánh Học Sinh

**Học sinh nào giỏi nhất?**
```
Trung bình A: =AVERAGE(B2:B101)
Trung bình B: =AVERAGE(C2:C101)
Trung bình C: =AVERAGE(D2:D101)
```

**Học sinh nào đồng đều nhất?** (độ lệch chuẩn thấp)
```
SD của A: =STDEV(B2:B101)
SD của B: =STDEV(C2:C101)
SD của C: =STDEV(D2:D101)
```
Độ lệch chuẩn thấp → kỹ năng đồng đều hơn

### 5. Phân Tích Theo Nhóm Kỹ Năng

Chia 100 kỹ năng thành các nhóm:

**Nhóm 1: Kỹ năng học thuật** (Math, Physics, Chemistry, Biology, English, History, Geography)
- Trung bình Student A: `=AVERAGE(B2:B8)`

**Nhóm 2: Kỹ năng mềm** (Communication, Critical Thinking, Creativity, Leadership, Teamwork)
- Trung bình Student A: `=AVERAGE(B14:B18)`

Vẽ radar chart riêng cho từng nhóm để phân tích chi tiết.

### 6. Tìm Kỹ Năng Có Chênh Lệch Lớn Nhất

Kỹ năng nào 3 học sinh khác biệt nhiều nhất?
```
Tạo cột E (Range) = MAX(B2,C2,D2) - MIN(B2,C2,D2)
```
Kéo xuống đến E101. Tìm giá trị lớn nhất:
```
=MAX(E2:E101)
=INDEX(A2:A101, MATCH(MAX(E2:E101), E2:E101, 0))
```

### 7. Khi Nào Dùng Radar Chart?

✅ **Nên dùng khi**:
- So sánh 2-5 đối tượng
- Trên 4-10 tiêu chí (không quá nhiều)
- Muốn nhìn tổng quan profile đa chiều
- Phân tích điểm mạnh/yếu

❌ **Không nên dùng khi**:
- Quá nhiều tiêu chí (>15) → rối mắt
- Chỉ 1-2 tiêu chí → dùng bar chart
- Muốn so sánh chính xác giá trị → dùng table/bar chart

### 8. Ví Dụ Ứng Dụng Thực Tế

Radar chart hữu ích cho:
- **Đánh giá nhân viên** (nhiều tiêu chí KPI)
- **So sánh sản phẩm** (giá, chất lượng, tính năng, v.v.)
- **Phân tích năng lực** (skills assessment)
- **Đánh giá cạnh tranh** (so sánh công ty)
- **Phân tích SWOT** (điểm mạnh, yếu, cơ hội, thách thức)

## Khái Niệm Học Được
✓ **Radar Chart** (Spider Chart) - Biểu đồ hình nhện  
✓ Phân tích đa chiều  
✓ So sánh profile của nhiều đối tượng  
✓ Xác định điểm mạnh/yếu  
✓ AVERAGE, MIN, MAX, STDEV  
✓ INDEX/MATCH để tìm giá trị cực trị  
✓ Khi nào dùng radar chart  
