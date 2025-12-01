const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    console.log('\n=== Testing Copy/Paste with New Code ===\n');

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Enter data in A1
    console.log('1. Entering "TEST" in A1...');
    await page.waitForSelector('input[id$="inputbox"]', { timeout: 5000 });
    await page.type('input[id$="inputbox"]', 'TEST', { delay: 50 });
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify A1
    const a1Value = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.sheet) {
            const cell = window.spreadsheet.sheet.cells['A1'];
            return cell ? cell.datavalue : null;
        }
        return null;
    });
    console.log('   A1 =', a1Value);

    if (!a1Value) {
        console.log('   ❌ Could not set A1');
        await browser.close();
        return;
    }

    // Click Edit tab
    console.log('\n2. Switching to Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if getRange is working
    console.log('\n3. Checking getRange function...');
    const rangeInfo = await page.evaluate(() => {
        if (!window.spreadsheet || !window.spreadsheet.editor) {
            return { error: 'No editor' };
        }

        const editor = window.spreadsheet.editor;
        let range = '';

        if (editor.range && editor.range.hasrange) {
            range = editor.range.anchorcoord + ':' + editor.range.cursorcoord;
        } else if (editor.ecell && editor.ecell.coord) {
            range = editor.ecell.coord;
        }

        return {
            ecell: editor.ecell ? editor.ecell.coord : null,
            hasrange: editor.range ? editor.range.hasrange : false,
            computedRange: range
        };
    });
    console.log('   Range info:', rangeInfo);

    // Click Copy with logging
    console.log('\n4. Clicking Copy button...');
    const copyResult = await page.evaluate(() => {
        const btn = document.getElementById('edit-copy');
        if (!btn) return { error: 'Button not found' };

        // Log before click
        console.log('[BEFORE COPY]');
        if (window.spreadsheet && window.spreadsheet.editor) {
            const editor = window.spreadsheet.editor;
            const range = editor.ecell ? editor.ecell.coord : 'unknown';
            console.log('[BEFORE COPY] Range:', range);
        }

        // Click
        btn.click();

        // Check clipboard after
        setTimeout(() => {
            if (typeof SocialCalc !== 'undefined' && SocialCalc.Clipboard) {
                console.log('[AFTER COPY] SocialCalc.Clipboard:', SocialCalc.Clipboard.clipboard.substring(0, 100));
            }
        }, 100);

        return { success: true };
    });
    console.log('   Copy result:', copyResult);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check clipboard
    const clipboardData = await page.evaluate(() => {
        if (typeof SocialCalc !== 'undefined' && SocialCalc.Clipboard) {
            return SocialCalc.Clipboard.clipboard;
        }
        return null;
    });
    console.log('   Clipboard length:', clipboardData ? clipboardData.length : 0);
    console.log('   Clipboard preview:', clipboardData ? clipboardData.substring(0, 100) : 'null');

    // Move to B1
    console.log('\n5. Moving to B1...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.MoveECell('B1');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Click Paste
    console.log('\n6. Clicking Paste...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-paste');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check B1
    const b1Value = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.sheet) {
            const cell = window.spreadsheet.sheet.cells['B1'];
            return cell ? cell.datavalue : null;
        }
        return null;
    });
    console.log('   B1 =', b1Value);

    console.log('\n=== RESULTS ===');
    if (a1Value === b1Value && b1Value === 'TEST') {
        console.log('✅ SUCCESS! Copy/Paste working');
        console.log(`   Copied "${a1Value}" from A1 to B1`);
    } else {
        console.log('❌ FAIL');
        console.log('   A1:', a1Value);
        console.log('   B1:', b1Value);
    }

    await browser.close();
})();
