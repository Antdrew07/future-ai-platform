# -*- coding: utf-8 -*-
"""
Generate the Peptides 4 Power Reconstitution Guide eBook (one page per peptide).

Design follows the supplied P4P_Preview (Ipamorelin) template, improved with:
  - branded dark header band + extracted P4P logo
  - color-coded category system
  - computed mg/ml concentration column
  - clean info cards (Cycle / Administration / Storage / Purpose)
  - cover page + clickable table of contents

Usage:  python3 generate_guide.py
Output: Peptides4Power_Reconstitution_Guide.pdf
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import Table, TableStyle, Paragraph
from reportlab.lib.styles import ParagraphStyle

from peptides_data import PEPTIDES, validate_unique

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "assets", "p4p_logo.png")
OUT = os.path.join(HERE, "Peptides4Power_Reconstitution_Guide.pdf")

PAGE_W, PAGE_H = letter            # 612 x 792
MARGIN = 42
CW = PAGE_W - 2 * MARGIN           # content width

# ---- palette ----
NAVY      = HexColor("#0C1E30")    # header band / titles
NAVY_DEEP = HexColor("#081626")
INK       = HexColor("#1B2A38")    # body text
GRAY      = HexColor("#5C6E7C")    # muted text
RULE      = HexColor("#D9E2EA")
ACCENT    = HexColor("#1FA5E6")    # P4P bright blue
ACCENT_DK = HexColor("#1565A6")
TINT      = HexColor("#EAF4FC")    # light row / card fill
TINT2     = HexColor("#F4F9FD")
WHITE     = colors.white

# per-category accent (kept in the blue/teal family for brand cohesion)
CAT_COLORS = {
    "GH & Muscle Support":       HexColor("#1FA5E6"),
    "Healing & Recovery":        HexColor("#16B8A6"),
    "Fat Loss & Metabolism":     HexColor("#2E7DE0"),
    "Longevity & Mitochondrial": HexColor("#7A5CD0"),
    "Cognitive & Mood":          HexColor("#4C8DF0"),
    "Immunity & Inflammation":   HexColor("#1FB36B"),
    "Hair, Skin & Cosmetic":     HexColor("#D5599E"),
    "Amino Blends":              HexColor("#E08A2E"),
    "Bioregulators":             HexColor("#2BA6C4"),
}

DISCLAIMER = ("Peptides 4 Power  |  peptides4power.us  |  For Research Use Only  -  "
              "Not For Human Consumption  -  Consult a Healthcare Professional")
STORAGE = ("Store lyophilized vial in fridge (2-8°C); freezer for long term. "
           "Once mixed, refrigerate and use within ~30 days. Keep out of light.")
STORAGE_PREMIX = ("Premixed solution - keep refrigerated (2-8°C) and protected "
                  "from light. Do not freeze. Use by the labeled date.")


def storage_for(p):
    for vial, bac, _ in p["rows"]:
        if "premix" in (vial + bac).lower() or bac.strip().lower() == "n/a":
            return STORAGE_PREMIX
    return STORAGE


# ----------------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------------
def wrap_lines(text, font, size, maxw):
    """Greedy word-wrap -> list of lines that each fit maxw."""
    words = str(text).split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if stringWidth(trial, font, size) <= maxw:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def draw_wrapped(c, text, x, y, font, size, maxw, leading, color=INK, max_lines=None):
    c.setFillColor(color)
    c.setFont(font, size)
    lines = wrap_lines(text, font, size, maxw)
    if max_lines:
        lines = lines[:max_lines]
    for ln in lines:
        c.drawString(x, y, ln)
        y -= leading
    return y


def mg_of(s):
    """Parse a single vial mass token -> mg (float) or None if not simple."""
    s = s.strip().lower()
    if "/" in s or "premix" in s or s in ("n/a", ""):
        return None
    try:
        if "mcg" in s:
            return float(s.replace("mcg", "").strip()) / 1000.0
        if "mg" in s:
            num = s.replace("mg", "").strip()
            if "-" in num:            # e.g. "500-600mg/ml" already filtered by '/'
                return None
            return float(num)
    except ValueError:
        return None
    return None


def ml_of(bac):
    """Total reconstitution volume in ml, or None."""
    b = bac.strip().lower()
    if "premix" in b or b == "n/a" or b == "":
        return None
    total = 0.0
    found = False
    for part in b.replace("+", " ").split():
        if part.endswith("ml"):
            try:
                total += float(part[:-2])
                found = True
            except ValueError:
                pass
        else:
            try:                      # bare number preceding a stripped 'ml'
                total += float(part)
                found = True
            except ValueError:
                pass
    return total if found else None


def concentration(vial, bac):
    mg, ml = mg_of(vial), ml_of(bac)
    if mg is None or ml is None or ml == 0:
        return "—"
    v = mg / ml
    txt = (f"{v:.0f}" if abs(v - round(v)) < 1e-6 else f"{v:.2f}".rstrip("0").rstrip("."))
    return f"{txt} mg/ml"


def benefits_from_purpose(purpose):
    return [b.strip().capitalize() for b in purpose.split(".") if b.strip()]


def about_text(p):
    purpose_low = ", ".join(b.strip().lower() for b in p["purpose"].split(".") if b.strip())
    return (f"{p['name']} is a research-grade peptide referenced for {purpose_low}. "
            f"{p['note']} The table below lists the recommended bacteriostatic (BAC) water per "
            f"vial size and the matching draw on a U-100 insulin syringe.")


# ----------------------------------------------------------------------------
# page furniture
# ----------------------------------------------------------------------------
def header_band(c, category, page_label):
    h = 58
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - h, PAGE_W, h, stroke=0, fill=1)
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - h - 3, PAGE_W, 3, stroke=0, fill=1)   # accent underline
    # logo
    try:
        lw, lh = 1200, 480
        target_h = 38
        target_w = target_h * lw / lh
        c.drawImage(LOGO, MARGIN, PAGE_H - h + (h - target_h) / 2.0,
                    width=target_w, height=target_h, mask="auto",
                    preserveAspectRatio=True)
    except Exception:
        pass
    # right side: category + label
    cat_col = CAT_COLORS.get(category, ACCENT)
    c.setFillColor(HexColor("#9FC7E6"))
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 22, page_label.upper())
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 40, category.upper())
    # category color tick
    c.setFillColor(cat_col)
    c.circle(PAGE_W - MARGIN - stringWidth(category.upper(), "Helvetica-Bold", 12) - 10,
             PAGE_H - 36, 3.2, stroke=0, fill=1)


def footer(c, page_num):
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.line(MARGIN, 40, PAGE_W - MARGIN, 40)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN, 30, DISCLAIMER)
    c.setFillColor(ACCENT_DK)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawRightString(PAGE_W - MARGIN, 30, f"Page {page_num}")


def section_label(c, text, x, y, accent, size=12):
    c.setFillColor(accent)
    c.rect(x, y - 1, 4, size + 1, stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x + 10, y, text)
    return y


# ----------------------------------------------------------------------------
# peptide page
# ----------------------------------------------------------------------------
def peptide_page(c, p, page_num):
    """Larger-type layout that vertically fills the page.

    Block heights are measured first, then the leftover vertical space is
    shared out as breathing room between sections so the content reaches the
    bottom of the page instead of leaving a blank lower half.
    """
    cat_col = CAT_COLORS.get(p["category"], ACCENT)
    header_band(c, p["category"], "Reconstitution Guide")

    # ---- type scale ----
    BODY, BODY_LEAD = 12, 16.5
    LABEL_FS = 14
    benefits = benefits_from_purpose(p["purpose"])

    # ---- pre-measure variable blocks ----
    col_gap = 26
    left_w = CW * 0.55
    right_x = MARGIN + left_w + col_gap
    right_w = CW - left_w - col_gap

    about_lines = wrap_lines(about_text(p), "Helvetica", BODY, left_w)
    about_h = 22 + len(about_lines) * BODY_LEAD
    ben_h = 22
    for b in benefits:
        ben_h += max(1, len(wrap_lines(b, "Helvetica", BODY, right_w - 16))) * BODY_LEAD + 3
    col_block_h = max(about_h, ben_h)

    # dosing table
    headers = ["Vial Size", "BAC Water", "Concentration", "Units to Draw", "Frequency", "Dose / Injection"]
    col_w = [74, 96, 86, 76, 92, 108]   # = 532 = CW
    cell = ParagraphStyle("cell", fontName="Helvetica", fontSize=10.5, leading=12.5,
                          textColor=INK, alignment=1)
    head = ParagraphStyle("head", fontName="Helvetica-Bold", fontSize=9.6, leading=11.5,
                          textColor=WHITE, alignment=1)
    vpad = 15                              # taller rows
    data = [[Paragraph(h, head) for h in headers]]
    for (vial, bac, units) in p["rows"]:
        data.append([Paragraph(vial, cell), Paragraph(bac, cell),
                     Paragraph(concentration(vial, bac), cell), Paragraph(units, cell),
                     Paragraph(p["freq"], cell), Paragraph(p["dose"], cell)])
    tbl = Table(data, colWidths=col_w)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT_DK),
        ("LINEBELOW", (0, 0), (-1, 0), 1.4, ACCENT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), vpad), ("BOTTOMPADDING", (0, 0), (-1, -1), vpad),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, RULE),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
    ]
    for r in range(1, len(data)):
        style.append(("BACKGROUND", (0, r), (-1, r), TINT2 if r % 2 else TINT))
    tbl.setStyle(TableStyle(style))
    _, th = tbl.wrap(CW, 600)
    table_block_h = 24 + th

    # info cards
    cards = [("CYCLE", p["cycle"]),
             ("ADMINISTRATION", p.get("admin", "Subcutaneous injection")),
             ("STORAGE", storage_for(p)),
             ("PURPOSE", p["purpose"].replace(" . ", ", "))]
    card_gap = 12
    card_w = (CW - 3 * card_gap) / 4.0
    card_val_lead = 13.5
    max_card_lines = max(len(wrap_lines(v, "Helvetica", 10, card_w - 18)) for _, v in cards)
    card_h = max(108, 34 + max_card_lines * card_val_lead)

    # notes
    note_lines = wrap_lines("Notes:  " + p["note"], "Helvetica-Oblique", 11, CW - 24)
    notes_h = 18 + len(note_lines) * 14

    # ---- vertical justification ----
    # fixed top: title + tagline + rule
    title_top = PAGE_H - 58 - 34
    rule_y = title_top - 22 - 18           # after title and tagline
    region_top = rule_y - 10
    region_bottom = 58                      # just above footer line
    available = region_top - region_bottom
    blocks_h = col_block_h + table_block_h + card_h + notes_h
    bottom_cushion = 20
    # share the leftover space across the 3 gaps between the 4 blocks so the
    # notes box settles just above the footer instead of leaving a blank lower half
    distributable = available - blocks_h - bottom_cushion
    gap = max(16, min(120, distributable / 3.0)) if distributable > 0 else 16

    # ---- draw: title / tagline / rule ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(MARGIN, title_top, p["name"])
    c.setFillColor(cat_col)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN, title_top - 22, "  ·  ".join(benefits))
    c.setStrokeColor(RULE)
    c.setLineWidth(0.8)
    c.line(MARGIN, rule_y, PAGE_W - MARGIN, rule_y)

    # ---- two columns ----
    top = region_top
    section_label(c, "About This Peptide", MARGIN, top, cat_col, LABEL_FS)
    draw_wrapped(c, about_text(p), MARGIN, top - 22, "Helvetica", BODY, left_w, BODY_LEAD, INK)

    section_label(c, "Key Benefits", right_x, top, cat_col, LABEL_FS)
    yb = top - 22
    for b in benefits:
        c.setFillColor(cat_col)
        c.setFont("Helvetica-Bold", BODY)
        c.drawString(right_x, yb, "✓")
        c.setFillColor(INK)
        c.setFont("Helvetica", BODY)
        for ln in wrap_lines(b, "Helvetica", BODY, right_w - 16):
            c.drawString(right_x + 16, yb, ln)
            yb -= BODY_LEAD
        yb -= 3

    y = top - col_block_h - gap

    # ---- dosing table ----
    section_label(c, "Reconstitution & Dosing Guide", MARGIN, y, cat_col, LABEL_FS)
    tbl.drawOn(c, MARGIN, y - 22 - th)
    y = y - table_block_h - gap

    # ---- info cards ----
    cx = MARGIN
    for label, value in cards:
        c.setFillColor(TINT2)
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        c.roundRect(cx, y - card_h, card_w, card_h, 5, stroke=1, fill=1)
        c.setFillColor(cat_col)
        c.rect(cx, y - 4, card_w, 4, stroke=0, fill=1)
        c.setFillColor(ACCENT_DK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(cx + 9, y - 20, label)
        draw_wrapped(c, value, cx + 9, y - 36, "Helvetica", 10, card_w - 18,
                     card_val_lead, INK, max_lines=8)
        cx += card_w + card_gap
    y = y - card_h - gap

    # ---- notes ----
    c.setFillColor(HexColor("#FFF8E8"))
    c.setStrokeColor(HexColor("#E9D8A6"))
    c.setLineWidth(0.8)
    c.roundRect(MARGIN, y - notes_h, CW, notes_h, 5, stroke=1, fill=1)
    c.setFillColor(HexColor("#7A5B12"))
    ny = y - 17
    c.setFont("Helvetica-Oblique", 11)
    for ln in note_lines:
        c.drawString(MARGIN + 12, ny, ln)
        ny -= 14

    footer(c, page_num)
    c.showPage()


# ----------------------------------------------------------------------------
# cover + contents
# ----------------------------------------------------------------------------
def _vgradient(c, x, y, w, h, top_hex, bottom_hex, steps=140):
    """Fake a vertical gradient with thin bands (top_hex at top)."""
    tr, tg, tb = (int(top_hex[i:i + 2], 16) for i in (1, 3, 5))
    br, bg, bb = (int(bottom_hex[i:i + 2], 16) for i in (1, 3, 5))
    bh = h / steps
    for i in range(steps):
        t = i / (steps - 1)
        r = (tr + (br - tr) * t) / 255.0
        g = (tg + (bg - tg) * t) / 255.0
        b = (tb + (bb - tb) * t) / 255.0
        c.setFillColorRGB(r, g, b)
        c.rect(x, y + h - (i + 1) * bh, w, bh + 0.6, stroke=0, fill=1)


def cover_page(c, total_peptides, total_cats, cats):
    # gradient backdrop (deep navy -> slightly lighter toward top)
    _vgradient(c, 0, 0, PAGE_W, PAGE_H, "#0A2238", "#050E18")

    # decorative molecular dot motif (faint)
    import math
    c.saveState()
    c.setFillColor(ACCENT)
    for (ox, oy, rad, n) in [(120, PAGE_H - 120, 34, 6), (PAGE_W - 110, 150, 28, 6)]:
        c.setFillAlpha(0.10)
        for k in range(n):
            a = 2 * math.pi * k / n
            c.circle(ox + rad * math.cos(a), oy + rad * math.sin(a), 4, stroke=0, fill=1)
            c.setLineWidth(0.8)
            c.setStrokeColor(ACCENT)
            c.setStrokeAlpha(0.10)
            c.line(ox, oy, ox + rad * math.cos(a), oy + rad * math.sin(a))
        c.circle(ox, oy, 4.5, stroke=0, fill=1)
    c.restoreState()

    # top + bottom accent bars
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 7, PAGE_W, 7, stroke=0, fill=1)
    c.rect(0, 0, PAGE_W, 7, stroke=0, fill=1)
    c.setFillColor(ACCENT_DK)
    c.rect(0, PAGE_H - 11, PAGE_W, 4, stroke=0, fill=1)
    c.rect(0, 7, PAGE_W, 4, stroke=0, fill=1)

    # soft radial glow behind the logo (brand look)
    c.saveState()
    glow_cx, glow_cy = PAGE_W / 2, PAGE_H - 205
    for i in range(22, 0, -1):
        c.setFillColor(ACCENT)
        c.setFillAlpha(0.020)
        c.circle(glow_cx, glow_cy, i * 9, stroke=0, fill=1)
    c.restoreState()

    # logo
    try:
        lw, lh = 1200, 480
        tw = 400
        th = tw * lh / lw
        c.drawImage(LOGO, (PAGE_W - tw) / 2, PAGE_H - 260, width=tw, height=th,
                    mask="auto", preserveAspectRatio=True)
    except Exception:
        pass

    c.setFillColor(HexColor("#8FBFE6"))
    c.setFont("Helvetica-Bold", 12.5)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 300, "P E R F O R M A N C E    ·    S C I E N C E    ·    P O W E R")

    # thin rule above title
    c.setStrokeColor(ACCENT_DK)
    c.setLineWidth(1)
    c.line(PAGE_W / 2 - 150, PAGE_H - 320, PAGE_W / 2 + 150, PAGE_H - 320)

    # title
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 372, "THE PEPTIDE")
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 414, "RECONSTITUTION")
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 456, "& DOSING GUIDE")

    c.setFillColor(HexColor("#C9DCEC"))
    c.setFont("Helvetica", 12.5)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 486,
                        "Mixing ratios  ·  BAC water  ·  Syringe draw  ·  Frequency  ·  Cycle")

    # stat pill
    c.setFillColor(ACCENT_DK)
    pill_w, pill_h = 330, 36
    c.roundRect((PAGE_W - pill_w) / 2, PAGE_H - 540, pill_w, pill_h, 18, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 528,
                        f"{total_peptides} PEPTIDES  ·  {total_cats} CATEGORIES  ·  ONE PAGE EACH")

    # category ribbon
    c.setFont("Helvetica-Bold", 8.6)
    ribbon = "   ·   ".join(cats.keys())
    yy = PAGE_H - 566
    for ln in wrap_lines(ribbon, "Helvetica-Bold", 8.6, CW - 40):
        c.setFillColor(HexColor("#7C97AD"))
        c.drawCentredString(PAGE_W / 2, yy, ln)
        yy -= 13

    # disclaimer box
    c.setFillColor(HexColor("#0C1E32"))
    c.setStrokeColor(ACCENT_DK)
    c.setLineWidth(1)
    c.roundRect(MARGIN + 24, 64, CW - 48, 104, 8, stroke=1, fill=1)
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(PAGE_W / 2, 150, "RESEARCH USE ONLY")
    msg = ("This guide is NOT intended for human consumption. All dosing information is "
           "provided for reference only. Peptides 4 Power makes no medical claims. Always "
           "consult a qualified healthcare professional and follow all applicable laws "
           "before handling research compounds.")
    c.setFillColor(HexColor("#B9CEDF"))
    c.setFont("Helvetica", 9)
    yy = 134
    for ln in wrap_lines(msg, "Helvetica", 9, CW - 100):
        c.drawCentredString(PAGE_W / 2, yy, ln)
        yy -= 13
    c.setFillColor(HexColor("#6E8597"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_W / 2, 34, "© 2026 Peptides 4 Power  ·  peptides4power.us  ·  First Edition")
    c.showPage()


def contents_page(c, cats, page_index):
    header_band(c, "Contents", "Reference Guide")
    y = PAGE_H - 58 - 34
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN, y, "Table of Contents")
    y -= 10
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9.5)
    c.drawString(MARGIN, y - 12, "Each peptide has its own one-page reconstitution sheet. Categories:")
    y -= 38

    col_gap = 26
    col_w = (CW - col_gap) / 2.0
    x = MARGIN
    start_y = y
    items = list(cats.items())
    half = (len(items) + 1) // 2
    columns = [items[:half], items[half:]]
    for ci, column in enumerate(columns):
        cx = MARGIN + ci * (col_w + col_gap)
        cy = start_y
        for cat, names in column:
            col = CAT_COLORS.get(cat, ACCENT)
            c.setFillColor(col)
            c.rect(cx, cy - 1, 4, 12, stroke=0, fill=1)
            c.setFillColor(NAVY)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(cx + 9, cy, cat)
            c.setFillColor(GRAY)
            c.setFont("Helvetica", 8.6)
            c.drawRightString(cx + col_w, cy, f"p. {page_index[names[0]]}")
            cy -= 15
            c.setFillColor(INK)
            c.setFont("Helvetica", 8.4)
            line = "  ·  ".join(names)
            for ln in wrap_lines(line, "Helvetica", 8.4, col_w - 6):
                c.drawString(cx + 9, cy, ln)
                cy -= 10.6
            cy -= 10
    footer(c, 2)
    c.showPage()


# ----------------------------------------------------------------------------
def build():
    validate_unique()
    # group preserving order
    cats = {}
    for p in PEPTIDES:
        cats.setdefault(p["category"], []).append(p["name"])

    # page numbering: cover=1, contents=2, peptides start at 3
    page_index = {}
    pn = 3
    for p in PEPTIDES:
        page_index[p["name"]] = pn
        pn += 1

    c = canvas.Canvas(OUT, pagesize=letter)
    c.setTitle("Peptides 4 Power - Reconstitution & Dosing Guide")
    c.setAuthor("Peptides 4 Power")

    cover_page(c, len(PEPTIDES), len(cats), cats)
    contents_page(c, cats, page_index)

    pn = 3
    for p in PEPTIDES:
        # bookmark for navigation
        c.bookmarkPage(f"pep{pn}")
        c.addOutlineEntry(f"{p['name']}  ({p['category']})", f"pep{pn}", level=0)
        peptide_page(c, p, pn)
        pn += 1

    c.save()
    print(f"Wrote {OUT}  ({pn - 1} pages total, {len(PEPTIDES)} peptide sheets)")


def generate_one(name, path):
    """Render a single peptide page to its own PDF (for layout previews)."""
    p = next(pp for pp in PEPTIDES if pp["name"] == name)
    c = canvas.Canvas(path, pagesize=letter)
    c.setTitle(f"{name} - preview")
    peptide_page(c, p, 4)
    c.save()
    print(f"Wrote preview {path}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2 and sys.argv[1] == "--one":
        generate_one(sys.argv[2], sys.argv[3])
    else:
        build()
