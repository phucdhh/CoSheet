const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    let commandsExecuted = [];

    page.on('console', msg => {
        const text = msg.text();
        commandsExecuted.push(text);
        console.log('[CONSOLE]', text);
    });

    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });

    console.log('\n=== Testing Edit Tab Commands ===\n');

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click Edit tab
    console.log('1. Activating Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add console logging to ExecuteCommand
    console.log('\n2. Injecting command tracker...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.ExecuteCommand) {
            const original = window.spreadsheet.ExecuteCommand;
            window.spreadsheet.ExecuteCommand = function (cmd, arg) {
                console.log('[CMD EXECUTED] Command:', cmd, 'Arg:', arg);
                return original.call(this, cmd, arg);
            };
            console.log('[TRACKER] ExecuteCommand wrapper installed');
        } else {
            console.log('[TRACKER ERROR] window.spreadsheet.ExecuteCommand not found!');
        }
    });

    // Test each button
    const buttons = ['undo', 'redo', 'copy', 'paste', 'cut'];

    for (let btnName of buttons) {
        console.log(`\n3. Testing ${btnName} button...`);
        const clicked = await page.evaluate((name) => {
            const btn = document.getElementById('edit-' + name);
            if (btn) {
                console.log('[BTN] Clicking', name, 'button');
                btn.click();
                return true;
            }
            console.log('[BTN ERROR] Button not found:', name);
            return false;
        }, btnName);

        console.log(`   ${btnName} clicked:`, clicked ? '✅' : '❌');
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n4. Checking if bindEvents was called...');
    const bindInfo = await page.evaluate(() => {
        return {
            EditLayoutExists: typeof window.EditLayout !== 'undefined',
            bindEventsExists: typeof window.EditLayout?.bindEvents === 'function',
            containerExists: window.EditLayout?.container !== null
        };
    });
    console.log('   EditLayout info:', bindInfo);

    console.log('\n5. Analyzing commands executed:');
    const cmdExecuted = commandsExecuted.filter(msg => msg.includes('[CMD EXECUTED]'));
    if (cmdExecuted.length > 0) {
        console.log('   ✅ Commands were executed:');
        cmdExecuted.forEach(cmd => console.log('     -', cmd));
    } else {
        console.log('   ❌ NO commands were executed!');
        console.log('   This means onclick handlers are NOT calling ExecuteCommand');
    }

    await browser.close();
    console.log('\n=== Test Complete ===\n');
})();
