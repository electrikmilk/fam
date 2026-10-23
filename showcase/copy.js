// Collapses long code blocks, and adds a "Copy" button to every code block and after every code.copyable. Without the clipboard API no
// copy button is added, so there are no dead buttons. Without JavaScript every block shows in full.
(function () {
  var COLLAPSE_AFTER_LINES = 8;
  var RESET_MILLISECONDS = 1500;

  // A collapsed block shows its first lines, set by .code-block.is-collapsed pre in site.css
  function collapseLongBlocks() {
    document.querySelectorAll('.code-block').forEach(function (block, index) {
      var lineCount = block.querySelector('code').textContent.split('\n').length;
      if (lineCount <= COLLAPSE_AFTER_LINES) return;

      var pre = block.querySelector('pre');
      pre.id = 'code-block-' + index;
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'toggle';
      toggle.setAttribute('aria-controls', pre.id);

      function render(isCollapsed) {
        block.classList.toggle('is-collapsed', isCollapsed);
        toggle.setAttribute('aria-expanded', String(!isCollapsed));
        toggle.textContent = isCollapsed ? 'Show all ' + lineCount + ' lines' : 'Show less';
      }

      toggle.addEventListener('click', function () { render(!block.classList.contains('is-collapsed')); });
      render(true);
      block.querySelector('.code-head').appendChild(toggle);
    });
  }

  collapseLongBlocks();
  if (!navigator.clipboard || !navigator.clipboard.writeText) return;

  // The button's own text changes, so announcements go through one polite status region instead of the button's label
  var status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.className = 'visually-hidden';
  document.body.appendChild(status);

  function labelOf(code) {
    var block = code.closest('.code-block');
    var caption = code.closest('.cap');
    var heading = caption && caption.querySelector('b');
    return (block && block.dataset.label) || code.dataset.label || (heading && heading.textContent) || 'text';
  }

  function showResult(button, text, announcement) {
    button.textContent = text;
    status.textContent = announcement;
    setTimeout(function () {
      button.textContent = 'Copy';
      status.textContent = '';
    }, RESET_MILLISECONDS);
  }

  function createButton(code) {
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
    return button;
  }

  document.querySelectorAll('.code-block').forEach(function (block) {
    block.querySelector('.code-head').appendChild(createButton(block.querySelector('code')));
  });

  document.querySelectorAll('code.copyable').forEach(function (code) {
    code.after(createButton(code));
  });
})();
