const CDP = require('chrome-remote-interface');
const fs = require('fs');

async function verifyOnIMac() {
    let client;
    try {
        console.log('Connecting to iMac Chrome via tunnel...');
        client = await CDP({ host: 'localhost', port: 9222 });
        const { Page, Runtime, DOM } = client;

        await Page.enable();
        await Runtime.enable();
        await DOM.enable();

        console.log('Connected! Opening EtherCalc...');

        // Navigate to server IP
        await Page.navigate({ url: 'http://192.168.1.223:1234/test_ui_check' });
        await Page.loadEventFired();

        // Wait for page to fully load
        console.log('Waiting for SocialCalc to load...');
        await new Promise(r => setTimeout(r, 5000));

        // Check if upper left indicator exists and has correct content
        const indicatorCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    const el = document.querySelector('.upper-left-cell-indicator');
                    if (!el) {
                        return { found: false, reason: 'Element not found' };
                    }
                    const computedStyle = window.getComputedStyle(el);
                    return {
                        found: true,
                        text: el.innerHTML,
                        color: computedStyle.color,
                        fontWeight: computedStyle.fontWeight,
                        fontSize: computedStyle.fontSize,
                        textAlign: computedStyle.textAlign,
                        constantValue: window.SocialCalc && window.SocialCalc.Constants ? 
                            window.SocialCalc.Constants.defaultUpperLeftClass : 'undefined'
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('\\n=== Upper Left Indicator Check ===');
        console.log(JSON.stringify(indicatorCheck.result.value, null, 2));

        // Check ribbon padding
        const ribbonCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    const el = document.querySelector('.ribbon-container');
                    if (!el) return { found: false };
                    const style = window.getComputedStyle(el);
                    return {
                        found: true,
                        paddingLeft: style.paddingLeft,
                        paddingRight: style.paddingRight,
                        paddingTop: style.paddingTop,
                        paddingBottom: style.paddingBottom
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('\\n=== Ribbon Padding Check ===');
        console.log(JSON.stringify(ribbonCheck.result.value, null, 2));

        // Check if floating hint is hidden
        const hintCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    // Check if hint element exists
                    const containers = document.querySelectorAll('div[style*="position:absolute"]');
                    let hintFound = false;
                    let hintVisible = false;
                    
                    for (let el of containers) {
                        if (el.style.display === 'none' || 
                            window.getComputedStyle(el).display === 'none') {
                            continue;
                        }
                        // Check if it contains hint-like content
                        if (el.textContent.match(/^[A-Z]+\\d+$/)) {
                            hintFound = true;
                            hintVisible = window.getComputedStyle(el).display !== 'none';
                        }
                    }
                    
                    return {
                        floatingHintHidden: !hintVisible,
                        hintFound: hintFound,
                        constantValue: window.SocialCalc && window.SocialCalc.Constants ? 
                            window.SocialCalc.Constants.defaultInputEchoHintStyle : 'undefined'
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('\\n=== Floating Hint Check ===');
        console.log(JSON.stringify(hintCheck.result.value, null, 2));

        // Test cell navigation
        console.log('\\n=== Testing Cell Navigation ===');
        console.log('Clicking cell B3...');

        await Runtime.evaluate({
            expression: `
                (function() {
                    // Find and click cell B3
                    const cells = document.querySelectorAll('td');
                    for (let cell of cells) {
                        if (cell.id && cell.id.includes('cell_B3')) {
                            cell.click();
                            return 'Clicked B3';
                        }
                    }
                    return 'B3 not found';
                })()
            `
        });

        await new Promise(r => setTimeout(r, 500));

        const afterClick = await Runtime.evaluate({
            expression: `
                (function() {
                    const el = document.querySelector('.upper-left-cell-indicator');
                    return el ? el.innerHTML : 'not found';
                })()
            `,
            returnByValue: true
        });

        console.log('Indicator after clicking B3:', afterClick.result.value);

        // Take screenshot
        const screenshot = await Page.captureScreenshot();
        const filename = 'imac_verification.png';
        fs.writeFileSync(filename, Buffer.from(screenshot.data, 'base64'));
        console.log(`\\nScreenshot saved to ${filename}`);

        console.log('\\n=== Verification Summary ===');
        const indicator = indicatorCheck.result.value;
        const ribbon = ribbonCheck.result.value;
        const hint = hintCheck.result.value;

        if (indicator.found &&
            indicator.color === 'rgb(0, 102, 204)' &&
            ribbon.paddingLeft === '0px' &&
            ribbon.paddingRight === '0px' &&
            hint.floatingHintHidden) {
            console.log('✅ ALL CHECKS PASSED!');
            console.log('  - Upper left indicator: ' + indicator.text);
            console.log('  - Color: Blue (#0066cc)');
            console.log('  - Ribbon padding removed');
            console.log('  - Floating hint hidden');
        } else {
            console.log('⚠️  Some checks failed. See details above.');
        }

    } catch (err) {
        console.error('Error:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('\\nCannot connect to Chrome. Please ensure:');
            console.error('1. Chrome is running on iMac with --remote-debugging-port=9222');
            console.error('2. SSH tunnel is active: ssh -f -N -L 9222:localhost:9222 imac@192.168.1.23');
        }
    } finally {
        if (client) {
            await client.close();
        }
        process.exit();
    }
}

verifyOnIMac();
