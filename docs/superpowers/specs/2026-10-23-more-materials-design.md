# More materials and variants design

Date: 2026-10-23
Status: draft for approval, then planning

Adds new materials and material variants to the kit (`css/materials.css`, `css/components.css`, `css/effects.css`, textures in `assets/`) and shows them on the showcase Materials page (`showcase/materials.html`).

## Intent and why

The owner wants more materials to choose from. New materials get engraved text where it makes sense, the second metal gets its own metal buttons, and navigation bars exist only on wood (plain and paneled), leather (stitched), metal, paper and cardstock.

## Requested materials

- **Leather**: a leather material based on the regular leather frame, and an alternate leather. The owner suggested `textures/leather-bound_jayanth-muppaneni-m5o4dOHAibM-unsplash.jpg` for the alternate, as a dark brown leather that is not the tan of the current one, or all three leathers if that photo is not usable. The owner hoped for "another stitched leather type".
- **Metal**: rename the current metal to brushed metal, class `fam-metal-brushed`, and add a second metal as plain `fam-metal` from `textures/metal_katie-harp-TnQE5X48FMA-unsplash.jpg` (fine sandblasted gray).
- **Paneled wood**: a wood for navigation bars and as a material, if it can be made to work. Source photo: `textures/dark-wood_the-cleveland-museum-of-art-AD8nr59mr5c-unsplash.jpg`, a dark walnut board whose grain is built into six separate planks. The first candidate, a photo of planks with bolts in it, was too soft next to the other materials.
- **Linen**: a new texture that can be tinted, from whichever linen photo works better. Candidates: `linen_logan-voss-sFGj4Lj1un8` (clear weave) and `linen_smithsonian-NlrtBD3Iw7I` (flat yellow).
- **Cardboard**: one cardboard, `cardboard_kiwihug-bPaRBSuvRPA` (linerboard ridges). The owner dropped the flecked chipboard variant.
- **Denim**: `denim_mike-hindle-Js5Qi_X1qzo` (dark gray twill).
- **Paper bag**: `paper-bag_heather-green-xr_ra5j9wPI` (golden kraft).

All photos are already in `textures/` and are Unsplash photos, credited the same way as the existing ones.

## Goals

- Every material above is a material class that works on any box, tiles seamlessly without stretching, and loads its texture only when used.
- Navigation bars (`fam-nav` plus the material class), with readable text and a selected item, exist only for wood, paneled wood, stitched leather, brushed and sandblasted metal, paper and cardstock. Linen, cardboard, denim, paper bag and leather with no stitched edge get none.
- Engraved text classes (`fam-engraved-*`) exist for the materials where engraving makes sense. The builder decides which ones.
- Sandblasted metal has its own metal buttons, which group, take the LED and press like the brushed ones.
- Linen and denim take a tint like the felt does. Tintability is a goal for linen and not required for the others.
- Each material and each navigation bar is shown on the Materials page, with a markup example like the existing ones.
- New work meets the kit's standards: WCAG AA contrast measured on rendered pixels, a focus ring, forced colors, reduced motion, and tile files between 13 KB and 85 KB.
- `README.md`, `CREDITS.md` (with the exact processing command for each new asset) and the tests are updated.

## Non-goals

- Changing glass, plastic, felt, cardstock, paper, cork, legal pad or the existing frames.
- New components. Only existing ones (navigation bar, metal button, engraved text) gain variants.
- New JavaScript.

## Decided by the owner

- Navigation bars only on wood, leather, metal, paper and cardstock, and no bar on leather without a stitched edge. This replaced an earlier call that every new material gets a bar. I read the list as also asking for paper and cardstock bars, which did not exist before, and treated paper bag as its own material with no bar.
- The current metal is renamed brushed metal with the class `fam-metal-brushed`, and the sandblasted metal is plain `fam-metal`. This replaced an earlier call to keep `fam-metal` as the brushed one.
- The paneled wood must hold up next to the other materials in fidelity, or be removed.
- The design is approved.

## Calls I made (the owner can change these)

- **Names**: `fam-metal-button` stays the brushed button and sandblasted buttons are `fam-metal-button--sandblasted`; the owner named only the surfaces, so the button names are my call. Paneled wood is `fam-wood-paneled`. Names for the leathers, linen, cardboard, denim and paper bag follow the same `fam-<material>` pattern, and the builder picks them.
- **Leathers**: keep the current `fam-leather` (all three leathers exist, which the owner allowed). Add one plain material from the regular leather frame's fill (the pebbled leather) and one dark brown alternate. The alternate is probably not the `leather-bound` photo alone, because that photo is bright orange with a smooth grain and one vertical stitch line, which cannot repeat as a tile. The frame's own photo (`leather-stitched_olga-kovalski`) is already dark brown before the tan and black processing, so a dark brown stitched frame and bar edge may be cheap to cut with the existing pipeline. The builder checks this and picks the better source, and `leather-bound` is used only if it works.
- **Tinting**: linen and denim become grayscale tiles tinted by `--fam-tint` with `multiply`, like the felt, with a default tint of dark gray for linen and an indigo for denim. Cardboard and paper bag keep their photo colors, like paper and cork.
- **Paneled wood tile**: built from the walnut board photo by `make_planks_tile.py`, with each plank cut from a different place on the board. It must tile without a visible seam or repeat; if it cannot, paneled wood is dropped and the owner is told. No substitute is shipped.
- **Alternate leather stitching**: stitching is not required. If a dark brown stitched frame and bar edge do not cut well, a plain dark brown leather is acceptable, and the owner is told it is not stitched.
- **Contrast**: the same rendered-pixel contrast audit the kit already runs (`tools/contrast-audit.mjs`, `tests/contrast.test.mjs`), at the default tint, for navigation bar text and for engraved text. A custom tint on linen or denim is the user's responsibility, as it is for the felt.
- **Tile size**: 13 KB to 85 KB describes the current tiles and is a guideline. A tile that needs more to avoid a visible seam can go over, and the reason is recorded in `CREDITS.md`.

## Left to the builder

- Exact class names for the leathers, linen, cardboard, denim and paper bag.
- Crops, tile sizes and processing recipes, using the scripts in `tools/texture-pipeline/` and adding one only if no existing script fits.
- Which materials get engraved classes, and whether dark materials (denim, paneled wood, dark leather) use light text instead.
- How the navigation bar's selected item looks on each material, following the existing wood, metal and leather bars.
- Layout of the new swatches and navigation bars on the Materials page.
- Commit order: one commit per material.
