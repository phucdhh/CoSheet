const puppeteer = require('puppeteer');

(async () => {
  console.log('=== Quick Load Check ===\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    console.log('Loading http://localhost:1234/');
    await page.goto('http://localhost:1234/', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    await new Promise(r => setTimeout(r, 3000));

    const state = await page.evaluate(() => ({
      hasSpreadsheet: !!window.spreadsheet,
      hasEditor: !!window.spreadsheet?.editor,
      hasSocialCalc: !!window.SocialCalc,
      hasInputEcho: !!window.spreadsheet?.editor?.inputEcho,
      zappaLoaded: !!window.zappa,
      playerLoaded: !!window.SocialCalc?.DoPositionCalculations
    }));

    console.log('App state:', JSON.stringify(state, null, 2));
    console.log('\nConsole errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('  ✓ No errors!');
    }

    if (state.hasSpreadsheet && state.hasEditor && state.zappaLoaded) {
      console.log('\n✓✓✓ App loaded successfully!');
    } else {
      console.log('\n❌ App failed to load properly');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
})();
