// Moves the lens to follow the pointer over the glass band. The lens stops following before the pointer reaches the controls tray, so it parks clear of the knobs and stays visible as a preview while one is turned.
window.FamShowcase = window.FamShowcase || {};

window.FamShowcase.followPointer = function (band, lens) {
  var TRAY_GAP = 16;
  var tray = band.querySelector('.tray');
  var pending = null;
  var x = 0;
  var y = 0;

  function place() {
    lens.style.left = x - lens.offsetWidth / 2 + 'px';
    lens.style.top = y - lens.offsetHeight / 2 + 'px';
    pending = null;
  }

  // The lens is centered on the pointer, so its edge reaches the tray one lens radius plus the gap sooner
  function isNearTray(event) {
    var box = tray.getBoundingClientRect();
    var margin = lens.offsetHeight / 2 + TRAY_GAP;
    return event.clientX > box.left - margin
      && event.clientX < box.right + margin
      && event.clientY > box.top - margin
      && event.clientY < box.bottom + margin;
  }

  band.addEventListener('pointermove', function (event) {
    if (isNearTray(event)) return;
    var box = band.getBoundingClientRect();
    x = event.clientX - box.left;
    y = event.clientY - box.top;
    if (pending === null) pending = requestAnimationFrame(place);
  });
};
