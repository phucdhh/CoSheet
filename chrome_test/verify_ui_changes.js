const CDP = require('chrome-remote-interface');
const fs = require('fs');

async function verifyUI() {
    let client;
    try {
        client = await CDP();
        const { Page, Runtime, DOM } = client;

        await Page.enable();
        await Runtime.enable();
        await DOM.enable();
        await client.Log.enable();

        client.Log.entryAdded(({ entry }) => {
            console.log('[Browser Console]', entry.level, entry.text);
        });

        Runtime.consoleAPICalled(({ type, args }) => {
            const text = args.map(a => a.value || a.description).join(' ');
            console.log('[Browser Console API]', type, text);
        });

        console.log('Navigating...');
        await Page.navigate({ url: 'http://localhost:1234/test_ui' });
        await Page.loadEventFired();

        // Wait for SocialCalc to load
        console.log('Waiting for SocialCalc...');
        await new Promise(r => setTimeout(r, 5000));

        // Check Upper Left Indicator
        const indicatorCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    const el = document.querySelector('.upper-left-cell-indicator');
                    if (!el) {
                        // Check if defaultUpperLeftClass is set correctly in SocialCalc.Constants
                        const constant = (window.SocialCalc && window.SocialCalc.Constants) ? window.SocialCalc.Constants.defaultUpperLeftClass : 'undefined';
                        return { found: false, constant: constant };
                    }
                    return {
                        found: true,
                        text: el.innerHTML,
                        style: window.getComputedStyle(el).color
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('Upper Left Indicator:', JSON.stringify(indicatorCheck.result.value, null, 2));

        // Check Ribbon Padding
        const ribbonCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    const el = document.querySelector('.ribbon-container');
                    if (!el) return { found: false };
                    return {
                        found: true,
                        paddingLeft: window.getComputedStyle(el).paddingLeft,
                        paddingRight: window.getComputedStyle(el).paddingRight
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('Ribbon Padding:', JSON.stringify(ribbonCheck.result.value, null, 2));

        // Take Screenshot
        const screenshot = await Page.captureScreenshot();
        fs.writeFileSync('ui_verification.png', Buffer.from(screenshot.data, 'base64'));
        console.log('Screenshot saved to ui_verification.png');

    } catch (err) {
        console.error(err);
    } finally {
        if (client) {
            await client.close();
        }
        process.exit();
    }
}

verifyUI();
