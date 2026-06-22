"""One-off exploration script.

Run manually before trusting extract_deals.py: dumps rendered HTML for
both target pages so real selectors can be read off them, and probes
whether the carousel arrow lazy-loads new DOM nodes on click (vs. just
shifting a CSS transform over content that's already present).

Usage:
    python -m scraper.explore
"""

import os

from scrapling.fetchers import StealthyFetcher

from scraper.config import (
    CARD_SELECTOR,
    CAROUSEL_NEXT_ARROW_SELECTOR,
    HOMEPAGE_URL,
    OFERTAS_URL,
)

DUMP_DIR = "output/exploration"


def probe_carousel(page):
    """Click the first carousel arrow once, report whether DOM card
    count changed. Printed for manual inspection, not asserted."""
    before = page.locator(CARD_SELECTOR).count()
    arrows = page.locator(CAROUSEL_NEXT_ARROW_SELECTOR)
    if arrows.count() == 0:
        print(f"  no carousel arrow found via {CAROUSEL_NEXT_ARROW_SELECTOR!r}")
        return
    arrows.first.click()
    page.wait_for_timeout(500)
    after = page.locator(CARD_SELECTOR).count()
    if after > before:
        print(f"  carousel LAZY-LOADS: count {before} -> {after} after one click")
    else:
        print(f"  carousel is CSS-only: count unchanged ({before}) after click")


def dump(url: str, filename: str) -> None:
    print(f"fetching {url}")
    page = StealthyFetcher.fetch(
        url,
        block_webrtc=True,
        hide_canvas=True,
        network_idle=True,
        timeout=90000,
        page_action=probe_carousel,
    )
    os.makedirs(DUMP_DIR, exist_ok=True)
    path = os.path.join(DUMP_DIR, filename)
    with open(path, "wb") as f:
        f.write(page.body)
    print(f"  status={page.status} saved -> {path}")
    print(f"  {CARD_SELECTOR!r} matched {len(page.css(CARD_SELECTOR))} elements")


def main() -> None:
    dump(HOMEPAGE_URL, "homepage.html")
    dump(OFERTAS_URL, "ofertas.html")
    print(
        "\nNext: open the dumped HTML, find the real selectors for "
        "card/price/discount/link/arrow, and update scraper/config.py."
    )


if __name__ == "__main__":
    main()
