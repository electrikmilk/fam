# Credits

Every texture in `assets/` is processed from a photograph on Unsplash. Unsplash photos are free to use. The photographers are credited here.

## Assets

| Asset | Source photo | Photographer | How it was made |
|---|---|---|---|
| `felt-gray-tile.jpg` | `felt_lele-wan-ZHD1jN0QXwM-unsplash.jpg` | lele-wan | `make_tile.py 0.5 512 60`, then `to_tint_tile.py` |
| `wood-light-tile.jpg` | `wood_smithsonian-e0pPip5TQRE-unsplash.jpg` | smithsonian | `make_tile.py 0.5 512 60 90` |
| `metal-tile.jpg` | `metal-brushed_apryan-widodo-tRrIXmtOmL4-unsplash.jpg` | apryan-widodo | `make_tile.py 0.55 512 14` |
| `metal-brushed.jpg` | `metal-brushed_apryan-widodo-tRrIXmtOmL4-unsplash.jpg` | apryan-widodo | processed copy, recipe not recorded |
| `metal-spiral.jpg` | `metal-spiral_fikri-rasyid-FnKKF2bATEE-unsplash.jpg` | fikri-rasyid | processed copy, recipe not recorded, scaled to 360px wide |
| `knob-face.jpg` | `metal-spiral_fikri-rasyid-FnKKF2bATEE-unsplash.jpg` | fikri-rasyid | `make_radial_face.py ... 2762 1509 450 288 1.0 0.6` |
| `grain-fine.jpg` | `grain_compagnons-ye8lWOjNUzI-unsplash.jpg` | compagnons | processed copy, recipe not recorded, made seamless with `make_tile.py 1.0 512 0` |
| `cardstock-tile.jpg` | `cardstock_kiwihug-qv05FvdE26k-unsplash.jpg` | kiwihug | `make_tile.py 0.3 512 80` |
| `legal-tile.jpg` | `lined-paper_heather-green-hKfKmfvPY44-unsplash.jpg` | heather-green | `make_legal_tile.py` |
| `paper-tile.jpg` | `paper_olga-thelavart-vS3idIiYxX0-unsplash.jpg` | olga-thelavart | `make_tile.py 0.3 512 80` |
| `leather-tile.jpg` | `leather_felipe-santana-xJkTCbtuqAY-unsplash.jpg` | felipe-santana | `make_tile.py 0.55 512 70` |
| `leather-fill-tan-tile.jpg` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `soft_interior.py`, then `tan_leather.py` |
| `leather-fill-black-tile.jpg` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `soft_interior.py` |
| `leather-frame-tan-soft.png` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `make_stitched_frame.py`, `soft_interior.py`, then `tan_leather.py` |
| `leather-frame-black-soft.png` | `leather-stitched_olga-kovalski-5_GUH12XnNc-unsplash.jpg` | olga-kovalski | `make_stitched_frame.py`, then `soft_interior.py` |

The scripts are in `tools/texture-pipeline/` and the source photos are in `textures/`.
