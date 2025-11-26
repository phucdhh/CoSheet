const fs = require('fs');
const path = 'node_modules/socialcalc/js/socialcalctableeditor.js';

let content = fs.readFileSync(path, 'utf8');

// Replacement 1: EditorProcessMouseWheel
const target1 = `SocialCalc.EditorProcessMouseWheel = function(event, delta, mousewheelinfo, wobj) {

   if (wobj.functionobj.editor.busy) return; // ignore if busy

   if (delta > 0) {
      wobj.functionobj.editor.ScrollRelative(true, Math.floor(-delta * 1.5));
      }
   if (delta < 0) {
      wobj.functionobj.editor.ScrollRelative(true, Math.ceil(-delta * 1.5));
      }

   }`;

const replacement1 = `SocialCalc.EditorProcessMouseWheel = function(event, delta, deltaX, mousewheelinfo, wobj) {

   if (wobj.functionobj.editor.busy) return; // ignore if busy

   if (deltaX && deltaX !== 0) {
      if (deltaX > 0) {
         wobj.functionobj.editor.ScrollRelative(false, Math.floor(-deltaX * 1.5));
         }
      else {
         wobj.functionobj.editor.ScrollRelative(false, Math.ceil(-deltaX * 1.5));
         }
      }

   if (delta && delta !== 0) {
      if (delta > 0) {
         wobj.functionobj.editor.ScrollRelative(true, Math.floor(-delta * 1.5));
         }
      else {
         wobj.functionobj.editor.ScrollRelative(true, Math.ceil(-delta * 1.5));
         }
      }

   }`;

// Replacement 2: ProcessMouseWheel
const target2 = `SocialCalc.ProcessMouseWheel = function(e) {

   var event = e || window.event;
   var delta;

   if (SocialCalc.Keyboard.passThru) return; // ignore

   var mousewheelinfo = SocialCalc.MouseWheelInfo;
   var ele = event.target || event.srcElement; // source object is often within what we want
   var wobj;

   for (wobj=null; !wobj && ele; ele=ele.parentNode) { // go up tree looking for one of our elements
      wobj = SocialCalc.LookupElement(ele, mousewheelinfo.registeredElements);
      }
   if (!wobj) return; // not one of our elements

   if (event.wheelDelta) {
      delta = event.wheelDelta/120;
      }
   else delta = -event.detail/3;
   if (!delta) delta = 0;

   if (wobj.functionobj && wobj.functionobj.WheelMove) wobj.functionobj.WheelMove(event, delta, mousewheelinfo, wobj);

   if (event.preventDefault) event.preventDefault();
   event.returnValue = false;

   }`;

const replacement2 = `SocialCalc.ProcessMouseWheel = function(e) {

   var event = e || window.event;
   var delta = 0;
   var deltaX = 0;

   if (SocialCalc.Keyboard.passThru) return; // ignore

   var mousewheelinfo = SocialCalc.MouseWheelInfo;
   var ele = event.target || event.srcElement; // source object is often within what we want
   var wobj;

   for (wobj=null; !wobj && ele; ele=ele.parentNode) { // go up tree looking for one of our elements
      wobj = SocialCalc.LookupElement(ele, mousewheelinfo.registeredElements);
      }
   if (!wobj) return; // not one of our elements

   if (event.deltaY !== undefined) {
      delta = -event.deltaY / 120;
      deltaX = -event.deltaX / 120;
      }
   else if (event.wheelDeltaY !== undefined) {
      delta = event.wheelDeltaY / 120;
      deltaX = event.wheelDeltaX / 120;
      }
   else if (event.wheelDelta) {
      delta = event.wheelDelta/120;
      }
   else delta = -event.detail/3;
   
   if (!delta) delta = 0;
   if (!deltaX) deltaX = 0;

   if (wobj.functionobj && wobj.functionobj.WheelMove) wobj.functionobj.WheelMove(event, delta, deltaX, mousewheelinfo, wobj);

   if (event.preventDefault) event.preventDefault();
   event.returnValue = false;

   }`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    console.log('Replaced EditorProcessMouseWheel');
} else {
    console.log('Target 1 not found');
}

if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    console.log('Replaced ProcessMouseWheel');
} else {
    console.log('Target 2 not found');
}

fs.writeFileSync(path, content, 'utf8');
