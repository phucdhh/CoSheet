// SocialCalc snapshot parser for frontend
(function(window) {
  'use strict';
  
  window.SocialCalcParser = {
    // Parse SocialCalc snapshot to 2D array (CSV-like)
    parseToArray: function(snapshot) {
      if (!snapshot) return [];
      
      var lines = snapshot.split('\n');
      var cells = {};
      var maxRow = 0;
      var maxCol = 0;
      
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('cell:') === 0) {
          var parts = line.split(':');
          if (parts.length < 3) continue;
          
          var coord = parts[1]; // e.g., "A1"
          var type = parts[2];   // e.g., "t" for text
          var value = parts.slice(3).join(':'); // Handle values with colons
          
          // Parse coordinate (A1, B2, etc.)
          var match = coord.match(/^([A-Z]+)(\d+)$/);
          if (!match) continue;
          
          var colStr = match[1];
          var rowNum = parseInt(match[2]);
          
          // Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, etc.)
          var col = 0;
          for (var j = 0; j < colStr.length; j++) {
            col = col * 26 + (colStr.charCodeAt(j) - 64);
          }
          col = col - 1; // Make 0-indexed
          
          var row = rowNum - 1; // Make 0-indexed
          
          if (!cells[row]) cells[row] = {};
          cells[row][col] = value;
          
          if (row > maxRow) maxRow = row;
          if (col > maxCol) maxCol = col;
        }
      }
      
      // Convert to 2D array
      var result = [];
      for (var r = 0; r <= maxRow; r++) {
        var rowArray = [];
        for (var c = 0; c <= maxCol; c++) {
          rowArray.push(cells[r] && cells[r][c] || '');
        }
        result.push(rowArray);
      }
      
      return result;
    }
  };
})(window);
