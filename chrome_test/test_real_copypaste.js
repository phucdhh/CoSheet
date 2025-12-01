const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
    });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('dulieu.truyenthong.edu.vn'));

    if (!page) {
        console.log('❌ Please open dulieu.truyenthong.edu.vn first');
        await browser.disconnect();
        return;
    }

    console.log('\n=== Full Copy/Paste Test on Real Chrome ===\n');

    // Track all commands
    await page.evaluate(() => {
        window.commandLog = [];
        if (window.spreadsheet && window.spreadsheet.ExecuteCommand) {
            const original = window.spreadsheet.ExecuteCommand;
            window.spreadsheet.ExecuteCommand = function (cmd, arg) {
                window.commandLog.push({ command: cmd, argument: arg, timestamp: Date.now() });
                console.log('[COMMAND]', cmd, 'ARG:', arg);
                return original.call(this, cmd, arg);
            };
        }
    });

    // Go to Sheet tab and select A1
    console.log('1. Going to Sheet tab, selecting A1...');
    await page.evaluate(() => {
        const sheetTab = document.querySelector('[id$="sheettab"]');
        if (sheetTab) sheetTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.MoveECell('A1');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get A1 value
    const a1Value = await page.evaluate(() => {
        const cell = window.spreadsheet?.sheet?.cells?.['A1'];
        return cell ? cell.datavalue : null;
    });
    console.log('   A1 value:', a1Value);

    // Switch to Edit tab
    console.log('\n2. Switching to Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click Copy
    console.log('\n3. Clicking COPY...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-copy');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check clipboard
    const clipboardAfterCopy = await page.evaluate(() => {
        if (typeof SocialCalc !== 'undefined' && SocialCalc.Clipboard) {
            return {
                exists: true,
                length: SocialCalc.Clipboard.clipboard.length,
                preview: SocialCalc.Clipboard.clipboard.substring(0, 100)
            };
        }
        return { exists: false };
    });
    console.log('   Clipboard after copy:', clipboardAfterCopy);

    // Move to B1
    console.log('\n4. Moving to B1...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            window.spreadsheet.editor.MoveECell('B1');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Click Paste
    console.log('\n5. Clicking PASTE...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-paste');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check B1
    const b1Value = await page.evaluate(() => {
        const cell = window.spreadsheet?.sheet?.cells?.['B1'];
        return cell ? cell.datavalue : null;
    });
    console.log('   B1 value:', b1Value);

    // Get command log
    const commandLog = await page.evaluate(() => window.commandLog);

    console.log('\n=== COMMANDS EXECUTED ===');
    commandLog.forEach((cmd, i) => {
        console.log(`${i + 1}. ${cmd.command} (arg: "${cmd.argument}")`);
    });

    console.log('\n=== RESULT ===');
    if (a1Value === b1Value && a1Value !== null) {
        console.log('✅ SUCCESS! Paste worked');
        console.log(`   Copied "${a1Value}" from A1 to B1`);
    } else {
        console.log('❌ FAIL');
        console.log('   A1:', a1Value);
        console.log('   B1:', b1Value);
        console.log('\nPossible issues:');
        console.log('   - Clipboard was empty');
        console.log('   - Paste command failed');
        console.log('   - Cell was already selected when paste was called');
    }

    await browser.disconnect();
})();
