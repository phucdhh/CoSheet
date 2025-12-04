const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Testing CSS on Real Chrome (iMac)...\n');
    
    let browser;
    try {
        console.log('1️⃣  Connecting to Chrome on iMac via localhost:9222...');
        browser = await puppeteer.connect({
            browserURL: 'http://localhost:9222',
            defaultViewport: null
        });
        
        console.log('   ✅ Connected to Chrome!\n');
        
        const pages = await browser.pages();
        let page;
        
        // Find existing CoSheet page or create new one
        const coSheetPage = pages.find(p => p.url().includes('localhost:1234'));
        if (coSheetPage) {
            console.log('2️⃣  Found existing CoSheet tab, using it...');
            page = coSheetPage;
        } else {
            console.log('2️⃣  Creating new tab for CoSheet...');
            page = await browser.newPage();
            await page.goto('http://localhost:1234', { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });
        }
        
        // Force reload to clear cache
        console.log('3️⃣  Forcing hard reload (clearing cache)...');
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('4️⃣  Checking CSS styles in real Chrome...\n');
        
        const styles = await page.evaluate(() => {
            const results = {};
            
            // Get CSS file timestamp
            const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            results.cssFiles = cssLinks.map(link => ({
                href: link.href,
                loaded: true
            }));
            
            // Check CSS rules directly from loaded stylesheet
            const styleSheets = Array.from(document.styleSheets);
            results.cssRules = {};
            
            for (const sheet of styleSheets) {
                if (sheet.href && sheet.href.includes('socialcalc.css')) {
                    try {
                        const rules = Array.from(sheet.cssRules || []);
                        for (const rule of rules) {
                            if (rule.selectorText === '.defaultHighlightTypeCursor') {
                                results.cssRules.cursor = {
                                    cssText: rule.cssText,
                                    border: rule.style.border,
                                    boxShadow: rule.style.boxShadow,
                                    backgroundColor: rule.style.backgroundColor
                                };
                            }
                            if (rule.selectorText === '.defaultColname') {
                                results.cssRules.colname = {
                                    cssText: rule.cssText,
                                    backgroundColor: rule.style.backgroundColor,
                                    color: rule.style.color,
                                    borderBottom: rule.style.borderBottom
                                };
                            }
                            if (rule.selectorText === '.defaultSelectedColname') {
                                results.cssRules.selectedColname = {
                                    cssText: rule.cssText,
                                    backgroundColor: rule.style.backgroundColor,
                                    color: rule.style.color,
                                    borderBottom: rule.style.borderBottom
                                };
                            }
                            if (rule.selectorText === '.defaultHighlightTypeRange') {
                                results.cssRules.range = {
                                    cssText: rule.cssText,
                                    backgroundColor: rule.style.backgroundColor,
                                    border: rule.style.border
                                };
                            }
                        }
                    } catch (e) {
                        results.cssError = e.message;
                    }
                }
            }
            
            // Check computed styles on actual elements
            const headerCol = document.querySelector('.defaultColname');
            if (headerCol) {
                const computed = window.getComputedStyle(headerCol);
                results.computed = {
                    colHeaderBg: computed.backgroundColor,
                    colHeaderColor: computed.color,
                    colHeaderBorder: computed.borderBottom
                };
            }
            
            return results;
        });
        
        console.log('📋 CSS Files Loaded:');
        styles.cssFiles.forEach(file => {
            console.log('   ✅', file.href);
        });
        
        console.log('\n📐 CSS Rules in Real Chrome:');
        
        if (styles.cssRules.cursor) {
            console.log('\n   🎯 .defaultHighlightTypeCursor (Active Cell):');
            console.log('      Border:', styles.cssRules.cursor.border || 'none');
            console.log('      Box Shadow:', styles.cssRules.cursor.boxShadow || 'none');
            console.log('      Background:', styles.cssRules.cursor.backgroundColor || 'transparent');
            
            const isNewStyle = styles.cssRules.cursor.border && 
                              (styles.cssRules.cursor.border.includes('1a73e8') || 
                               styles.cssRules.cursor.border.includes('rgb(26, 115, 232)'));
            console.log('      Status:', isNewStyle ? '✅ NEW STYLE (Google blue border)' : '❌ OLD STYLE (gray background)');
        }
        
        if (styles.cssRules.colname) {
            console.log('\n   📊 .defaultColname (Column Header):');
            console.log('      Background:', styles.cssRules.colname.backgroundColor);
            console.log('      Color:', styles.cssRules.colname.color);
            console.log('      Border Bottom:', styles.cssRules.colname.borderBottom);
            
            const isNewStyle = styles.cssRules.colname.backgroundColor &&
                              (styles.cssRules.colname.backgroundColor.includes('f8f9fa') ||
                               styles.cssRules.colname.backgroundColor.includes('rgb(248, 249, 250)'));
            console.log('      Status:', isNewStyle ? '✅ NEW STYLE (light gray)' : '❌ OLD STYLE (dark gray)');
        }
        
        if (styles.cssRules.selectedColname) {
            console.log('\n   🔷 .defaultSelectedColname (Selected Header):');
            console.log('      Background:', styles.cssRules.selectedColname.backgroundColor);
            console.log('      Color:', styles.cssRules.selectedColname.color);
            console.log('      Border Bottom:', styles.cssRules.selectedColname.borderBottom);
            
            const isNewStyle = styles.cssRules.selectedColname.backgroundColor &&
                              (styles.cssRules.selectedColname.backgroundColor.includes('e8f0fe') ||
                               styles.cssRules.selectedColname.backgroundColor.includes('rgb(232, 240, 254)'));
            console.log('      Status:', isNewStyle ? '✅ NEW STYLE (light blue)' : '❌ OLD STYLE (dark gray)');
        }
        
        if (styles.cssRules.range) {
            console.log('\n   📦 .defaultHighlightTypeRange (Range Selection):');
            console.log('      Background:', styles.cssRules.range.backgroundColor);
            console.log('      Border:', styles.cssRules.range.border);
        }
        
        if (styles.computed) {
            console.log('\n💻 Computed Styles (What You Actually See):');
            console.log('   Column Header Background:', styles.computed.colHeaderBg);
            console.log('   Column Header Color:', styles.computed.colHeaderColor);
            console.log('   Column Header Border:', styles.computed.colHeaderBorder);
        }
        
        // Take screenshot
        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ 
            path: '/root/ethercalc/chrome_test/screenshot_css.png',
            fullPage: false
        });
        console.log('   ✅ Saved to: chrome_test/screenshot_css.png');
        
        console.log('\n🎯 FINAL RESULT:');
        const allNew = styles.cssRules.cursor?.border?.includes('1a73e8') ||
                      styles.cssRules.cursor?.border?.includes('rgb(26, 115, 232)');
        
        if (allNew) {
            console.log('   ✅ NEW COLOR SCHEME IS ACTIVE!');
            console.log('   ✅ Google Sheets style blue borders applied');
            console.log('   ✅ Modern light gray headers visible');
        } else {
            console.log('   ⚠️  OLD COLOR SCHEME STILL SHOWING');
            console.log('   💡 Try: Clear all Chrome data and restart');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Chrome is running with: --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0');
        console.log('   2. SSH tunnel is active: ssh -f -N -L 9222:localhost:9222 imac@192.168.1.23');
        console.log('   3. Port 9222 is accessible from LXC container');
    }
    
    // Don't close browser - keep it open for user to see
    console.log('\n✋ Keeping Chrome open for you to inspect...');
})();
