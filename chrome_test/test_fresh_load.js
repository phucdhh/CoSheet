const puppeteer = require('puppeteer');

(async () => {
    console.log('🔄 Opening Fresh Chrome Tab...\n');
    
    let browser;
    try {
        console.log('1️⃣  Connecting to Chrome...');
        browser = await puppeteer.connect({
            browserURL: 'http://localhost:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        
        // Close all existing CoSheet tabs
        console.log('2️⃣  Closing all existing CoSheet tabs...');
        for (const p of pages) {
            if (p.url().includes('localhost:1234')) {
                await p.close();
                console.log('   ✅ Closed:', p.url());
            }
        }
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Open completely fresh tab
        console.log('3️⃣  Opening fresh new tab...');
        const page = await browser.newPage();
        
        // Clear all cache and storage
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCache');
        await client.send('Network.clearBrowserCookies');
        
        console.log('4️⃣  Navigating to CoSheet with new version...');
        await page.goto('http://localhost:1234/_fresh?v=20241204', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('5️⃣  Checking loaded constants...\n');
        
        const check = await page.evaluate(() => {
            const results = {};
            
            if (window.SocialCalc && window.SocialCalc.Constants) {
                const c = window.SocialCalc.Constants;
                results.constants = {
                    cursorStyle: c.defaultHighlightTypeCursorStyle,
                    colnameStyle: c.defaultColnameStyle,
                    selectedColnameStyle: c.defaultSelectedColnameStyle
                };
                
                results.hasNewColors = 
                    (!c.defaultHighlightTypeCursorStyle || !c.defaultHighlightTypeCursorStyle.includes('#A6A6A6')) &&
                    c.defaultColnameStyle?.includes('#f8f9fa') &&
                    c.defaultSelectedColnameStyle?.includes('#e8f0fe');
            }
            
            // Check actual elements
            const allTds = Array.from(document.querySelectorAll('td'));
            results.oldColorCount = {
                a6a6a6: allTds.filter(td => (td.getAttribute('style') || '').match(/#A6A6A6|rgb\(166,\s*166,\s*166\)/i)).length,
                '808080': allTds.filter(td => (td.getAttribute('style') || '').match(/#808080|rgb\(128,\s*128,\s*128\)/i)).length,
                f8f9fa: allTds.filter(td => (td.getAttribute('style') || '').match(/#f8f9fa|rgb\(248,\s*249,\s*250\)/i)).length
            };
            
            return results;
        });
        
        console.log('⚙️  SocialCalc Constants:');
        console.log('   Cursor Style:', check.constants?.cursorStyle || '(empty)');
        console.log('   Colname Style:', check.constants?.colnameStyle?.substring(0, 80) + '...');
        console.log('   Selected Colname:', check.constants?.selectedColnameStyle?.substring(0, 80) + '...');
        
        console.log('\n🎨 Color Analysis:');
        console.log('   Elements with OLD #A6A6A6:', check.oldColorCount.a6a6a6);
        console.log('   Elements with OLD #808080:', check.oldColorCount['808080']);
        console.log('   Elements with NEW #f8f9fa:', check.oldColorCount.f8f9fa);
        
        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ 
            path: '/root/ethercalc/chrome_test/screenshot_fresh.png',
            fullPage: false
        });
        console.log('   ✅ Saved to: chrome_test/screenshot_fresh.png');
        
        console.log('\n🎯 RESULT:');
        if (check.hasNewColors) {
            console.log('   ✅ NEW COLOR SCHEME LOADED!');
            if (check.oldColorCount.f8f9fa > 0) {
                console.log('   ✅ New colors visible in DOM!');
            }
        } else {
            console.log('   ❌ Still loading old constants');
            console.log('   💡 ethercalc.js may not be properly compiled/built');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✋ Check screenshot_fresh.png');
})();
