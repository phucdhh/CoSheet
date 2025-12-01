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
        console.log('[CONSOLE]', text);
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

    // Try to upload multi-sheet XLSX file
    console.log('Looking for file input...');
    const fileInput = await page.$('#sheet-file-input');
    if (fileInput) {
        console.log('Found file input, uploading multi-sheet XLSX...');
        const xlsxPath = path.resolve(__dirname, 'test_multisheet.xlsx');
        await fileInput.uploadFile(xlsxPath);

        console.log('File uploaded, waiting for processing...');

        // Listen for navigation to multi-view URL
        let redirectUrl = null;
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) {
                redirectUrl = frame.url();
                console.log('[NAVIGATION] Redirected to:', redirectUrl);
            }
        });

        // Wait for redirect (should go to /=roomId)
        await new Promise(resolve => setTimeout(resolve, 10000));

        if (redirectUrl && redirectUrl.includes('/=')) {
            console.log('✅ SUCCESS: Redirected to multi-view URL:', redirectUrl);

            // Take screenshot of multi-view
            await page.screenshot({
                path: 'multisheet_upload_result.png',
                fullPage: true
            });
            console.log('✅ Screenshot saved: multisheet_upload_result.png');

        } else {
            console.log('❌ FAIL: Did not redirect to multi-view URL');
            console.log('Current URL:', page.url());
        }

    } else {
        console.log('⚠️  File input not found');
    }

    await browser.close();
    console.log('Test completed!');
})();
