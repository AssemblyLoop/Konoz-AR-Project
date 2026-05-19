from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def run(cmd: list[str]) -> None:
    print(" ".join(cmd))
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="One CLI entry point for RVM, BackgroundMattingV2, and PP-Matting.")
    parser.add_argument("--model", required=True, choices=["rvm", "backgroundmattingv2", "ppmatting"])
    parser.add_argument("--input", required=True, type=Path, help="Input image/video depending on model.")
    parser.add_argument("--output-dir", default=Path("../outputs"), type=Path)
    parser.add_argument("--clean-background", type=Path, help="Required for BackgroundMattingV2.")
    parser.add_argument("--checkpoint", type=Path, help="Required for BackgroundMattingV2.")
    parser.add_argument("--config", type=Path, help="Required for PP-Matting.")
    parser.add_argument("--model-path", type=Path, help="Required for PP-Matting.")
    args = parser.parse_args()

    here = Path(__file__).resolve().parent

    if args.model == "rvm":
        run([sys.executable, str(here / "run_rvm.py"), "--input", str(args.input), "--output-dir", str(args.output_dir / "rvm")])
        return

    if args.model == "backgroundmattingv2":
        if not args.clean_background or not args.checkpoint:
            raise SystemExit("BackgroundMattingV2 needs --clean-background and --checkpoint.")
        run([
            sys.executable, str(here / "run_background_matting_v2.py"),
            "--input-video", str(args.input),
            "--clean-background", str(args.clean_background),
            "--checkpoint", str(args.checkpoint),
            "--output-dir", str(args.output_dir / "background_matting_v2"),
        ])
        return

    if args.model == "ppmatting":
        if not args.config or not args.model_path:
            raise SystemExit("PP-Matting needs --config and --model-path.")
        run([
            sys.executable, str(here / "run_pp_matting.py"),
            "--image", str(args.input),
            "--config", str(args.config),
            "--model-path", str(args.model_path),
            "--output-dir", str(args.output_dir / "pp_matting"),
        ])


if __name__ == "__main__":
    main()
