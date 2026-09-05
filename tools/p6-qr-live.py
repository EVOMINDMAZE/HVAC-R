#!/usr/bin/env python3
"""Phase 6 probe, part B: decode the QRs from the LIVE PDF bytes.

Downloads nothing itself — reads /tmp/p6-probe-<slug>.pdf files written by
tools/p6-verify.cjs (which already asserted 200 + application/pdf). Renders
page 1 with PyMuPDF, scans the footer region with OpenCV, and asserts each
QR decodes to the catalog-track URL for its slug.

Prints QR-LIVE PASS / QR-LIVE FAIL. Exit 0 only on pass.
"""
import sys
import numpy as np
import fitz
import cv2

FN = "https://tbmizbqftczbsbwqgyjx.supabase.co/functions/v1/catalog-track"
SLUGS = ["phasepoint", "vanclass", "cryovo", "hvac-business-platform"]

fail = []
for s in SLUGS:
    path = f"/tmp/p6-probe-{s}.pdf"
    try:
        pix = fitz.open(path)[0].get_pixmap(dpi=150)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR) if pix.n == 3 else cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        data, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
        exp = f"{FN}?p={s}"
        if data == exp:
            print(f"{s}: QR OK")
        else:
            fail.append(f"{s}: QR decoded {data!r}, want {exp!r}")
    except Exception as e:  # noqa: BLE001 — probe must report, not crash
        fail.append(f"{s}: {e}")

print("QR-LIVE FAIL\n" + "\n".join(fail) if fail else "QR-LIVE PASS")
sys.exit(1 if fail else 0)
