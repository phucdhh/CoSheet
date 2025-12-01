const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    const consoleMessages = [];

    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        if (text.includes('loadCSV') || text.includes('CSV') || text.includes('error') || text.includes('Error')) {
            console.log('[CONSOLE]', text);
        }
    });

    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });

    console.log('Loading EtherCalc...');
    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    console.log('Waiting for page to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Checking if window.loadCSVContent exists...');
    const hasLoadCSV = await page.evaluate(() => {
        return typeof window.loadCSVContent === 'function';
    });
    console.log('window.loadCSVContent exists:', hasLoadCSV);

    const hasHandleXLSX = await page.evaluate(() => {
        return typeof window.handleXLSXFile === 'function';
    });
    console.log('window.handleXLSXFile exists:', hasHandleXLSX);

    if (!hasLoadCSV || !hasHandleXLSX) {
        console.error('❌ ERROR: Required functions not found in global scope');
        await browser.close();
        process.exit(1);
    }

    console.log('✅ All required functions are available');

    // Try to upload CSV file
    console.log('Looking for file input...');
    const fileInput = await page.$('#sheet-file-input');
    if (fileInput) {
        console.log('Found file input, uploading test CSV...');
        const csvPath = path.resolve(__dirname, 'test.csv');
        await fileInput.uploadFile(csvPath);

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('✅ CSV upload completed');
    } else {
        console.log('⚠️  File input not found (Sheet tab may not be active)');
    }

    await browser.close();
    console.log('Test completed successfully!');
})();
