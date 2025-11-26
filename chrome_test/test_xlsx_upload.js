// test_xlsx_upload.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('=== Testing XLSX Upload ===');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    // Capture console messages from the page
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('[PAGE ERROR]', msg.text());
        } else {
            console.log('[PAGE LOG]', msg.text());
        }
    });

    // Navigate to EtherCalc instance
    await page.goto('http://192.168.1.223:1234/', { waitUntil: 'networkidle2' });

    // Wait for the custom file input to be present
    await page.waitForSelector('#custom-upload-input');

    const filePath = path.resolve(__dirname, 'test.xlsx');
    // Ensure file exists
    if (!fs.existsSync(filePath)) {
        console.error('Test XLSX file not found at', filePath);
        await browser.close();
        return;
    }

    const input = await page.$('#custom-upload-input');
    await input.uploadFile(filePath);
    console.log('Uploaded file, waiting for processing...');

    // Wait for possible dialogs or errors
    await new Promise(r => setTimeout(r, 10000));

    // Take a screenshot for debugging
    await page.screenshot({ path: path.join(__dirname, 'upload_result.png'), fullPage: true });
    console.log('Screenshot saved');

    await browser.close();
})();
