// Turns a .fam-knob into a slider: keyboard, pointer, and the ARIA values a screen reader needs.
// The orange tick sweeps 270 degrees, from 135 degrees left of straight up to 135 degrees right of it.
window.FamShowcase = window.FamShowcase || {};

window.FamShowcase.createKnob = function (element, onChange) {
  var SWEEP_DEGREES = 135;
  var min = Number(element.getAttribute('aria-valuemin'));
  var max = Number(element.getAttribute('aria-valuemax'));
  var value = Number(element.getAttribute('aria-valuenow'));

  function render() {
    var angle = -SWEEP_DEGREES + (2 * SWEEP_DEGREES * (value - min)) / (max - min);
    element.style.setProperty('--fam-knob-angle', angle + 'deg');
    element.setAttribute('aria-valuenow', String(value));
    element.setAttribute('aria-valuetext', value + 'px');
  }

  function clamp(next) {
    return Math.min(max, Math.max(min, Math.round(next)));
  }

  // User input reports a change; setValue() only draws, so the caller can restore a value without a feedback loop
  function turnTo(next) {
    var clamped = clamp(next);
    if (clamped === value) return;
    value = clamped;
    render();
    onChange(value);
  }

  var KEY_STEPS = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 };

  element.addEventListener('keydown', function (event) {
    if (event.key === 'Home') turnTo(min);
    else if (event.key === 'End') turnTo(max);
    else if (event.key in KEY_STEPS) turnTo(value + KEY_STEPS[event.key]);
    else return;
    event.preventDefault();
  });

  function valueFromPointer(event) {
    var box = element.getBoundingClientRect();
    var dx = event.clientX - (box.left + box.width / 2);
    var dy = event.clientY - (box.top + box.height / 2);
    var degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
    var clamped = Math.min(SWEEP_DEGREES, Math.max(-SWEEP_DEGREES, degrees));
    return min + ((clamped + SWEEP_DEGREES) / (2 * SWEEP_DEGREES)) * (max - min);
  }

  element.addEventListener('pointerdown', function (event) {
    element.focus();
    element.setPointerCapture(event.pointerId);
    turnTo(valueFromPointer(event));
  });

  element.addEventListener('pointermove', function (event) {
    if (element.hasPointerCapture(event.pointerId)) turnTo(valueFromPointer(event));
  });

  render();

  return {
    get value() { return value; },
    setValue: function (next) {
      value = clamp(next);
      render();
    },
  };
};
