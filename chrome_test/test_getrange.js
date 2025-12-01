const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    console.log('\n=== Verifying getRange() Function ===\n');

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Click Edit tab
    console.log('1. Activating Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Inject command tracker
    console.log('\n2. Installing command tracker...');
    await page.evaluate(() => {
        window.commandLog = [];
        if (window.spreadsheet && window.spreadsheet.ExecuteCommand) {
            const original = window.spreadsheet.ExecuteCommand;
            window.spreadsheet.ExecuteCommand = function (cmd, arg) {
                window.commandLog.push({ command: cmd, argument: arg });
                console.log('[CMD]', cmd, 'ARG:', arg);
                return original.call(this, cmd, arg);
            };
        }
    });

    // Click Copy button
    console.log('\n3. Clicking Copy button...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-copy');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get command log
    const commandLog = await page.evaluate(() => window.commandLog);

    console.log('\n=== RESULTS ===');
    console.log('Commands executed:', commandLog.length);

    if (commandLog.length > 0) {
        const copyCmd = commandLog.find(c => c.command === 'copy');
        if (copyCmd) {
            console.log('\n✅ Copy command executed');
            console.log('   Command:', copyCmd.command);
            console.log('   Argument:', copyCmd.argument);

            if (copyCmd.argument && copyCmd.argument !== '') {
                console.log('\n✅✅ SUCCESS! Copy received range parameter:', copyCmd.argument);
                console.log('This means the new getRange() code is working!');
            } else {
                console.log('\n❌ FAIL: Copy argument is empty');
                console.log('This means getRange() is not working correctly');
            }
        } else {
            console.log('❌ Copy command not found in log');
        }
    } else {
        console.log('❌ No commands were executed');
    }

    await browser.close();
})();
