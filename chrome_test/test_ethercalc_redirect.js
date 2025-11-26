const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// File log
const logFile = path.join(__dirname, 'ethercalc_test.log');

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(message);
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Capture console logs from the page
    page.on('console', msg => {
        logToFile(`PAGE LOG: ${msg.text()}`);
    });

    // Track requests
    page.on('request', request => {
        logToFile(`REQUEST: ${request.method()} ${request.url()}`);
    });

    // Track responses
    page.on('response', response => {
        logToFile(`RESPONSE: ${response.status()} ${response.url()}`);
    });

    // Track page errors
    page.on('pageerror', err => {
        logToFile(`PAGE_ERROR: ${err.toString()}`);
    });

    try {
        logToFile('========================================');
        logToFile('Testing EtherCalc Homepage Redirect');
        logToFile('========================================');

        // Navigate to homepage
        logToFile('Navigating to: http://192.168.1.223:1234/');
        const initialUrl = 'http://192.168.1.223:1234/';

        await page.goto(initialUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait a bit for any JavaScript redirects
        await new Promise(r => setTimeout(r, 3000));

        // Get final URL after redirect
        const finalUrl = page.url();
        logToFile(`Initial URL: ${initialUrl}`);
        logToFile(`Final URL after redirect: ${finalUrl}`);

        // Check if redirect happened
        if (finalUrl !== initialUrl) {
            logToFile('✓ REDIRECT SUCCESSFUL!');

            // Extract room ID from URL
            const match = finalUrl.match(/\/([\w]+)(?:\?|$)/);
            if (match) {
                logToFile(`✓ Redirected to room: ${match[1]}`);
            }
        } else {
            logToFile('✗ NO REDIRECT - Still on homepage');
        }

        // Take a screenshot
        const screenshotPath = path.join(__dirname, 'ethercalc_screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        logToFile(`Screenshot saved to: ${screenshotPath}`);

        // Check page title
        const title = await page.title();
        logToFile(`Page title: ${title}`);

        // Check if spreadsheet interface is loaded
        const hasSpreadsheet = await page.evaluate(() => {
            return !!document.getElementById('tableeditor');
        });
        logToFile(`Spreadsheet interface loaded: ${hasSpreadsheet}`);

        logToFile('========================================');
        logToFile('Test completed successfully!');
        logToFile('========================================');

    } catch (err) {
        logToFile(`ERROR: ${err.message}`);
        console.error('Error during test:', err);
    }

    await browser.close();
})();
