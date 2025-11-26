const puppeteer = require('puppeteer');

(async () => {
    console.log('=== Testing Data Persistence After Refresh ===\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
    });

    const page = await browser.newPage();
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const url = 'https://dulieu.truyenthong.edu.vn/test_auto_save_123';
        console.log('Navigating to:', url);
        console.log('(This room should have saved CSV data)\n');

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        await delay(3000);

        console.log('Page loaded. Checking for data...\n');

        // Get cell values
        const cellData = await page.evaluate(() => {
            const cells = [];
            // Try to find cells with data
            const allCells = Array.from(document.querySelectorAll('td'));
            for (let i = 0; i < Math.min(20, allCells.length); i++) {
                const text = allCells[i].textContent.trim();
                if (text && text.length > 0 && !text.includes('Sheet') && !text.includes('Edit')) {
                    cells.push(text);
                }
            }
            return cells;
        });

        console.log('Cell data found:', cellData);
        console.log('\n=== RESULT ===');

        if (cellData.length > 0 && (cellData.includes('TT') || cellData.includes('Loại') || cellData.includes('Doanh số'))) {
            console.log('✅ SUCCESS: Data persisted after refresh!');
            console.log('Found data:', cellData.slice(0, 5));
        } else {
            console.log('❌ FAILURE: Data was NOT loaded from Redis');
            console.log('Expected to find: TT, Loại, Doanh số, Chi phí');
            console.log('Got:', cellData);
        }

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    } finally {
        await browser.close();
        console.log('\nBrowser closed');
    }
})();
