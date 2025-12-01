const XLSX = require('xlsx');

// Create a new workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Sales Data
const sheet1Data = [
    ['Product', 'Quantity', 'Price', 'Total'],
    ['Laptop', 10, 1000, '=B2*C2'],
    ['Mouse', 50, 25, '=B3*C3'],
    ['Keyboard', 30, 75, '=B4*C4'],
    ['Monitor', 15, 300, '=B5*C5']
];
const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
XLSX.utils.book_append_sheet(wb, ws1, 'Sales Data');

// Sheet 2: Employees
const sheet2Data = [
    ['Name', 'Department', 'Salary', 'Years'],
    ['John Doe', 'IT', 50000, 5],
    ['Jane Smith', 'HR', 45000, 3],
    ['Bob Johnson', 'Sales', 55000, 7],
    ['Alice Williams', 'IT', 60000, 8]
];
const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
XLSX.utils.book_append_sheet(wb, ws2, 'Employees');

// Sheet 3: Summary
const sheet3Data = [
    ['Report', 'Q1 2024'],
    ['', ''],
    ['Total Sales', 12500],
    ['Total Employees', 4],
    ['Average Salary', 52500],
    ['', ''],
    ['Status', 'Active']
];
const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

// Write to file
XLSX.writeFile(wb, 'test_multisheet.xlsx');

console.log('✅ Created test_multisheet.xlsx with 3 sheets:');
console.log('  1. Sales Data (5 rows × 4 cols)');
console.log('  2. Employees (5 rows × 4 cols)');
console.log('  3. Summary (7 rows × 2 cols)');
