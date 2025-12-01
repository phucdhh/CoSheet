const puppeteer = require('puppeteer-core');

(async () => {
    console.log('Connecting to Chrome...');

    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
    });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('dulieu.truyenthong.edu.vn'));

    if (!page) {
        console.log('❌ EtherCalc page not found');
        await browser.disconnect();
        return;
    }

    console.log('\n=== Testing Edit Tab Commands ===\n');

    // Inject command tracker
    await page.evaluate(() => {
        window.commandLog = [];
        if (window.spreadsheet && window.spreadsheet.ExecuteCommand) {
            const original = window.spreadsheet.ExecuteCommand;
            window.spreadsheet.ExecuteCommand = function (cmd, arg) {
                window.commandLog.push({ command: cmd, arg: arg, time: Date.now() });
                console.log('[COMMAND]', cmd, arg);
                return original.call(this, cmd, arg);
            };
            console.log('[TRACKER] Installed ExecuteCommand tracker');
        }
    });

    console.log('1. Clicking Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n2. Clicking Copy button...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-copy');
        if (btn) {
            console.log('[CLICK] Clicking Copy button');
            btn.click();
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('\n3. Clicking Paste button...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-paste');
        if (btn) {
            console.log('[CLICK] Clicking Paste button');
            btn.click();
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('\n4. Clicking Undo button...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-undo');
        if (btn) {
            console.log('[CLICK] Clicking Undo button');
            btn.click();
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check command log
    const commandLog = await page.evaluate(() => window.commandLog);

    console.log('\n=== RESULTS ===');
    console.log('Commands executed:', commandLog.length);
    if (commandLog.length > 0) {
        console.log('✅ Commands were executed:');
        commandLog.forEach((cmd, i) => {
            console.log(`  ${i + 1}. ${cmd.command} (arg: "${cmd.arg}")`);
        });
    } else {
        console.log('❌ NO commands were executed!');
        console.log('\nThis means the onclick handlers are not calling ExecuteCommand.');
        console.log('Possible causes:');
        console.log('  - bindEvents() was not called');
        console.log('  - setTimeout delay is too long');
        console.log('  - Buttons were re-rendered after bindEvents()');
    }

    await browser.disconnect();
})();
