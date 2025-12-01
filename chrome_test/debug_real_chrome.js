const puppeteer = require('puppeteer-core');

(async () => {
    console.log('Connecting to Chrome at localhost:9222...');

    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
    });

    const pages = await browser.pages();
    console.log(`Found ${pages.length} open pages`);

    // Find the EtherCalc page
    let ethercalcPage = null;
    for (let page of pages) {
        const url = page.url();
        console.log('  - Page:', url);
        if (url.includes('dulieu.truyenthong.edu.vn') || url.includes('ethercalc')) {
            ethercalcPage = page;
            console.log('    ✅ Found EtherCalc page!');
            break;
        }
    }

    if (!ethercalcPage) {
        console.log('❌ No EtherCalc page found. Please open https://dulieu.truyenthong.edu.vn in Chrome first.');
        await browser.disconnect();
        return;
    }

    console.log('\n=== Debugging Edit Tab ===\n');

    // Check if Edit tab is active
    const editTabActive = await ethercalcPage.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        return editTab ? editTab.style.cssText.includes('selected') || editTab.className.includes('selected') : false;
    });
    console.log('1. Edit tab active:', editTabActive);

    // Check if buttons exist
    const buttonsInfo = await ethercalcPage.evaluate(() => {
        const buttons = ['edit-undo', 'edit-redo', 'edit-copy', 'edit-paste'];
        const info = {};
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            info[id] = {
                exists: btn !== null,
                visible: btn ? (btn.offsetParent !== null) : false,
                hasOnclick: btn ? (btn.onclick !== null) : false
            };
        });
        return info;
    });
    console.log('\n2. Buttons status:', JSON.stringify(buttonsInfo, null, 2));

    // Check if EditLayout exists and was initialized
    const editLayoutInfo = await ethercalcPage.evaluate(() => {
        return {
            EditLayoutExists: typeof window.EditLayout !== 'undefined',
            containerExists: window.EditLayout?.container !== null,
            containerHasContent: window.EditLayout?.container?.innerHTML?.length > 0
        };
    });
    console.log('\n3. EditLayout status:', editLayoutInfo);

    // Try to click Copy button and see what happens
    console.log('\n4. Testing Copy button click...');
    const clickResult = await ethercalcPage.evaluate(() => {
        const copyBtn = document.getElementById('edit-copy');
        if (!copyBtn) return { error: 'Button not found' };

        if (!copyBtn.onclick) return { error: 'No onclick handler' };

        // Try to click
        try {
            copyBtn.click();
            return { success: true, onclick: copyBtn.onclick.toString().substring(0, 100) };
        } catch (e) {
            return { error: e.message };
        }
    });
    console.log('   Click result:', clickResult);

    // Check if window.spreadsheet exists
    const spreadsheetInfo = await ethercalcPage.evaluate(() => {
        return {
            windowSpreadsheetExists: typeof window.spreadsheet !== 'undefined',
            hasExecuteCommand: typeof window.spreadsheet?.ExecuteCommand === 'function'
        };
    });
    console.log('\n5. Spreadsheet API:', spreadsheetInfo);

    console.log('\n✅ Debug complete. Browser will remain open for manual inspection.');

    await browser.disconnect();
})();
