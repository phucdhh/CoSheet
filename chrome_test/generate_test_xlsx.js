// generate_test_xlsx.js
const XLSX = require('xlsx');
const fs = require('fs');

// Create a workbook with some data
const wb = XLSX.utils.book_new();
const ws_data = [
    ['Header1', 'Header2', 'Header3'],
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];
const ws = XLSX.utils.aoa_to_sheet(ws_data);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

// Write to file
XLSX.writeFile(wb, 'test.xlsx');
console.log('test.xlsx generated');
