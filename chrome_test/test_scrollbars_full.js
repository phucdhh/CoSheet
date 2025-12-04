const puppeteer = require('puppeteer');

(async () => {
    console.log('🎨 Testing Scrollbars with Full Spreadsheet Load...\n');
    
    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: 'http://localhost:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        
        // Use existing tab or create new
        let page = pages.find(p => p.url().includes('localhost:1234'));
        if (!page) {
            page = await browser.newPage();
        }
        
        console.log('1️⃣  Loading spreadsheet...');
        await page.goto('http://localhost:1234/_scrolltest', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        console.log('2️⃣  Waiting for spreadsheet to render...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Add some data to trigger scrollbars
        console.log('3️⃣  Adding data to trigger scrollbars...');
        await page.evaluate(() => {
            if (window.SocialCalc && window.SocialCalc.GetCurrentWorkBookControl) {
                const wbc = window.SocialCalc.GetCurrentWorkBookControl();
                if (wbc && wbc.workbook && wbc.workbook.spreadsheet) {
                    const sheet = wbc.workbook.spreadsheet;
                    // Add data to multiple cells to ensure scrollbars appear
                    for (let i = 1; i <= 50; i++) {
                        sheet.ExecuteCommand('set A' + i + ' value n ' + i);
                        sheet.ExecuteCommand('set B' + i + ' value t Data' + i);
                    }
                }
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('4️⃣  Checking scrollbar elements...\n');
        
        const info = await page.evaluate(() => {
            const results = {
                scrollbars: [],
                buttons: [],
                thumbs: []
            };
            
            // Find all elements
            const allDivs = Array.from(document.querySelectorAll('div'));
            
            // Look for scrollbar-related IDs/classes
            allDivs.forEach(div => {
                const id = div.id || '';
                const className = div.className || '';
                
                if (id.includes('scroll') || className.includes('scroll') || 
                    className.includes('TC') || id.includes('te_')) {
                    results.scrollbars.push({
                        id: id,
                        className: className,
                        width: div.offsetWidth,
                        height: div.offsetHeight,
                        visible: div.offsetWidth > 0 && div.offsetHeight > 0
                    });
                }
                
                if (className.includes('TCthumb')) {
                    const style = window.getComputedStyle(div);
                    results.thumbs.push({
                        id: id,
                        width: style.width,
                        height: style.height,
                        bg: style.backgroundColor,
                        borderRadius: style.borderRadius
                    });
                }
                
                if (className.includes('TClessbutton') || className.includes('TCmorebutton')) {
                    const style = window.getComputedStyle(div);
                    results.buttons.push({
                        className: className,
                        bg: style.backgroundColor,
                        color: style.color,
                        visible: div.offsetWidth > 0 && div.offsetHeight > 0
                    });
                }
            });
            
            return results;
        });
        
        console.log('📊 Found Elements:');
        console.log('   Scrollbar containers:', info.scrollbars.length);
        console.log('   Thumbs:', info.thumbs.length);
        console.log('   Buttons:', info.buttons.length);
        
        console.log('\n📋 Scrollbar Details:');
        info.scrollbars.filter(s => s.visible).slice(0, 5).forEach((s, i) => {
            console.log(`   ${i + 1}. ID: ${s.id || '(none)'}, Class: ${s.className || '(none)'}`);
            console.log(`      Size: ${s.width}x${s.height}px`);
        });
        
        if (info.thumbs.length > 0) {
            console.log('\n🎯 Thumb Styles:');
            info.thumbs.slice(0, 2).forEach((t, i) => {
                console.log(`   ${i + 1}. Size: ${t.width} x ${t.height}`);
                console.log(`      Background: ${t.bg}`);
                console.log(`      Border Radius: ${t.borderRadius}`);
                const isModern = t.borderRadius === '4px' && t.bg.includes('218, 225, 224');
                console.log(`      Style: ${isModern ? '✅ MODERN' : '⚠️  Check CSS'}`);
            });
        }
        
        if (info.buttons.length > 0) {
            console.log('\n🔘 Button Styles:');
            const btn = info.buttons[0];
            console.log(`   Background: ${btn.bg}`);
            console.log(`   Color: ${btn.color}`);
            console.log(`   Visible: ${btn.visible ? 'YES' : 'NO'}`);
        }
        
        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ 
            path: '/root/ethercalc/chrome_test/screenshot_scrollbars_full.png',
            fullPage: false
        });
        console.log('   ✅ Saved: screenshot_scrollbars_full.png');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
})();
