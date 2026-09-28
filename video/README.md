# Video · N.A.R. Abogados & Asociados

Motion-design video (1080×1920, 30 fps, 32 s) with an original score, both generated with JavaScript from one shared beat grid.

| File | What |
| --- | --- |
| `timeline.js` | 120 BPM grid, scenes, on-screen copy, hit and transition times. Picture and music both read it. |
| `scene.js` | Canvas renderer: `drawFrame(t)` paints any instant deterministically. |
| `music.js` | Synthesizes `out/musica.wav` (pad, bass, arpeggio, drums, risers, impacts, reverb). |
| `render.js` | Captures every frame in headless Chromium and muxes H.264 + AAC with ffmpeg. |
| `index.html` | Preview player: open through a local server, scrub or play with the music. |
| `assets/` | Seal layers (from `brand/logo/build_sello.py`) and icon paths. |

```sh
node video/render.js                     # → video/out/nar-abogados.mp4
node video/render.js --stills 4.2,9.6    # → video/out/stills/*.png
```

To change copy, phones or timing, edit `timeline.js` and render again; music and picture stay in sync.
