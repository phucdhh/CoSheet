/**
 * CoSheet Export Module
 * Handles export to various formats: ODS, TSV, HTML, PDF
 * 
 * Dependencies:
 * - SocialCalc (required)
 * - pdfMake (lazy loaded on demand when PDF export is requested)
 * - vfs_fonts.js (lazy loaded with pdfMake)
 */

(function(window) {
  'use strict';

  const CoSheetExport = {
    
    /**
     * Get current spreadsheet data from SocialCalc
     */
    getSpreadsheetData: function() {
      const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
      if (!spreadsheet || !spreadsheet.sheet) {
        throw new Error('No spreadsheet data available');
      }
      
      const sheet = spreadsheet.sheet;
      const cells = sheet.cells;
      const attribs = sheet.attribs;
      
      // Find the actual range of data
      let maxRow = 0;
      let maxCol = 0;
      
      for (let coord in cells) {
        const cr = SocialCalc.coordToCr(coord);
        if (cr.row > maxRow) maxRow = cr.row;
        if (cr.col > maxCol) maxCol = cr.col;
      }
      
      return {
        sheet: sheet,
        cells: cells,
        attribs: attribs,
        maxRow: maxRow,
        maxCol: maxCol
      };
    },
    
    /**
     * Convert cell coordinate to human-readable format
     */
    coordToLabel: function(row, col) {
      return SocialCalc.crToCoord(col, row);
    },
    
    /**
     * Get cell value (formatted or raw)
     */
    getCellValue: function(cells, coord, formatted = true) {
      const cell = cells[coord];
      if (!cell) return '';
      
      if (formatted && cell.datavalue !== undefined) {
        return cell.datavalue;
      }
      
      return cell.datavalue || cell.datatype === 't' ? (cell.t || '') : '';
    },
    
    /**
     * Export to TSV (Tab-Separated Values)
     */
    exportTSV: function() {
      try {
        const data = this.getSpreadsheetData();
        const lines = [];
        
        // Generate TSV content
        for (let row = 1; row <= data.maxRow; row++) {
          const rowData = [];
          for (let col = 1; col <= data.maxCol; col++) {
            const coord = this.coordToLabel(row, col);
            let value = this.getCellValue(data.cells, coord, true);
            
            // Escape tabs and newlines
            value = String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
            rowData.push(value);
          }
          lines.push(rowData.join('\t'));
        }
        
        const tsvContent = lines.join('\n');
        
        // Download TSV file
        const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const room = location.pathname.slice(1).replace(/\//g, '_') || 'spreadsheet';
        link.setAttribute('href', url);
        link.setAttribute('download', room + '.tsv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('TSV export completed');
      } catch (e) {
        console.error('TSV export error:', e);
        alert('TSV export failed: ' + e.message);
      }
    },
    
    /**
     * Export to HTML
     */
    exportHTML: function() {
      try {
        const data = this.getSpreadsheetData();
        
        // Build HTML table
        let html = '<!DOCTYPE html>\n<html>\n<head>\n';
        html += '<meta charset="UTF-8">\n';
        html += '<title>CoSheet Export</title>\n';
        html += '<style>\n';
        html += 'body { font-family: Arial, sans-serif; margin: 20px; }\n';
        html += 'table { border-collapse: collapse; width: 100%; }\n';
        html += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n';
        html += 'th { background-color: #f2f2f2; font-weight: bold; }\n';
        html += 'tr:nth-child(even) { background-color: #f9f9f9; }\n';
        html += '.number { text-align: right; }\n';
        html += '</style>\n';
        html += '</head>\n<body>\n';
        html += '<h1>CoSheet Export</h1>\n';
        html += '<table>\n';
        
        // Generate table rows
        for (let row = 1; row <= data.maxRow; row++) {
          html += '  <tr>\n';
          for (let col = 1; col <= data.maxCol; col++) {
            const coord = this.coordToLabel(row, col);
            const cell = data.cells[coord];
            let value = this.getCellValue(data.cells, coord, true);
            
            // Escape HTML
            value = String(value)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
            
            // Determine cell type for styling
            const isNumber = cell && cell.datatype === 'v';
            const cellClass = isNumber ? ' class="number"' : '';
            const tag = row === 1 ? 'th' : 'td';
            
            html += `    <${tag}${cellClass}>${value}</${tag}>\n`;
          }
          html += '  </tr>\n';
        }
        
        html += '</table>\n';
        html += '<p><small>Exported from CoSheet on ' + new Date().toLocaleString() + '</small></p>\n';
        html += '</body>\n</html>';
        
        // Download HTML file
        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const room = location.pathname.slice(1).replace(/\//g, '_') || 'spreadsheet';
        link.setAttribute('href', url);
        link.setAttribute('download', room + '.html');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('HTML export completed');
      } catch (e) {
        console.error('HTML export error:', e);
        alert('HTML export failed: ' + e.message);
      }
    },
    
    /**
     * Export to PDF using pdfmake
     */
    exportPDF: function() {
      try {
        // Check if pdfMake is loaded, lazy load if needed
        if (typeof pdfMake === 'undefined') {
          console.log('[CoSheetExport] pdfMake not loaded yet, loading...');
          this.loadPdfMake().then(() => {
            this.exportPDF();
          }).catch(err => {
            console.error('[CoSheetExport] Failed to load pdfMake:', err);
            alert('Failed to load PDF library. Please try again.');
          });
          return;
        }
        
        const data = this.getSpreadsheetData();
        
        // Build table structure for pdfMake
        const tableBody = [];
        
        for (let row = 1; row <= data.maxRow; row++) {
          const rowData = [];
          for (let col = 1; col <= data.maxCol; col++) {
            const coord = this.coordToLabel(row, col);
            const cell = data.cells[coord];
            let value = this.getCellValue(data.cells, coord, true);
            
            // Format cell for PDF
            const cellConfig = {
              text: String(value),
              fontSize: row === 1 ? 10 : 9,
              bold: row === 1,
              fillColor: row === 1 ? '#f2f2f2' : (row % 2 === 0 ? '#f9f9f9' : null),
              alignment: cell && cell.datatype === 'v' ? 'right' : 'left'
            };
            
            rowData.push(cellConfig);
          }
          tableBody.push(rowData);
        }
        
        // Define PDF document
        const room = location.pathname.slice(1).replace(/\//g, '_') || 'spreadsheet';
        const docDefinition = {
          pageOrientation: data.maxCol > 8 ? 'landscape' : 'portrait',
          pageSize: 'A4',
          pageMargins: [40, 60, 40, 60],
          content: [
            {
              text: 'CoSheet Export',
              style: 'header',
              margin: [0, 0, 0, 20]
            },
            {
              table: {
                headerRows: 1,
                widths: Array(data.maxCol).fill('*'),
                body: tableBody
              },
              layout: {
                hLineWidth: function(i, node) { return 0.5; },
                vLineWidth: function(i, node) { return 0.5; },
                hLineColor: function(i, node) { return '#ddd'; },
                vLineColor: function(i, node) { return '#ddd'; }
              }
            },
            {
              text: 'Exported on ' + new Date().toLocaleString(),
              style: 'footer',
              margin: [0, 20, 0, 0]
            }
          ],
          styles: {
            header: {
              fontSize: 18,
              bold: true,
              color: '#333'
            },
            footer: {
              fontSize: 8,
              color: '#666',
              italics: true
            }
          }
        };
        
        // Generate and download PDF
        pdfMake.createPdf(docDefinition).download(room + '.pdf');
        console.log('PDF export completed');
        
      } catch (e) {
        console.error('PDF export error:', e);
        alert('PDF export failed: ' + e.message);
      }
    },
    
    /**
     * Load pdfMake library dynamically (lazy loading)
     * Only loads when user clicks Export > PDF
     */
    loadPdfMake: function() {
      return new Promise((resolve, reject) => {
        if (typeof pdfMake !== 'undefined') {
          resolve();
          return;
        }
        
        console.log('[CoSheetExport] Lazy loading pdfMake (2.1MB)...');
        
        // Load pdfMake from local static files
        const script1 = document.createElement('script');
        script1.src = './static/pdfmake.min.js';
        script1.onload = function() {
          const script2 = document.createElement('script');
          script2.src = './static/vfs_fonts.js';
          script2.onload = function() {
            console.log('[CoSheetExport] pdfMake lazy loaded successfully (2.1MB)');
            resolve();
          };
          script2.onerror = function() {
            console.error('[CoSheetExport] Failed to load vfs_fonts.js');
            reject(new Error('Failed to load vfs_fonts.js'));
          };
          document.head.appendChild(script2);
        };
        script1.onerror = function() {
          console.error('[CoSheetExport] Failed to load pdfmake.min.js');
          reject(new Error('Failed to load pdfmake.min.js'));
        };
        document.head.appendChild(script1);
      });
    },
    
    /**
     * Export to ODS (OpenDocument Spreadsheet)
     */
    exportODS: function() {
      try {
        alert('ODS export is under development.\n\nFor now, please use XLSX format (Save > XLSX) which can be opened in LibreOffice/OpenOffice.');
        
        // TODO: Implement ODS export using JSZip to create proper ODS structure
        // ODS format is a ZIP containing XML files (content.xml, styles.xml, meta.xml, etc.)
        
      } catch (e) {
        console.error('ODS export error:', e);
        alert('ODS export failed: ' + e.message);
      }
    }
  };
  
  // Expose to window
  window.CoSheetExport = CoSheetExport;
  
  // Register event listeners
  window.addEventListener('ec-export-tsv-request', function() {
    CoSheetExport.exportTSV();
  }, false);
  
  window.addEventListener('ec-export-html-request', function() {
    CoSheetExport.exportHTML();
  }, false);
  
  window.addEventListener('ec-export-pdf-request', function() {
    CoSheetExport.exportPDF();
  }, false);
  
  window.addEventListener('ec-export-ods-request', function() {
    CoSheetExport.exportODS();
  }, false);
  
  // console.log('[CoSheetExport] Module loaded');
  
})(window);
