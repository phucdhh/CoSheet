const puppeteer = require('puppeteer');

(async () => {
  console.log('=== Testing InputEcho Position ===\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Loading http://localhost:1234/');
    await page.goto('http://localhost:1234/', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    await new Promise(r => setTimeout(r, 3000));

    // Check if InputEcho exists
    const hasInputEcho = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      return {
        editorExists: !!editor,
        inputEchoExists: !!editor?.inputEcho,
        inputEchoType: editor?.inputEcho ? typeof editor.inputEcho : 'undefined',
        containerExists: !!editor?.inputEcho?.container
      };
    });

    console.log('InputEcho check:', JSON.stringify(hasInputEcho, null, 2));

    if (!hasInputEcho.inputEchoExists) {
      console.log('❌ ERROR: InputEcho not found!');
      await browser.close();
      return;
    }

    console.log('✓ InputEcho exists\n');

    // Click cell B2
    console.log('TEST: Click cell B2 and check position');
    await page.evaluate(() => {
      const cell = document.querySelector('td[id*="B2"]');
      if (cell) cell.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Start typing to trigger InputEcho
    await page.keyboard.press('KeyA');
    await new Promise(r => setTimeout(r, 500));

    // Check InputEcho position
    const echoState = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      const inputEcho = editor?.inputEcho;
      
      if (!inputEcho) return { error: 'No inputEcho' };

      const container = inputEcho.container;
      const cell = editor?.ecell?.element;

      if (!container || !cell) return { error: 'No container or cell' };

      const containerRect = container.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();

      return {
        containerDisplay: container.style.display,
        containerLeft: Math.round(containerRect.left),
        containerTop: Math.round(containerRect.top),
        cellLeft: Math.round(cellRect.left),
        cellTop: Math.round(cellRect.top),
        cellCoord: editor.ecell.coord,
        mainText: inputEcho.main?.innerHTML || '',
        overlapping: Math.abs(containerRect.left - cellRect.left) < 10 && 
                     Math.abs(containerRect.top - cellRect.top) < 10
      };
    });

    console.log('InputEcho state:', JSON.stringify(echoState, null, 2));

    if (echoState.overlapping) {
      console.log('\n✓✓✓ SUCCESS! InputEcho is positioned correctly over the cell! ✓✓✓');
    } else {
      console.log('\n❌ Position is off');
    }

    await page.screenshot({ 
      path: '/root/ethercalc/chrome_test/inputecho_position_test.png'
    });
    console.log('Screenshot: inputecho_position_test.png');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
