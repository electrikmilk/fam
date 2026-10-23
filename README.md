# fam-ui

Plain CSS for skeuomorphic interfaces in the style of Mac OS X Aqua and iOS before version 7: metal, glass, leather, wood, felt, paper, cardstock and plastic. No JavaScript, no build step.

## Use it

Link the bundle and wrap your UI in `.fam` (it only sets the font and base color):

```html
<link rel="stylesheet" href="node_modules/fam-ui/dist/fam-ui.css">
<div class="fam">...</div>
```

With a bundler you can also write `@import "fam-ui";` in CSS or `import "fam-ui";` in JavaScript; both resolve to the bundle.

The textures are separate files in `assets/` and are only fetched when a class that uses them is on the page. If you copy the stylesheet somewhere else, copy `assets/` too and keep it next to the folder that holds the stylesheet, because the CSS refers to `../assets/`.

The same CSS is also split into layers in `css/`: `tokens`, `materials`, `effects`, `components`, `templates`. Load them in that order.

Class names start with `fam-` and custom properties with `--fam-`.

## Materials

Put a material class on any box:

- `fam-felt`: tintable felt, for screen backgrounds.
- `fam-wood`: light wood with horizontal grain, for navigation bars and panels.
- `fam-metal`: brushed metal, for plates, toolbars and panels.
- `fam-leather`: tan leather, for panels and fields.
- `fam-paper`: white textured paper, for lists and note panels.
- `fam-cork`: cork, for bulletin boards. Put it inside a wood frame.
- `fam-cardstock`: natural light cardstock. Set `--fam-cardstock-tint` to multiply the texture onto a color; `#562a0e` gives brown cardstock for title bars, where white text reads well.
- `fam-legal-pad`: yellow ruled paper with a red double margin. Its rules are 24px apart, so give text a 24px line height to sit on them.

Felt is grayscale and multiplied onto one color, so one variable recolors it:

```html
<div class="fam-felt" style="--fam-tint:#8a1f2b"></div>
```

### Leather frames

`fam-leather-frame` is a photo frame with real stitching (tan). Add `fam-leather-frame--black` for black. The frame needs room for its 34px border.

```html
<div class="fam-leather-frame">...</div>
```

For any other color, use `fam-stitched`: a CSS stitched border whose thread is the leather color lifted 35% toward white. Set `--fam-leather-color` to the color of the surface, and optionally `--fam-stitch-lift` and `--fam-stitch-inset`.

```html
<div class="fam-stitched" style="--fam-leather-color:#6a2430; background:#6a2430"></div>
```

`fam-stitched` needs `-webkit-mask-box-image`. Where that is missing the stitches are hidden.

### Wood frame

`fam-wood-frame` is a moulded wood frame with a drop shadow outside and an inset shadow where the content meets the frame. Put a photo, a page or a corkboard inside it. The border is 40px; change it with `--fam-frame-width`.

```html
<figure class="fam-wood-frame"><img src="photo.jpg" alt="..."></figure>
<div class="fam-wood-frame"><div class="fam-cork">...</div></div>
```

Add `fam-wood-frame--glossy` for a glass sheen over a photo. Leave it off for a page or a board.

### Print frame

`fam-print-frame` is a print with a margin, a soft drop shadow and a faint edge around the photo. The margin is the material you pair it with: `fam-paper` for a white margin or `fam-cardstock` for a natural cardstock one (tint it with `--fam-cardstock-tint`). The margin is 14px; change it with `--fam-print-margin`.

```html
<figure class="fam-print-frame fam-paper"><img src="photo.jpg" alt="..."></figure>
<figure class="fam-print-frame fam-cardstock"><img src="photo.jpg" alt="..."></figure>
```

## Glass

```html
<div class="fam-glass"><input class="fam-glass-input" placeholder="Search" aria-label="Search"></div>
```

Set `--fam-r` for the corner radius (default pill), `--fam-glow-depth`, `--fam-bleed`, and the saturation with `--fam-glass-saturate`, `--fam-glow-saturate` and `--fam-refract-saturate`.

Add `fam-glass--refract` for clear glass that bends what is behind its rim. It needs the filter in `snippets/refraction-filter.html` somewhere in the page, once:

```html
<!-- paste the contents of snippets/refraction-filter.html -->
<div class="fam-glass fam-glass--refract"></div>
```

Refraction works in Chromium only. Other browsers show a clear glass pane with no bending. The bending strength is the `scale` attribute on `feDisplacementMap` in the snippet.

A dropdown is the same field with a `select`: `<select class="fam-glass-input">`. The open list is a plain styled `ul.fam-menu` for your own menus, with `aria-selected="true"` on the chosen item.

## Components

Switch (a checkbox, so it works without JavaScript). The thumb is taller than the track and sticks out 4px past each end, so the switch has a 4px margin to keep neighbours clear. The thumb slides and the blue fill fades in when it toggles; both stop under `prefers-reduced-motion: reduce`:

```html
<label class="fam-switch"><input type="checkbox" role="switch" aria-label="Wi-Fi"><span class="fam-switch-knob"></span></label>
```

Progress (set `--fam-value`; use `fam-progress-fill--candy`, `--aqua` or `--green`):

```html
<div class="fam-progress" role="progressbar" aria-label="Upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="68" style="--fam-value:68%">
  <div class="fam-progress-fill fam-progress-fill--candy"></div>
</div>
```

The candy cane animation stops under `prefers-reduced-motion: reduce`.

Plastic buttons and the knob:

```html
<button class="fam-plastic fam-plastic--red" type="button">Record</button>
<button class="fam-plastic fam-plastic--purple fam-plastic--round" type="button" aria-label="Info">i</button>
<span class="fam-knob" role="img" aria-label="Volume" style="--fam-knob-angle:35deg"></span>
```

Colors are `--red`, `--green`, `--blue`, `--purple` and `--amber`. For any other color set `--fam-c` on a `fam-plastic`; check that the label reaches 4.5:1.

Navigation (use with `fam-wood`; mark the current page with `aria-current="page"`):

```html
<nav class="fam-nav fam-wood" aria-label="Main">
  <span class="fam-nav-brand">Brand</span>
  <a class="fam-nav-item" href="/" aria-current="page">Home</a>
  <a class="fam-nav-item" href="/about">About</a>
</nav>
```

Recessed fields, search pill, leather button, list rows:

```html
<div class="fam-recessed">
  <div class="fam-recessed-row"><label for="id">Name</label><input id="id"></div>
</div>
<label class="fam-search"><svg aria-hidden="true">...</svg><input placeholder="Search" aria-label="Search"></label>
<button class="fam-leather-button" type="button">Sign In</button>
<ul class="fam-list" aria-label="Notes">
  <li><a class="fam-list-row" href="#a" aria-current="true"><b>Title</b><span>Today</span></a></li>
  <li><a class="fam-list-row" href="#b"><b>Another</b><span>Monday</span></a></li>
</ul>
```

Rows are real links (or buttons) in a plain list, so they work with the keyboard as they are. Mark the current row with `aria-current="true"`. `fam-menu` is only the look of an open menu: if you build a real custom menu, give it listbox semantics and the arrow-key behavior that goes with them.

Selected rows and menu items use the blue family `--fam-blue-top` to `--fam-blue-bottom`.

## Effects

- Shadows: `fam-shadow-sm`, `fam-shadow-md`, `fam-shadow-lg`, `fam-shadow-inset`.
- Rounding: `fam-round-sm` (6px), `fam-round-md` (12px), `fam-round-lg` (20px), `fam-round-pill`. For a box inside padding, set `--fam-outer-radius` and `--fam-pad` on the outer box and use `fam-concentric` on the inner one, so the gap stays even.
- Aqua pill with a gloss you can dial: `fam-pill` with `fam-gloss-none`, `fam-gloss-soft` or `fam-gloss-strong`.
- Engraved text: `fam-engraved-metal`, `fam-engraved-wood`, `fam-engraved-leather`, on the matching material.

## Templates

Working pages are in `examples/` in the source repository: a felt controls screen (`fam-screen`), a notes app (`fam-notes`, `fam-notes-list`, `fam-pad`, `fam-pad-bar`, `fam-pad-sheet`) and a sign-in card (`fam-signin`). Copy the markup from there.

## Accessibility

The kit is built for WCAG AA. The test suite measures contrast on the real rendered pixels of the example pages and fails if any text, placeholder or icon falls below 4.5:1 (3:1 for large text and icons) at its worst pixel.

- Give progress bars `role="progressbar"` with `aria-valuenow`.
- Give icon-only buttons an `aria-label`.
- Every control has a visible keyboard focus ring.
- White text on orange cannot reach contrast, so the amber plastic button uses a dark label. If you add a light color, check the label.

## Browser support

Evergreen browsers with `backdrop-filter`, `color-mix()` and `:has()`. Refraction is Chromium only and degrades to a clear pane.

| Engine | How it was tested | Result |
|---|---|---|
| Chrome | Installed Google Chrome, driven by Playwright | Everything, including the frosted glass, glow and refraction |
| Firefox | Playwright's Firefox build | The full test suite and contrast audit pass. That build does not render `backdrop-filter` at all (not even a bare `blur()`), so the frost and glow could not be checked. |
| WebKit | Playwright's WebKit build | The same as Firefox. Safari skips links and buttons on Tab unless you hold Option. |

Without backdrop blur, glass is a dark translucent pane with a highlight. Text on it still reaches 4.5:1, because the audit passes in the engines that render no blur. Frost, glow and refraction in the real Firefox and Safari have not been looked at yet.

Run the suite in another engine with `FAM_BROWSER=firefox npm test` or `FAM_BROWSER=webkit npm test` (after `npx playwright-core install firefox webkit`).

## Credits

The textures are processed from photographs on Unsplash. See `CREDITS.md`.
