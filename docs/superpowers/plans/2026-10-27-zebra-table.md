# Zebra table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed-height, scrolling table with a sticky header, zebra rows and placeholder stripes below the last row, plus an optional selected-row state, shown on the Controls page with a showcase-only script for arrow keys.

**Architecture:** One scrolling box (`fam-table-box`) draws every stripe once with a repeating gradient that scrolls with its content (`background-attachment: local`), and the table's rows are transparent, so real rows and placeholder stripes are the same gradient and cannot drift. A see-through "ink" color drives stripes and dividers, and one modifier flips it for dark materials. Selection is styled by `aria-selected` only; the kit ships no JavaScript.

**Tech Stack:** Plain CSS in `css/components.css`, Node test runner with Playwright (`tests/`), static showcase pages in `showcase/`.

**Spec:** `docs/superpowers/specs/2026-10-27-zebra-table-design.md`

## Global Constraints

- Plain CSS in the existing layers; classes start `fam-`, variables start `--fam-`. No JavaScript in `css/`, no new dependencies, no new images.
- Defaults from the mockups: `--fam-row-height` 24px; dark ink `rgb(60, 40, 10)` with stripe strength about .09; light ink `rgb(255, 235, 200)`.
- Rows are one fixed-height line; cell text that does not fit is cut with an ellipsis.
- Semantics: a real `<table>` when read-only; `role="grid"` with `aria-selected="true"` on the selected `<tr>` when selectable. Never `role="listbox"`. Placeholder stripes are a background with no semantics.
- WCAG AA: 4.5:1 text contrast at the worst pixel, measured by the existing audit at 1440px and 375px wide; visible focus ring; forced-colors uses `Highlight` and `HighlightText` for the selected row.
- New lines at the end of every file. Commit after each task, imperative message, ending with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Run one test file with `npm run test:only -- tests/<file>.test.mjs` (it rebuilds `dist/` first).

## Review Focus

- A table with no rows: the box still shows the header and full placeholder stripes. (Task 1)
- A cell with text far longer than its column: one line, ellipsis, row height unchanged. (Task 1)
- `--fam-row-height: 40px`: rows, header and placeholder stripes stay aligned. (Task 1)
- 375px wide with columns that need more room: the box scrolls sideways, the page does not, and the header stays on top. (Task 1)
- Keyboard focus on a row just under the sticky header: scrolling must not leave it hidden behind the header. (Task 4)

## Decisions the plan makes beyond the spec

- **Header is opaque.** No CSS-only way was found to keep scrolled rows from showing through a translucent sticky header, so this is the spec's stated fallback: the header band is a solid color, `--fam-table-header`, set by each ink mode (the material's grain is lost in the header only). Stripes and dividers stay see-through.
- **Names.** Box `fam-table-box`, table `fam-table`, modifier `fam-table-box--light-ink`. Variables: `--fam-row-height`, `--fam-table-rows`, `--fam-table-ink`, `--fam-table-stripe`, `--fam-table-header`. Read each with a `var(--name, default)` fallback, as `--fam-cardstock-tint` is.
- **Focus.** A read-only box has `tabindex="0"` and `role="region"` with an `aria-label`. In a selectable grid the rows are the tab stops (one at a time, roving `tabindex`), so the box has no `tabindex`.
- **Script.** `showcase/table-grid.js` exposes `window.FamShowcase.createTableGrid(grid: HTMLTableElement): void` and wires every `table[role="grid"][data-table-grid]`, like `tabs.js`. Single-select; selection follows focus.

## File Structure

- Modify `css/components.css`: the table, after the `fam-list-row` rules and before the disabled-controls block, plus its entries in the forced-colors block at the end.
- Modify `tests/fixtures/kit.html`: table markup for the layout, focus and forced-colors tests.
- Create `tests/zebra-table.test.mjs`: layout, stripes, ink and forced-colors tests on the fixture.
- Modify `tests/focus-contrast.test.mjs`: add the box and a selected-grid row to `CONTROLS`.
- Modify `showcase/controls.html`, `showcase/site.css`: the scene, its jump link and its stage rule.
- Create `showcase/table-grid.js`; test it in `tests/controls.test.mjs`.
- Modify `tests/showcase.test.mjs`, `tests/contrast.test.mjs`: scene list and measured minimum.
- Modify `README.md`, `showcase/index.html`: docs and the CSS-size claims.

---

### Task 1: Box, stripes, sticky header

**Files:**
- Modify: `css/components.css`, `tests/fixtures/kit.html`
- Create: `tests/zebra-table.test.mjs`

**Interfaces:**
- Produces: markup `div.fam-table-box[role=region][aria-label][tabindex=0] > table.fam-table[aria-label] > (thead > tr > th[scope=col]) + (tbody > tr > td)`; columns sized by `<col style="width:...">`. Variables `--fam-row-height`, `--fam-table-rows`, `--fam-table-ink`, `--fam-table-stripe`, `--fam-table-header` (all optional, set on the box or an ancestor).
- Produces fixture ids: `#zebra-box` (12 rows, 3 columns, `--fam-table-rows: 6`, on `.fam-paper`), `#zebra-empty` (box with a header and no rows), `#zebra-long` (one cell with 200 characters), `#zebra-tall` (`style="--fam-row-height:40px"`, 12 rows), `#zebra-wide` (4 columns of `<col style="width:240px">`).

- [ ] **Step 1: Add the fixture markup** to `tests/fixtures/kit.html`, in a `<section id="zebra" class="fam-paper" style="padding:20px; margin-top:24px; width:360px">` after `#paper-components`, with the five boxes above.

- [ ] **Step 2: Write the failing tests** in `tests/zebra-table.test.mjs` (open `fixtureUrl('kit')`, use `statistics` from `./helpers/pixels.mjs`):
  - `the box is the header plus --fam-table-rows rows tall`: `#zebra-box` `clientHeight` is `7 * 24`; `#zebra-tall` is `(8) * 40`.
  - `every row and the header are exactly one row height`: all `#zebra-box thead tr` and `tbody tr` heights are 24; in `#zebra-tall` they are 40; `#zebra-long` rows are still 24 (one line).
  - `the header stays put while the rows scroll`: set `#zebra-box` `scrollTop = 72`; `thead th` top equals the box's content top, and `scrollHeight > clientHeight`.
  - `placeholder stripes continue the pattern of the real rows`: in `#zebra-empty` and in `#zebra-box` scrolled to the bottom, screenshot a 4px-wide strip at the box's left edge for consecutive rows; adjacent rows differ in mean brightness and rows two apart match. In `#zebra-tall` the same holds at 40px.
  - `an empty table still shows stripes below its header`: `#zebra-empty` has `clientHeight` of `7 * 24` and its first two rows below the header differ in brightness.
  - `a wide table scrolls inside its box on a phone`: at 375px wide, `#zebra-wide` `scrollWidth > clientWidth`, `document.documentElement.scrollWidth <= 375`, and after `scrollLeft = 100` the header cells are still at the box's top.

- [ ] **Step 3: Run `npm run test:only -- tests/zebra-table.test.mjs`.** Expected: FAIL (no `fam-table` rules exist).

- [ ] **Step 4: Implement the CSS** in `css/components.css` under a `/* ---------- Zebra table ---------- */` heading. Decisions to follow:
  - `.fam-table-box`: `overflow: auto`; height is `(rows + 1)` row heights (default 8 rows) measured as `clientHeight`; `scroll-padding-top: var(--fam-row-height, 24px)` so a focused row never hides under the header; a hairline inset edge like `.fam-search`; background is only the stripes: `repeating-linear-gradient(to bottom, transparent 0 h, stripe h 2h)` positioned `0 h` with `background-attachment: local`, where stripe is `color-mix(in srgb, var(--fam-table-ink, rgb(60, 40, 10)) calc(var(--fam-table-stripe, .09) * 100%), transparent)`.
  - `.fam-table`: `width: 100%`, `table-layout: fixed`, `border-collapse: separate`, `border-spacing: 0`; `th` and `td` use `height: var(--fam-row-height, 24px)`, `box-sizing: border-box`, `padding: 0 8px`, `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`; rows transparent; dividers are a `border-left` in the ink at about .22 strength between cells (not on the first); `th` is `position: sticky; top: 0`, background `var(--fam-table-header, #e4dccb)`, a bottom rule in the ink, normal weight, dark ink text (`#2e2415`); body text `#1d1d21`. The font is `var(--fam-font-ui)` at 12px.

- [ ] **Step 5: Run the tests again.** Expected: PASS. Look at the fixture in the browser once if a test is unclear.

- [ ] **Step 6: Commit** `css/components.css`, `tests/fixtures/kit.html`, `tests/zebra-table.test.mjs`: "Add a scrolling zebra table with a sticky header and placeholder stripes".

---

### Task 2: Light ink, selected row, focus, forced colors

**Files:**
- Modify: `css/components.css`, `tests/fixtures/kit.html`, `tests/zebra-table.test.mjs`, `tests/focus-contrast.test.mjs`

**Interfaces:**
- Consumes: Task 1 markup and variables.
- Produces: `.fam-table-box--light-ink` (sets light ink `rgb(255, 235, 200)`, `--fam-table-header` default `#3a2412`, text `#f6ecd8`); `.fam-table tr[aria-selected="true"]` styling; fixture ids `#zebra-light` (light-ink box on `<div class="fam-cardstock" style="--fam-cardstock-tint:#562a0e">`), `#zebra-grid` (`<table class="fam-table" role="grid" aria-label="...">` whose second row is `#zebra-grid-selected` with `aria-selected="true"` and others `aria-selected="false"`, rows `tabindex="-1"` except the selected one `0`, box without `tabindex`), `#zebra-grid-plain` (an unselected row of `#zebra-grid`).

- [ ] **Step 1: Add the fixture markup** for those ids.

- [ ] **Step 2: Write the failing tests:**
  - `light ink gives light text and a dark header`: computed `color` of a `#zebra-light td` has mean channel above 200; its `th` `backgroundColor` mean channel below 80; `#zebra-box`'s are the reverse.
  - `a selected row is blue and an unselected one is not` (computed `backgroundImage` of `#zebra-grid-selected td` contains `gradient`; `#zebra-grid-plain td` does not).
  - In `tests/zebra-table.test.mjs`, with `forcedColors: 'active'` (skip unless Chromium, like `tests/forced-colors.test.mjs`): `#zebra-grid-selected td` `backgroundColor` differs from `#zebra-grid-plain td`, and `#zebra-box` has a non-`none` `borderTopStyle`.
  - In `tests/focus-contrast.test.mjs`, add `['zebra box on paper', '#zebra-box', null]` and `['zebra grid row on paper', '#zebra-grid-plain', null]` to `CONTROLS` (the existing loop focuses the control and checks the ring; make the row focusable in the fixture).

- [ ] **Step 3: Run** `npm run test:only -- tests/zebra-table.test.mjs tests/focus-contrast.test.mjs`. Expected: the new tests FAIL.

- [ ] **Step 4: Implement the CSS.** Light ink: set `--fam-table-ink` and the header and text colors from the modifier, using the same variable fallbacks so a consumer's own `--fam-table-ink` still wins. Selected row: the `fam-list-row` blue gradient, white text with the same text shadow; unselected hover is not styled. Focus: `:focus-visible` on the box draws the kit's two-tone ring (`var(--fam-focus-halo)` plus `var(--fam-focus-ink)`) outside the box; on a row, an inset 2px outline in `#1b1b20`, white on a selected row (as `fam-list-row` does). Forced colors, in the existing block: selected row `Highlight` background with `HighlightText`, text-shadow none; the box `border: 1px solid CanvasText`; header bottom rule and column dividers `CanvasText`.

- [ ] **Step 5: Run the tests again.** Expected: PASS.

- [ ] **Step 6: Commit:** "Add light ink, a selected row, focus rings and forced colors to the zebra table".

---

### Task 3: Showcase scene

**Files:**
- Modify: `showcase/controls.html`, `showcase/site.css`, `tests/showcase.test.mjs`, `tests/contrast.test.mjs`

**Interfaces:**
- Consumes: Tasks 1 and 2 classes and markup.
- Produces: `section.scene#scene-zebra-tables` directly after `#scene-search-list`, with the jump link "Zebra tables" in the same position, and demos `#zebra-paper` (read-only, on `fam-paper`), `#zebra-cardstock` (selectable grid with `data-table-grid`, on `fam-cardstock`), `#zebra-brown` (light ink, on `fam-cardstock` with `--fam-cardstock-tint:#562a0e`).

- [ ] **Step 1: Update `tests/showcase.test.mjs` line 447** so the controls scene list has `'scene-zebra-tables'` after `'scene-search-list'`. Run `npm run test:only -- tests/showcase.test.mjs` and watch that test FAIL.

- [ ] **Step 2: Add the scene** in `.window controls-stage` boxes with `scene-title`, `scene-lead` (what the three demos show, the row-height variable, and that arrow keys come from `table-grid.js`) and `code-block`s with a copy button, matching the neighbouring scenes. The showcase test requires every `fam-` class named in the code blocks to appear in the demo and the reverse, so keep them in step. Give the demos 12 rows of plausible file or detail data, `--fam-table-rows: 6`, and `<col>` widths. Add `#scene-zebra-tables .controls-stage { display: block; padding: 20px; }` beside the other stage rules in `showcase/site.css`.

- [ ] **Step 3: Run** `npm run test:only -- tests/showcase.test.mjs`. Expected: PASS.

- [ ] **Step 4: Measure contrast.** Run `npm run test:contrast`. Fix any failure by tuning the ink, stripe strength, header or text colors in `css/components.css` (the spec allows it) and say what changed in the commit message. Then raise `MINIMUM_MEASURED['showcase-controls']` in `tests/contrast.test.mjs` by the number of newly measured text items (header cells plus the visible row cells; read the measured count from `runAudit('showcase-controls')`).

- [ ] **Step 5: Commit:** "Show zebra tables on the Controls page".

---

### Task 4: Showcase keyboard script

**Files:**
- Create: `showcase/table-grid.js`
- Modify: `showcase/controls.html` (add `<script src="table-grid.js"></script>` next to `tabs.js`), `tests/controls.test.mjs`

**Interfaces:**
- Consumes: `#zebra-cardstock` from Task 3 and the `aria-selected` styling from Task 2.
- Produces: `window.FamShowcase.createTableGrid(grid)`; selection behavior below.

- [ ] **Step 1: Write the failing tests** in `tests/controls.test.mjs` (open `showcasePageUrl('controls')`):
  - `clicking a zebra row selects only that row`: exactly one `aria-selected="true"`, and it is the clicked row.
  - `arrow keys move the selection and Home and End jump`: focus the selected row; `ArrowDown` selects and focuses the next; `ArrowUp` goes back and stops at the first row without wrapping; `End` selects the last row; `Home` the first.
  - `only one zebra row is in the Tab order`: exactly one row has `tabindex="0"` and it is the selected one.
  - `a row focused with the keyboard is not hidden under the sticky header` (Review Focus): press `End`, then `Home`; the focused row's top is at or below the header's bottom after each.

- [ ] **Step 2: Run** `npm run test:only -- tests/controls.test.mjs`. Expected: the new tests FAIL.

- [ ] **Step 3: Implement** `window.FamShowcase.createTableGrid(grid: HTMLTableElement): void` in `showcase/table-grid.js`, in the style of `tabs.js` (an `window.FamShowcase` object, `Array.prototype` helpers, a header comment saying what it wires). On load it sets `aria-selected` to `"true"` or `"false"` on every body row, roving `tabindex` on rows, and wires click, ArrowUp, ArrowDown, Home and End on the grid. Then it wires `table[role="grid"][data-table-grid]` at the bottom of the file.

- [ ] **Step 4: Run the tests again.** Expected: PASS.

- [ ] **Step 5: Commit:** "Add a showcase script for zebra table row selection".

---

### Task 5: Docs and size claims

**Files:**
- Modify: `README.md`, `showcase/index.html`

- [ ] **Step 1: Document in `README.md`:** add a "Zebra table" entry to the Components section after the list-row markup, with the markup for a read-only table and a selectable grid, the variables and what each does, the light-ink modifier, that rows must be one line (so give long text another way to be read), that the consumer sets column widths with `<col>`, that the box is keyboard-scrollable, and that arrow-key behavior is not in the kit (`showcase/table-grid.js` is a model, following the ARIA grid pattern). Add "zebra tables" to the Controls bullet in the Showcase section.

- [ ] **Step 2: Run `npm test`.** Expected: everything passes except possibly the two weight-claim tests in `tests/claims.test.mjs`, because `dist/fam-ui.css` grew. If they fail, copy the reported CSS size and gzip numbers into `README.md` line 17 and the `data-claim="css"` and `data-claim="css-gzip"` elements in `showcase/index.html`. Run `npm test` again. Expected: all pass.

- [ ] **Step 3: Commit:** "Document zebra tables and refresh the CSS size claims".

---

## Self-review

- **Spec coverage:** fixed-height scrolling box and sticky header (T1); stripes, placeholders and variables (T1); ink, light ink (T1, T2); selection (T2, T4); accessibility: region, focus, forced colors, contrast (T1, T2, T3); showcase scene (T3); showcase-only script (T4); README (T5); tests and fixtures (T1 to T4). Not built, as the spec says: sorting, resizing, multi-select, wrapping rows, `listbox`.
- **Spec change to check:** the header is opaque (see Decisions), which is the spec's own stated fallback, and the read-only box gets `tabindex="0"` while a selectable grid does not.
- **Types and names** match across tasks: `createTableGrid`, `data-table-grid`, `#zebra-*` ids, and the variable names.
