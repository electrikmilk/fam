# More materials and variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sandblasted metal, pebbled and brown leather, paneled wood, linen, cardboard (two variants), denim and paper bag to the kit, each with a navigation bar, plus engraved text where it suits and sandblasted metal buttons.

**Architecture:** Each material is a seamless tile cut from a photo in `textures/` by a script in `tools/texture-pipeline/`, exposed as a `--fam-tex-*` token in `css/tokens.css`, a class in `css/materials.css`, and a `.fam-nav.<class>` rule in `css/components.css`. The showcase Materials page (`showcase/materials.html`) shows each one, and the existing Playwright tests and contrast audit are the gate. One commit per material.

**Tech Stack:** Plain CSS, Python 3 with Pillow for textures, Node `node:test` with `playwright-core` for tests.

**Spec:** `docs/superpowers/specs/2026-10-23-more-materials-design.md`

## Global Constraints

- `fam-metal` and `fam-metal-button` keep their names and are the brushed metal. Call the current metal "brushed metal" in the showcase captions and README prose only.
- No new JavaScript. New work meets WCAG AA contrast on rendered pixels at 1440px and 375px, shows a focus ring, and keeps the forced-colors and reduced-motion rules that `.fam-nav` already carries.
- Tiles never stretch and a material you do not use is never downloaded. Tile files should stay between 13 KB and 85 KB; a tile that needs more goes over, and `CREDITS.md` says why.
- The paneled wood tile must show no bolt or nail. If a planks crop cannot tile without a visible seam or repeat, drop paneled wood, tell the owner, and ship no substitute.
- Class names: `fam-metal-sandblasted`, `fam-metal-button--sandblasted`, `fam-leather-pebbled` (modifiers `--black`, `--brown`), `fam-leather-frame--brown`, `fam-leather-bar--brown`, `fam-wood-paneled`, `fam-linen`, `fam-cardboard` (modifier `--chipboard`), `fam-denim`, `fam-paper-bag`. Asset names: `<material>-tile.jpg`.
- Linen and denim take their own tint variable, like `--fam-cardstock-tint`: `--fam-linen-tint` (default a natural linen) and `--fam-denim-tint` (default indigo). One shared `--fam-tint` cannot have two defaults. Cardboard and paper bag keep their photo colors.
- Source photos are already in `textures/`. Credit each in `CREDITS.md` with the photographer (the name inside the file name) and the exact command that made the asset.
- Commit messages are imperative, one commit per material, and end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Do not `git add` the untracked `references/` or `textures/` photos unrelated to the task.
- Files end with a newline. Comments say why, never what. Follow the surrounding CSS style.

## Per-material checklist

Every material task runs these in order. The task lists only what is specific to it.

1. **Failing tests first.** Add the new asset names to `ASSET_NAMES` (and to `TILED_NAMES` if it is a seamless tile) in `tests/assets.test.mjs`. Add a `<div id="<material>" class="sample <class>">` to `tests/fixtures/kit.html` and its id to the list in `materials load their textures` in `tests/materials.test.mjs`. Run `node --test tests/assets.test.mjs tests/materials.test.mjs`; expect FAIL (missing assets, no texture).
2. **Cut the tile.** Use `tools/texture-pipeline/make_tile.py SOURCE OUTPUT CROP_FRACTION SIZE FLATTEN_RADIUS [ROTATE_DEGREES]`, then `to_tint_tile.py SRC OUT` for tinted materials. Write outputs to `assets/`. Look at the tile (Read the image) and at a 3x3 repeat of it before keeping it.
3. **Token and class.** Add `--fam-tex-<name>` to `css/tokens.css` and the class to `css/materials.css`, with a comment only where a number needs its why.
4. **Navigation bar.** Add `.fam-nav.<class>` rules to `css/components.css` beside the metal and leather bars. Light surfaces copy `.fam-nav.fam-metal` (dark ink, light lip, dark pocket with light label for `aria-current="page"`). Dark surfaces copy `.fam-leather-bar--black` (light ink, dark lip). Set `.fam-nav-item:focus-visible { outline-color }` to the ink color.
5. **Showcase.** In `showcase/materials.html` add a swatch to the "Textures" `.swatches` list (figcaption is the class name), a nav bar to `#scene-navs` and to its markup note, and the class to the "build your own" `<code class="copyable">` list. In `tests/showcase.test.mjs` raise the expected swatch count (`squares.length`, currently 10) by one and add the class to `textures`.
6. **Docs.** Add the class to the README "Materials" list and the nav sentence; add the `CREDITS.md` row. If the asset ends in `-tile.jpg`, run `node --test tests/claims.test.mjs` and, if it fails, update the quoted `tile-min` and `tile-max` numbers in `showcase/index.html` and `README.md`.
7. **Verify.** Run `npm run test:fast`, then `npm run test:contrast`. Expect all PASS. Open `showcase/materials.html` in a browser and look at the swatch and nav bar at 1440px and 375px wide.
8. **Commit** the tile, scripts, CSS, showcase, tests and docs together.

## Review Focus

1. A custom linen or denim tint that is very dark or very light still renders as that background color (Tasks 5 and 7 assert it).
2. The brown 9-slice frame keeps rounded corners and a stitched edge like the tan and black ones (Task 3 asserts its `border-image-source`).
3. A disabled sandblasted button still reads as disabled: dimmed and dark, like the brushed one (Task 1 extends the disabled test).
4. A long navigation bar at 375px scrolls inside itself and keeps contrast on every new material (the contrast audit already runs at 375px).
5. An engraved class on a material it was not made for fails contrast, so only the pairings in the showcase are supported (Tasks 1, 3 and 4 add each pairing to the audited page).

---

### Task 1: Sandblasted metal

**Files:**
- Create: `assets/metal-sandblasted-tile.jpg` from `textures/metal_katie-harp-TnQE5X48FMA-unsplash.jpg` (a grain photo, so start with `make_tile.py ... 0.4 512 0`)
- Modify: `css/tokens.css`, `css/materials.css`, `css/components.css`, `css/effects.css`, `showcase/materials.html`, `showcase/controls.html`, `tests/` files named in the checklist, `README.md`, `CREDITS.md`
- Test: `tests/controls.test.mjs`, `tests/disabled.test.mjs`, `tests/focus-contrast.test.mjs`

**Interfaces:**
- Produces: `--fam-tex-metal-sandblasted`; classes `fam-metal-sandblasted` and `fam-metal-button--sandblasted` (used together with `fam-metal-button`); optional `fam-engraved-sandblasted`.

- [ ] **Step 1:** Do checklist step 1 with id `metal-sandblasted`. In `tests/controls.test.mjs` add `metal sandblasted buttons are made from the sandblasted tile`, asserting `#metal-button-sandblasted` has `backgroundImage` containing `metal-sandblasted-tile.jpg`, modeled on `metal buttons are made from the brushed metal texture`. In `tests/disabled.test.mjs` add `#metal-button-sandblasted-disabled` to the selector lists that already hold `#metal-button-disabled`. In `tests/focus-contrast.test.mjs` add `['sandblasted metal button', '#metal-button-sandblasted', null]`. Run them; expect FAIL.
- [ ] **Step 2:** Do checklist steps 2 and 3. The material is the tile under the same top-light gradient `.fam-metal` uses. Rename nothing.
- [ ] **Step 3:** Add `.fam-metal-button--sandblasted` in `css/components.css` right after `.fam-metal-button:disabled`. It overrides only `background` for rest and for `:disabled` (the tile in place of `var(--fam-tex-metal-brushed)`, same gradients). Groups, LED, round and square variants already select `.fam-metal-button`, so they work unchanged.
- [ ] **Step 4:** Do checklist step 4 for `.fam-nav.fam-metal-sandblasted`, copying `.fam-nav.fam-metal`. Do step 5; also add to `showcase/controls.html` next to the brushed buttons: `#metal-button-sandblasted`, `#metal-button-sandblasted-disabled`, and a sandblasted round button, each with a markup line in the code block. Relabel the brushed captions "brushed metal" in showcase and README prose.
- [ ] **Step 5:** In `#scene-engraved` add a `fam-metal-sandblasted` panel with `fam-engraved-metal`. If the contrast audit fails for it, add `.fam-engraved-sandblasted` to `css/effects.css` with a color fitted to the tile and use that.
- [ ] **Step 6:** Do checklist steps 6 to 8. Commit message: `Add sandblasted metal with a navigation bar and buttons`.

### Task 2: Pebbled leather

**Files:**
- Modify: `css/materials.css`, `css/components.css`, `showcase/materials.html`, tests per checklist, `README.md`
- No new asset: reuse `leather-fill-tan-tile.jpg` and `leather-fill-black-tile.jpg`. Add no `CREDITS.md` row.

**Interfaces:**
- Produces: `fam-leather-pebbled` (tan) and `fam-leather-pebbled--black`, flat surfaces with no stitched edge. Task 3 adds `--brown` to them.

- [ ] **Step 1:** Do checklist step 1 with ids `pebbled-tan` and `pebbled-black`. Extend the materials test to assert `#pebbled-tan` uses `leather-fill-tan-tile.jpg` and `#pebbled-black` uses `leather-fill-black-tile.jpg`. Expect FAIL.
- [ ] **Step 2:** In `css/materials.css` define the classes with `background: var(--fam-tex-leather-fill-tan-tile) 0 0 / 168px 51.5px repeat` (black likewise), the sizes `.fam-leather-bar` uses.
- [ ] **Step 3:** Checklist step 4: `.fam-nav.fam-leather-pebbled` takes the tan leather bar's text and pocket rules without the bottom padding for stitches; `--black` takes `.fam-leather-bar--black`'s. Reuse those rules by adding the new selectors to them rather than duplicating declarations. Engraved text: `fam-engraved-leather` on tan; add a black pebbled panel to `#scene-engraved` only if a light engraved class from Task 3 exists, otherwise skip it.
- [ ] **Step 4:** Checklist steps 5 to 8. Commit message: `Add pebbled leather from the leather frame's fill`.

### Task 3: Brown leather

**Files:**
- Create: `tools/texture-pipeline/brown_leather.py`, `assets/leather-fill-brown-tile.jpg`, `assets/leather-frame-brown-soft.png`, `assets/leather-bar-edge-brown.png`
- Modify: the files named in the checklist plus `css/effects.css`, `tests/frames.test.mjs` or `tests/materials.test.mjs`

**Interfaces:**
- Produces: `fam-leather-pebbled--brown`, `fam-leather-frame--brown`, `fam-leather-bar--brown`, and a light engraved class `fam-engraved-leather-dark` for dark leathers (used by Task 2's black panel if added).

The black frame and fill are neutral gray (fill mean is about 45,45,45), the tan ones come from `tan_leather.py`'s gradient map, and the original frame recipe's arguments are not recorded. So brown is a gradient map of the existing black assets, not a re-cut of the photo.

- [ ] **Step 1:** Add the three assets to `ASSET_NAMES`, extend the materials test to assert `#frame-brown` has `border-image-source` containing `leather-frame-brown-soft.png`, `#bar-brown` has both `leather-bar-edge-brown.png` and `leather-fill-brown-tile.jpg`, and `#pebbled-brown` has the brown fill. Add the fixture elements. Expect FAIL.
- [ ] **Step 2:** Write `brown_leather.py FRAME_BLACK_PNG FILL_BLACK_JPG OUT_DIR` modeled on `tan_leather.py`: same luminance-keyed gradient map with dark brown stops (body about 74,48,28, highlights about 128,92,58), keep the black frame's own alpha unchanged (it is already feathered), and tone-match the fill to the band like `tan_leather.py` does. Then run `make_bar_edge.py leather-frame-brown-soft.png leather-bar-edge-brown.png 68 50`.
- [ ] **Step 2b:** Look at the frame, the bar edge and the fill beside their tan versions. Keep the stitched version only if the stitches are visible and the fill meets the band without a visible edge. If not, make the leather plain: drop the frame and bar assets and the two stitched classes, and cut `leather-fill-brown-tile.jpg` from `textures/leather-bound_jayanth-muppaneni-m5o4dOHAibM-unsplash.jpg` darkened to dark brown, avoiding its stitch line. Tell the owner which route shipped and why.
- [ ] **Step 3:** CSS: `.fam-leather-frame--brown`, `.fam-leather-bar--brown` copy the black rules with the brown assets; `.fam-nav.fam-leather-bar--brown` and `.fam-nav.fam-leather-pebbled--brown` join the black bar's light-ink rules. `.fam-engraved-leather-dark` in `css/effects.css`: light glyph fitted to the tile, with a dark lip; add brown and black pebbled panels to `#scene-engraved`.
- [ ] **Step 4:** Add `Photo frames` swatch `fam-leather-frame--brown` to the showcase, checklist steps 5 to 8. Commit message: `Add dark brown leather with a stitched frame and bar`.

### Task 4: Paneled wood

**Files:**
- Create: `assets/wood-paneled-tile.jpg` from `textures/wood-planks_ekaterina-novitskaya-KugwNl9jX1Q-unsplash.jpg`
- Modify: files named in the checklist plus `css/effects.css`

**Interfaces:**
- Produces: `fam-wood-paneled`, `.fam-engraved-wood-paneled`

- [ ] **Step 1:** Checklist step 1 with id `wood-paneled`. Expect FAIL.
- [ ] **Step 2:** Cut the tile from a crop that avoids every bolt and nail, with the plank seams vertical and the repeat period an exact multiple of the plank spacing so the seams line up. Add a check to the checklist's look step: no nail visible in a 3x3 repeat.
- [ ] **Step 3:** The surface is dark, so the nav bar and a light engraved class `.fam-engraved-wood-paneled` take light ink, fitted to the tile pixels. Add a `fam-wood-paneled` panel to `#scene-engraved`.
- [ ] **Step 4:** Checklist steps 3 to 8. Commit message: `Add paneled wood with a navigation bar`.

### Task 5: Linen

**Files:**
- Create: `assets/linen-tile.jpg` from `textures/linen_logan-voss-sFGj4Lj1un8-unsplash.jpg` (clear weave), baked to grayscale with `to_tint_tile.py`
- Modify: files named in the checklist

**Interfaces:**
- Produces: `fam-linen` reading `--fam-linen-tint`

- [ ] **Step 1:** Checklist step 1 with id `linen`, plus a test `linen takes its tint` setting `--fam-linen-tint:#000` and then `#fff` on `#linen` and asserting `backgroundColor` is `rgb(0, 0, 0)` and `rgb(255, 255, 255)`. Expect FAIL.
- [ ] **Step 2:** Checklist steps 2 and 3. Class shape follows `.fam-felt`: `background-color: var(--fam-linen-tint, <natural linen>)`, the tile, `background-blend-mode: multiply`. Pick the natural linen color so the default looks like the photo.
- [ ] **Step 3:** Checklist steps 4 to 8, with a light nav on the default tint. Add a tinted row (three tints) under the "Felt in any color" heading's pattern only if it fits the page. Commit message: `Add linen that takes a tint`.

### Task 6: Cardboard

**Files:**
- Create: `assets/cardboard-tile.jpg` from `textures/cardboard_kiwihug-bPaRBSuvRPA-unsplash.jpg` (ridged linerboard) and `assets/chipboard-tile.jpg` from `textures/cardboard2_heather-green-lWn2RU57iKU-unsplash.jpg` (flecked)
- Modify: files named in the checklist

**Interfaces:**
- Produces: `fam-cardboard`, `fam-cardboard--chipboard`

- [ ] **Step 1:** Checklist step 1 with ids `cardboard` and `cardboard-chipboard`. Expect FAIL.
- [ ] **Step 2:** Cut both tiles. Keep ridges running one direction. If one photo does not make a good tile, ship only the other and tell the owner.
- [ ] **Step 3:** Checklist steps 3 to 8. Brown mid-tone surfaces: choose ink by contrast audit result. Commit message: `Add cardboard in two variants`.

### Task 7: Denim

**Files:**
- Create: `assets/denim-tile.jpg` from `textures/denim_mike-hindle-Js5Qi_X1qzo-unsplash.jpg`, baked to grayscale with `to_tint_tile.py`
- Modify: files named in the checklist

**Interfaces:**
- Produces: `fam-denim` reading `--fam-denim-tint` (default indigo)

- [ ] **Step 1:** Checklist step 1 with id `denim` plus a `denim takes its tint` test like Task 5's. Expect FAIL.
- [ ] **Step 2:** The photo is a dark gray twill, so `to_tint_tile.py`'s 1.5 brightness bake may be too dark under an indigo multiply. Compare and, if needed, add a different brightness argument by writing a second small script instead of a mode flag. Keep the twill diagonal visible.
- [ ] **Step 3:** Checklist steps 3 to 8, with a dark-surface nav. Commit message: `Add denim that takes a tint`.

### Task 8: Paper bag

**Files:**
- Create: `assets/paper-bag-tile.jpg` from `textures/paper-bag_heather-green-xr_ra5j9wPI-unsplash.jpg`
- Modify: files named in the checklist

**Interfaces:**
- Produces: `fam-paper-bag`

- [ ] **Step 1:** Checklist step 1 with id `paper-bag`. Expect FAIL.
- [ ] **Step 2:** Cut a crop that excludes the photo's fold shadow at the bottom edge. Checklist steps 3 to 8. Commit message: `Add paper bag`.

### Task 9: Page copy and final check

**Files:**
- Modify: `showcase/materials.html` lead text, `README.md` intro line 3 and "Materials" section, `showcase/index.html`

- [ ] **Step 1:** Update the Materials page lead, the README intro list of materials, and the home page text so each names the new materials. Do not add content the design does not state.
- [ ] **Step 2:** Run `npm test`. Expect all PASS, including the `claims` test.
- [ ] **Step 3:** Commit: `Describe the new materials on the home page and in the README`.
