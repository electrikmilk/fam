# Realistic shadows design

Date: 2026-10-27
Status: approved by the owner on 2026-10-27 (a builder check has been run and its findings folded in); next is the implementation plan

Makes the kit's elevation shadows more natural, adds opt-in cast shadows like the knob in `references/plastic copy.png`, and adds a "resting on a surface" shadow like the icon in `references/Screenshot 2026-10-27 at 16.34.29.png`. The changes are in `css/tokens.css` and `css/effects.css`, shown on the Materials page of the showcase (`showcase/materials.html`) and documented in `README.md`.

## Intent and why

The owner wants shadows that look like natural shadows and fit the skeuomorphic textured materials. Material UI's shadows are the model: shadows built from several layers and scaled by elevation. Realism should be a choice. The current shadows stay gentle and casual by default, since dramatic shadows are too harsh for many uses. The long, dark shadows of the plastic reference are available when someone wants them.

Seeing the mockups, the owner picked one technique: **contact-hardening**. A stack of layers where each layer doubles the offset and blur of the one before. The shadow is dark and crisp where the object touches the surface, then softens and fades the farther it falls. The owner said it looks the most realistic.

## Goals

- One light for the whole kit: straight above, so every shadow falls straight down. Shadow size scales with elevation.
- Replace the values of `--fam-shadow-sm`, `--fam-shadow-md` and `--fam-shadow-lg` with gentler contact-hardening stacks. They remain the soft, casual default. The names stay, so `fam-shadow-sm/md/lg` and any consumer override keep working.
- New cast shadow classes in three lengths, `fam-cast-sm`, `fam-cast-md` and `fam-cast-lg`, with matching tokens, for the harsher, longer, plastic-reference look. These are opt-in.
- New classes for the resting shadow in three levels, `fam-grounded-sm`, `fam-grounded-md` and `fam-grounded-lg`, each wider, taller and darker than the one before (the owner asked for levels after the first build): a thin flat ellipse under the element's bottom edge, as if it sits on the surface. It is made with a pseudo-element, the shape the owner chose over a crescent made from an ordinary shadow.
- The showcase shows the new shadows next to the existing ones on the Materials page, with the markup to copy. `README.md` documents them.
- Shadows look right on the kit's materials, including dark ones such as felt and brown cardstock, not only on light surfaces.

## Non-goals

- Rewriting the many shadows hardcoded in components, materials and templates (plastic, switch, wood frame, pill and so on). Only the tokens and the new classes change. The owner agreed to leave those alone for now.
- Changing `--fam-shadow-inset` or `fam-shadow-inset`.
- A light angle the consumer can tilt. The light is fixed, straight above.
- Shadows that follow an irregular shape. Cast shadows follow the element's box and its `border-radius`.
- New images, JavaScript or dependencies.

## Anti-goals

- Elevation shadows that look harsher or more dramatic than today's. A page that already uses `fam-shadow-md` should still look casual after the change. The test is a guardrail: the new `sm`, `md` and `lg` reach no more than 2px farther and have no more total alpha than today's (see the table under The recipes).
- A cast shadow that darkens the element itself or erases the element's own inset shading.
- A resting-shadow ellipse that blocks clicks, adds layout space, or shifts the element.

## Decided by the owner

- One light, one direction, sizes scaling by elevation.
- Three kinds of shadow: elevation (the existing `sm`, `md`, `lg`, made more natural), cast (new, harsh and long) and resting (new, from the icon reference).
- Contact-hardening is the technique (mockup B, `.superpowers/brainstorm/41246-1793138868/content/cast-shadow-options.html`).
- The resting shadow is the true flat ellipse made with a pseudo-element (mockup B in `elevation-cast-resting.html`), not the crescent.
- The plastic reference is the example for the cast shadows.
- The three cast sizes get progressively longer and darker (mockup `cast-sizes-v3.html`).

## The recipes

These are the values from the mockups the owner looked at. The builder may tune them.

Elevation, replacing the current tokens:

- `sm`: `0 1px 1px rgba(0,0,0,.2), 0 2px 3px rgba(0,0,0,.12), 0 3px 3px -1px rgba(0,0,0,.06)`
- `md`: `0 1px 1px rgba(0,0,0,.14), 0 2px 2px rgba(0,0,0,.1), 0 4px 4px -1px rgba(0,0,0,.1), 0 8px 8px -3px rgba(0,0,0,.12), 0 12px 12px -5px rgba(0,0,0,.1)`
- `lg`: `0 1px 1px rgba(0,0,0,.12), 0 2px 2px rgba(0,0,0,.09), 0 4px 4px -1px rgba(0,0,0,.09), 0 8px 8px -2px rgba(0,0,0,.09), 0 16px 16px -4px rgba(0,0,0,.1), 0 28px 28px -8px rgba(0,0,0,.12)`

The mockup the owner saw used slightly longer values for `md` and `lg`. These are tuned so the guardrail below holds. "Reach" is the largest offset plus blur plus spread of any layer (a negative spread shortens it), and "total alpha" is the sum of the layers' alphas.

| Token | Reach today | Reach here | Total alpha today | Total alpha here |
|-------|-------------|------------|-------------------|------------------|
| `sm`  | 4px         | 5px        | .40               | .38              |
| `md`  | 18px        | 19px       | .56               | .56              |
| `lg`  | 52px        | 48px       | .82               | .61              |

Cast, new. Each size is longer and darker than the one before:

- `sm`: `0 1px 1px rgba(0,0,0,.38), 0 2px 2px rgba(0,0,0,.26), 0 4px 4px -1px rgba(0,0,0,.22), 0 8px 8px -2px rgba(0,0,0,.2), 0 16px 16px -4px rgba(0,0,0,.18), 0 30px 28px -8px rgba(0,0,0,.16)`
- `md`, about 20% darker than `sm`: `0 1px 1px rgba(0,0,0,.46), 0 2px 2px rgba(0,0,0,.31), 0 4px 4px -1px rgba(0,0,0,.26), 0 8px 8px -2px rgba(0,0,0,.24), 0 16px 16px -4px rgba(0,0,0,.22), 0 32px 32px -8px rgba(0,0,0,.19), 0 56px 48px -16px rgba(0,0,0,.17)`
- `lg`, about 45% darker than `sm`: `0 1px 1px rgba(0,0,0,.55), 0 2px 2px rgba(0,0,0,.38), 0 4px 4px -1px rgba(0,0,0,.32), 0 8px 8px -2px rgba(0,0,0,.29), 0 16px 16px -4px rgba(0,0,0,.29), 0 32px 32px -8px rgba(0,0,0,.26), 0 60px 52px -14px rgba(0,0,0,.26), 0 84px 64px -22px rgba(0,0,0,.2)`

The owner asked for each size to be longer and darker than the one before, and approved these values in the mockup `cast-sizes-v3.html`. They share their first layers' offsets and blurs and differ in alpha and in how far they reach. The builder may still tune them if the shadows look wrong on a material.

Resting ellipse, as a pseudo-element under the element: about 88% of its width, about 8px tall, starting at the element's bottom edge, filled with `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.6) 0%, rgba(0,0,0,.3) 45%, rgba(0,0,0,0) 72%)`, and `pointer-events: none`. It has no negative `z-index`: that hides it behind the background of the surface the element sits on, unless the surface makes its own stacking context. Starting at the bottom edge means painting above the element never covers its face.

Resting levels (width, height, strength of the middle, and how far below the edge it starts): `sm` is 80%, 6px, 50% and flush with the edge; `md` is 88%, 8px, 60% and flush, which is the mockup the owner chose; `lg` is 96%, 12px, 70% and 2px below the edge, as if raised a little. These values are my pick, and the builder may tune them.

## Constraints

- Plain CSS in the existing layers. Class names start with `fam-` and variables with `--fam-`. The bundle is rebuilt with `npm run build`.
- The resting ellipse uses `::after`, and many kit elements already use `::after` (`fam-pill`, `fam-glossy-button`, `fam-glass`, `fam-wood-frame`, `fam-print-frame`, `fam-stitched`, round and square `fam-plastic`, the radio dot and the LED lens). The class must not break any of them, and the README must say which elements it can't go on directly and what to do instead.
- `--fam-rest-shadow` is already a component variable for button shadows, so the new names must not collide with it.
- Cast shadows are long, so the README must warn that they need room around the element and are clipped by an ancestor with `overflow: hidden`.

## Calls I made (the owner can change these)

- **Names.** Tokens `--fam-cast-sm`, `--fam-cast-md` and `--fam-cast-lg` and classes `fam-cast-sm`, `fam-cast-md` and `fam-cast-lg`. The resting classes are `fam-grounded-sm`, `fam-grounded-md` and `fam-grounded-lg`, with variables for the ellipse size and color. I avoided "rest" because of `--fam-rest-shadow`. The builder may rename them to fit the kit better.
- **Where the new classes live.** Beside the existing `fam-shadow-*` rules in `css/effects.css`, and the tokens beside the existing ones in `css/tokens.css`.
- **Wrapper for incompatible elements.** For an element whose `::after` is taken, `fam-grounded-*` goes on a wrapping element instead. The ellipse sizes to whatever box carries the class.
- **Showcase.** The elevation chips scene on the Materials page (`showcase/materials.html`) gains cast and grounded examples, each with a copyable class, in the style of the existing chips. No new page.
- **Tests.** `tests/showcase.test.mjs` checks the computed shadows of `sm`, `md`, `lg` and `inset` in the showcase, and `tests/fixtures/kit.html` has them too. Extend both with the cast classes and the grounded one. Add one browser test that checks the grounded ellipse is behind the element, is below its bottom edge, and does not catch pointer events. Rebuild and refresh any README size claims that `tests/claims.test.mjs` checks.
- **Dark materials.** Black shadows on dark materials such as felt are weaker than on light ones. I am not adding a separate dark version. If the shadows look weak on felt or brown cardstock, the builder may raise the alphas of the cast shadows (not the elevation ones, which are held by the guardrail), then says what changed and shows the owner the result. The builder does not stop work to ask, and does not add a dark variant.
- **Elevation guardrail.** The owner asked for shadows that are more realistic without being too harsh, so I turned that into the rule that the new elevation shadows are no longer than today's by more than 2px and no darker in total alpha. This was my call; the mockup the owner saw was slightly longer for `md` and `lg`.

## Left to the builder

- The final alpha and offset values after viewing the shadows on every material in the showcase.
- How the cast and grounded classes combine with elements that set their own `box-shadow`, such as `fam-plastic`, so they do not erase the element's inset shading.
- The exact grounded ellipse size and softness.
