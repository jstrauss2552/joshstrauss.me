/* Josh Strauss — personal site
   The site's only JavaScript: feed the cursor position to CSS as
   --mx/--my so the background glow and dot-grid follow the pointer.
   Without this file the glow simply sits still — nothing breaks. */

(function () {
  'use strict';

  var root = document.documentElement;
  var mx = 0, my = 0, scheduled = false;

  window.addEventListener('pointermove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(function () {
        root.style.setProperty('--mx', mx + 'px');
        root.style.setProperty('--my', my + 'px');
        scheduled = false;
      });
    }
  }, { passive: true });
})();
