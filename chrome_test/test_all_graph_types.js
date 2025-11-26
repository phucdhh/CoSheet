const puppeteer = require('puppeteer');

async function testAllGraphTypes() {
    console.log('Testing All 5 Graph Types with Tab Switching...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('[CoSheet]')) {
                console.log('PAGE LOG:', text);
            }
        });

        // Navigate to EtherCalc
        console.log('Navigating to EtherCalc...');
        await page.goto('http://127.0.0.1:1234/test_all_graphs', { waitUntil: 'networkidle0' });

        // Wait for SocialCalc to load
        await page.waitForFunction(() => window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject, { timeout: 10000 });

        // Enter test data for graphing
        console.log('Entering test data...');
        await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const sheet = spreadsheet.sheet;

            // Create sample data
            const testData = [10, 25, 15, 30, 20, 35, 28];
            testData.forEach((val, idx) => {
                const cell = sheet.GetAssuredCell(`A${idx + 1}`);
                cell.datavalue = val;
                cell.valuetype = "n";
            });

            spreadsheet.editor.ScheduleRender();
        });

        const graphTypes = ['bar', 'line', 'scatter', 'histogram'];
        const results = {};

        for (const graphType of graphTypes) {
            console.log(`\n====== Testing ${graphType.toUpperCase()} ======`);

            // Click Graph tab
            const graphTabSelector = '#SocialCalc-graphtab, #SocialCalc-id-graphtab';
            await page.waitForSelector(graphTabSelector, { visible: true, timeout: 5000 });
            await page.click(graphTabSelector);

            // Wait for layout
            await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });
            await new Promise(resolve => setTimeout(resolve, 300));

            // Check spreadsheet visible before plot
            let spreadsheetState = await page.evaluate(() => {
                const editorDiv = window.spreadsheet?.editorDiv;
                return {
                    visible: editorDiv && editorDiv.offsetParent !== null,
                    display: editorDiv ? window.getComputedStyle(editorDiv).display : 'unknown',
                    width: editorDiv?.offsetWidth,
                    height: editorDiv?.offsetHeight
                };
            });
            console.log(`Before plot - Spreadsheet: ${spreadsheetState.display}, ${spreadsheetState.width}x${spreadsheetState.height}`);

            if (!spreadsheetState.visible) {
                console.error(`❌ ${graphType}: Spreadsheet not visible BEFORE plot!`);
                results[graphType] = { success: false, error: 'Spreadsheet not visible before plot' };
                continue;
            }

            // Select graph type
            await page.click(`.graph-type-btn[data-type="${graphType}"]`);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Enter data range
            await page.type('#graph-data-range', 'A1:A7');
            await page.type('#graph-title', `${graphType.charAt(0).toUpperCase() + graphType.slice(1)} Test`);

            // Plot graph
            await page.click('.graph-plot-button');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if graph rendered
            const graphState = await page.evaluate((type) => {
                const container = document.getElementById('graph-content-container');
                if (!container) return { success: false, error: 'Container not found' };

                let graphElement;
                if (type === 'histogram') {
                    graphElement = container.querySelector('canvas#histogramCanvas');
                } else {
                    graphElement = container.querySelector('canvas#myBarCanvas') ||
                        container.querySelector('canvas') ||
                        container.querySelector('table');
                }

                return {
                    success: !!graphElement,
                    hasCanvas: !!container.querySelector('canvas'),
                    hasTable: !!container.querySelector('table'),
                    containerHTML: container.innerHTML.substring(0, 100)
                };
            }, graphType);

            // Check spreadsheet visible after plot
            spreadsheetState = await page.evaluate(() => {
                const editorDiv = window.spreadsheet?.editorDiv;
                return {
                    visible: editorDiv && editorDiv.offsetParent !== null,
                    display: editorDiv ? window.getComputedStyle(editorDiv).display : 'unknown',
                    width: editorDiv?.offsetWidth,
                    height: editorDiv?.offsetHeight
                };
            });
            console.log(`After plot  - Spreadsheet: ${spreadsheetState.display}, ${spreadsheetState.width}x${spreadsheetState.height}`);

            if (!spreadsheetState.visible) {
                console.error(`❌ ${graphType}: Spreadsheet DISAPPEARED after plot!`);
                results[graphType] = { success: false, error: 'Spreadsheet disappeared after plot', graphRendered: graphState.success };
                continue;
            }

            if (!graphState.success) {
                console.error(`❌ ${graphType}: Graph did not render`);
                console.error(`   Container HTML: ${graphState.containerHTML}`);
                results[graphType] = { success: false, error: 'Graph not rendered', spreadsheetOk: true };
                continue;
            }

            console.log(`✅ ${graphType}: Graph rendered, spreadsheet visible`);
            results[graphType] = { success: true };

            // Test tab switching
            console.log(`   Testing tab switch back to Sheet...`);
            const sheetTabSelector = '#SocialCalc-sheettab, #SocialCalc-id-sheettab';
            await page.click(sheetTabSelector);
            await new Promise(resolve => setTimeout(resolve, 200));

            spreadsheetState = await page.evaluate(() => {
                const editorDiv = window.spreadsheet?.editorDiv;
                return {
                    visible: editorDiv && editorDiv.offsetParent !== null,
                    display: editorDiv ? window.getComputedStyle(editorDiv).display : 'unknown'
                };
            });

            if (!spreadsheetState.visible) {
                console.error(`❌ ${graphType}: Spreadsheet not restored after leaving Graph tab!`);
                results[graphType].tabSwitchOk = false;
            } else {
                console.log(`   ✅ Tab switch OK, spreadsheet restored`);
                results[graphType].tabSwitchOk = true;
            }
        }

        // Summary
        console.log('\n====== TEST SUMMARY ======');
        const successful = Object.keys(results).filter(type => results[type].success && results[type].tabSwitchOk !== false);
        const failed = Object.keys(results).filter(type => !results[type].success || results[type].tabSwitchOk === false);

        console.log(`✅ Successful: ${successful.join(', ') || 'none'}`);
        if (failed.length > 0) {
            console.log(`❌ Failed: ${failed.join(', ')}`);
            failed.forEach(type => {
                console.log(`   ${type}: ${results[type].error || 'Tab switch failed'}`);
            });
        }

        // Take final screenshot
        await page.goto('http://127.0.0.1:1234/test_all_graphs');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.screenshot({ path: 'all_graph_types_test.png' });
        console.log('Screenshot saved to all_graph_types_test.png');

        if (failed.length > 0) {
            process.exit(1);
        }

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testAllGraphTypes();
