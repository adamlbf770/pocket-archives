#!/usr/bin/env python3
"""Build a reproducible register from CGC's official impacted-card notice."""

from __future__ import annotations

import csv
import re
import urllib.request
from pathlib import Path


SOURCE = "https://www.cgccards.com/news/article/13730/"
OUTPUT = Path(__file__).with_name("cgc-impacted-certificates.csv")
PATTERN = re.compile(r"\b140\d{7}-\d{3}\b")


def main() -> None:
    request = urllib.request.Request(
        SOURCE,
        headers={"User-Agent": "Pocket Archives documentary research/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8", errors="replace")

    certificates = sorted(set(PATTERN.findall(html)))
    if not certificates:
        raise SystemExit("No certification numbers found; CGC page structure may have changed.")

    with OUTPUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "certification_number",
                "official_status",
                "source",
                "last_checked",
                "notes",
            ]
        )
        for certificate in certificates:
            writer.writerow(
                [
                    certificate,
                    "Eligible for CGC holder review; investigation pending",
                    SOURCE,
                    "2026-08-16",
                    "The official notice publishes no item-level outcome or Not Genuine determination.",
                ]
            )

    print(f"Wrote {len(certificates)} records to {OUTPUT}")


if __name__ == "__main__":
    main()
