#!/usr/bin/env python3
"""Split a scanner sheet into matched, perspective-corrected card images."""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    import cv2
    import numpy as np
except ImportError as exc:  # pragma: no cover - operational guidance
    raise SystemExit("Install opencv-python-headless and numpy before running this script.") from exc


def order_points(points: np.ndarray) -> np.ndarray:
    ordered = np.zeros((4, 2), dtype=np.float32)
    sums = points.sum(axis=1)
    differences = np.diff(points, axis=1).ravel()
    ordered[0] = points[np.argmin(sums)]
    ordered[2] = points[np.argmax(sums)]
    ordered[1] = points[np.argmin(differences)]
    ordered[3] = points[np.argmax(differences)]
    return ordered


def card_box(image: np.ndarray, bounds: tuple[int, int, int, int]) -> np.ndarray:
    x0, y0, x1, y1 = bounds
    roi = image[y0:y1, x0:x1]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    mask = ((gray < 242) | (hsv[:, :, 1] > 22)).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8))

    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    candidates = [
        index
        for index in range(1, count)
        if stats[index, cv2.CC_STAT_AREA] > roi.shape[0] * roi.shape[1] * 0.12
    ]
    if not candidates:
        raise ValueError("No card-sized region detected")

    component = max(candidates, key=lambda index: stats[index, cv2.CC_STAT_AREA])
    component_mask = np.where(labels == component, 255, 0).astype(np.uint8)
    contours, _ = cv2.findContours(component_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour = max(contours, key=cv2.contourArea)
    center, size, angle = cv2.minAreaRect(contour)

    # A tiny expansion retains rounded corners and a hairline of scanner field.
    padded = (center, (size[0] * 1.012, size[1] * 1.012), angle)
    points = cv2.boxPoints(padded)
    points[:, 0] += x0
    points[:, 1] += y0
    return order_points(points)


def extract_card(image: np.ndarray, points: np.ndarray, rotation: int) -> np.ndarray:
    top_left, top_right, bottom_right, bottom_left = points
    width = int(round(max(np.linalg.norm(top_right - top_left), np.linalg.norm(bottom_right - bottom_left))))
    height = int(round(max(np.linalg.norm(bottom_left - top_left), np.linalg.norm(bottom_right - top_right))))
    destination = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(points, destination)
    card = cv2.warpPerspective(
        image,
        matrix,
        (width, height),
        flags=cv2.INTER_LANCZOS4,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(255, 255, 255),
    )
    if card.shape[1] > card.shape[0]:
        card = cv2.rotate(card, cv2.ROTATE_90_CLOCKWISE)
    if rotation == 180:
        card = cv2.rotate(card, cv2.ROTATE_180)
    if card.shape[1] > 1500:
        scale = 1500 / card.shape[1]
        card = cv2.resize(card, (1500, round(card.shape[0] * scale)), interpolation=cv2.INTER_LANCZOS4)
    return card


def grid_bounds(width: int, height: int, rows: int, columns: int) -> list[tuple[int, int, int, int]]:
    """Return slightly overlapping cells so card edges near grid lines are retained."""
    overlap_x = width * 0.035 / columns
    overlap_y = height * 0.035 / rows
    bounds = []
    for row in range(rows):
        for column in range(columns):
            x0 = max(0, round(width * column / columns - overlap_x))
            x1 = min(width, round(width * (column + 1) / columns + overlap_x))
            y0 = max(0, round(height * row / rows - overlap_y))
            y1 = min(height, round(height * (row + 1) / rows + overlap_y))
            bounds.append((x0, y0, x1, y1))
    return bounds


def parse_rotations(value: str | None, count: int, fallback: int) -> list[int]:
    if value is None:
        return [fallback] * count
    rotations = [int(item.strip()) for item in value.split(",")]
    if len(rotations) != count or any(rotation not in (0, 180) for rotation in rotations):
        raise ValueError(f"Expected {count} comma-separated rotations using only 0 or 180")
    return rotations


def split_sheet(path: Path, rows: int, columns: int, rotations: list[int]) -> list[np.ndarray]:
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Could not read {path}")
    height, width = image.shape[:2]
    cards = []
    for index, (region, rotation) in enumerate(zip(grid_bounds(width, height, rows, columns), rotations)):
        try:
            cards.append(extract_card(image, card_box(image, region), rotation))
        except ValueError as exc:
            row, column = divmod(index, columns)
            raise ValueError(f"{path}: row {row + 1}, column {column + 1}: {exc}") from exc
    return cards


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("side_a", type=Path)
    parser.add_argument("side_b", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("start_number", type=int)
    parser.add_argument("--rows", type=int, default=2)
    parser.add_argument("--columns", type=int, default=2)
    parser.add_argument("--side-a-rotation", type=int, choices=(0, 180), default=180)
    parser.add_argument("--side-b-rotation", type=int, choices=(0, 180), default=180)
    parser.add_argument("--side-a-rotations")
    parser.add_argument("--side-b-rotations")
    args = parser.parse_args()

    count = args.rows * args.columns
    front_rotations = parse_rotations(args.side_a_rotations, count, args.side_a_rotation)
    back_rotations = parse_rotations(args.side_b_rotations, count, args.side_b_rotation)
    fronts = split_sheet(args.side_a, args.rows, args.columns, front_rotations)
    backs = split_sheet(args.side_b, args.rows, args.columns, back_rotations)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for index, (front, back) in enumerate(zip(fronts, backs)):
        number = args.start_number + index
        front_path = args.output_dir / f"pa-{number:04d}-front.jpg"
        back_path = args.output_dir / f"pa-{number:04d}-back.jpg"
        cv2.imwrite(str(front_path), front, [cv2.IMWRITE_JPEG_QUALITY, 94])
        cv2.imwrite(str(back_path), back, [cv2.IMWRITE_JPEG_QUALITY, 94])
        print(f"pa-{number:04d}: {front_path}, {back_path}")


if __name__ == "__main__":
    main()
