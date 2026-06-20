# Peptides 4 Power — Reconstitution & Dosing Guide (eBook)

A branded, print-ready eBook with **one full page per peptide**, modeled on the
P4P Ipamorelin preview template and extended to the entire P4P catalog.

- **`Peptides4Power_Reconstitution_Guide.pdf`** — the finished eBook (83 pages:
  cover + table of contents + **81 unique peptide sheets**).
- **`peptides_data.py`** — the deduplicated peptide dataset (source of truth).
- **`generate_guide.py`** — the generator (ReportLab). Run it to rebuild the PDF.
- **`assets/p4p_logo.png`** — the P4P logo used in the header/cover.

## Each peptide page includes
- Category header band + logo, peptide name, and a benefit tagline
- **About This Peptide** and **Key Benefits**
- **Reconstitution & Dosing Guide** table — Vial Size · BAC Water ·
  Concentration (computed mg/ml) · Units to Draw (U-100 syringe) · Frequency ·
  Dose / Injection
- Info cards: **Cycle · Administration · Storage · Purpose**
- A **Notes** tip and a research-use-only footer

## Deduplication
Peptides listed in more than one category on the cheat sheet (MOTS-C, KPV,
Epitalon, GHK-Cu, Livagen, FOXO4-DRI options) appear **exactly once**, using the
most complete data. `peptides_data.validate_unique()` enforces this at build time.

## Rebuild
```bash
pip install reportlab
cd peptide-guide
python3 generate_guide.py
```

> For Research Use Only — Not For Human Consumption. Consult a healthcare
> professional. Peptides 4 Power makes no medical claims; dosing is reference only.
