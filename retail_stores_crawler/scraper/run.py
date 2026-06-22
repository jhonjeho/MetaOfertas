"""Entrypoint: fetch both target pages, extract deals, write JSON.

Usage:
    python -m scraper.run
"""

import json
import os
from dataclasses import asdict
from datetime import datetime, timezone

from scraper.config import HOMEPAGE_URL, OFERTAS_URL, OUTPUT_DIR
from scraper.extract_deals import scrape_deals
from scraper.fetch_pages import fetch_rendered


def run() -> str:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = os.path.join(OUTPUT_DIR, f"exito_deals_{timestamp}.json")

    all_deals = []
    for url in (HOMEPAGE_URL, OFERTAS_URL):
        print(f"rendering {url}")
        listing_page = fetch_rendered(url)
        print(f"  extracting deals from {url}")
        page_deal_count = 0
        for deal in scrape_deals(listing_page, url):
            all_deals.append(asdict(deal))
            page_deal_count += 1
            # Write after every deal so a later crash doesn't lose prior progress.
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(all_deals, f, ensure_ascii=False, indent=2)
        print(f"  got {page_deal_count} deals")

    print(f"wrote {len(all_deals)} deals -> {out_path}")
    return out_path


if __name__ == "__main__":
    run()
