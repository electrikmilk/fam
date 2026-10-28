<h1 align="center"><img src="docs/header.png" alt="Fam: familiar materials for the web" width="880"></h1>

Plain CSS for skeuomorphic interfaces in the style of Mac OS X Aqua and iOS before version 7: metal, glass, leather, wood, felt, paper, cardstock and plastic. No JavaScript required, no build step.

Fam is meant to be short and sweet, and is short for Familiar. It also stands for Fam Adds Materials. Use it as a full UI framework, or just add a texture or material behind a minimalist, flat UI of your own. See [Two ways to use it](#two-ways-to-use-it).

Skeuomorphism exists to make an interface feel familiar. A recessed field invites typing, a raised button invites a press and a switch looks like a switch. Fam builds those cues from real photographs of materials, processed into seamless tiles and credited in [CREDITS.md](CREDITS.md), not from gradients that imitate them.

Materials tile to make textured interfaces responsive. A tile repeats at its natural size and is never stretched, so any box in any shape gets the material. There are no images per breakpoint, and a phone loads the same files as a desktop.

Textures are compact tiles to load fast. Each is between 13 KB and 85 KB, and a material you do not use is never downloaded.

## Why use it

Beyond the look:

- **Light.** The notes example (`examples/notes.html`) loads 250 KB of images and 88 KB of CSS (19.9 KB gzipped), the same at 375px and 1440px wide. There is no JavaScript.
- **Responsive without extra work.** Tiles repeat to fill any box. Photo frames are nine-sliced and the leather bar's stitched edge repeats along its length, so both fit any width.
- **Accessible, and tested.** Contrast is measured on the rendered pixels against WCAG AA, every control has a keyboard focus ring, and forced colors, disabled states and missing backdrop blur are handled. See [Accessibility](#accessibility).
- **Easy to adopt.** One stylesheet, `fam-` classes and `--fam-` custom properties. Because it is plain CSS, it sits alongside whatever framework you use.
- **Quick to recolor.** One variable tints felt (`--fam-tint`) and cardstock (`--fam-cardstock-tint`).

## Two ways to use it

- **As a UI framework.** Use the buttons, switches, tabs, fields, lists, navigation and glass. Every control is built from the materials, so a whole interface can be Fam.
- **As texture for a flat UI.** Keep your own minimalist components and put a material behind them: cork, wood, felt, leather or any other. You add one class, and only the tile you use is downloaded.

```html
<div class="fam-cork" style="padding:32px">
  <!-- your own flat components -->
  <div class="card">...</div>
</div>
```

## Showcase

A tour of the materials in five pages: https://electrikmilk.github.io/fam/

- Home: the two ways to use Fam (as a framework, or as texture behind a flat UI) and a switcher that shows one pairing at a time, with the classes it uses.
- Materials: every texture, the felt and cardstock tints, gloss, rounding and shadows, plus navigation bars, photo frames with cork, engraved text and scenes that combine materials: wood and felt, metal on metal, legal pad and leather, cardstock and legal pad, leather and paper.
- Controls: plastic, metal, glossy and glass buttons and button groups, radio buttons, tabs, the plastic panel and dial, LEDs, the switch and knob, progress tubes, glass fields, the search pill, list rows, zebra tables, recessed fields and the leather button, each alone with its disabled look.
- Glass: frosted glass, the ambient glow and refraction, and a glass lens that follows your cursor with knobs to tune it.
- Examples: the pages in `examples/`.

The showcase's own text is set in Lato, loaded from Google Fonts. The kit itself loads no fonts.

To open it locally, build the kit and open `showcase/index.html` in a browser:

```sh
npm run build
```

`npm run site` assembles the folder that GitHub Pages publishes (`_site/`), and `.github/workflows/pages.yml` publishes it on every push to `main`.

## Use it

Link the bundle and wrap your UI in `.fam` (it only sets the font and base color):

```html
<link rel="stylesheet" href="node_modules/fam-ui/dist/fam-ui.css">
<div class="fam">...</div>
```

With a bundler you can also write `@import "fam-ui";` in CSS or `import "fam-ui";` in JavaScript; both resolve to the bundle.

One optional extra needs JavaScript: `import "fam-ui/refraction";` makes refracting glass bend along its own corner radius (see [Glass](#glass)). Leave it out and everything else works the same.

The textures are separate files in `assets/` and are only fetched when a class that uses them is on the page. If you copy the stylesheet somewhere else, copy `assets/` too and keep it next to the folder that holds the stylesheet, because the CSS refers to `../assets/`.

The same CSS is also split into layers in `css/`: `tokens`, `materials`, `effects`, `components`, `templates`. Load them in that order.

Class names start with `fam-` and custom properties with `--fam-`.

## Materials

Put a material class on any box:

- `fam-felt`: tintable felt, for screen backgrounds.
- `fam-wood`: light wood with horizontal grain, for navigation bars and panels.
- `fam-metal`: brushed metal, for plates, toolbars, navigation bars and panels.
- `fam-metal-sandblasted`: fine sandblasted metal, for the same uses. Its buttons are `fam-metal-button fam-metal-button--sandblasted`.
- `fam-plastic-panel`: cream satin plastic for controls to sit on. Use it with a `fam-round-*` class.
- `fam-leather`: tan leather, for panels and fields.
- `fam-leather-bar`: tan leather with a stitched bottom edge, for navigation bars. See [Navigation](#components).
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

`fam-wood-frame` is a moulded wood frame with a drop shadow outside and an inset shadow where the content meets the frame. Put a photo, a page or a corkboard inside it. The border is 26px; change it with `--fam-frame-width`.

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

Refraction only applies to Chrome, but all browsers get a nice specular ambient glow, bleeding nearby colors into the glass, and a specular rim light: a bright line along the top-left edge that follows the corner radius.

```html
<div class="fam-glass"><input class="fam-glass-input" placeholder="Search" aria-label="Search"></div>
```

Set `--fam-r` for the corner radius (default pill), or add a `fam-round-*` class, which sets it for you. A plain `border-radius` on the glass rounds the lens but not the glow, so use one of these instead. The glow's inner fade follows the rounded corners as long as the radius fits the box (at most half of its shorter side). For a pill that is wider than tall, leave `--fam-r` unset rather than setting a larger value. Also set `--fam-glow-depth`, `--fam-bleed`, the lens blur with `--fam-glass-blur` (default 14px) and `--fam-refract-blur` (default 1px, for refracting glass), and the saturation with `--fam-glass-saturate`, `--fam-glow-saturate` and `--fam-refract-saturate`. The thin clear rim is where the glow is strongest: `--fam-glow-saturate` and `--fam-glow-brightness` amplify it, `--fam-shade-inset` sets how wide the clear rim is and `--fam-glass-rim` sets the opacity of its edge line.

Set `--fam-glass-specular` on the glass itself (default `1`) to scale the highlight. `0` turns it off and `2` doubles it. It is a plain number without a unit, and it changes with a class or an inline style, with no script.

Add `fam-glass--refract` for clear glass that bends what is behind its rim. It needs the filter in `snippets/refraction-filter.html` somewhere in the page, once:

```html
<!-- paste the contents of snippets/refraction-filter.html -->
<div class="fam-glass fam-glass--refract"></div>
```

Refraction works in Chromium only. Other browsers show a clear glass pane with no bending. The rim also splits into a faint rainbow fringe, like light through a prism (chromatic aberration): the snippet bends the red, green and blue channels by slightly different amounts. The static snippet always bends by the defaults below. Its strength is the `scale` on each of its three `feDisplacementMap` passes.

The snippet's map is one fixed image stretched over the glass, so it bends the straight sides more than the corners of a rounded pane or a circle. For bending that follows the glass's own corner radius, also load the optional refraction script, the one piece of JavaScript the kit offers. It gives each `fam-glass--refract` a filter built from that element's size and radius, and rebuilds it when either changes, including a change to `--fam-r` or a `fam-round-*` class. The static filter stays in place as the fallback.

The script also reads two variables from the glass itself, set with a class or an inline style, and applies a change on the next frame:

- `--fam-refract-amount` (default `1`) multiplies the bending. `0` is flat glass, `2` bends twice as much.
- `--fam-refract-dispersion` (default `.1`) is the chromatic aberration: red bends that fraction further than green and blue that fraction less. `0` turns the fringe off.

Both are plain numbers without units. The script raises an error for a value that is not one, such as `2px`.

```html
<div class="fam-glass fam-glass--refract" style="--fam-refract-amount: 1.5; --fam-refract-dispersion: .2"></div>
```

```js
import 'fam-ui/refraction';
```

Without a bundler, load `node_modules/fam-ui/snippets/refraction-round.js` with `<script defer>` instead. It does nothing on the server, so it is safe to import from server-rendered code.

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
<button class="fam-plastic fam-plastic--blue fam-plastic--square" type="button" aria-label="Eject">E</button>
<span class="fam-knob" role="img" aria-label="Volume" style="--fam-knob-angle:35deg"></span>
```

Round and square buttons have a round dish. A disabled button sinks into its case with a darker face and a muted label.

Metal buttons are the same family in brushed metal, with `--round` and `--square` for icons:

```html
<button class="fam-metal-button" type="button">Eject</button>
<button class="fam-metal-button fam-metal-button--round" type="button" aria-label="Info">i</button>
```

Glossy and glass buttons are real buttons. The glossy one is the aqua pill (`fam-gloss-soft` and `fam-gloss-strong` dial its sheen) and the glass one is the frosted pill, so put it on a dark surface:

```html
<button class="fam-glossy-button" type="button">Save</button>
<button class="fam-glossy-button fam-glossy-button--silver" type="button">Cancel</button>
<button class="fam-glass fam-glass-button" type="button">Share</button>
<button class="fam-glass fam-glass--light fam-glass-button" type="button">Send</button>
<button class="fam-glass fam-glass--blue fam-glass-button" type="button">Save</button>
```

Glass is dark by default. Add `fam-glass--light` for light glass with dark text, or `fam-glass--blue` for blue glass with white text, which suits the primary or active control. The tints work on any frosted `fam-glass` (buttons, fields and plain panes), and on `fam-glass--refract`, which has no shade, they only change the text color and the rim. `fam-glass--refract fam-glass--light` gives clear glass with dark text for pale backdrops. Each one sets the shade and the text color together, so the text keeps its contrast.

Button groups put plastic, metal or glossy buttons in one case. Mark the lit button with `aria-pressed="true"` (or `aria-selected="true"` in a tab strip) and set it from your own script; a lit plastic or metal button shows an LED (`--fam-led`) that fades in and out, and one that can be lit but is not shows the dark lens, a lit silver glossy button turns aqua. A group of plastic or metal buttons sits in a well cut into the surface under it (the material darkened, an inset edge and 6px of padding); `fam-button-group--case` is a raised case instead. A long group scrolls inside itself. Leather buttons only group inside `fam-button-group--leather`: `fam-button-group fam-button-group--leather` with `fam-leather-button` cells is a pill of the leather navigation bar's leather, with the lit item cut as the same dark pocket.

```html
<div class="fam-button-group" role="group" aria-label="Playback mode">
  <button class="fam-plastic fam-plastic--square" type="button" aria-label="Mode 1" aria-pressed="false"></button>
  <button class="fam-plastic fam-plastic--square" type="button" aria-label="Mode 2" aria-pressed="true"></button>
</div>
```

A plastic button sits in a faint collar, as in the reference: a dark seam where it meets the surface, a translucent light ring and a soft shadow, all painted outside the button like a shadow, so leave about 6px around it. Pressing it sinks the face and darkens the seam while the collar stays put. Cells of a button group have no collar, because the group's well holds them. Colors are `--red`, `--green`, `--blue`, `--purple`, `--amber` and `--cream` (the pale plastic of the case in the reference, with a dark label). For any other color set `--fam-c` on a `fam-plastic`; check that the label reaches 4.5:1.

Tabs are button groups. Give the group `role="tablist"` and each button `role="tab"` with `aria-selected`; the lit tab is styled the same way a pressed button is. Use silver glossy buttons for the Snow Leopard strip, `fam-button-group--case` with `fam-plastic--cream` buttons for a padded plastic case, metal buttons, `fam-button-group--leather` with `fam-leather-button` for the leather navigation's leather, and `fam-wood fam-button-group fam-button-group--wood` with `fam-nav-item` buttons for its wood. The kit does not switch panels or move between tabs with the arrow keys; `showcase/tabs.js` is a small script that does.

```html
<div class="fam-wood fam-button-group fam-button-group--wood" role="tablist" aria-label="Sections">
  <button class="fam-nav-item" type="button" role="tab" aria-selected="true" aria-controls="library">Library</button>
  <button class="fam-nav-item" type="button" role="tab" aria-selected="false" aria-controls="shelf">Shelf</button>
</div>
```

Radio buttons are real radio inputs in a label, so arrow keys and forms work without JavaScript. Use `fam-radio--plastic`, `--metal`, `--glossy` or `--glass`; the plastic and metal ones are LEDs (`--fam-led`), dark when unchecked and glowing when checked, and the checked glass one turns blue.

```html
<label class="fam-radio fam-radio--plastic"><input type="radio" name="mode" checked><span class="fam-radio-dot"></span>Record</label>
<label class="fam-radio fam-radio--plastic"><input type="radio" name="mode"><span class="fam-radio-dot"></span>Play</label>
```

The plastic dial is drawn in CSS, so it is a picture like the knob. Give it `role="img"` and an `aria-label` that says its value; `--fam-knob-angle` turns its tick:

```html
<span class="fam-dial" role="img" aria-label="Volume" style="--fam-knob-angle:35deg"></span>
```

An LED is a standalone indicator lamp for the plastic panel and the metal. The lens is a photo of a real ringed lamp, tinted by CSS, so one pair of images gives every color: amber (`--fam-led`) by default, or `fam-led--green`, `--red` or `--blue`. Add `fam-led--lit` to light it and `fam-led--large` to make it bigger. The lens sits in a thin round well cut into the panel, like the one around a button group, and a lit LED's glow spills onto it; the well reaches 5px past the lens. The label is engraved unless it has `fam-led-label--printed`, which is flat ink. The lens is decorative, so put the state in `fam-visually-hidden` text, because a color alone does not tell everyone whether it is on. In forced colors a lit LED fills with the system highlight and an unlit one stays empty.

```html
<span class="fam-led fam-led--green fam-led--lit">
  <span class="fam-led-lens" aria-hidden="true"></span>
  <span class="fam-led-label">Ready</span>
  <span class="fam-visually-hidden">, on</span>
</span>
```

A toggle LED is a label that wraps a checkbox, driven like the switch: it is lit while checked, so it needs no JavaScript and works in forms. Give the input `role="switch"`; the label text is its name, so it needs no hidden state text. A disabled one sinks into its case like a disabled button. A lit LED comes on in about a tenth of a second and fades out over half a second, like a cooling lamp; the checked plastic and metal radios do the same, and `prefers-reduced-motion` turns both fades off.

```html
<label class="fam-led fam-led--green">
  <input type="checkbox" role="switch">
  <span class="fam-led-lens"></span>
  <span class="fam-led-label">Ready</span>
</label>
```

Navigation (use with `fam-wood`, `fam-metal`, `fam-metal-sandblasted` or `fam-leather-bar`; mark the current page with `aria-current="page"`):

```html
<nav class="fam-nav fam-wood" aria-label="Main">
  <span class="fam-nav-brand">Brand</span>
  <a class="fam-nav-item" href="/" aria-current="page">Home</a>
  <a class="fam-nav-item" href="/about">About</a>
</nav>
```

`fam-leather-bar` is the leather of the frames with a row of stitches along the bottom edge. Add `fam-leather-bar--black` for black leather, which switches the text to light.

```html
<nav class="fam-nav fam-leather-bar" aria-label="Main">...</nav>
<nav class="fam-nav fam-leather-bar fam-leather-bar--black" aria-label="Main">...</nav>
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

Zebra table, a table in a scrolling box with a sticky header, like the lists in Snow Leopard's Finder:

```html
<div class="fam-paper" style="padding: 20px">
  <div class="fam-table-box" role="region" aria-label="Files" tabindex="0" style="--fam-table-rows: 6">
    <table class="fam-table" aria-label="Files">
      <colgroup><col style="width:60%"><col style="width:40%"></colgroup>
      <thead><tr><th scope="col">Name</th><th scope="col">Size</th></tr></thead>
      <tbody>
        <tr><td>Receipt-01.png</td><td>2.6 MB</td></tr>
        <tr><td>Notes.txt</td><td>4 KB</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

The box draws every stripe once, in a gradient that scrolls with its content, and the rows are transparent. The empty stripes below the last row are therefore the same gradient as the real ones and line up with them. The stripes and the lines between the header cells are a see-through tint of one ink, so the paper or cardstock behind the table shows through. The header is an opaque band, because rows scrolling under a see-through header would show through it.

- `--fam-row-height`: the height of every row, the header and the empty stripes (default `24px`).
- `--fam-table-rows`: how many rows tall the box is, not counting the header (default `8`).
- `--fam-table-ink` and `--fam-table-stripe`: the ink color (default a dark brown) and the opacity of the stripes (default `.09`).
- `--fam-table-header`: the color of the header band.
- `fam-table-box--light-ink`: a light ink with light text, a dark header and a light focus ring, for dark materials such as brown cardstock (`--fam-cardstock-tint: #562a0e`). Contrast has been measured on paper and on brown cardstock only, so check it on any other material, including the kit's leather and wood, which are washed light.

Rows are one line high, which keeps the stripes aligned, so text that does not fit is cut short with an ellipsis. Give long text another way to be read, such as a wider column or a `title`. Set column widths with `<col>`; a table wider than its box scrolls sideways and the header stays at the top. Name the table with `aria-label` or a `<caption>`; the kit hides a caption visually, because it would sit inside the box and push every row off its stripe. A `<th scope="row">` in a body row is an ordinary cell, not a second header. A read-only box has `tabindex="0"` and `role="region"` so a keyboard user can scroll it.

For a selectable table, give the table `role="grid"` and every body row `aria-selected` (`"true"` on the chosen row), and style nothing else: the kit draws the selected row in the blue of a selected list row, and in forced colors in the system `Highlight` colors. The arrow-key behavior is yours to drive with whatever JavaScript you prefer, following the ARIA grid pattern. Make the rows the focus stops (`tabindex="-1"`, and `0` on the selected one) and leave `tabindex` off the box. `showcase/table-grid.js` is a small model of it. The box keeps a focused row clear of the sticky header on its own.

Small dark text on natural light cardstock cannot reach 4.5:1 at its worst pixel, because the cardstock's fibers are dark flecks. Put the table with dark ink on paper, and use light ink on brown cardstock.

## Effects

- Shadows: `fam-shadow-sm`, `fam-shadow-md`, `fam-shadow-lg`, `fam-shadow-inset`. The light is straight above, so every shadow falls straight down and grows with elevation. The three outer ones are stacks of layers that double in offset and blur, so a shadow is crisp at the edge and fades as it falls. They stay soft and casual.
- Cast shadows: `fam-cast-sm`, `fam-cast-md`, `fam-cast-lg`, the harsher and longer shadows of a raised plastic knob. Each size is longer and darker than the one before (they reach about 50px, 88px and 126px below the element). They need room below the element, and an ancestor with `overflow: hidden` clips them. The values are `--fam-cast-sm`, `--fam-cast-md` and `--fam-cast-lg`.
- Resting shadow: `fam-grounded-sm`, `fam-grounded-md`, `fam-grounded-lg` put a thin flat ellipse under the bottom edge, so the element looks set down on its surface. Each level is wider, taller and darker than the one before, and `lg` sits 2px below the edge, as if raised a little. The ellipse is set by `--fam-grounded-width`, `--fam-grounded-height`, `--fam-grounded-strength` (how dark the middle is), `--fam-grounded-gap` and `--fam-grounded-ink`. Leave about 8px clear below the element (14px for `lg`). The ellipse is painted above following non-positioned content, never above the element itself.
- On a plain element a shadow class sets its `box-shadow`. A `fam-shadow-sm/md/lg` or `fam-cast-sm/md/lg` class also lifts plastic and metal buttons, the dial, the knob and the thumb of a switch, whose track stays sunken: the class names its shadow in `--fam-elevation` and these controls add it to the shadows they draw. A pressed or disabled button has sunk into its case and loses the lift. `--fam-elevation` does not inherit, so a button inside an elevated card is not lifted too. On any other element that draws its own shadow, such as the pill, the glossy button, the frames and the templates, the class has no effect, so put it on a wrapper with the same radius, for example `<span class="fam-cast-md fam-round-pill" style="display: inline-block"><button class="fam-pill" type="button">Save</button></span>`. Make the wrapper `inline-block` or a block: an inline one is only as tall as a line of text, so its shadow would not match the element. `fam-grounded-*` draws its ellipse with the element's `::after` and shows nothing on an element that clips its overflow (`overflow: hidden` or `auto`) or has no `::after` (`<img>`, `<input>`), so put it on a wrapper for any element that does either. That covers most of the kit: every `fam-plastic`, `fam-metal-button`, `fam-pill`, `fam-glossy-button`, `fam-glass`, `fam-wood-frame`, `fam-print-frame`, `fam-stitched`, `fam-dial`, `fam-knob`, the cells of a `fam-button-group`, `fam-recessed`, `fam-menu`, `fam-progress` and the templates.
- Rounding: `fam-round-sm` (6px), `fam-round-md` (12px), `fam-round-lg` (20px), `fam-round-pill`. For a box inside padding, set `--fam-outer-radius` and `--fam-pad` on the outer box and use `fam-concentric` on the inner one, so the gap stays even.
- Aqua pill with a gloss you can dial: `fam-pill` with `fam-gloss-none`, `fam-gloss-soft` or `fam-gloss-strong`.
- Engraved text: `fam-engraved-metal` (on brushed or sandblasted metal), `fam-engraved-wood`, `fam-engraved-leather`, on the matching material.

## Templates

Working pages are in `examples/` in the source repository: a felt controls screen (`fam-screen`), a notes app (`fam-notes`, `fam-notes-list`, `fam-pad`, `fam-pad-bar`, `fam-pad-sheet`) and a sign-in card (`fam-signin`). `examples/frames.html` shows the photo frames and a corkboard in a wood frame. Copy the markup from there.

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
