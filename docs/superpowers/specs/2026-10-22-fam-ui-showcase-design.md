# fam-ui showcase design

Date: 2026-10-22
Status: draft for approval, then planning

A single-page site that shows off fam-ui, the plain-CSS kit for skeuomorphic interfaces (metal, glass, leather, wood, felt, paper, cardstock and plastic). The kit's design is in `docs/superpowers/specs/2026-10-22-fam-ui-design.md`, and version 1 is built and merged. This document is only about the showcase page, which the kit's design listed as a later goal.

## Reference material

- `docs/superpowers/reference/showcase-mockup.html` - the final mockup of the whole page, built from the real kit classes. Open it in a browser after `npm run build` (it links `dist/fam-ui.css`). It is a layout and look reference, not code to ship. Its engraved text, glass lens and knobs are static.
- `docs/superpowers/reference/showcase-assets/ribbon.jpg` - the glass photo, resized for the mockup.
- The kit itself: `dist/fam-ui.css`, `assets/`, `examples/` (the three templates and the components page) and the README, which has the markup for every component.
- `references/boliviainteligente-fQkSoZD0A3o-unsplash.jpg` - the owner's original glass photo (3840 by 2400): a purple, blue and cream ribbon on a dark navy background.

## Intent and why

The owner wants one page that makes a visitor see the materials, try the glass effects, and come away with the idea that it is very easy to apply a material or an effect (one class each).

## Goals

- A visitor can see every material and combine them the way the kit is meant to be used.
- A visitor can try the glass: a lens that follows the cursor over a dark background with only a few bright colors, where the frost, glow and refraction are easy to see.
- Every scene shows the classes it is made from, so the "one class each" point is visible.
- The page is built only from the package's own CSS and assets, so it cannot show something the package does not do.

## Non-goals

- A documentation site. The README stays the reference; the page shows and invites.
- Shipping the showcase in the npm package.
- New kit components. The kit has no slider, so the glass controls use the existing knob and switch. The one kit change is the two blur variables under "Glass".

## Anti-goals (a failure even if it technically works)

- A scene that looks right in the page but cannot be reproduced with the package's classes.
- The core content (materials, scenes, class names) needing JavaScript to appear.
- Text on the page that fails the kit's own contrast standard.
- A glass section where the effect is hard to see because the backdrop is busy or light.

## Decisions

Each item is what the owner decided unless it is marked as my call.

### Structure

- **One scrolling page, with the structure the owner called "A":** a dark page, each scene in a framed window with its class names underneath. The owner rejected full-bleed material bands for the page, but wanted the glass section to run edge to edge on a dark background.
- Order, top to bottom: opening screen, four paired scenes, engraved text, build your own, glass.

### Opening screen

- Tan stitched leather (the kit's tan frame and fill) filling the first screen.
- Engraved text in a serif face (Georgia, then Times New Roman, the same face as the sign-in template title): "Fam" large, then "Familiar materials for the web". The owner first said sans serif and then corrected that to serif.
- A small "scroll" cue under the text is in the mockup. It was not specifically requested, so it is my call.

### Paired scenes

Each scene is a framed window on the dark page with its classes beneath. The owner asked for pairs.

- Wood and felt: the controls screen (wooden navigation over felt, with a glass field, a switch and a candy cane progress bar).
- Legal pad and leather: a legal pad inside the black stitched leather frame.
- Leather and paper: the tan stitched frame around a paper list with a selected row.
- Metal on metal, with controls: plastic buttons, a knob and a switch on a brushed-metal plate.

### Engraved text

A section with three panels, one per engraved class on its own material: `fam-engraved-metal` ("SETTINGS"), `fam-engraved-leather` ("Notebook"), `fam-engraved-wood` ("LIBRARY").

### Build your own

A utility-classes section for building your own, shown in one framed panel:

- A square for every texture, labeled with its class: felt, wood, metal, leather, paper, cardstock, legal pad and the stitched leather frame.
- A row of felt in five tints (green, blue, burgundy, purple, gold) to show that one variable recolors it.
- Gloss (`fam-gloss-none`, `soft`, `strong` on the Aqua pill) and rounding (`fam-round-sm`, `md`, `lg`, `pill`).
- Shadows (`fam-shadow-sm`, `md`, `lg`, `inset`). The owner asked for gloss and rounding; shadows are my call because they belong with them.

### Glass

- A full-bleed band on the owner's ribbon photo, which is mostly dark with a few bright colors, so the lens is easy to read.
- A glass lens that follows the cursor (and a finger on touch screens, my call).
- Controls are the metal knobs, which the owner approved, on a brushed-metal tray with engraved labels: Blur, Glow and Radius, plus a switch for refracting or frosted glass.
- **Knob mapping and ranges (my call):**
  - Blur sets the lens blur, 0 to 30px, default 14px (`--fam-glass-blur` in frosted mode, `--fam-refract-blur` in refracting mode, default 1px).
  - Glow sets how far the edge glow reaches in, `--fam-glow-depth`, 0 to 40px, default 18px.
  - Radius sets `--fam-r`, 0 to 90px, default 90px. The lens is 180px across, so 90px is a circle.
  - The Refract switch is on by default: on is `fam-glass--refract`, off is frosted `fam-glass`.
- **One change to the kit (my call):** the lens blur is hardcoded in the kit, so the Blur knob has nothing to drive. Add `--fam-glass-blur` (default 14px) and `--fam-refract-blur` (default 1px) to `css/effects.css`, with a test, as the kit already does for saturation. This keeps the page honest: everything it shows is a variable the package exposes.
- Turning a knob updates the CSS variables and markup shown with the lens so a visitor can copy them. This was part of my proposal that the owner approved with the knobs.
- The knob's reflections stay fixed while its orange tick turns, as they do in the kit.
- Refraction only works in Chromium. The page says so and shows a clear glass pane elsewhere, as the kit does. Frosted glass works in Firefox and Safari (this was only unverified in the automated test builds), so the glass section is not empty there.

## Constraints

- Plain static HTML, CSS and JavaScript, with no framework or required build step for the page itself (my call). The JavaScript covers the lens, the knobs and copy-to-clipboard. The kit and the package stay free of required JavaScript.
- The page links the package's real `dist/fam-ui.css` and `assets/`. It does not carry copies of them.
- The ribbon photo is an Unsplash photo, which is free to use. Credit the photographer ("boliviainteligente" in the file name) on the page. Resize it for the web (the mockup copy is 1600 pixels wide and 126 KB).
- Accessibility: the kit's standard of WCAG AA contrast measured on rendered pixels applies to the showcase. The existing audit (`tools/contrast-audit.mjs`) should run on it.
- The knobs are only decorative in the kit (`role="img"`). On the page they become real controls, so they need to be keyboard-operable and announced as sliders (my call; the page must not have mouse-only controls).
- Respect `prefers-reduced-motion` for anything that animates (my call).
- The page works at phone width as a single column (my call, following the kit's phone-width standard).

## Left to the builder

- How the page detects a non-Chromium browser for its refraction note (a user-agent check is a poor fit, so a feature test or a plain note for everyone are both fine).
- The layout of the published site (the page and the `dist/` and `assets/` folders it links must keep working relative paths), and the page's own file layout, and whether the scenes are copied from the `examples/` markup or written fresh.
- The exact markup for each scene, and the exact copy under the scenes.
- How the "copy" buttons and the live CSS readout look.
- Page title, description and share image.
- A test strategy. At minimum the contrast audit and a smoke check that the page loads with no missing files. `tools/contrast-audit.mjs` currently lists three example pages by name and loads them from `examples/`, so it needs a small change to run on the showcase.

## Decided by the owner

The showcase lives in the repo, in a `showcase/` folder (not shipped in the npm package), and is published with GitHub Pages. The page links the package's real `dist/fam-ui.css` and `assets/`. Two consequences follow:

- `dist/` is git-ignored, so the deploy workflow has to run `npm run build` before it publishes, and the published site has to keep the page's relative paths to `dist/` and `assets/` working.
- The repo has no git remote yet. Creating the GitHub repository, pushing, and switching Pages on in its settings are the owner's steps. The plan covers the workflow file and everything in the repo, not those.
