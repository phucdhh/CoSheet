const CDP = require('chrome-remote-interface');
const fs = require('fs');

async function testNavigation() {
    let client;
    try {
        console.log('Connecting to iMac Chrome...');
        client = await CDP({ host: 'localhost', port: 9222 });
        const { Page, Runtime } = client;

        await Page.enable();
        await Runtime.enable();

        console.log('Opening EtherCalc on HTTPS domain...');
        await Page.navigate({ url: 'https://dulieu.truyenthong.edu.vn/test_nav' });
        await Page.loadEventFired();

        await new Promise(r => setTimeout(r, 5000));

        // Check initial state
        console.log('\n=== Initial State ===');
        const initial = await Runtime.evaluate({
            expression: `
                (function() {
                    const indicator = document.querySelector('.upper-left-cell-indicator');
                    return {
                        indicatorText: indicator ? indicator.innerHTML : 'not found',
                        activeCell: window.SocialCalc && window.SocialCalc.GetSpreadsheetControlObject ? 
                            window.SocialCalc.GetSpreadsheetControlObject().editor.ecell.coord : 'no editor'
                    };
                })()
            `,
            returnByValue: true
        });
        console.log('Indicator:', initial.result.value.indicatorText);
        console.log('Active cell:', initial.result.value.activeCell);

        // Method 1: Use SocialCalc's MoveECell directly
        console.log('\n=== Testing MoveECell to B3 ===');
        await Runtime.evaluate({
            expression: `
                (function() {
                    const spreadsheet = window.SocialCalc.GetSpreadsheetControlObject();
                    if (spreadsheet && spreadsheet.editor) {
                        spreadsheet.editor.MoveECell('B3');
                        spreadsheet.editor.SetECellHeaders('selected');
                        return 'Moved to B3';
                    }
                    return 'No editor';
                })()
            `
        });

        await new Promise(r => setTimeout(r, 1000));

        const afterB3 = await Runtime.evaluate({
            expression: `
                (function() {
                    const indicator = document.querySelector('.upper-left-cell-indicator');
                    const spreadsheet = window.SocialCalc.GetSpreadsheetControlObject();
                    return {
                        indicatorText: indicator ? indicator.innerHTML : 'not found',
                        activeCell: spreadsheet && spreadsheet.editor ? 
                            spreadsheet.editor.ecell.coord : 'no editor'
                    };
                })()
            `,
            returnByValue: true
        });
        console.log('After MoveECell to B3:');
        console.log('  Indicator:', afterB3.result.value.indicatorText);
        console.log('  Active cell:', afterB3.result.value.activeCell);

        // Method 2: Move to D5
        console.log('\n=== Testing MoveECell to D5 ===');
        await Runtime.evaluate({
            expression: `
                (function() {
                    const spreadsheet = window.SocialCalc.GetSpreadsheetControlObject();
                    if (spreadsheet && spreadsheet.editor) {
                        spreadsheet.editor.MoveECell('D5');
                        return 'Moved to D5';
                    }
                    return 'No editor';
                })()
            `
        });

        await new Promise(r => setTimeout(r, 1000));

        const afterD5 = await Runtime.evaluate({
            expression: `
                (function() {
                    const indicator = document.querySelector('.upper-left-cell-indicator');
                    const spreadsheet = window.SocialCalc.GetSpreadsheetControlObject();
                    return {
                        indicatorText: indicator ? indicator.innerHTML : 'not found',
                        activeCell: spreadsheet && spreadsheet.editor ? 
                            spreadsheet.editor.ecell.coord : 'no editor'
                    };
                })()
            `,
            returnByValue: true
        });
        console.log('After MoveECell to D5:');
        console.log('  Indicator:', afterD5.result.value.indicatorText);
        console.log('  Active cell:', afterD5.result.value.activeCell);

        // Check callback registration
        console.log('\n=== Callback Status ===');
        const callbackInfo = await Runtime.evaluate({
            expression: `
                (function() {
                    const spreadsheet = window.SocialCalc.GetSpreadsheetControlObject();
                    if (spreadsheet && spreadsheet.editor) {
                        const callbacks = Object.keys(spreadsheet.editor.MoveECellCallback || {});
                        return {
                            hasCallback: callbacks.includes('activeCellIndicator'),
                            allCallbacks: callbacks,
                            callbackType: typeof spreadsheet.editor.MoveECellCallback.activeCellIndicator
                        };
                    }
                    return { error: 'No editor' };
                })()
            `,
            returnByValue: true
        });
        console.log('Callback info:', JSON.stringify(callbackInfo.result.value, null, 2));

        // Take screenshots
        const screenshot1 = await Page.captureScreenshot();
        fs.writeFileSync('nav_test_d5.png', Buffer.from(screenshot1.data, 'base64'));
        console.log('\nScreenshot saved: nav_test_d5.png');

        // Move back to A1
        console.log('\n=== Testing MoveECell back to A1 ===');
        await Runtime.evaluate({
            expression: `SocialCalc.GetSpreadsheetControlObject().editor.MoveECell('A1')`
        });
        await new Promise(r => setTimeout(r, 500));

        const final = await Runtime.evaluate({
            expression: `document.querySelector('.upper-left-cell-indicator').innerHTML`,
            returnByValue: true
        });
        console.log('Final indicator:', final.result.value);

        // Summary
        console.log('\n=== Navigation Test Summary ===');
        if (afterB3.result.value.indicatorText === 'B3' &&
            afterD5.result.value.indicatorText === 'D5' &&
            final.result.value === 'A1') {
            console.log('✅ Cell navigation callback working perfectly!');
            console.log('   A1 → B3 → D5 → A1 all updated correctly');
        } else {
            console.log('⚠️  Navigation results:');
            console.log('   B3:', afterB3.result.value.indicatorText, '(expected: B3)');
            console.log('   D5:', afterD5.result.value.indicatorText, '(expected: D5)');
            console.log('   A1:', final.result.value, '(expected: A1)');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (client) {
            await client.close();
        }
        process.exit();
    }
}

testNavigation();
