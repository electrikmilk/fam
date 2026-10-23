# Controls refinements and missing controls design

Date: 2026-10-23
Status: draft for approval, then planning

Refines the controls shown on the showcase Controls page (`showcase/controls.html`, styles in `css/components.css` and `css/effects.css`) and adds the common controls the kit is missing. The kit's own design is `docs/superpowers/specs/2026-10-22-fam-ui-design.md`. It is plain CSS with no JavaScript in the kit, so every new control has to work that way.

## Reference images (in `references/`)

- `plastic.png` - the plastic look to match. A four-cell grouped strip in one case with a round dish in each cell (the selected cell has an orange LED dot), a ridged plastic knob, round dished buttons with a bezel, a cream dial, toggles and rockers.
- `0522_macosx-1962914377.jpg` - iTunes on brushed metal: glossy buttons grouped into joined sets.
- `6uw2l17xk3f61-213512688.jpg` - Panther brushed metal toolbar with grouped glossy buttons and a round-ended search field.
- `snow-leopard-gui-2079776605.png` - the Snow Leopard tab strip, radio buttons, checkboxes and segmented buttons.
- `soft-aqua-ui-kit-m7andrew-1624450458.png` - glossy and glass buttons on a dialog.
- `97212fd179cf8af7e1c2a11cd5e63e60deaac8ed-3208769525.png` - a dark inset button whose text is faded and sunk into the face. This is the look wanted for a disabled plastic button.
- `93e7758259b6c1254864bf6614e3f21e-3748576914.png` - round and pill buttons on a brushed metal plate (a reference for metal buttons).

## Intent and why

The Controls page is meant to show each control alone with its variants and its disabled look. Disabled plastic buttons currently just fade, which reads as a broken button. The owner wants them to read as a button you cannot press yet, and wants the plastic to look like the plastic in `plastic.png`. The page is also missing tabs, radio buttons, and glossy and glass buttons, and has no metal button or plastic dial.

## Goals

- Disabled plastic buttons look inset, with faded text, and are also a little faded overall as disabled controls normally are.
- Plastic buttons look like `plastic.png`: the look comes mostly from a standard CSS gradient and shading, with the grain there only to add texture.
- Round and square plastic buttons have a circular dish like the reference.
- An optional button group, like the reference's grouped strip, for plastic buttons.
- Metal buttons, alongside plastic ones.
- The progress tubes shown on a metal surface on the Controls page.
- Tabs, in two styles: the Snow Leopard tab strip, and tabs that suit each material.
- Radio buttons in four styles: plastic, metal, glossy and glass. The plastic and metal ones glow like an LED when selected.
- Glossy and glass buttons shown on the Controls page.
- A plastic material with grain, based on the plastic buttons and controls, so controls can sit on it.
- A plastic dial, shown in the showcase on that plastic material.
- Glossy grouped buttons on metal, like the reference images.
- Every new control meets the kit's standards: keyboard focus ring, WCAG AA contrast measured on rendered pixels, a disabled look, forced colors and reduced motion.

## Non-goals

- Changing the leather button, switch, or the existing knob picture.
- JavaScript in the kit.

## Anti-goals (a failure even if it technically works)

- A disabled plastic button that is only faded, with no inset.
- A plastic button that looks like a flat gradient with the grain doing all the work, or the reverse, grain so strong it looks dirty.
- A new control that looks right on the page but cannot be reproduced from the package's classes and markup shown beneath it.

## Decisions

Each item is what the owner said unless marked as my call.

### Plastic buttons

- Disabled: inset, faded text, and still a little faded overall.
- The circular dish (inset) is on round and square plastic buttons. **My call:** wide labeled pill buttons keep the plain gradient, since a circle does not fit them.
- Grouping is optional, so a lone button is unchanged. **My call:** in a group the buttons share one case with shared outer corners and dividers, and a selected cell shows an LED dot as in `plastic.png`.
- **My call:** keep `.fam-plastic` as the plastic button class and its color modifiers, so existing markup keeps working.

### Metal buttons

- A new metal button, made like the plastic ones. **My call:** class `fam-metal-button`, after `fam-leather-button`. It gets the same disabled look, group option and focus ring.

### Progress tubes

- Move the tubes onto a metal stage on the Controls page. The tube styles themselves stay.

### Glossy and glass buttons

- Show glossy buttons (the aqua look of `.fam-pill`) and glass buttons (the frosted look of `.fam-glass`) as real `<button>` elements on the Controls page.
- Glossy buttons can be grouped, and a grouped glossy set is shown on metal like the iTunes and Panther references.
- **My call:** the exact class names, and whether glossy buttons are built on `.fam-pill` or are new classes, are left to the builder, as long as the existing `.fam-pill` and `.fam-glass` markup keeps working.

### Radio buttons

- Plastic and metal radios glow like an LED when selected.
- Glossy and glass radios.
- **My call:** glossy and glass radios show the selected state with a dot and do not glow. Every radio is a real `<input type="radio">` so grouping, arrow keys and form behavior come from the browser.

### Tabs

- Two styles: the Snow Leopard tab strip, and tabs that suit each material (**my call:** leather, metal and plastic).
- **My call:** tabs are styled from `role="tablist"`, `role="tab"` and `aria-selected`. The kit does not switch panels. The showcase demo switches panels the way the existing pairings switcher does.

### Plastic material and dial

- A grainy plastic material class based on the plastic buttons. **My call:** `fam-plastic-panel`, because `fam-plastic` is already the button.
- A plastic dial shown on that material. **My call:** drawn in CSS (a gradient and ridged edge) rather than as a photo, with the same angle variable as the metal knob (`--fam-knob-angle`).

### Showcase

- The Controls page gets a section for each new control, each with its copyable markup block and its disabled look, as the existing sections have. Update the jump links at the top.
- Update the README's list of controls and the Controls page description.

### Calls made after the builder check (mine)

- **Group markup:** a group is a wrapper with `role="group"` and an accessible name, holding ordinary buttons. A selected cell is a button with `aria-pressed="true"`, set by the author, and the LED dot is styled from that attribute. Single-select behavior is the author's, not the kit's.
- **Tab keyboard model:** tabs are `<button role="tab">` elements, so every tab is in the Tab order and a disabled tab uses native `disabled`. Arrow-key movement between tabs needs a few lines of script, which the showcase demo supplies and the markup block notes. The kit stays JavaScript-free.
- **Plastic dial:** decorative like the existing knob. It is `role="img"` with an `aria-label` that states its value, so it has no focus ring or disabled look.
- **Glass button contrast:** measured on the dark felt stage the existing glass fields use, because that is where the page shows them.
- **Metal buttons:** round and square metal buttons get the same circular dish as plastic. Wide labeled pills stay plain.

## Constraints

- Plain CSS in the existing layers (`tokens`, `materials`, `effects`, `components`, `templates`), `fam-` and `--fam-` names, sentence case in copy, no em dashes.
- Keep to the existing tests and update them where the controls change: `tests/components.test.mjs`, `tests/disabled.test.mjs`, `tests/focus-contrast.test.mjs`, `tests/contrast.test.mjs`, `tests/showcase.test.mjs` and the `tests/fixtures/kit.html` fixture. Run `npm test` and `npm run audit` before calling it done.
- New photo textures are not wanted unless the builder finds the look impossible without one. Any new texture goes in `assets/` and `CREDITS.md`.

## Left to the builder

- Exact class names for the glossy and glass buttons, radios, tabs and group.
- The gradients, shadows and sizes that make the plastic and metal match the references.
- LED colors and glow strength, provided the selected state is also clear without color.
- The build order. Suggested: plastic buttons and group, metal buttons, progress on metal, glossy and glass buttons, radios, tabs, plastic panel and dial.
