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

            <!-- Examples -->
            <button id="sheet-examples"
                    title="Examples"
                    onclick="SheetLayout.showExamples()"
                    class="tab-icon-btn">
                <svg class="tab-icon" viewBox="0 0 24 24" style="overflow:visible;">
                    <defs>
                        <linearGradient id="exampleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#2196F3;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#9C27B0;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <rect x="2" y="3" width="20" height="18" rx="2" fill="url(#exampleGrad)" />
                    <path d="M7 7h10M7 11h10M7 15h6" stroke="white" stroke-width="1.5" stroke-linecap="round" />
                    <circle cx="17" cy="15" r="2.5" fill="#FF9800" />
                    <text x="12" y="21" font-size="5" fill="#FF5722" font-weight="bold" text-anchor="middle">Ex</text>
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
         * Save spreadsheet - Show format dialog
         */
        saveFile: function () {
            if (typeof vex === 'undefined') {
                // Fallback to CSV
                window.dispatchEvent(new Event('ec-save-request'));
                return;
            }

            vex.dialog.open({
                message: ' ',
                buttons: [],
                callback: function () { },
                afterOpen: function ($vexContent) {
                    const html = '<style>.vex.vex-theme-flat-attack .vex-content{padding:0!important;width:auto!important;max-width:300px!important;}.vex .vex-dialog-message{padding:0!important;margin:0!important;}</style>' +
                        '<div style="width:300px; margin:0; background:#fff; font-family:system-ui,-apple-system,sans-serif;">' +
                        '<div style="padding:16px 20px; background:#f8f9fa; border-bottom:1px solid #dee2e6;">' +
                        '<div style="font-size:16px; font-weight:600; color:#212529;">Save Spreadsheet</div>' +
                        '</div>' +
                        '<div style="padding:24px 20px;">' +
                        '<div style="display:flex; gap:16px; justify-content:center;">' +
                        '<button type="button" class="save-csv-btn" style="width:120px; padding:16px 12px; background:#28a745; color:white; border:none; border-radius:6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; box-shadow:0 1px 3px rgba(0,0,0,0.12); transition:all 0.2s;">' +
                        '<svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L12,15H9V10H15V15L13,19H10Z"/></svg>' +
                        '<span style="font-size:14px; font-weight:600;">CSV</span>' +
                        '</button>' +
                        '<button type="button" class="save-xlsx-btn" style="width:120px; padding:16px 12px; background:#007bff; color:white; border:none; border-radius:6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; box-shadow:0 1px 3px rgba(0,0,0,0.12); transition:all 0.2s;">' +
                        '<svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,11L10,14H11.5V19H12.5V14H14L12,11Z"/></svg>' +
                        '<span style="font-size:14px; font-weight:600;">XLSX</span>' +
                        '</button>' +
                        '</div>' +
                        '</div>' +
                        '<div style="padding:12px 20px; background:#f8f9fa; border-top:1px solid #dee2e6; text-align:right;">' +
                        '<button type="button" class="save-cancel-btn" style="padding:8px 24px; background:#fff; color:#495057; border:1px solid #ced4da; border-radius:4px; cursor:pointer; font-size:14px; font-weight:500; transition:all 0.2s;">Cancel</button>' +
                        '</div>' +
                        '</div>';

                    $vexContent.find('.vex-dialog-form').html(html);

                    // Attach event handlers
                    var csvBtn = $vexContent.find('.save-csv-btn')[0];
                    var xlsxBtn = $vexContent.find('.save-xlsx-btn')[0];
                    var cancelBtn = $vexContent.find('.save-cancel-btn')[0];

                    if (csvBtn) {
                        csvBtn.onmouseover = function () { this.style.background = '#218838'; this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; };
                        csvBtn.onmouseout = function () { this.style.background = '#28a745'; this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; };
                        csvBtn.onclick = function () {
                            vex.closeAll();
                            window.dispatchEvent(new Event('ec-save-request'));
                        };
                    }
                    if (xlsxBtn) {
                        xlsxBtn.onmouseover = function () { this.style.background = '#0056b3'; this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; };
                        xlsxBtn.onmouseout = function () { this.style.background = '#007bff'; this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; };
                        xlsxBtn.onclick = function () {
                            vex.closeAll();
                            window.dispatchEvent(new Event('ec-save-xlsx-request'));
                        };
                    }
                    if (cancelBtn) {
                        cancelBtn.onmouseover = function () { this.style.background = '#e9ecef'; this.style.borderColor = '#adb5bd'; };
                        cancelBtn.onmouseout = function () { this.style.background = '#fff'; this.style.borderColor = '#ced4da'; };
                        cancelBtn.onclick = function () {
                            vex.closeAll();
                        };
                    }
                }
            });
        },

        /**
         * Export spreadsheet - Show format dialog
         */
        exportFile: function () {
            if (typeof vex === 'undefined') {
                // Fallback to XLSX
                window.dispatchEvent(new Event('ec-save-xlsx-request'));
                return;
            }

            vex.dialog.open({
                message: ' ',
                buttons: [],
                callback: function () { },
                afterOpen: function ($vexContent) {
                    const html = '<style>.vex.vex-theme-flat-attack .vex-content{padding:0!important;width:auto!important;max-width:300px!important;}.vex .vex-dialog-message{padding:0!important;margin:0!important;}</style>' +
                        '<div style="width:300px; margin:0; background:#fff; font-family:system-ui,-apple-system,sans-serif;">' +
                        '<div style="padding:16px 20px; background:#f8f9fa; border-bottom:1px solid #dee2e6;">' +
                        '<div style="font-size:16px; font-weight:600; color:#212529;">Export Spreadsheet</div>' +
                        '</div>' +
                        '<div style="padding:24px 20px;">' +
                        '<div style="display:grid; grid-template-columns:repeat(2, 120px); gap:16px; justify-content:center;">' +
                        '<button type="button" class="export-ods-btn" style="padding:16px 12px; background:#fd7e14; color:white; border:none; border-radius:6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; box-shadow:0 1px 3px rgba(0,0,0,0.12); transition:all 0.2s;">' +
                        '<svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M12,12A3,3 0 0,1 15,15A3,3 0 0,1 12,18A3,3 0 0,1 9,15A3,3 0 0,1 12,12M12,13.5A1.5,1.5 0 0,0 10.5,15A1.5,1.5 0 0,0 12,16.5A1.5,1.5 0 0,0 13.5,15A1.5,1.5 0 0,0 12,13.5Z"/></svg>' +
                        '<span style="font-size:14px; font-weight:600;">ODS</span>' +
                        '</button>' +
                        '<button type="button" class="export-html-btn" style="padding:16px 12px; background:#6f42c1; color:white; border:none; border-radius:6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; box-shadow:0 1px 3px rgba(0,0,0,0.12); transition:all 0.2s;">' +
                        '<svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M12,17.56L16.07,16.43L16.62,10.33H9.38L9.2,8.3H16.8L17,6.31H7L7.56,12.32H14.45L14.22,14.9L12,15.5L9.78,14.9L9.64,13.24H7.64L7.93,16.43L12,17.56M4.07,3H19.93L18.5,19.2L12,21L5.5,19.2L4.07,3Z"/></svg>' +
                        '<span style="font-size:14px; font-weight:600;">HTML</span>' +
                        '</button>' +
                        '<button type="button" class="export-tsv-btn" style="padding:16px 12px; background:#17a2b8; color:white; border:none; border-radius:6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; box-shadow:0 1px 3px rgba(0,0,0,0.12); transition:all 0.2s;">' +
                        '<svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M7,12H17V14H7V12Z"/></svg>' +
                        '<span style="font-size:14px; font-weight:600;">TSV</span>' +
                        '</button>' +
                        '<button type="button" class="export-pdf-btn" style="padding:16px 12px; background:#dc3545; color:white; border:none; border-radius:6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; box-shadow:0 1px 3px rgba(0,0,0,0.12); transition:all 0.2s;">' +
                        '<svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10.1,11.4C10.08,11.44 9.81,13.16 8,16.09C8,16.09 4.5,17.91 5.33,19.27C6,20.35 7.65,19.23 9.07,16.59C9.07,16.59 10.89,15.95 13.31,15.77C13.31,15.77 17.17,17.5 17.7,15.66C18.22,13.8 14.64,14.22 14,14.41C14,14.41 12,13.06 11.5,11.2C11.5,11.2 12.64,7.25 10.89,7.3C9.14,7.35 9.8,10.43 10.1,11.4M10.91,12.44C10.94,12.45 11.38,13.65 12.8,14.9C12.8,14.9 10.47,15.36 9.41,15.8C9.41,15.8 10.41,14.07 10.91,12.44M14.84,15.16C15.42,15 17.17,14.8 17.2,15.26C17.24,15.73 14.84,15.16 14.84,15.16M10.57,10.27C10.5,9.85 10.36,8.53 10.73,8.32C11.1,8.12 11.26,9.44 10.57,10.27Z"/></svg>' +
                        '<span style="font-size:14px; font-weight:600;">PDF</span>' +
                        '</button>' +
                        '</div>' +
                        '</div>' +
                        '<div style="padding:12px 20px; background:#f8f9fa; border-top:1px solid #dee2e6; text-align:right;">' +
                        '<button type="button" class="export-cancel-btn" style="padding:8px 24px; background:#fff; color:#495057; border:1px solid #ced4da; border-radius:4px; cursor:pointer; font-size:14px; font-weight:500; transition:all 0.2s;">Cancel</button>' +
                        '</div>' +
                        '</div>';

                    $vexContent.find('.vex-dialog-form').html(html);

                    // Attach event handlers
                    var odsBtn = $vexContent.find('.export-ods-btn')[0];
                    var htmlBtn = $vexContent.find('.export-html-btn')[0];
                    var tsvBtn = $vexContent.find('.export-tsv-btn')[0];
                    var pdfBtn = $vexContent.find('.export-pdf-btn')[0];
                    var cancelBtn = $vexContent.find('.export-cancel-btn')[0];

                    if (odsBtn) {
                        odsBtn.onmouseover = function () { this.style.background = '#e8590c'; this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; };
                        odsBtn.onmouseout = function () { this.style.background = '#fd7e14'; this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; };
                        odsBtn.onclick = function () {
                            vex.closeAll();
                            window.dispatchEvent(new Event('ec-export-ods-request'));
                        };
                    }
                    if (htmlBtn) {
                        htmlBtn.onmouseover = function () { this.style.background = '#5a32a3'; this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; };
                        htmlBtn.onmouseout = function () { this.style.background = '#6f42c1'; this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; };
                        htmlBtn.onclick = function () {
                            vex.closeAll();
                            window.dispatchEvent(new Event('ec-export-html-request'));
                        };
                    }
                    if (tsvBtn) {
                        tsvBtn.onmouseover = function () { this.style.background = '#117a8b'; this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; };
                        tsvBtn.onmouseout = function () { this.style.background = '#17a2b8'; this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; };
                        tsvBtn.onclick = function () {
                            vex.closeAll();
                            window.dispatchEvent(new Event('ec-export-tsv-request'));
                        };
                    }
                    if (pdfBtn) {
                        pdfBtn.onmouseover = function () { this.style.background = '#c82333'; this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; };
                        pdfBtn.onmouseout = function () { this.style.background = '#dc3545'; this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; };
                        pdfBtn.onclick = function () {
                            vex.closeAll();
                            window.dispatchEvent(new Event('ec-export-pdf-request'));
                        };
                    }
                    if (cancelBtn) {
                        cancelBtn.onmouseover = function () { this.style.background = '#e9ecef'; this.style.borderColor = '#adb5bd'; };
                        cancelBtn.onmouseout = function () { this.style.background = '#fff'; this.style.borderColor = '#ced4da'; };
                        cancelBtn.onclick = function () {
                            vex.closeAll();
                        };
                    }
                }
            });
        },

        /**
          * Show Examples dialog with CSV/MD file pairs
          */
        showExamples: function () {
            if (typeof vex === 'undefined') {
                alert('Dialog library not available');
                return;
            }

            // List of available examples
            const examples = [
                { name: 'Bar Chart', file: 'barchart', desc: 'Categorical data (100 categories)' },
                { name: 'Histogram', file: 'histogram', desc: 'Continuous data distribution' },
                { name: 'Scatter Plot', file: 'scatterplot', desc: 'Correlation analysis' },
                { name: 'Line Chart', file: 'linechart', desc: 'Time series trends' },
                { name: 'Pie Chart', file: 'piechart', desc: 'Percentage distributions' },
                { name: 'Radar Chart', file: 'radarchart', desc: 'Multi-dimensional comparison' },
                { name: 'Grouped Bar', file: 'groupedbar', desc: 'Grouped & stacked charts' },
                { name: 'Central Tendency', file: 'central_tendency', desc: 'Mean, median, mode' },
                { name: 'Dispersion', file: 'dispersion', desc: 'Variance & std deviation' },
                { name: 'Quartiles', file: 'quartiles', desc: 'Quartiles & IQR' }
            ];

            vex.dialog.open({
                message: ' ',
                buttons: [],
                callback: function () { },
                afterOpen: function ($vexContent) {
                    const html = '\u003cstyle\u003e' +
                        '.vex.vex-theme-flat-attack .vex-content{padding:0!important;width:auto!important;max-width:580px!important;}' +
                        '.vex .vex-dialog-message{padding:0!important;margin:0!important;}' +
                        '.examples-container{width:580px;margin:0;background:#fff;font-family:system-ui,-apple-system,sans-serif;}' +
                        '.examples-header{padding:8px 12px;background:#f8f9fa;border-bottom:1px solid #dee2e6;}' +
                        '.examples-title{font-size:14px;font-weight:600;color:#212529;}' +
                        '.examples-body{padding:10px;display:grid;grid-template-columns:200px 1fr;gap:10px;height:350px;}' +
                        '.examples-list{border:1px solid #dee2e6;border-radius:6px;overflow-y:auto;background:#f8f9fa;}' +
                        '.example-item{padding:8px 10px;cursor:pointer;border-bottom:1px solid #dee2e6;transition:background 0.2s;line-height:1.2;}' +
                        '.example-item:hover{background:#e9ecef;}' +
                        '.example-item.selected{background:#007bff;color:white;}' +
                        '.example-item-name{font-weight:600;margin-bottom:2px;font-size:12px;}' +
                        '.example-item-desc{font-size:10px;color:#6c757d;line-height:1.2;}' +
                        '.example-item.selected .example-item-desc{color:#e3f2fd;}' +
                        '.examples-preview{border:1px solid #dee2e6;border-radius:6px;overflow-y:auto;padding:12px;background:#fff;font-size:12px;}' +
                        '.examples-footer{padding:8px 12px;background:#f8f9fa;border-top:1px solid #dee2e6;display:flex;justify-content:space-between;align-items:center;}' +
                        '.examples-footer-info{font-size:11px;color:#6c757d;}' +
                        '.examples-footer-buttons{display:flex;gap:8px;}' +
                        '.examples-preview h1{font-size:18px;margin:0 0 10px 0;line-height:1.3;}' +
                        '.examples-preview h2{font-size:15px;margin:16px 0 8px 0;padding-bottom:6px;border-bottom:2px solid #e9ecef;line-height:1.3;}' +
                        '.examples-preview h3{font-size:13px;margin:12px 0 6px 0;color:#495057;line-height:1.3;}' +
                        '.examples-preview h4{font-size:12px;margin:10px 0 4px 0;color:#6c757d;line-height:1.3;}' +
                        '.examples-preview p{margin:6px 0;line-height:1.5;}' +
                        '.examples-preview ul{margin:6px 0;padding-left:20px;line-height:1.4;}' +
                        '.examples-preview li{margin:3px 0;}' +
                        '.examples-preview code{background:#f8f9fa;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:11px;}' +
                        '.examples-preview pre{background:#f8f9fa;padding:8px;border-radius:6px;overflow-x:auto;margin:8px 0;font-size:11px;}' +
                        '.examples-preview table{border-collapse:collapse;width:100%;margin:8px 0;font-size:11px;}' +
                        '.examples-preview th,.examples-preview td{border:1px solid #dee2e6;padding:6px;text-align:left;}' +
                        '.examples-preview th{background:#f8f9fa;font-weight:600;}' +
                        '.examples-preview strong{font-weight:600;color:#212529;}' +
                        '.examples-preview em{font-style:italic;}' +
                        '\u003c/style\u003e' +
                        '\u003cdiv class=\"examples-container\"\u003e' +
                        '  \u003cdiv class=\"examples-header\"\u003e' +
                        '    \u003cdiv class=\"examples-title\"\u003eExample Datasets\u003c/div\u003e' +
                        '  \u003c/div\u003e' +
                        '  \u003cdiv class=\"examples-body\"\u003e' +
                        '    \u003cdiv class=\"examples-list\" id=\"examples-list\"\u003e\u003c/div\u003e' +
                        '    \u003cdiv class=\"examples-preview\" id=\"examples-preview\"\u003e' +
                        '      \u003cp style=\"color:#999;text-align:center;padding-top:100px;\"\u003eSelect an example to preview\u003c/p\u003e' +
                        '    \u003c/div\u003e' +
                        '  \u003c/div\u003e' +
                        '  \u003cdiv class=\"examples-footer\"\u003e' +
                        '    \u003cdiv class=\"examples-footer-info\" id=\"examples-info\"\u003e10 examples available\u003c/div\u003e' +
                        '    \u003cdiv class=\"examples-footer-buttons\"\u003e' +
                        '      \u003cbutton type="button" id="examples-load-btn" class="examples-load-btn" disabled style="padding:6px 18px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s;"\u003eLoad\u003c/button\u003e' +
                        '      \u003cbutton type="button" class="examples-cancel-btn" style="padding:6px 18px;background:#fff;color:#495057;border:1px solid #ced4da;border-radius:4px;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s;"\u003eCancel\u003c/button\u003e'
                        '    \u003c/div\u003e' +
                        '  \u003c/div\u003e' +
                        '\u003c/div\u003e';

                    $vexContent.find('.vex-dialog-form').html(html);

                    // State
                    let selectedFile = null;

                    // Populate examples list
                    const listEl = document.getElementById('examples-list');
                    examples.forEach(function (ex) {
                        const item = document.createElement('div');
                        item.className = 'example-item';
                        item.setAttribute('data-file', ex.file);
                        item.innerHTML = '\u003cdiv class=\"example-item-name\"\u003e' + ex.name + '\u003c/div\u003e' +
                            '\u003cdiv class=\"example-item-desc\"\u003e' + ex.desc + '\u003c/div\u003e';
                        item.onclick = function () {
                            // Deselect all
                            listEl.querySelectorAll('.example-item').forEach(function (el) {
                                el.classList.remove('selected');
                            });
                            // Select this one
                            item.classList.add('selected');
                            selectedFile = ex.file;

                            // Load and show MD file
                            SheetLayout.loadExampleMD(ex.file);

                            // Enable load button
                            const loadBtn = document.getElementById('examples-load-btn');
                            if (loadBtn) {
                                loadBtn.disabled = false;
                                loadBtn.style.opacity = '1';
                                loadBtn.style.cursor = 'pointer';
                            }
                        };
                        listEl.appendChild(item);
                    });

                    // Load button handler
                    const loadBtn = document.getElementById('examples-load-btn');
                    if (loadBtn) {
                        loadBtn.onmouseover = function () {
                            if (!this.disabled) {
                                this.style.background = '#0056b3';
                            }
                        };
                        loadBtn.onmouseout = function () {
                            if (!this.disabled) {
                                this.style.background = '#007bff';
                            }
                        };
                        loadBtn.onclick = function () {
                            if (selectedFile && !this.disabled) {
                                vex.closeAll();
                                SheetLayout.loadExampleCSV(selectedFile);
                            }
                        };
                    }

                    // Cancel button handler
                    const cancelBtn = $vexContent.find('.examples-cancel-btn')[0];
                    if (cancelBtn) {
                        cancelBtn.onmouseover = function () { this.style.background = '#e9ecef'; };
                        cancelBtn.onmouseout = function () { this.style.background = '#fff'; };
                        cancelBtn.onclick = function () {
                            vex.closeAll();
                        };
                    }
                }
            });
        },

        /**
         * Load and display example MD file
         */
        loadExampleMD: function (filename) {
            const previewEl = document.getElementById('examples-preview');
            if (!previewEl) return;

            previewEl.innerHTML = '\u003cp style="color:#999;text-align:center;"\u003eLoading...\u003c/p\u003e';

            fetch('examples/' + filename + '.md')
                .then(function (response) {
                    if (!response.ok) throw new Error('Failed to load');
                    return response.text();
                })
                .then(function (markdown) {
                    // Simple markdown to HTML conversion
                    const html = SheetLayout.markdownToHTML(markdown);
                    previewEl.innerHTML = html;
                })
                .catch(function (error) {
                    previewEl.innerHTML = '\u003cp style=\"color:#dc3545;\"\u003eError loading documentation: ' + error.message + '\u003c/p\u003e';
                });
        },

        /**
         * Load example CSV file into spreadsheet
         */
        loadExampleCSV: function (filename) {
            fetch('examples/' + filename + '.csv')
                .then(function (response) {
                    if (!response.ok) throw new Error('Failed to load CSV file');
                    return response.text();
                })
                .then(function (csvContent) {
                    if (typeof window.loadCSV === 'function') {
                        window.loadCSV(csvContent);
                    } else if (typeof window.loadCSVContent === 'function') {
                        window.loadCSVContent(csvContent);
                    } else {
                        alert('CSV loader function not available. Please refresh the page.');
                    }
                })
                .catch(function (error) {
                    alert('Error loading example: ' + error.message);
                });
        },

        /**
         * Simple markdown to HTML converter
         */
        markdownToHTML: function (md) {
            let html = md;

            // Headers
            html = html.replace(/^#### (.+)$/gm, '\u003ch4\u003e$1\u003c/h4\u003e');
            html = html.replace(/^### (.+)$/gm, '\u003ch3\u003e$1\u003c/h3\u003e');
            html = html.replace(/^## (.+)$/gm, '\u003ch2\u003e$1\u003c/h2\u003e');
            html = html.replace(/^# (.+)$/gm, '\u003ch1\u003e$1\u003c/h1\u003e');

            // Bold
            html = html.replace(/\*\*(.+?)\*\*/g, '\u003cstrong\u003e$1\u003c/strong\u003e');

            // Italic
            html = html.replace(/\*(.+?)\*/g, '\u003cem\u003e$1\u003c/em\u003e');

            // Inline code
            html = html.replace(/`([^`]+)`/g, '\u003ccode\u003e$1\u003c/code\u003e');

            // Code blocks (```)
            html = html.replace(/```([\s\S]*?)```/g, '\u003cpre\u003e\u003ccode\u003e$1\u003c/code\u003e\u003c/pre\u003e');

            // Lists (simple)
            html = html.replace(/^- (.+)$/gm, '\u003cli\u003e$1\u003c/li\u003e');
            html = html.replace(/((\u003cli\u003e.+\u003c\/li\u003e\n?)+)/g, '\u003cul\u003e$1\u003c/ul\u003e');

            // Line breaks
            html = html.replace(/\n\n/g, '\u003c/p\u003e\u003cp\u003e');
            html = '\u003cp\u003e' + html + '\u003c/p\u003e';

            // Clean up
            html = html.replace(/\u003cp\u003e\u003ch/g, '\u003ch');
            html = html.replace(/\u003c\/h([1-6])\u003e\u003c\/p\u003e/g, '\u003c/h$1\u003e');
            html = html.replace(/\u003cp\u003e\u003cul\u003e/g, '\u003cul\u003e');
            html = html.replace(/\u003c\/ul\u003e\u003c\/p\u003e/g, '\u003c/ul\u003e');
            html = html.replace(/\u003cp\u003e\u003cpre\u003e/g, '\u003cpre\u003e');
            html = html.replace(/\u003c\/pre\u003e\u003c\/p\u003e/g, '\u003c/pre\u003e');
            html = html.replace(/\u003cp\u003e\u003c\/p\u003e/g, '');

            return html;
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

        // console.log('[SheetLayout] Constants initialized:', {
        //             hint: SocialCalc.Constants.defaultInputEchoHintStyle,
        //             upperLeft: SocialCalc.Constants.defaultUpperLeftClass
        //         });

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
                    // console.log('[SheetLayout] Active cell indicator updated:', spreadsheet.editor.ecell.coord);
                } else {
                    console.log('[SheetLayout] Indicator element not found yet');
                }
            }
        } else {
            // console.log('[SheetLayout] Editor not ready, will retry');
            // Retry after another second
            setTimeout(setupActiveCellCallback, 1000);
        }
    }

})();
