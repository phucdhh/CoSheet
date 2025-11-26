// test_large_xlsx_upload.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('=== Testing LARGE XLSX Upload ===');
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--js-flags=--max-old-space-size=4096'
        ]
    });
    const page = await browser.newPage();

    // Capture console messages from the page
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`[PAGE ${type.toUpperCase()}]`, text);
    });

    // Capture page errors
    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.toString());
    });

    // Navigate to EtherCalc instance
    console.log('Navigating to EtherCalc...');
    await page.goto('http://192.168.1.223:1234/', { waitUntil: 'networkidle2' });

    // Wait for the custom file input to be present
    await page.waitForSelector('#custom-upload-input', { timeout: 10000 });

    const filePath = path.resolve(__dirname, 'large_test.xlsx');
    // Ensure file exists
    if (!fs.existsSync(filePath)) {
        console.error('Test XLSX file not found at', filePath);
        await browser.close();
        return;
    }

    const stats = fs.statSync(filePath);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    const input = await page.$('#custom-upload-input');
    console.log('Uploading large file...');
    await input.uploadFile(filePath);
    console.log('File uploaded, waiting for processing...');

    // Wait longer for large file processing
    await new Promise(r => setTimeout(r, 30000));

    // Check if there are any Vex dialogs showing errors
    const errorDialog = await page.evaluate(() => {
        const dialogs = document.querySelectorAll('.vex-dialog-message');
        if (dialogs.length > 0) {
            return Array.from(dialogs).map(d => d.textContent).join('; ');
        }
        return null;
    });

    if (errorDialog) {
        console.log('[ERROR DIALOG DETECTED]', errorDialog);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: path.join(__dirname, 'large_upload_result.png'), fullPage: true });
    console.log('Screenshot saved');

    await browser.close();
})();
