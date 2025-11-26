const puppeteer = require('puppeteer');
const { exec } = require('child_process');

async function runTest() {
    console.log('Starting Graph Plot Test...');

    // Launch browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Navigate to EtherCalc
        console.log('Navigating to EtherCalc...');
        await page.goto('http://127.0.0.1:1234/test_graph_plot', { waitUntil: 'networkidle0' });

        // Wait for SocialCalc to load
        await page.waitForFunction(() => window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject, { timeout: 10000 });

        // Enter data into spreadsheet
        console.log('Entering data into spreadsheet...');
        await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const editor = spreadsheet.editor;
            // Set values in A1, A2, A3
            // Note: EditorSetValue takes cell object and value string
            // We need to ensure the cell exists first
            const sheet = spreadsheet.sheet;
            const cellA1 = sheet.GetAssuredCell('A1');
            cellA1.datavalue = 10;
            cellA1.valuetype = "n";

            const cellA2 = sheet.GetAssuredCell('A2');
            cellA2.datavalue = 20;
            cellA2.valuetype = "n";

            const cellA3 = sheet.GetAssuredCell('A3');
            cellA3.datavalue = 30;
            cellA3.valuetype = "n";

            editor.ScheduleRender();
        });

        // Dump all tab IDs
        await page.evaluate(() => {
            const tabs = document.querySelectorAll('td[id*="tab"]');
            console.log('Found tabs:', Array.from(tabs).map(t => t.id));
        });

        // Wait for Graph tab to be present
        console.log('Waiting for Graph tab...');
        // Try both potential IDs
        try {
            await page.waitForSelector('#SocialCalc-graphtab, #SocialCalc-id-graphtab', { visible: true, timeout: 5000 });
        } catch (e) {
            console.log('Wait failed, dumping HTML...');
            const html = await page.evaluate(() => document.body.innerHTML);
            // console.log(html); // Too large
        }

        // Click Graph tab
        console.log('Clicking Graph tab...');
        await page.evaluate(() => {
            let graphTab = document.getElementById('SocialCalc-graphtab');
            if (!graphTab) {
                graphTab = document.getElementById('SocialCalc-id-graphtab');
            }

            if (graphTab) {
                SocialCalc.SetTab(graphTab);
            } else {
                throw new Error('Graph tab not found');
            }
        });

        // Wait for 3-panel layout (should be immediate now)
        console.log('Waiting for 3-panel layout...');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });

        // Verify spreadsheet panel is visible
        console.log('Checking spreadsheet panel...');
        const spreadsheetVisible = await page.evaluate(() => {
            const panel = document.getElementById('graph-spreadsheet-panel');
            return panel && panel.offsetParent !== null && panel.offsetWidth > 0;
        });

        if (!spreadsheetVisible) {
            throw new Error('Spreadsheet panel is not visible');
        }

        // Select Bar chart from the new ribbon location (inside display panel)
        console.log('Selecting Bar chart...');
        await page.click('.graph-type-btn[data-type="bar"]');

        // Enter data range
        console.log('Entering data range...');
        await page.type('#graph-data-range', 'A1:A3');

        // Click Plot Graph
        console.log('Clicking Plot Graph...');
        await page.click('.graph-plot-button');

        // Check for canvas in graph-content-container
        console.log('Checking for canvas...');
        const canvasExists = await page.evaluate(() => {
            const container = document.getElementById('graph-content-container');
            if (!container) return false;
            const canvas = container.querySelector('canvas');
            return !!canvas;
        });

        if (canvasExists) {
            console.log('✅ Canvas found! Graph plotted successfully.');
        } else {
            console.error('❌ Canvas not found in graph container.');
            // Dump container HTML
            const html = await page.evaluate(() => {
                const container = document.getElementById('graph-content-container');
                return container ? container.innerHTML : 'Container not found';
            });
            console.log('Container HTML:', html);
            throw new Error('Graph plotting failed');
        }

        // Take screenshot
        await page.screenshot({ path: 'graph_plot_success.png' });
        console.log('Screenshot saved to graph_plot_success.png');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTest();
