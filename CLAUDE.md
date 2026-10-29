# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Fam UI is a plain-CSS skeuomorphic UI kit (Mac OS X Aqua and pre-iOS 7 materials). Classes start with `fam-` and custom properties with `--fam-`. The README is the user-facing reference for every class and variable.

## Commands

- `npm run build`: concatenates `css/*.css` into `dist/fam-ui.css` (gitignored). Every page, fixture and test loads `dist/`, so build before opening or testing anything.
- `npm test`: build, then the whole suite. It takes multiple minutes.
- `npm run test:fast`: the suite without the contrast sweeps.
- `npm run test:glass`, `npm run test:contrast`: the glass and contrast subsets.
- `npm run audit`: the pixel-based contrast audit (`tools/contrast-audit.mjs`).
- `npm run site`: assembles `_site/` for GitHub Pages (`.github/workflows/pages.yml` publishes it on push to `main` and does not run tests).
- `npm run header`: regenerates `docs/header.png`.

## Testing

- The full suite (`npm test`) takes multiple minutes. Run targeted tests as much as possible.
- Build first, then run only the test files for what you changed: `npm run build && node --test --test-concurrency=4 tests/<file>.test.mjs`.
- Tests are Playwright (`playwright-core`) driving the installed Google Chrome, with real rendered pixels, not mocks. `FAM_BROWSER=firefox` or `webkit` switches the engine; some tests skip outside Chromium (forced colors, refraction).
- `tests/helpers/browser.mjs` has `openUrl` plus URL helpers for the fixture, showcase pages and examples. It shares one browser per test file and collects failed requests, HTTP errors and console errors in `issues`. `tests/fixtures/kit.html` is a page with one sample of each material and control.
- The contrast audit and `assets.test.mjs` also shell out to `python3` (Pillow), so those need it installed.
- Tests guard documentation, so a change to a class or a number can fail a test that is not about CSS:
  - `package.test.mjs`: every `fam-*` class named in `README.md` must be defined in the built CSS, and the tarball must contain only shipped files (no `tools/`, `tests/`, `textures/`, `docs/`, `references/`, `examples/`).
  - `claims.test.mjs`: the weight numbers quoted in `README.md` and in `showcase/index.html` (`data-claim` attributes) are recomputed from `dist/fam-ui.css` and `assets/`. Update the prose when tile or CSS sizes change.

## Architecture

- `css/` is five layers, bundled in this order: `tokens`, `materials`, `effects`, `components`, `templates` (`LAYERS` in `tools/bundle.mjs`). Tokens hold the `--fam-*` variables and texture URLs, materials are the `fam-<material>` classes, effects are shadows, rounding, gloss and reflections, components are the controls, and templates are the full-page layouts used by `examples/`.
- Textures are real photographs. `textures/` holds the Unsplash source photos (named `<kind>_<photographer>-<id>-unsplash`), `tools/texture-pipeline/*.py` cuts them into seamless tiles, and the results live in `assets/`, which is what ships. CSS refers to them as `../assets/...`, so `assets/` must stay next to the folder that holds the stylesheet. `CREDITS.md` records the source photo and the script and arguments for each asset; update it when adding or reprocessing one.
- The kit loads each texture lazily: a tile is only fetched when a class that uses it is on the page.
- `snippets/` is the only shipped JavaScript: `refraction-round.js` (optional, builds a per-element SVG displacement filter so refracting glass follows its corner radius, exported as `fam-ui/refraction`) and `refraction-filter.html` (the static fallback filter). `tools/make-refraction-map.mjs` generates the map.
- `showcase/` is the documentation site (home, materials, controls, glass, examples) and `examples/` holds the working template pages. Their small scripts (`tabs.js`, `table-grid.js`, `knob.js`, `lens.js`, `field-error.js`, `nav-menu.js`) are demos of behavior the kit deliberately leaves to the consumer. The showcase sets its own text in Lato; the kit loads no fonts.
- Accessibility is a tested requirement, not a goal: contrast is measured on rendered pixels against WCAG AA, and state and focus must also survive forced colors, disabled states and missing `backdrop-filter`. Tests in `contrast`, `focus-contrast`, `forced-colors`, `disabled` and `degrade` enforce this, so check them when adding a control or material.
- `references/` and `docs/superpowers/` are design reference material and plans, not shipped. `.superpowers/` is gitignored.
