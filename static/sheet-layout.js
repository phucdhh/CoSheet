/**
 * Sheet Layout Manager for CoSheet
 * Handles the Sheet tab ribbon UI
 */

(function () {
    'use strict';

    window.SheetLayout = {
        container: null,

        /**
         * Initialize the sheet layout system
         */
        init: function (containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                // Try to find it by ID suffix if exact match fails
                this.container = document.querySelector('[id$="' + containerId + '"]');
            }

            if (!this.container) {
                console.error('Sheet container not found:', containerId);
                return;
            }

            // Render ribbon HTML
            this.container.innerHTML = this.getRibbonHTML();
            this.container.style.display = 'block';

            // Attach event handlers
            this.attachHandlers();

            // Apply UI customizations (Active Cell Indicator, etc.)
            this.customizeUI();
        },

        /**
         * Apply UI customizations
         */
        customizeUI: function () {
            if (typeof SocialCalc === 'undefined') return;

            // 1. Hide the default floating InputEcho hint
            if (SocialCalc.Constants) {
                SocialCalc.Constants.defaultInputEchoHintStyle = "display:none;";
                SocialCalc.Constants.defaultUpperLeftClass = "upper-left-cell-indicator";
            }

            // 2. Hook into MoveECellCallback to update the active cell indicator
            var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            if (spreadsheet && spreadsheet.editor) {
                spreadsheet.editor.MoveECellCallback.activeCellIndicator = function (editor) {
                    var indicator = document.querySelector('.upper-left-cell-indicator');
                    if (indicator) {
                        indicator.innerHTML = editor.ecell.coord;
                    }
                };

                // Force update immediately
                if (spreadsheet.editor.ecell) {
                    var indicator = document.querySelector('.upper-left-cell-indicator');
                    if (indicator) {
                        indicator.innerHTML = spreadsheet.editor.ecell.coord;
                    }
                }
            }
        },

        /**
         * Get ribbon HTML with Sheet controls
         */
        getRibbonHTML: function () {
            return `
                <div class="ribbon-container">
                    <!-- New -->
            <button id="sheet-new" 
                    title="New Spreadsheet" 
                    onclick="SheetLayout.createNew()"
                    class="tab-icon-btn">
                <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
            </button>
            
            <!-- Open -->
            <button id="sheet-open"
                    title="Open File" 
                    onclick="SheetLayout.openFile()"
                    class="tab-icon-btn">
                <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
                </svg>
            </button>

            <!-- Save -->
            <button id="sheet-save"
                    title="Save" 
                    onclick="SheetLayout.saveFile()"
                    class="tab-icon-btn">
                <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                </svg>
            </button>

            <!-- Export -->
            <button id="sheet-export"
                    title="Export" 
                    onclick="SheetLayout.exportFile()"
                    class="tab-icon-btn">
                <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
            </button>
                    
                    <input type="file" id="sheet-file-input" style="display:none;" accept=".csv,.xlsx,.ods">
                </div>
            `;
        },

        /**
         * Cleanup when leaving Sheet tab
         */
        cleanup: function () {
            if (this.container) {
                this.container.innerHTML = '';
                this.container.style.display = 'none';
            }
        },

        /**
         * Called when the Sheet tab is clicked
         */
        initOnTabClick: function () {
            this.init('sheettools');
        },

        /**
         * Attach event handlers to file input
         */
        attachHandlers: function () {
            const input = document.getElementById('sheet-file-input');
            if (!input) return;

            input.addEventListener('change', function (ev) {
                var f = ev.target.files && ev.target.files[0];
                if (!f) return;

                // Reset input value
                input.value = '';

                var isBinary = /\.xlsx$|\.xlsm$|\.xlsb$|\.xls$|\.ods$/i.test(f.name);

                if (isBinary) {
                    if (typeof window.handleXLSXFile === 'function') {
                        window.handleXLSXFile(f);
                    } else {
                        alert('XLSX handler not available');
                    }
                } else {
                    // CSV
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var text = e.target.result;
                        if (typeof window.loadCSVContent === 'function') {
                            window.loadCSVContent(text);
                        } else {
                            alert('CSV handler not available');
                        }
                    };
                    reader.readAsText(f);
                }
            });
        },

        /**
         * Create new spreadsheet
         */
        createNew: function () {
            window.location = './_new';
        },

        /**
         * Open file dialog
         */
        openFile: function () {
            const input = document.getElementById('sheet-file-input');
            if (input) {
                input.click();
            }
        },

        /**
         * Save spreadsheet
         */
        save: function () {
            window.dispatchEvent(new Event('ec-save-request'));
        },

        /**
         * Export to XLSX
         */
        exportXLSX: function () {
            window.dispatchEvent(new Event('ec-save-xlsx-request'));
        }
    };

    // Hook into SocialCalc.SetTab to detect when Sheet tab is activated/deactivated
    const installSocialCalcHook = function () {
        if (!window.SocialCalc || !window.SocialCalc.SetTab) {
            return false;
        }

        const originalSetTab = SocialCalc.SetTab;

        SocialCalc.SetTab = function (tab) {
            // Check current tab before switching
            let tabName = '';
            if (typeof tab === 'string') {
                tabName = tab;
            } else if (tab && tab.id) {
                // Extract name from id
                const match = tab.id.match(/-([a-z]+)tab$/);
                if (match) {
                    tabName = match[1];
                }
            }

            // Call original function
            const ret = originalSetTab.apply(this, arguments);

            // Handle Sheet tab
            if (tabName === 'sheet') {
                if (window.SheetLayout) {
                    window.SheetLayout.initOnTabClick();
                }
            } else {
                // Cleanup if leaving sheet tab
                if (window.SheetLayout) {
                    window.SheetLayout.cleanup();
                }
            }

            return ret;
        };

        //console.log('[SheetLayout] SocialCalc.SetTab hooked successfully');
        return true;
    };

    // Try to install hook immediately
    if (!installSocialCalcHook()) {
        // If not ready, poll until ready
        const checkInterval = setInterval(() => {
            if (installSocialCalcHook()) {
                clearInterval(checkInterval);
                // Set constants immediately after SocialCalc is available
                initializeConstants();
                // Setup callback after a short delay to ensure editor is created
                setTimeout(setupActiveCellCallback, 1000);
            }
        }, 100);
    } else {
        // If already installed, initialize now
        initializeConstants();
        setTimeout(setupActiveCellCallback, 1000);
    }

    // Initialize constants (runs early)
    function initializeConstants() {
        if (typeof SocialCalc === 'undefined' || !SocialCalc.Constants) return false;

        // Hide the default floating InputEcho hint
        SocialCalc.Constants.defaultInputEchoHintStyle = "display:none;";
        SocialCalc.Constants.defaultUpperLeftClass = "upper-left-cell-indicator";

        console.log('[SheetLayout] Constants initialized:', {
            hint: SocialCalc.Constants.defaultInputEchoHintStyle,
            upperLeft: SocialCalc.Constants.defaultUpperLeftClass
        });

        return true;
    }

    // Setup active cell callback (runs after editor is ready)
    function setupActiveCellCallback() {
        var spreadsheet = SocialCalc.GetSpreadsheetControlObject && SocialCalc.GetSpreadsheetControlObject();
        if (spreadsheet && spreadsheet.editor) {
            spreadsheet.editor.MoveECellCallback.activeCellIndicator = function (editor) {
                var indicator = document.querySelector('.upper-left-cell-indicator');
                if (indicator) {
                    indicator.innerHTML = editor.ecell.coord;
                }
            };

            // Force update immediately
            if (spreadsheet.editor.ecell) {
                var indicator = document.querySelector('.upper-left-cell-indicator');
                if (indicator) {
                    indicator.innerHTML = spreadsheet.editor.ecell.coord;
                    console.log('[SheetLayout] Active cell indicator updated:', spreadsheet.editor.ecell.coord);
                } else {
                    console.log('[SheetLayout] Indicator element not found yet');
                }
            }
        } else {
            console.log('[SheetLayout] Editor not ready, will retry');
            // Retry after another second
            setTimeout(setupActiveCellCallback, 1000);
        }
    }

})();
