const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    console.log('\n=== Testing Edit Tab Copy/Paste (Headless) ===\n');

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Manually set A1 value using JavaScript
    console.log('1. Setting A1 = "HELLO"...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.sheet) {
            window.spreadsheet.ExecuteSheetCommand('set A1 text t HELLO', true);
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify A1
    const a1 = await page.evaluate(() => {
        const cell = window.spreadsheet?.sheet?.cells?.['A1'];
        return cell ? cell.datavalue : null;
    });
    console.log('   A1 =', a1);

    // Click Edit tab
    console.log('\n2. Activating Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Test that buttons exist
    const buttonsExist = await page.evaluate(() => {
        return {
            copy: document.getElementById('edit-copy') !== null,
            paste: document.getElementById('edit-paste') !== null
        };
    });
    console.log('   Buttons exist:', buttonsExist);

    // Click Copy
    console.log('\n3. Clicking Copy...');
    const copyClicked = await page.evaluate(() => {
        const btn = document.getElementById('edit-copy');
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });
    console.log('   Copy clicked:', copyClicked);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check SocialCalc.Clipboard
    const clipboard = await page.evaluate(() => {
        if (typeof SocialCalc !== 'undefined' && SocialCalc.Clipboard) {
            return SocialCalc.Clipboard.clipboard;
        }
        return null;
    });
    console.log('   Clipboard has data:', clipboard !== null && clipboard.length > 0);
    if (clipboard) {
        console.log('   Clipboard preview:', clipboard.substring(0, 80));
    }

    // Move to B1
    console.log('\n4. Moving to B1...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.MoveECell('B1');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Click Paste
    console.log('\n5. Clicking Paste...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-paste');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check B1
    const b1 = await page.evaluate(() => {
        const cell = window.spreadsheet?.sheet?.cells?.['B1'];
        return cell ? cell.datavalue : null;
    });
    console.log('   B1 =', b1);

    console.log('\n=== RESULT ===');
    if (a1 === 'HELLO' && b1 === 'HELLO') {
        console.log('✅ SUCCESS! Copy/Paste working perfectly');
    } else {
        console.log('❌ FAIL - A1:', a1, 'B1:', b1);
    }

    await browser.close();
})();
