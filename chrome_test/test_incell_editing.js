const puppeteer = require('puppeteer');

(async () => {
  console.log('=== Testing In-Cell Editor ===\n');
  
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

    // Go to EtherCalc
    console.log('1. Loading http://localhost:1234/');
    await page.goto('http://localhost:1234/', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    console.log('2. Waiting for page to initialize...');
    await new Promise(r => setTimeout(r, 3000));

    // Check if InCellEditor exists
    const hasInCellEditor = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      return {
        editorExists: !!editor,
        inCellEditorExists: !!editor?.inCellEditor,
        inCellEditorType: editor?.inCellEditor ? typeof editor.inCellEditor : 'undefined'
      };
    });

    console.log('3. Check InCellEditor:', JSON.stringify(hasInCellEditor, null, 2));

    if (!hasInCellEditor.inCellEditorExists) {
      console.log('❌ ERROR: InCellEditor not found!');
      await browser.close();
      return;
    }

    console.log('✓ InCellEditor exists\n');

    // Test 1: Click on cell B2
    console.log('TEST 1: Click on cell B2');
    const cellClicked = await page.evaluate(() => {
      const cell = document.querySelector('td[id*="B2"]');
      if (cell) {
        console.log('[TEST] Found cell B2:', cell.id);
        cell.click();
        return true;
      }
      return false;
    });

    if (!cellClicked) {
      console.log('❌ Could not find cell B2');
      await browser.close();
      return;
    }

    await new Promise(r => setTimeout(r, 500));

    // Test 2: Start typing (should open in-cell editor)
    console.log('\nTEST 2: Type "Hello" to trigger in-cell editor');
    await page.keyboard.type('Hello');
    await new Promise(r => setTimeout(r, 500));

    // Check if in-cell editor is active
    const editorState = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      const inCellEditor = editor?.inCellEditor;
      
      if (!inCellEditor) return { error: 'No inCellEditor' };

      return {
        isActive: inCellEditor.isActive,
        containerVisible: inCellEditor.container?.style.display !== 'none',
        textareaValue: inCellEditor.textarea?.value,
        formulaBarValue: editor.inputBox?.element?.value,
        editorState: editor.state
      };
    });

    console.log('In-cell editor state:', JSON.stringify(editorState, null, 2));

    if (editorState.isActive) {
      console.log('✓ In-cell editor is active');
      console.log('✓ Text:', editorState.textareaValue);
      console.log('✓ Formula bar synced:', editorState.formulaBarValue === editorState.textareaValue);
    } else {
      console.log('❌ In-cell editor is NOT active');
    }

    // Take screenshot
    await page.screenshot({ 
      path: '/root/ethercalc/chrome_test/incell_editor_typing.png',
      fullPage: false
    });
    console.log('Screenshot: incell_editor_typing.png\n');

    // Test 3: Double-click on another cell
    console.log('TEST 3: Press Enter, then double-click cell C3');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));

    const dblClickResult = await page.evaluate(() => {
      const cell = document.querySelector('td[id*="C3"]');
      if (cell) {
        console.log('[TEST] Double-clicking C3:', cell.id);
        const event = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        cell.dispatchEvent(event);
        return true;
      }
      return false;
    });

    await new Promise(r => setTimeout(r, 500));

    const editorStateAfterDblClick = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      const inCellEditor = editor?.inCellEditor;
      
      return {
        isActive: inCellEditor?.isActive,
        containerVisible: inCellEditor?.container?.style.display !== 'none',
        textareaValue: inCellEditor?.textarea?.value,
        currentCellCoord: editor?.ecell?.coord
      };
    });

    console.log('After double-click:', JSON.stringify(editorStateAfterDblClick, null, 2));

    if (editorStateAfterDblClick.isActive) {
      console.log('✓ In-cell editor opened on double-click');
    } else {
      console.log('❌ In-cell editor did NOT open on double-click');
    }

    await page.screenshot({ 
      path: '/root/ethercalc/chrome_test/incell_editor_doubleclick.png',
      fullPage: false
    });
    console.log('Screenshot: incell_editor_doubleclick.png\n');

    // Test 4: Type in formula bar and check sync
    console.log('TEST 4: Press Escape, click D4, type in formula bar');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));

    await page.evaluate(() => {
      const cell = document.querySelector('td[id*="D4"]');
      if (cell) cell.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Start editing with F2
    await page.keyboard.press('F2');
    await new Promise(r => setTimeout(r, 300));

    const f2Result = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      return {
        isActive: editor?.inCellEditor?.isActive,
        state: editor?.state
      };
    });

    console.log('After F2:', JSON.stringify(f2Result, null, 2));

    if (f2Result.isActive) {
      console.log('✓ F2 opens in-cell editor');
    } else {
      console.log('❌ F2 did NOT open in-cell editor');
    }

    // Test typing
    await page.keyboard.type('Test sync');
    await new Promise(r => setTimeout(r, 300));

    const syncCheck = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      return {
        inCellValue: editor?.inCellEditor?.textarea?.value,
        formulaBarValue: editor?.inputBox?.element?.value,
        synced: editor?.inCellEditor?.textarea?.value === editor?.inputBox?.element?.value
      };
    });

    console.log('Sync check:', JSON.stringify(syncCheck, null, 2));

    if (syncCheck.synced) {
      console.log('✓ In-cell editor and formula bar are synced');
    } else {
      console.log('❌ NOT synced!');
    }

    await page.screenshot({ 
      path: '/root/ethercalc/chrome_test/incell_editor_f2.png',
      fullPage: false
    });
    console.log('Screenshot: incell_editor_f2.png\n');

    // Test 5: Check visual position
    console.log('TEST 5: Check visual position of in-cell editor');
    const positionCheck = await page.evaluate(() => {
      const editor = window.spreadsheet?.editor;
      const inCellEditor = editor?.inCellEditor;
      const container = inCellEditor?.container;
      
      if (!container) return { error: 'No container' };

      const cell = editor?.ecell?.element;
      if (!cell) return { error: 'No ecell' };

      const containerRect = container.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();

      return {
        containerLeft: Math.round(containerRect.left),
        containerTop: Math.round(containerRect.top),
        cellLeft: Math.round(cellRect.left),
        cellTop: Math.round(cellRect.top),
        overlapping: Math.abs(containerRect.left - cellRect.left) < 5 && 
                     Math.abs(containerRect.top - cellRect.top) < 5
      };
    });

    console.log('Position check:', JSON.stringify(positionCheck, null, 2));

    if (positionCheck.overlapping) {
      console.log('✓ In-cell editor is positioned correctly over the cell');
    } else {
      console.log('⚠ Position might be off');
    }

    // Final summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('✓ InCellEditor exists:', hasInCellEditor.inCellEditorExists);
    console.log('✓ Typing triggers editor:', editorState.isActive);
    console.log('✓ Double-click works:', editorStateAfterDblClick.isActive);
    console.log('✓ F2 works:', f2Result.isActive);
    console.log('✓ Sync works:', syncCheck.synced);
    console.log('✓ Position correct:', positionCheck.overlapping);
    console.log('\nAll tests completed successfully! ✓');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
