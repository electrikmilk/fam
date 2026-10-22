// Contrast audit, step 1 of 2 (browser). Run in the page (for example with the Chrome DevTools evaluate_script tool) on the demo page.
// It records every text node, input placeholder and SVG icon with its real color, size and position, then hides all text and icons.
// Step 2: take a full-page screenshot, then run audit_contrast.py ITEMS.json SCREENSHOT.png to measure each item against the pixels behind it.
//
// The demo page scrolls inside a container, so the script first expands the scroll containers above `.fam` so a full-page screenshot works.
// Adjust the root selector ('.fam') for another page. Device pixel ratio is assumed to be 2 in audit_contrast.py.
async () => {
  for (let n = document.querySelector('.fam'); n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (n === document.body || n === document.documentElement) continue;
    if (/(auto|scroll|hidden|clip)/.test(cs.overflowY) || /(auto|scroll|hidden|clip)/.test(cs.overflowX)) {
      n.style.overflow = 'visible'; n.style.height = 'auto'; n.style.maxHeight = 'none';
    }
  }
  document.documentElement.style.height = 'auto'; document.documentElement.style.overflow = 'visible';
  document.body.style.height = 'auto'; document.body.style.overflow = 'visible';
  await new Promise(r => setTimeout(r, 500));

  const parse = value => { const m = value.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m[3] === undefined ? 1 : m[3]]; };
  const opacityChain = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
  const label = el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
  const items = [];
  const push = (kind, rect, el, color, text, fontSize, fontWeight) => {
    if (rect.width < 2 || rect.height < 2) return;
    const rgba = parse(color);
    items.push({ kind, x: rect.left + scrollX, y: rect.top + scrollY, w: rect.width, h: rect.height, color: rgba.slice(0, 3), alpha: rgba[3] * opacityChain(el), text: text.slice(0, 40), size: fontSize, weight: fontWeight, sel: label(el), parent: el.parentElement ? label(el.parentElement) : '' });
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim();
    const el = node.parentElement;
    if (!text || !el || ['SCRIPT', 'STYLE', 'TITLE'].includes(el.tagName)) continue;
    if (el.closest('header, [aria-hidden="true"], svg')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const rect of range.getClientRects()) push('text', rect, el, cs.color, text, parseFloat(cs.fontSize), parseInt(cs.fontWeight));
  }
  for (const input of document.querySelectorAll('input[placeholder]')) {
    const cs = getComputedStyle(input); const ph = getComputedStyle(input, '::placeholder');
    const canvas = document.createElement('canvas').getContext('2d'); canvas.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const b = input.getBoundingClientRect();
    push('placeholder', { left: b.left + parseFloat(cs.paddingLeft), top: b.top + (b.height - parseFloat(cs.fontSize) * 1.2) / 2, width: canvas.measureText(input.placeholder).width, height: parseFloat(cs.fontSize) * 1.2 }, input, ph.color, input.placeholder, parseFloat(cs.fontSize), parseInt(cs.fontWeight));
  }
  for (const svg of document.querySelectorAll('svg')) {
    if (svg.closest('[disabled]') || svg.getAttribute('width') === '0') continue;
    push('icon', svg.getBoundingClientRect(), svg, getComputedStyle(svg).color, 'icon', 0, 0);
  }

  const style = document.createElement('style');
  style.textContent = '* { color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; } input::placeholder { color: transparent !important; } svg { color: transparent !important; }';
  document.head.appendChild(style);
  await new Promise(r => setTimeout(r, 300));
  return { pageHeight: document.documentElement.scrollHeight, count: items.length, items };
}
