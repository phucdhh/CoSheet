const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Connecting...');
    const browser = await puppeteer.connect({ 
      browserURL: 'http://localhost:9222'
    });
    
    console.log('Getting pages...');
    const pages = await browser.pages();
    console.log('Found', pages.length, 'pages');
    
    const page = pages[0];
    const url = page.url();
    console.log('Current URL:', url);
    
    // Navigate if not already on the spreadsheet
    if (!url.includes('dulieu.truyenthong.edu.vn') && !url.includes('192.168.1.223')) {
      console.log('Navigating to https://dulieu.truyenthong.edu.vn...');
      await page.goto('https://dulieu.truyenthong.edu.vn', { timeout: 15000, waitUntil: 'domcontentloaded' });
    } else {
      console.log('Already on spreadsheet, reloading...');
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
    
    console.log('Waiting 2s for render...');
    await page.waitForTimeout(2000);
    
    // Get scrollbar info
    const info = await page.evaluate(() => {
      const thumbs = document.querySelectorAll('.TCthumb');
      const areas = document.querySelectorAll('.TCscrollarea');
      const less = document.querySelectorAll('.TClessbutton');
      const more = document.querySelectorAll('.TCmorebutton');
      
      return {
        counts: {
          thumbs: thumbs.length,
          areas: areas.length,
          lessButtons: less.length,
          moreButtons: more.length
        },
        firstThumb: thumbs[0] ? {
          id: thumbs[0].id,
          bg: window.getComputedStyle(thumbs[0]).backgroundColor,
          bgImg: window.getComputedStyle(thumbs[0]).backgroundImage,
          radius: window.getComputedStyle(thumbs[0]).borderRadius,
          minHeight: window.getComputedStyle(thumbs[0]).minHeight,
          display: window.getComputedStyle(thumbs[0]).display
        } : null,
        firstArea: areas[0] ? {
          id: areas[0].id,
          bg: window.getComputedStyle(areas[0]).backgroundColor,
          bgImg: window.getComputedStyle(areas[0]).backgroundImage
        } : null
      };
    });
    
    console.log('\n=== Scrollbar Components ===');
    console.log('Counts:', info.counts);
    
    if (info.firstThumb) {
      console.log('\n=== First Thumb ===');
      console.log('ID:', info.firstThumb.id);
      console.log('Background:', info.firstThumb.bg);
      console.log('BackgroundImage:', info.firstThumb.bgImg);
      console.log('BorderRadius:', info.firstThumb.radius);
      console.log('MinHeight:', info.firstThumb.minHeight);
      console.log('Display:', info.firstThumb.display);
    }
    
    if (info.firstArea) {
      console.log('\n=== First Scroll Area ===');
      console.log('ID:', info.firstArea.id);
      console.log('Background:', info.firstArea.bg);
      console.log('BackgroundImage:', info.firstArea.bgImg);
    }
    
    await page.screenshot({ 
      path: 'chrome_test/scrollbar_check.png',
      fullPage: false 
    });
    console.log('\n✅ Screenshot saved: scrollbar_check.png');
    
    await browser.disconnect();
    console.log('Done!');
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
})();
