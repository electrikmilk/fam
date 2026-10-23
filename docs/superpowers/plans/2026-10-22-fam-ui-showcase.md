# fam-ui showcase implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page fam-ui showcase in `showcase/` and publish it to GitHub Pages from the repo.

**Architecture:** A static page (plain HTML, one stylesheet, a few classic scripts) links the package's real `dist/fam-ui.css` and `assets/`. A small Node script assembles a repo-shaped site folder (`showcase/`, `dist/`, `assets/` plus a root redirect) that a GitHub Actions workflow builds and publishes. The kit gets two new blur variables so the page's Blur knob drives something the package exposes.

**Tech stack:** HTML, CSS, vanilla JavaScript (classic scripts), Node 26 (`node:test`, Playwright with installed Chrome, already set up), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-22-fam-ui-showcase-design.md`. **Look reference:** `docs/superpowers/reference/showcase-mockup.html` (open it after `npm run build`). The kit's design is `docs/superpowers/specs/2026-10-22-fam-ui-design.md`.

## Global constraints

- Plain static HTML, CSS and JavaScript. No framework and no build step for the page itself (`npm run build` only builds the kit's `dist/`). The kit and the npm package stay free of required JavaScript.
- The page links the real `../dist/fam-ui.css` and `../assets/`. It carries no copies of them. Every URL in the page is relative (the site is served under `/fam/`, so no URL may start with `/`).
- Scripts are classic scripts, not ES modules: the tests load the page from `file://`, where browsers block module scripts.
- Core content (hero, scenes, captions, class names, the glass section in its default state) must be in the HTML and visible with JavaScript off. JavaScript only adds behavior: the lens following the cursor, the knobs, the switch, copy buttons.
- Every class named in a caption must exist in `dist/fam-ui.css`.
- WCAG AA contrast on rendered pixels (the kit's audit) at 1440px and 375px: normal text 4.5:1, large text (24px, or 18.66px bold) 3:1. The collector skips text inside `<header>`, `[aria-hidden="true"]` and `svg`, so real text never goes there.
- Knobs on the page are real controls: `role="slider"`, keyboard-operable, announced with a value. The lens itself is decorative (`aria-hidden="true"`).
- Single column at phone width. Respect `prefers-reduced-motion`.
- Credit every photo on the page. Refraction works in Chromium only and the page says so.
- Page copy and docs: sentence-case headings, no em dashes (use a spaced hyphen). CSS comments only for WHY.
- Commits are imperative, one per task, with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review focus

The spec is silent on these. Each has a test in the named task.

1. JavaScript off or failing: the page still shows every scene and caption (Tasks 3, 4, 6).
2. Clipboard API missing or blocked: no dead "Copy" buttons appear (Task 5).
3. Keyboard-only use: the knobs and the switch are reachable, show focus, and announce their value (Task 6).
4. Touch: dragging the lens or a knob must not trap the page's vertical scroll (Task 6).
5. Published under a sub-path (`/fam/`): no absolute URLs in the page, its stylesheet or its scripts (Task 8).

## File structure

- `showcase/index.html` - the whole page.
- `showcase/showcase.css` - page-only styling (dark page, framed windows, captions, glass band). Kit classes do all material work.
- `showcase/copy.js`, `showcase/knob.js`, `showcase/lens.js`, `showcase/main.js` - small classic scripts loaded in that order.
- `showcase/images/ribbon.jpg`, `showcase/images/tree.jpg` - the two photos.
- `tools/build-site.mjs` - assembles the publishable folder. `.github/workflows/pages.yml` - builds and deploys it.
- Tests: `tests/showcase.test.mjs`, `tests/showcase-glass.test.mjs`, `tests/site.test.mjs`; additions to `tests/effects.test.mjs`, `tests/contrast.test.mjs`, `tests/helpers/browser.mjs`.

---

### Task 1: Kit blur variables

**Files:**
- Modify: `css/effects.css`, `tests/effects.test.mjs`, `tests/fixtures/kit.html`, `README.md`

**Interfaces:**
- Produces: on `.fam-glass`, `--fam-glass-blur` (default `14px`, the lens blur) and `--fam-refract-blur` (default `1px`, the refracting variant's blur). The `blur(14px)` in `.fam-glass::before` and `blur(1px)` in both `.fam-glass--refract::before` declarations read them.

- [ ] **Step 1: Write the failing tests** in `tests/effects.test.mjs`. `glass blur is a variable`: a `#glass-blurred` kit sample with `--fam-glass-blur: 20px` computes a `::before` `backdropFilter` containing `blur(20px)`, while `#glass` still has `blur(14px)`. `refraction blur is a variable`: a `#refract-blurred` sample with `--fam-refract-blur: 6px` contains `blur(6px)`, and `#glass-refract` still contains `blur(1px)`. Add the two samples to `tests/fixtures/kit.html`.
- [ ] **Step 2: Run** `node --test tests/effects.test.mjs`. Expected: the two new tests FAIL (the values stay 14px and 1px).
- [ ] **Step 3: Implement** the two variables with those defaults in the `.fam-glass` rule and use them in the three `blur()` calls. Add both names to the README's glass paragraph (the README test checks every variable it names exists in the CSS).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Add blur variables to the glass effect`.

### Task 2: Page shell, photos and opening screen

**Files:**
- Create: `showcase/index.html`, `showcase/showcase.css`, `showcase/images/ribbon.jpg`, `showcase/images/tree.jpg`, `tests/showcase.test.mjs`
- Modify: `tests/helpers/browser.mjs`, `CREDITS.md`

**Interfaces:**
- Produces in `tests/helpers/browser.mjs`: `showcaseUrl: string` (file URL of `showcase/index.html`) and a new `openUrl` option `javaScriptEnabled?: boolean` (default `true`, passed to `newContext`).
- Produces page structure the later tasks extend: `<body><div class="fam"><main>` holding, in order, `section.hero#hero`, then scene sections with ids `scene-wood-felt`, `scene-legal-leather`, `scene-leather-paper`, `scene-metal`, `scene-frames`, `scene-engraved`, `scene-build`, then `section#glass`, then `footer#credits`. Scene sections look like `<section class="scene" id="..."><div class="window ...">...</div><p class="cap"><b>label</b> <code>fam-class fam-class</code></p></section>`. Use `<footer>`, never `<header>`.
- Produces the inline refraction snippet (the exact text of `snippets/refraction-filter.html`) at the top of `<body>`.

- [ ] **Step 1: Write the failing tests** in `tests/showcase.test.mjs` (open `showcaseUrl`):
  - `loads cleanly`: `issues` is empty; ribbon and tree images are each 300 KB or less; total image bytes 3 MB or less (my budget: the page uses every texture).
  - `opening screen`: `#hero h1` text is `Fam`; the tagline text is `Familiar materials for the web`; both computed `fontFamily` start with `Georgia`; the hero element has a computed `borderImageSource` containing `leather-frame-tan-soft.png`.
  - `credits`: `#credits` text contains `boliviainteligente` and `mehrab-sium` and has a link whose `href` ends with `CREDITS.md`.
  - `no em dashes`: the page's `textContent` contains no em dash (U+2014, written as `\u2014` in the test).
  - `carries the current refraction snippet`: the page source contains `snippets/refraction-filter.html`'s trimmed text (as `tests/templates.test.mjs` does).
  - `has no horizontal scroll at phone width` at 375px, using `OFFENDERS_SOURCE` from `tests/helpers/layout.mjs` against `main`.
- [ ] **Step 2: Run** `node --test tests/showcase.test.mjs`. Expected: FAIL, the page does not exist.
- [ ] **Step 3: Implement.** Add `showcaseUrl` and `javaScriptEnabled` to the helper. Create `showcase/images/ribbon.jpg` with `magick references/boliviainteligente-fQkSoZD0A3o-unsplash.jpg -resize 2000x -quality 80 showcase/images/ribbon.jpg` (the original stays uncommitted, as the owner wants) and copy `examples/tree.jpg`. Build `index.html` (head with viewport meta, `<title>fam-ui showcase`, link `../dist/fam-ui.css`, `showcase.css`; the snippet; the hero from the mockup: a `fam-leather-frame` filling the first screen with `fam-engraved-leather` text, "Fam" at about 96px and the tagline at about 24px in `Georgia, "Times New Roman", serif`, plus the "scroll" cue; empty `scene-*` sections are added in later tasks; the `#credits` footer with the two photo credits, a link to `https://github.com/electrikmilk/fam/blob/main/CREDITS.md` and a link to the repository `https://github.com/electrikmilk/fam`). `showcase.css` holds the dark page (`#1d1f24`), the centered `.fam` column (about 780px at desktop), `.window` frames and `.cap` captions as in the mockup, and a single column below 600px. Add the two photo lines to `CREDITS.md`.
- [ ] **Step 4: Run** `node --test tests/showcase.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Add the showcase page shell and opening screen`.

### Task 3: The scenes

**Files:**
- Modify: `showcase/index.html`, `showcase/showcase.css`, `tests/showcase.test.mjs`

**Interfaces:**
- Consumes: the scene section ids and caption shape from Task 2.
- Produces: the six scene sections filled with kit markup copied from the mockup, in this order: `scene-wood-felt` (a `fam-felt` window with `fam-nav fam-wood`, a glass field, a switch and a candy cane `fam-progress`), `scene-legal-leather` (a `fam-legal-pad` in `fam-leather-frame fam-leather-frame--black`), `scene-leather-paper` (a `fam-paper` list inside `fam-leather-frame`, one row `aria-current="true"`), `scene-metal` (plastic buttons, a `fam-knob` and a switch on `fam-metal`), `scene-frames` (the four photo frames around `images/tree.jpg`, then a `fam-cork` board in a `fam-wood-frame`), `scene-engraved` (three panels with `fam-engraved-metal`, `-leather`, `-wood`). Each caption's `<code>` lists the classes that scene uses.

- [ ] **Step 1: Write the failing tests** in `tests/showcase.test.mjs`:
  - `has the six scenes in order`: the ids of `section.scene` elements, in document order, are the six above (plus `scene-build` after them once Task 4 lands, so assert the first six).
  - `every class in a caption exists in the kit`: collect every `fam-[a-z0-9-]+` word from all `.cap code` elements and assert each appears as `.<name>` in `dist/fam-ui.css`, and that at least 25 distinct classes are named.
  - `captions match the markup`: for each scene, every class in its caption is used by some element inside that scene's `.window`.
  - `works with JavaScript off`: open with `javaScriptEnabled: false`; every scene's `.window` has a nonzero height and each caption is visible.
  - `scenes use the dark page and framed windows`: each `.window` has a computed `borderRadius` of `14px`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement** the six scenes. Reuse markup from `examples/components.html`, `examples/notes.html`, `examples/sign-in.html`, `examples/frames.html` and the mockup rather than writing new component markup. Photo `alt` text describes the photo ("A lone tree on a green hill under a cloudy sky"); decorative materials get no alt. Use `<a>` links and `<button>`s only where the kit's markup does, with `href="#"` kept out (use `<span>` for non-navigating nav items if needed so keyboard users do not tab through dead links).
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `Add the paired scenes, photo frames and engraved text to the showcase`.

### Task 4: Build your own

**Files:**
- Modify: `showcase/index.html`, `showcase/showcase.css`, `tests/showcase.test.mjs`

**Interfaces:**
- Produces: `section.scene#scene-build` holding one framed panel with: a `.swatches` grid of ten squares (`fam-felt`, `fam-wood`, `fam-metal`, `fam-leather`, `fam-paper`, `fam-cork`, natural `fam-cardstock`, tinted `fam-cardstock` with `style="--fam-cardstock-tint:#562a0e"`, `fam-legal-pad`, `fam-leather-frame`) each with a class label; a row of five felt tints (`#1f7a3d`, `#1d4fa8`, `#8a1f2b`, `#6b3fa0`, `#c7a23a`) set with `--fam-tint`; a light stage with gloss (`fam-pill` with `fam-gloss-none|soft|strong`), rounding (`fam-round-sm|md|lg|pill`) and shadows (`fam-shadow-sm|md|lg|inset`) examples. The panel's caption is `<code>` text listing `fam-felt fam-wood fam-metal fam-leather fam-paper fam-cork fam-cardstock fam-legal-pad fam-leather-frame fam-pill fam-gloss-soft fam-round-md fam-shadow-md`.

- [ ] **Step 1: Write the failing tests:** `build your own shows every texture`: `#scene-build .swatches` has 10 squares and five felt tints with five distinct computed `backgroundColor`s; the labels under the squares name exactly the classes used on them (each label's class appears on its square); `gloss rounding and shadow examples exist`: elements for the three gloss classes, four round classes and four shadow classes are present and the four shadows compute distinct non-`none` `boxShadow`s; `works with JavaScript off` still passes for `scene-build`. Extend the existing "every class in a caption exists" test, which already covers it.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** from the mockup's utilities section.
- [ ] **Step 4: Run** `node --test tests/showcase.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Add the build-your-own utilities section to the showcase`.

### Task 5: Copy buttons

**Files:**
- Create: `showcase/copy.js`
- Modify: `showcase/index.html`, `showcase/showcase.css`, `tests/showcase.test.mjs`

**Interfaces:**
- Produces: `copy.js` (a classic script, loaded at the end of `<body>`) adds a `<button type="button" class="copy">Copy</button>` after every `code.copyable` when `navigator.clipboard?.writeText` exists. Clicking copies that element's `textContent` and sets the button text to `Copied` for 1500 ms (with `aria-live="polite"` on the button). With no clipboard API it adds nothing. Every scene caption `<code>` gets `class="copyable"` in the HTML.

- [ ] **Step 1: Write the failing tests:** `adds a copy button to each caption` (Chrome context with `permissions: ['clipboard-read', 'clipboard-write']`: clicking the first button puts that caption's text on the clipboard, read back with `navigator.clipboard.readText()`, and the button reads `Copied` and then `Copy` again); `adds no buttons without the clipboard API` (use `page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined }); })` before load; assert zero `.copy` buttons). The browser helper needs a `permissions` option for the first test.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `copy.js` and the button styling (small pill, readable on the dark page, visible focus ring per the kit's standard).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Add copy buttons to the showcase captions`.

### Task 6: The glass band

**Files:**
- Create: `showcase/knob.js`, `showcase/lens.js`, `showcase/main.js`, `tests/showcase-glass.test.mjs`
- Modify: `showcase/index.html`, `showcase/showcase.css`

**Interfaces:**
- Consumes: Task 1's variables, Task 5's `copyable` convention.
- Produces the static default state (visible with JavaScript off): `section#glass` full bleed on `images/ribbon.jpg` over `#0d1116`, 520px tall; `#lens` (`<div id="lens" class="fam-glass fam-glass--refract" aria-hidden="true" style="--fam-r: 90px; --fam-glow-depth: 18px; --fam-refract-blur: 1px">` 180px across); a metal tray (`fam-metal`) with three knobs `<div id="knob-blur|knob-glow|knob-radius" class="fam-knob" role="slider" tabindex="0" aria-label="Blur|Glow|Radius" aria-valuemin aria-valuemax aria-valuenow aria-valuetext>` with engraved labels, and `<label class="fam-switch"><input id="refract-switch" type="checkbox" role="switch" checked aria-label="Refract"></label>` labelled "Refract"; `<code id="readout" class="copyable">` holding the one-line markup; and a plain note: `Refraction shows in Chromium browsers. Elsewhere the lens is clear glass.` Defaults: Blur `aria-valuenow` 1 (range 0 to 30, the refracting default), Glow 18 (0 to 40), Radius 90 (0 to 90).
- Produces `knob.js`: `FamShowcase.createKnob(element: HTMLElement, onChange: (value: number) => void): { value: number }` (a getter and setter). Mapping: the tick angle is `-135 + 270 * (value - min) / (max - min)` degrees, written to the element's `--fam-knob-angle`, with `aria-valuenow` and `aria-valuetext` (`"<value>px"`) updated. Keyboard: Arrow Up and Right add 1, Arrow Down and Left subtract 1, Page Up and Down add and subtract 5, Home and End go to the min and max. Pointer: while pressed, the value follows the pointer's absolute angle around the knob's center, clamped to the sweep. The knob sets `touch-action: none`.
- Produces `lens.js` and `main.js`: `main.js` wires the three knobs and the switch to `#lens`. Knob changes write `--fam-r`, `--fam-glow-depth` and the blur variable of the active mode (`--fam-refract-blur` when `#refract-switch` is checked, else `--fam-glass-blur`) on `#lens`'s inline style, then rewrite `#readout`. The switch toggles `fam-glass--refract` on `#lens`; Blur keeps a value per mode (frosted 14, refracting 1) and the Blur knob shows the active mode's value. `lens.js` moves `#lens` to follow the pointer over `#glass` (`pointermove`, one `requestAnimationFrame` per frame, `transform: translate`); `#glass` has `touch-action: pan-y` so vertical scrolling keeps working.
- Readout text for the defaults, exactly: `<div class="fam-glass fam-glass--refract" style="--fam-r: 90px; --fam-glow-depth: 18px; --fam-refract-blur: 1px"></div>` (frosted drops `fam-glass--refract` and uses `--fam-glass-blur`).

- [ ] **Step 1: Write the failing tests** in `tests/showcase-glass.test.mjs`:
  - `default state is in the HTML`: with JavaScript off, `#lens` exists with `fam-glass--refract`, the three knobs carry the default values above, the readout equals the exact default text, and the Chromium note is present.
  - `knobs are sliders`: each knob has `role="slider"`, `tabindex="0"`, an `aria-label` and `aria-valuetext`; computed `touchAction` of a knob is `none` and of `#glass` is `pan-y`.
  - `keyboard turns a knob`: focus `#knob-glow`; `ArrowUp` x3 gives `aria-valuenow` 21 and the lens's inline `--fam-glow-depth` `21px`; `Home` gives 0; `End` gives 40; the readout contains the new value. Same for Blur and Radius at their limits (Blur 0 to 30, Radius 0 to 90). The tick's `--fam-knob-angle` is `-135deg` at the minimum and `135deg` at the maximum.
  - `dragging a knob turns it`: a mouse down on the top of `#knob-radius` and a move to its right edge (clockwise) increases `aria-valuenow`.
  - `the switch changes the glass mode`: unchecking `#refract-switch` removes `fam-glass--refract` from `#lens`, shows Blur at 14, writes `--fam-glass-blur` into the readout; checking it back restores Blur 1 and `--fam-refract-blur`.
  - `the lens follows the pointer`: moving the mouse to two points over `#glass` moves `#lens`'s bounding box center to within 6px of each (after a frame).
  - `the switch and knobs show focus`: tabbing to the switch and a knob gives a visible indicator (reuse the `drawsOutline` check from `tests/components.test.mjs`'s approach, or the pixel-change helper in `tests/helpers/pixels.mjs`).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the markup, styles (tray over the lower part of the band, engraved labels at the class's 20px, note on a solid chip so it reads over the photo) and the three scripts (`knob.js`, `lens.js`, `main.js`), loaded after `copy.js`.
- [ ] **Step 4: Run** `node --test tests/showcase-glass.test.mjs tests/showcase.test.mjs`. Expected: PASS.
- [ ] **Step 5: Verify visually** at 1440 and 375 wide against the mockup: the lens is a clear circle over the ribbon with a visible rim, the knobs sit on the metal tray, and nothing overlaps at phone width. Take screenshots and look at them.
- [ ] **Step 6: Commit** `Add the interactive glass section to the showcase`.

### Task 7: Contrast audit on the showcase

**Files:**
- Modify: `tools/contrast-audit.mjs`, `tests/contrast.test.mjs`, `showcase/*` (fixes)

**Interfaces:**
- Consumes: `showcaseUrl` (Task 2). `runAudit(pageName: string, options?: { width?: number })` keeps its signature; the name `showcase` now selects `showcaseUrl` and any other name still selects `exampleUrl(name)`. The CLI's page list gains `showcase`.

- [ ] **Step 1: Write the failing test:** add `showcase` to `MINIMUM_MEASURED` in `tests/contrast.test.mjs` with a floor of `1` for now; the existing loop then runs it at 1440 and 375.
- [ ] **Step 2: Run** `node --test tests/contrast.test.mjs`. Expected: FAIL (the name `showcase` has no example page).
- [ ] **Step 3: Implement** the audit change, run `npm run audit` and read the failures. Fix each in the page (for example text over the bright ribbon moves onto a solid chip or the tray; never loosen a threshold, never exempt an item). Then set the `showcase` floor to about two thirds of the measured count.
- [ ] **Step 4: Run** `npm test`. Expected: PASS with zero failures on the showcase at both widths.
- [ ] **Step 5: Commit** `Run the contrast audit on the showcase`.

### Task 8: Site assembly and the Pages workflow

**Files:**
- Create: `tools/build-site.mjs`, `.github/workflows/pages.yml`, `tests/site.test.mjs`
- Modify: `package.json`, `.gitignore`, `README.md`

**Interfaces:**
- Produces `tools/build-site.mjs`: `buildSite(outputDirectory: string): Promise<string>` (resolves with the folder it wrote). It copies `showcase/` to `<out>/showcase/`, `dist/` to `<out>/dist/` and `assets/` to `<out>/assets/`, and writes `<out>/index.html`, a page that redirects to `showcase/` (a `<meta http-equiv="refresh" content="0; url=showcase/">` and a link). Run as a script it writes `_site/`. `package.json` gets `"site": "npm run build && node tools/build-site.mjs"`. `_site/` goes in `.gitignore`.
- Produces `.github/workflows/pages.yml`.

- [ ] **Step 1: Write the failing tests** in `tests/site.test.mjs`:
  - `the assembled site works from its own folder`: `buildSite` into a temp directory; open `<tmp>/showcase/index.html` by file URL; `issues` is empty and a `.fam-felt` element's computed `backgroundImage` contains `/assets/felt-gray-tile.jpg` under the temp directory.
  - `the site root redirects to the showcase`: `<tmp>/index.html` contains `url=showcase/`.
  - `the site holds only what the page needs`: the output's top level is exactly `assets`, `dist`, `index.html`, `showcase`.
  - `no absolute URLs`: in `showcase/index.html`, `showcase.css` and the four scripts, no `src="/`, `href="/`, `url(/` or `fetch('/`.
  - `the workflow publishes the built site`: `.github/workflows/pages.yml` exists and contains `npm run site`, `actions/upload-pages-artifact`, `actions/deploy-pages`, `pages: write`, `id-token: write`, `contents: read`, `github-pages`, and a `push` trigger on `main`.
- [ ] **Step 2: Run** `node --test tests/site.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** Write `build-site.mjs`. Write the workflow: triggers `push` to `main` and `workflow_dispatch`; top-level `permissions` of `contents: read`, `pages: write`, `id-token: write`; `concurrency` group `pages` with `cancel-in-progress: false`; a `build` job (checkout, setup-node with Node 22, `npm ci`, `npm run site`, configure-pages, upload-pages-artifact with `path: _site`) and a `deploy` job (`needs: build`, `environment: name: github-pages, url: ${{ steps.deployment.outputs.page_url }}`, deploy-pages with `id: deployment`). Look up the current major version of each official action with `gh release view --repo actions/<name> --json tagName` and pin to it. The deploy does not run the test suite (it needs Chrome, Pillow and ImageMagick); say so in a comment. Add a short "Showcase" section to the README: the live URL `https://electrikmilk.github.io/fam/`, and how to run it locally (`npm run build`, then open `showcase/index.html`).
- [ ] **Step 4: Run** `npm test` and `npm run site`. Expected: PASS and a `_site/` folder you can open.
- [ ] **Step 5: Commit** `Build the showcase for GitHub Pages`.

---

## After the plan: the owner's steps

These touch GitHub and are not part of any task above:

1. Push `main` to `origin` (`https://github.com/electrikmilk/fam.git`).
2. In the repository's Settings, Pages, set the source to GitHub Actions. The workflow then publishes on every push to `main`, at `https://electrikmilk.github.io/fam/`.

## Self-review

- **Spec coverage:** opening screen, serif engraved text and photo credit (Task 2); four paired scenes, photo frames and cork, engraved text (Task 3); build-your-own with cork, tinted cardstock, gloss, rounding, shadows (Task 4); copy-to-clipboard (Task 5); glass band, lens, knobs, switch, readout, Chromium note, the kit's blur variables (Tasks 1 and 6); contrast standard (Task 7); repo location and Pages (Task 8); no JavaScript for core content and real kit classes only (Tasks 3, 4, 6).
- **Decisions made here, not in the spec:** classic scripts instead of modules; the root `index.html` redirect and a repo-shaped site folder; copy buttons added by script after `code.copyable`; Node 22 in the workflow and no test run in the deploy; a 3 MB image budget; per-mode Blur values; `touch-action` choices; keeping the lens visible in its default position with JavaScript off.
- **Names used across tasks:** `showcaseUrl`, `openUrl` options `javaScriptEnabled` and `permissions`, scene ids, `#lens`, `#knob-blur|glow|radius`, `#refract-switch`, `#readout`, `code.copyable`, `FamShowcase.createKnob`, `buildSite`, `npm run site`.
