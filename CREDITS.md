# Credits

Every texture in `assets/` is processed from a photograph on Unsplash. Unsplash photos are free to use. The photographers are credited here.

## Assets

| Asset | Source photo | Photographer | How it was made |
|---|---|---|---|
| `felt-gray-tile.jpg` | `felt_lele-wan-ZHD1jN0QXwM-unsplash.jpg` | lele-wan | `make_tile.py 0.5 512 60`, then `to_tint_tile.py` |
| `linen-tile.jpg` | not in the repository | logan-voss | `make_tile.py 0.3 384 40`, then `to_gray_tint_tile.py ... 215 18` |
| `denim-tile.jpg` | not in the repository | mike-hindle | `make_tile.py 0.2 512 40`, then `to_gray_tint_tile.py ... 200 24` |
| `wood-light-tile.jpg` | `wood_smithsonian-e0pPip5TQRE-unsplash.jpg` | smithsonian | `make_tile.py 0.5 512 60 90` |
| `wood-paneled-tile.jpg` | not in the repository | the-cleveland-museum-of-art | `make_planks_tile.py ... 768 21`, six planks cut from different places on one walnut board, with scratches filtered out |
| `metal-tile.jpg` | `metal-brushed_apryan-widodo-tRrIXmtOmL4-unsplash.jpg` | apryan-widodo | `make_tile.py 0.55 512 14` |
| `metal-sandblasted-tile.jpg` | not in the repository | katie-harp | `make_tile.py 0.9 512 40` |
| `metal-brushed.jpg` | `metal-brushed_apryan-widodo-tRrIXmtOmL4-unsplash.jpg` | apryan-widodo | processed copy, recipe not recorded |
| `metal-spiral.jpg` | `metal-spiral_fikri-rasyid-FnKKF2bATEE-unsplash.jpg` | fikri-rasyid | processed copy, recipe not recorded, scaled to 360px wide |
| `knob-face.jpg` | `metal-spiral_fikri-rasyid-FnKKF2bATEE-unsplash.jpg` | fikri-rasyid | `make_radial_face.py ... 2762 1509 450 288 1.0 0.6` |
| `grain-fine.jpg` | `grain_compagnons-ye8lWOjNUzI-unsplash.jpg` | compagnons | processed copy, recipe not recorded, made seamless with `make_tile.py 1.0 512 0` |
| `grain-plastic.jpg` | `grain_compagnons-ye8lWOjNUzI-unsplash.jpg` | compagnons | `stretch_contrast.py grain-fine.jpg OUT 4` |
| `cardstock-tile.jpg` | `cardstock_kiwihug-qv05FvdE26k-unsplash.jpg` | kiwihug | `make_tile.py 0.3 512 80` |
| `legal-tile.jpg` | `lined-paper_heather-green-hKfKmfvPY44-unsplash.jpg` | heather-green | `make_legal_tile.py` |
| `paper-tile.jpg` | `paper_olga-thelavart-vS3idIiYxX0-unsplash.jpg` | olga-thelavart | `make_tile.py 0.3 512 80` |
| `cardboard-tile.jpg` | not in the repository | kiwihug | `make_tile.py 0.2 512 60` |
| `lined-paper-tile.jpg` | `lined-paper_heather-green-hKfKmfvPY44-unsplash.jpg` | heather-green | `make_ruled_tile.py ... 1000 1563 2618 2618 300 648 648`, twelve rules from one rule to the rule twelve below it |
| `grid-paper-tile.jpg` | not in the repository | juliette-jardin | `make_grid_tile.py ... 2044 965 166.5 171.25 12 2 48`, twelve squares across and down, with the crumpled sheet's grid straightened |
| `blackboard-tile.jpg` | not in the repository | noita-digital | `make_tile.py 0.35 512 70` |
| `chalkboard-tile.jpg` | not in the repository | aleyna-catak | `make_tile.py 0.45 512 70`, from the center so the ledge and chalk at the bottom of the photo are left out |
| `paper-bag-tile.jpg` | not in the repository | heather-green | `make_tile.py 0.3 512 60`, from the center so the photo's fold shadow is left out |
| `cork-tile.jpg` | not in the repository | josephine-barham | `make_tile.py 0.3 512 60` |
| `leather-tile.jpg` | `leather_felipe-santana-xJkTCbtuqAY-unsplash.jpg` | felipe-santana | `make_tile.py 0.55 512 70` |
| `leather-fill-tan-tile.jpg` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `soft_interior.py`, then `tan_leather.py` |
| `leather-fill-black-tile.jpg` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `soft_interior.py` |
| `leather-frame-tan-soft.png` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `make_stitched_frame.py`, `soft_interior.py`, then `tan_leather.py` |
| `leather-fill-brown-tile.jpg` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `brown_leather.py leather-frame-black-soft.png leather-fill-black-tile.jpg OUT 68 28`, from the finished black assets because the frame recipe's arguments were not recorded |
| `leather-frame-brown-soft.png` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `brown_leather.py` as above |
| `leather-frame-black-soft.png` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `make_stitched_frame.py`, then `soft_interior.py` |
| `leather-bar-edge-tan.png` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `make_bar_edge.py leather-frame-tan-soft.png OUT 68 50` |
| `leather-bar-edge-black.png` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `make_bar_edge.py leather-frame-black-soft.png OUT 68 50` |
| `leather-bar-edge-brown.png` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `make_bar_edge.py leather-frame-brown-soft.png OUT 68 50` |
| `wood-frame.jpg` | not in the repository | se-tsuchiya | `make_wood_frame.py ... 556 28` |
| `led-lens-lit.png` | `tao-yuan-R4Hv6RnF05Q-unsplash.jpg` | tao-yuan | `make_led_lens.py ... 278 258 128 128 3 0.5` |
| `led-lens-unlit.png` | `tao-yuan-R4Hv6RnF05Q-unsplash.jpg` | tao-yuan | `make_led_lens.py ... 809 261 120 128 3 0.6` |

The scripts are in `tools/texture-pipeline/` and the source photos that are in the repository are in `textures/`. A row that says "not in the repository" was made from a photo that is not committed, so that asset cannot be rebuilt from a clone; its photographer is still credited.

`examples/tree.jpg` is the photo on the frames example page, by mehrab-sium (Unsplash), resized.

`showcase/images/ribbon.jpg` is the photo by boliviainteligente (Unsplash), resized. `showcase/images/tree.jpg` is the same tree photo as `examples/tree.jpg`.

`examples/snow-leopard.jpg` and `showcase/images/snow-leopard.jpg` are the landscape photo on the frames example and Materials pages. [Snow leopard in snow 2](https://commons.wikimedia.org/wiki/File:Snow_leopard_in_snow_2.jpg) by [Nicolas Goulet](https://www.flickr.com/photos/nicolasgoulet/5361403415/) is licensed under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) (modified). The photo was edited and resized.
