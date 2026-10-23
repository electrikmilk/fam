// Wires the knobs and the Refract switch to the lens and keeps the copyable markup in step with them.
(function () {
  var lens = document.getElementById('lens');
  var readout = document.getElementById('readout');
  var refract = document.getElementById('refract-switch');
  var band = document.getElementById('glass');

  // Frosted and refracting glass have different default blurs, so each mode remembers its own
  var blur = { refract: 1, frosted: 14 };
  var radius = 90;
  var glow = 18;

  function blurVariable() {
    return refract.checked ? '--fam-refract-blur' : '--fam-glass-blur';
  }

  function activeBlur() {
    return blur[refract.checked ? 'refract' : 'frosted'];
  }

  function render() {
    lens.classList.toggle('fam-glass--refract', refract.checked);
    lens.style.setProperty('--fam-r', radius + 'px');
    lens.style.setProperty('--fam-glow-depth', glow + 'px');
    lens.style.removeProperty(refract.checked ? '--fam-glass-blur' : '--fam-refract-blur');
    lens.style.setProperty(blurVariable(), activeBlur() + 'px');

    var classes = refract.checked ? 'fam-glass fam-glass--refract' : 'fam-glass';
    readout.textContent = '<div class="' + classes + '" style="--fam-r: ' + radius + 'px; --fam-glow-depth: ' + glow + 'px; ' + blurVariable() + ': ' + activeBlur() + 'px"></div>';
  }

  var blurKnob = window.FamShowcase.createKnob(document.getElementById('knob-blur'), function (value) {
    blur[refract.checked ? 'refract' : 'frosted'] = value;
    render();
  });
  window.FamShowcase.createKnob(document.getElementById('knob-glow'), function (value) {
    glow = value;
    render();
  });
  window.FamShowcase.createKnob(document.getElementById('knob-radius'), function (value) {
    radius = value;
    render();
  });

  refract.addEventListener('change', function () {
    blurKnob.setValue(activeBlur());
    render();
  });

  window.FamShowcase.followPointer(band, lens);
})();
