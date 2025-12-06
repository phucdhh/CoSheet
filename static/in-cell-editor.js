/**
 * In-Cell Editor for EtherCalc
 * Allows editing directly in cells like Excel/Google Sheets
 */

(function() {
  'use strict';

  // Create in-cell editor overlay
  SocialCalc.InCellEditor = function(editor) {
    this.editor = editor;
    this.container = null;
    this.textarea = null;
    this.isActive = false;
    this.currentCell = null;
    
    this.createEditor();
  };

  SocialCalc.InCellEditor.prototype.createEditor = function() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'incell-editor-container';
    this.container.style.cssText = `
      position: absolute;
      display: none;
      z-index: 100;
      background: white;
      border: 2px solid #4285f4;
      box-sizing: border-box;
      padding: 0;
      overflow: hidden;
    `;

    // Create textarea
    this.textarea = document.createElement('textarea');
    this.textarea.id = 'incell-editor-textarea';
    this.textarea.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      resize: none;
      padding: 4px 6px;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      box-sizing: border-box;
      overflow: hidden;
      background: transparent;
    `;

    // Handle input to sync with formula bar
    this.textarea.addEventListener('input', this.onInput.bind(this));
    this.textarea.addEventListener('keydown', this.onKeyDown.bind(this));
    this.textarea.addEventListener('blur', this.onBlur.bind(this));

    this.container.appendChild(this.textarea);
    this.editor.toplevel.appendChild(this.container);

    // Listen to formula bar changes
    this.setupFormulaBarSync();
  };

  SocialCalc.InCellEditor.prototype.setupFormulaBarSync = function() {
    const inputBox = this.editor.inputBox;
    if (!inputBox || !inputBox.element) return;

    // Sync from formula bar to in-cell editor
    const syncFromFormulaBar = (e) => {
      if (this.isActive && this.textarea.value !== inputBox.element.value) {
        const cursorPos = this.textarea.selectionStart;
        this.textarea.value = inputBox.element.value;
        this.textarea.setSelectionRange(cursorPos, cursorPos);
        this.textarea.style.height = 'auto';
        this.textarea.style.height = this.textarea.scrollHeight + 'px';
      }
    };

    inputBox.element.addEventListener('input', syncFromFormulaBar);
    inputBox.element.addEventListener('keyup', syncFromFormulaBar);
  };

  SocialCalc.InCellEditor.prototype.show = function(cell, initialText) {
    if (!cell || !cell.element) return;

    this.isActive = true;
    this.currentCell = cell;

    // Get cell position and size
    const rect = cell.element.getBoundingClientRect();
    const editorRect = this.editor.toplevel.getBoundingClientRect();
    
    const left = rect.left - editorRect.left;
    const top = rect.top - editorRect.top;
    const width = rect.width;
    const height = rect.height;

    // Position and size the editor
    this.container.style.left = left + 'px';
    this.container.style.top = top + 'px';
    this.container.style.width = width + 'px';
    this.container.style.minHeight = height + 'px';
    this.container.style.display = 'block';

    // Set initial text
    this.textarea.value = initialText || '';
    this.textarea.style.height = 'auto';
    this.textarea.style.height = this.textarea.scrollHeight + 'px';

    // Focus and select
    setTimeout(() => {
      this.textarea.focus();
      if (initialText === '') {
        this.textarea.setSelectionRange(0, 0);
      } else {
        this.textarea.setSelectionRange(this.textarea.value.length, this.textarea.value.length);
      }
    }, 0);

    // Sync with formula bar
    if (this.editor.inputBox && this.editor.inputBox.element) {
      this.editor.inputBox.element.value = this.textarea.value;
    }
  };

  SocialCalc.InCellEditor.prototype.hide = function() {
    this.isActive = false;
    this.currentCell = null;
    this.container.style.display = 'none';
    this.textarea.value = '';
  };

  SocialCalc.InCellEditor.prototype.onInput = function(e) {
    // Auto-resize textarea
    this.textarea.style.height = 'auto';
    this.textarea.style.height = this.textarea.scrollHeight + 'px';

    // Sync with formula bar
    if (this.editor.inputBox && this.editor.inputBox.element) {
      this.editor.inputBox.element.value = this.textarea.value;
      
      // Trigger input event on formula bar for any listeners
      const event = new Event('input', { bubbles: true });
      this.editor.inputBox.element.dispatchEvent(event);
    }

    // Update working values
    if (this.editor.workingvalues) {
      this.editor.workingvalues.partialexpr = this.textarea.value;
    }
  };

  SocialCalc.InCellEditor.prototype.onKeyDown = function(e) {
    const key = e.key || e.keyCode;

    // Enter - finish editing
    if (key === 'Enter' || key === 13) {
      if (!e.shiftKey) {
        e.preventDefault();
        this.finishEdit();
        return false;
      }
    }

    // Escape - cancel editing
    if (key === 'Escape' || key === 27) {
      e.preventDefault();
      this.cancelEdit();
      return false;
    }

    // Tab - finish and move to next cell
    if (key === 'Tab' || key === 9) {
      e.preventDefault();
      this.finishEdit();
      // Let SocialCalc handle tab navigation
      return false;
    }
  };

  SocialCalc.InCellEditor.prototype.onBlur = function(e) {
    // Delay to allow clicking on other UI elements
    setTimeout(() => {
      if (this.isActive && document.activeElement !== this.textarea) {
        this.finishEdit();
      }
    }, 100);
  };

  SocialCalc.InCellEditor.prototype.finishEdit = function() {
    if (!this.isActive) return;

    const text = this.textarea.value;
    const editor = this.editor;

    // Set the cell value
    if (editor.inputBox && editor.inputBox.element) {
      editor.inputBox.element.value = text;
    }

    // Hide editor
    this.hide();

    // Process the input like formula bar Enter
    if (editor.state === 'input' || editor.state === 'inputboxdirect') {
      editor.EditorSaveEdit();
    }

    // Move to next cell (down)
    if (editor.ecell) {
      SocialCalc.EditorProcessKey(editor, '\n', false);
    }
  };

  SocialCalc.InCellEditor.prototype.cancelEdit = function() {
    if (!this.isActive) return;

    const editor = this.editor;

    // Restore original value
    if (editor.inputBox && editor.inputBox.element) {
      editor.inputBox.DisplayCellContents();
    }

    this.hide();

    // Cancel edit mode
    if (editor.state === 'input' || editor.state === 'inputboxdirect') {
      editor.state = 'start';
      editor.RangeRemove();
    }
  };

  SocialCalc.InCellEditor.prototype.getText = function() {
    return this.textarea.value;
  };

  SocialCalc.InCellEditor.prototype.setText = function(text) {
    this.textarea.value = text;
    this.textarea.style.height = 'auto';
    this.textarea.style.height = this.textarea.scrollHeight + 'px';

    // Sync with formula bar
    if (this.editor.inputBox && this.editor.inputBox.element) {
      this.editor.inputBox.element.value = text;
    }
  };

})();
