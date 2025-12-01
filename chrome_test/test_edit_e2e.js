const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[TEST]') || text.includes('ERROR') || text.includes('error')) {
            console.log(text);
        }
    });

    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });

    console.log('\n=== End-to-End Edit Tab Test ===\n');

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('1. Setting up test data...');
    // Enter data in A1
    await page.evaluate(() => {
        console.log('[TEST] Setting cell A1 to "Hello"');
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.RangeChangeIntervalOn();
            window.spreadsheet.editor.MoveECell('A1');
            window.spreadsheet.editor.EditorScheduleRender();
        }
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Type in the input box
    await page.type('input[id$="inputbox"]', 'Hello', { delay: 50 });
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify A1 has value
    const valueA1 = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.sheet) {
            const cell = window.spreadsheet.sheet.cells['A1'];
            console.log('[TEST] Cell A1 value:', cell ? cell.datavalue : 'null');
            return cell ? cell.datavalue : null;
        }
        return null;
    });
    console.log('   A1 value:', valueA1);

    if (valueA1 !== 'Hello') {
        console.log('   ❌ FAIL: Could not set A1 value');
        await browser.close();
        return;
    }

    console.log('\n2. Activating Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) {
            console.log('[TEST] Clicking Edit tab');
            editTab.click();
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n3. Clicking Copy button...');
    await page.evaluate(() => {
        const copyBtn = document.getElementById('edit-copy');
        if (copyBtn) {
            console.log('[TEST] Clicking Copy button');
            copyBtn.click();
        } else {
            console.log('[TEST] ERROR: Copy button not found');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('\n4. Moving to cell B1...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            console.log('[TEST] Moving to B1');
            window.spreadsheet.editor.MoveECell('B1');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('\n5. Clicking Paste button...');
    await page.evaluate(() => {
        const pasteBtn = document.getElementById('edit-paste');
        if (pasteBtn) {
            console.log('[TEST] Clicking Paste button');
            pasteBtn.click();
        } else {
            console.log('[TEST] ERROR: Paste button not found');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n6. Verifying paste result...');
    const result = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.sheet) {
            const cellA1 = window.spreadsheet.sheet.cells['A1'];
            const cellB1 = window.spreadsheet.sheet.cells['B1'];

            const a1val = cellA1 ? cellA1.datavalue : null;
            const b1val = cellB1 ? cellB1.datavalue : null;

            console.log('[TEST] A1 value:', a1val);
            console.log('[TEST] B1 value:', b1val);

            return {
                A1: a1val,
                B1: b1val,
                success: a1val === b1val && a1val !== null
            };
        }
        return { A1: null, B1: null, success: false };
    });

    console.log('   Result:', result);

    if (result.success) {
        console.log('\n   ✅ SUCCESS: Copy/Paste working correctly!');
        console.log(`   Copied "${result.A1}" from A1 to B1`);
    } else {
        console.log('\n   ❌ FAIL: Copy/Paste did not work');
        console.log(`   A1="${result.A1}", B1="${result.B1}"`);
    }

    // Take screenshot
    await page.screenshot({
        path: 'edit_tab_test_result.png',
        fullPage: false
    });
    console.log('\n   Screenshot saved: edit_tab_test_result.png');

    await browser.close();
    console.log('\n=== Test Complete ===\n');
})();
