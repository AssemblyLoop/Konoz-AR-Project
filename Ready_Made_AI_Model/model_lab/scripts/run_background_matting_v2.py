from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Wrapper for BackgroundMattingV2 official inference script.")
    parser.add_argument("--repo", default=Path("../repos/BackgroundMattingV2"), type=Path)
    parser.add_argument("--input-video", required=True, type=Path)
    parser.add_argument("--clean-background", required=True, type=Path, help="Same real camera background without the person.")
    parser.add_argument("--checkpoint", required=True, type=Path, help="Downloaded BackgroundMattingV2 .pth checkpoint.")
    parser.add_argument("--output-dir", default=Path("../outputs/background_matting_v2"), type=Path)
    parser.add_argument("--backbone", default="resnet50", choices=["resnet50", "mobilenetv2"])
    args = parser.parse_args()

    repo = args.repo.resolve()
    if not repo.exists():
        raise SystemExit("BackgroundMattingV2 repo not found. Run scripts/download_repos.ps1 first.")
    if not args.checkpoint.exists():
        raise SystemExit("Checkpoint not found. Download the official BackgroundMattingV2 weights and pass --checkpoint.")
    if not args.clean_background.exists():
        raise SystemExit("Clean background image not found. BackgroundMattingV2 needs this input.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    script = repo / "inference_video.py"
    if not script.exists():
        raise SystemExit(f"Could not find official inference script: {script}")

    cmd = [
        sys.executable,
        str(script),
        "--model-type", "mattingrefine",
        "--model-backbone", args.backbone,
        "--model-checkpoint", str(args.checkpoint.resolve()),
        "--video-src", str(args.input_video.resolve()),
        "--video-bgr", str(args.clean_background.resolve()),
        "--output-dir", str(args.output_dir.resolve()),
        "--output-types", "com", "pha", "fgr",
    ]

    print("Running BackgroundMattingV2 official script:")
    print(" ".join(cmd))
    subprocess.run(cmd, cwd=repo, check=True)
    print(f"Saved outputs in: {args.output_dir}")


if __name__ == "__main__":
    main()
