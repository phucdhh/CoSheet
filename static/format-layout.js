/**
 * Format Layout Manager for CoSheet
 * Handles the Format tab ribbon UI - similar to graph-layout.js structure
 */

(function () {
    'use strict';

    window.FormatLayout = {
        container: null,

        /**
         * Initialize the format layout system
         */
        init: function (containerId) {
            console.log('[FormatLayout] init called with', containerId);
            this.container = document.getElementById(containerId);
            if (!this.container) {
                // Try to find it by ID suffix if exact match fails
                this.container = document.querySelector('[id$="' + containerId + '"]');
            }

            if (!this.container) {
                console.error('[FormatLayout] Format container not found:', containerId);
                return;
            }

            // Render ribbon HTML
            // CRITICAL: Clear container first to remove any legacy SocialCalc buttons
            this.container.innerHTML = '';

            // Also hide any siblings that might be legacy toolbars
            // This is a safety measure for the overlap issue
            const siblings = this.container.parentNode ? this.container.parentNode.children : [];
            for (let i = 0; i < siblings.length; i++) {
                if (siblings[i] !== this.container && siblings[i].id !== 'format-cell-format-ribbon' && siblings[i].id !== 'format-sort-ribbon') {
                    // Don't hide our own secondary ribbons if they are siblings
                    siblings[i].style.display = 'none';
                }
            }

            // Explicitly hide known legacy containers if they exist elsewhere
            const legacyIds = ['SocialCalc-cellsettingstoolbar', 'SocialCalc-settingsview'];
            legacyIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            this.container.innerHTML = this.getRibbonHTML();
            this.container.style.display = 'block';

            // Bind events after rendering with a small delay to ensure DOM readiness
            setTimeout(() => {
                this.bindEvents();
            }, 100);
        },

        /**
         * Bind event handlers using ribbon-container scope (avoid duplicate IDs)
         */
        bindEvents: function () {
            console.log('[FormatLayout] bindEvents called');
            const self = this;

            // CRITICAL: Use ribbon-container as scope to avoid SocialCalc's duplicate buttons
            const ribbon = document.querySelector('.ribbon-container');
            if (!ribbon) {
                console.error('[FormatLayout] ribbon-container not found!');
                return;
            }

            // Font Family
            const fontFamily = ribbon.querySelector('#format-font-family');
            if (fontFamily) {
                fontFamily.addEventListener('change', function (e) {
                    console.log('Font changed');
                    self.applyFont();
                });
                console.log('[FormatLayout] ✓ Bound: format-font-family');
            } else {
                console.warn('[FormatLayout] ✗ Not found: format-font-family');
            }

            // Font Size
            const fontSize = ribbon.querySelector('#format-font-size');
            if (fontSize) {
                fontSize.addEventListener('change', function (e) {
                    console.log('Size changed');
                    self.applyFontSize();
                });
                console.log('[FormatLayout] ✓ Bound: format-font-size');
            } else {
                console.warn('[FormatLayout] ✗ Not found: format-font-size');
            }

            // Bold, Italic, Underline - USE RIBBON SCOPE
            const styles = ['bold', 'italic', 'underline'];
            styles.forEach(style => {
                const btn = ribbon.querySelector('#format-' + style);
                if (btn) {
                    btn.addEventListener('click', function (e) {
                        console.log('[FORMAT-LAYOUT] Style clicked:', style);
                        self.applyStyle(style);
                    });
                    console.log('[FormatLayout] ✓ Bound (ribbon-scoped):', 'format-' + style);
                } else {
                    console.warn('[FormatLayout] ✗ Not found:', 'format-' + style);
                }
            });

            // Alignment - USE RIBBON SCOPE
            const aligns = ['left', 'center', 'right'];
            aligns.forEach(align => {
                const btn = ribbon.querySelector('#format-align-' + align);
                if (btn) {
                    btn.addEventListener('click', function (e) {
                        console.log('[FORMAT-LAYOUT] Align clicked:', align);
                        self.applyAlignment(align);
                    });
                    console.log('[FormatLayout] ✓ Bound (ribbon-scoped):', 'format-align-' + align);
                } else {
                    console.warn('[FormatLayout] ✗ Not found:', 'format-align-' + align);
                }
            });

            // Colors - USE RIBBON SCOPE
            const textColor = ribbon.querySelector('#format-text-color');
            if (textColor) {
                // Capture coord on click/focus to ensure we apply to the correct cell even if focus changes
                textColor.addEventListener('click', function () {
                    if (window.spreadsheet && window.spreadsheet.editor) {
                        self.targetCoord = window.spreadsheet.editor.ecell.coord;
                        console.log('[FormatLayout] Captured target coord:', self.targetCoord);
                    }
                });
                textColor.addEventListener('change', function (e) {
                    console.log('Text color changed');
                    self.applyTextColor();
                });
                console.log('[FormatLayout] ✓ Bound: format-text-color');
            }

            const textColorReset = ribbon.querySelector('#format-text-color-reset');
            if (textColorReset) {
                textColorReset.addEventListener('click', function () {
                    if (window.spreadsheet && window.spreadsheet.editor) {
                        self.targetCoord = window.spreadsheet.editor.ecell.coord; // Capture for reset too
                    }
                    self.applyTextColor(true);
                });
                console.log('[FormatLayout] ✓ Bound: format-text-color-reset');
            }

            const bgColor = ribbon.querySelector('#format-bg-color');
            if (bgColor) {
                bgColor.addEventListener('click', function () {
                    if (window.spreadsheet && window.spreadsheet.editor) {
                        self.targetCoord = window.spreadsheet.editor.ecell.coord;
                        console.log('[FormatLayout] Captured target coord:', self.targetCoord);
                    }
                });
                bgColor.addEventListener('change', function (e) {
                    console.log('Bg color changed');
                    self.applyBackgroundColor();
                });
                console.log('[FormatLayout] ✓ Bound: format-bg-color');
            }

            const bgColorReset = ribbon.querySelector('#format-bg-color-reset');
            if (bgColorReset) {
                bgColorReset.addEventListener('click', function () {
                    if (window.spreadsheet && window.spreadsheet.editor) {
                        self.targetCoord = window.spreadsheet.editor.ecell.coord;
                    }
                    self.applyBackgroundColor(true);
                });
                console.log('[FormatLayout] ✓ Bound: format-bg-color-reset');
            }

            // Toggles - USE RIBBON SCOPE
            const cellFormatBtn = ribbon.querySelector('#format-cell-format');
            if (cellFormatBtn) {
                cellFormatBtn.addEventListener('click', function (e) {
                    console.log('Toggle Cell Format clicked');
                    e.stopPropagation();
                    self.toggleCellFormatRibbon();
                });
                console.log('[FormatLayout] ✓ Bound: format-cell-format');
            }

            const sortBtn = ribbon.querySelector('#format-sort');
            if (sortBtn) {
                sortBtn.addEventListener('click', function (e) {
                    console.log('Toggle Sort clicked');
                    e.stopPropagation();
                    self.toggleSortRibbon();
                });
                console.log('[FormatLayout] ✓ Bound: format-sort');
            }

            // Cell Format Options (Secondary Ribbon)
            const formatRibbon = document.getElementById('format-cell-format-ribbon');
            if (formatRibbon) {
                const formatBtns = formatRibbon.getElementsByTagName('button');
                for (let i = 0; i < formatBtns.length; i++) {
                    const btn = formatBtns[i];
                    const format = btn.getAttribute('data-format');
                    if (format) {
                        btn.addEventListener('click', function () {
                            console.log('Format clicked:', format);
                            self.applyCellFormat(format);
                        });
                    }
                }
                console.log('[FormatLayout] ✓ Bound:', formatBtns.length, 'cell format buttons');
            }

            // Sort Options (Secondary Ribbon)
            const sortRibbon = document.getElementById('format-sort-ribbon');
            if (sortRibbon) {
                const sortBtns = sortRibbon.getElementsByTagName('button');
                for (let i = 0; i < sortBtns.length; i++) {
                    const btn = sortBtns[i];
                    const dir = btn.getAttribute('data-sort');
                    if (dir) {
                        btn.addEventListener('click', function () {
                            console.log('Sort clicked:', dir);
                            self.applySort(dir);
                        });
                    }
                }
                console.log('[FormatLayout] ✓ Bound:', sortBtns.length, 'sort buttons');
            }

            console.log('[FormatLayout] bindEvents completed - all handlers attached via addEventListener');
        },

        /**
         * Get ribbon HTML with Format icons
         */
        getRibbonHTML: function () {
            return `
                <div class="ribbon-container">
                    <!-- Font Family -->
                    <select id="format-font-family" class="ribbon-select">
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Calibri">Calibri</option>
                    </select>
                    
                    <!-- Font Size -->
                    <select id="format-font-size" class="ribbon-select" style="width:60px;">
                        <option value="8">8</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12" selected>12</option>
                        <option value="14">14</option>
                        <option value="16">16</option>
                        <option value="18">18</option>
                        <option value="20">20</option>
                        <option value="24">24</option>
                    </select>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Bold -->
                    <button id="format-bold" title="Bold" class="tab-icon-btn">
                        <svg class="tab-icon" viewBox="0 0 24 24" fill="#555"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
                    </button>
                    
                    <!-- Italic -->
                    <button id="format-italic" title="Italic" class="tab-icon-btn">
                        <svg class="tab-icon" viewBox="0 0 24 24" fill="#555"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/></svg>
                    </button>
                    
                    <!-- Underline -->
                    <button id="format-underline" title="Underline" class="tab-icon-btn">
                        <svg class="tab-icon" viewBox="0 0 24 24" fill="#555"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
                    </button>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Align Left -->
                    <button id="format-align-left" title="Align Left" class="tab-icon-btn">
                        <svg class="tab-icon" viewBox="0 0 24 24" fill="#555"><path d="M3 15h18v-2H3v2zm0 4h12v-2H3v2zm0-8h18V9H3v2zm0-6v2h12V5H3z"/></svg>
                    </button>
                    
                    <!-- Align Center -->
                    <button id="format-align-center" title="Align Center" class="tab-icon-btn">
                        <svg class="tab-icon" viewBox="0 0 24 24" fill="#555"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
                    </button>
                    
                    <!-- Align Right -->
                    <button id="format-align-right" title="Align Right" class="tab-icon-btn">
                        <svg class="tab-icon" viewBox="0 0 24 24" fill="#555"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
                    </button>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Text Color -->
                    <div class="ribbon-color-picker" title="Text Color">
                        <input type="color" id="format-text-color" value="#000000">
                        <div class="ribbon-color-icon">
                            <!-- Zoomed viewBox to make 'A' fill the 18px width -->
                            <svg viewBox="5 3 14 14" width="18" height="18" fill="currentColor"><path d="M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z"/></svg>
                        </div>
                        <div class="ribbon-color-bar" style="background:#000;"></div>
                    </div>
                    <button id="format-text-color-reset" title="Reset Text Color" class="ribbon-icon-btn" style="width:24px; font-size:12px; padding:0;">✕</button>
                    
                    <!-- Background Color -->
                    <div class="ribbon-color-picker" title="Background Color">
                        <input type="color" id="format-bg-color" value="#FFFFFF">
                        <div class="ribbon-color-icon">
                            <!-- Zoomed viewBox to make Bucket larger -->
                            <svg viewBox="3 3 18 18" width="18" height="18" fill="currentColor"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/></svg>
                        </div>
                        <div class="ribbon-color-bar" style="background:#FFF;"></div>
                    </div>
                    <button id="format-bg-color-reset" title="Reset Background Color" class="ribbon-icon-btn" style="width:24px; font-size:12px; padding:0;">✕</button>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Cell Format -->
                    <button id="format-cell-format" title="Cell Format" class="tab-icon-btn" style="width:auto; padding:8px 12px; font-weight:bold;">123 ▼</button>

                    <!-- Sort -->
                    <button id="format-sort" title="Sort" class="tab-icon-btn" style="width:auto; padding:8px 12px; font-weight:bold;">Sort ▼</button>
                </div>
                
                <!-- Secondary Ribbon for Cell Format Options -->
                <div id="format-cell-format-ribbon" class="ribbon-secondary">
                    <button data-format="text" class="ribbon-btn">Text</button>
                    <button data-format="number" class="ribbon-btn">Number</button>
                    <button data-format="percent" class="ribbon-btn">Percent</button>
                    <button data-format="currency" class="ribbon-btn">Currency</button>
                    <button data-format="date" class="ribbon-btn">Date</button>
                    <button data-format="time" class="ribbon-btn">Time</button>
                    <button data-format="decimal2" class="ribbon-btn">.00</button>
                    <button data-format="decimal3" class="ribbon-btn">.000</button>
                </div>

                <!-- Secondary Ribbon for Sort Options -->
                <div id="format-sort-ribbon" class="ribbon-secondary">
                    <button data-sort="asc" class="ribbon-btn">A → Z</button>
                    <button data-sort="desc" class="ribbon-btn">Z → A</button>
                </div>
            `;
        },

        /**
         * Cleanup when leaving Format tab
         */
        cleanup: function () {
            if (this.container) {
                this.container.innerHTML = '';
                this.container.style.display = 'none';
            }
        },

        /**
         * Called when the Format tab is clicked
         */
        initOnTabClick: function () {
            // Find the settings tools container
            // The ID in ethercalc.js is "%id.settingstools", which resolves to "SocialCalc-id-settingstools" usually
            this.init('settingstools');
        },

        /**
         * Toggle Cell Format secondary ribbon
         */
        toggleCellFormatRibbon: function () {
            const ribbon = document.getElementById('format-cell-format-ribbon');
            const sortRibbon = document.getElementById('format-sort-ribbon');
            if (sortRibbon) sortRibbon.classList.remove('visible'); // Close sort ribbon
            if (ribbon) {
                ribbon.classList.toggle('visible');
            }
        },

        /**
         * Toggle Sort secondary ribbon
         */
        toggleSortRibbon: function () {
            const ribbon = document.getElementById('format-sort-ribbon');
            const formatRibbon = document.getElementById('format-cell-format-ribbon');
            if (formatRibbon) formatRibbon.classList.remove('visible'); // Close format ribbon
            if (ribbon) {
                ribbon.classList.toggle('visible');
            }
        },

        // Property to hold the target coordinate for reset operations
        targetCoord: null,

        /**
         * Apply font family
         */
        applyFont: function () {
            if (!window.spreadsheet || !window.spreadsheet.editor) return;

            // Use scoped selector to ensure we get the visible control
            const fontSelect = document.querySelector('.ribbon-container #format-font-family');
            if (!fontSelect) {
                console.error('[FormatLayout] Font family select not found');
                return;
            }

            const newFamily = fontSelect.value;
            if (!newFamily) {
                console.warn('[FormatLayout] No font family selected');
                return;
            }

            const editor = window.spreadsheet.editor;
            const sheet = window.spreadsheet.sheet;
            const coord = editor.ecell.coord;

            if (!coord) return;

            const cell = sheet.cells[coord] || {};
            const fontIndex = cell.font || sheet.attribs.defaultfont;
            let fontStr = '';
            if (sheet.fonts && sheet.fonts[fontIndex]) {
                fontStr = sheet.fonts[fontIndex];
            } else {
                fontStr = '* * * *';
            }

            console.log('[FormatLayout] Current font:', fontStr);

            // Parse current font
            // Format: style weight size family
            const tokens = fontStr.split(' ');
            let style = '*', weight = '*', size = '*';

            if (tokens.length >= 3) {
                style = tokens[0];
                weight = tokens[1];
                size = tokens[2];
            }

            // Construct new font string
            const newFontStr = style + ' ' + weight + ' ' + size + ' ' + newFamily;
            console.log('[FormatLayout] Applying Font Family:', newFontStr);

            window.spreadsheet.ExecuteCommand('set %C font ' + newFontStr, '');
            SocialCalc.KeyboardFocus();
        },

        /**
         * Apply font size
         */
        applyFontSize: function () {
            if (!window.spreadsheet || !window.spreadsheet.editor) return;

            // Use scoped selector to ensure we get the visible control
            const sizeSelect = document.querySelector('.ribbon-container #format-font-size');
            if (!sizeSelect) {
                console.error('[FormatLayout] Font size select not found');
                return;
            }

            let newSizeVal = sizeSelect.value;
            if (!newSizeVal) {
                console.warn('[FormatLayout] No font size selected');
                return;
            }
            const newSize = newSizeVal + 'pt';

            const editor = window.spreadsheet.editor;
            const sheet = window.spreadsheet.sheet;
            const coord = editor.ecell.coord;

            if (!coord) return;

            const cell = sheet.cells[coord] || {};
            const fontIndex = cell.font || sheet.attribs.defaultfont;
            let fontStr = '';
            if (sheet.fonts && sheet.fonts[fontIndex]) {
                fontStr = sheet.fonts[fontIndex];
            } else {
                fontStr = '* * * *';
            }

            console.log('[FormatLayout] Current font:', fontStr);

            // Parse current font
            const tokens = fontStr.split(' ');
            let style = '*', weight = '*', family = '*';

            if (tokens.length >= 4) {
                style = tokens[0];
                weight = tokens[1];
                // tokens[2] is size
                family = tokens.slice(3).join(' ');
            } else if (tokens.length === 3) {
                // Handle case where family might be missing or weird parsing
                style = tokens[0];
                weight = tokens[1];
                // assume 3rd is size
            }

            // Construct new font string
            const newFontStr = style + ' ' + weight + ' ' + newSize + ' ' + family;
            console.log('[FormatLayout] Applying Font Size:', newFontStr);

            window.spreadsheet.ExecuteCommand('set %C font ' + newFontStr, '');
            SocialCalc.KeyboardFocus();
        },


        /**
         * Apply text style (bold, italic, underline)
         */
        applyStyle: function (style) {
            if (!window.spreadsheet || !window.spreadsheet.editor) return;

            // Inject CSS for underline if not exists
            if (!document.getElementById('ethercalc-custom-styles')) {
                const styleEl = document.createElement('style');
                styleEl.id = 'ethercalc-custom-styles';
                styleEl.innerHTML = '.text-underline { text-decoration: underline !important; }';
                document.head.appendChild(styleEl);
            }

            const editor = window.spreadsheet.editor;
            const sheet = window.spreadsheet.sheet;
            const coord = editor.ecell.coord;

            if (!coord) {
                console.warn('[FormatLayout] No cell selected');
                return;
            }

            console.log('[FormatLayout] Applying', style, 'to', coord);

            const cell = sheet.cells[coord] || {};

            if (style === 'underline') {
                let cssc = cell.cssc || '';
                if (cssc.includes('text-underline')) {
                    cssc = cssc.replace('text-underline', '').trim();
                } else {
                    cssc = (cssc + ' text-underline').trim();
                }
                const cmd = 'set ' + coord + ' cssc ' + cssc;
                console.log('[FormatLayout] Executing:', cmd);
                window.spreadsheet.ExecuteCommand(cmd, '');
            } else {
                // Handle Bold / Italic
                const fontIndex = cell.font || sheet.attribs.defaultfont;
                let fontStr = '';
                if (sheet.fonts && sheet.fonts[fontIndex]) {
                    fontStr = sheet.fonts[fontIndex];
                } else {
                    fontStr = '* * * *';
                }

                console.log('[FormatLayout] Current font:', fontStr);

                let isBold = fontStr.includes('bold');
                let isItalic = fontStr.includes('italic');

                if (style === 'bold') isBold = !isBold;
                if (style === 'italic') isItalic = !isItalic;

                const newStyle = isItalic ? 'italic' : 'normal';
                const newWeight = isBold ? 'bold' : 'normal';

                // Preserve size and family
                let currentSize = '*';
                let currentFamily = '*';

                const tokens = fontStr.split(' ');
                if (tokens.length >= 4) {
                    currentSize = tokens[2];
                    currentFamily = tokens.slice(3).join(' ');
                }

                const newFontStr = newStyle + ' ' + newWeight + ' ' + currentSize + ' ' + currentFamily;
                console.log('[FormatLayout] New font:', newFontStr);

                // Add to sheet.fonts if needed (ExecuteCommand 'set font' does this automatically if we pass the string)
                // But wait, 'set font' expects the STRING, not the index?
                // Line 2953: cell[attrib] = sheet.GetStyleNum("font", rest);
                // Yes, it takes the string and gets/creates the index.

                const cmd = 'set ' + coord + ' font ' + newFontStr;
                console.log('[FormatLayout] Executing:', cmd);
                window.spreadsheet.ExecuteCommand(cmd, '');
            }

            SocialCalc.KeyboardFocus();
        },

        /**
         * Apply text alignment
         */
        applyAlignment: function (align) {
            // Use SocialCalc.DoCmd for alignment to match standard behavior
            if (typeof SocialCalc !== 'undefined' && SocialCalc.DoCmd) {
                SocialCalc.DoCmd(null, 'align-' + align);
            } else if (window.spreadsheet && window.spreadsheet.editor) {
                // Fallback if DoCmd not available (unlikely)
                const commands = {
                    'left': 'set %C cellformat left',
                    'center': 'set %C cellformat center',
                    'right': 'set %C cellformat right'
                };
                const cmd = commands[align];
                if (cmd) {
                    window.spreadsheet.ExecuteCommand(cmd, '');
                    SocialCalc.KeyboardFocus();
                }
            }
        },

        /**
         * Apply text color
         */
        applyTextColor: function (reset) {
            if (!window.spreadsheet || !window.spreadsheet.editor) return;

            const coord = this.targetCoord || window.spreadsheet.editor.ecell.coord;
            if (!coord) return;

            if (reset) {
                console.log('[FormatLayout] Resetting Text Color for', coord);
                window.spreadsheet.ExecuteCommand('set ' + coord + ' color', '');
                // Reset picker visual if possible
                const colorInput = document.querySelector('.ribbon-container #format-text-color');
                if (colorInput) colorInput.value = '#000000';
                // Update color bar
                const colorBar = colorInput ? colorInput.parentElement.querySelector('.ribbon-color-bar') : null;
                if (colorBar) colorBar.style.background = '#000';
            } else {
                const colorInput = document.querySelector('.ribbon-container #format-text-color');
                if (!colorInput) {
                    console.error('[FormatLayout] Text color input not found');
                    return;
                }
                const color = colorInput.value;
                console.log('[FormatLayout] Applying Text Color:', color, 'to', coord);
                window.spreadsheet.ExecuteCommand('set ' + coord + ' color ' + color, '');

                // Update color bar
                const colorBar = colorInput.parentElement.querySelector('.ribbon-color-bar');
                if (colorBar) colorBar.style.background = color;
            }

            this.targetCoord = null; // Clear target
            SocialCalc.KeyboardFocus();
        },

        /**
         * Apply background color
         */
        applyBackgroundColor: function (reset) {
            if (!window.spreadsheet || !window.spreadsheet.editor) return;

            const coord = this.targetCoord || window.spreadsheet.editor.ecell.coord;
            if (!coord) return;

            if (reset) {
                console.log('[FormatLayout] Resetting Background Color for', coord);
                window.spreadsheet.ExecuteCommand('set ' + coord + ' bgcolor', '');
                // Reset picker visual
                const colorInput = document.querySelector('.ribbon-container #format-bg-color');
                if (colorInput) colorInput.value = '#FFFFFF';
                // Update color bar
                const colorBar = colorInput ? colorInput.parentElement.querySelector('.ribbon-color-bar') : null;
                if (colorBar) colorBar.style.background = '#FFF';
            } else {
                const colorInput = document.querySelector('.ribbon-container #format-bg-color');
                if (!colorInput) {
                    console.error('[FormatLayout] Background color input not found');
                    return;
                }
                const color = colorInput.value;
                console.log('[FormatLayout] Applying Background Color:', color, 'to', coord);
                window.spreadsheet.ExecuteCommand('set ' + coord + ' bgcolor ' + color, '');

                // Update color bar
                const colorBar = colorInput.parentElement.querySelector('.ribbon-color-bar');
                if (colorBar) colorBar.style.background = color;
            }

            this.targetCoord = null; // Clear target
            SocialCalc.KeyboardFocus();
        },

        /**
         * Apply cell format
         */
        applyCellFormat: function (format) {
            if (!window.spreadsheet || !window.spreadsheet.editor) return;

            const formats = {
                'text': 'set %C nontextvalueformat text-plain',
                'number': 'set %C nontextvalueformat #,##0',
                'percent': 'set %C nontextvalueformat 0.0%',
                'currency': 'set %C nontextvalueformat $#,##0.00',
                'date': 'set %C nontextvalueformat yyyy-mm-dd',
                'time': 'set %C nontextvalueformat hh:mm:ss',
                'decimal2': 'set %C nontextvalueformat #,##0.00',
                'decimal3': 'set %C nontextvalueformat #,##0.000'
            };

            const cmd = formats[format];
            if (cmd) {
                window.spreadsheet.ExecuteCommand(cmd, '');
                this.toggleCellFormatRibbon(); // Hide ribbon after selection
                SocialCalc.KeyboardFocus();
            }
        },

        /**
         * Apply sort
         */
        applySort: function (direction) {
            if (!window.spreadsheet || !window.spreadsheet.editor) return;

            // Get current range
            const range = window.spreadsheet.editor.range.code; // e.g., "A1:B10"
            if (!range) return;

            // Determine column to sort by (using the first column of the range)
            // Range can be "A1:B10" or just "A1"
            const parts = range.split(':');
            const startCell = parts[0]; // "A1"

            // Extract column from startCell (e.g., "A" from "A1")
            const colMatch = startCell.match(/^([A-Z]+)/);
            if (!colMatch) return;
            const col = colMatch[1];

            // Construct command: sort range col direction
            // Example: sort A1:B10 A up
            const cmd = 'sort ' + range + ' ' + col + ' ' + direction;

            window.spreadsheet.ExecuteCommand(cmd, '');
            this.toggleSortRibbon();
            SocialCalc.KeyboardFocus();
        }
    };

    // Hook into SocialCalc.SetTab to detect when Format tab is activated/deactivated
    const installSocialCalcHook = function () {
        if (!window.SocialCalc || !window.SocialCalc.SetTab) {
            return false;
        }

        const originalSetTab = SocialCalc.SetTab;

        // CRITICAL: Prevent Format tab from switching to 'settings' view
        // This ensures the spreadsheet remains visible
        const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
        if (spreadsheet && spreadsheet.tabs && spreadsheet.tabnums && spreadsheet.tabnums.settings) {
            const settingsTab = spreadsheet.tabs[spreadsheet.tabnums.settings];
            if (settingsTab && settingsTab.view) {
                delete settingsTab.view;
                // Also remove onclickFocus to prevent focus stealing issues
                delete settingsTab.onclickFocus;
                console.log('[FormatLayout] Removed view property from settings tab to keep spreadsheet visible');
            }
        }

        SocialCalc.SetTab = function (tab) {
            // Check current tab before switching
            let tabName = '';
            if (typeof tab === 'string') {
                tabName = tab;
            } else if (tab && tab.id) {
                // Extract name from id (e.g., "SocialCalc-id-settingstab" -> "settings")
                const match = tab.id.match(/-([a-z]+)tab$/);
                if (match) {
                    tabName = match[1];
                }
            }

            // Call original function
            const ret = originalSetTab.apply(this, arguments);

            // Handle Format tab (named "settings" in ethercalc.js)
            if (tabName === 'settings') {
                if (window.FormatLayout) {
                    window.FormatLayout.initOnTabClick();
                }
            } else {
                // Cleanup if leaving settings tab
                if (window.FormatLayout) {
                    window.FormatLayout.cleanup();
                }
            }

            return ret;
        };

        return true;
    };

    // Try to install hook immediately
    if (!installSocialCalcHook()) {
        // If not ready, poll until ready
        const checkInterval = setInterval(() => {
            if (installSocialCalcHook()) {
                clearInterval(checkInterval);
            }
        }, 100);
    }

})();
