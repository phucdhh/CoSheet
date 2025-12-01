# CoSheet Export Features

## Tổng quan

CoSheet hỗ trợ export bảng tính sang nhiều định dạng khác nhau thông qua module `cosheet-export.js`.

## Các định dạng hỗ trợ

### 1. **TSV (Tab-Separated Values)**
- **Mô tả**: Export dữ liệu dạng text với các cột phân cách bằng tab
- **Sử dụng**: Tương thích với Excel, Google Sheets, và các text editor
- **Đặc điểm**: 
  - Giữ nguyên giá trị dữ liệu
  - Tự động escape tab và newline trong text
  - File nhẹ, dễ xử lý

### 2. **HTML (HyperText Markup Language)**
- **Mô tả**: Export thành bảng HTML hoàn chỉnh với CSS styling
- **Sử dụng**: Có thể mở trực tiếp trong browser, embed vào website
- **Đặc điểm**:
  - Bảng có border và styling đẹp mắt
  - Header row có background màu xám
  - Số được align phải tự động
  - Responsive, in-được
  - Chứa metadata (timestamp export)

### 3. **PDF (Portable Document Format)**
- **Mô tả**: Export thành file PDF chuyên nghiệp
- **Công nghệ**: Sử dụng pdfMake library (load động từ CDN)
- **Đặc điểm**:
  - Tự động chọn orientation (Portrait/Landscape) dựa vào số cột
  - Header row bold với background màu
  - Zebra striping (màu xen kẽ giữa các row)
  - Số align phải, text align trái
  - Có tiêu đề và footer timestamp
  - Chất lượng in cao

### 4. **ODS (OpenDocument Spreadsheet)**
- **Trạng thái**: Đang phát triển
- **Workaround hiện tại**: Dùng XLSX export (tương thích LibreOffice/OpenOffice)
- **Kế hoạch**: Implement full ODS bằng JSZip + XML generation

## Cách sử dụng

### Từ UI:
1. Click vào Sheet tab
2. Click nút **Export**
3. Chọn định dạng mong muốn (HTML, TSV, PDF, ODS)
4. File sẽ tự động download

### Từ JavaScript API:
```javascript
// TSV Export
window.CoSheetExport.exportTSV();

// HTML Export  
window.CoSheetExport.exportHTML();

// PDF Export
window.CoSheetExport.exportPDF();

// ODS Export (hiện tại hiển thị thông báo)
window.CoSheetExport.exportODS();
```

### Từ Event Listeners:
```javascript
// Dispatch custom events
window.dispatchEvent(new Event('ec-export-tsv-request'));
window.dispatchEvent(new Event('ec-export-html-request'));
window.dispatchEvent(new Event('ec-export-pdf-request'));
window.dispatchEvent(new Event('ec-export-ods-request'));
```

## Kiến trúc kỹ thuật

### Module: `cosheet-export.js`

**Các hàm chính:**

#### `getSpreadsheetData()`
- Truy xuất dữ liệu từ SocialCalc
- Tìm range thực tế của data (maxRow, maxCol)
- Trả về object chứa cells, attributes, và dimensions

#### `getCellValue(cells, coord, formatted)`
- Lấy giá trị cell theo coordinate
- Hỗ trợ formatted value hoặc raw value
- Handle empty cells gracefully

#### `exportTSV()`
- Generate TSV content từ spreadsheet data
- Escape special characters (tab, newline)
- Tạo Blob và trigger download

#### `exportHTML()`
- Build complete HTML document với CSS
- Tạo table structure với proper semantic HTML
- Apply styling: borders, zebra striping, number alignment
- Escape HTML entities để tránh XSS

#### `exportPDF()`
- Load pdfMake dynamically nếu chưa có
- Convert spreadsheet data → pdfMake table structure
- Configure PDF layout:
  - Page orientation tự động
  - Cell formatting (bold, alignment, colors)
  - Table layout (borders, padding)
- Generate và download PDF

#### `loadPdfMake()`
- Load pdfMake từ CDN (cdnjs.cloudflare.com)
- Load cả pdfmake.min.js và vfs_fonts.js
- Return Promise để xử lý async

## Dependencies

### Runtime (Browser):
- **SocialCalc**: Core spreadsheet engine
- **pdfMake** (CDN): PDF generation (loaded on-demand)
- **vfs_fonts.js** (CDN): Fonts cho pdfMake

### NPM (Server-side, future):
- `pdfmake`: ^0.2.7
- `jszip`: ^3.10.1 (cho ODS implementation)

## File structure

```
/root/ethercalc/
├── static/
│   ├── cosheet-export.js        # Main export module
│   ├── sheet-layout.js           # UI integration
│   ├── topmenu-save-handler.js  # Save/Export handlers
│   └── ...
├── index.html                    # Include cosheet-export.js
└── chrome_test/
    ├── test_export_features.js   # Automated test
    ├── demo_export.js            # Interactive demo
    └── downloads/                # Downloaded files
```

## Testing

### Automated test:
```bash
cd /root/ethercalc/chrome_test
node test_export_features.js
```

### Interactive demo:
```bash
cd /root/ethercalc/chrome_test
node demo_export.js
```

## Browser compatibility

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **pdfMake**: IE11+ (với polyfills)
- **Download API**: Tất cả modern browsers

## Known limitations

1. **ODS**: Chưa implement, hiện dùng XLSX làm workaround
2. **PDF fonts**: Chỉ hỗ trợ Roboto (default của pdfMake)
3. **Large datasets**: PDF có thể chậm với >1000 rows (do render time)
4. **Formulas**: Export giá trị đã tính, không export formula expression

## Roadmap

### Phase 1: ✅ Hoàn thành
- [x] TSV export
- [x] HTML export with styling
- [x] PDF export with pdfMake
- [x] Dynamic pdfMake loading

### Phase 2: 🚧 Đang phát triển
- [ ] ODS full implementation với JSZip
- [ ] Export cell styles (colors, fonts, borders)
- [ ] Export merged cells
- [ ] Chart/Graph export trong PDF

### Phase 3: 📋 Kế hoạch
- [ ] Excel-compatible XML format (.xml)
- [ ] Markdown table export
- [ ] LaTeX table export
- [ ] Server-side export API (không cần browser)

## Performance notes

- **TSV**: Rất nhanh (~1ms cho 100 rows)
- **HTML**: Nhanh (~5ms cho 100 rows)
- **PDF**: Chậm hơn (~500ms cho 100 rows do rendering)
- **ODS**: N/A (chưa implement)

## Security considerations

- **HTML export**: Escape tất cả user input để tránh XSS
- **PDF**: pdfMake load từ trusted CDN (cdnjs.cloudflare.com)
- **Download**: Sử dụng Blob URL (tự động revoke sau download)
- **No server-side processing**: Tất cả xử lý ở client-side

## Troubleshooting

### PDF không download
- Kiểm tra console log: có thể pdfMake chưa load xong
- Thử lại sau 2-3 giây
- Check browser popup blocker

### HTML/TSV file rỗng
- Kiểm tra có data trong spreadsheet không
- Verify SocialCalc đã load (`window.SocialCalc`)

### ODS hiện thông báo "under development"
- Đây là behavior mong đợi
- Dùng XLSX export thay thế (Save > XLSX)

## Support

Nếu gặp vấn đề, kiểm tra:
1. Browser console log
2. `/root/ethercalc/chrome_test/test_export_features.js` output
3. Module loaded: `window.CoSheetExport` should exist

## License

Same as CoSheet project license.
