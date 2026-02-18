# Dashboard HUD Badges (V1) – ImageGen Prompts

Goal: Generate **6 futuristic HUD badge logos** for the Dashboard “Command Center”.

Hard requirements:
- Transparent background (alpha)
- Circular glass ring + cyan/teal glow
- Subtle blueprint/circuit microtexture inside the ring
- Simple pictogram in the center (no letters/words/numbers)
- Clean, premium, professional (avoid cheesy lens flare / busy poster backgrounds)

Expected output files (final):
- `public/hud/badges/badge-dispatch.webp`
- `public/hud/badges/badge-triage.webp`
- `public/hud/badges/badge-jobs.webp`
- `public/hud/badges/badge-clients.webp`
- `public/hud/badges/badge-estimate.webp`
- `public/hud/badges/badge-compliance.webp`

## Base Prompt Template

Use case: `logo-brand` + `stylized-concept`

```
Transparent background PNG (alpha). A premium futuristic HUD badge emblem: circular glass ring, cyan/teal glow, subtle starfield particles and blueprint/circuit microtexture inside the ring, centered composition, high detail but clean, professional enterprise aesthetic.
In the center, a minimal luminous pictogram representing: <PICTOGRAM>.
No text, no letters, no numbers, no watermark. Crisp edges, icon-like readability at small size.
Avoid: clutter, heavy bloom, lens flare, gradients spilling outside the badge, busy backgrounds.
```

## Batch Input
The JSONL jobs live in: `output/imagegen/dashboard-badges-v1/badges.jsonl`.

## Command (Generate Into `public/`)
Requires `OPENAI_API_KEY` to be set locally.

```bash
python3 -m pip install openai pillow

python3 scripts/image_gen.py generate-batch \
  --input output/imagegen/dashboard-badges-v1/badges.jsonl \
  --out-dir public/hud/badges \
  --output-format webp \
  --output-compression 80 \
  --background transparent \
  --size 1024x1024 \
  --quality high \
  --downscale-max-dim 256
```

Notes:
- The script writes `badge-<id>.webp` files directly into `public/hud/badges/`.
- If you want to test without spending tokens, add `--dry-run`.

