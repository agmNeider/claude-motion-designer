"""Builds the N.A.R. logo proposals as outlined SVG (no live text) from the design-system fonts.

Run: python3 brand/logo/build_logos.py  → writes brand/logo/proposals/*.svg
"""
import math
import os

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(ROOT, "..", "..", "design-system", "fonts")
OUT = os.path.join(ROOT, "proposals")

THEMES = {
    "claro": {"bg": "#f3eee7", "main": "#75533c", "accent": "#a8834b", "ink": "#241a15", "knock": "#f3eee7"},
    "oscuro": {"bg": "#231915", "main": "#c9a184", "accent": "#cfae72", "ink": "#f1eae1", "knock": "#231915"},
}


class Face:
    def __init__(self, path, wght=None):
        f = TTFont(path)
        if wght is not None:
            f = instancer.instantiateVariableFont(f, {"wght": wght})
        self.font = f
        self.gs = f.getGlyphSet()
        self.cmap = f.getBestCmap()
        self.upm = f["head"].unitsPerEm
        self.hmtx = f["hmtx"]

    def glyph(self, ch):
        return self.cmap[ord(ch)]

    def advance(self, ch):
        return self.hmtx[self.glyph(ch)][0]

    def bounds(self, ch):
        bp = BoundsPen(self.gs)
        self.gs[self.glyph(ch)].draw(bp)
        return bp.bounds  # xMin, yMin, xMax, yMax (font units, y up)

    def path(self, ch, affine):
        """affine = (a, b, c, d, e, f) mapping font units → SVG px."""
        sp = SVGPathPen(self.gs)
        self.gs[self.glyph(ch)].draw(TransformPen(sp, affine))
        return sp.getCommands()

    def text(self, s, x, baseline, size, tracking=0.0, fill="#000"):
        """Returns (svg, width). tracking in em."""
        k = size / self.upm
        out, cx = [], x
        for i, ch in enumerate(s):
            if ch != " ":
                d = self.path(ch, (k, 0, 0, -k, cx, baseline))
                out.append(f'<path d="{d}"/>')
            cx += self.advance(ch) * k + (tracking * size if i < len(s) - 1 else 0)
        return f'<g fill="{fill}">{"".join(out)}</g>', cx - x

    def width(self, s, size, tracking=0.0):
        k = size / self.upm
        return sum(self.advance(c) * k for c in s) + tracking * size * (len(s) - 1)

    def cap(self, size):
        b = self.bounds("H")
        return b[3] * size / self.upm


caslon = Face(os.path.join(FONTS, "LibreCaslonDisplay-Regular.woff2"))
caslon_it = Face(os.path.join(FONTS, "LibreCaslonText-Italic.woff2"))
hanken5 = Face(os.path.join(FONTS, "HankenGrotesk-Variable.woff2"), wght=500)
hanken3 = Face(os.path.join(FONTS, "HankenGrotesk-Variable.woff2"), wght=300)


def svg(w, h, body, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{rect}{body}</svg>'


def descriptor(x, baseline, size, fill, text="ABOGADOS & ASOCIADOS", tracking=0.32):
    return hanken5.text(text, x, baseline, size, tracking, fill)


# ---------------------------------------------------------------- 1 · La Balanza
def balanza_symbol(cx, base, h, t):
    """An 'A' that is also a scale: Caslon V turned 180° (a crossbar-less A), a level beam and two pans."""
    b = caslon.bounds("V")
    gw, gh = b[2] - b[0], b[3] - b[1]
    k = h / gh
    # rotate 180°: x' = -x, y' = -y (font) → svg: X = cx + k*(midx - x) ; Y = base - h + k*(y - yMin)
    midx = (b[0] + b[2]) / 2
    d = caslon.path("V", (-k, 0, 0, k, cx + k * midx, base - h - k * b[1]))
    w = gw * k
    beam_y = base - h * 0.58
    half = w * 0.66
    sw = max(1.5, h * 0.018)
    pan_r = w * 0.17
    drop = h * 0.22
    parts = [f'<path d="{d}" fill="{t["main"]}"/>']
    parts.append(f'<line x1="{cx-half:.1f}" y1="{beam_y:.1f}" x2="{cx+half:.1f}" y2="{beam_y:.1f}" stroke="{t["accent"]}" stroke-width="{sw:.2f}" stroke-linecap="round"/>')
    for sx in (-1, 1):
        px = cx + sx * half
        top = beam_y
        py = beam_y + drop
        parts.append(f'<path d="M{px:.1f} {top:.1f} L{px - pan_r*0.9:.1f} {py:.1f} M{px:.1f} {top:.1f} L{px + pan_r*0.9:.1f} {py:.1f}" stroke="{t["accent"]}" stroke-width="{sw*0.6:.2f}" fill="none"/>')
        parts.append(f'<path d="M{px-pan_r:.1f} {py:.1f} A{pan_r:.1f} {pan_r*0.55:.1f} 0 0 0 {px+pan_r:.1f} {py:.1f} Z" fill="{t["accent"]}"/>')
        parts.append(f'<circle cx="{px:.1f}" cy="{top:.1f}" r="{sw*1.3:.2f}" fill="{t["accent"]}"/>')
    return "".join(parts), w, half


def balanza_lockup(t):
    W, H = 1200, 440
    sym, w, half = balanza_symbol(250, 330, 220, t)
    x = 250 + half + w * 0.17 + 70
    size = 150
    word, ww = caslon.text("N.A.R.", x, 290, size, 0.04, t["main"])
    desc, dw = descriptor(x + 4, 350, 25, t["ink"], tracking=0.36)
    rule = f'<line x1="{x+4}" y1="316" x2="{x+ww}" y2="316" stroke="{t["accent"]}" stroke-width="1.5"/>'
    return svg(W, H, sym + word + rule + desc, t["bg"])


def balanza_mark(t):
    S = 400
    sym, w, half = balanza_symbol(200, 305, 220, t)
    return svg(S, S, sym, t["bg"])


# ---------------------------------------------------------------- 2 · El Sello
def ring_text(face, s, cx, cy, r, size, tracking, fill, center_deg, bottom=False):
    """Glyphs laid on a circle. Top arc reads clockwise; bottom arc reads left→right (counter-clockwise)."""
    k = size / face.upm
    total = face.width(s, size, tracking)
    ang_total = total / r  # radians along the arc
    out = []
    pos = 0.0
    for i, ch in enumerate(s):
        adv = face.advance(ch) * k
        mid = pos + adv / 2
        if not bottom:
            a = math.radians(center_deg) - ang_total / 2 + mid / r  # clockwise from top
            gx, gy = cx + r * math.sin(a), cy - r * math.cos(a)
            rot = math.degrees(a)
        else:
            a = math.radians(center_deg) + ang_total / 2 - mid / r
            gx, gy = cx + r * math.sin(a), cy - r * math.cos(a)
            rot = math.degrees(a) + 180
        if ch != " ":
            d = face.path(ch, (k, 0, 0, -k, -adv / 2, 0))
            base_shift = 0 if not bottom else face.cap(size)
            out.append(f'<path transform="translate({gx:.2f} {gy:.2f}) rotate({rot:.2f}) translate(0 {base_shift:.2f})" d="{d}"/>')
        pos += adv + tracking * size
    return f'<g fill="{fill}">{"".join(out)}</g>'


def sello_symbol(cx, cy, R, t, detail=True):
    parts = []
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="{t["main"]}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{R*0.92:.1f}" fill="none" stroke="{t["knock"]}" stroke-width="{R*0.012:.2f}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{R*0.66:.1f}" fill="none" stroke="{t["knock"]}" stroke-width="{R*0.012:.2f}"/>')
    if detail:
        fs = R * 0.105
        tr = R * 0.79 - fs * 0.35
        parts.append(ring_text(hanken5, "ABOGADOS & ASOCIADOS", cx, cy, tr, fs, 0.22, t["knock"], 0))
        parts.append(ring_text(hanken5, "SINCÉ · SUCRE", cx, cy, tr + fs * 0.7, fs, 0.3, t["knock"], 180, bottom=True))
        for sx in (-1, 1):
            parts.append(f'<circle cx="{cx + sx*R*0.79:.1f}" cy="{cy:.1f}" r="{R*0.022:.2f}" fill="{t["accent"] if t["knock"] != t["bg"] else t["knock"]}"/>')
    size = R * 0.44
    mono = "NAR"
    mw = caslon.width(mono, size, 0.0)
    cap = caslon.cap(size)
    g, _ = caslon.text(mono, cx - mw / 2, cy + cap / 2, size, 0.0, t["knock"])
    parts.append(g)
    parts.append(f'<line x1="{cx - R*0.2:.1f}" y1="{cy + cap/2 + R*0.1:.1f}" x2="{cx + R*0.2:.1f}" y2="{cy + cap/2 + R*0.1:.1f}" stroke="{t["knock"]}" stroke-width="{R*0.014:.2f}"/>')
    return "".join(parts)


def sello_mark(t):
    S = 400
    return svg(S, S, sello_symbol(200, 200, 176, t), t["bg"])


def sello_lockup(t):
    W, H = 1200, 440
    sym = sello_symbol(220, 220, 150, t)
    x = 430
    word, ww = caslon.text("N.A.R.", x, 250, 130, 0.04, t["main"])
    desc, dw = descriptor(x + 4, 310, 23, t["ink"], tracking=0.36)
    lema, _ = caslon_it.text("Tu tranquilidad, nuestra prioridad", x + 4, 356, 22, 0.0, t["main"])
    return svg(W, H, sym + word + desc + lema, t["bg"])


# ---------------------------------------------------------------- 3 · El Portal
def portal_symbol(x, y, w, h, t):
    """Arched doorway (the courthouse portal, the firm's rounded cards) with N·A·R set as an inscription."""
    r = w / 2
    d = f"M{x} {y+h} L{x} {y+r} A{r} {r} 0 0 1 {x+w} {y+r} L{x+w} {y+h} Z"
    parts = [f'<path d="{d}" fill="{t["main"]}"/>']
    ins = w * 0.09
    ri = r - ins
    d2 = f"M{x+ins} {y+h-ins} L{x+ins} {y+r} A{ri} {ri} 0 0 1 {x+w-ins} {y+r} L{x+w-ins} {y+h-ins}"
    parts.append(f'<path d="{d2}" fill="none" stroke="{t["accent"]}" stroke-width="{w*0.018:.2f}"/>')
    size = w * 0.36
    cap = caslon.cap(size)
    gap = (h - r * 0.55 - ins * 2 - cap * 3) / 3.2
    top = y + r * 0.55 + ins + gap * 0.6
    for i, ch in enumerate("NAR"):
        gw = caslon.width(ch, size)
        g, _ = caslon.text(ch, x + w / 2 - gw / 2, top + cap + i * (cap + gap), size, 0, t["knock"])
        parts.append(g)
    return "".join(parts)


def portal_mark(t):
    S = 400
    return svg(S, S, portal_symbol(125, 40, 150, 320, t), t["bg"])


def portal_lockup(t):
    W, H = 1200, 440
    sym = portal_symbol(150, 60, 130, 300, t)
    x = 350
    word, ww = hanken3.text("NAR", x, 250, 150, 0.32, t["main"])
    desc, dw = descriptor(x + 6, 318, 25, t["ink"], tracking=0.42)
    rule = f'<line x1="{x+6}" y1="282" x2="{x+6+dw}" y2="282" stroke="{t["accent"]}" stroke-width="1.5"/>'
    return svg(W, H, sym + word + rule + desc, t["bg"])


def main():
    os.makedirs(OUT, exist_ok=True)
    builders = {
        "1-balanza": (balanza_lockup, balanza_mark),
        "2-sello": (sello_lockup, sello_mark),
        "3-portal": (portal_lockup, portal_mark),
    }
    for name, (lock, mark) in builders.items():
        for tn, t in THEMES.items():
            open(os.path.join(OUT, f"{name}-horizontal-{tn}.svg"), "w").write(lock(t))
            open(os.path.join(OUT, f"{name}-simbolo-{tn}.svg"), "w").write(mark(t))
    print("ok", sorted(os.listdir(OUT)))


if __name__ == "__main__":
    main()
