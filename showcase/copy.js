// Adds a "Copy" button after every code.copyable. Without the clipboard API nothing is added, so there are no dead buttons.
(function () {
  if (!navigator.clipboard || !navigator.clipboard.writeText) return;

  var RESET_MILLISECONDS = 1500;

  // The button's own text changes, so announcements go through one polite status region instead of the button's label
  var status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.className = 'visually-hidden';
  document.body.appendChild(status);

  function labelOf(code) {
    var caption = code.closest('.cap');
    var heading = caption && caption.querySelector('b');
    return code.dataset.label || (heading && heading.textContent) || 'text';
  }

  function showResult(button, text, announcement) {
    button.textContent = text;
    status.textContent = announcement;
    setTimeout(function () {
      button.textContent = 'Copy';
      status.textContent = '';
    }, RESET_MILLISECONDS);
  }

  document.querySelectorAll('code.copyable').forEach(function (code) {
    var label = labelOf(code);
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy ' + label);
    button.addEventListener('click', function () {
      navigator.clipboard.writeText(code.textContent).then(
        function () { showResult(button, 'Copied', 'Copied ' + label); },
        function () { showResult(button, 'Copy failed', 'Copy failed for ' + label); }
      );
    });
    code.after(button);
  });
})();
