const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Debugging CSS Runtime Application...\n');
    
    let browser;
    try {
        console.log('1️⃣  Connecting to Chrome...');
        browser = await puppeteer.connect({
            browserURL: 'http://localhost:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        let page = pages.find(p => p.url().includes('localhost:1234'));
        
        if (!page) {
            page = await browser.newPage();
            await page.goto('http://localhost:1234/_test', { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });
        }
        
        console.log('2️⃣  Reloading page to clear cache...');
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('3️⃣  Inspecting actual rendered styles...\n');
        
        const analysis = await page.evaluate(() => {
            const results = {};
            
            // Find actual column header element
            const colHeader = document.querySelector('td[id^="col"]');
            if (colHeader) {
                const computed = window.getComputedStyle(colHeader);
                const inline = colHeader.getAttribute('style');
                
                results.colHeader = {
                    id: colHeader.id,
                    className: colHeader.className,
                    inlineStyle: inline,
                    computedBg: computed.backgroundColor,
                    computedColor: computed.color,
                    computedBorder: computed.borderBottom
                };
            }
            
            // Find actual cell element
            const cell = document.querySelector('td[id^="cell"]');
            if (cell) {
                const computed = window.getComputedStyle(cell);
                const inline = cell.getAttribute('style');
                
                results.cell = {
                    id: cell.id,
                    className: cell.className,
                    inlineStyle: inline,
                    computedBg: computed.backgroundColor,
                    computedColor: computed.color,
                    computedBorder: computed.border
                };
            }
            
            // Check SocialCalc constants
            if (window.SocialCalc && window.SocialCalc.Constants) {
                const c = window.SocialCalc.Constants;
                results.constants = {
                    cursorStyle: c.defaultHighlightTypeCursorStyle,
                    colnameStyle: c.defaultColnameStyle,
                    selectedColnameStyle: c.defaultSelectedColnameStyle,
                    rownameStyle: c.defaultRownameStyle,
                    selectedRownameStyle: c.defaultSelectedRownameStyle
                };
            }
            
            // Get all td elements and check for inline styles with old colors
            const allTds = Array.from(document.querySelectorAll('td'));
            results.oldStyleCount = {
                a6a6a6: 0,
                '808080': 0,
                '404040': 0,
                total: allTds.length
            };
            
            allTds.forEach(td => {
                const style = td.getAttribute('style') || '';
                if (style.match(/#A6A6A6|rgb\(166,\s*166,\s*166\)/i)) {
                    results.oldStyleCount.a6a6a6++;
                }
                if (style.match(/#808080|rgb\(128,\s*128,\s*128\)/i)) {
                    results.oldStyleCount['808080']++;
                }
                if (style.match(/#404040|rgb\(64,\s*64,\s*64\)/i)) {
                    results.oldStyleCount['404040']++;
                }
            });
            
            return results;
        });
        
        console.log('📊 Column Header Analysis:');
        if (analysis.colHeader) {
            console.log('   ID:', analysis.colHeader.id);
            console.log('   Class:', analysis.colHeader.className || '(none)');
            console.log('   Inline Style:', analysis.colHeader.inlineStyle || '(none)');
            console.log('   Computed Background:', analysis.colHeader.computedBg);
            console.log('   Computed Color:', analysis.colHeader.computedColor);
            console.log('   Computed Border:', analysis.colHeader.computedBorder);
            
            const hasOldColors = analysis.colHeader.inlineStyle?.includes('#808080') ||
                                analysis.colHeader.inlineStyle?.includes('#404040') ||
                                analysis.colHeader.computedBg === 'rgb(128, 128, 128)';
            console.log('   ⚠️  Old colors detected:', hasOldColors ? 'YES' : 'NO');
        }
        
        console.log('\n📦 Cell Analysis:');
        if (analysis.cell) {
            console.log('   ID:', analysis.cell.id);
            console.log('   Class:', analysis.cell.className || '(none)');
            console.log('   Inline Style:', analysis.cell.inlineStyle ? analysis.cell.inlineStyle.substring(0, 100) + '...' : '(none)');
            console.log('   Computed Background:', analysis.cell.computedBg);
            console.log('   Computed Border:', analysis.cell.computedBorder);
        }
        
        console.log('\n⚙️  SocialCalc Constants (from ethercalc.js):');
        if (analysis.constants) {
            console.log('   Cursor Style:', analysis.constants.cursorStyle || '(empty)');
            console.log('   Colname Style:', analysis.constants.colnameStyle);
            console.log('   Selected Colname:', analysis.constants.selectedColnameStyle);
            
            const hasOldInConstants = 
                (analysis.constants.cursorStyle?.includes('#A6A6A6')) ||
                (analysis.constants.colnameStyle?.includes('#808080')) ||
                (analysis.constants.selectedColnameStyle?.includes('#404040'));
            
            console.log('   ⚠️  Old colors in constants:', hasOldInConstants ? 'YES - NOT UPDATED!' : 'NO - Updated!');
        }
        
        console.log('\n🔍 Scanning all TDs for old colors:');
        console.log('   Total TD elements:', analysis.oldStyleCount.total);
        console.log('   With #A6A6A6 (old cursor):', analysis.oldStyleCount.a6a6a6);
        console.log('   With #808080 (old header):', analysis.oldStyleCount['808080']);
        console.log('   With #404040 (old selected):', analysis.oldStyleCount['404040']);
        
        if (analysis.oldStyleCount.a6a6a6 > 0 || analysis.oldStyleCount['808080'] > 0 || analysis.oldStyleCount['404040'] > 0) {
            console.log('\n   ❌ OLD INLINE STYLES STILL BEING APPLIED!');
            console.log('   💡 ethercalc.js may not be reloaded or constants not updated');
        }
        
        // Check if ethercalc.js file has been updated
        console.log('\n4️⃣  Checking ethercalc.js file content...');
        const jsCheck = await page.evaluate(async () => {
            const response = await fetch('/static/ethercalc.js');
            const text = await response.text();
            return {
                hasOldCursor: text.includes('defaultHighlightTypeCursorStyle: "color:#FFF;backgroundColor:#A6A6A6;"'),
                hasOldColname: text.includes('defaultColnameStyle: "overflow:visible;font-size:small;text-align:center;color:#FFFFFF;background-color:#808080;"'),
                hasNewColname: text.includes('background-color:#f8f9fa'),
                size: text.length
            };
        });
        
        console.log('   File size:', jsCheck.size, 'bytes');
        console.log('   Contains OLD cursor style:', jsCheck.hasOldCursor ? '❌ YES' : '✅ NO');
        console.log('   Contains OLD colname style:', jsCheck.hasOldColname ? '❌ YES' : '✅ NO');
        console.log('   Contains NEW colname style (#f8f9fa):', jsCheck.hasNewColname ? '✅ YES' : '❌ NO');
        
        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ 
            path: '/root/ethercalc/chrome_test/screenshot_debug.png',
            fullPage: false
        });
        console.log('   ✅ Saved to: chrome_test/screenshot_debug.png');
        
        console.log('\n🎯 DIAGNOSIS:');
        if (jsCheck.hasOldCursor || jsCheck.hasOldColname) {
            console.log('   ❌ ethercalc.js FILE NOT UPDATED');
            console.log('   💡 File changes may not have been saved properly');
        } else if (analysis.constants && (analysis.constants.colnameStyle?.includes('#808080'))) {
            console.log('   ❌ ethercalc.js UPDATED but OLD CONSTANTS IN MEMORY');
            console.log('   💡 Browser loaded old version - need hard refresh or restart server');
        } else if (analysis.oldStyleCount['808080'] > 0) {
            console.log('   ❌ INLINE STYLES BEING APPLIED DYNAMICALLY');
            console.log('   💡 Code is generating old styles at runtime - need to find where');
        } else {
            console.log('   ✅ All checks passed - colors should be visible!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✋ Done - check screenshot_debug.png');
})();
