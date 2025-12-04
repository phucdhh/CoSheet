const puppeteer = require('puppeteer');

(async () => {
    console.log('🎨 Testing Google Sheets Style Scrollbars...\n');
    
    let browser;
    try {
        console.log('1️⃣  Connecting to Chrome...');
        browser = await puppeteer.connect({
            browserURL: 'http://localhost:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        
        // Close old tabs
        console.log('2️⃣  Closing old CoSheet tabs...');
        for (const p of pages) {
            if (p.url().includes('localhost:1234')) {
                await p.close();
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('3️⃣  Opening fresh tab with new scrollbar styles...');
        const page = await browser.newPage();
        
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCache');
        
        await page.goto('http://localhost:1234/_scrolltest?v=20241204v2', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('4️⃣  Analyzing scrollbar elements...\n');
        
        const scrollbarInfo = await page.evaluate(() => {
            const results = {};
            
            // Find horizontal scrollbar
            const hScroll = document.querySelector('[id*="scrollhor"]');
            if (hScroll) {
                const computed = window.getComputedStyle(hScroll);
                results.horizontal = {
                    id: hScroll.id,
                    height: computed.height,
                    backgroundColor: computed.backgroundColor,
                    borderTop: computed.borderTop,
                    display: computed.display,
                    visible: hScroll.offsetHeight > 0
                };
                
                const hThumb = hScroll.querySelector('.TCthumb');
                if (hThumb) {
                    const thumbStyle = window.getComputedStyle(hThumb);
                    results.horizontal.thumb = {
                        height: thumbStyle.height,
                        backgroundColor: thumbStyle.backgroundColor,
                        borderRadius: thumbStyle.borderRadius,
                        cursor: thumbStyle.cursor
                    };
                }
            }
            
            // Find vertical scrollbar
            const vScroll = document.querySelector('[id*="scrollvert"]');
            if (vScroll) {
                const computed = window.getComputedStyle(vScroll);
                results.vertical = {
                    id: vScroll.id,
                    width: computed.width,
                    backgroundColor: computed.backgroundColor,
                    borderLeft: computed.borderLeft,
                    display: computed.display,
                    visible: vScroll.offsetWidth > 0
                };
                
                const vThumb = vScroll.querySelector('.TCthumb');
                if (vThumb) {
                    const thumbStyle = window.getComputedStyle(vThumb);
                    results.vertical.thumb = {
                        width: thumbStyle.width,
                        backgroundColor: thumbStyle.backgroundColor,
                        borderRadius: thumbStyle.borderRadius,
                        cursor: thumbStyle.cursor
                    };
                }
            }
            
            // Find scroll buttons
            const lessButtons = Array.from(document.querySelectorAll('.TClessbutton'));
            const moreButtons = Array.from(document.querySelectorAll('.TCmorebutton'));
            
            results.buttons = {
                lessCount: lessButtons.length,
                moreCount: moreButtons.length,
                lessVisible: lessButtons.filter(b => b.offsetWidth > 0).length,
                moreVisible: moreButtons.filter(b => b.offsetWidth > 0).length
            };
            
            if (lessButtons[0]) {
                const btnStyle = window.getComputedStyle(lessButtons[0]);
                results.buttons.style = {
                    backgroundColor: btnStyle.backgroundColor,
                    color: btnStyle.color,
                    cursor: btnStyle.cursor,
                    transition: btnStyle.transition
                };
            }
            
            return results;
        });
        
        console.log('📏 Horizontal Scrollbar:');
        if (scrollbarInfo.horizontal) {
            console.log('   ID:', scrollbarInfo.horizontal.id);
            console.log('   Height:', scrollbarInfo.horizontal.height);
            console.log('   Background:', scrollbarInfo.horizontal.backgroundColor);
            console.log('   Border Top:', scrollbarInfo.horizontal.borderTop);
            console.log('   Visible:', scrollbarInfo.horizontal.visible ? '✅ YES' : '❌ NO');
            
            if (scrollbarInfo.horizontal.thumb) {
                console.log('   Thumb:');
                console.log('      Height:', scrollbarInfo.horizontal.thumb.height);
                console.log('      Background:', scrollbarInfo.horizontal.thumb.backgroundColor);
                console.log('      Border Radius:', scrollbarInfo.horizontal.thumb.borderRadius);
                console.log('      Cursor:', scrollbarInfo.horizontal.thumb.cursor);
            }
            
            const isModern = scrollbarInfo.horizontal.height === '16px' &&
                           scrollbarInfo.horizontal.thumb?.borderRadius === '4px';
            console.log('   Style:', isModern ? '✅ MODERN (Google Sheets)' : '⚠️  Old Style');
        }
        
        console.log('\n📐 Vertical Scrollbar:');
        if (scrollbarInfo.vertical) {
            console.log('   ID:', scrollbarInfo.vertical.id);
            console.log('   Width:', scrollbarInfo.vertical.width);
            console.log('   Background:', scrollbarInfo.vertical.backgroundColor);
            console.log('   Border Left:', scrollbarInfo.vertical.borderLeft);
            console.log('   Visible:', scrollbarInfo.vertical.visible ? '✅ YES' : '❌ NO');
            
            if (scrollbarInfo.vertical.thumb) {
                console.log('   Thumb:');
                console.log('      Width:', scrollbarInfo.vertical.thumb.width);
                console.log('      Background:', scrollbarInfo.vertical.thumb.backgroundColor);
                console.log('      Border Radius:', scrollbarInfo.vertical.thumb.borderRadius);
            }
            
            const isModern = scrollbarInfo.vertical.width === '16px' &&
                           scrollbarInfo.vertical.thumb?.borderRadius === '4px';
            console.log('   Style:', isModern ? '✅ MODERN (Google Sheets)' : '⚠️  Old Style');
        }
        
        console.log('\n🔘 Scroll Buttons:');
        if (scrollbarInfo.buttons) {
            console.log('   Less Buttons:', scrollbarInfo.buttons.lessCount, 'found,', scrollbarInfo.buttons.lessVisible, 'visible');
            console.log('   More Buttons:', scrollbarInfo.buttons.moreCount, 'found,', scrollbarInfo.buttons.moreVisible, 'visible');
            
            if (scrollbarInfo.buttons.style) {
                console.log('   Style:');
                console.log('      Background:', scrollbarInfo.buttons.style.backgroundColor);
                console.log('      Color:', scrollbarInfo.buttons.style.color);
                console.log('      Has Transition:', scrollbarInfo.buttons.style.transition !== 'all 0s ease 0s' ? '✅ YES' : '❌ NO');
            }
        }
        
        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ 
            path: '/root/ethercalc/chrome_test/screenshot_scrollbars.png',
            fullPage: false
        });
        console.log('   ✅ Saved to: chrome_test/screenshot_scrollbars.png');
        
        console.log('\n🎯 RESULT:');
        const hModern = scrollbarInfo.horizontal?.height === '16px';
        const vModern = scrollbarInfo.vertical?.width === '16px';
        const thumbRounded = scrollbarInfo.horizontal?.thumb?.borderRadius === '4px';
        
        if (hModern && vModern && thumbRounded) {
            console.log('   ✅ GOOGLE SHEETS STYLE SCROLLBARS ACTIVE!');
            console.log('   ✅ Modern thin design (16px)');
            console.log('   ✅ Rounded thumbs (4px radius)');
            console.log('   ✅ Clean minimal buttons');
        } else {
            console.log('   ⚠️  Scrollbars need refresh or CSS not loaded');
            console.log('   💡 Try hard reload (Ctrl+Shift+R)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✋ Check screenshot_scrollbars.png');
})();
