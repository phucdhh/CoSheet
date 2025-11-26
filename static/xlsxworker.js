/* xlsxworker.js */
importScripts('./xlsx.core.min.js');

// Send init message when worker script loads
postMessage({ t: 'init', d: 'Worker script loaded' });

var global_wb;

onmessage = function (evt) {
  var data = evt.data;

  try {
    switch (data.action) {
      case 'read':
        postMessage({ t: 'status', d: 'Đang đọc dữ liệu file...' });

        var data_obj;
        var type = 'array'; // Default type

        try {
          // Check if data.file is provided (File object)
          if (data.file) {
            var reader = new FileReaderSync();
            var arrayBuffer = reader.readAsArrayBuffer(data.file);
            // Convert ArrayBuffer to Uint8Array for XLSX
            data_obj = new Uint8Array(arrayBuffer);
            type = 'array';
          } else if (data.d) {
            // Legacy support for direct data transfer
            data_obj = data.d;
            type = data.b ? 'binary' : 'base64';
          } else {
            throw new Error('No file data provided');
          }
        } catch (e) {
          throw new Error('Error reading file in worker: ' + e.message);
        }

        postMessage({ t: 'status', d: 'Đang phân tích workbook (có thể mất chút thời gian)...' });
        global_wb = XLSX.read(data_obj, { type: type });

        postMessage({ t: 'status', d: 'Đang tạo metadata...' });
        // Extract metadata
        var metadata = {
          SheetNames: global_wb.SheetNames,
          Sheets: {}
        };

        global_wb.SheetNames.forEach(function (name) {
          var sheet = global_wb.Sheets[name];
          metadata.Sheets[name] = {
            '!ref': sheet['!ref']
          };
        });

        postMessage({ t: 'ready', metadata: metadata });
        break;

      case 'convert':
        if (!global_wb) throw new Error('Workbook not loaded');
        postMessage({ t: 'status', d: 'Đang chuyển đổi sang định dạng SocialCalc...' });

        var save;
        if (data.sheetName) {
          // Single sheet mode
          save = workbook_to_socialcalc(global_wb, [data.sheetName]);
        } else {
          // All sheets merged
          save = workbook_to_socialcalc(global_wb, global_wb.SheetNames);
        }

        postMessage({ t: 'socialcalc', save: save });
        break;

      case 'convert_multi':
        if (!global_wb) throw new Error('Workbook not loaded');
        postMessage({ t: 'status', d: 'Đang chuẩn bị chuyển đổi các sheet...' });

        var sheets = [];
        global_wb.SheetNames.forEach(function (name, idx) {
          var ws = global_wb.Sheets[name];
          // Granular update for each sheet
          postMessage({ t: 'status', d: 'Đang chuyển đổi sheet ' + (idx + 1) + '/' + global_wb.SheetNames.length + ': ' + name + '...' });
          var save = sheet_to_socialcalc(ws); // Convert single sheet
          sheets.push({ name: name, save: save });
        });

        postMessage({ t: 'socialcalc_multi', sheets: sheets });
        break;

      case 'cleanup':
        global_wb = null;
        postMessage({ t: 'cleaned' });
        break;

      default:
        // Legacy support or error
        postMessage({ t: 'e', d: 'Unknown action' });
    }
  } catch (e) {
    console.error('Worker error:', e);
    postMessage({ t: 'e', d: e.stack || e.message || e });
  }
};

// Convert a single sheet to SocialCalc format
function sheet_to_socialcalc(ws) {
  var parts = [];
  parts.push('version:1.5');

  if (!ws || !ws['!ref']) {

    return parts.join('\n');
  }

  var range = XLSX.utils.decode_range(ws['!ref']);


  var styles = {};
  var styleIndex = 1;
  var cellCount = 0;

  for (var R = range.s.r; R <= range.e.r; ++R) {
    for (var C = range.s.c; C <= range.e.c; ++C) {
      var cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
      var cell = ws[cell_ref];
      if (!cell) continue;

      cellCount++;
      if (cellCount <= 5) {

      }

      var coord = SocialCalc_crToCoord(C + 1, R + 1);
      var cellParts = ['cell', coord];

      // Value and Type handling
      if (cell.t === 'n') {
        cellParts.push('v', cell.v);
      } else if (cell.t === 'b') {
        cellParts.push('v', cell.v ? 1 : 0, 'vt', 'logical');
      } else if (cell.t === 'e') {
        cellParts.push('e', SocialCalc_encodeForSave(cell.v));
      } else {
        cellParts.push('t', SocialCalc_encodeForSave(cell.v));
      }

      // Style handling
      if (cell.s) {
        var styleStr = '';
        if (cell.s.font) {
          if (cell.s.font.bold) styleStr += 'font-weight:bold;';
          if (cell.s.font.italic) styleStr += 'font-style:italic;';
          if (cell.s.font.color && cell.s.font.color.rgb) styleStr += 'color:#' + cell.s.font.color.rgb + ';';
        }
        if (cell.s.fill && cell.s.fill.fgColor && cell.s.fill.fgColor.rgb) {
          styleStr += 'background-color:#' + cell.s.fill.fgColor.rgb + ';';
        }
        if (cell.s.alignment && cell.s.alignment.horizontal) {
          styleStr += 'text-align:' + cell.s.alignment.horizontal + ';';
        }

        if (styleStr) {
          var foundIndex = -1;
          for (var id in styles) {
            if (styles[id] === styleStr) {
              foundIndex = id;
              break;
            }
          }
          if (foundIndex === -1) {
            foundIndex = styleIndex++;
            styles[foundIndex] = styleStr;
          }
          cellParts.push('s', foundIndex);
        }
      }

      parts.push(cellParts.join(':'));
    }
  }

  // Append styles
  for (var id in styles) {
    parts.push('style:' + id + ':' + styles[id]);
  }

  // Sheet dimensions
  parts.push('sheet:c:' + (range.e.c - range.s.c + 1) + ':r:' + (range.e.r - range.s.r + 1));

  var result = parts.join('\n');

  return result;
}

function workbook_to_socialcalc(wb, sheetNames) {
  var parts = [];
  parts.push('version:1.5');

  var styles = {};
  var styleIndex = 1;
  var currentRowOffset = 0;
  var maxCol = 0;

  sheetNames.forEach(function (sheetName) {
    var ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) return;

    var range = XLSX.utils.decode_range(ws['!ref']);

    // Add a header for the sheet name
    var headerCoord = SocialCalc_crToCoord(1, currentRowOffset + 1);
    parts.push('cell:' + headerCoord + ':t:' + SocialCalc_encodeForSave('--- Sheet: ' + sheetName + ' ---') + ':s:1'); // Style 1 reserved for header? Or just let it be normal.
    // Let's not assume style 1. Just text.

    // Update maxCol
    if (range.e.c + 1 > maxCol) maxCol = range.e.c + 1;

    for (var R = range.s.r; R <= range.e.r; ++R) {
      for (var C = range.s.c; C <= range.e.c; ++C) {
        var cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        var cell = ws[cell_ref];
        if (!cell) continue;

        // Adjust Row by offset (+1 for header, +1 for 1-based index)
        var actualRow = R + currentRowOffset + 2;
        var coord = SocialCalc_crToCoord(C + 1, actualRow);
        var cellParts = ['cell', coord];

        // Value and Type handling
        if (cell.t === 'n') {
          cellParts.push('v', cell.v);
        } else if (cell.t === 'b') {
          cellParts.push('v', cell.v ? 1 : 0, 'vt', 'logical');
        } else if (cell.t === 'e') {
          cellParts.push('e', SocialCalc_encodeForSave(cell.v));
        } else {
          cellParts.push('t', SocialCalc_encodeForSave(cell.v));
        }

        // Style handling
        if (cell.s) {
          var styleStr = '';
          if (cell.s.font) {
            if (cell.s.font.bold) styleStr += 'font-weight:bold;';
            if (cell.s.font.italic) styleStr += 'font-style:italic;';
            if (cell.s.font.color && cell.s.font.color.rgb) styleStr += 'color:#' + cell.s.font.color.rgb + ';';
          }
          if (cell.s.fill && cell.s.fill.fgColor && cell.s.fill.fgColor.rgb) {
            styleStr += 'background-color:#' + cell.s.fill.fgColor.rgb + ';';
          }
          if (cell.s.alignment && cell.s.alignment.horizontal) {
            styleStr += 'text-align:' + cell.s.alignment.horizontal + ';';
          }

          if (styleStr) {
            var foundIndex = -1;
            for (var id in styles) {
              if (styles[id] === styleStr) {
                foundIndex = id;
                break;
              }
            }
            if (foundIndex === -1) {
              foundIndex = styleIndex++;
              styles[foundIndex] = styleStr;
            }
            cellParts.push('s', foundIndex);
          }
        }

        parts.push(cellParts.join(':'));
      }
    }

    // Update offset: Height of sheet + 2 (1 for header, 1 for spacing)
    currentRowOffset += (range.e.r - range.s.r + 1) + 2;
  });

  // Append styles
  for (var id in styles) {
    parts.push('style:' + id + ':' + styles[id]);
  }

  // Sheet dimensions
  parts.push('sheet:c:' + maxCol + ':r:' + currentRowOffset);

  return parts.join('\n');
}

// Helper: Column/Row to A1 coordinate
function SocialCalc_crToCoord(c, r) {
  return SocialCalc_rcColname(c) + r;
}

function SocialCalc_rcColname(c) {
  var s = '';
  c--;
  do {
    s = String.fromCharCode(65 + (c % 26)) + s;
    c = Math.floor(c / 26) - 1;
  } while (c >= 0);
  return s;
}

function SocialCalc_encodeForSave(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/\\/g, '\\b')
    .replace(/:/g, '\\c')
    .replace(/\n/g, '\\n');
}
