const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Edit') || text.includes('error') || text.includes('Error') || text.includes('ExecuteCommand')) {
            console.log('[CONSOLE]', text);
        }
    });

    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });

    console.log('\n=== Testing Edit Tab Controls ===\n');
    console.log('Loading EtherCalc...');

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    console.log('Waiting for page to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if Edit tab exists
    console.log('\n1. Checking if Edit tab exists...');
    const editTabExists = await page.evaluate(() => {
        const tabs = document.querySelectorAll('[id$="edittab"]');
        return tabs.length > 0;
    });
    console.log('   Edit tab exists:', editTabExists ? '✅' : '❌');

    // Click Edit tab
    console.log('\n2. Clicking Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if Edit ribbon is visible
    console.log('\n3. Checking Edit ribbon visibility...');
    const ribbonVisible = await page.evaluate(() => {
        const ribbon = document.querySelector('#edit-undo');
        return ribbon !== null;
    });
    console.log('   Edit ribbon visible:', ribbonVisible ? '✅' : '❌');

    // Check if buttons have event handlers
    console.log('\n4. Checking if buttons have click handlers...');
    const buttonInfo = await page.evaluate(() => {
        const buttons = {
            undo: document.getElementById('edit-undo'),
            redo: document.getElementById('edit-redo'),
            copy: document.getElementById('edit-copy'),
            paste: document.getElementById('edit-paste')
        };

        const info = {};
        for (let key in buttons) {
            const btn = buttons[key];
            if (btn) {
                info[key] = {
                    exists: true,
                    hasOnclick: btn.onclick !== null,
                    hasEventListener: btn._hasClickListener === true // Check if we set a marker
                };
            } else {
                info[key] = { exists: false };
            }
        }
        return info;
    });
    console.log('   Button info:', JSON.stringify(buttonInfo, null, 2));

    // Test actual functionality
    console.log('\n5. Testing Copy/Paste functionality...');

    // Enter some data in cell A1
    console.log('   - Entering data in A1...');
    await page.evaluate(() => {
        const input = document.querySelector('input[id$="inputbox"]');
        if (input) {
            input.value = 'Test Data';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Try to set cell value directly
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.EditorSaveEdit();
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Click Copy button
    console.log('   - Clicking Copy button...');
    const copyClicked = await page.evaluate(() => {
        const copyBtn = document.getElementById('edit-copy');
        if (copyBtn) {
            copyBtn.click();
            return true;
        }
        return false;
    });
    console.log('   Copy button clicked:', copyClicked ? '✅' : '❌');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Move to cell B1
    console.log('   - Moving to cell B1...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.MoveECell('B1');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Click Paste button
    console.log('   - Clicking Paste button...');
    const pasteClicked = await page.evaluate(() => {
        const pasteBtn = document.getElementById('edit-paste');
        if (pasteBtn) {
            pasteBtn.click();
            return true;
        }
        return false;
    });
    console.log('   Paste button clicked:', pasteClicked ? '✅' : '❌');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if paste worked
    console.log('\n6. Verifying paste result...');
    const cellValues = await page.evaluate(() => {
        if (!window.spreadsheet || !window.spreadsheet.sheet) return null;

        const sheet = window.spreadsheet.sheet;
        const cellA1 = sheet.GetAssessedCell('A1');
        const cellB1 = sheet.GetAssessedCell('B1');

        return {
            A1: cellA1 ? cellA1.datavalue : null,
            B1: cellB1 ? cellB1.datavalue : null
        };
    });
    console.log('   Cell values:', cellValues);

    if (cellValues && cellValues.B1 === cellValues.A1 && cellValues.A1 !== null) {
        console.log('   ✅ PASS: Copy/Paste working correctly!');
    } else {
        console.log('   ❌ FAIL: Copy/Paste not working');
    }

    // Check if window.spreadsheet.ExecuteCommand exists
    console.log('\n7. Checking ExecuteCommand availability...');
    const execCommandInfo = await page.evaluate(() => {
        return {
            windowSpreadsheetExists: typeof window.spreadsheet !== 'undefined',
            executeCommandExists: typeof window.spreadsheet?.ExecuteCommand === 'function',
            socialCalcExists: typeof SocialCalc !== 'undefined'
        };
    });
    console.log('   ExecuteCommand info:', execCommandInfo);

    await browser.close();
    console.log('\n=== Test Complete ===\n');
})();
