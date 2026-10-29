// The shake plays when aria-invalid appears, so a repeat shake needs the attribute cleared and set again with a style flush between
for (const button of document.querySelectorAll('[data-shake-field]')) {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.shakeField);
    input.removeAttribute('aria-invalid');
    input.getBoundingClientRect();
    input.setAttribute('aria-invalid', 'true');
  });
}
