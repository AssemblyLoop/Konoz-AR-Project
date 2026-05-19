from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


def cover_resize(img: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    out_w, out_h = size
    h, w = img.shape[:2]
    scale = max(out_w / w, out_h / h)
    new_w, new_h = int(round(w * scale)), int(round(h * scale))
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    x = max(0, (new_w - out_w) // 2)
    y = max(0, (new_h - out_h) // 2)
    return resized[y:y + out_h, x:x + out_w]


def composite_image(foreground_path: Path, alpha_path: Path, background_path: Path, output_path: Path) -> None:
    foreground = cv2.imread(str(foreground_path), cv2.IMREAD_COLOR)
    alpha = cv2.imread(str(alpha_path), cv2.IMREAD_GRAYSCALE)
    background = cv2.imread(str(background_path), cv2.IMREAD_COLOR)

    if foreground is None:
        raise FileNotFoundError(f"Could not read foreground: {foreground_path}")
    if alpha is None:
        raise FileNotFoundError(f"Could not read alpha: {alpha_path}")
    if background is None:
        raise FileNotFoundError(f"Could not read background: {background_path}")

    h, w = foreground.shape[:2]
    alpha = cv2.resize(alpha, (w, h), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255.0
    alpha = cv2.GaussianBlur(alpha, (0, 0), 1.2)
    alpha = np.clip(alpha[..., None], 0.0, 1.0)
    background = cover_resize(background, (w, h))

    result = foreground.astype(np.float32) * alpha + background.astype(np.float32) * (1.0 - alpha)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), np.clip(result, 0, 255).astype(np.uint8))


def main() -> None:
    parser = argparse.ArgumentParser(description="Composite foreground + alpha matte over a replacement background.")
    parser.add_argument("--foreground", required=True, type=Path)
    parser.add_argument("--alpha", required=True, type=Path)
    parser.add_argument("--background", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    composite_image(args.foreground, args.alpha, args.background, args.output)
    print(f"Saved: {args.output}")


if __name__ == "__main__":
    main()
