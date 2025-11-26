const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Looking for all tabs in spreadsheet ===');
    const tabs = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            const ed = window.spreadsheet.editor;
            return {
                tabsArray: ed.tabs ? ed.tabs.map(t => ({ name: t.name, text: t.text, view: t.view })) : [],
                tabnums: ed.tabnums,
                currentTab: ed.currentTab
            };
        }
        return null;
    });
    console.log('Spreadsheet tabs info:', JSON.stringify(tabs, null, 2));

    console.log('\n=== Now clicking the Graph tab via spreadsheet API ===');
    const switchResult = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor && window.spreadsheet.editor.tabs) {
            const graphTab = window.spreadsheet.editor.tabs.find(t => t.name === 'graph');
            if (graphTab && graphTab.onclick) {
                console.log('Calling onclick for Graph tab...');
                graphTab.onclick();
                return { success: true, method: 'tab.onclick()' };
            }
        }
        return { success: false };
    });
    console.log('Switch result:', switchResult);

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('\n=== Checking for ribbon after onclick ===');
    const afterClick = await page.evaluate(() => {
        return {
            graphRibbonExists: !!document.getElementById('graph-ribbon'),
            graphLayoutContainerExists: !!document.getElementById('graph-layout-container'),
            // Look for any new divs that might have been created
            allDivIds: Array.from(document.querySelectorAll('div[id]')).slice(0, 50).map(d => d.id)
        };
    });
    console.log('After click state:', JSON.stringify(afterClick, null, 2));

    await page.screenshot({ path: '/root/ethercalc/chrome_test/after_onclick_test.png', fullPage: true });
    console.log('\nScreenshot saved');

    await browser.close();
})();
