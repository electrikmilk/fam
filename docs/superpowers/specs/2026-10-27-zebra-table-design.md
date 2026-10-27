# Zebra table design

Date: 2026-10-27
Status: draft for approval, then planning (a builder check has been run and its findings folded in)

Adds a tabular list with zebra rows to the kit (`css/components.css`), shown on the Controls page of the showcase (`showcase/controls.html`), with an optional showcase-only script for row selection (`showcase/`).

## Intent and why

The owner is rounding out the UI controls. The kit has `fam-list` and `fam-list-row` for a single-column list of links, but nothing for tabular details such as a file list or a process list, like the lists in Mac OS X Snow Leopard's Finder and Activity Monitor (`references/snow-leopard-leak-2495228360.png` and `references/mac-os-x^2009^10.6-snow-leopard-finder-cover-flow-2208504789.png`): a header row, header dividers, alternating row stripes, and stripes that carry on below the last row so the box always looks full.

In this kit the table usually sits on paper or cardstock, and the owner wants it to work on many materials without being complicated.

## Goals

- A table in a fixed-height box that scrolls, with a sticky header row, dividers between the header cells (and no lines down the body columns) and zebra rows.
- Empty placeholder stripes that fill the box below the last row, drawn with a repeating background gradient, not extra elements.
- The row height is a variable, `--fam-row-height`, and the stripe color and strength are variables. Changing the row height keeps the real rows and the placeholder stripes lined up.
- The stripes, header band and header dividers are a see-through tint of one "ink" color over whatever material is behind the table, so the grain of paper, cardstock or any other material shows through. Dark ink is the default, for light materials. One modifier switches to light ink for dark materials such as brown cardstock. That is the only switch needed to use the table on another material.
- Optional row selection. A selected row uses the blue of `fam-list-row`. The kit styles the selected state only. Arrow-key and click behavior come from a small script in `showcase/`, following `tabs.js`.
- Meets the kit's accessibility standards (see Accessibility).
- Shown on the Controls page, with markup examples, and documented in `README.md`.

## Non-goals

- Shipping JavaScript in the kit. The package consumer drives selection with whatever JavaScript they prefer. The showcase script only demonstrates it.
- Sortable columns, resizable columns, column reordering, multi-select, editing in cells and virtual scrolling.
- The `role="listbox"` pattern. A listbox cannot contain columns.
- Rows that wrap to more than one line.
- Changing `fam-list`, `fam-list-row`, `fam-menu` or any material.

## Anti-goals

- A table that looks right only on paper. Trying it on brown cardstock, leather or wood should take one modifier and no new CSS.
- Stripes that drift out of line with the rows, or placeholder stripes that screen readers announce.

## Decided by the owner

- The treatment is translucent ink (mockups B and C in `.superpowers/brainstorm/`): stripes that let the material show through, with a light-ink version for dark materials.
- It should be usable on many materials, as long as that is not complex.
- The table is a fixed-height box that scrolls, with a sticky header.
- Semantics follow the correction below: a real `<table>` for a read-only table, and `role="grid"` with a selected row for the selectable one. It is not a `listbox`.
- Selection is optional. The interactivity is a showcase-only script, like `tabs.js`.
- Row height and possibly color are variables.
- Lines separate the header cells only, as in the Snow Leopard lists, not the body columns (added after the first build).

## Accessibility

- Read-only: a real `<table>` with `<thead>`, `<th scope="col">` and `<caption>` or `aria-label`.
- Selectable: `role="grid"` on the table, `aria-selected="true"` on the selected `<tr>`, following the ARIA Authoring Practices grid pattern with row selection. The kit does not add the arrow-key behavior.
- The scrolling box is focusable (`tabindex="0"`) with `role="region"` and an `aria-label`, so keyboard users can scroll it (WCAG 2.1.1).
- Placeholder stripes are a background, so they have no semantics.
- Text, header text and selected-row text meet 4.5:1 against the rendered stripes, measured by the existing contrast audit (`tools/contrast-audit.mjs`, `tests/contrast.test.mjs`) at the default ink, for both ink modifiers.
- A visible focus ring, drawn like the kit's other focus rings.
- Forced colors: the selected row uses `Highlight` and `HighlightText`, as `fam-list-row` does, and the header and dividers are carried by borders, because the mode drops gradients and shadows.
- Selected state is not carried by color alone (it has the blue band and `aria-selected`; in forced colors it uses the system colors).

## Constraints

- Plain CSS in the existing layers. Class names start with `fam-` and variables with `--fam-`. The bundle is rebuilt with `npm run build`.
- No JavaScript in `css/`, and no new dependencies.
- No new images. The ink is made from CSS colors.

## Calls I made (the owner can change these)

- **Names.** `fam-table-box` is the scrolling box, `fam-table` is the `<table>`, and `fam-table-box--light-ink` is the light-ink modifier. The builder may rename them to fit the kit better.
- **Variables.** `--fam-row-height` (default 24px), `--fam-table-ink` (the ink color, default a warm dark brown `rgb(60, 40, 10)` from the mockup), `--fam-table-stripe` (stripe opacity, default about .09 from the mockup), and `--fam-table-rows` for how many rows tall the box is (default 8, so the box height is the header plus rows at `--fam-row-height`). The header is one row tall by default.
- **One gradient.** The scroll box draws the stripes once, with a repeating gradient that scrolls with the content, and the real rows are transparent. The real rows and the placeholders are then the same gradient, so they line up by construction and can't drift. This requires every row to have a fixed height with one-line cells, which is why wrapping is a non-goal. Cell text that doesn't fit is cut with an ellipsis, so the full text should be available another way, such as a wider column or a `title`. The README says so.
- **Placeholder parity.** The placeholder stripes continue the pattern after the last real row.
- **Light ink.** A light cream ink, taken from the mockup (`rgb(255, 235, 200)`), with light text and a dark header band.
- **Selected row.** The blue gradient and white text from `fam-list-row`, with the same focus ring approach, and the script sets `aria-selected`. Single-select only.
- **Showcase.** A new scene on the Controls page named "Zebra tables", added to its scene list. It shows a read-only table on paper, a selectable one on cardstock, and a light-ink one on brown cardstock. The script is `showcase/table-grid.js`, written like `tabs.js` (an object on `window.FamShowcase`).
- **Tests.** The contrast audit (`tools/contrast-audit.mjs`, `tests/contrast.test.mjs`) loads the showcase pages and `examples/`, not `tests/fixtures/kit.html`, so the tables on `showcase/controls.html` are what it measures, at 1440px and 375px wide. Raise `MINIMUM_MEASURED['showcase-controls']` to reflect the new text. The forced-colors and focus tests use `tests/fixtures/kit.html`, so add the tables there too. Add one browser test, in the style of the existing ones, that checks the header stays put while the rows scroll and that the placeholder stripes line up with the rows. The audit skips text scrolled out of view, so only visible rows are measured.
- **Sticky header.** The header stays the same translucent ink as the stripes, so the material shows through it. Rows must not slide visibly under it. The builder looks for a CSS-only way to keep the header band from showing scrolled rows behind it. If there is no clean way, the header becomes an opaque band of the ink laid over a solid color (the material's grain is lost in the header only), and the owner is told.
- **Narrow widths.** The table uses fixed column layout and the consumer sets column widths (`<col>` elements or `width` on `<th>`), and the examples show how. The box scrolls horizontally as well as vertically when the columns need more room, and the header stays stuck to the top while scrolling in both directions. Cell text is still one line with an ellipsis.
- **Light ink contrast.** The ink colors and strengths in this document come from the mockups and are a starting point. If the audit fails at the worst pixel, the builder may change the ink color, stripe strength, header darkness or text color to pass, and says what changed.

## Left to the builder

- The exact stripe, header and divider colors and strengths, after checking the contrast audit.
- Whether the first body row is striped, and where the stripe pattern starts relative to the header.
- How the focus ring draws on a row or on the box, and whether rows or cells take focus in the showcase script.
- The scene layout, copy and example data on the Controls page.
- Commit order: one commit for the CSS, one for the showcase scene and script, one for the tests, and one for the README.
