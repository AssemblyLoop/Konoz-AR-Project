from __future__ import annotations

import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Robust Video Matting through torch.hub.")
    parser.add_argument("--input", required=True, type=Path, help="Input video or image path.")
    parser.add_argument("--output-dir", default=Path("../outputs/rvm"), type=Path)
    parser.add_argument("--backbone", choices=["mobilenetv3", "resnet50"], default="mobilenetv3")
    parser.add_argument("--device", default="cuda", help="cuda or cpu")
    parser.add_argument("--downsample-ratio", type=float, default=None)
    parser.add_argument("--seq-chunk", type=int, default=12)
    args = parser.parse_args()

    try:
        import torch
    except ImportError as exc:
        raise SystemExit("Install requirements first: pip install -r ../requirements-rvm.txt") from exc

    args.output_dir.mkdir(parents=True, exist_ok=True)
    device = args.device
    if device == "cuda" and not torch.cuda.is_available():
        print("CUDA is not available. Falling back to CPU. It will be slow.")
        device = "cpu"

    print("Loading RVM model from torch.hub. First run may download weights.")
    model = torch.hub.load("PeterL1n/RobustVideoMatting", args.backbone, pretrained=True).eval().to(device)
    converter = torch.hub.load("PeterL1n/RobustVideoMatting", "converter")

    stem = args.input.stem
    output_composition = args.output_dir / f"{stem}_rvm_composite.mp4"
    output_alpha = args.output_dir / f"{stem}_rvm_alpha.mp4"
    output_foreground = args.output_dir / f"{stem}_rvm_foreground.mp4"

    converter.convert_video(
        model,
        input_source=str(args.input),
        output_type="video",
        output_composition=str(output_composition),
        output_alpha=str(output_alpha),
        output_foreground=str(output_foreground),
        output_video_mbps=4,
        downsample_ratio=args.downsample_ratio,
        seq_chunk=args.seq_chunk,
        device=device,
    )
    print("Saved RVM outputs:")
    print(output_composition)
    print(output_alpha)
    print(output_foreground)


if __name__ == "__main__":
    main()
