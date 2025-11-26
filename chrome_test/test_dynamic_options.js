const puppeteer = require('puppeteer');

async function testDynamicOptions() {
    console.log('Testing Dynamic Graph Options with Chrome...');

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
        await page.goto('http://127.0.0.1:1234/test_dynamic_graph', { waitUntil: 'networkidle0' });

        // Wait for SocialCalc to load
        await page.waitForFunction(() => window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject, { timeout: 10000 });

        // Create realistic test dataset: Months and Sales
        console.log('Creating test dataset...');
        await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const sheet = spreadsheet.sheet;

            // Months in column A
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            months.forEach((month, idx) => {
                const cell = sheet.GetAssuredCell(`A${idx + 1}`);
                cell.datavalue = month;
                cell.valuetype = "t";
            });

            // Sales values in column B
            const sales = [120, 150, 135, 180, 165, 200];
            sales.forEach((val, idx) => {
                const cell = sheet.GetAssuredCell(`B${idx + 1}`);
                cell.datavalue = val;
                cell.valuetype = "n";
            });

            spreadsheet.editor.ScheduleRender();
        });

        // Test Bar Chart with X/Y axis inputs
        console.log('\n====== Testing BAR CHART (X/Y Axis Inputs) ======');
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 300));

        // Click Bar button
        await page.click('.graph-type-btn[data-type="bar"]');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify X/Y axis inputs exist
        const hasXYInputs = await page.evaluate(() => {
            return {
                xaxis: !!document.getElementById('graph-xaxis-range'),
                yaxis: !!document.getElementById('graph-yaxis-range'),
                dataRange: !!document.getElementById('graph-data-range')
            };
        });

        console.log('Bar chart inputs:', hasXYInputs);
        if (!hasXYInputs.xaxis || !hasXYInputs.yaxis) {
            throw new Error('Bar chart should have X/Y axis inputs!');
        }
        if (hasXYInputs.dataRange) {
            throw new Error('Bar chart should NOT have data range input!');
        }

        // Enter X and Y axis ranges
        await page.type('#graph-xaxis-range', 'A1:A6');
        await page.type('#graph-yaxis-range', 'B1:B6');
        await page.type('#graph-title', 'Monthly Sales');

        // Plot
        await page.click('.graph-plot-button');
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check spreadsheet still visible
        let spreadsheetVisible = await page.evaluate(() => {
            const editorDiv = window.spreadsheet?.editorDiv;
            return editorDiv && editorDiv.offsetParent !== null;
        });

        if (!spreadsheetVisible) {
            throw new Error('❌ Bar: Spreadsheet disappeared after plot!');
        }
        console.log('✅ Bar chart plotted, spreadsheet visible');

        // Test Line Chart with Data Range input
        console.log('\n====== Testing LINE CHART (Data Range Input) ======');
        await page.click('#SocialCalc-sheettab, #SocialCalc-id-sheettab');
        await new Promise(resolve => setTimeout(resolve, 200));
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Click Line button
        await page.click('.graph-type-btn[data-type="line"]');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify Data Range input exists
        const hasDataRange = await page.evaluate(() => {
            return {
                xaxis: !!document.getElementById('graph-xaxis-range'),
                yaxis: !!document.getElementById('graph-yaxis-range'),
                dataRange: !!document.getElementById('graph-data-range')
            };
        });

        console.log('Line chart inputs:', hasDataRange);
        if (hasDataRange.xaxis || hasDataRange.yaxis) {
            throw new Error('Line chart should NOT have X/Y axis inputs!');
        }
        if (!hasDataRange.dataRange) {
            throw new Error('Line chart should have data range input!');
        }

        // Enter data range
        await page.type('#graph-data-range', 'B1:B6');
        await page.type('#graph-title', 'Sales Trend');

        // Plot
        await page.click('.graph-plot-button');
        await new Promise(resolve => setTimeout(resolve, 800));

        spreadsheetVisible = await page.evaluate(() => {
            const editorDiv = window.spreadsheet?.editorDiv;
            return editorDiv && editorDiv.offsetParent !== null;
        });

        if (!spreadsheetVisible) {
            throw new Error('❌ Line: Spreadsheet disappeared after plot!');
        }
        console.log('✅ Line chart plotted, spreadsheet visible');

        // Test Histogram with X/Y axis inputs
        console.log('\n====== Testing HISTOGRAM (X/Y Axis Inputs) ======');
        await page.click('#SocialCalc-sheettab, #SocialCalc-id-sheettab');
        await new Promise(resolve => setTimeout(resolve, 200));
        await page.click('#SocialCalc-graphtab, #SocialCalc-id-graphtab');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Click Histogram button
        await page.click('.graph-type-btn[data-type="histogram"]');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify X/Y axis inputs
        const histogramInputs = await page.evaluate(() => {
            return {
                xaxis: !!document.getElementById('graph-xaxis-range'),
                yaxis: !!document.getElementById('graph-yaxis-range')
            };
        });

        if (!histogramInputs.xaxis || !histogramInputs.yaxis) {
            throw new Error('Histogram should have X/Y axis inputs!');
        }

        // Enter ranges
        await page.type('#graph-xaxis-range', 'A1:A6');
        await page.type('#graph-yaxis-range', 'B1:B6');
        await page.type('#graph-title', 'Sales Distribution');

        // Plot
        await page.click('.graph-plot-button');
        await new Promise(resolve => setTimeout(resolve, 800));

        spreadsheetVisible = await page.evaluate(() => {
            const editorDiv = window.spreadsheet?.editorDiv;
            return editorDiv && editorDiv.offsetParent !== null;
        });

        if (!spreadsheetVisible) {
            throw new Error('❌ Histogram: Spreadsheet disappeared after plot!');
        }
        console.log('✅ Histogram plotted, spreadsheet visible');

        // Take screenshot
        await page.screenshot({ path: 'dynamic_options_test.png', fullPage: true });
        console.log('\n✅ All tests passed! Screenshot saved.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testDynamicOptions();
