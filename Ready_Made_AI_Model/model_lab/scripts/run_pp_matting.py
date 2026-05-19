from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Wrapper for PaddleSeg / PP-Matting inference.")
    parser.add_argument("--repo", default=Path("../repos/PaddleSeg"), type=Path)
    parser.add_argument("--image", required=True, type=Path)
    parser.add_argument("--config", required=True, type=Path, help="PP-Matting config file inside PaddleSeg or absolute path.")
    parser.add_argument("--model-path", required=True, type=Path, help="Exported PP-Matting inference model folder or model file.")
    parser.add_argument("--output-dir", default=Path("../outputs/pp_matting"), type=Path)
    args = parser.parse_args()

    repo = args.repo.resolve()
    if not repo.exists():
        raise SystemExit("PaddleSeg repo not found. Run scripts/download_repos.ps1 first.")
    if not args.model_path.exists():
        raise SystemExit("PP-Matting model path not found. Download/export the PP-Matting model first.")

    args.output_dir.mkdir(parents=True, exist_ok=True)

    # PaddleSeg versions can use slightly different deploy paths.
    candidate_scripts = [
        repo / "deploy" / "python" / "infer.py",
        repo / "Matting" / "tools" / "predict.py",
        repo / "tools" / "predict.py",
    ]
    infer_script = next((p for p in candidate_scripts if p.exists()), None)
    if infer_script is None:
        raise SystemExit("Could not find a PaddleSeg inference script. Check your PaddleSeg version.")

    config = args.config if args.config.is_absolute() else repo / args.config
    if not config.exists():
        raise SystemExit(f"Config file not found: {config}")

    cmd = [
        sys.executable,
        str(infer_script),
        "--config", str(config.resolve()),
        "--image_path", str(args.image.resolve()),
        "--save_dir", str(args.output_dir.resolve()),
    ]

    # Some PaddleSeg inference scripts use --model_path, others load weights from config.
    # Keep this here because most exported/deploy scripts accept it.
    cmd += ["--model_path", str(args.model_path.resolve())]

    print("Running PaddleSeg / PP-Matting inference:")
    print(" ".join(cmd))
    subprocess.run(cmd, cwd=repo, check=True)
    print(f"Saved outputs in: {args.output_dir}")


if __name__ == "__main__":
    main()
