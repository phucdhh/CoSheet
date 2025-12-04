const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Connecting to Chrome...');
    const browser = await puppeteer.connect({ 
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('localhost:8000')) || pages[0];
    
    console.log('Current URL:', page.url());
    
    // Clear cache and reload
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCache');
    await page.reload({ waitUntil: 'networkidle2' });
    
    console.log('Page reloaded, waiting for render...');
    await page.waitForTimeout(2000);
    
    // Check scrollbar elements
    const scrollbarInfo = await page.evaluate(() => {
      const results = {
        scrollareas: [],
        thumbs: [],
        buttons: []
      };
      
      // Find all scrollbar elements
      const scrollareas = document.querySelectorAll('[class*="TCscrollarea"], [id*="scrollarea"]');
      const thumbs = document.querySelectorAll('[class*="TCthumb"], [id*="thumb"]');
      const lessbuttons = document.querySelectorAll('[class*="TClessbutton"], [id*="lessbutton"]');
      const morebuttons = document.querySelectorAll('[class*="TCmorebutton"], [id*="morebutton"]');
      
      scrollareas.forEach(el => {
        const computed = window.getComputedStyle(el);
        results.scrollareas.push({
          id: el.id,
          class: el.className,
          display: computed.display,
          background: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          width: computed.width,
          height: computed.height,
          position: computed.position
        });
      });
      
      thumbs.forEach(el => {
        const computed = window.getComputedStyle(el);
        results.thumbs.push({
          id: el.id,
          class: el.className,
          display: computed.display,
          background: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          width: computed.width,
          height: computed.height,
          borderRadius: computed.borderRadius,
          minHeight: computed.minHeight
        });
      });
      
      lessbuttons.forEach(el => {
        const computed = window.getComputedStyle(el);
        results.buttons.push({
          type: 'less',
          id: el.id,
          display: computed.display,
          background: computed.backgroundColor
        });
      });
      
      morebuttons.forEach(el => {
        const computed = window.getComputedStyle(el);
        results.buttons.push({
          type: 'more',
          id: el.id,
          display: computed.display,
          background: computed.backgroundColor
        });
      });
      
      return results;
    });
    
    console.log('\n=== Scrollbar Elements Found ===');
    console.log('Scroll Areas:', scrollbarInfo.scrollareas.length);
    console.log('Thumbs:', scrollbarInfo.thumbs.length);
    console.log('Buttons:', scrollbarInfo.buttons.length);
    
    if (scrollbarInfo.scrollareas.length > 0) {
      console.log('\n--- Scroll Area Details ---');
      scrollbarInfo.scrollareas.slice(0, 2).forEach((sa, i) => {
        console.log(`\nArea ${i+1}:`);
        console.log('  ID:', sa.id);
        console.log('  Display:', sa.display);
        console.log('  Background:', sa.background);
        console.log('  BackgroundImage:', sa.backgroundImage);
        console.log('  Size:', sa.width, 'x', sa.height);
      });
    }
    
    if (scrollbarInfo.thumbs.length > 0) {
      console.log('\n--- Thumb Details ---');
      scrollbarInfo.thumbs.slice(0, 2).forEach((thumb, i) => {
        console.log(`\nThumb ${i+1}:`);
        console.log('  ID:', thumb.id);
        console.log('  Display:', thumb.display);
        console.log('  Background:', thumb.background);
        console.log('  BackgroundImage:', thumb.backgroundImage);
        console.log('  BorderRadius:', thumb.borderRadius);
        console.log('  MinHeight:', thumb.minHeight);
        console.log('  Size:', thumb.width, 'x', thumb.height);
      });
    }
    
    if (scrollbarInfo.buttons.length > 0) {
      console.log('\n--- Button Details ---');
      scrollbarInfo.buttons.slice(0, 4).forEach((btn, i) => {
        console.log(`\n${btn.type} button ${i+1}:`);
        console.log('  ID:', btn.id);
        console.log('  Display:', btn.display);
        console.log('  Background:', btn.background);
      });
    }
    
    // Take screenshot
    await page.screenshot({ path: 'chrome_test/screenshot_scrollbars_final.png' });
    console.log('\n✅ Screenshot saved: screenshot_scrollbars_final.png');
    
    await browser.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
