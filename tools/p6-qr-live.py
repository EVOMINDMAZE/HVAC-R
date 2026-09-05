#!/usr/bin/env python3
"""Phase 6 probe, part B: decode the QRs from the LIVE PDF bytes.

Reads /tmp/p6-probe-<slug>.pdf files written by tools/p6-verify.cjs (which
already asserted 200 + application/pdf). Extracts the embedded QR PNG via
PyMuPDF get_images (full 300x300, no rasterization loss) and asserts it
decodes to the catalog-track URL for its slug.

Lesson (p6): cv2.QRCodeDetector cannot decode the busy full-page A4 raster
(tried dpi 110-200, crops, inversion, 3x upscale, Otsu) but decodes the
embedded PNG instantly. Extract, don't rasterize.

Prints QR-LIVE PASS / QR-LIVE FAIL. Exit 0 only on pass.
"""
import numpy as np
import fitz
import cv2

FN = "https://tbmizbqftczbsbwqgyjx.supabase.co/functions/v1/catalog-track"
SLUGS = ["phasepoint", "vanclass", "cryovo", "hvac-business-platform"]

fail = []
for s in SLUGS:
    try:
        doc = fitz.open(f"/tmp/p6-probe-{s}.pdf")
        hits = []
        for (xref, *_rest) in doc[0].get_images(full=True):
            pix = fitz.Pixmap(doc, xref)
            if pix.width < 120 or pix.height < 120:
                continue  # logos
            if pix.n - pix.alpha >= 3:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY) if arr.shape[2] >= 3 else arr[:, :, 0]
            for im in (gray, 255 - gray):
                d, _, _ = cv2.QRCodeDetector().detectAndDecode(im)
                if d:
                    hits.append(d)
                    break
        exp = f"{FN}?p={s}"
        if exp in hits:
            print(f"{s}: QR OK")
        else:
            fail.append(f"{s}: decoded {hits!r}, want {exp!r}")
    except Exception as e:  # noqa: BLE001 — probe must report, not crash
        fail.append(f"{s}: {e}")

print("QR-LIVE FAIL\n" + "\n".join(fail) if fail else "QR-LIVE PASS")
import sys
sys.exit(1 if fail else 0)
