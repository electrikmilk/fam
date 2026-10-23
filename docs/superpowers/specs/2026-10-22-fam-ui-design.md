# fam-ui design

Date: 2026-10-22
Status: draft for approval, then planning

A plain-CSS npm package for building skeuomorphic user interfaces in the style of Mac OS X Aqua and iOS before version 7: metal, glass, frosted glass, leather, wood, felt, paper and plastic. A visual prototype exists and settled most of the look, so this document records what was decided and what is left to the builder.

## Reference material

Everything below was worked out against a working prototype. Treat it as the specification of the look.

- `docs/superpowers/reference/demo-reference.html` - the final prototype page. Open it in Chrome. It contains the felt controls screen, the glass and refraction tests, a "glass cursor" test area, engraved text, the notes app template, the sign-in card template, plastic controls, the rounding comparison, and the shadow and gloss utilities.
- `docs/superpowers/reference/demo-assets/` - the processed texture files the prototype uses.
- `tools/texture-pipeline/` - the scripts that produced those textures. `tools/contrast-audit/` - the contrast audit.
- `references/` - the user's reference screenshots (Snow Leopard GUI, Soft Aqua UI kit, iOS 4 Notes, Find My Friends leather, plastic controls, iBooks wood shelf, an AI-generated "Tasks" leather UI).
- `textures/` - the user's source photos. These are large, so they are inputs to a build step and never shipped.

## Intent and why

The owner wants a beautiful, familiar-feeling UI kit that recreates the tactile Aqua and pre-iOS 7 look, with real materials, and that people can use in two ways: take a pre-built template as is, or assemble their own UI from the same effects and components. Some elements may be flat, but most buttons and controls should read as metal, glass (including frosted) or plastic, or blend into a textured background.

## Goals

- One unified set: tokens and materials, effect utilities, components, then templates built only from those parts.
- Plain CSS that works by linking a stylesheet. No build step for the people using the package.
- Real materials from the owner's textures: leather, wood and metal for navigation and frames, felt and other textures as backgrounds, applied through a CSS class.
- Easy, standardized recoloring of textures (the felt that arrives orange is shown green).
- Glass that matches the `~/shiny` demo, extended with a mild refraction effect where the browser supports it.
- Natural, realistic rounding, and realistic shadows and gloss as utilities.
- Accessible by default: WCAG AA contrast measured on the real rendered pixels.
- Later, not version 1: a demo page that shows every texture, control and effect in one place. `demo-reference.html` is a starting point, since it already shows most of them.

## Non-goals

- A JavaScript framework, component library or any required JavaScript.
- A build step, preprocessor or tool required of consumers.
- Reproducing the "paper tucked into the fold" details of the iOS 4 Notes reference (torn paper edges, the leather corner flap).
- Replicating every reference image. They guide the look.

## Anti-goals (a failure even if it technically works)

- Textures that look stretched, blurry or visibly repeat with seams.
- Raw multi-megabyte photos in the npm package.
- Effects that look good in a screenshot but fail contrast for real text.
- Gloss that reads as a hard white stripe instead of Aqua-style gradient gloss.
- Stitching that looks like a dashed CSS border.
- Anything that needs JavaScript to render correctly.

## Constraints

- Plain CSS. Modern evergreen browsers. No required build step for consumers; a texture build script is run by the maintainers only.
- Refraction depends on an SVG filter inside `backdrop-filter`, which only Chromium renders. Other browsers must degrade to a clear glass pane with no bending.
- The textures are Unsplash photos, and the owner has decided they ship inside the package. Unsplash photos are free to use, and the package credits the photographers.
- Texture files must be small tiles (roughly 20 to 150 KB each). The prototype's reference assets total 1.4 MB.

## Decisions

Each item states what was decided. Where something is my own call and not the owner's, it is listed again under "Calls made by me".

### Materials and tinting

- Backgrounds are applied with a class. Textures are repeated tiles at natural size, never stretched to cover.
- **Tint system (decided):** a texture tile is made grayscale and multiplied onto a single `--tint` color, so one variable recolors it. In the prototype the felt photo is orange and `--tint: #1f7a3d` makes it green; swatches show green, blue, burgundy, purple and gold. The prototype does this with `filter: grayscale(1) contrast(1.5) brightness(1.5)` and `mix-blend-mode: multiply` on a pseudo-element. A pre-grayscaled tile with `background-blend-mode: multiply` is simpler and is the builder's call.
- Felt: tiled at 256px, used as the screen background.
- Wood: the lighter wood photo, grain running horizontally, for navigation bars. A dark wood is also available.
- Brushed metal: switch tracks, plates, toolbars.
- Metal spiral: switch thumbs and knobs only (it is a one-off image, not a tile).
- **Rubber style dropped (decided):** there is no rubber material or rubber button in the kit. The "generic" dark matte texture is therefore unused for now.
- Plastic grain: a softened, mid-gray version of the "grain" file, blended with `overlay`, so plastic is satin with a fine grain.
- Cardstock: the notes title bar, tinted brown by multiplying onto `#562a0e`.
- Legal pad: the lined-paper photo recolored to yellow paper with red rules (see the pipeline).

### Glass

- The base recipe comes from `~/shiny`: a blurred, saturated backdrop layer over the lens, plus a second layer that samples a region extended past the lens so nearby colors bleed in as an ambient glow at the edge.
- **Two things were learned and must be kept** (found by testing in Chrome):
  - Clipping a `backdrop-filter` layer with `clip-path` or `overflow: hidden` does not round the filter output in Chromium. It leaves square corners. Give the filter layer a real `border-radius` instead.
  - The glow layer works by giving the extended layer a transparent border as wide as the bleed, then masking it to the padding box with four soft edge gradients, so the shape stays rounded and the glow fades inward.
- Reference values: lens `backdrop-filter: blur(14px) saturate(125%) brightness(110%)` with a 42% black shade on top of the fill; glow `blur(25px) saturate(190%) brightness(135%)`, `--glow-depth: 18px`, bleed `2rem`; the white top highlight is soft (about 30% fading out by 54%).
- **Refraction (decided to include):** an SVG filter (`feImage` displacement map plus `feDisplacementMap`, scale about `0.2`, `primitiveUnits="objectBoundingBox"`) used as `backdrop-filter: url(#refract) blur(1px) saturate(110%) brightness(105%)`. The displacement map is a data-URI SVG with red and green edge ramps that are neutral in the middle. It needs an inline SVG snippet in the page. Chromium only.
- Saturation and refraction strength were deliberately reduced after the owner found them too strong; keep them subtle and expose them as variables.
- Text on glass: the placeholder is 72% white and needs the dark shade in the fill to reach 4.5:1. It was 62% in the prototype, which passed in Chrome but scored 4.33 to 4.36 at the worst pixel in Firefox and WebKit.

### Gloss, shadow and rounding

- **Gloss is in the gradient (decided from the references).** Aqua gloss means a thin dark top edge, a pale highlight band in the upper half, a saturated middle, and a light glow at the bottom. It is not a separate white stripe. Keep it subtle.
- Progress bars: blue `#2b4fb5 0%, #93aef0 14%, #a3bbf2 38%, #4a78e4 58%, #5f8bec 80%, #86abf6 100%`; green analog. A shared sheen overlay is available as `--sheen`.
- **Candy cane progress (decided):** blue and white diagonal stripes with soft-edged transitions, 32px period (`#3d6fe0` and `#f4f8ff`), tile `45.25px` (32 / sin 45) so the loop is seamless, animated one tile per second, with the sheen over it.
- Aqua pill utility: dark rim, body lighter toward the bottom (`#3556c4 → #5a85ea → #8db0f7`), and a soft sheen whose strength is a variable (none, soft about 28%, strong about 55%).
- Shadows are layered (contact plus ambient). Sizes: sm, md, lg, and inset. Exact values are in the prototype.
- **Rounding (decided direction, details mine):** concentric corners, with inner radius equal to outer radius minus padding; the prototype demonstrates the difference. A small scale (6px, 12px, 20px, pill) is provided.

### Selection and the blue family

- **One blue family (decided):** every blue shares one hue with lighter and darker steps. Text-bearing selections use `#406eda → #2f5fc8` with a thin light top line (`inset 0 1px 0 rgba(255,255,255,.3)`) and white text.
- This was reached by following the Soft Aqua "Save" row (`#5c86f3 → #3c76da`), then deepening it so white text passes (the reference blue gave 3.64:1; the family blue gives 4.9:1 or better).
- Selected rows and the active switch stay blue. The navigation does not use blue.

### Components

- **Inputs and dropdowns:** rounded glass fields. The dropdown has no separate button; it is the glass field with a plain white chevron. The open menu's selected row is the solid blue gradient with no gloss.
- **Switch (decided):** brushed-metal track, spiral-metal thumb. On state: full blue fill with a soft top highlight, an inner glow, an outer glow and a glowing thumb. Changed after the first build at the owner's request: the thumb is 36px on a 28px track, so it overhangs by 4px at each end and above and below, and the toggle is animated (0.22s: the thumb slides, the blue fill and glow fade in). No motion under `prefers-reduced-motion`.
- **Plastic buttons:** satin, one `--c` color, fine grain, a very soft top sheen (no hard gloss). Label colors were chosen so white labels pass: red `#a82219`, green `#176528`, blue `#264eae`, purple `#53349e`. The amber button uses a dark label because white cannot pass on orange.
- **Knob (decided):** metal spiral face with a smooth bevel and an orange indicator tick. The face is built from the spiral photo: clean concentric rings (the ring profile averaged around the circle away from the photo's moiré seams) with the photo's own bright and dark wedges multiplied back in, measured as brightness and colour versus angle around its centre, so it reflects light like spun metal. The owner asked for the reflections after seeing a rings-only face. The reflections are part of the image, so they stay fixed while the tick turns.
- **Engraved text classes (decided):** `engraved-metal`, `engraved-leather`, `engraved-wood` - a dark glyph with a light lip along the lower edge, so it looks cut into the surface. Colors were fitted to the real texture pixels to pass contrast: metal `rgb(18,20,26)`, wood `rgb(66,38,14)`, and leather dark `rgb(55,28,10)` on a lightened leather panel. Dark text on the original dark leather could not pass, so the leather panel is tinted lighter.
- **Recessed inputs (decided):** cream gradient `#f9f1dc → #efe4c6`, inner shadow with a light lip below, placeholder `rgb(116,98,66)`.
- **Leather button:** tan gradient `#dcaa6c → #be8647`, dark label.

### Navigation

- **Wooden navigation bar (decided):** light wood, with dark engraved text for every item. Only the active item is recessed: a shallow pocket cut into the wood (a darkened gradient plus a shadow along the top edge and a light lip along the bottom). No blue in the navigation.
- Label color `#1c0d03`. The wood is lifted slightly with a light overlay so small dark text passes.

### Leather and stitching

- **Decided: use the real stitching from the owner's "leather-stitched" photo, not a CSS effect.** The photo has a straight seam: pebbled leather, a rolled edge, then a smooth band carrying a row of twisted thread stitches. That seam becomes the frame.
- Method: a 12-stitch strip cut from the seam (stitch period 119.8 source pixels, taken from the steadiest part of the photo), tiled along the four edges, with corners made by bending the same strip around a quarter circle (polar warp). The corner arc is exactly two stitch periods, so stitch spacing stays even through the corners. Built at 2x (457 pixel image, slice 68, 34px border) and used as `border-image: url(...) 68 / 34px / 0 round`.
- The frame's inner edge fades out softly (distance to the interior rectangle, 28 device pixels), and the interior is a smooth-leather tile cut from the same photo at the same grain size and tone-matched to the band, so the band simply carries on inward with no visible cut. No inner shadow.
- **Tints (decided):** the standard leather is the lighter tan of the owner's sign-in reference (body about `rgb(210,174,114)`); the notepad frame is black. Both come from the same photo through a gradient map (tan) or a grayscale level map (black), which keeps the stitch and grain contrast. The tan map's darkest tone is lifted so the dark title text passes.
- **Thread color rule (decided):** thread color equals the leather color mixed with about 35% white, measured from the Find My Friends reference, so stitching looks consistent on any tint. This is implemented for the CSS alternative (`.stitched`, a 9-slice SVG mask of short rounded, slightly tilted thread segments filled with the thread color, 7px dash style tuned to look like real stitches). The photo frames carry the photo's own thread color, so a new tint needs its own generated frame.
- Only the stitched frames and cards are stitched. The notepad title bar has no stitching.

### Templates

Three pre-built templates exist in the prototype. All use only kit parts.

- **Felt controls screen:** green felt, light wood navigation bar, glass input, dropdown, metal switches, candy cane and glossy progress, selection.
- **Notes app (after the iOS 4 Notes reference):** black stitched leather frame; a light list panel with a "N Notes" header, a recessed search pill, handwritten-style titles (Marker Felt, Bradley Hand or Segoe Print) with gray dates and a blue selected row; a cardstock title bar tinted brown with a centered white title and a small leather "+" button; and a yellow legal pad with a red double margin, a red meta line, handwritten text and a toolbar of four icons on a plain strip. The legal tile repeats at 585px wide so its rule pitch is exactly 24px, matching the line height.
- **Sign-in card (after Find My Friends):** tan stitched leather frame, a cream recessed field group, and a leather button.
- A "Tasks" template from the newest reference is a candidate, not yet decided.

### Texture pipeline (maintainers only)

Scripts in `tools/texture-pipeline/`. They need Python with Pillow and ImageMagick.

| Output | Script and key parameters |
|---|---|
| Seamless tile from a random-grain photo (felt, wood, leather, metal, cardstock) | `make_tile.py SRC OUT CROP_FRACTION SIZE FLATTEN_RADIUS [ROTATE]`. Crops the center, removes uneven lighting with a high-pass, then makes the edges seamless by cross-fading with a half-offset copy. Used values: felt `0.5 512 60`, light wood `0.5 512 60 90`, brushed metal `0.55 512 14`, cardstock `0.3 512 80`. |
| Legal pad tile | `make_legal_tile.py`. Patches out the photo's margin line and bright left edge, then rebuilds the rules in red on yellow paper while keeping the paper texture. |
| Knob face | `make_radial_face.py SRC OUT 2762 1509 450 288 1.0 0.6`. Averages the ring profile at angles away from the photo's seams, then multiplies in the photo's wedge reflections (full contrast, 60% of their colour cast). |
| Stitched frame | `make_stitched_frame.py SRC OUT 900 2500 119.8 1942 152 34`. Find the stitch period first with `stitch_period.py` and `local_periods.py`. |
| Soft inner edge, tone-matched fill, black variant | `soft_interior.py` |
| Stitched bottom edge for the leather bar | `make_bar_edge.py FRAME_PNG OUT 68 50`. Crops the finished frame's bottom strip just below the crease under the stitches, dropping the heavy rolled edge. |
| Tan variant | `tan_leather.py`. Gradient map stops `(0,(126,94,58))`, `(.35,(166,126,76))`, `(.65,(208,168,106))`, `(1,(243,222,178))` with luminance raised to the 0.42 power. |
| Stitch SVG for the CSS alternative | `make_stitch_svg.py 18 1.6 8.5 2.6 12` |

Two lessons that apply to any new texture: periodic patterns (such as a diamond lattice) must be tiled on their lattice vectors, never cross-faded, or they ghost; and photos with large-scale lighting need the high-pass step or the same bright and dark patches repeat visibly.

### Accessibility (decided)

- Target WCAG AA. Normal text 4.5:1, large text (24px, or 18.66px bold) 3:1, icons and non-text 3:1.
- Measure against the actual rendered pixels behind each item, and use the worst pixel as the pass mark, which is stricter than WCAG's usual practice. The audit is two steps: `collect.js` (run in the page, records every text node, placeholder and icon, then hides them) and `measure.py` (measures each against a full-page screenshot).
- Current state of the prototype: 120 items measured, 3 below threshold at the worst pixel. They are the two 34px "test words" on the glass playground's deliberately arbitrary backdrop, and the host page's own header. Treat those as exempt.
- Decisions that existed only to pass contrast: the fill shade under glass text, the deeper blue for selected rows, the dark label on the amber button, the lifted tan leather floor, the lighter wood under nav text, and the plain strip under the pad icons.

### Browser support

- `backdrop-filter`, `color-mix`, `border-image`: evergreen browsers.
- Refraction: Chromium only, with a clear-pane fallback. The package tests pass in Playwright's Firefox and WebKit builds, but those builds do not render any `backdrop-filter`, so frost, glow and refraction in the real Firefox and Safari still need a look by eye.
- The CSS `.stitched` alternative uses `-webkit-mask-box-image`, which Chromium and Safari support. Verify and provide a fallback elsewhere. The photo frames use plain `border-image` and have no such limit.

## Calls made by me

The owner did not decide these. Change them freely.

- Class and variable prefix `fam-` and the package name `fam-ui` (taken from the folder name).
- Layers and files: tokens, materials, effects, components, templates, shipped as one bundled `fam-ui.css` plus one file per layer.
- The refraction SVG filter ships as a small snippet the page includes inline.
- The rounding scale values, the shadow stack values, and the pill gloss strengths.
- Respecting `prefers-reduced-motion` for the candy cane animation (not in the prototype).
- Texture size budget of roughly 1.5 MB for everything the package loads.
- The "Marker Felt, Bradley Hand, Segoe Print" handwriting stack for notes text (these are system fonts, not guaranteed to exist everywhere).
- **Reference screenshots are not shipped.** The Apple, Soft Aqua, Snow Leopard, plastic and wood-shelf images only guided the look. Every shipped tile or frame is derived only from the owner's `textures/` photos: the tan leather, black leather and frames from the leather-stitched photo, the legal pad from the lined-paper photo.
- **The size budget applies to what a default page loads**, not to the whole package. Textures are separate files fetched only when their class is used, so unused backgrounds cost nothing. Keep each tile roughly under 150 KB. There is no hard cap on total package size.
- **Version 1 ships the three templates that exist** (felt controls screen, notes app, sign-in card). The "Tasks" template is a later addition.
- **Frame colors:** version 1 ships two prebuilt photo frames, tan (standard) and black. The tintable option for any other color is the CSS `.stitched` alternative. The recolor script is for maintainers, so consumers never need a build step.

## Decided by the owner

The modified Unsplash textures ship inside the npm package, with photographer credits. The tiles, frames and a credits file live in the package, and the texture pipeline scripts stay maintainers-only.

## Left to the builder

- The showcase demo page (a later goal): which sections, whether it is a plain static page, and how it is hosted.
- CSS architecture, custom property names, whether to use `@layer`.
- How consumers point the stylesheet at the texture folder (a custom property holding `url()` resolves relative to the stylesheet that declares it, which needs to be tested).
- A documentation or demo site, and the packaging details (exports, versioning, file layout).
- A test strategy. At minimum a visual smoke check and the contrast audit wired in.
- Remaining textures not used yet (generic dark matte, corkboard, denim, linen, grass, cardboard, paper bag, the other papers, wood frame, carbon fiber CSS) and which become background classes.
- Further components not yet designed: checkboxes, radios, sliders, segmented controls, tabs, steppers, window chrome.
- The tiling of the paper background used in the notes list (the prototype still stretches it).
- Whether to ship tinted frame variants prebuilt or provide the recolor script, since photo-based stitching cannot follow a CSS color variable.
