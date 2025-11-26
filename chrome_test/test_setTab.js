const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('GraphLayout') || text.includes('graph') || text.includes('Clicking')) {
            console.log('[BROWSER]', text);
        }
    });

    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Finding Graph tab TD element ===');
    const found = await page.evaluate(() => {
        // Find the tab by its ID
        const graphTab = document.getElementById('SocialCalc-graphtab');
        if (graphTab) {
            console.log('Found Graph tab TD element!');
            console.log('Clicking it...');
            graphTab.click();
            return { success: true, method: 'by-id' };
        }

        // Fallback: find it via SocialCalc.SetTab with tab name
        if (typeof SocialCalc !== 'undefined' && SocialCalc.SetTab) {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            if (spreadsheet && spreadsheet.tabnums && spreadsheet.tabnums.graph !== undefined) {
                const graphTabNum = spreadsheet.tabnums.graph;
                console.log('Found graph tab number:', graphTabNum);
                // Call SetTab with the tab name
                SocialCalc.SetTab('graph');
                return { success: true, method: 'SetTab-by-name' };
            }
        }

        return { success: false };
    });

    console.log('Found and clicked:', found);

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('\n=== Checking for ribbon ===');
    const result = await page.evaluate(() => {
        return {
            ribbonExists: !!document.getElementById('graph-ribbon'),
            containerExists: !!document.getElementById('graph-layout-container'),
            graphLayoutMode: window.GraphLayout ? window.GraphLayout.currentMode : 'unknown',
            allGraphIds: Array.from(document.querySelectorAll('[id*="graph"]')).map(el => ({
                id: el.id,
                display: window.getComputedStyle(el).display
            }))
        };
    });

    console.log('\nFinal state:', JSON.stringify(result, null, 2));

    await page.screenshot({ path: '/root/ethercalc/chrome_test/graph_setTab_test.png', fullPage: true });
    console.log('\nScreenshot saved');

    await browser.close();
})();
