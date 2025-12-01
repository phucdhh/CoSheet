const puppeteer = require('puppeteer-core');

(async () => {
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

    console.log('\n=== Full Copy/Paste Flow Test ===\n');

    // Make sure we're on Sheet tab first
    console.log('1. Going to Sheet tab...');
    await page.evaluate(() => {
        const sheetTab = document.querySelector('[id$="sheettab"]');
        if (sheetTab) sheetTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Click on cell A1
    console.log('2. Clicking cell A1...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.MoveECell('A1');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get current value of A1
    const initialA1 = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.sheet) {
            const cell = window.spreadsheet.sheet.cells['A1'];
            return cell ? (cell.datavalue || cell.datatype) : null;
        }
        return null;
    });
    console.log('   Current A1 value:', initialA1);

    // Go to Edit tab
    console.log('\n3. Switching to Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click Copy
    console.log('4. Clicking Copy button...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-copy');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check clipboard
    const clipboardInfo = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.context) {
            return {
                hasClipboard: window.spreadsheet.context.clipboard !== undefined,
                clipboardContent: window.spreadsheet.context.clipboard
            };
        }
        return { hasClipboard: false };
    });
    console.log('   Clipboard:', clipboardInfo);

    // Move to B1
    console.log('\n5. Moving to cell B1...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.MoveECell('B1');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Click Paste
    console.log('6. Clicking Paste button...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-paste');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check B1 value
    const finalB1 = await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.sheet) {
            const cell = window.spreadsheet.sheet.cells['B1'];
            return cell ? (cell.datavalue || cell.datatype) : null;
        }
        return null;
    });
    console.log('   B1 value after paste:', finalB1);

    console.log('\n=== RESULTS ===');
    if (initialA1 && finalB1 && initialA1 === finalB1) {
        console.log('✅ SUCCESS! Copy/Paste working correctly');
        console.log(`   Copied "${initialA1}" from A1 to B1`);
    } else {
        console.log('⚠️  Copy/Paste may have issues:');
        console.log('   A1:', initialA1);
        console.log('   B1:', finalB1);
        if (!initialA1) {
            console.log('   ℹ️  A1 was empty - nothing to copy');
        }
    }

    await browser.disconnect();
})();
