const XLSX = require('xlsx');
const fs = require('fs');

// Mock SocialCalc helper functions
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

// The function to test
function sheet_to_socialcalc(ws) {
    var parts = [];
    parts.push('version:1.5');

    if (!ws || !ws['!ref']) return parts.join('\n');

    var range = XLSX.utils.decode_range(ws['!ref']);
    var styles = {};
    var styleIndex = 1;

    for (var R = range.s.r; R <= range.e.r; ++R) {
        for (var C = range.s.c; C <= range.e.c; ++C) {
            var cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
            var cell = ws[cell_ref];
            if (!cell) continue;

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

    return parts.join('\n');
}

// Run test
try {
    console.log('Reading example.xlsx...');
    var wb = XLSX.readFile('example.xlsx');
    console.log('SheetNames:', wb.SheetNames);

    wb.SheetNames.forEach(function (name) {
        console.log('Converting sheet:', name);
        var ws = wb.Sheets[name];
        var save = sheet_to_socialcalc(ws);
        console.log('Save length:', save.length);
        console.log('First 200 chars:', save.substring(0, 200));
        console.log('Last 100 chars:', save.substring(save.length - 100));
    });
} catch (e) {
    console.error('Error:', e);
}
