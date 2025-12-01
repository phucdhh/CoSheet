/**
 * Edit Layout Manager for CoSheet
 * Handles the Edit tab ribbon UI
 */

(function () {
    'use strict';

    window.EditLayout = {
        container: null,

        /**
         * Initialize the edit layout system
         */
        init: function (containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                this.container = document.querySelector('[id$="' + containerId + '"]');
            }

            if (!this.container) {
                console.error('Edit container not found:', containerId);
                return;
            }

            // Render ribbon HTML
            this.container.innerHTML = this.getRibbonHTML();
            this.container.style.display = 'block';

            // Bind event handlers after DOM is ready
            const self = this;
            setTimeout(function () {
                self.bindEvents();
            }, 100);
        },

        /**
         * Get ribbon HTML with Edit controls
         * Uses standardized layout.css classes
         */
        getRibbonHTML: function () {
            const imgPath = "./static/images/edit/";

            return `
                <div class="ribbon-container">
                    <!-- Undo/Redo -->
                    <button id="edit-undo" class="tab-icon-btn" title="Undo">
                        <img src="${imgPath}undo.svg" alt="Undo" class="tab-icon">
                    </button>
                    <button id="edit-redo" class="tab-icon-btn" title="Redo">
                        <img src="${imgPath}redo.svg" alt="Redo" class="tab-icon">
                    </button>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Clipboard -->
                    <button id="edit-copy" class="tab-icon-btn" title="Copy">
                        <img src="${imgPath}copy.svg" alt="Copy" class="tab-icon">
                    </button>
                    <button id="edit-cut" class="tab-icon-btn" title="Cut">
                        <img src="${imgPath}cut.svg" alt="Cut" class="tab-icon">
                    </button>
                    <button id="edit-paste" class="tab-icon-btn" title="Paste">
                        <img src="${imgPath}paste.svg" alt="Paste" class="tab-icon">
                    </button>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Delete -->
                    <button id="edit-delete" class="tab-icon-btn" title="Delete">
                        <img src="${imgPath}delete.svg" alt="Delete" class="tab-icon">
                    </button>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Fill -->
                    <button id="edit-fill-down" class="tab-icon-btn" title="Fill Down">
                        <img src="${imgPath}filldown.svg" alt="Fill Down" class="tab-icon">
                    </button>
                    <button id="edit-fill-right" class="tab-icon-btn" title="Fill Right">
                        <img src="${imgPath}fillright.svg" alt="Fill Right" class="tab-icon">
                    </button>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Rows/Cols -->
                    <button id="edit-insert-row" class="tab-icon-btn" title="Insert Row">
                        <img src="${imgPath}insertrow.svg" alt="Insert Row" class="tab-icon">
                    </button>
                    <button id="edit-insert-col" class="tab-icon-btn" title="Insert Column">
                        <img src="${imgPath}insertcol.svg" alt="Insert Column" class="tab-icon">
                    </button>
                    <button id="edit-delete-row" class="tab-icon-btn" title="Delete Row">
                        <img src="${imgPath}deleterow.svg" alt="Delete Row" class="tab-icon">
                    </button>
                    <button id="edit-delete-col" class="tab-icon-btn" title="Delete Column">
                        <img src="${imgPath}deletecol.svg" alt="Delete Column" class="tab-icon">
                    </button>
                    
                    <div class="ribbon-separator"></div>
                    
                    <!-- Merge -->
                    <button id="edit-merge" class="tab-icon-btn" title="Merge Cells">
                        <img src="${imgPath}merge.svg" alt="Merge" class="tab-icon">
                    </button>
                </div>
            `;
        },

        /**
         * Bind event handlers to Edit buttons
         */
        bindEvents: function () {
            const buttons = {
                'edit-undo': 'undo',
                'edit-redo': 'redo',
                'edit-copy': 'copy',
                'edit-cut': 'cut',
                'edit-paste': 'paste',
                'edit-delete': 'erase',
                'edit-fill-down': 'filldown',
                'edit-fill-right': 'fillright',
                'edit-insert-row': 'insertrow',
                'edit-insert-col': 'insertcol',
                'edit-delete-row': 'deleterow',
                'edit-delete-col': 'deletecol',
                'edit-merge': 'merge'
            };

            Object.keys(buttons).forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.onclick = () => {
                        // Use SocialCalc.DoCmd which properly handles %C (current cell) replacement
                        if (typeof SocialCalc !== 'undefined' && SocialCalc.DoCmd) {
                            SocialCalc.DoCmd(btn, buttons[id]);
                        } else {
                            console.error('SocialCalc.DoCmd not available');
                        }
                    };
                }
            });
        },

        /**
         * Cleanup when leaving Edit tab
         */
        cleanup: function () {
            if (this.container) {
                this.container.innerHTML = '';
                this.container.style.display = 'none';
            }
        },

        /**
         * Called when the Edit tab is clicked
         */
        initOnTabClick: function () {
            this.init('edittools');
        }
    };

    // Hook into SocialCalc.SetTab
    const installSocialCalcHook = function () {
        if (!window.SocialCalc || !window.SocialCalc.SetTab) {
            return false;
        }

        const originalSetTab = SocialCalc.SetTab;

        SocialCalc.SetTab = function (tab) {
            let tabName = '';
            if (typeof tab === 'string') {
                tabName = tab;
            } else if (tab && tab.id) {
                const match = tab.id.match(/-([a-z]+)tab$/);
                if (match) {
                    tabName = match[1];
                }
            }

            const ret = originalSetTab.apply(this, arguments);

            if (tabName === 'edit') {
                if (window.EditLayout) {
                    window.EditLayout.initOnTabClick();
                }
            } else {
                if (window.EditLayout) {
                    window.EditLayout.cleanup();
                }
            }

            return ret;
        };

        // console.log('[EditLayout] SocialCalc.SetTab hooked successfully');
        return true;
    };

    if (!installSocialCalcHook()) {
        const checkInterval = setInterval(() => {
            if (installSocialCalcHook()) {
                clearInterval(checkInterval);
            }
        }, 100);
    }

})();
