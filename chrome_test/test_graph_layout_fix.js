const puppeteer = require('puppeteer');

async function testGraphLayoutFix() {
    console.log('Testing Graph Layout Fix - Spreadsheet Position and UI Hiding...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        console.log('Navigating to EtherCalc...');
        await page.goto('http://127.0.0.1:1234/test_layout_fix', { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject, { timeout: 10000 });

        // Add test data
        await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const sheet = spreadsheet.sheet;

            ['Jan', 'Feb', 'Mar'].forEach((month, idx) => {
                const cell = sheet.GetAssuredCell(`A${idx + 1}`);
                cell.datavalue = month;
                cell.datatype = 't';
                cell.valuetype = 't';
            });

            spreadsheet.editor.ScheduleRender();
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Test 1: Click Graph tab
        console.log('\n====== TEST 1: Initial Graph Tab Activation ======');
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 500));

        const firstActivation = await page.evaluate(() => {
            const spreadsheet = window.spreadsheet;
            const graphPanel = document.getElementById('graph-spreadsheet-panel');
            const searchbar = document.getElementById('searchbar');

            return {
                spreadsheetInGraphPanel: graphPanel ? graphPanel.contains(spreadsheet.editorDiv) : false,
                spreadsheetVisible: spreadsheet.editorDiv.offsetParent !== null,
                searchbarHidden: searchbar ? searchbar.style.display === 'none' : false
            };
        });

        console.log('First activation:', firstActivation);

        if (!firstActivation.spreadsheetInGraphPanel) {
            throw new Error('❌ Spreadsheet should be in graph panel!');
        }
        if (!firstActivation.spreadsheetVisible) {
            throw new Error('❌ Spreadsheet should be visible!');
        }
        if (!firstActivation.searchbarHidden) {
            throw new Error('❌ Search bar should be hidden!');
        }
        console.log('✅ Graph tab initialized correctly');

        // Test 2: Switch to Sheet tab
        console.log('\n====== TEST 2: Switching to Sheet Tab ======');
        await page.click('#SocialCalc-sheettab, #SocialCalc-id-sheettab');
        await new Promise(resolve => setTimeout(resolve, 300));

        const inSheetTab = await page.evaluate(() => {
            const searchbar = document.getElementById('searchbar');
            return {
                searchbarVisible: searchbar ? searchbar.style.display !== 'none' : false
            };
        });

        console.log('In Sheet tab:', inSheetTab);
        if (!inSheetTab.searchbarVisible) {
            throw new Error('❌ Search bar should be visible in Sheet tab!');
        }
        console.log('✅ Sheet tab restored correctly');

        // Test 3: Return to Graph tab - CRITICAL TEST
        console.log('\n====== TEST 3: Returning to Graph Tab (CRITICAL) ======');
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 500));

        const secondActivation = await page.evaluate(() => {
            const spreadsheet = window.spreadsheet;
            const graphPanel = document.getElementById('graph-spreadsheet-panel');
            const searchbar = document.getElementById('searchbar');

            // Check where the spreadsheet actually is
            let location = 'unknown';
            if (graphPanel && graphPanel.contains(spreadsheet.editorDiv)) {
                location = 'in-graph-panel';
            } else if (spreadsheet.editorDiv.parentElement) {
                location = spreadsheet.editorDiv.parentElement.id || spreadsheet.editorDiv.parentElement.className;
            }

            return {
                spreadsheetLocation: location,
                spreadsheetInGraphPanel: graphPanel ? graphPanel.contains(spreadsheet.editorDiv) : false,
                spreadsheetVisible: spreadsheet.editorDiv.offsetParent !== null,
                spreadsheetDisplay: window.getComputedStyle(spreadsheet.editorDiv).display,
                searchbarHidden: searchbar ? searchbar.style.display === 'none' : false,
                searchbarDisplay: searchbar ? searchbar.style.display : null
            };
        });

        console.log('Second activation (returning to Graph):', secondActivation);

        if (!secondActivation.spreadsheetInGraphPanel) {
            throw new Error(`❌ CRITICAL: Spreadsheet should be in graph panel! Currently in: ${secondActivation.spreadsheetLocation}`);
        }
        if (!secondActivation.spreadsheetVisible) {
            throw new Error('❌ CRITICAL: Spreadsheet should be visible!');
        }
        if (!secondActivation.searchbarHidden) {
            throw new Error('❌ CRITICAL: Search bar should be hidden!');
        }
        console.log('✅ CRITICAL: Graph tab works correctly on return!');

        //Test 4: Multiple switches
        console.log('\n====== TEST 4: Multiple Tab Switches ======');
        for (let i = 0; i < 3; i++) {
            await page.click('#SocialCalc-sheettab, #SocialCalc-id-sheettab');
            await new Promise(resolve => setTimeout(resolve, 200));
            await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const afterMultipleSwitches = await page.evaluate(() => {
            const spreadsheet = window.spreadsheet;
            const graphPanel = document.getElementById('graph-spreadsheet-panel');
            const searchbar = document.getElementById('searchbar');

            return {
                spreadsheetInGraphPanel: graphPanel ? graphPanel.contains(spreadsheet.editorDiv) : false,
                searchbarHidden: searchbar ? searchbar.style.display === 'none' : false
            };
        });

        console.log('After multiple switches:', afterMultipleSwitches);
        if (!afterMultipleSwitches.spreadsheetInGraphPanel || !afterMultipleSwitches.searchbarHidden) {
            throw new Error('❌ Layout broken after multiple switches!');
        }
        console.log('✅ Layout stable after multiple switches');

        await page.screenshot({ path: 'graph_layout_fix_test.png', fullPage: true });
        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testGraphLayoutFix();
