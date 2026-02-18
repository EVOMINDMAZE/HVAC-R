#!/usr/bin/env python3
"""
Repo-local Image Generation CLI (OpenAI Images API)

This is intentionally small and purpose-built for generating UI badge assets
in a reproducible way (e.g. dashboard HUD badges).

Requires:
- OPENAI_API_KEY env var (for real runs)
- pip install openai pillow (Pillow required only for downscale)
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


def eprint(*args: Any) -> None:
    print(*args, file=sys.stderr)


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    jobs: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            raw = line.strip()
            if not raw:
                continue
            try:
                jobs.append(json.loads(raw))
            except Exception as exc:
                raise RuntimeError(f"Invalid JSONL at {path}:{line_no}") from exc
    return jobs


def write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def maybe_downscale(in_path: Path, max_dim: int) -> None:
    # Pillow is optional; only required when downscaling.
    try:
        from PIL import Image  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "Downscale requested but Pillow is not installed. Install via: python3 -m pip install pillow"
        ) from exc

    with Image.open(in_path) as im:
        im.load()
        w, h = im.size
        if max(w, h) <= max_dim:
            return
        scale = float(max_dim) / float(max(w, h))
        new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
        im = im.resize(new_size, resample=Image.Resampling.LANCZOS)
        im.save(in_path)


@dataclass
class GenerateJob:
    id: str
    prompt: str
    model: str
    size: str
    quality: str
    background: str
    output_format: str
    output_compression: Optional[int]
    n: int


def normalize_job(raw: Dict[str, Any], args: argparse.Namespace) -> GenerateJob:
    job_id = str(raw.get("id") or raw.get("key") or raw.get("name") or "").strip()
    if not job_id:
        raise RuntimeError("Each JSONL job must include an 'id' field (e.g. dispatch, triage).")

    prompt = str(raw.get("prompt") or "").strip()
    if not prompt:
        raise RuntimeError(f"Job '{job_id}' is missing a non-empty 'prompt'.")

    model = str(raw.get("model") or args.model).strip()
    size = str(raw.get("size") or args.size).strip()
    quality = str(raw.get("quality") or args.quality).strip()
    background = str(raw.get("background") or args.background).strip()
    output_format = str(raw.get("output_format") or args.output_format).strip()

    output_compression = raw.get("output_compression")
    if output_compression is None:
        output_compression = args.output_compression
    if output_compression is not None:
        try:
            output_compression = int(output_compression)
        except Exception:
            output_compression = None

    n = int(raw.get("n") or args.n or 1)
    return GenerateJob(
        id=job_id,
        prompt=prompt,
        model=model,
        size=size,
        quality=quality,
        background=background,
        output_format=output_format,
        output_compression=output_compression,
        n=n,
    )


def build_out_path(out_dir: Path, job_id: str, idx: int, output_format: str) -> Path:
    suffix = f"-{idx}" if idx > 1 else ""
    return out_dir / f"badge-{job_id}{suffix}.{output_format}"


def generate_images(job: GenerateJob, dry_run: bool) -> List[bytes]:
    if dry_run:
        eprint(f"[dry-run] generate {job.id}: model={job.model} size={job.size} format={job.output_format}")
        return []

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set. Set it in your shell environment and re-run.")

    try:
        from openai import OpenAI  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "The 'openai' python package is not installed. Install via: python3 -m pip install openai"
        ) from exc

    client = OpenAI(api_key=api_key)

    params: Dict[str, Any] = {
        "model": job.model,
        "prompt": job.prompt,
        "size": job.size,
        "quality": job.quality,
        "background": job.background,
        "output_format": job.output_format,
        "n": job.n,
    }
    if job.output_compression is not None:
        params["output_compression"] = job.output_compression

    result = client.images.generate(**params)
    data = getattr(result, "data", None) or []
    out: List[bytes] = []
    for item in data:
        b64 = getattr(item, "b64_json", None)
        if not b64:
            continue
        out.append(base64.b64decode(b64))
    if not out:
        raise RuntimeError(f"No image data returned for job '{job.id}'.")
    return out


def run_generate_batch(args: argparse.Namespace) -> int:
    input_path = Path(args.input).resolve()
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    jobs_raw = read_jsonl(input_path)
    jobs = [normalize_job(raw, args) for raw in jobs_raw]

    for job in jobs:
        images = generate_images(job, dry_run=args.dry_run)
        for idx, img_bytes in enumerate(images, start=1):
            out_path = build_out_path(out_dir, job.id, idx, job.output_format)
            write_bytes(out_path, img_bytes)
            if args.downscale_max_dim:
                maybe_downscale(out_path, int(args.downscale_max_dim))
            eprint(f"Wrote {out_path}")

    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="image_gen.py")
    sub = parser.add_subparsers(dest="cmd", required=True)

    batch = sub.add_parser("generate-batch", help="Generate images from a JSONL file (one job per line)")
    batch.add_argument("--input", required=True, help="Path to JSONL file")
    batch.add_argument("--out-dir", required=True, help="Output directory")
    batch.add_argument("--model", default="gpt-image-1.5")
    batch.add_argument("--size", default="1024x1024")
    batch.add_argument("--quality", default="high", choices=["low", "medium", "high", "auto"])
    batch.add_argument("--background", default="transparent", choices=["transparent", "opaque", "auto"])
    batch.add_argument("--output-format", default="webp", choices=["png", "jpeg", "webp"])
    batch.add_argument("--output-compression", type=int, default=80, help="0-100 (jpeg/webp only)")
    batch.add_argument("--n", type=int, default=1, help="Variants per prompt")
    batch.add_argument("--downscale-max-dim", type=int, default=256, help="Downscale max dimension (requires Pillow)")
    batch.add_argument("--dry-run", action="store_true", help="Print planned jobs without calling the API")

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    if args.cmd == "generate-batch":
        return run_generate_batch(args)
    raise RuntimeError(f"Unknown command: {args.cmd}")


if __name__ == "__main__":
    raise SystemExit(main())

