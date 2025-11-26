const puppeteer = require('puppeteer');

(async () => {
    console.log('=== Testing Data Persistence with Sheet Tab ===\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
    });

    const page = await browser.newPage();
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push(msg.text());
        if (msg.text().includes('loadCSV') || msg.text().includes('AUTO-SAVE')) {
            console.log('[BROWSER]', msg.text());
        }
    });

    try {
        const url = 'https://dulieu.truyenthong.edu.vn/test_auto_save_123';
        console.log('Navigating to:', url);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        await delay(3000);

        console.log('Page loaded. Clicking Sheet tab to ensure we see data...\n');

        // Click Sheet tab to ensure we're on the right tab
        const sheetTabClicked = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.tab, [role="tab"], .SocialCalc-toplevel-tabname'));
            const sheetTab = tabs.find(t => t.textContent.trim().toLowerCase() === 'sheet');
            if (sheetTab) {
                sheetTab.click();
                return true;
            }
            return false;
        });

        console.log('Sheet tab clicked:', sheetTabClicked);
        await delay(2000);

        // Get actual cell text from spreadsheet
        const cellData = await page.evaluate(() => {
            const results = {};

            // Try to get SocialCalc control
            const ctrl = window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject &&
                window.SocialCalc.GetSpreadsheetControlObject();

            if (ctrl && ctrl.sheet && ctrl.sheet.cells) {
                results.fromSocialCalc = {};
                const cells = ctrl.sheet.cells;
                // Get first few cells
                ['A1', 'B1', 'C1', 'D1', 'E1', 'A2', 'B2', 'C2'].forEach(coord => {
                    if (cells[coord]) {
                        results.fromSocialCalc[coord] = cells[coord].datavalue || cells[coord].valueformat;
                    }
                });
            }

            // Also try DOM
            results.fromDOM = [];
            const domCells = Array.from(document.querySelectorAll('.SocialCalc-cell'));
            domCells.slice(0, 10).forEach(cell => {
                const text = cell.textContent.trim();
                if (text && !text.includes('Sheet') && !text.includes('Edit')) {
                    results.fromDOM.push(text);
                }
            });

            return results;
        });

        console.log('\n=== CELL DATA ===');
        console.log('From SocialCalc object:', JSON.stringify(cellData.fromSocialCalc, null, 2));
        console.log('From DOM:', cellData.fromDOM.slice(0, 10));

        console.log('\n=== RESULT ===');
        const hasData = cellData.fromSocialCalc && (
            cellData.fromSocialCalc['A1'] || cellData.fromDOM.length > 0
        );

        if (hasData && (cellData.fromSocialCalc['A1'] === 'TT' || cellData.fromDOM.some(d => d === 'TT'))) {
            console.log('✅ SUCCESS: Data persisted and loaded correctly!');
            console.log('Found header: TT (A1)');
        } else if (hasData) {
            console.log('⚠️  PARTIAL: Data exists but may not be correct');
            console.log('Expected A1 to be "TT", got:', cellData.fromSocialCalc['A1']);
        } else {
            console.log('❌ FAILURE: No data found');
        }

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    } finally {
        await browser.close();
        console.log('\nBrowser closed');
    }
})();
