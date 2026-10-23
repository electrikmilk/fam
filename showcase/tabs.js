// Wires the tab strips on the Controls page: click, then ArrowLeft, ArrowRight, Home and End, and shows the selected tab's panel.
// Without JavaScript every panel stays visible under its strip. Every enabled tab stays in the Tab order, so there is no roving tabindex.
window.FamShowcase = window.FamShowcase || {};

window.FamShowcase.createTabs = function (tablist) {
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
  var KEY_STEPS = { ArrowRight: 1, ArrowLeft: -1 };

  function enabledTabs() {
    return tabs.filter(function (tab) { return !tab.disabled; });
  }

  function select(selectedTab) {
    tabs.forEach(function (tab) {
      var isSelected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(isSelected));
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !isSelected;
    });
  }

  tablist.addEventListener('click', function (event) {
    var tab = event.target.closest('[role="tab"]');
    if (tab && !tab.disabled) select(tab);
  });

  tablist.addEventListener('keydown', function (event) {
    var available = enabledTabs();
    var current = available.indexOf(document.activeElement);
    if (current === -1) return;
    var next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = available.length - 1;
    else if (event.key in KEY_STEPS) next = (current + KEY_STEPS[event.key] + available.length) % available.length;
    else return;
    event.preventDefault();
    select(available[next]);
    available[next].focus();
  });

  select(tabs.filter(function (tab) { return tab.getAttribute('aria-selected') === 'true'; })[0] || enabledTabs()[0]);
};

Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"][data-tabs]'), window.FamShowcase.createTabs);
