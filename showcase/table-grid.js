// Wires the selectable zebra tables on the Controls page: click, then ArrowUp, ArrowDown, Home and End select a row and move focus to it.
// Without JavaScript the markup still shows its selected row. Only the selected row is in the Tab order (a roving tabindex), so the grid is one Tab stop.
window.FamShowcase = window.FamShowcase || {};

window.FamShowcase.createTableGrid = function (grid) {
  var rows = Array.prototype.slice.call(grid.querySelectorAll('tbody tr'));
  var KEY_STEPS = { ArrowDown: 1, ArrowUp: -1 };

  function select(selectedRow) {
    rows.forEach(function (row) {
      var isSelected = row === selectedRow;
      row.setAttribute('aria-selected', String(isSelected));
      row.tabIndex = isSelected ? 0 : -1;
    });
  }

  grid.addEventListener('click', function (event) {
    var row = event.target.closest('tbody tr');
    if (row) select(row);
  });

  grid.addEventListener('keydown', function (event) {
    var current = rows.indexOf(document.activeElement);
    if (current === -1) return;
    var next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = rows.length - 1;
    else if (event.key in KEY_STEPS) next = Math.min(Math.max(current + KEY_STEPS[event.key], 0), rows.length - 1);
    else return;
    event.preventDefault();
    select(rows[next]);
    rows[next].focus();
  });

  select(rows.filter(function (row) { return row.getAttribute('aria-selected') === 'true'; })[0] || rows[0]);
};

Array.prototype.forEach.call(document.querySelectorAll('table[role="grid"][data-table-grid]'), window.FamShowcase.createTableGrid);
