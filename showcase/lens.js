// Moves the lens to follow the pointer over the glass band. The controls tray is left alone so turning a knob does not drag the lens.
window.FamShowcase = window.FamShowcase || {};

window.FamShowcase.followPointer = function (band, lens) {
  var pending = null;
  var x = 0;
  var y = 0;

  function place() {
    lens.style.left = x - lens.offsetWidth / 2 + 'px';
    lens.style.top = y - lens.offsetHeight / 2 + 'px';
    pending = null;
  }

  band.addEventListener('pointermove', function (event) {
    if (event.target.closest('.tray')) return;
    var box = band.getBoundingClientRect();
    x = event.clientX - box.left;
    y = event.clientY - box.top;
    if (pending === null) pending = requestAnimationFrame(place);
  });
};
