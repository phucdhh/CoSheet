const puppeteer = require('puppeteer');

async function testTabSwitching() {
    console.log('Testing Tab Switching and Spreadsheet Restoration...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Navigate to EtherCalc
        console.log('Navigating to EtherCalc...');
        await page.goto('http://127.0.0.1:1234/test_tab_switch', { waitUntil: 'networkidle0' });

        // Wait for SocialCalc to load
        await page.waitForFunction(() => window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject, { timeout: 10000 });

        // Enter test data
        console.log('Entering test data...');
        await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const sheet = spreadsheet.sheet;

            const cell = sheet.GetAssuredCell('A1');
            cell.datavalue = 'Test Data';
            cell.valuetype = "t";

            spreadsheet.editor.ScheduleRender();
        });

        // Check spreadsheet is visible on Sheet tab
        console.log('Checking spreadsheet visibility on Sheet tab...');
        let spreadsheetState = await page.evaluate(() => {
            const editorDiv = window.spreadsheet?.editorDiv;
            return {
                exists: !!editorDiv,
                visible: editorDiv && editorDiv.offsetParent !== null,
                parentId: editorDiv?.parentNode?.id || 'unknown'
            };
        });
        console.log('Sheet tab - spreadsheet state:', spreadsheetState);

        if (!spreadsheetState.visible) {
            throw new Error('Spreadsheet not visible on Sheet tab initially');
        }

        // Switch to Graph tab
        console.log('Switching to Graph tab...');
        const graphTabSelector = '#SocialCalc-graphtab, #SocialCalc-id-graphtab';
        await page.waitForSelector(graphTabSelector, { visible: true, timeout: 5000 });
        await page.click(graphTabSelector);

        // Wait for graph UI to initialize
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });

        // Check spreadsheet is in graph panel
        console.log('Checking spreadsheet in Graph tab panel...');
        spreadsheetState = await page.evaluate(() => {
            const editorDiv = window.spreadsheet?.editorDiv;
            const graphPanel = document.getElementById('graph-spreadsheet-panel');
            return {
                exists: !!editorDiv,
                visible: editorDiv && editorDiv.offsetParent !== null,
                parentId: editorDiv?.parentNode?.id || 'unknown',
                inGraphPanel: graphPanel && graphPanel.contains(editorDiv)
            };
        });
        console.log('Graph tab - spreadsheet state:', spreadsheetState);

        if (!spreadsheetState.inGraphPanel) {
            console.warn('⚠️ Spreadsheet not in graph panel, but continuing test...');
        }

        // Switch back to Sheet tab
        console.log('Switching back to Sheet tab...');
        const sheetTabSelector = '#SocialCalc-sheettab, #SocialCalc-id-sheettab';
        await page.waitForSelector(sheetTabSelector, { visible: true, timeout: 5000 });
        await page.click(sheetTabSelector);

        // Wait a moment for restoration
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check spreadsheet is restored
        console.log('Checking spreadsheet restoration on Sheet tab...');
        spreadsheetState = await page.evaluate(() => {
            const editorDiv = window.spreadsheet?.editorDiv;
            const graphPanel = document.getElementById('graph-spreadsheet-panel');
            return {
                exists: !!editorDiv,
                visible: editorDiv && editorDiv.offsetParent !== null,
                parentId: editorDiv?.parentNode?.id || 'unknown',
                inGraphPanel: graphPanel && graphPanel.contains(editorDiv),
                editorWidth: editorDiv?.offsetWidth,
                editorHeight: editorDiv?.offsetHeight
            };
        });
        console.log('Sheet tab (after restore) - spreadsheet state:', spreadsheetState);

        if (!spreadsheetState.visible) {
            throw new Error('❌ Spreadsheet NOT restored after leaving Graph tab!');
        }

        if (spreadsheetState.inGraphPanel) {
            throw new Error('❌ Spreadsheet still in graph panel after leaving Graph tab!');
        }

        console.log('✅ Spreadsheet successfully restored!');

        // Test switching to another tab (Edit)
        console.log('Testing switch to Edit tab...');
        const editTabSelector = '#SocialCalc-edittab, #SocialCalc-id-edittab';
        await page.waitForSelector(editTabSelector, { visible: true, timeout: 5000 });
        await page.click(editTabSelector);

        await new Promise(resolve => setTimeout(resolve, 200));

        spreadsheetState = await page.evaluate(() => {
            const editorDiv = window.spreadsheet?.editorDiv;
            return {
                exists: !!editorDiv,
                visible: editorDiv && editorDiv.offsetParent !== null,
                parentId: editorDiv?.parentNode?.id || 'unknown'
            };
        });
        console.log('Edit tab - spreadsheet state:', spreadsheetState);

        if (!spreadsheetState.visible) {
            throw new Error('❌ Spreadsheet not visible on Edit tab!');
        }

        console.log('✅ All tab switching tests passed!');

        // Take screenshot
        await page.screenshot({ path: 'tab_switch_success.png' });
        console.log('Screenshot saved to tab_switch_success.png');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testTabSwitching();
