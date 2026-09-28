"""Final N.A.R. logo — El Sello. Outlined SVGs with true knock-outs (masks), so every mark works on any ground.

Run: python3 brand/logo/build_sello.py  → writes brand/logo/final/*.svg
"""
import os

from build_logos import caslon, caslon_it, hanken5, ring_text

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "final")

NOGAL, NOGAL_OSC, MARFIL, ESPRESSO, INK, LINO = "#75533c", "#c9a184", "#f1eae1", "#231915", "#241a15", "#f3eee7"

RING_TOP = "ABOGADOS & ASOCIADOS"
RING_BOTTOM = "SINCÉ · SUCRE"


def seal_cutouts(cx, cy, R, simple=False, only=None):
    """Everything carved out of the disc, drawn in black for use inside a <mask>.
    only: None (all), "rings", "text" or "mono" — separate layers for animation."""
    k = "#000"
    sw = R * 0.014
    rings = [
        f'<circle cx="{cx}" cy="{cy}" r="{R*0.925:.2f}" fill="none" stroke="{k}" stroke-width="{sw:.2f}"/>',
        f'<circle cx="{cx}" cy="{cy}" r="{R*(0.64 if not simple else 0.80):.2f}" fill="none" stroke="{k}" stroke-width="{sw:.2f}"/>',
    ]
    if only == "rings":
        return "".join(rings)
    parts = [] if only else rings
    if not simple and only in (None, "text"):
        fs = R * 0.112
        r_top = R * 0.78 - fs * 0.36
        parts.append(ring_text(hanken5, RING_TOP, cx, cy, r_top, fs, 0.2, k, 0))
        parts.append(ring_text(hanken5, RING_BOTTOM, cx, cy, r_top + fs * 0.72, fs, 0.34, k, 180, bottom=True))
        for sx in (-1, 1):
            parts.append(f'<circle cx="{cx + sx*R*0.78:.2f}" cy="{cy:.2f}" r="{R*0.026:.2f}" fill="{k}"/>')
    if only == "text":
        return "".join(parts)
    size = R * (0.43 if not simple else 0.56)
    mono = "NAR"
    tracking = 0.015
    mw = caslon.width(mono, size, tracking)
    cap = caslon.cap(size)
    base = cy + cap / 2 - R * 0.03
    g, _ = caslon.text(mono, cx - mw / 2, base, size, tracking, k)
    parts.append(g)
    rw = R * (0.17 if not simple else 0.22)
    ry = base + R * (0.1 if not simple else 0.12)
    parts.append(f'<line x1="{cx-rw:.2f}" y1="{ry:.2f}" x2="{cx+rw:.2f}" y2="{ry:.2f}" stroke="{k}" stroke-width="{sw*1.1:.2f}" stroke-linecap="round"/>')
    return "".join(parts)


_mask_n = [0]


def seal(cx, cy, R, color, simple=False):
    _mask_n[0] += 1
    mid = f"sello-{_mask_n[0]}"
    return (
        f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="{cx-R}" y="{cy-R}" width="{2*R}" height="{2*R}">'
        f'<rect x="{cx-R}" y="{cy-R}" width="{2*R}" height="{2*R}" fill="#fff"/>{seal_cutouts(cx, cy, R, simple)}</mask>'
        f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="{color}" mask="url(#{mid})"/>'
    )


def svg(w, h, body, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{rect}{body}</svg>'


def horizontal(seal_color, word_color, desc_color, lema_color, with_lema=True):
    W, H = 1240, 400
    R = 160
    pad = 40  # clear space = R/4
    body = seal(pad + R, H / 2, R, seal_color)
    x = pad + 2 * R + 64
    word, ww = caslon.text("N.A.R.", x, 222, 128, 0.04, word_color)
    desc, dw = hanken5.text("ABOGADOS & ASOCIADOS", x + 4, 276, 22.5, 0.37, desc_color)
    body += word + desc
    if with_lema:
        lema, _ = caslon_it.text("Tu tranquilidad, nuestra prioridad", x + 4, 322, 21, 0.0, lema_color)
        body += lema
    return svg(W, H, body)


def main():
    os.makedirs(OUT, exist_ok=True)
    files = {
        # primary seal
        "nar-sello-nogal.svg": svg(400, 400, seal(200, 200, 200, NOGAL)),
        "nar-sello-marfil.svg": svg(400, 400, seal(200, 200, 200, MARFIL)),
        "nar-sello-espresso.svg": svg(400, 400, seal(200, 200, 200, INK)),
        # small sizes (under 64 px)
        "nar-sello-simple-nogal.svg": svg(400, 400, seal(200, 200, 200, NOGAL, simple=True)),
        "nar-sello-simple-marfil.svg": svg(400, 400, seal(200, 200, 200, MARFIL, simple=True)),
        # horizontal lockups
        "nar-horizontal-claro.svg": horizontal(NOGAL, NOGAL, INK, NOGAL),
        "nar-horizontal-oscuro.svg": horizontal(NOGAL_OSC, NOGAL_OSC, MARFIL, NOGAL_OSC),
        "nar-horizontal-sin-lema-claro.svg": horizontal(NOGAL, NOGAL, INK, NOGAL, with_lema=False),
        "nar-horizontal-sin-lema-oscuro.svg": horizontal(NOGAL_OSC, NOGAL_OSC, MARFIL, NOGAL_OSC, with_lema=False),
        # Instagram profile picture: the frame is the disc, IG crops it round
        "nar-perfil-instagram.svg": svg(1080, 1080, f'<rect width="1080" height="1080" fill="{LINO}"/>' + seal(540, 540, 500, NOGAL)),
    }
    for name, content in files.items():
        with open(os.path.join(OUT, name), "w") as fh:
            fh.write(content)
    print("\n".join(sorted(files)))
    # Animation layers for the video: black shapes on transparent, R = 400.
    layers = os.path.join(os.path.dirname(OUT), "..", "..", "video", "assets")
    os.makedirs(layers, exist_ok=True)
    for part in ("rings", "text", "mono"):
        with open(os.path.join(layers, f"sello-{part}.svg"), "w") as fh:
            fh.write(svg(800, 800, seal_cutouts(400, 400, 400, only=part)))


if __name__ == "__main__":
    main()
