// generate_large_xlsx.js
const XLSX = require('xlsx');
const fs = require('fs');

// Create a workbook with large data
const wb = XLSX.utils.book_new();
const ws_data = [];

// Generate 50,000 rows of data
for (let i = 0; i < 50000; i++) {
    ws_data.push([
        i,
        'Data ' + i,
        Math.random(),
        new Date(),
        'Long string content to increase file size ' + i
    ]);
}

const ws = XLSX.utils.aoa_to_sheet(ws_data);
XLSX.utils.book_append_sheet(wb, ws, 'LargeSheet');

// Write to file
XLSX.writeFile(wb, 'large_test.xlsx');
console.log('large_test.xlsx generated');
