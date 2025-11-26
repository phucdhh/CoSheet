const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('=== Testing Auto-Save After CSV Import ===\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        console.log('[BROWSER]', text);
    });

    try {
        // Create test CSV
        const testCSV = 'Name,Age,City\nAlice,25,NYC\nBob,30,LA\nCharlie,28,SF';
        const csvPath = '/tmp/test_autosave.csv';
        fs.writeFileSync(csvPath, testCSV);
        console.log('✓ Created test CSV file\n');

        // Navigate to spreadsheet
        const testRoom = 'test_csv_' + Date.now();
        const url = 'http://localhost:1234/' + testRoom;
        console.log('Navigating to:', url);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        await delay(2000);
        console.log('✓ Page loaded\n');

        // Find and upload CSV
        const fileInput = await page.$('input[type="file"]');
        if (!fileInput) {
            throw new Error('File input not found');
        }

        console.log('Uploading CSV file...');
        await fileInput.uploadFile(csvPath);
        console.log('✓ File uploaded\n');

        // Wait and collect logs
        console.log('Waiting 5 seconds for import and auto-save...\n');
        await delay(5000);

        // Check what happened
        console.log('\n=== CONSOLE LOG ANALYSIS ===');

        const traceLogs = consoleLogs.filter(log => log.includes('[TRACE]'));
        const autoSaveLogs = consoleLogs.filter(log => log.includes('Auto-save'));

        console.log('\n[TRACE] logs found:', traceLogs.length);
        traceLogs.forEach(log => console.log('  -', log));

        console.log('\nAuto-save logs found:', autoSaveLogs.length);
        autoSaveLogs.forEach(log => console.log('  -', log));

        // Check for data in cells
        const hasData = await page.evaluate(() => {
            const cells = Array.from(document.querySelectorAll('td'));
            const cellTexts = cells.map(c => c.textContent.trim()).filter(t => t.length > 0);
            return cellTexts.some(text => text === 'Name' || text === 'Alice' || text === 'Bob');
        });

        console.log('\nData loaded in cells:', hasData ? 'YES ✓' : 'NO ✗');

        // Verdict
        console.log('\n=== VERDICT ===');
        if (traceLogs.length === 0) {
            console.log('❌ PROBLEM: No [TRACE] logs → CSV import code path not executed');
            console.log('   Possible causes:');
            console.log('   1. Browser cached old JS file');
            console.log('   2. File went through different import path (maybe XLSX?)');
            console.log('   3. Event listener not attached');
        } else if (autoSaveLogs.length === 0) {
            console.log('⚠️  PROBLEM: [TRACE] logs present but no Auto-save logs');
            console.log('   → setTimeout not executing OR autoSaveToServer undefined');
        } else {
            console.log('✓ Auto-save function was called!');
            if (autoSaveLogs.some(log => log.includes('✅ Successfully saved'))) {
                console.log('✓✓ And it saved successfully!');
            }
        }

        // Save full log
        fs.writeFileSync('/root/.gemini/antigravity/brain/b6170282-98a0-461f-bde6-9e4227df7ec6/console_log.txt',
            'ALL CONSOLE LOGS:\n' + consoleLogs.join('\n'));
        console.log('\nFull console log saved to console_log.txt');

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    } finally {
        await browser.close();
        console.log('\nBrowser closed');
    }
})();
