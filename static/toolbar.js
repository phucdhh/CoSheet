/**
 * Format Toolbar - Google Sheets-style formatting controls
 * Shows ONLY when Format tab is active, replaces old Format UI
 */

(function () {
  'use strict';

  // Wait for SocialCalc to be ready
  if (typeof SocialCalc === 'undefined') {
    console.error('SocialCalc not loaded');
    return;
  }

  let toolbarElement = null;
  let originalFormatTabOnclick = null;

  // Create and inject the format toolbar (hidden by default)
  function createFormatToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'format-toolbar';
    toolbar.style.display = 'none'; // Hide by default
    toolbar.innerHTML = `
      <div class="format-group">
        <select id="format-font-family" title="Font">
          <option value="">Default</option>
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier">Courier</option>
          <option value="Times">Times New Roman</option>
          <option value="Georgia">Georgia</option>
        </select>
        
        <select id="format-font-size" title="Font size">
          <option value="">Default</option>
          <option value="8pt">8</option>
          <option value="9pt">9</option>
          <option value="10pt">10</option>
          <option value="11pt">11</option>
          <option value="12pt">12</option>
          <option value="14pt">14</option>
          <option value="16pt">16</option>
          <option value="18pt">18</option>
          <option value="20pt">20</option>
          <option value="24pt">24</option>
        </select>
      </div>

      <div class="divider"></div>

      <div class="format-group">
        <button id="format-bold" title="Bold (Ctrl+B)" data-cmd="bold">
          <strong>B</strong>
        </button>
        <button id="format-italic" title="Italic (Ctrl+I)" data-cmd="italic">
          <em>I</em>
        </button>
        <button id="format-underline" title="Underline" data-cmd="underline">
          <u>U</u>
        </button>
      </div>

      <div class="divider"></div>

      <div class="format-group">
        <div class="color-picker-wrapper">
          <button id="format-text-color-btn" title="Text color" style="color: #000000">
            <span style="font-weight: bold;">A</span>
          </button>
          <input type="color" id="format-text-color" value="#000000">
        </div>
        
        <div class="color-picker-wrapper">
          <button id="format-bg-color-btn" title="Background color" style="position: relative;">
            <svg viewBox="0 0 24 24" style="width: 18px; height: 18px;">
              <path fill="currentColor" d="M19,11.5C19,11.5 17,13.67 17,15A2,2 0 0,0 19,17A2,2 0 0,0 21,15C21,13.67 19,11.5 19,11.5M5.21,10L10,5.21L14.79,10M16.56,8.94L7.62,0L6.21,1.41L8.59,3.79L3.44,8.94C2.85,9.5 2.85,10.47 3.44,11.06L8.94,16.56C9.23,16.85 9.62,17 10,17C10.38,17 10.77,16.85 11.06,16.56L16.56,11.06C17.15,10.47 17.15,9.5 16.56,8.94Z"/>
            </svg>
            <span id="format-bg-color-indicator" style="position: absolute; bottom: 2px; left: 2px; right: 2px; height: 3px; background: #ffffff;"></span>
          </button>
          <input type="color" id="format-bg-color" value="#ffffff">
        </div>
      </div>

      <div class="divider"></div>

      <div class="format-group">
        <button id="format-align-left" title="Align left" data-align="left">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z"/></svg>
        </button>
        <button id="format-align-center" title="Align center" data-align="center">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3,3H21V5H3V3M7,7H17V9H7V7M3,11H21V13H3V11M7,15H17V17H7V15M3,19H21V21H3V19Z"/></svg>
        </button>
        <button id="format-align-right" title="Align right" data-align="right">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3,3H21V5H3V3M9,7H21V9H9V7M3,11H21V13H3V11M9,15H21V17H9V15M3,19H21V21H3V19Z"/></svg>
        </button>
      </div>

      <div class="divider"></div>

      <div class="format-group">
        <select id="format-number" title="Number format">
          <option value="">Automatic</option>
          <option value="General">General</option>
          <option value="#,##0">#,##0</option>
          <option value="#,##0.00">#,##0.00</option>
          <option value="$#,##0.00">$#,##0.00</option>
          <option value="0%">Percent</option>
        </select>
      </div>
    `;


    // Strategy: Create a NEW container div right after the tabs row
    // This way it won't be affected by SocialCalc hiding content areas
    const waitForTabs = setInterval(() => {
      // Find the tabs table
      const tabsTable = document.querySelector('table[cellpadding="0"]');
      if (tabsTable && tabsTable.parentNode) {
        clearInterval(waitForTabs);

        // Create a container div for our toolbar
        const toolbarContainer = document.createElement('div');
        toolbarContainer.id = 'format-toolbar-container';
        // Proper toolbar container styling (no border - toolbar has its own)
        toolbarContainer.style.cssText = `
          display: none; 
          width: 100%; 
          background: transparent; 
          padding: 0; 
          box-sizing: border-box;
          position: relative;
        `;

        // Put our toolbar inside this container
        toolbarContainer.appendChild(toolbar);

        // Insert this container right after the tabs table
        tabsTable.parentNode.insertBefore(toolbarContainer, tabsTable.nextSibling);

        // CRITICAL: Set toolbarElement AFTER insertion
        toolbarElement = toolbar;


        attachEventHandlers();
      }
    }, 100);
  }

  // Get the current spreadsheet control object
  function getSpreadsheet() {
    return SocialCalc.GetSpreadsheetControlObject();
  }

  // Execute a SocialCalc command
  function executeCommand(cmd) {
    const spreadsheet = getSpreadsheet();
    if (!spreadsheet || !spreadsheet.editor) return;

    spreadsheet.ExecuteCommand(cmd);
  }

  // Get the current selection range
  function getCurrentRange() {
    const spreadsheet = getSpreadsheet();
    if (!spreadsheet || !spreadsheet.editor) return null;

    const editor = spreadsheet.editor;
    if (editor.range.hasrange) {
      return SocialCalc.crToCoord(editor.range.left, editor.range.top) + ':' +
        SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
    }
    return editor.ecell.coord;
  }

  // Attach event handlers to toolbar controls
  function attachEventHandlers() {
    // Font family
    document.getElementById('format-font-family').addEventListener('change', function () {
      const range = getCurrentRange();
      if (!range) return;

      const fontFamily = this.value || '*';
      executeCommand(`set ${range} font * * ${fontFamily}`);
    });

    // Font size
    document.getElementById('format-font-size').addEventListener('change', function () {
      const range = getCurrentRange();
      if (!range) return;

      const fontSize = this.value || '*';
      executeCommand(`set ${range} font * ${fontSize} *`);
    });

    // Bold
    document.getElementById('format-bold').addEventListener('click', function () {
      const range = getCurrentRange();
      if (!range) return;

      this.classList.toggle('active');
      const fontLook = this.classList.contains('active') ? 'normal bold' : 'normal normal';
      executeCommand(`set ${range} font ${fontLook} * *`);
    });

    // Italic
    document.getElementById('format-italic').addEventListener('click', function () {
      const range = getCurrentRange();
      if (!range) return;

      this.classList.toggle('active');
      const fontLook = this.classList.contains('active') ? 'italic normal' : 'normal normal';
      executeCommand(`set ${range} font ${fontLook} * *`);
    });

    // Text color
    const textColorInput = document.getElementById('format-text-color');
    const textColorBtn = document.getElementById('format-text-color-btn');

    textColorBtn.addEventListener('click', () => textColorInput.click());
    textColorInput.addEventListener('change', function () {
      const range = getCurrentRange();
      if (!range) return;

      textColorBtn.style.color = this.value;
      executeCommand(`set ${range} color ${this.value}`);
    });

    // Background color
    const bgColorInput = document.getElementById('format-bg-color');
    const bgColorBtn = document.getElementById('format-bg-color-btn');
    const bgColorIndicator = document.getElementById('format-bg-color-indicator');

    bgColorBtn.addEventListener('click', () => bgColorInput.click());
    bgColorInput.addEventListener('change', function () {
      const range = getCurrentRange();
      if (!range) return;

      bgColorIndicator.style.background = this.value;
      executeCommand(`set ${range} bgcolor ${this.value}`);
    });

    // Alignment buttons
    ['left', 'center', 'right'].forEach(align => {
      document.getElementById(`format-align-${align}`).addEventListener('click', function () {
        const range = getCurrentRange();
        if (!range) return;

        // Remove active from all alignment buttons
        document.querySelectorAll('[id^="format-align-"]').forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');

        executeCommand(`set ${range} cellformat ${align}`);
      });
    });

    // Number format
    document.getElementById('format-number').addEventListener('change', function () {
      const range = getCurrentRange();
      if (!range) return;

      const format = this.value || 'General';
      executeCommand(`set ${range} nontextvalueformat ${format}`);
    });

    // Update toolbar state when cell selection changes
    updateToolbarState();
  }

  // Update toolbar to reflect current cell formatting
  function updateToolbarState() {
    const spreadsheet = getSpreadsheet();
    if (!spreadsheet || !spreadsheet.editor) return;

    const editor = spreadsheet.editor;
    const coord = editor.ecell.coord;
    const cell = spreadsheet.sheet.GetAssuredCell(coord);

    // Update font family
    if (cell.font) {
      const fontParts = spreadsheet.sheet.fonts[cell.font];
      if (fontParts) {
        const match = fontParts.match(/\* \* (.*)/);
        if (match) {
          document.getElementById('format-font-family').value = match[1];
        }
      }
    }

    // Update bold/italic state
    if (cell.font) {
      const fontParts = spreadsheet.sheet.fonts[cell.font];
      if (fontParts) {
        document.getElementById('format-bold').classList.toggle('active', /bold/.test(fontParts));
        document.getElementById('format-italic').classList.toggle('active', /italic/.test(fontParts));
      }
    }

    // Update text color
    if (cell.color) {
      const color = spreadsheet.sheet.colors[cell.color];
      if (color) {
        document.getElementById('format-text-color').value = color;
        document.getElementById('format-text-color-btn').style.color = color;
      }
    }

    // Update background color
    if (cell.bgcolor) {
      const bgcolor = spreadsheet.sheet.colors[cell.bgcolor];
      if (bgcolor) {
        document.getElementById('format-bg-color').value = bgcolor;
        document.getElementById('format-bg-color-indicator').style.background = bgcolor;
      }
    }

    // Update alignment
    if (cell.cellformat) {
      const align = spreadsheet.sheet.cellformats[cell.cellformat];
      if (align) {
        document.querySelectorAll('[id^="format-align-"]').forEach(btn => {
          btn.classList.remove('active');
        });
        document.getElementById(`format-align-${align}`)?.classList.add('active');
      }
    }
  }

  // Hook into Format tab to show toolbar and hide old UI
  function setupFormatTabIntercept() {
    // Wait for spreadsheet control to be ready
    const checkInterval = setInterval(() => {
      const spreadsheet = getSpreadsheet();
      if (spreadsheet && spreadsheet.views && spreadsheet.views.settings) {
        clearInterval(checkInterval);
        interceptFormatTab(spreadsheet);
      }
    }, 100);
  }

  function interceptFormatTab(spreadsheet) {
    // Store original onclick function
    const originalTabOnclick = spreadsheet.tabs[spreadsheet.tabnums.settings].onclick;

    // CRITICAL: Remove the 'view' property from Format tab definition
    // This prevents SocialCalc from switching to settings view and hiding spreadsheet
    // Sort/Comment/Names tabs don't have 'view' property, that's why spreadsheet stays visible
    delete spreadsheet.tabs[spreadsheet.tabnums.settings].view;
    delete spreadsheet.tabs[spreadsheet.tabnums.settings].onclickFocus;

    // Override the Format tab's onclick function
    // Mimic Sort/Comment/Names tabs behavior - they show toolbar WITHOUT hiding spreadsheet
    spreadsheet.tabs[spreadsheet.tabnums.settings].onclick = function (s, t) {

      // 1. Update tab visual state (make Format tab look selected)
      const allTabs = document.querySelectorAll('.sctab');
      allTabs.forEach(tab => {
        tab.classList.remove('sctabselected');
        tab.classList.add('sctabplain');
      });

      const formatTabElement = document.querySelector('.SocialCalc-settingstab');
      if (formatTabElement) {
        formatTabElement.classList.remove('sctabplain');
        formatTabElement.classList.add('sctabselected');
      }

      // 2. Hide ALL other toolbars (Edit, Sort, etc.)
      const hideToolbars = ['edittools', 'sorttools', 'audittools', 'commenttools', 'namestools', 'clipboardtools'];
      hideToolbars.forEach(toolbarId => {
        const toolbar = document.getElementById('SocialCalc-' + toolbarId);
        if (toolbar) {
          toolbar.style.display = 'none';
        }
      });

      // 3 Force hide old Format settings UI
      const settingsView = document.getElementById('SocialCalc-settingsview');
      const settingsTools = document.getElementById('SocialCalc-settingstools');
      if (settingsView) settingsView.style.display = 'none';
      if (settingsTools) settingsTools.style.display = 'none';

      // 4. Show our format toolbar container
      const toolbarContainer = document.getElementById('format-toolbar-container');
      if (toolbarContainer) {
        toolbarContainer.style.display = 'block';
      }

      // 5. Spreadsheet should remain visible (no view switching!)
    };


    // Add click handlers to ALL other tabs to hide our toolbar
    // Iterate through all tab numbers instead of hardcoded list
    Object.keys(spreadsheet.tabnums).forEach(tabName => {
      const tabNum = spreadsheet.tabnums[tabName];

      // Skip Format tab (settings)
      if (tabName === 'settings') return;

      if (tabNum !== undefined && spreadsheet.tabs[tabNum]) {
        const originalOnclick = spreadsheet.tabs[tabNum].onclick;
        spreadsheet.tabs[tabNum].onclick = function (s, t) {
          // Hide our toolbar container
          const toolbarContainer = document.getElementById('format-toolbar-container');
          if (toolbarContainer) {
            toolbarContainer.style.display = 'none';
          }

          // Show Edit toolbar back if switching to Edit tab
          if (tabName === 'edit') {
            const editTools = document.getElementById('SocialCalc-edittools');
            if (editTools) {
              editTools.style.display = 'block';
            }
          }

          // Call original onclick
          if (originalOnclick) {
            return originalOnclick.call(this, s, t);
          }
        };
      }
    });
  }

  // Monitor DOM changes to enforce our UI visibility rules
  function setupVisibilityEnforcer() {
    const observer = new MutationObserver((mutations) => {
      // Only act when Format tab is active
      const formatTab = document.querySelector('.SocialCalc-settingstab');
      if (!formatTab || !formatTab.classList.contains('sctabselected')) {
        // If Format tab is not active, hide toolbar
        if (toolbarElement && toolbarElement.style.display !== 'none') {
          toolbarElement.style.display = 'none';
        }
        return;
      }

      // Format tab IS active, ensure toolbar is visible
      if (toolbarElement && toolbarElement.style.display !== 'block') {
        toolbarElement.style.display = 'block';
      }

      // Force hide old Format UI using setProperty with 'important'
      const settingsView = document.getElementById('SocialCalc-settingsview');
      const settingsTools = document.getElementById('SocialCalc-settingstools');
      const sheetView = document.getElementById('SocialCalc-tableeditor');

      if (settingsView && (settingsView.style.display !== 'none' || !settingsView.style.getPropertyPriority('display'))) {
        settingsView.style.setProperty('display', 'none', 'important');
      }
      if (settingsTools && (settingsTools.style.display !== 'none' || !settingsTools.style.getPropertyPriority('display'))) {
        settingsTools.style.setProperty('display', 'none', 'important');
      }

      // Force show spreadsheet
      if (sheetView && (sheetView.style.display === 'none' || sheetView.style.display === '')) {
        sheetView.style.setProperty('display', 'block', 'important');
      }
    });

    // Observe the entire document for style/attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
      childList: true
    });

    // Also add periodic check every 100ms to maintain toolbar visibility
    setInterval(() => {
      const formatTab = document.querySelector('.SocialCalc-settingstab');
      if (formatTab && formatTab.classList.contains('sctabselected')) {
        // Format tab is active, ensure toolbar is visible
        if (toolbarElement && toolbarElement.style.display !== 'block') {
          toolbarElement.style.display = 'block';
        }
      } else {
        // Format tab is not active, ensure toolbar is hidden
        if (toolbarElement && toolbarElement.style.display !== 'none') {
          toolbarElement.style.display = 'none';
        }
      }
    }, 100);
  }

  // Initialize when page is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      createFormatToolbar();
      // toolbarElement will be set when toolbar is inserted
      setupFormatTabIntercept();
      setupVisibilityEnforcer();
    });
  } else {
    // DOMContentLoaded already fired
    setTimeout(function () {
      createFormatToolbar();
      // toolbarElement will be set when toolbar is inserted
      setupFormatTabIntercept();
      setupVisibilityEnforcer();
    }, 100);
  }

  // Listen for cell selection changes
  document.addEventListener('click', function (e) {
    // Check if click was on the spreadsheet
    if (e.target.closest('.SocialCalc-toplevel')) {
      setTimeout(updateToolbarState, 50);
    }
  });

})();
