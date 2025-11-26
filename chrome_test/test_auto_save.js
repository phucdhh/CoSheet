const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('Starting auto-save test...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Create a test CSV file
        const testCSV = 'Name,Age,Score\nAlice,25,95\nBob,30,87\nCharlie,28,92';
        const csvPath = '/tmp/test_data.csv';
        fs.writeFileSync(csvPath, testCSV);
        console.log('Created test CSV file');

        // Navigate to a new spreadsheet
        const testRoom = 'test_save_' + Date.now();
        const url = 'http://localhost:1234/' + testRoom;
        console.log('Navigating to: ' + url);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        await delay(3000);

        // Take screenshot to see what's on the page
        await page.screenshot({ path: '/root/.gemini/antigravity/brain/b6170282-98a0-461f-bde6-9e4227df7ec6/page_loaded.png' });
        console.log('Page loaded screenshot saved');

        // Try to find all possible buttons
        const buttons = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="file"]'));
            return allButtons.map((btn, idx) => ({
                index: idx,
                id: btn.id || '',
                class: btn.className || '',
                text: btn.textContent ? btn.textContent.trim().substring(0, 30) : '',
                type: btn.tagName
            }));
        });

        console.log('Found buttons/controls:');
        console.log(JSON.stringify(buttons, null, 2));

        // Find file input directly
        const fileInput = await page.$('input[type="file"]');
        if (!fileInput) {
            console.error('File input not found!');
            await browser.close();
            return;
        }

        console.log('Found file input, uploading CSV...');
        await fileInput.uploadFile(csvPath);
        console.log('File uploaded');

        // Wait for import to complete
        await delay(3000);

        // Screenshot before refresh
        await page.screenshot({ path: '/root/.gemini/antigravity/brain/b6170282-98a0-461f-bde6-9e4227df7ec6/before_refresh.png' });
        console.log('Before refresh screenshot saved');

        // Check for data
        const dataBefore = await page.evaluate(() => {
            const cells = Array.from(document.querySelectorAll('td'));
            return cells.slice(0, 10).map(c => c.textContent.trim()).filter(t => t.length > 0);
        });
        console.log('Data before refresh:', dataBefore);

        // Wait for auto-save
        console.log('Waiting for auto-save (5 seconds total)...');
        await delay(5000);

        // Refresh
        console.log('Refreshing page...');
        await page.reload({ waitUntil: 'networkidle0' });
        await delay(3000);

        // Screenshot after refresh
        await page.screenshot({ path: '/root/.gemini/antigravity/brain/b6170282-98a0-461f-bde6-9e4227df7ec6/after_refresh.png' });
        console.log('After refresh screenshot saved');

        // Check for data after refresh
        const dataAfter = await page.evaluate(() => {
            const cells = Array.from(document.querySelectorAll('td'));
            return cells.slice(0, 10).map(c => c.textContent.trim()).filter(t => t.length > 0);
        });
        console.log('Data after refresh:', dataAfter);

        // Results
        console.log('\n=== TEST RESULTS ===');
        if (dataAfter.length > 0 && (dataAfter.includes('Name') || dataAfter.includes('Alice'))) {
            console.log('✅ SUCCESS: Data persisted after refresh!');
            console.log('Found data:', dataAfter.slice(0, 5));
        } else {
            console.log('❌ FAILURE: Data was lost after refresh!');
            console.log('Expected data like ["Name", "Age", "Score", "Alice", ...]');
            console.log('Got:', dataAfter);
        }

    } catch (error) {
        console.error('Test error:', error.message);
        console.error(error.stack);
        await page.screenshot({ path: '/root/.gemini/antigravity/brain/b6170282-98a0-461f-bde6-9e4227df7ec6/error.png' });
    } finally {
        await browser.close();
        console.log('\nBrowser closed');
    }
})();
