// Turns the pairing panels on the home page into tabs. Without JavaScript every panel stays visible under its own heading.
(function () {
  var container = document.querySelector('[data-pairings]');
  if (!container) return;

  var panels = Array.prototype.slice.call(container.querySelectorAll('.pairing-panel'));
  var tablist = document.createElement('div');
  tablist.className = 'pairing-tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Pairings');

  var tabs = panels.map(function (panel, index) {
    var tab = document.createElement('button');
    tab.type = 'button';
    tab.id = 'tab-' + panel.id;
    tab.textContent = panel.dataset.title;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.addEventListener('click', function () { select(index); });
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    tablist.appendChild(tab);
    return tab;
  });

  function select(selectedIndex) {
    tabs.forEach(function (tab, index) {
      var isSelected = index === selectedIndex;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      panels[index].hidden = !isSelected;
    });
  }

  var KEY_STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

  tablist.addEventListener('keydown', function (event) {
    var current = tabs.indexOf(document.activeElement);
    if (current === -1) return;
    var next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else if (event.key in KEY_STEPS) next = (current + KEY_STEPS[event.key] + tabs.length) % tabs.length;
    else return;
    event.preventDefault();
    select(next);
    tabs[next].focus();
  });

  container.insertBefore(tablist, panels[0]);
  container.classList.add('is-tabs');
  select(0);
})();
