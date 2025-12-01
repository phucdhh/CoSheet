const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    console.log('\n=== Edit Tab Functionality Test ===\n');

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ Test 1: Edit tab ribbon renders');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const buttonsExist = await page.evaluate(() => {
        const buttons = ['edit-undo', 'edit-redo', 'edit-copy', 'edit-paste', 'edit-cut'];
        return buttons.every(id => document.getElementById(id) !== null);
    });
    console.log('   All buttons rendered:', buttonsExist ? '✅' : '❌');

    console.log('\n✅ Test 2: Buttons have onclick handlers');
    const hasHandlers = await page.evaluate(() => {
        const buttons = ['edit-undo', 'edit-redo', 'edit-copy', 'edit-paste'];
        return buttons.every(id => {
            const btn = document.getElementById(id);
            return btn && btn.onclick !== null;
        });
    });
    console.log('   All buttons have handlers:', hasHandlers ? '✅' : '❌');

    console.log('\n✅ Test 3: Handlers call ExecuteCommand');
    const commandsCalled = await page.evaluate(() => {
        let calls = [];
        if (window.spreadsheet && window.spreadsheet.ExecuteCommand) {
            const original = window.spreadsheet.ExecuteCommand;
            window.spreadsheet.ExecuteCommand = function (cmd, arg) {
                calls.push(cmd);
                return original.call(this, cmd, arg);
            };
        }

        // Click each button
        ['edit-undo', 'edit-redo', 'edit-copy'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.click();
        });

        return calls;
    });
    console.log('   Commands executed:', commandsCalled);
    console.log('   ExecuteCommand called:', commandsCalled.length > 0 ? '✅' : '❌');

    console.log('\n=== SUMMARY ===');
    if (buttonsExist && hasHandlers && commandsCalled.length > 0) {
        console.log('✅ ALL TESTS PASSED');
        console.log('Edit tab controls are working correctly!');
    } else {
        console.log('❌ SOME TESTS FAILED');
    }

    await browser.close();
})();
