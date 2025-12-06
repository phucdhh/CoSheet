const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting InputEcho test...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture console logs
    page.on('console', msg => {
      console.log('CONSOLE:', msg.text());
    });

    // Capture errors
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        console.log('RESOURCE:', response.status(), url);
      }
    });

    // Go to EtherCalc
    console.log('Loading http://localhost:1234/');
    await page.goto('http://localhost:1234/', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });

    console.log('Page loaded, waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 5000));

    // Check editor initialization
    const editorInfo = await page.evaluate(() => {
      const info = {
        socialcalcExists: typeof SocialCalc !== 'undefined',
        spreadsheetControlExists: !!window.spreadsheet,
        editorExists: false,
        inputEchoExists: false,
        noEdit: null,
        toplevelExists: false,
        state: null,
        allDivs: []
      };
      
      if (window.spreadsheet && window.spreadsheet.editor) {
        info.editorExists = true;
        info.inputEchoExists = !!window.spreadsheet.editor.inputEcho;
        info.noEdit = window.spreadsheet.editor.noEdit;
        info.state = window.spreadsheet.editor.state;
        info.toplevelExists = !!window.spreadsheet.editor.toplevel;
      }
      
      // List all divs to find container
      document.querySelectorAll('div').forEach(div => {
        if (div.id || div.className) {
          info.allDivs.push({
            id: div.id,
            className: div.className,
            display: div.style.display
          });
        }
      });
      
      return info;
    });

    console.log('\n=== Editor Initialization Info ===');
    console.log(JSON.stringify(editorInfo, null, 2));

    // Check if InputEcho container exists in DOM
    const containerExists = await page.evaluate(() => {
      // Get inputEcho from editor
      const editor = window.spreadsheet?.editor;
      if (editor && editor.inputEcho && editor.inputEcho.container) {
        const c = editor.inputEcho.container;
        const info = {
          id: c.id,
          className: c.className,
          display: c.style.display,
          position: c.style.position,
          zIndex: c.style.zIndex,
          computedZIndex: window.getComputedStyle(c).zIndex,
          computedPosition: window.getComputedStyle(c).position,
          left: c.style.left,
          top: c.style.top
        };
        console.log('[TEST] InputEcho from editor.inputEcho.container:', JSON.stringify(info));
        return true;
      }
      
      // Fallback: search DOM
      const containers = document.querySelectorAll('[id*="inputecho"]');
      console.log('[TEST] InputEcho containers found:', containers.length);
      containers.forEach((c, i) => {
        console.log(`[TEST] Container ${i}:`, {
          id: c.id,
          className: c.className,
          display: c.style.display,
          zIndex: c.style.zIndex,
          computedZIndex: window.getComputedStyle(c).zIndex,
          position: c.style.position,
          left: c.style.left,
          top: c.style.top
        });
      });
      return containers.length > 0;
    });

    console.log('InputEcho container exists:', containerExists);

    // Click on cell B2
    console.log('Clicking on cell B2...');
    const cellClicked = await page.evaluate(() => {
      // Find cell B2 - try multiple selectors
      let b2Cell = null;
      
      // Try direct coordinate lookup
      const coords = ['B2', 'b2'];
      for (let coord of coords) {
        // Try different ID formats
        const selectors = [
          `td[id$="-${coord}"]`,
          `td[coord="${coord}"]`,
          `td[id*="${coord}"]`
        ];
        
        for (let sel of selectors) {
          b2Cell = document.querySelector(sel);
          if (b2Cell) {
            console.log('[TEST] Found B2 cell with selector:', sel, 'id:', b2Cell.id);
            break;
          }
        }
        if (b2Cell) break;
      }
      
      // If still not found, list all cells
      if (!b2Cell) {
        const allCells = document.querySelectorAll('td');
        console.log('[TEST] Total TD elements:', allCells.length);
        const cellsWithId = Array.from(allCells).filter(c => c.id).slice(0, 10);
        console.log('[TEST] First 10 cells with ID:', cellsWithId.map(c => c.id));
        
        // Try to click ANY cell
        if (allCells.length > 10) {
          b2Cell = allCells[10]; // Use 11th cell as test
          console.log('[TEST] Using cell at index 10:', b2Cell.id || 'no-id');
        }
      }
      
      if (b2Cell) {
        b2Cell.click();
        return true;
      }
      
      return false;
    });

    if (!cellClicked) {
      console.log('ERROR: Could not find/click B2 cell');
      await browser.close();
      return;
    }

    console.log('Cell clicked, waiting 1 second...');
    await new Promise(r => setTimeout(r, 1000));

    // Check InputEcho state after click
    const echoState = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      if (editor && editor.inputEcho && editor.inputEcho.container) {
        const c = editor.inputEcho.container;
        const computed = window.getComputedStyle(c);
        return {
          id: c.id,
          className: c.className,
          display: c.style.display,
          computedDisplay: computed.display,
          zIndex: c.style.zIndex,
          computedZIndex: computed.zIndex,
          position: c.style.position,
          computedPosition: computed.position,
          left: c.style.left,
          top: c.style.top,
          width: computed.width,
          height: computed.height,
          visibility: computed.visibility,
          innerHTML: c.innerHTML.substring(0, 200)
        };
      }
      return null;
    });

    console.log('\n=== InputEcho State After Click ===');
    console.log(JSON.stringify(echoState, null, 2));

    // Take screenshot
    await page.screenshot({ 
      path: '/root/ethercalc/chrome_test/inputecho_test.png',
      fullPage: false
    });
    console.log('Screenshot saved to inputecho_test.png');

    // Double-click on cell B2 to enter edit mode
    console.log('\nDouble-clicking on cell B2...');
    await page.evaluate(() => {
      const cells = document.querySelectorAll('td[id*="cell"]');
      for (let cell of cells) {
        const coord = cell.getAttribute('id');
        if (coord && coord.includes('-B2')) {
          const event = new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          cell.dispatchEvent(event);
          break;
        }
      }
    });

    await new Promise(r => setTimeout(r, 500));

    // Try typing to trigger edit mode
    console.log('Typing "test" to trigger edit mode...');
    await page.keyboard.type('test');

    await new Promise(r => setTimeout(r, 500));

    // Check state after double-click
    const echoStateAfterDblClick = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      if (editor && editor.inputEcho && editor.inputEcho.container) {
        const c = editor.inputEcho.container;
        const computed = window.getComputedStyle(c);
        return {
          id: c.id,
          display: c.style.display,
          computedDisplay: computed.display,
          zIndex: c.style.zIndex,
          computedZIndex: computed.zIndex,
          position: c.style.position,
          left: c.style.left,
          top: c.style.top
        };
      }
      return null;
    });

    console.log('\n=== InputEcho State After Double-Click ===');
    console.log(JSON.stringify(echoStateAfterDblClick, null, 2));

    await page.screenshot({ 
      path: '/root/ethercalc/chrome_test/inputecho_doubleclick.png',
      fullPage: false
    });
    console.log('Screenshot saved to inputecho_doubleclick.png');

    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
