const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        console.log('[BROWSER]', msg.text());
    });

    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Step 1: Click Graph tab ===');
    await page.evaluate(() => {
        const graphTab = document.getElementById('SocialCalc-graphtab');
        if (graphTab) {
            graphTab.click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n=== Step 2: Check ribbon ===');
    const ribbonCheck = await page.evaluate(() => {
        const ribbon = document.getElementById('graph-ribbon');
        const buttons = document.querySelectorAll('.graph-type-btn');
        const label = document.querySelector('.graph-ribbon-label');
        return {
            ribbonExists: !!ribbon,
            ribbonDisplay: ribbon ? window.getComputedStyle(ribbon).display : null,
            buttonCount: buttons.length,
            buttonTypes: Array.from(buttons).map(b => b.getAttribute('data-type')),
            labelText: label ? label.textContent : null,
            firstButtonText: buttons.length > 0 ? buttons[0].querySelector('span').textContent : null
        };
    });
    console.log('Ribbon state:', ribbonCheck);

    console.log('\n=== Step 3: Click Bar chart button ===');
    await page.evaluate(() => {
        const barBtn = document.querySelector('[data-type="bar"]');
        if (barBtn) {
            console.log('Clicking Bar button...');
            barBtn.click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('\n=== Step 4: Check 3-panel layout ===');
    const panelCheck = await page.evaluate(() => {
        return {
            graph3panelExists: !!document.getElementById('graph-3panel'),
            graph3panelDisplay: document.getElementById('graph-3panel') ?
                window.getComputedStyle(document.getElementById('graph-3panel')).display : null,
            spreadsheetPanelExists: !!document.getElementById('graph-spreadsheet-panel'),
            graphDisplayExists: !!document.getElementById('graph-display'),
            graphOptionsExists: !!document.getElementById('graph-options'),
            mode: window.GraphLayout ? window.GraphLayout.currentMode : null
        };
    });
    console.log('Panel state:', panelCheck);

    await page.screenshot({ path: '/root/ethercalc/chrome_test/graph_complete_test.png', fullPage: true });
    console.log('\nScreenshot saved to graph_complete_test.png');

    await browser.close();
    console.log('\n✅ TEST COMPLETE!');
})();
