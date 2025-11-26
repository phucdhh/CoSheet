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
        console.log(`[${msg.type().toUpperCase()}]`, msg.text());
    });

    console.log('Loading EtherCalc...');
    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Finding Graph tab (method 1: by text content) ===');
    const clickByText = await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        // Look for a div with exactly "Graph" text or containing it in tabs area
        for (const div of allDivs) {
            const text = div.textContent.trim();
            // Check if this looks like a tab (short text, might be clickable)
            if ((text === 'Graph' || text.match(/^Graph$/)) && div.style.cursor !== 'default') {
                console.log('Found potential graph tab:', text, 'parent:', div.parentElement?.id);
                div.click();
                return { success: true, method: 'exact-text', text };
            }
        }

        // Try finding it in a tab container
        const tabsContainers = document.querySelectorAll('[id*="tab"]');
        for (const container of tabsContainers) {
            const graphDiv = Array.from(container.querySelectorAll('div')).find(d =>
                d.textContent.trim() === 'Graph'
            );
            if (graphDiv) {
                console.log('Found graph tab in container:', container.id);
                graphDiv.click();
                return { success: true, method: 'in-container', containerId: container.id };
            }
        }

        return { success: false };
    });
    console.log('Click by text result:', clickByText);

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n=== Checking state after click ===');
    const state = await page.evaluate(() => {
        return {
            graphRibbonExists: !!document.getElementById('graph-ribbon'),
            bodyClasses: document.body.className,
            // Check if SocialCalc spreadsheet object exists and what tab is active
            currentTab: window.spreadsheet ? window.spreadsheet.editor?.state?.currentTab : 'unknown',
            spreadsheetExists: typeof window.spreadsheet !== 'undefined'
        };
    });
    console.log('State:', state);

    // If first method didn't work, try using the spreadsheet API directly
    if (!clickByText.success) {
        console.log('\n=== Trying direct tab switch via SocialCalc API ===');
        const directSwitch = await page.evaluate(() => {
            if (window.spreadsheet && window.spreadsheet.editor) {
                const editor = window.spreadsheet.editor;
                // Find graph tab index
                if (editor.tabnums && editor.tabnums.graph !== undefined) {
                    console.log('Found graph tab at index:', editor.tabnums.graph);
                    // Switch to graph tab
                    if (typeof editor.SwitchTab === 'function') {
                        editor.SwitchTab(editor.tabnums.graph);
                        return { success: true, method: 'SwitchTab' };
                    }
                }
            }
            return { success: false };
        });
        console.log('Direct switch result:', directSwitch);

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== Final state check ===');
    const finalState = await page.evaluate(() => {
        return {
            graphRibbonExists: !!document.getElementById('graph-ribbon'),
            graphLayoutContainerExists: !!document.getElementById('graph-layout-container'),
            allGraphDivs: Array.from(document.querySelectorAll('div[id*="graph" i]')).map(d => ({
                id: d.id,
                display: window.getComputedStyle(d).display,
                hasContent: d.innerHTML.length > 0
            }))
        };
    });
    console.log('Final state:', JSON.stringify(finalState, null, 2));

    await page.screenshot({ path: '/root/ethercalc/chrome_test/graph_final_test.png', fullPage: true });
    console.log('\nScreenshot saved');

    await browser.close();
})();
