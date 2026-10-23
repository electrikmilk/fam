// Optional. Gives every .fam-glass--refract its own refraction filter, shaped to its size and corner radius, so the bending follows the rim
// of a rounded pane or a circle. Without this script the glass uses the static filter from refraction-filter.html, which is built for a
// box and bends the straight sides more than the corners. Chromium only, like the filter itself.
// Load it with a script tag or import it for its side effect: import 'fam-ui/refraction'.
(function () {
  // A bundler can import this on the server, where there is no page to fit
  if (typeof document === 'undefined') return;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var DISPLACEMENT_SCALE = 0.2;
  var MAX_MAP_SIDE = 320;
  // How far the rim pulls the backdrop in, as a fraction of the glass's short side, by how deep inside the rim a point is.
  // The same ramp as the static map in tools/make-refraction-map.mjs: strongest at the rim, neutral from a fifth of the way in.
  var RIM_RAMP = [[0, 0.0996], [0.04, 0.068], [0.1, 0.025], [0.2, 0]];

  var filters = new WeakMap();
  var resizeObserver = new ResizeObserver(scheduleRefresh);
  var container = null;
  var nextId = 1;
  var scheduled = false;

  function pullFraction(depthFraction) {
    for (var index = 1; index < RIM_RAMP.length; index++) {
      var from = RIM_RAMP[index - 1];
      var to = RIM_RAMP[index];
      if (depthFraction <= to[0]) return from[1] + ((to[1] - from[1]) * (depthFraction - from[0])) / (to[0] - from[0]);
    }
    return 0;
  }

  function cornerRadius(element, width, height) {
    var computed = getComputedStyle(element).borderTopLeftRadius;
    var radius = computed.slice(-1) === '%' ? (parseFloat(computed) / 100) * Math.min(width, height) : parseFloat(computed);
    return Math.min(radius, Math.min(width, height) / 2);
  }

  // Each pixel pulls the backdrop along the inward normal of the rounded rectangle. R and G hold the x and y pull around 128.
  function displacementMapUrl(width, height, radius) {
    var resolution = Math.min(1, MAX_MAP_SIDE / Math.max(width, height));
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(2, Math.round(width * resolution));
    canvas.height = Math.max(2, Math.round(height * resolution));
    var context = canvas.getContext('2d');
    var image = context.createImageData(canvas.width, canvas.height);
    var shortSide = Math.min(width, height);
    var halfInnerWidth = width / 2 - radius;
    var halfInnerHeight = height / 2 - radius;

    for (var row = 0; row < canvas.height; row++) {
      for (var column = 0; column < canvas.width; column++) {
        var fromCenterX = ((column + 0.5) / canvas.width) * width - width / 2;
        var fromCenterY = ((row + 0.5) / canvas.height) * height - height / 2;
        var overhangX = Math.abs(fromCenterX) - halfInnerWidth;
        var overhangY = Math.abs(fromCenterY) - halfInnerHeight;
        var outwardX = 0;
        var outwardY = 0;
        var distanceOutside;

        if (overhangX > 0 && overhangY > 0) {
          var cornerDistance = Math.hypot(overhangX, overhangY);
          distanceOutside = cornerDistance - radius;
          outwardX = (Math.sign(fromCenterX) * overhangX) / cornerDistance;
          outwardY = (Math.sign(fromCenterY) * overhangY) / cornerDistance;
        } else if (overhangX > overhangY) {
          distanceOutside = overhangX - radius;
          outwardX = Math.sign(fromCenterX);
        } else {
          distanceOutside = overhangY - radius;
          outwardY = Math.sign(fromCenterY);
        }

        var pull = shortSide * pullFraction(Math.max(0, -distanceOutside) / shortSide);
        var offset = (row * canvas.width + column) * 4;
        image.data[offset] = Math.round(128 + ((-outwardX * pull) / (DISPLACEMENT_SCALE * width)) * 255);
        image.data[offset + 1] = Math.round(128 + ((-outwardY * pull) / (DISPLACEMENT_SCALE * height)) * 255);
        image.data[offset + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function createFilter(id) {
    if (container === null) {
      container = document.createElementNS(SVG_NS, 'svg');
      container.setAttribute('width', '0');
      container.setAttribute('height', '0');
      container.setAttribute('aria-hidden', 'true');
      container.style.position = 'absolute';
      document.body.appendChild(container);
    }
    var filter = document.createElementNS(SVG_NS, 'filter');
    filter.id = id;
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', '1');
    filter.setAttribute('height', '1');
    filter.setAttribute('primitiveUnits', 'objectBoundingBox');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    var map = document.createElementNS(SVG_NS, 'feImage');
    map.setAttribute('x', '0');
    map.setAttribute('y', '0');
    map.setAttribute('width', '1');
    map.setAttribute('height', '1');
    map.setAttribute('preserveAspectRatio', 'none');
    map.setAttribute('result', 'map');
    var displacement = document.createElementNS(SVG_NS, 'feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'map');
    displacement.setAttribute('scale', String(DISPLACEMENT_SCALE));
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    filter.append(map, displacement);
    container.appendChild(filter);
    return map;
  }

  function fit(element) {
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    if (!width || !height) return;
    var radius = cornerRadius(element, width, height);
    var shape = width + 'x' + height + ' r' + radius;
    var known = filters.get(element);
    if (known && known.shape === shape) return;

    if (!known) {
      var id = 'fam-refract-' + nextId++;
      known = { map: createFilter(id), shape: '' };
      filters.set(element, known);
      resizeObserver.observe(element);
      element.style.setProperty('--fam-refract-filter', 'url(#' + id + ')');
    }
    known.shape = shape;
    known.map.setAttribute('href', displacementMapUrl(width, height, radius));
  }

  function refresh() {
    scheduled = false;
    document.querySelectorAll('.fam-glass--refract').forEach(fit);
  }

  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }

  new MutationObserver(scheduleRefresh).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
  scheduleRefresh();
})();
