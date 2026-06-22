"""Two-stage deal extraction: parse listing cards for links, then fetch
each product detail page for reliable name/price/discount data."""

import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterator, Optional
from urllib.parse import urlparse

from scraper.config import (
    BANNER_IMAGE_SELECTOR,
    CARD_DISCOUNT_BADGE_SELECTOR,
    CARD_DISCOUNTED_PRICE_SELECTOR,
    CARD_IMAGE_SELECTOR,
    CARD_LINK_SELECTOR,
    CARD_NAME_SELECTOR,
    CARD_ORIGINAL_PRICE_SELECTOR,
    CARD_SELECTOR,
    DETAIL_DISCOUNT_SELECTOR,
    DETAIL_DISCOUNTED_PRICE_SELECTOR,
    DETAIL_FETCH_DELAY_SECONDS,
    DETAIL_NAME_SELECTOR,
    DETAIL_ORIGINAL_PRICE_SELECTOR,
)


@dataclass
class Deal:
    source_url: str
    detail_url: str
    image_url: Optional[str]
    name: Optional[str]
    original_price: Optional[str]
    discounted_price: Optional[str]
    discount: Optional[str]
    scraped_at: str


def extract_detail_links(page, source_url: str) -> list[dict]:
    """Stage A: pull each card's link, image, and name/price/discount
    from a fully-rendered listing page (see
    fetch_pages.explore_full_page). The card already renders the same
    price markup as the detail page (CARD_*_SELECTOR and DETAIL_*_SELECTOR
    are identical CSS strings), so pulling it here means scrape_deals
    can skip a separate per-card detail-page fetch entirely - that fetch
    was the main runtime cost. Image selector is scoped inside the
    product-link anchor so it grabs the real product photo, not the
    sibling promo flag badge."""
    cards = page.css(CARD_SELECTOR)
    items = []
    for card in cards:
        href = card.css(CARD_LINK_SELECTOR).get()
        if not href:
            continue
        image_src = card.css(CARD_IMAGE_SELECTOR).get()
        items.append(
            {
                "detail_url": page.urljoin(href),
                "image_url": page.urljoin(image_src) if image_src else None,
                "name": card.css(CARD_NAME_SELECTOR).get(),
                "original_price": card.css(CARD_ORIGINAL_PRICE_SELECTOR).get(),
                "discounted_price": card.css(CARD_DISCOUNTED_PRICE_SELECTOR).get(),
                "discount": card.css(CARD_DISCOUNT_BADGE_SELECTOR).get(),
            }
        )
    return items


def extract_banner_links(page, source_url: str) -> list[dict]:
    """Promo banners (gallery tiles, countdown carousel, top "tap"
    carousel, category reach-banner) aren't `productCard` elements and
    carry no price text on the listing page - selected via the <img>'s
    own attribute, then walk up to the wrapping <a> for the href since
    only the image carries a stable attribute across all four types."""
    items = []
    for img in page.css(BANNER_IMAGE_SELECTOR):
        anchor = img.find_ancestor(lambda el: el.tag == "a")
        if anchor is None:
            continue
        href = anchor.attrib.get("href")
        if not href:
            continue
        image_src = img.attrib.get("src")
        items.append(
            {
                "detail_url": page.urljoin(href),
                "image_url": page.urljoin(image_src) if image_src else None,
                "alt_text": img.attrib.get("alt") or img.attrib.get("title"),
            }
        )
    return items


def _is_product_detail_url(url: str) -> bool:
    """Product pages always end in `/p` - banners that link to a
    category/collection page instead have nothing to fetch a price from."""
    return urlparse(url).path.rstrip("/").endswith("/p")


def extract_detail(detail_page) -> dict:
    """Stage B: pull name/price/discount from a single product page."""
    return {
        "name": detail_page.css(DETAIL_NAME_SELECTOR).get(),
        "original_price": detail_page.css(DETAIL_ORIGINAL_PRICE_SELECTOR).get(),
        "discounted_price": detail_page.css(DETAIL_DISCOUNTED_PRICE_SELECTOR).get(),
        "discount": detail_page.css(DETAIL_DISCOUNT_SELECTOR).get(),
    }


def scrape_deals(listing_page, source_url: str) -> Iterator[Deal]:
    """Full scrape for one listing page. Combines product cards with
    promo-banner tiles (gallery/cronometer/tap/reach) so a deal shown
    only as a banner image isn't missed; cards and banners are deduped
    by detail_url first since a banner can point at a product already
    captured as a card.

    Card-sourced items already carry name/price/discount from the
    listing page (see extract_detail_links) - those are yielded
    directly with no extra request. Only banner items that resolve to
    a real product page (`/p`) still need a detail-page fetch, since a
    bare banner image has no price markup next to it; banner items
    landing on a category page are kept with null price fields since
    there's nothing to fetch. These remaining fetches are throttled to
    one at a time since there's no proxy to fall back on."""
    from scrapling.fetchers import StealthyFetcher

    seen_urls = set()
    items = []
    for item in extract_detail_links(listing_page, source_url) + extract_banner_links(
        listing_page, source_url
    ):
        if item["detail_url"] in seen_urls:
            continue
        seen_urls.add(item["detail_url"])
        items.append(item)

    for item in items:
        detail_url = item["detail_url"]
        if "name" in item:
            yield Deal(
                source_url=source_url,
                detail_url=detail_url,
                image_url=item["image_url"],
                name=item["name"],
                original_price=item["original_price"],
                discounted_price=item["discounted_price"],
                discount=item["discount"],
                scraped_at=datetime.now(timezone.utc).isoformat(),
            )
            continue
        if not _is_product_detail_url(detail_url):
            yield Deal(
                source_url=source_url,
                detail_url=detail_url,
                image_url=item["image_url"],
                name=item.get("alt_text"),
                original_price=None,
                discounted_price=None,
                discount=None,
                scraped_at=datetime.now(timezone.utc).isoformat(),
            )
            continue
        try:
            detail_page = StealthyFetcher.fetch(
                detail_url,
                block_webrtc=True,
                hide_canvas=True,
                network_idle=True,
                timeout=90000,
            )
        except Exception as exc:
            print(f"  WARNING: skipping {detail_url}: {exc}")
            continue
        fields = extract_detail(detail_page)
        yield Deal(
            source_url=source_url,
            detail_url=detail_url,
            image_url=item["image_url"],
            scraped_at=datetime.now(timezone.utc).isoformat(),
            **fields,
        )
        time.sleep(DETAIL_FETCH_DELAY_SECONDS)
