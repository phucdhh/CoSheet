const puppeteer = require('puppeteer');

async function testHistogram() {
    console.log('Testing Histogram and Spreadsheet Panel...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Navigate to EtherCalc
        console.log('Navigating to EtherCalc...');
        await page.goto('http://127.0.0.1:1234/test_histogram', { waitUntil: 'networkidle0' });

        // Wait for SocialCalc to load
        await page.waitForFunction(() => window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject, { timeout: 10000 });

        // Enter histogram test data into spreadsheet (values for binning)
        console.log('Entering test data...');
        await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const sheet = spreadsheet.sheet;

            // Create sample data for histogram (ages)
            const testData = [23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61];
            testData.forEach((val, idx) => {
                const cell = sheet.GetAssuredCell(`A${idx + 1}`);
                cell.datavalue = val;
                cell.valuetype = "n";
            });

            spreadsheet.editor.ScheduleRender();
        });

        // Wait and click Graph tab
        console.log('Waiting for Graph tab...');
        const graphTabSelector = '#SocialCalc-graphtab, #SocialCalc-id-graphtab';
        await page.waitForSelector(graphTabSelector, { visible: true, timeout: 5000 });

        console.log('Clicking Graph tab...');
        await page.click(graphTabSelector);

        // Wait for 3-panel layout
        console.log('Waiting for 3-panel layout...');
        await page.waitForSelector('#graph-display', { visible: true, timeout: 5000 });

        // Verify spreadsheet panel is visible
        console.log('Checking spreadsheet panel...');
        const spreadsheetVisible = await page.evaluate(() => {
            const panel = document.getElementById('graph-spreadsheet-panel');
            const editorDiv = window.spreadsheet?.editorDiv;

            return {
                panelExists: !!panel,
                panelVisible: panel && panel.offsetParent !== null && panel.offsetWidth > 0,
                editorExists: !!editorDiv,
                editorInPanel: editorDiv && panel && panel.contains(editorDiv),
                editorWidth: editorDiv?.offsetWidth,
                editorHeight: editorDiv?.offsetHeight
            };
        });

        console.log('Spreadsheet panel state:', spreadsheetVisible);

        if (!spreadsheetVisible.panelVisible || !spreadsheetVisible.editorInPanel) {
            throw new Error('Spreadsheet panel is not properly visible');
        }

        // Select Histogram
        console.log('Selecting Histogram...');
        await page.click('.graph-type-btn[data-type="histogram"]');

        // Wait for options panel to appear
        await page.waitForFunction(() => {
            const panel = document.getElementById('graph-options');
            return panel && panel.style.display !== 'none';
        }, { timeout: 5000 });

        // Enter data range
        console.log('Entering data range...');
        await page.type('#graph-data-range', 'A1:A20');

        // Enter title and labels
        await page.type('#graph-title', 'Age Distribution');
        await page.type('#graph-xlabel', 'Age Range');
        await page.type('#graph-ylabel', 'Frequency');

        // Click Plot Graph
        console.log('Clicking Plot Graph...');
        await page.click('.graph-plot-button');

        // Wait a moment for rendering
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check for canvas
        console.log('Checking for histogram canvas...');
        const histogramRendered = await page.evaluate(() => {
            const container = document.getElementById('graph-content-container');
            if (!container) return { success: false, error: 'Container not found' };

            const canvas = container.querySelector('canvas#histogramCanvas');
            return {
                success: !!canvas,
                canvasWidth: canvas?.width,
                canvasHeight: canvas?.height,
                containerHTML: canvas ? 'Canvas found' : container.innerHTML.substring(0, 200)
            };
        });

        console.log('Histogram render result:', histogramRendered);

        if (histogramRendered.success) {
            console.log('✅ Histogram rendered successfully!');
            console.log(`   Canvas size: ${histogramRendered.canvasWidth}x${histogramRendered.canvasHeight}`);
        } else {
            console.error('❌ Histogram rendering failed');
            console.error('   Container content:', histogramRendered.containerHTML);
            throw new Error('Histogram canvas not found');
        }

        // Take screenshot
        await page.screenshot({ path: 'histogram_test_success.png' });
        console.log('Screenshot saved to histogram_test_success.png');

        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testHistogram();
