const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
    });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('dulieu.truyenthong.edu.vn'));

    console.log('\n=== Checking Editor State ===\n');

    // Check editor state when on a cell
    const editorInfo = await page.evaluate(() => {
        if (!window.spreadsheet || !window.spreadsheet.editor) {
            return { error: 'No editor' };
        }

        const editor = window.spreadsheet.editor;
        return {
            ecell: editor.ecell ? editor.ecell.coord : null,
            range: editor.range ? editor.range.anchorcoord + ':' + editor.range.cursorcoord : null,
            range2: editor.range2 ? editor.range2.anchorcoord + ':' + editor.range2.cursorcoord : null,
            state: editor.state,
            hasRange: editor.range !== undefined,
            hasRange2: editor.range2 !== undefined
        };
    });

    console.log('Editor state:', JSON.stringify(editorInfo, null, 2));

    console.log('\n=== Testing Copy with Range ===\n');

    // Try copy with explicit range
    const copyResult = await page.evaluate(() => {
        if (!window.spreadsheet || !window.spreadsheet.editor) {
            return { error: 'No editor' };
        }

        const editor = window.spreadsheet.editor;
        const range = editor.range ? (editor.range.anchorcoord + ':' + editor.range.cursorcoord) : editor.ecell.coord;

        console.log('[TEST] Copying range:', range);

        // Execute copy with range
        if (window.spreadsheet.ExecuteCommand) {
            window.spreadsheet.ExecuteCommand('copy', range);
        }

        // Check clipboard
        return {
            range: range,
            clipboard: window.spreadsheet.context.clipboard ? window.spreadsheet.context.clipboard.substring(0, 100) : null,
            socialcalcClipboard: typeof SocialCalc !== 'undefined' && SocialCalc.Clipboard ? SocialCalc.Clipboard.clipboard.substring(0, 100) : null
        };
    });

    console.log('Copy result:', JSON.stringify(copyResult, null, 2));

    await browser.disconnect();
})();
