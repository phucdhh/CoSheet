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

    console.log('\n=== Testing getRange() in Real Chrome ===\n');

    // Make sure on Edit tab
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test the actual getRange function
    const rangeTest = await page.evaluate(() => {
        // This is the EXACT same logic as in edit-layout.js
        const getRange = function () {
            if (!window.spreadsheet || !window.spreadsheet.editor) return 'NO_EDITOR';

            const editor = window.spreadsheet.editor;

            console.log('[DEBUG] editor.range:', editor.range);
            console.log('[DEBUG] editor.range.hasrange:', editor.range ? editor.range.hasrange : 'N/A');
            console.log('[DEBUG] editor.range.anchorcoord:', editor.range ? editor.range.anchorcoord : 'N/A');
            console.log('[DEBUG] editor.ecell:', editor.ecell);
            console.log('[DEBUG] editor.ecell.coord:', editor.ecell ? editor.ecell.coord : 'N/A');

            // If there's a selection range, use it
            if (editor.range && editor.range.hasrange) {
                return editor.range.anchorcoord + ':' + editor.range.cursorcoord;
            }

            // Otherwise use current cell
            if (editor.ecell && editor.ecell.coord) {
                return editor.ecell.coord;
            }

            return 'NO_RANGE';
        };

        const result = getRange();
        console.log('[RESULT] getRange() returned:', result);

        return {
            result: result,
            ecell: window.spreadsheet.editor.ecell ? window.spreadsheet.editor.ecell.coord : null,
            hasrange: window.spreadsheet.editor.range ? window.spreadsheet.editor.range.hasrange : null,
            anchorcoord: window.spreadsheet.editor.range ? window.spreadsheet.editor.range.anchorcoord : null,
            cursorcoord: window.spreadsheet.editor.range ? window.spreadsheet.editor.range.cursorcoord : null
        };
    });

    console.log('getRange() result:', rangeTest);

    // Now test clicking Copy
    console.log('\n=== Testing Copy Button ===\n');

    await page.evaluate(() => {
        window.commandLog = [];
        if (window.spreadsheet && window.spreadsheet.ExecuteCommand) {
            const original = window.spreadsheet.ExecuteCommand;
            window.spreadsheet.ExecuteCommand = function (cmd, arg) {
                window.commandLog.push({ command: cmd, argument: arg });
                console.log('[COMMAND]', cmd, 'ARG:', arg);
                return original.call(this, cmd, arg);
            };
        }
    });

    await page.evaluate(() => {
        const btn = document.getElementById('edit-copy');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    const commandLog = await page.evaluate(() => window.commandLog);
    console.log('Command log:', commandLog);

    await browser.disconnect();
})();
