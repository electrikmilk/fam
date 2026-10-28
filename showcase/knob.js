// Turns a .fam-knob into a slider: keyboard, pointer, and the ARIA values a screen reader needs.
// The orange tick sweeps 270 degrees, from 135 degrees left of straight up to 135 degrees right of it.
// The knob turns in whole steps. A knob that stands for a fraction sets data-divisor (a step is 1 / divisor) and data-unit ("" for none),
// and its aria-valuetext and scaledValue are the step count divided by the divisor.
window.FamShowcase = window.FamShowcase || {};

window.FamShowcase.createKnob = function (element, onChange) {
  var SWEEP_DEGREES = 135;
  var min = Number(element.getAttribute('aria-valuemin'));
  var max = Number(element.getAttribute('aria-valuemax'));
  var value = Number(element.getAttribute('aria-valuenow'));
  var divisor = Number(element.getAttribute('data-divisor') || 1);
  var unit = element.hasAttribute('data-unit') ? element.getAttribute('data-unit') : 'px';

  function render() {
    var angle = -SWEEP_DEGREES + (2 * SWEEP_DEGREES * (value - min)) / (max - min);
    element.style.setProperty('--fam-knob-angle', angle + 'deg');
    element.setAttribute('aria-valuenow', String(value));
    element.setAttribute('aria-valuetext', value / divisor + unit);
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
    get scaledValue() { return value / divisor; },
    setValue: function (next) {
      value = clamp(next);
      render();
    },
  };
};
