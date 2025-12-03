# Biểu Đồ Cột Nhóm & Xếp Chồng - Grouped & Stacked Bar Charts

## Mục Đích
Tập dữ liệu này chứa doanh số 4 quý của 100 phòng ban/danh mục sản phẩm. Dữ liệu này giúp bạn:
- Hiểu cách tạo **Grouped Bar Chart** (cột nhóm)
- Hiểu cách tạo **Stacked Bar Chart** (cột xếp chồng)
- So sánh **nhiều series** (Q1, Q2, Q3, Q4) cùng lúc
- Phân tích xu hướng theo thời gian và theo danh mục

## Cấu Trúc Dữ Liệu
- **Biến 1 (Department)**: Tên phòng ban/sản phẩm
- **Biến 2-5**: Doanh số Q1, Q2, Q3, Q4
- **Số dòng**: 101 (1 header + 100 dữ liệu)
- **Đặc điểm**: Q4 thường cao hơn (mùa lễ hội)

## Thực Hành Trên CoSheet

### 1. Tạo Grouped Bar Chart

**Chọn một nhóm nhỏ** (ví dụ 10 phòng ban đầu tiên):
1. Chọn vùng A1:E11
2. Chuyển sang tab **Graph**
3. Chọn **Grouped Bar Chart**
4. Quan sát: Mỗi phòng ban có 4 cột (Q1-Q4) xếp cạnh nhau

**Ưu điểm**:
- Dễ so sánh các quý với nhau cho từng phòng ban
- Dễ thấy xu hướng tăng/giảm theo thời gian

**Nhược điểm**:
- Khó thấy tổng doanh số cả năm

### 2. Tạo Stacked Bar Chart

**Với cùng dữ liệu** (A1:E11):
1. Chuyển sang tab **Graph**
2. Chọn **Stacked Bar Chart**
3. Quan sát: Mỗi phòng ban có 1 cột duy nhất, chia thành 4 phần (Q1-Q4) xếp chồng lên nhau

**Ưu điểm**:
- Dễ thấy tổng doanh số cả năm của mỗ phòng ban
- Dễ so sánh tổng doanh số giữa các phòng ban
- Vẫn thấy được tỷ lệ mỗi quý đóng góp

**Nhược điểm**:
- Khó so sánh chính xác giá trị của Q2, Q3 giữa các phòng ban (vì không cùng baseline)

### 3. Khi Nào Dùng Grouped vs Stacked?

| Tiêu chí | Grouped Bar | Stacked Bar |
|----------|-------------|-------------|
| **Mục đích** | So sánh từng series | Xem tổng + tỷ lệ |
| **Ưu điểm** | Dễ so sánh chính xác | Tiết kiệm không gian |
| **Nhược điểm** | Chiếm nhiều không gian | Khó so sánh series giữa các nhóm |
| **Khi nào dùng** | Khi series là ưu tiên | Khi tổng là quan trọng |

### 4. Phân Tích Tổng Doanh Số Cả Năm

Tạo cột tổng (cột F):
```
F2: =SUM(B2:E2)
```
Kéo xuống đến F101.

**Tìm phòng ban có doanh số cao nhất**:
```
=MAX(F2:F101)
=INDEX(A2:A101, MATCH(MAX(F2:F101), F2:F101, 0))
```

### 5. Phân Tích Theo Quý

**Quý nào có doanh số cao nhất?**
```
Tổng Q1: =SUM(B2:B101)
Tổng Q2: =SUM(C2:C101)
Tổng Q3: =SUM(D2:D101)
Tổng Q4: =SUM(E2:E101)
```

**Trung bình mỗi quý**:
```
=AVERAGE(B2:B101)  ← Q1
=AVERAGE(C2:C101)  ← Q2
...
```

### 6. Phân Tích Tăng Trưởng

**Tăng trưởng từ Q1 đến Q4**:
- Tạo cột G: `=(E2-B2)/B2*100`  ← % tăng trưởng
- Phòng ban nào tăng trưởng mạnh nhất?

**Tăng trưởng từng quý**:
- Q1→Q2: `=(C2-B2)/B2*100`
- Q2→Q3: `=(D2-C2)/C2*100`
- Q3→Q4: `=(E2-D2)/D2*100`

### 7. Phân Tích Mùa Vụ

Một số phòng ban có **mùa vụ rõ rệt**:
- **Toys**: Q4 rất cao (mùa Giáng Sinh)
- **Gifts**: Q4 cao (lễ hội)
- **Party Supplies**: Q4 cao
- **School Supplies**: Q3 cao (mùa tựu trường)

Tính **tỷ lệ Q4/tổng năm**:
```
=E2/SUM(B2:E2)*100
```
Nếu > 30% → phụ thuộc mạnh vào Q4

### 8. Tạo Biểu Đồ 100% Stacked

Để xem **tỷ lệ %** mỗi quý đóng góp (thay vì giá trị tuyệt đối):
- Tính % cho mỗi cell:
  - H2: `=B2/SUM(B2:E2)*100` ← % Q1
  - I2: `=C2/SUM(B2:E2)*100` ← % Q2
  - J2: `=D2/SUM(B2:E2)*100` ← % Q3
  - K2: `=E2/SUM(B2:E2)*100` ← % Q4
- Vẽ stacked bar chart với dữ liệu %

### 9. Ví Dụ Phân Tích Cụ Thể

**Electronics Department** (dòng 2):
- Q1: 45,000
- Q2: 52,000 (+15.6%)
- Q3: 48,000 (-7.7%)
- Q4: 61,000 (+27.1%)
- **Tổng**: 206,000
- **Xu hướng**: Tăng dần, Q4 cao nhất

## Khái Niệm Học Được
✓ **Grouped Bar Chart** - Biểu đồ cột nhóm  
✓ **Stacked Bar Chart** - Biểu đồ cột xếp chồng  
✓ **100% Stacked Bar** - Xếp chồng theo %  
✓ So sánh nhiều series cùng lúc  
✓ Phân tích tăng trưởng theo thời gian  
✓ Phân tích mùa vụ (seasonality)  
✓ SUM, AVERAGE, % calculations  
✓ Khi nào dùng grouped vs stacked  
