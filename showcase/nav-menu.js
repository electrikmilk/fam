// Folds the site bar's links into a leather drawer on a phone, opened by a leather button. Without JavaScript the links stay in the bar.
(function () {
  var nav = document.querySelector('.site-nav');
  if (!nav) return;

  var phone = window.matchMedia('(max-width: 480px)');
  var pageRegions = document.querySelectorAll('main, footer');

  var menu = document.createElement('div');
  menu.id = 'site-nav-menu';
  menu.className = 'site-nav-menu fam-leather-bar';
  nav.querySelectorAll('a.fam-nav-item').forEach(function (link) { menu.appendChild(link); });

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'fam-leather-button site-nav-toggle';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.setAttribute('aria-controls', menu.id);
  toggle.setAttribute('aria-expanded', 'false');
  for (var bar = 0; bar < 3; bar++) toggle.appendChild(document.createElement('span'));

  var scrim = document.createElement('div');
  scrim.className = 'site-nav-scrim';

  nav.append(toggle, scrim, menu);

  // The page behind the drawer is inert so Tab stays in the bar, and it does not scroll under the dimmed area
  function setOpen(isOpen) {
    nav.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.documentElement.style.overflow = isOpen ? 'hidden' : '';
    pageRegions.forEach(function (region) { region.inert = isOpen; });
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  scrim.addEventListener('click', function () { setOpen(false); });

  // A page that comes back from the back/forward cache would otherwise still have its drawer open
  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
    setOpen(false);
    toggle.focus();
  });

  phone.addEventListener('change', function () {
    if (!phone.matches) setOpen(false);
  });
})();
