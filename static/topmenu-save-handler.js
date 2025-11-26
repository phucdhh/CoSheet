(function () {
  // Handler that listens for save requests from the top menu and performs exports
  function download(data, filename, type) {
    var blob = new Blob([data], { type: type || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  }

  function getControl() {
    try {
      if (window.SocialCalc && typeof SocialCalc.GetSpreadsheetControlObject === 'function') {
        return SocialCalc.GetSpreadsheetControlObject();
      }
    } catch (e) { }
    if (window.ss) return window.ss;
    return null;
  }

  function defaultFilename(ext) {
    var name = (document.title && document.title.replace(/\s+/g, '_')) || (location.pathname.replace(/\//g, '_') || 'sheet');
    name = name.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    return name + (ext.charAt(0) === '.' ? ext : ('.' + ext));
  }

  // Auto-save spreadsheet to server (fixes data loss on refresh)
  function autoSaveToServer() {
    console.log('Auto-save: Function called');
    var ctrl = getControl();
    if (!ctrl) {
      console.warn('Auto-save: No control object found');
      return;
    }

    try {
      // Get the current room/document ID from URL
      var room = window.location.pathname.split('/').filter(Boolean).pop() || 'sheet';
      console.log('Auto-save: Room ID:', room);

      // Create snapshot
      var snapshot = null;
      if (typeof ctrl.CreateSpreadsheetSave === 'function') {
        console.log('Auto-save: Using CreateSpreadsheetSave');
        snapshot = ctrl.CreateSpreadsheetSave();
      } else if (ctrl.sheet && typeof ctrl.sheet.CreateSheetSave === 'function') {
        console.log('Auto-save: Using CreateSheetSave (wrapping)');
        // For sheet-only save, wrap it in spreadsheet format
        var sheetSave = ctrl.sheet.CreateSheetSave();
        snapshot = 'socialcalc:version:1.0\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n# SocialCalc Spreadsheet Control Save\nversion:1.0\npart:sheet\npart:edit\npart:audit\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n' + sheetSave + '\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\nversion:1.0\nrowpane:0:1:14\ncolpane:0:1:16\necell:A1\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n--SocialCalcSpreadsheetControlSave--\n';
      }

      if (!snapshot) {
        console.warn('Auto-save: Could not create snapshot');
        return;
      }

      console.log('Auto-save: Snapshot created, length:', snapshot.length);
      console.log('Auto-save: First 200 chars:', snapshot.substring(0, 200));

      // Send to server
      fetch('/_/' + encodeURIComponent(room), {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/x-socialcalc'
        },
        body: snapshot
      })
        .then(function (response) {
          if (response.ok) {
            console.log('Auto-save: ✅ Successfully saved to server');
          } else {
            console.error('Auto-save: ❌ Server returned error:', response.status, response.statusText);
            return response.text().then(function (text) {
              console.error('Auto-save: Response body:', text);
            });
          }
        })
        .catch(function (error) {
          console.error('Auto-save: ❌ Failed to save to server:', error);
        });
    } catch (err) {
      console.error('Auto-save: ❌ Exception occurred:', err);
    }
  }

  function exportSave(format) {
    var ctrl = getControl();
    if (!ctrl) { alert('No open sheet detected to save.'); return; }

    try {
      var save = null;
      if (typeof ctrl.CreateSheetSave === 'function') save = ctrl.CreateSheetSave();
      else if (ctrl.sheet && typeof ctrl.sheet.CreateSheetSave === 'function') save = ctrl.sheet.CreateSheetSave();
      else if (typeof window.ss !== 'undefined' && typeof window.ss.CreateSheetSave === 'function') save = window.ss.CreateSheetSave();

      if (!save) { alert('Unable to create sheet save from current editor.'); return; }

      format = (format || 'csv').toLowerCase();
      if (format === 'csv') {
        var csv = SocialCalc.ConvertSaveToOtherFormat(save, 'csv');
        download(csv, defaultFilename('csv'), 'text/csv;charset=utf-8');
      } else if (format === 'scsave') {
        download(save, defaultFilename('scsave'), 'text/x-socialcalc;charset=utf-8');
      } else if (format === 'html') {
        var html = SocialCalc.ConvertSaveToOtherFormat(save, 'html');
        // wrap minimal HTML if necessary
        if (!/^\s*<html/i.test(html)) html = '<!doctype html>\n<html><head><meta charset="utf-8"><title>' + (document.title || 'sheet') + '</title></head><body>' + html + '</body></html>';
        download(html, defaultFilename('html'), 'text/html;charset=utf-8');
      } else if (format === 'xlsx') {
        if (typeof XLSX === 'undefined') {
          alert('XLSX export requires the SheetJS library; it is not loaded. Saving as CSV instead.');
          var csv = SocialCalc.ConvertSaveToOtherFormat(save, 'csv');
          download(csv, defaultFilename('csv'), 'text/csv;charset=utf-8');
          return;
        }
        try {
          var csv = SocialCalc.ConvertSaveToOtherFormat(save, 'csv');
          var ws = XLSX.utils.csv_to_sheet(csv);
          var wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
          download(s2ab(wbout), defaultFilename('xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          return;
        } catch (e) { console.error(e); alert('XLSX export failed: ' + e.message); }
      } else {
        alert('Unknown export format: ' + format);
      }
    } catch (err) { console.error(err); alert('Export error: ' + err.message); }
  }

  // Listen for save requests dispatched by the menu
  window.addEventListener('ec-save-request', function () { exportSave('csv'); }, false);

  // Handler for XLSX export with formatting preservation
  function exportSaveXLSX() {
    var ctrl = getControl();
    if (!ctrl) { alert('No open sheet detected to save.'); return; }

    if (typeof XLSX === 'undefined') {
      alert('XLSX export requires the SheetJS library; it is not loaded.');
      return;
    }

    try {
      var sheet = ctrl.sheet;
      var ws = {};
      var range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } };
      var hasData = false;

      for (var coord in sheet.cells) {
        var cell = sheet.cells[coord];
        if (!cell) continue;

        var cr = SocialCalc.coordToCr(coord);
        var r = cr.row - 1;
        var c = cr.col - 1;

        hasData = true;
        if (r < range.s.r) range.s.r = r;
        if (c < range.s.c) range.s.c = c;
        if (r > range.e.r) range.e.r = r;
        if (c > range.e.c) range.e.c = c;

        var cellData = { v: cell.datavalue, t: 's' };

        // Determine type
        if (cell.valuetype === 'n' || (typeof cell.datavalue === 'number')) {
          cellData.t = 'n';
          cellData.v = parseFloat(cell.datavalue);
        }

        // Handle styles (Best effort mapping from SocialCalc CSS string to SheetJS style object)
        if (cell.style && sheet.styles[cell.style]) {
          var styleStr = sheet.styles[cell.style];
          var s = {};

          // Font
          if (styleStr.indexOf('font-weight:bold') !== -1) { if (!s.font) s.font = {}; s.font.bold = true; }
          if (styleStr.indexOf('font-style:italic') !== -1) { if (!s.font) s.font = {}; s.font.italic = true; }

          // Color
          var color = styleStr.match(/color\s*:\s*(#[0-9a-fA-F]+|[a-z]+)/);
          if (color) { if (!s.font) s.font = {}; s.font.color = { rgb: color[1].replace('#', '') }; }

          // Background
          var bg = styleStr.match(/background-color\s*:\s*(#[0-9a-fA-F]+|[a-z]+)/);
          if (bg) { if (!s.fill) s.fill = {}; s.fill.fgColor = { rgb: bg[1].replace('#', '') }; }

          // Alignment
          var align = styleStr.match(/text-align\s*:\s*(left|center|right)/);
          if (align) { if (!s.alignment) s.alignment = {}; s.alignment.horizontal = align[1]; }

          if (Object.keys(s).length > 0) cellData.s = s;
        }

        var cellRef = XLSX.utils.encode_cell({ c: c, r: r });
        ws[cellRef] = cellData;
      }

      if (!hasData) range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };
      ws['!ref'] = XLSX.utils.encode_range(range);

      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      download(s2ab(wbout), defaultFilename('xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    } catch (e) { console.error(e); alert('XLSX export failed: ' + e.message); }
  }

  // Listen for XLSX save request
  window.addEventListener('ec-save-xlsx-request', function () { exportSaveXLSX(); }, false);

  // Provide a Save As UI on clicking the Save As menu item (if present)
  function attachSaveAs() {
    var el = document.getElementById('ec-saveas');
    if (!el) return;
    el.addEventListener('click', function (ev) {
      ev.preventDefault();
      // simple prompt for format
      var fmt = prompt('Save As format (csv, scsave, html, xlsx)', 'csv');
      if (fmt) exportSave(fmt.trim().toLowerCase());
    });
  }

  // Also provide a fallback Save click handler if the menu didn't dispatch the event
  function attachSave() {
    var el = document.getElementById('ec-save');
    if (!el) return;
    el.addEventListener('click', function (ev) {
      // allow the existing topmenu behavior which dispatches ec-save-request; nothing to do here
    });
  }

  // Wire file open input on editor pages so the Open menu works
  function attachFileInput() {
    var input = document.getElementById('__fileopen_input');
    if (!input) return;
    input.addEventListener('change', function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (!f) return;
      // If SheetJS is present and the file is a spreadsheet, parse it and import into the current sheet.
      var reader = new FileReader();
      var isBinary = /\.xlsx$|\.xlsm$|\.xlsb$|\.xls$|\.ods$/i.test(f.name);
      if (isBinary && typeof XLSX !== 'undefined') {
        reader.onload = function (e) {
          try {
            var data = e.target.result;
            var wb = XLSX.read(data, { type: 'array' });
            var first = wb.SheetNames[0];
            var csv = XLSX.utils.sheet_to_csv(wb.Sheets[first]);
            var save = SocialCalc.ConvertOtherFormatToSave(csv, 'csv');
            var ctrl = getControl();
            if (ctrl && typeof ctrl.ParseSheetSave === 'function') {
              ctrl.ParseSheetSave(save);
              // Auto-save to server after import
              setTimeout(autoSaveToServer, 1500);
            } else if (ctrl && ctrl.sheet && typeof ctrl.sheet.ParseSheetSave === 'function') {
              ctrl.sheet.ParseSheetSave(save);
              // Auto-save to server after import
              setTimeout(autoSaveToServer, 500);
            } else {
              alert('Could not import into the editor.');
            }
          } catch (err) { console.error(err); alert('Error importing file: ' + err.message); }
        };
        reader.readAsArrayBuffer(f);
        return;
      }

      // fallback: text (CSV or socialcalc save)
      reader.onload = function (e) {
        var text = e.target.result;
        try {
          if (/^socialcalc:version/i.test(text)) {
            var ctrl = getControl();
            if (ctrl && typeof ctrl.ParseSheetSave === 'function') {
              ctrl.ParseSheetSave(text);
              // Auto-save to server after import
              console.log('[TRACE] About to call setTimeout for autoSaveToServer (socialcalc format)');
              setTimeout(autoSaveToServer, 1500);
              return;
            }
          }
          // CSV -> convert and load
          console.log('[TRACE] CSV detected, converting...');
          if (/^\s*[^\n,\r]+,/.test(text) || /^\s*[^\n\t]+\t/.test(text)) {
            var save = SocialCalc.ConvertOtherFormatToSave(text, 'csv');
            console.log('[TRACE] CSV converted, save length:', save ? save.length : 0);
            var ctrl = getControl();
            if (ctrl && typeof ctrl.ParseSheetSave === 'function') {
              console.log('[TRACE] About to ParseSheetSave for CSV');
              ctrl.ParseSheetSave(save);
              // Auto-save to server after import
              console.log('[TRACE] About to call setTimeout for autoSaveToServer (CSV format)');
              setTimeout(autoSaveToServer, 1500);
              return;
            }
          }
        } catch (err) { console.error(err); }
        alert('Opening files directly into an editor is limited. Use the start page upload flow for complex formats.');
      };
      reader.readAsText(f);
    }, false);
  }

  // DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { attachSaveAs(); attachSave(); attachFileInput(); });
  else { attachSaveAs(); attachSave(); attachFileInput(); }

})();
