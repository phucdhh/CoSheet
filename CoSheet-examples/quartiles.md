# Tứ Phân Vị - Quartiles & Box Plot

## Mục Đích
Tập dữ liệu này chứa 100 giá trị để thực hành phân tích **tứ phân vị** (quartiles). Dữ liệu này giúp bạn:
- Hiểu khái niệm **Q1, Q2 (Median), Q3**
- Tính **IQR** (Interquartile Range - Khoảng tứ phân vị)
- Nhận biết outliers bằng phương pháp IQR
- Chuẩn bị dữ liệu cho **Box Plot**

## Cấu Trúc Dữ Liệu
- **Biến (Value)**: Giá trị số thực
- **Số dòng**: 101 (1 header + 100 dữ liệu)
- **Phân phối**: Tương đối đều trong khoảng 12-36

## Thực Hành Trên CoSheet

### 1. Tính Tứ Phân Vị

**Q1 (Tứ phân vị thứ nhất - 25th percentile)**:
```
=QUARTILE(A2:A101, 1)
```
25% dữ liệu nhỏ hơn Q1

**Q2 (Trung vị - 50th percentile)**:
```
=QUARTILE(A2:A101, 2)
```
hoặc `=MEDIAN(A2:A101)`

**Q3 (Tứ phân vị thứ ba - 75th percentile)**:
```
=QUARTILE(A2:A101, 3)
```
75% dữ liệu nhỏ hơn Q3

### 2. Tính IQR (Interquartile Range)
```
=QUARTILE(A2:A101, 3) - QUARTILE(A2:A101, 1)
```
**Ý nghĩa**: IQR chứa 50% dữ liệu ở giữa, là thước đo độ phân tán bền vững

### 3. Nhận Biết Outliers Bằng IQR

**Ngưỡng dưới (Lower Fence)**:
```
=QUARTILE(A2:A101, 1) - 1.5 * (QUARTILE(A2:A101, 3) - QUARTILE(A2:A101, 1))
```

**Ngưỡng trên (Upper Fence)**:
```
=QUARTILE(A2:A101, 3) + 1.5 * (QUARTILE(A2:A101, 3) - QUARTILE(A2:A101, 1))
```

Đếm outliers:
```
=COUNTIF(A2:A101, "<"&Lower_Fence) + COUNTIF(A2:A101, ">"&Upper_Fence)
```

### 4. Tính Min và Max (Không Bao Gồm Outliers)

Nếu có outliers, Min/Max thực tế cho Box Plot là:
- **Min (whisker)**: Giá trị nhỏ nhất >= Lower Fence
- **Max (whisker)**: Giá trị lớn nhất <= Upper Fence

### 5. 5-Number Summary cho Box Plot

| Thống kê | Công thức | Giá trị |
|----------|-----------|---------|
| Minimum  | =MIN(A2:A101) | ? |
| Q1       | =QUARTILE(A2:A101, 1) | ? |
| Median (Q2) | =MEDIAN(A2:A101) | ? |
| Q3       | =QUARTILE(A2:A101, 3) | ? |
| Maximum  | =MAX(A2:A101) | ? |
| IQR      | =Q3 - Q1 | ? |

### 6. Phân Tích Phân Phối

So sánh khoảng cách:
- **(Q2 - Q1) vs (Q3 - Q2)**: Nếu bằng nhau → đối xứng
- Nếu (Q3 - Q2) > (Q2 - Q1) → lệch phải
- Nếu (Q3 - Q2) < (Q2 - Q1) → lệch trái

### 7. Tạo Box Plot (Nâng Cao)
1. Tính 5-number summary
2. Chuyển sang tab **Graph**
3. Chọn loại biểu đồ phù hợp (hoặc vẽ thủ công bằng cột/thanh)

## Khái Niệm Học Được
✓ **Quartiles** - Tứ phân vị (Q1, Q2, Q3)  
✓ **IQR** - Khoảng tứ phân vị  
✓ **QUARTILE function** - Hàm tính tứ phân vị  
✓ **Outlier detection** - Phát hiện ngoại lai bằng IQR  
✓ **5-Number Summary** - Tóm tắt 5 số  
✓ **Box Plot** - Biểu đồ hộp  
✓ Phân tích độ lệch qua quartiles  
