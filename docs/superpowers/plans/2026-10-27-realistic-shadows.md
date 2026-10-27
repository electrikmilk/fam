# Realistic shadows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `fam-shadow-sm/md/lg` more natural without making them harsher, and add opt-in cast shadows (`fam-cast-sm/md/lg`) and a flat resting ellipse (`fam-grounded`).

**Architecture:** Shadows are contact-hardening `box-shadow` stacks held in tokens (`css/tokens.css`) and applied by utility classes (`css/effects.css`). The resting ellipse is the element's `::after`. Components that already carry their own shading are not edited: cast and grounded go on a wrapper for them.

**Tech Stack:** Plain CSS, Playwright browser tests run with `node --test`, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-27-realistic-shadows-design.md` (the exact shadow values are under "The recipes" there; copy them verbatim).

## Global Constraints

- Plain CSS in the existing layers. Class names start with `fam-` and variables with `--fam-`. Rebuild with `npm run build`.
- No JavaScript in `css/`, no new images, no new dependencies.
- Light is straight above: every shadow falls straight down.
- Elevation guardrail: new `sm`, `md` and `lg` reach no more than 2px farther and have no more total alpha than today's (today: reach 4, 18, 52 and total alpha .40, .56, .82). Reach is the largest offset plus blur plus spread of any layer.
- Do not change `--fam-shadow-inset`, `fam-shadow-inset`, or the shadows hardcoded in components, materials and templates.
- Do not use `--fam-rest-shadow` or any "rest" name for new variables; it is an existing component variable.
- Add a final newline to every file. Comments explain why only. Commit each task separately, ending the message with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

- An element that already has `position: absolute` or `fixed` and gets `fam-grounded` must keep its position. Task 3 uses `:where(.fam-grounded)` for `position: relative` and tests it.
- An element that forms a stacking context (for example `opacity: .99`) and gets `fam-grounded` must not have its face darkened by the ellipse. Task 3 pins the ellipse to start at the bottom edge and tests the face pixels.
- A component with its own shading (`fam-plastic--round`) inside a wrapper with `fam-cast-md` keeps its own `box-shadow` unchanged. Task 2 tests it.
- `fam-grounded` on an element that clips its own overflow (`fam-pill` has `overflow: hidden` and its own `::after`) shows nothing; the wrapper form must show the ellipse. Task 3 tests the wrapper form.
- Each cast size is longer and darker than the one before. Task 2 tests reach and total alpha.

---

## File structure

- `css/tokens.css`: modify the three elevation tokens, add `--fam-cast-sm/md/lg`.
- `css/effects.css`: add `.fam-cast-*` beside the existing `.fam-shadow-*` rules, and `.fam-grounded` with its `::after`.
- `tests/helpers/shadows.mjs`: new, parses a computed `box-shadow` string for the tests of Tasks 1 and 2.
- `tests/effects.test.mjs`, `tests/fixtures/kit.html`: tests and fixture elements for Tasks 1 to 3.
- `showcase/materials.html`, `showcase/showcase.css`, `tests/showcase.test.mjs`: Task 4.
- `README.md`, `showcase/index.html`: Task 4 (docs and the CSS size claims that `tests/claims.test.mjs` recomputes).

### Task 1: Elevation tokens

**Files:**
- Create: `tests/helpers/shadows.mjs`
- Modify: `css/tokens.css:25-27`, `tests/effects.test.mjs` (after the `shadow utilities differ` test at line 122)

**Interfaces:**
- Produces: `parseBoxShadow(computedBoxShadow: string): ShadowLayer[]` where `ShadowLayer = { alpha: number; offsetY: number; blur: number; spread: number }` (inset layers are ignored); `reachOf(layers: ShadowLayer[]): number`; `totalAlphaOf(layers: ShadowLayer[]): number`. All exported from `tests/helpers/shadows.mjs`. Tasks 2 and 3 import them.

- [ ] **Step 1: Write the failing test** in `tests/effects.test.mjs`: `test('elevation shadows are no longer or darker than the originals', ...)`. Open the kit fixture, read `boxShadow` of `#shadow-sm`, `#shadow-md`, `#shadow-lg` with the file's `style` helper, and for each parse with `parseBoxShadow`. Assert against `TODAY = { sm: { reach: 4, alpha: .40 }, md: { reach: 18, alpha: .56 }, lg: { reach: 52, alpha: .82 } }`: `reachOf(layers) <= TODAY[size].reach + 2` and `totalAlphaOf(layers) <= TODAY[size].alpha + .005`. Also assert the layer counts are exactly 3, 5 and 6 (the old tokens had 2, 3 and 4), so a revert to the old values fails.
  Write `tests/helpers/shadows.mjs` in this step too, so the test can import it: split the computed value on the commas that precede `rgb`, take the alpha from `rgba(...)` (1 when it is `rgb(...)`) and the four lengths after it, and skip layers containing `inset`.
- [ ] **Step 2: Run it to see it fail.** Run: `npm run build && node --test --test-name-pattern="elevation shadows" tests/effects.test.mjs`. Expected: FAIL on the layer counts.
- [ ] **Step 3: Implement the tokens.** In `css/tokens.css` replace the values of `--fam-shadow-sm`, `--fam-shadow-md` and `--fam-shadow-lg` with the spec's elevation recipes, copied verbatim. Leave `--fam-shadow-inset` alone.
- [ ] **Step 4: Run it to see it pass.** Same command. Expected: PASS. Then run `npm run build && node --test tests/effects.test.mjs`. Expected: PASS, including `shadow utilities differ` (still four different values).
- [ ] **Step 5: Commit.** `git add tests/helpers/shadows.mjs tests/effects.test.mjs css/tokens.css` then commit "Make the elevation shadows contact-hardening without making them longer or darker".

### Task 2: Cast shadows

**Files:**
- Modify: `css/tokens.css` (after the elevation tokens), `css/effects.css:123-126`, `tests/fixtures/kit.html:48-51`, `tests/effects.test.mjs`

**Interfaces:**
- Consumes: `parseBoxShadow`, `reachOf`, `totalAlphaOf` from Task 1.
- Produces: tokens `--fam-cast-sm`, `--fam-cast-md`, `--fam-cast-lg`; classes `.fam-cast-sm`, `.fam-cast-md`, `.fam-cast-lg`, each `box-shadow: var(--fam-cast-<size>)`. Fixture ids `#cast-sm`, `#cast-md`, `#cast-lg`, and `#cast-wrapper` (see Step 1).

- [ ] **Step 1: Write the failing tests.**
  - Add to `tests/fixtures/kit.html`, after the `#shadow-inset` line, `#cast-sm`, `#cast-md` and `#cast-lg` (same 60x40 inline style as the shadow ones), and `<span id="cast-wrapper" class="fam-cast-md fam-round-pill" style="display:inline-block; margin:10px"><button id="cast-inner" class="fam-plastic fam-plastic--round" aria-label="Power"></button></span>`. Copy the exact `fam-plastic` markup from an existing round plastic button in the fixture or `README.md`, and keep the `aria-label` pattern it uses.
  - `test('cast shadows get longer and darker with size', ...)`: parse the three computed shadows; assert `reachOf` is exactly 50, 88 and 126 and `totalAlphaOf` is within .005 of 1.40, 1.85 and 2.55, and that both strictly increase from sm to md to lg.
  - `test('a plastic button inside a cast wrapper keeps its own shadow', ...)`: read `#cast-inner` `boxShadow` before and after `document.querySelector('#cast-wrapper').classList.remove('fam-cast-md')`; assert both are equal, and that `#cast-wrapper` has a non-`none` `boxShadow` before the removal.
- [ ] **Step 2: Run them to see them fail.** Run: `npm run build && node --test --test-name-pattern="cast" tests/effects.test.mjs`. Expected: FAIL (`none` is parsed as no layers, so the reach assertion fails).
- [ ] **Step 3: Implement.** Add `--fam-cast-sm`, `--fam-cast-md` and `--fam-cast-lg` to `css/tokens.css` with the spec's cast recipes, copied verbatim. Add the three classes to `css/effects.css` right after `.fam-shadow-lg`. Add a short comment above them saying why they exist as separate classes and that a component that carries its own `box-shadow` needs them on a wrapper with the same radius, because a class replaces `box-shadow` as `fam-shadow-*` does.
- [ ] **Step 4: Run them to see them pass.** `npm run build && node --test tests/effects.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit.** "Add cast shadows in three sizes".

### Task 3: Grounded resting shadow

**Files:**
- Modify: `css/effects.css` (after the cast classes), `tests/fixtures/kit.html`, `tests/effects.test.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks except the fixture file.
- Produces: class `.fam-grounded` and the variables `--fam-grounded-width` (default `88%`), `--fam-grounded-height` (default `8px`) and `--fam-grounded-ink` (default `rgb(0 0 0)`). Fixture ids `#grounded`, `#grounded-stack`, `#grounded-absolute`, `#grounded-wrapper`.

- [ ] **Step 1: Write the failing tests.** Add fixture elements on a plain light backdrop `<div style="background:#ececec; padding:40px">` containing:
  - `#grounded`: `<div class="fam-grounded" style="width:44px; height:44px; border-radius:50%; background:#2f5fc8">`
  - `#grounded-stack`: the same with `opacity:.99` added
  - `#grounded-absolute`: the same with `position:absolute; left:200px; top:0`
  - `#grounded-wrapper`: `<span class="fam-grounded" style="display:inline-block"><span class="fam-pill" style="display:block; width:80px; height:30px"></span></span>`

  Tests, each using the file's `style` helper or `page.evaluate`:
  - `test('the grounded ellipse is out of the way', ...)`: the `::after` of `#grounded` has `pointerEvents: 'none'`, `position: 'absolute'`, `zIndex: '-1'`; the element's bounding rect is the same with and without the class (toggle `classList`); and the ellipse's `::after` box (read `getComputedStyle(..., '::after')` `top`, `height`, `width` against the element's `offsetHeight`/`offsetWidth`) starts no higher than 1px above the element's bottom edge and is narrower than the element.
  - `test('the grounded ellipse shows below the element and leaves its face alone', ...)`: with `statistics` from `tests/helpers/pixels.mjs`, screenshot a 20x4 clip 2px under the bottom of `#grounded`'s center and the same clip at 40px to its left; the first must be at least 25 levels darker (mean of the three channels). Screenshot a clip across the face of `#grounded-stack` with and without the class; the means must match within 3 levels.
  - `test('fam-grounded keeps an existing position', ...)`: `#grounded-absolute` computed `position` is `absolute`; `#grounded` computed `position` is `relative`.
  - `test('fam-grounded on a wrapper shows the ellipse around a pill', ...)`: the same dark-under-the-bottom check on `#grounded-wrapper`'s bottom edge.
- [ ] **Step 2: Run them to see them fail.** `npm run build && node --test --test-name-pattern="grounded" tests/effects.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** in `css/effects.css`: `:where(.fam-grounded)` sets `position: relative` (zero specificity so an element's own positioning wins); `.fam-grounded::after` is an absolutely positioned, `pointer-events: none`, `z-index: -1` ellipse whose `top` is `calc(100% - 1px)`, whose width and height come from the two variables and which is centered horizontally; it is filled with the spec's resting-ellipse `radial-gradient` (stops at 0%, 45% and 72%, alphas .6, .3 and 0) with the color built from `--fam-grounded-ink` using `color-mix(in srgb, var(--fam-grounded-ink) <percent>, transparent)`. Declare the three variables' defaults on `.fam-grounded` so they can be overridden. Add a comment that the ellipse starts at the bottom edge on purpose: an element that makes a stacking context would otherwise paint it over its own face.
- [ ] **Step 4: Run them to see them pass.** `npm run build && node --test tests/effects.test.mjs`. Expected: PASS. If the face-pixel check fails on `#grounded-stack`, the ellipse overlaps the face: fix the geometry, not the test.
- [ ] **Step 5: Commit.** "Add a grounded resting shadow".

### Task 4: Showcase, README and size claims

**Files:**
- Modify: `showcase/materials.html:79-82` and the line after `build your own`, `showcase/showcase.css` (near `.elev`, line 372), `tests/showcase.test.mjs:217-236`, `README.md` (Effects section line 329, line 17), `showcase/index.html:57`

**Interfaces:**
- Consumes: classes from Tasks 2 and 3.
- Produces: nothing later tasks use.

- [ ] **Step 1: Extend the showcase test.** In `build your own shows gloss, rounding and shadow utilities`, also collect the computed `boxShadow` of `.fam-cast-sm`, `.fam-cast-md` and `.fam-cast-lg` in `#scene-build`, and whether `.fam-grounded` exists. Assert none is `none`, that the three differ from each other and from the four existing shadows (a set of 7), and that `.fam-grounded` exists. Run `npm run build && node --test --test-name-pattern="shadow utilities" tests/showcase.test.mjs`. Expected: FAIL.
- [ ] **Step 2: Implement the showcase.** Under the existing `Shadows` row in `showcase/materials.html` add a `Cast shadows` heading and a row of three `.elev` chips (`fam-cast-sm`, `fam-cast-md`, `fam-cast-lg`), and a `Resting on a surface` heading with one `.elev` chip using `fam-grounded`. Add `padding-bottom` to those rows in `showcase/showcase.css` so the long shadows are not clipped by the scene, and check the page at 1440px and 375px wide for clipping. After the `build your own` caption add a copyable caption with a cast wrapper around a `fam-plastic--round` button and a `fam-grounded` wrapper around a `fam-pill`, so both wrapper forms are shown.
- [ ] **Step 3: Document in `README.md`.** Replace the `Shadows` line in the Effects section: elevation shadows (a more natural stack, still soft), cast shadows `fam-cast-sm/md/lg` (longer and darker each step, they need room around the element and are clipped by an ancestor with `overflow: hidden`), and `fam-grounded` with its three variables. State plainly: a class replaces `box-shadow`, so on a component that has its own shading (plastic buttons, metal buttons, the pill, the switch) put the cast class on a wrapper with the same radius; `fam-grounded` uses `::after`, so on an element that already uses it (`fam-pill`, `fam-glossy-button`, `fam-glass`, `fam-wood-frame`, `fam-print-frame`, `fam-stitched`, round and square `fam-plastic`) put it on a wrapper. Follow the README's existing present-tense style, not a changelog.
- [ ] **Step 4: Refresh the size claims.** The CSS grew, so `tests/claims.test.mjs` will fail. Run `npm run build && node --test tests/claims.test.mjs`, then set the CSS KB and gzip KB it expects in `README.md:17` and `showcase/index.html:57`. Expected after: PASS.
- [ ] **Step 5: Run everything.** `npm test`. Expected: all PASS. If the contrast audit or a visual test fails, fix the cause; do not loosen a test. Look at `showcase/materials.html` on the light, felt, wood and brown cardstock scenes and check the cast shadows read progressively darker. If they look weak on a dark one, raise the cast alphas (not the elevation ones), update the exact total-alpha numbers in Task 2's test to match, and tell the owner what changed. Do not add a dark variant.
- [ ] **Step 6: Commit.** "Show and document the cast and grounded shadows".
