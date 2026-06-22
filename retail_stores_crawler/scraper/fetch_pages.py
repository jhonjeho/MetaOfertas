"""Fetch a fully-rendered page: scroll to true bottom and exhaust every
carousel, repeating until a whole pass produces no new content."""

from patchright.sync_api import TimeoutError as PlaywrightTimeoutError

from scraper.config import (
    ARROW_CLICK_TIMEOUT_MS,
    CAROUSEL_DISABLED_CLASS,
    CAROUSEL_NEXT_ARROW_SELECTOR,
    CLICK_WAIT_MS,
    MAX_CAROUSEL_CLICKS,
    MAX_FULL_PAGE_PASSES,
    MAX_SCROLL_ITERATIONS,
    OVERLAY_CLOSE_CLICK_TIMEOUT_MS,
    SCROLL_WAIT_MS,
    STABLE_ROUNDS_REQUIRED,
    STORE_OVERLAY_CLOSE_SELECTOR,
    STORE_OVERLAY_SELECTOR,
)


def _is_arrow_disabled(arrow) -> bool:
    """Swiper marks a spent arrow via a CSS class, not the HTML
    `disabled` attribute, so Playwright's is_disabled() never catches
    it - check the class list directly instead."""
    class_attr = arrow.get_attribute("class") or ""
    return CAROUSEL_DISABLED_CLASS in class_attr.split()


def _scroll_to_bottom(page) -> bool:
    """Scroll until document height stops growing. Returns True if any
    growth was observed (i.e. new content loaded)."""
    last_height = page.evaluate("document.body.scrollHeight")
    stable = 0
    changed = False
    iterations = 0
    while stable < STABLE_ROUNDS_REQUIRED:
        if iterations >= MAX_SCROLL_ITERATIONS:
            raise RuntimeError(
                f"page height never stabilized after {MAX_SCROLL_ITERATIONS} "
                "scroll iterations - possible infinite-growth page or broken stop condition"
            )
        iterations += 1
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(SCROLL_WAIT_MS)
        height = page.evaluate("document.body.scrollHeight")
        if height == last_height:
            stable += 1
        else:
            stable = 0
            changed = True
        last_height = height
    return changed


def _dismiss_overlay(page) -> None:
    """Close the promo popup if present - it intercepts carousel-arrow
    clicks otherwise (data-testid="store-overlay", see config.py).
    Bounded + caught: this runs on every loop iteration in
    _exhaust_carousels (up to MAX_CAROUSEL_CLICKS times per arrow), so
    an unbounded click() here can stall a single arrow for tens of
    minutes if the popup reappears or its close button never satisfies
    Playwright's actionability check."""
    overlay = page.locator(STORE_OVERLAY_SELECTOR)
    if overlay.count() and overlay.nth(0).is_visible():
        try:
            page.locator(STORE_OVERLAY_CLOSE_SELECTOR).nth(0).click(
                timeout=OVERLAY_CLOSE_CLICK_TIMEOUT_MS
            )
        except PlaywrightTimeoutError:
            pass


def _exhaust_carousels(page) -> bool:
    """Click every carousel's next arrow until each plateaus or
    disappears. Returns True if any click happened.

    A popup overlay can intercept an arrow click and hang until Playwright's
    click timeout fires; that's caught per-arrow so one blocked carousel
    doesn't abort the rest."""
    changed = False
    arrows = page.locator(CAROUSEL_NEXT_ARROW_SELECTOR)
    for i in range(arrows.count()):
        arrow = arrows.nth(i)
        clicks = 0
        while clicks < MAX_CAROUSEL_CLICKS:
            if not arrow.is_visible() or _is_arrow_disabled(arrow):
                break
            _dismiss_overlay(page)
            try:
                arrow.click(timeout=ARROW_CLICK_TIMEOUT_MS)
            except PlaywrightTimeoutError:
                break
            page.wait_for_timeout(CLICK_WAIT_MS)
            clicks += 1
            changed = True
        if clicks >= MAX_CAROUSEL_CLICKS:
            raise RuntimeError(
                f"carousel arrow #{i} did not stop after {MAX_CAROUSEL_CLICKS} "
                "clicks - possible infinite loop, selector may be wrong"
            )
    return changed


def explore_full_page(page) -> None:
    """page_action: reveal every deal on the page before extraction."""
    for _ in range(MAX_FULL_PAGE_PASSES):
        scrolled = _scroll_to_bottom(page)
        clicked = _exhaust_carousels(page)
        if not scrolled and not clicked:
            return
    raise RuntimeError(
        f"page did not stabilize after {MAX_FULL_PAGE_PASSES} passes - "
        "scroll/carousel logic may be stuck"
    )


def fetch_rendered(url: str):
    from scrapling.fetchers import StealthyFetcher

    return StealthyFetcher.fetch(
        url,
        block_webrtc=True,
        hide_canvas=True,
        network_idle=True,
        timeout=90000,
        page_action=explore_full_page,
    )
