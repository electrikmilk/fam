# Controls refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make disabled plastic buttons read as inset, restyle plastic to match `references/plastic.png`, and add metal buttons, button groups, glossy and glass buttons, radios, tabs, a plastic material and a plastic dial, each shown on the Controls page.

**Architecture:** Plain CSS added to the existing layers (`tokens`, `materials`, `effects`, `components`). Every look is a CSS gradient and shadow stack, with `assets/grain-fine.jpg` or the existing metal textures only as a light texture layer. Each task adds its CSS, its fixture elements, its Controls page scene (with a copyable markup block) and its README snippet, so every task leaves the suite green.

**Tech Stack:** Plain CSS (`color-mix()`, `:has()`), Playwright through `node --test`, `python3` for the contrast audit.

**Spec:** `docs/superpowers/specs/2026-10-23-controls-refinements-design.md`. Read it and the images in `references/` named there before starting.

## Global Constraints

- Class names start with `fam-`, custom properties with `--fam-`. No JavaScript in the kit (`css/`). Showcase scripts live in `showcase/`.
- Copy: sentence case headers, no em dashes, spaced hyphens ` - ` instead.
- Keep `.fam-plastic` and its `--red --green --blue --purple --amber --round` modifiers working. Keep `.fam-pill` and `.fam-glass` markup working.
- New tokens go in `css/tokens.css`. Add `--fam-led: #ff6a1f;` (the LED orange, used by plastic and metal groups and radios).
- Disabled plastic and metal buttons use `opacity: .7`, a darkened face that looks sunk into the case, and muted label text. They should read as a button that has not popped up yet, so you cannot press it. Other disabled controls keep `.5`.
- Text contrast is 4.5:1 (3:1 large text and icons) measured on rendered pixels, except disabled text. Every control keeps a focus ring that reaches 3:1 against its surface.
- Add `forced-colors` rules in the existing `@media (forced-colors: active)` block of `css/components.css` for every state that is carried by shadow or gradient (selected tab, checked radio, pressed group cell). Stop transitions and animations under `prefers-reduced-motion: reduce`.
- Run one test file with `npm run build && node --test tests/<file>.mjs`. Run everything with `npm test`, then `npm run audit`.
- Commit after each task, imperative message, ending with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Stage only the files the task changed. `references/` and the untracked `textures/` files are not part of this work.
- Final scene order on `showcase/controls.html`: `scene-buttons`, `scene-glossy-glass`, `scene-radios`, `scene-tabs`, `scene-plastic`, `scene-switch-knob`, `scene-progress`, `scene-glass-fields`, `scene-search-list`, `scene-recessed`. Each task inserts its scene at that position, adds its jump link in `.jump`, and updates the pinned `sections` array in `tests/showcase.test.mjs`.

## Review Focus

- A grouped cell that is both `disabled` and `aria-pressed="true"` still looks inset and keeps its LED dim (Task 4).
- Radios in one `name` group: arrow keys move the selection and exactly one radio is checked (Task 6).
- A disabled tab is skipped by Tab and an `aria-selected` tab is distinguishable in forced colors (Task 7).
- The group's lit state works from `aria-selected` as well as `aria-pressed` (Task 4).
- Groups and tab strips do not overflow a 375px wide screen (Tasks 4, 7).
- LED glow and any transition stop under `prefers-reduced-motion: reduce` (Tasks 4, 6).

## File structure

- `css/tokens.css` - `--fam-led`.
- `css/components.css` - plastic, metal, glossy and glass buttons, group, radios, tabs, dial, disabled and forced-colors rules.
- `css/materials.css` - `.fam-plastic-panel`.
- `tests/controls.test.mjs` (new) - computed-style and keyboard checks for the new controls.
- `tests/fixtures/kit.html` - one element per new control, with ids used by the tests.
- `showcase/controls.html`, `showcase/site.css`, `showcase/tabs.js` (new, demo only) - the scenes.
- `README.md` - markup snippets.

---

### Task 1: Plastic buttons, disabled look and dish

**Files:**
- Modify: `css/components.css` (`.fam-plastic` block near line 196, disabled rule near line 580), `tests/disabled.test.mjs`, `tests/fixtures/kit.html`, `showcase/controls.html`, `README.md`, `tests/showcase.test.mjs`
- Test: `tests/controls.test.mjs`

**Interfaces:**
- Produces: `.fam-plastic--square` (34 by 34, no padding, like `--round` but with `var(--fam-radius-md)` corners); a dish drawn on `::after` for `.fam-plastic--round` and `.fam-plastic--square`; a disabled look for `.fam-plastic:disabled`. Fixture ids `plastic-square`, `plastic-square-disabled`, `plastic-round-disabled`, and `plastic-disabled` (exists).

- [ ] **Step 1: Write the failing tests** in `tests/controls.test.mjs` (open `fixtureUrl('kit')`, helper `read(page, selector, property, pseudo)` using `getComputedStyle(el, pseudo)`):
  - `disabled plastic is inset and a little faded`: for `#plastic-disabled` and `#plastic-round-disabled`, `opacity` is `'0.7'`, every comma-separated `boxShadow` layer (split on `/,\s(?=rgba?\()/`) ends with `inset`, `color` differs from `#plastic-red`'s color, and the label is muted: its alpha, or its contrast with the face, is lower than the enabled button's. Add `disabled plastic is darker than enabled plastic`: screenshot a strip of the face below the label for `#plastic-disabled` and `#plastic-red` (same color class) and assert the disabled strip's mean luminance (use `tests/helpers/pixels.mjs`) is lower.
  - `round and square plastic buttons have a dish`: `::after` `borderRadius` is `'50%'` for `#plastic-square` and `#plastic-purple`, and `::after` `content` is `'none'` for `#plastic-red`.
  - In `tests/disabled.test.mjs`, change the expected opacity for `#plastic-disabled` to `'0.7'` (keep `.5` for the others) and keep the no-sink-when-pressed assertions.

- [ ] **Step 2: Run** `npm run build && node --test tests/controls.test.mjs tests/disabled.test.mjs`. Expected: FAIL (opacity `0.5`, no dish).

- [ ] **Step 3: Implement.** Restyle `.fam-plastic` so the gradient and the shadow stack carry the look (soft top highlight, darker lower edge, a pale lip, a bezel ring as in the round buttons in `plastic.png`), with `grain-fine.jpg` kept at overlay and lowered in strength. Add `.fam-plastic--square`. Draw the dish on `::after`: a circle inset about 5px from the face with an inner shadow darker at the top and a light lip at the bottom, centered behind the label. For `.fam-plastic:disabled` use `opacity: .7`, an all-inset `box-shadow`, no `transform`, a darkened face (the gradient mixed toward black), a muted label color and `text-shadow: 0 1px 0 rgba(255,255,255,.25)` so the text looks sunk, as in `references/97212fd179cf8af7e1c2a11cd5e63e60deaac8ed-3208769525.png`. Remove `.fam-plastic:disabled` from the shared `opacity: .5` rule. Keep the amber dark-label rule and the `:active` rule working.

- [ ] **Step 4: Run** the same command. Expected: PASS. Then run `node --test tests/components.test.mjs tests/focus-contrast.test.mjs`. Expected: PASS.

- [ ] **Step 5: Scene and docs.** Rewrite the `scene-buttons` scene as "Plastic and metal buttons" with the plastic row (five colors, a square and a round with dish, and disabled versions of a pill, a square and a round), its markup block and `.jump` link. Add the plastic square snippet to the README "Plastic buttons and the knob" block. Update `tests/showcase.test.mjs` counts (`roundButtons`, add `squareButtons >= 1`, `disabledControls >= 6`). Open `showcase/controls.html` in Chrome and compare with `references/plastic.png`: the face must read as a gradient with fine texture, not as a photo.

- [ ] **Step 6: Commit** (`Make disabled plastic buttons inset and add the dish`).

---

### Task 2: Metal buttons

**Files:**
- Modify: `css/components.css`, `tests/fixtures/kit.html`, `showcase/controls.html`, `README.md`, `tests/focus-contrast.test.mjs`, `tests/disabled.test.mjs`, `tests/showcase.test.mjs`
- Test: `tests/controls.test.mjs`

**Interfaces:**
- Consumes: Task 1's dish and disabled conventions (same shadow shape, `opacity: .7`).
- Produces: `.fam-metal-button` (pill, label text), `.fam-metal-button--round`, `.fam-metal-button--square`. Metal buttons have no dish (owner's decision). Fixture ids `metal-button`, `metal-button-disabled`, `metal-round`, `metal-square`, `metal-button-on-felt`.

- [ ] **Step 1: Write the failing tests.** `metal buttons use the brushed metal texture`: `backgroundImage` of `#metal-button` includes `metal-brushed.jpg`. `metal buttons have no dish` (`::after` `content` is `none` on the pill, round and square). `disabled metal is inset, darkened and muted` (same assertions as Task 1 for `#metal-button-disabled`, including the darker face and muted label). Add `['metal button on felt', '#metal-button-on-felt', null]` to `tests/focus-contrast.test.mjs` `CONTROLS`, and `#metal-button-disabled` to the opacity and cursor lists in `tests/disabled.test.mjs`.

- [ ] **Step 2: Run** `npm run build && node --test tests/controls.test.mjs tests/disabled.test.mjs tests/focus-contrast.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement** the classes in `css/components.css`, built the way `.fam-switch`'s thumb and the plate in `references/93e7758259b6c1254864bf6614e3f21e-3748576914.png` are: `--fam-tex-metal-brushed` under a soft top-light gradient, a dark rim, a pale top lip, dark label text that passes 4.5:1 on the rendered pixels. Same focus ring, `:active` and disabled treatment as `.fam-plastic`.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Scene and docs.** Add the metal row to `scene-buttons` (pill, round, square, disabled pill) on a `fam-felt` stage so the metal is visible against a different surface, with its markup block. Add a README snippet. Update `tests/showcase.test.mjs` to require `.window .fam-metal-button` count `>= 3`.

- [ ] **Step 6: Commit** (`Add metal buttons`).

---

### Task 3: Glossy and glass buttons

**Files:**
- Modify: `css/components.css` (glossy, glass), `tests/fixtures/kit.html`, `showcase/controls.html`, `showcase/site.css`, `README.md`, `tests/showcase.test.mjs`, `tests/focus-contrast.test.mjs`, `tests/disabled.test.mjs`
- Test: `tests/controls.test.mjs`

**Interfaces:**
- Produces: `.fam-glossy-button` (aqua blue by default, built from the same gradient and sheen as `.fam-pill`; `--fam-gloss` still dials the sheen) and `.fam-glossy-button--silver` (the gray Panther and iTunes look in `references/6uw2l17xk3f61-213512688.jpg` and `references/0522_macosx-1962914377.jpg`). `.fam-glass-button`, used as `<button class="fam-glass fam-glass-button">`. Both have `:focus-visible`, `:active` and `:disabled` looks. Fixture ids `glossy-button`, `glossy-silver`, `glossy-disabled`, `glass-button`, `glass-button-disabled`.

- [ ] **Step 1: Write the failing tests.** `glossy buttons are real buttons with an aqua body`: `#glossy-button` is a `BUTTON`, `backgroundImage` includes `linear-gradient`, `--fam-gloss` is `.28` by default. `glass buttons are frosted`: `::before` `backdropFilter` of `#glass-button` includes `blur`, and `color` is `rgb(255, 255, 255)`. `disabled glossy and glass buttons are dimmed`: `opacity` `0.5`, `cursor` `default`. Add focus-ring rows to `focus-contrast.test.mjs`: `['glossy button on metal', '#glossy-button', null]` and `['glass button on felt', '#glass-button', null]`.

- [ ] **Step 2: Run** `npm run build && node --test tests/controls.test.mjs tests/disabled.test.mjs tests/focus-contrast.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement.** Reuse `.fam-pill`'s gradient values through shared custom properties rather than copying them, and reuse `.fam-glass` for the frosted layers; add only the button resets (font, padding, `cursor`, `:active` press, focus ring). Glass button text must pass 4.5:1 on the felt stage with and without backdrop blur.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Scene and docs.** Add `scene-glossy-glass`: a `fam-metal` stage with glossy blue and silver buttons and a disabled one, a `fam-felt` stage with glass buttons and a disabled one, each with a markup block. Add README snippets and update `tests/showcase.test.mjs` for `.window .fam-glossy-button >= 3` and `.window .fam-glass-button >= 2`. Check against `references/soft-aqua-ui-kit-m7andrew-1624450458.png` in Chrome.

- [ ] **Step 6: Commit** (`Add glossy and glass buttons`).

---

### Task 4: Button groups

**Files:**
- Modify: `css/components.css`, `css/tokens.css`, `tests/fixtures/kit.html`, `showcase/controls.html`, `showcase/site.css`, `README.md`, `tests/showcase.test.mjs`
- Test: `tests/controls.test.mjs`

**Interfaces:**
- Consumes: `.fam-plastic`, `.fam-metal-button`, `.fam-glossy-button`, `.fam-leather-button` and the square dish.
- Produces: `.fam-button-group` (a `role="group"` wrapper with an `aria-label`). Direct children share one case: only the outer corners are rounded, dividers sit between cells, margins are zero. A child is lit when it has `aria-pressed="true"` or `aria-selected="true"` (so the same group is also a tab strip, see Task 7). A lit cell: for square plastic cells the dish shows an LED dot using `--fam-led`; for labeled plastic cells and for all metal cells a small LED dot above the label or icon; for glossy blue cells a darker pressed-in look with no LED; for `.fam-glossy-button--silver` cells the aqua blue of the selected segment in `references/snow-leopard-gui-2079776605.png`; for leather cells the leather navigation bar's look (owner's decision): `.fam-button-group--leather` is a pill of `--fam-tex-leather-fill-tan-tile` and the lit cell is the nav bar's dark pocket with light text. `.fam-leather-button` children are supported by the group. Fixture ids `group-plastic`, `group-metal`, `group-glossy`, `group-pressed` (a pressed plastic square cell), `group-unpressed`, `group-disabled-pressed` (disabled and pressed).

- [ ] **Step 1: Write the failing tests.**
  - `group cells share one case`: in `#group-plastic`, the first child has `borderTopRightRadius` `'0px'` and `borderTopLeftRadius` not `'0px'`; the last child the reverse; the middle child `'0px'` on all four.
  - `a pressed cell shows the LED and an unpressed one does not`: `::after` `backgroundImage` of `#group-pressed` includes `rgb(255, 106, 31)`; `#group-unpressed` does not.
  - `a disabled pressed cell stays inset with a dim LED`: `#group-disabled-pressed` has every `boxShadow` layer ending `inset`, `opacity` `'0.7'`, and its `::after` `backgroundImage` includes `rgb(255, 106, 31)`.
  - `LED glow does not animate under reduced motion`: open the fixture with `reducedMotion: 'reduce'`; `transitionDuration` of `#group-pressed` is `'0s'`.
  - `a group fits a phone`: open at `{ width: 375, height: 800 }`; every `.fam-button-group` has `scrollWidth <= clientWidth`, and the page has no horizontal scroll.

- [ ] **Step 2: Run** `npm run build && node --test tests/controls.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement** the group rules with child selectors on `.fam-button-group > *` (`:first-child`, `:last-child`, `:only-child`). Use `flex-wrap: nowrap` with a `max-width: 100%` and `overflow-x: auto` so a long group scrolls inside itself on a phone. Style the lit state from `[aria-pressed="true"]`, as in the lit cell of `references/plastic.png`. Add the forced-colors rule: a pressed cell gets a `Highlight` outline.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Scene and docs.** Add groups to `scene-buttons`: a leather group on a `fam-leather` stage (put it in `scene-buttons` too), a four-cell plastic strip with one cell pressed (as in `plastic.png`), a metal group, and a three-button glossy silver group on a `fam-metal` bar like iTunes in `references/0522_macosx-1962914377.jpg` (place that one in `scene-glossy-glass`). Each has a markup block. Add the README snippet and the `aria-pressed` note ("set it in your own script"). Update `tests/showcase.test.mjs` for `.window .fam-button-group >= 4`. Add a test that a lit leather cell differs from an unlit one (`#group-leather-lit` and `#group-leather-plain`) and that `aria-selected="true"` lights a cell the same way `aria-pressed="true"` does (`#group-selected`).

- [ ] **Step 6: Commit** (`Add button groups`).

---

### Task 5: Progress tubes on metal

**Files:**
- Modify: `showcase/controls.html`, `showcase/site.css`, `tests/showcase.test.mjs`
- Test: `tests/showcase.test.mjs`

- [ ] **Step 1: Write the failing test** in `tests/showcase.test.mjs`: on the controls page, `#scene-progress .window` has class `fam-metal` and not `fam-felt`.
- [ ] **Step 2: Run** `npm run build && node --test tests/showcase.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** Change the stage and its markup block to `fam-metal`. If the tube track or the candy fill loses definition against metal, adjust `.fam-progress` in `css/components.css` (stronger rim or a lighter bottom lip) and confirm the three fills still read as in the current felt version.
- [ ] **Step 4: Run** the same command, then `node --test tests/contrast.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** (`Show the progress tubes on metal`).

---

### Task 6: Radio buttons

**Files:**
- Modify: `css/components.css`, `tests/fixtures/kit.html`, `showcase/controls.html`, `showcase/site.css`, `README.md`, `tests/showcase.test.mjs`, `tests/focus-contrast.test.mjs`, `tests/disabled.test.mjs`
- Test: `tests/controls.test.mjs`

**Interfaces:**
- Produces: `<label class="fam-radio fam-radio--plastic"><input type="radio" name="x"><span class="fam-radio-dot"></span>Label</label>`, with variants `--plastic`, `--metal`, `--glossy`, `--glass`. The native input is visually hidden but covers the dot (like `.fam-switch`). Plastic and metal checked dots glow with `--fam-led`; glossy and glass checked dots show a plain dot. A disabled input dims the label (`opacity: .5`) and the dot looks inset. Fixture ids: `radio-plastic-on`, `radio-plastic-off`, `radio-metal-on`, `radio-glossy-on`, `radio-glass-on`, `radio-plastic-disabled`, and a second group (`name="speed"`, ids `speed-1`, `speed-2`, `speed-3`) for keyboard tests.

- [ ] **Step 1: Write the failing tests.**
  - `checked plastic and metal radios glow like an LED`: `boxShadow` of `#radio-plastic-on + .fam-radio-dot` and `#radio-metal-on + .fam-radio-dot` includes `255, 106, 31`; the unchecked `#radio-plastic-off + .fam-radio-dot` does not.
  - `checked glossy and glass radios show a dot with no glow`: `::after` of their dots has `content` not `'none'`, and `boxShadow` does not include `255, 106, 31`.
  - `arrow keys move the selection inside one radio group`: focus `#speed-1`, press `ArrowRight`, expect `#speed-2` checked and `#speed-1` not checked; `document.querySelectorAll('input[name=speed]:checked').length` is `1`.
  - `a disabled radio is dimmed and not focusable`: label `opacity` `'0.5'`, `cursor` `'default'`, and after pressing Tab from before the group, focus never lands on `#radio-plastic-disabled`.
  - `the glow stops under reduced motion`: `transitionDuration` `'0s'` on the dot with `reducedMotion: 'reduce'`.
  - Add `['plastic radio on metal', '#radio-plastic-on', '.fam-radio']`-style rows to `focus-contrast.test.mjs` for plastic, metal, glossy (on metal) and glass (on felt) radios. Add `#radio-plastic-disabled` to `disabled.test.mjs`'s cursor check.

- [ ] **Step 2: Run** `npm run build && node --test tests/controls.test.mjs tests/focus-contrast.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement** the four variants, reusing the plastic dish look, the metal button look, the glossy gradient and the glass layers through shared custom properties from Tasks 1 to 3. The checked state must also be clear without color (a dot in the dish or a filled center). Add the forced-colors rule: a checked dot is `Highlight`.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Scene and docs.** Add `scene-radios`: four small stages (plastic and metal on `fam-metal`, glossy on `fam-metal`, glass on `fam-felt`), each with a checked, an unchecked and a disabled radio and a markup block. README snippet. Update `tests/showcase.test.mjs` for `.window .fam-radio >= 12`.

- [ ] **Step 6: Commit** (`Add plastic, metal, glossy and glass radio buttons`).

---

### Task 7: Tabs as button groups

The owner decided tabs are button groups, so tabs add no new component CSS: a tab strip is a `.fam-button-group` whose cells are `role="tab"` buttons of any material.

**Files:**
- Create: `showcase/tabs.js`
- Modify: `tests/fixtures/kit.html`, `showcase/controls.html`, `showcase/site.css`, `README.md`, `tests/showcase.test.mjs`, `tests/focus-contrast.test.mjs`, `tests/contrast.test.mjs`
- Modify `css/components.css` only if a tab strip needs something a button group does not give it (for example the Snow Leopard strip's flat bottom)
- Test: `tests/controls.test.mjs`

**Interfaces:**
- Consumes: Task 4's `.fam-button-group` with `aria-selected="true"` as the lit state.
- Produces: markup `<div class="fam-button-group" role="tablist" aria-label="..."><button class="fam-glossy-button fam-glossy-button--silver" role="tab" aria-selected="true" aria-controls="panel-id">...</button></div>` for glossy silver (the Snow Leopard strip), plastic, metal and leather cells. `showcase/tabs.js` exposes `window.FamShowcase.createTabs(tablist)` which wires click, ArrowLeft, ArrowRight, Home and End on the tabs and toggles each tab's panel (`aria-controls` id, `hidden`). Fixture ids `tabs-silver`, `tab-silver-selected`, `tab-silver-plain`, `tab-silver-disabled`, `tabs-plastic`, `tabs-metal`, `tabs-leather`.

- [ ] **Step 1: Write the failing tests.**
  - `a selected tab differs from the rest in every material`: for the silver, plastic, metal and leather strips, the `aria-selected="true"` cell's `backgroundImage` or `boxShadow` differs from a plain cell's.
  - `a disabled tab is skipped by Tab`: focus the first tab of `#tabs-silver`, press Tab twice; `#tab-silver-disabled` is never `document.activeElement`.
  - `the demo wires arrow keys`: on `showcase/controls.html`, focus the first tab of the silver demo, press `ArrowRight`; the second tab has `aria-selected="true"`, the first `"false"`, and exactly one tabpanel is not `hidden`.
  - `tab strips fit a phone`: at 375px wide each `[role="tablist"]` has `scrollWidth <= clientWidth` or scrolls inside itself, and the page has no horizontal scroll.
  - `a selected tab is marked in forced colors` (Chromium only): the selected tab has an outline or `backgroundColor` that a plain tab does not.
  - Add focus-ring rows for a plastic tab on metal and a leather tab on leather.

- [ ] **Step 2: Run** `npm run build && node --test tests/controls.test.mjs tests/showcase.test.mjs tests/focus-contrast.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement** `tabs.js` as a small standalone script in the IIFE style of `showcase/main.js`. It does not use roving tabindex: every enabled tab stays in the Tab order, as the spec decides. Fix anything the group CSS misses for tabs (selected silver cell is aqua blue, as the Snow Leopard strip).

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Scene and docs.** Add `scene-tabs`: the silver strip on a `fam-paper` window, leather tabs (a `fam-button-group--leather` strip) on `fam-felt`, metal tabs on `fam-metal`, and plastic tabs on a plastic panel stage (use `fam-metal` until Task 8 lands, and switch it to `fam-plastic-panel` there). Each shows a panel under the strip. The markup block notes that arrow keys need a script and points at `tabs.js`. Add the README snippet ("a tab strip is a button group with `role="tablist"`"). Raise `MINIMUM_MEASURED['showcase-controls']` in `tests/contrast.test.mjs` to the number the audit now reports minus 2. Load `tabs.js` in `controls.html`.

- [ ] **Step 6: Commit** (`Add tabs as button groups`).

---

### Task 8: Plastic panel and plastic dial

**Files:**
- Modify: `css/materials.css`, `css/components.css`, `tests/fixtures/kit.html`, `showcase/controls.html`, `showcase/site.css`, `showcase/knob.js` (only if the dial reuses it), `README.md`, `tests/showcase.test.mjs`, `tests/materials.test.mjs`, `tests/focus-contrast.test.mjs`
- Test: `tests/controls.test.mjs`

**Interfaces:**
- Produces: `.fam-plastic-panel` (cream plastic from `plastic.png`: a CSS gradient with `grain-fine.jpg` as light texture, soft top highlight, rounded corners via `fam-round-*`). `.fam-dial`, a `role="img"` span turned by `--fam-knob-angle` (default `35deg`), drawn in CSS: a ridged rim (conic-gradient or repeating gradient), a dished face and an indicator line. Fixture ids `plastic-panel`, `dial`, `dial-low`.

- [ ] **Step 1: Write the failing tests.** `the plastic panel is a textured gradient`: `#plastic-panel` `backgroundImage` includes both `linear-gradient` and `grain-fine.jpg`. `the dial turns with --fam-knob-angle`: `customProperty(page, '#dial', '--fam-knob-angle')` is `'35deg'`, and the computed `transform` of `#dial::after` (the indicator) differs between `#dial` and `#dial-low` (`--fam-knob-angle: -100deg`). `the dial is labeled`: `role` is `img` and `aria-label` is not empty. Add `['plastic button on the plastic panel', '#plastic-on-panel', null]` to the focus-contrast list.

- [ ] **Step 2: Run** `npm run build && node --test tests/controls.test.mjs tests/focus-contrast.test.mjs tests/materials.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement.** The panel follows the top-left case of `references/plastic.png`; the dial follows the ridged knob and the cream dial there. Check that plastic buttons, the dish and white labels stay legible on the panel. No new image files unless the ridges cannot be done in CSS.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Scene and docs.** Add `scene-plastic` on a `fam-plastic-panel` stage: the dial at three angles, plastic buttons, a plastic group and a plastic radio, with a markup block. Switch the plastic tab stage in `scene-tabs` to `fam-plastic-panel`. Add `fam-plastic-panel` to the README materials list and the plastic dial to its controls. Update `tests/showcase.test.mjs` for `.window .fam-dial >= 3` and `.window .fam-plastic-panel >= 1`, and the `fam-plastic-panel` entry in the "build your own" line of `showcase/materials.html` if the materials test lists classes.

- [ ] **Step 6: Commit** (`Add a plastic panel and a plastic dial`).

---

### Task 9: Whole-suite pass and docs

**Files:**
- Modify: `README.md`, `showcase/index.html`, `showcase/controls.html`, `showcase/site.css`, `tests/contrast.test.mjs`, `tests/showcase.test.mjs`, any test that fails

- [ ] **Step 1: Run** `npm test`. Expected: the only failures are the weight claims in `tests/claims.test.mjs` (the CSS grew).
- [ ] **Step 2: Update the quoted numbers** in `README.md` and the `data-claim` elements of `showcase/index.html` for `css` and `css-gzip` to the values `claims.test.mjs` expects (its assertion messages print them). Update the README's Controls bullet and the Controls page `<meta name="description">` and lead to list every control now on the page.
- [ ] **Step 3: Run** `npm test` and `npm run audit`. Expected: all pass with no contrast failures at 1440 and 375px.
- [ ] **Step 4: Look at it.** Open `showcase/controls.html` in Chrome at 1440 and 375px wide and compare each scene with its reference image. Fix anything that does not match the spec's goals list; list what you could not match in the final message.
- [ ] **Step 5: Run** `FAM_BROWSER=firefox npm test` and `FAM_BROWSER=webkit npm test` if those engines are installed. Expected: the same pass state the README already claims.
- [ ] **Step 6: Commit** (`Update the README and the quoted weights for the new controls`).
