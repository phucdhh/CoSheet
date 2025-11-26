const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });

    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error' || text.includes('GraphLayout') || text.includes('Graph')) {
            console.log(`[CONSOLE ${type.toUpperCase()}]`, text);
        }
    });

    console.log('Loading EtherCalc...');
    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Step 1: Check if GraphLayout is loaded ===');
    const hasGraphLayout = await page.evaluate(() => {
        return {
            exists: typeof window.GraphLayout !== 'undefined',
            hasInitOnTabClick: typeof window.GraphLayout?.initOnTabClick === 'function'
        };
    });
    console.log(hasGraphLayout);

    console.log('\n=== Step 2: Find Graph tab ===');
    const tabInfo = await page.evaluate(() => {
        // Find all divs that might be tabs
        const allDivs = Array.from(document.querySelectorAll('div'));
        const tabs = allDivs.filter(div => {
            const onclick = div.getAttribute('onclick');
            return onclick && onclick.includes('tab');
        });

        return tabs.map(tab => ({
            text: tab.textContent.substring(0, 50).trim(),
            onclick: tab.getAttribute('onclick'),
            id: tab.id
        }));
    });
    console.log('Found tabs:', JSON.stringify(tabInfo, null, 2));

    console.log('\n=== Step 3: Click Graph tab ===');
    const clickResult = await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const graphTab = allDivs.find(div => {
            const text = div.textContent;
            return text.includes('Graph') && div.getAttribute('onclick')?.includes('tab');
        });

        if (graphTab) {
            console.log('Clicking graph tab...');
            graphTab.click();
            return { found: true, text: graphTab.textContent.substring(0, 30) };
        }
        return { found: false };
    });
    console.log('Click result:', clickResult);

    // Wait for potential async operations
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('\n=== Step 4: Check if GraphLayout.initOnTabClick was called ===');
    const layoutState = await page.evaluate(() => {
        return {
            graphRibbonExists: !!document.getElementById('graph-ribbon'),
            graphLayoutContainerExists: !!document.getElementById('graph-layout-container'),
            // Check all divs for our ribbon
            allDivsWithGraphInId: Array.from(document.querySelectorAll('div[id*="graph"]')).map(d => ({
                id: d.id,
                display: window.getComputedStyle(d).display,
                innerHTML: d.innerHTML.substring(0, 100)
            }))
        };
    });
    console.log('Layout state after click:', JSON.stringify(layoutState, null, 2));

    // Take screenshot
    await page.screenshot({ path: '/root/ethercalc/chrome_test/graph_detailed_test.png', fullPage: true });
    console.log('\nScreenshot saved to graph_detailed_test.png');

    await browser.close();
})();
