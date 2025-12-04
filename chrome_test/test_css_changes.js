const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Testing CSS Color Scheme Changes...\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-cache']
    });
    
    const page = await browser.newPage();
    
    // Disable cache
    await page.setCacheEnabled(false);
    
    try {
        console.log('1️⃣  Opening CoSheet with cache disabled...');
        await page.goto('http://localhost:1234', { 
            waitUntil: 'networkidle2', 
            timeout: 10000 
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('2️⃣  Checking CSS styles...\n');
        
        const styles = await page.evaluate(() => {
            const results = {};
            
            // Check if socialcalc.css is loaded
            const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            results.cssFiles = cssLinks.map(link => link.href);
            
            // Get computed styles for key elements
            const colHeader = document.querySelector('.defaultColname');
            const selectedColHeader = document.querySelector('.defaultSelectedColname');
            const cursorCell = document.querySelector('.defaultHighlightTypeCursor');
            const rangeCell = document.querySelector('.defaultHighlightTypeRange');
            
            if (colHeader) {
                const colStyle = window.getComputedStyle(colHeader);
                results.colHeader = {
                    backgroundColor: colStyle.backgroundColor,
                    color: colStyle.color,
                    borderBottom: colStyle.borderBottom
                };
            }
            
            if (selectedColHeader) {
                const selColStyle = window.getComputedStyle(selectedColHeader);
                results.selectedColHeader = {
                    backgroundColor: selColStyle.backgroundColor,
                    color: selColStyle.color,
                    borderBottom: selColStyle.borderBottom
                };
            }
            
            // Check CSS rules directly
            const styleSheets = Array.from(document.styleSheets);
            results.cssRules = {};
            
            for (const sheet of styleSheets) {
                if (sheet.href && sheet.href.includes('socialcalc.css')) {
                    try {
                        const rules = Array.from(sheet.cssRules || []);
                        for (const rule of rules) {
                            if (rule.selectorText === '.defaultHighlightTypeCursor') {
                                results.cssRules.cursor = rule.cssText;
                            }
                            if (rule.selectorText === '.defaultColname') {
                                results.cssRules.colname = rule.cssText;
                            }
                            if (rule.selectorText === '.defaultSelectedColname') {
                                results.cssRules.selectedColname = rule.cssText;
                            }
                            if (rule.selectorText === '.defaultHighlightTypeRange') {
                                results.cssRules.range = rule.cssText;
                            }
                        }
                    } catch (e) {
                        results.cssError = e.message;
                    }
                }
            }
            
            return results;
        });
        
        console.log('📋 CSS Files Loaded:');
        styles.cssFiles.forEach(file => {
            if (file.includes('socialcalc.css')) {
                console.log('   ✅', file);
            }
        });
        
        console.log('\n📐 CSS Rules Found:');
        if (styles.cssRules.cursor) {
            console.log('   .defaultHighlightTypeCursor:');
            console.log('   ', styles.cssRules.cursor);
            const hasNewStyle = styles.cssRules.cursor.includes('#1a73e8') || 
                               styles.cssRules.cursor.includes('border: 2px solid');
            console.log('   New style applied:', hasNewStyle ? '✅ YES' : '❌ NO (still old gray background)');
        }
        
        if (styles.cssRules.colname) {
            console.log('\n   .defaultColname:');
            console.log('   ', styles.cssRules.colname);
            const hasNewColor = styles.cssRules.colname.includes('#f8f9fa') || 
                               styles.cssRules.colname.includes('#212529');
            console.log('   New colors applied:', hasNewColor ? '✅ YES' : '❌ NO (still old gray)');
        }
        
        if (styles.cssRules.selectedColname) {
            console.log('\n   .defaultSelectedColname:');
            console.log('   ', styles.cssRules.selectedColname);
            const hasNewColor = styles.cssRules.selectedColname.includes('#e8f0fe') || 
                               styles.cssRules.selectedColname.includes('#1a73e8');
            console.log('   New colors applied:', hasNewColor ? '✅ YES' : '❌ NO (still old dark gray)');
        }
        
        if (styles.cssRules.range) {
            console.log('\n   .defaultHighlightTypeRange:');
            console.log('   ', styles.cssRules.range);
        }
        
        // Check actual file content
        console.log('\n3️⃣  Checking socialcalc.css file content...');
        const cssContent = await page.evaluate(async () => {
            const response = await fetch('/static/socialcalc.css');
            const text = await response.text();
            return {
                hasCursorBorder: text.includes('.defaultHighlightTypeCursor') && text.includes('#1a73e8'),
                hasNewColname: text.includes('.defaultColname') && text.includes('#f8f9fa'),
                hasNewSelected: text.includes('.defaultSelectedColname') && text.includes('#e8f0fe'),
                snippet: text.substring(text.indexOf('.defaultHighlightTypeCursor'), text.indexOf('.defaultHighlightTypeCursor') + 200)
            };
        });
        
        console.log('   File contains new cursor style (#1a73e8 border):', cssContent.hasCursorBorder ? '✅ YES' : '❌ NO');
        console.log('   File contains new colname colors (#f8f9fa):', cssContent.hasNewColname ? '✅ YES' : '❌ NO');
        console.log('   File contains new selected colors (#e8f0fe):', cssContent.hasNewSelected ? '✅ YES' : '❌ NO');
        
        if (cssContent.snippet) {
            console.log('\n   Cursor CSS snippet from file:');
            console.log('   ', cssContent.snippet);
        }
        
        // Overall assessment
        const cssApplied = cssContent.hasCursorBorder && cssContent.hasNewColname && cssContent.hasNewSelected;
        console.log('\n🎯 Final Assessment:');
        if (cssApplied) {
            console.log('   ✅ CSS changes ARE in the file and should be visible');
            console.log('   ℹ️  If not visible, try:');
            console.log('      - Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)');
            console.log('      - Clear browser cache completely');
            console.log('      - Try incognito/private mode');
            console.log('      - Restart ethercalc service: systemctl restart ethercalc');
        } else {
            console.log('   ❌ CSS changes NOT found in file');
            console.log('   ⚠️  File may not have been updated properly');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();
