# HUD Badge Logos (V2) – Full-App Set

This is the expanded badge set used across the HUD monitor layer on **all routes**.

Hard requirements:
- Transparent background (alpha)
- Circular glass ring + teal/cyan glow (badge stays inside a circular boundary)
- Subtle blueprint/circuit microtexture and small particles inside the ring
- Minimal pictogram in the center (no letters/words/numbers)
- Premium, professional, readable at 28–72px

Avoid:
- Any text, numbers, or watermarks
- Busy rectangular backgrounds outside the badge circle
- Heavy bloom/lens flare/oversaturated neon

## Output Files (final)
Written to `public/hud/badges/`:
- `badge-dashboard.webp`
- `badge-dispatch.webp`
- `badge-triage.webp`
- `badge-jobs.webp`
- `badge-clients.webp`
- `badge-estimate.webp`
- `badge-compliance.webp`
- `badge-fleet.webp`
- `badge-projects.webp`
- `badge-portal.webp`
- `badge-tech.webp`
- `badge-track.webp`
- `badge-settings.webp`
- `badge-tools.webp`
- `badge-public.webp`
- `badge-auth.webp`

## Base Prompt Template

Use case: `logo-brand` + `stylized-concept`

```
Transparent background (alpha). A premium futuristic HUD badge emblem: circular glass ring, teal/cyan glow, subtle starfield particles and blueprint/circuit microtexture inside the ring, centered composition, high detail but clean, professional enterprise aesthetic. In the center, a minimal luminous pictogram representing: <PICTOGRAM>. No text, no letters, no numbers, no watermark. Crisp edges, icon-like readability at small size.
Avoid: clutter, heavy bloom, lens flare, gradients spilling outside the badge, busy backgrounds.
```

## Batch Input
The JSONL jobs live in: `output/imagegen/hud-badges-v2/badges.jsonl`

## Command
Requires `OPENAI_API_KEY` set locally, plus python deps:

```bash
python3 -m pip install openai pillow

python3 scripts/image_gen.py generate-batch \
  --input output/imagegen/hud-badges-v2/badges.jsonl \
  --out-dir public/hud/badges \
  --output-format webp \
  --output-compression 80 \
  --background transparent \
  --size 1024x1024 \
  --quality high \
  --downscale-max-dim 256
```

To validate the batch inputs without calling the API:

```bash
python3 scripts/image_gen.py generate-batch \
  --input output/imagegen/hud-badges-v2/badges.jsonl \
  --out-dir /tmp/hud-badges \
  --dry-run
```

