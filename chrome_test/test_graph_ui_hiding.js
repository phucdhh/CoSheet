const puppeteer = require('puppeteer');

async function testGraphTabUIHiding() {
    console.log('Testing Graph Tab UI - Formula Bar Hiding and Spreadsheet Visibility...');

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

        // Navigate to EtherCalc
        console.log('Navigating to EtherCalc...');
        await page.goto('http://127.0.0.1:1234/test_graph_ui', { waitUntil: 'networkidle0' });

        // Wait for SocialCalc to load
        await page.waitForFunction(() => window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject, { timeout: 10000 });

        // Add some test data
        console.log('Adding test data...');
        await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const sheet = spreadsheet.sheet;

            const data = [
                ['Month', 'Sales'],
                ['Jan', 100],
                ['Feb', 150],
                ['Mar', 120]
            ];

            data.forEach((row, rowIdx) => {
                row.forEach((val, colIdx) => {
                    const cell = sheet.GetAssuredCell(SocialCalc.crToCoord(colIdx + 1, rowIdx + 1));
                    cell.datavalue = val;
                    cell.datatype = typeof val === 'number' ? 'v' : 't';
                    cell.valuetype = typeof val === 'number' ? 'n' : 't';
                });
            });

            spreadsheet.editor.ScheduleRender();
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Test 1: Check formula bar is visible in Sheet tab
        console.log('\n====== TEST 1: Formula Bar Visible in Sheet Tab ======');
        const formulaBarVisibleInSheet = await page.evaluate(() => {
            const formulabarDiv = document.querySelector('[id$="formulabarDiv"]');
            const searchbar = document.getElementById('searchbar');

            return {
                formulaBar: formulabarDiv ? {
                    exists: true,
                    display: window.getComputedStyle(formulabarDiv).display,
                    visible: formulabarDiv.offsetParent !== null
                } : { exists: false },
                searchBar: searchbar ? {
                    exists: true,
                    display: window.getComputedStyle(searchbar).display,
                    visible: searchbar.offsetParent !== null
                } : { exists: false }
            };
        });

        console.log('Formula Bar in Sheet tab:', formulaBarVisibleInSheet.formulaBar);
        console.log('Search Bar in Sheet tab:', formulaBarVisibleInSheet.searchBar);

        if (!formulaBarVisibleInSheet.formulaBar.visible) {
            throw new Error('❌ Formula bar should be visible in Sheet tab!');
        }
        if (!formulaBarVisibleInSheet.searchBar.visible) {
            throw new Error('❌ Search bar should be visible in Sheet tab!');
        }
        console.log('✅ Formula bar and search bar are visible in Sheet tab');

        // Test 2: Click Graph tab and check formula bar is hidden
        console.log('\n====== TEST 2: Formula Bar Hidden in Graph Tab ======');
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 300));

        const formulaBarHiddenInGraph = await page.evaluate(() => {
            const formulabarDiv = document.querySelector('[id$="formulabarDiv"]');
            const searchbar = document.getElementById('searchbar');

            return {
                formulaBar: formulabarDiv ? {
                    exists: true,
                    display: window.getComputedStyle(formulabarDiv).display,
                    visible: formulabarDiv.offsetParent !== null
                } : { exists: false },
                searchBar: searchbar ? {
                    exists: true,
                    display: window.getComputedStyle(searchbar).display,
                    visible: searchbar.offsetParent !== null
                } : { exists: false }
            };
        });

        console.log('Formula Bar in Graph tab:', formulaBarHiddenInGraph.formulaBar);
        console.log('Search Bar in Graph tab:', formulaBarHiddenInGraph.searchBar);

        if (formulaBarHiddenInGraph.formulaBar.visible) {
            throw new Error('❌ Formula bar should be HIDDEN in Graph tab!');
        }
        if (formulaBarHiddenInGraph.searchBar.visible) {
            throw new Error('❌ Search bar should be HIDDEN in Graph tab!');
        }
        console.log('✅ Formula bar and search bar are hidden in Graph tab');

        // Test 3: Check spreadsheet is visible in Graph tab
        console.log('\n====== TEST 3: Spreadsheet Visible in Graph Tab ======');
        const spreadsheetVisibleInGraph = await page.evaluate(() => {
            const spreadsheet = window.spreadsheet;
            if (!spreadsheet || !spreadsheet.editorDiv) {
                return { exists: false };
            }

            const editorDiv = spreadsheet.editorDiv;
            return {
                exists: true,
                display: window.getComputedStyle(editorDiv).display,
                visible: editorDiv.offsetParent !== null,
                inGraphPanel: document.getElementById('graph-spreadsheet-panel')?.contains(editorDiv)
            };
        });

        console.log('Spreadsheet in Graph tab:', spreadsheetVisibleInGraph);

        if (!spreadsheetVisibleInGraph.visible) {
            throw new Error('❌ Spreadsheet should be visible in Graph tab!');
        }
        console.log('✅ Spreadsheet is visible in Graph tab');

        // Test 4: Switch to Sheet tab and verify formula bar is restored
        console.log('\n====== TEST 4: Formula Bar Restored When Leaving Graph Tab ======');
        await page.click('#SocialCalc-sheettab, #SocialCalc-id-sheettab');
        await new Promise(resolve => setTimeout(resolve, 300));

        const formulaBarRestoredInSheet = await page.evaluate(() => {
            const formulabarDiv = document.querySelector('[id$="formulabarDiv"]');
            const searchbar = document.getElementById('searchbar');

            return {
                formulaBar: formulabarDiv ? {
                    exists: true,
                    display: window.getComputedStyle(formulabarDiv).display,
                    visible: formulabarDiv.offsetParent !== null
                } : { exists: false },
                searchBar: searchbar ? {
                    exists: true,
                    display: window.getComputedStyle(searchbar).display,
                    visible: searchbar.offsetParent !== null
                } : { exists: false }
            };
        });

        console.log('Formula Bar after returning to Sheet:', formulaBarRestoredInSheet.formulaBar);
        console.log('Search Bar after returning to Sheet:', formulaBarRestoredInSheet.searchBar);

        if (!formulaBarRestoredInSheet.formulaBar.visible) {
            throw new Error('❌ Formula bar should be visible again in Sheet tab!');
        }
        if (!formulaBarRestoredInSheet.searchBar.visible) {
            throw new Error('❌ Search bar should be visible again in Sheet tab!');
        }
        console.log('✅ Formula bar and search bar are restored in Sheet tab');

        // Test 5: Return to Graph tab and verify spreadsheet is still visible
        console.log('\n====== TEST 5: Spreadsheet Persists When Returning to Graph Tab ======');
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 300));

        const spreadsheetVisibleOnReturn = await page.evaluate(() => {
            const spreadsheet = window.spreadsheet;
            if (!spreadsheet || !spreadsheet.editorDiv) {
                return { exists: false };
            }

            const editorDiv = spreadsheet.editorDiv;
            return {
                exists: true,
                display: window.getComputedStyle(editorDiv).display,
                visible: editorDiv.offsetParent !== null,
                inGraphPanel: document.getElementById('graph-spreadsheet-panel')?.contains(editorDiv)
            };
        });

        console.log('Spreadsheet on return to Graph tab:', spreadsheetVisibleOnReturn);

        if (!spreadsheetVisibleOnReturn.visible) {
            throw new Error('❌ Spreadsheet should STILL be visible when returning to Graph tab!');
        }
        console.log('✅ Spreadsheet persists and is visible when returning to Graph tab');

        // Test 6: Verify formula bar is hidden again in Graph tab
        const formulaBarHiddenAgain = await page.evaluate(() => {
            const formulabarDiv = document.querySelector('[id$="formulabarDiv"]');
            const searchbar = document.getElementById('searchbar');

            return {
                formulaBar: formulabarDiv ? {
                    visible: formulabarDiv.offsetParent !== null
                } : { exists: false },
                searchBar: searchbar ? {
                    visible: searchbar.offsetParent !== null
                } : { exists: false }
            };
        });

        if (formulaBarHiddenAgain.formulaBar.visible) {
            throw new Error('❌ Formula bar should be hidden again in Graph tab!');
        }
        if (formulaBarHiddenAgain.searchBar.visible) {
            throw new Error('❌ Search bar should be hidden again in Graph tab!');
        }
        console.log('✅ Formula bar and search bar are hidden again in Graph tab');

        // Take final screenshot
        await page.screenshot({ path: 'graph_ui_test.png', fullPage: true });
        console.log('\n✅ All tests passed! Screenshot saved.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testGraphTabUIHiding();
