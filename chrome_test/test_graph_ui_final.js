const puppeteer = require('puppeteer');

async function testGraphTabUISimplified() {
    console.log('Testing Graph Tab UI - Search Box Hiding and Spreadsheet Visibility...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('[CoSheet]') && !text.includes('Manifest')) {
                console.log('PAGE LOG:', text);
            }
        });

        console.log('Navigating to EtherCalc...');
        await page.goto('http://127.0.0.1:1234/test_graph_simplified', { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject, { timeout: 10000 });

        // Add test data
        console.log('Adding test data...');
        await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const sheet = spreadsheet.sheet;

            ['Jan', 'Feb', 'Mar'].forEach((month, idx) => {
                const cell = sheet.GetAssuredCell(`A${idx + 1}`);
                cell.datavalue = month;
                cell.datatype = 't';
                cell.valuetype = 't';
            });

            [100, 150, 120].forEach((val, idx) => {
                const cell = sheet.GetAssuredCell(`B${idx + 1}`);
                cell.datavalue = val;
                cell.datatype = 'v';
                cell.valuetype = 'n';
            });

            spreadsheet.editor.ScheduleRender();
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Test 1: Search bar visible in Sheet tab
        console.log('\n====== TEST 1: Search Bar Visible in Sheet Tab ======');
        const searchVisibleInSheet = await page.evaluate(() => {
            const searchbar = document.getElementById('searchbar');
            return searchbar ? {
                exists: true,
                display: window.getComputedStyle(searchbar).display,
                visible: searchbar.offsetParent !== null
            } : { exists: false };
        });

        console.log('Search Bar in Sheet tab:', searchVisibleInSheet);
        if (!searchVisibleInSheet.visible) {
            throw new Error('❌ Search bar should be visible in Sheet tab!');
        }
        console.log('✅ Search bar is visible in Sheet tab');

        // Test 2: Click Graph tab
        console.log('\n====== TEST 2: Search Bar Hidden in Graph Tab ======');
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 300));

        const searchHiddenInGraph = await page.evaluate(() => {
            const searchbar = document.getElementById('searchbar');
            return searchbar ? {
                exists: true,
                display: window.getComputedStyle(searchbar).display,
                visible: searchbar.offsetParent !== null
            } : { exists: false };
        });

        console.log('Search Bar in Graph tab:', searchHiddenInGraph);
        if (searchHiddenInGraph.visible) {
            throw new Error('❌ Search bar should be HIDDEN in Graph tab!');
        }
        console.log('✅ Search bar is hidden in Graph tab');

        // Test 3: Spreadsheet visible in Graph tab
        console.log('\n====== TEST 3: Spreadsheet Visible in Graph Tab ======');
        const spreadsheetInGraph = await page.evaluate(() => {
            const spreadsheet = window.spreadsheet;
            if (!spreadsheet || !spreadsheet.editorDiv) {
                return { exists: false };
            }

            return {
                exists: true,
                display: window.getComputedStyle(spreadsheet.editorDiv).display,
                visible: spreadsheet.editorDiv.offsetParent !== null
            };
        });

        console.log('Spreadsheet in Graph tab:', spreadsheetInGraph);
        if (!spreadsheetInGraph.visible) {
            throw new Error('❌ Spreadsheet should be visible in Graph tab!');
        }
        console.log('✅ Spreadsheet is visible in Graph tab');

        // Test 4: Switch back to Sheet tab
        console.log('\n====== TEST 4: Search Bar Restored in Sheet Tab ======');
        await page.click('#SocialCalc-sheettab, #SocialCalc-id-sheettab');
        await new Promise(resolve => setTimeout(resolve, 300));

        const searchRestoredInSheet = await page.evaluate(() => {
            const searchbar = document.getElementById('searchbar');
            return searchbar ? {
                display: window.getComputedStyle(searchbar).display,
                visible: searchbar.offsetParent !== null
            } : { exists: false };
        });

        console.log('Search Bar after returning to Sheet:', searchRestoredInSheet);
        if (!searchRestoredInSheet.visible) {
            throw new Error('❌ Search bar should be visible again in Sheet tab!');
        }
        console.log('✅ Search bar is restored in Sheet tab');

        // Test 5: Return to Graph tab - spreadsheet should persist
        console.log('\n====== TEST 5: Spreadsheet Persists When Returning to Graph ======');
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 300));

        const spreadsheetPersists = await page.evaluate(() => {
            const spreadsheet = window.spreadsheet;
            if (!spreadsheet || !spreadsheet.editorDiv) {
                return { exists: false };
            }

            return {
                exists: true,
                display: window.getComputedStyle(spreadsheet.editorDiv).display,
                visible: spreadsheet.editorDiv.offsetParent !== null
            };
        });

        console.log('Spreadsheet on return to Graph:', spreadsheetPersists);
        if (!spreadsheetPersists.visible) {
            throw new Error('❌ CRITICAL: Spreadsheet disappeared when returning to Graph tab!');
        }
        console.log('✅ Spreadsheet persists and is visible when returning to Graph tab');

        // Take screenshot
        await page.screenshot({ path: 'graph_ui_final_test.png', fullPage: true });
        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testGraphTabUISimplified();
