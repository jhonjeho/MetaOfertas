"""Test suite for the exito.com scraper.

Offline tests use fake page/selector objects (synthetic, not real site
data) to verify the scroll/carousel stabilization algorithms and the
two-stage extraction logic in isolation.

Live tests hit the real site and are excluded by default (pytest.ini
`-m "not live"`); run explicitly with `pytest -m live` once
scraper/config.py selectors are confirmed against the live DOM (see
scraper/explore.py).
"""

import pytest
from patchright.sync_api import TimeoutError as PlaywrightTimeoutError

from scraper import config, fetch_pages
from scraper.extract_deals import (
    _is_product_detail_url,
    extract_banner_links,
    extract_detail,
    extract_detail_links,
)


# ---------------------------------------------------------------------
# Fakes for offline testing - synthetic, not captured from the real site
# ---------------------------------------------------------------------


class FakeArrow:
    def __init__(self, visible_for_clicks: int, disabled=False, raises_timeout_after=None):
        self.clicks = 0
        self.visible_for_clicks = visible_for_clicks
        self.disabled = disabled
        # if set, click() raises a Playwright timeout once self.clicks
        # reaches this count - simulates the overlay blocking the arrow
        self.raises_timeout_after = raises_timeout_after

    def is_visible(self):
        return self.clicks < self.visible_for_clicks

    def get_attribute(self, name):
        if name == "class":
            return "swiper-button-next swiper-button-disabled" if self.disabled else "swiper-button-next"
        return None

    def click(self, timeout=None):
        if self.raises_timeout_after is not None and self.clicks >= self.raises_timeout_after:
            raise PlaywrightTimeoutError("blocked by overlay")
        self.clicks += 1


class FakeArrowLocator:
    def __init__(self, arrows):
        self.arrows = arrows

    def count(self):
        return len(self.arrows)

    def nth(self, i):
        return self.arrows[i]


class FakeOverlayLocator:
    """Models the store popup: present until dismissed via click()."""

    def __init__(self, present=False):
        self.present = present
        self.click_calls = 0

    def count(self):
        return 1 if self.present else 0

    def nth(self, i):
        return self

    def is_visible(self):
        return self.present

    def click(self, timeout=None):
        self.click_calls += 1
        self.present = False


class FakePage:
    """Simulates the subset of the Playwright page API that
    fetch_pages._scroll_to_bottom / _exhaust_carousels touch."""

    def __init__(self, heights, arrows=None, overlay_present=False):
        self.heights = list(heights)
        self.height_calls = 0
        self.arrows = arrows or []
        self.overlay = FakeOverlayLocator(overlay_present)

    def evaluate(self, script):
        # both the scrollTo call and the scrollHeight read go through
        # evaluate(); only the height-read result matters for the test
        if "scrollHeight" in script and "scrollTo" not in script:
            height = self.heights[min(self.height_calls, len(self.heights) - 1)]
            self.height_calls += 1
            return height
        return None

    def wait_for_timeout(self, ms):
        pass

    def locator(self, selector):
        if selector in (config.STORE_OVERLAY_SELECTOR, config.STORE_OVERLAY_CLOSE_SELECTOR):
            return self.overlay
        return FakeArrowLocator(self.arrows)


# ---------------------------------------------------------------------
# Scroll stabilization
# ---------------------------------------------------------------------


def test_scroll_to_bottom_detects_growth_then_stops():
    # grows 3 times, then 3 identical reads in a row to satisfy
    # STABLE_ROUNDS_REQUIRED
    page = FakePage(heights=[100, 200, 300, 300, 300, 300])
    changed = fetch_pages._scroll_to_bottom(page)
    assert changed is True
    # stopped once stable, not still calling evaluate forever
    assert page.height_calls == len(page.heights)


def test_scroll_to_bottom_no_growth_returns_false():
    page = FakePage(heights=[500, 500, 500, 500])
    changed = fetch_pages._scroll_to_bottom(page)
    assert changed is False


# ---------------------------------------------------------------------
# Carousel exhaustion
# ---------------------------------------------------------------------


def test_exhaust_carousels_clicks_until_invisible():
    arrow = FakeArrow(visible_for_clicks=4)
    page = FakePage(heights=[0], arrows=[arrow])
    changed = fetch_pages._exhaust_carousels(page)
    assert changed is True
    assert arrow.clicks == 4


def test_exhaust_carousels_no_arrows_returns_false():
    page = FakePage(heights=[0], arrows=[])
    changed = fetch_pages._exhaust_carousels(page)
    assert changed is False


def test_exhaust_carousels_raises_on_runaway(monkeypatch):
    monkeypatch.setattr(fetch_pages, "MAX_CAROUSEL_CLICKS", 5)
    arrow = FakeArrow(visible_for_clicks=10_000)  # never stops being visible
    page = FakePage(heights=[0], arrows=[arrow])
    with pytest.raises(RuntimeError, match="infinite loop"):
        fetch_pages._exhaust_carousels(page)


def test_exhaust_carousels_dismisses_overlay_before_clicking():
    arrow = FakeArrow(visible_for_clicks=2)
    page = FakePage(heights=[0], arrows=[arrow], overlay_present=True)
    changed = fetch_pages._exhaust_carousels(page)
    assert changed is True
    assert arrow.clicks == 2
    assert page.overlay.click_calls == 1


class FakeStuckOverlayLocator(FakeOverlayLocator):
    """Overlay whose close button never satisfies actionability -
    click() always times out instead of dismissing it, simulating a
    popup that reappears or a stale close-button selector."""

    def click(self, timeout=None):
        self.click_calls += 1
        raise PlaywrightTimeoutError("overlay close button never clickable")


def test_exhaust_carousels_overlay_close_never_succeeds_does_not_hang():
    arrow = FakeArrow(visible_for_clicks=3)
    page = FakePage(heights=[0], arrows=[arrow], overlay_present=True)
    page.overlay = FakeStuckOverlayLocator(present=True)
    changed = fetch_pages._exhaust_carousels(page)
    assert changed is True
    assert arrow.clicks == 3
    assert page.overlay.click_calls == 3


def test_exhaust_carousels_skips_arrow_blocked_by_overlay():
    # arrow's click() always times out (e.g. overlay re-intercepts it) -
    # must not abort the whole pass, just stop on that arrow
    blocked = FakeArrow(visible_for_clicks=10_000, raises_timeout_after=0)
    healthy = FakeArrow(visible_for_clicks=3)
    page = FakePage(heights=[0], arrows=[blocked, healthy])
    changed = fetch_pages._exhaust_carousels(page)
    assert changed is True
    assert blocked.clicks == 0
    assert healthy.clicks == 3


# ---------------------------------------------------------------------
# Combined pass convergence
# ---------------------------------------------------------------------


def test_explore_full_page_converges():
    # scroll grows once, carousel has one small arrow, then both settle
    page = FakePage(heights=[100, 200, 200, 200, 200], arrows=[FakeArrow(visible_for_clicks=1)])
    fetch_pages.explore_full_page(page)  # should not raise


class NeverStablePage:
    """Height grows forever, never plateaus - simulates a page that
    can't be fully revealed (e.g. broken stop condition on the site)."""

    def __init__(self):
        self.height = 0

    def evaluate(self, script):
        if "scrollHeight" in script and "scrollTo" not in script:
            self.height += 100
            return self.height
        return None

    def wait_for_timeout(self, ms):
        pass

    def locator(self, selector):
        return FakeArrowLocator([])


def test_scroll_to_bottom_raises_on_runaway_growth(monkeypatch):
    monkeypatch.setattr(fetch_pages, "MAX_SCROLL_ITERATIONS", 5)
    page = NeverStablePage()
    with pytest.raises(RuntimeError, match="never stabilized"):
        fetch_pages._scroll_to_bottom(page)


def test_explore_full_page_raises_when_never_stable(monkeypatch):
    monkeypatch.setattr(fetch_pages, "MAX_FULL_PAGE_PASSES", 2)
    monkeypatch.setattr(fetch_pages, "MAX_SCROLL_ITERATIONS", 5)
    page = NeverStablePage()
    with pytest.raises(RuntimeError):
        fetch_pages.explore_full_page(page)


# ---------------------------------------------------------------------
# Extraction logic (stage A / stage B) - fake Selector-like objects
# ---------------------------------------------------------------------


class FakeCssResult:
    def __init__(self, value):
        self.value = value

    def get(self):
        return self.value


class FakeCard:
    def __init__(
        self,
        href,
        image_src=None,
        name=None,
        original_price=None,
        discounted_price=None,
        discount=None,
    ):
        self.href = href
        self.image_src = image_src
        self.name = name
        self.original_price = original_price
        self.discounted_price = discounted_price
        self.discount = discount

    def css(self, selector):
        from scraper.config import (
            CARD_DISCOUNT_BADGE_SELECTOR,
            CARD_DISCOUNTED_PRICE_SELECTOR,
            CARD_IMAGE_SELECTOR,
            CARD_LINK_SELECTOR,
            CARD_NAME_SELECTOR,
            CARD_ORIGINAL_PRICE_SELECTOR,
        )

        mapping = {
            CARD_IMAGE_SELECTOR: self.image_src,
            CARD_LINK_SELECTOR: self.href,
            CARD_NAME_SELECTOR: self.name,
            CARD_ORIGINAL_PRICE_SELECTOR: self.original_price,
            CARD_DISCOUNTED_PRICE_SELECTOR: self.discounted_price,
            CARD_DISCOUNT_BADGE_SELECTOR: self.discount,
        }
        return FakeCssResult(mapping.get(selector))


class FakeListingPage:
    def __init__(self, cards, base_url):
        self.cards = cards
        self.base_url = base_url

    def css(self, selector):
        return self.cards

    def urljoin(self, relative):
        if relative.startswith("http"):
            return relative
        return self.base_url.rstrip("/") + "/" + relative.lstrip("/")


class FakeAnchor:
    def __init__(self, href):
        self.tag = "a"
        self.attrib = {"href": href} if href else {}


class FakeBannerImage:
    def __init__(self, src=None, alt=None, ancestor_anchor=None):
        self.tag = "img"
        self.attrib = {}
        if src:
            self.attrib["src"] = src
        if alt:
            self.attrib["alt"] = alt
        self._ancestor = ancestor_anchor

    def find_ancestor(self, func):
        if self._ancestor is not None and func(self._ancestor):
            return self._ancestor
        return None


NO_PRICE_FIELDS = {
    "name": None,
    "original_price": None,
    "discounted_price": None,
    "discount": None,
}


def test_extract_detail_links_resolves_relative_urls():
    cards = [
        FakeCard("/producto/1", "/img/1.jpg"),
        FakeCard("https://www.exito.com/producto/2", "https://cdn.exito.com/img/2.jpg"),
    ]
    page = FakeListingPage(cards, base_url="https://www.exito.com")
    items = extract_detail_links(page, "https://www.exito.com/ofertas")
    assert items == [
        {
            "detail_url": "https://www.exito.com/producto/1",
            "image_url": "https://www.exito.com/img/1.jpg",
            **NO_PRICE_FIELDS,
        },
        {
            "detail_url": "https://www.exito.com/producto/2",
            "image_url": "https://cdn.exito.com/img/2.jpg",
            **NO_PRICE_FIELDS,
        },
    ]


def test_extract_detail_links_skips_cards_without_href():
    cards = [FakeCard(None, "/img/skip.jpg"), FakeCard("/producto/3", "/img/3.jpg")]
    page = FakeListingPage(cards, base_url="https://www.exito.com")
    items = extract_detail_links(page, "https://www.exito.com/ofertas")
    assert items == [
        {
            "detail_url": "https://www.exito.com/producto/3",
            "image_url": "https://www.exito.com/img/3.jpg",
            **NO_PRICE_FIELDS,
        }
    ]


def test_extract_detail_links_handles_missing_image():
    cards = [FakeCard("/producto/4", None)]
    page = FakeListingPage(cards, base_url="https://www.exito.com")
    items = extract_detail_links(page, "https://www.exito.com/ofertas")
    assert items == [
        {"detail_url": "https://www.exito.com/producto/4", "image_url": None, **NO_PRICE_FIELDS}
    ]


def test_extract_detail_links_pulls_price_name_discount_from_card():
    cards = [
        FakeCard(
            "/producto/5",
            "/img/5.jpg",
            name="Televisor 50 pulgadas",
            original_price="$1.999.900",
            discounted_price="$1.499.900",
            discount="-25%",
        )
    ]
    page = FakeListingPage(cards, base_url="https://www.exito.com")
    items = extract_detail_links(page, "https://www.exito.com/ofertas")
    assert items == [
        {
            "detail_url": "https://www.exito.com/producto/5",
            "image_url": "https://www.exito.com/img/5.jpg",
            "name": "Televisor 50 pulgadas",
            "original_price": "$1.999.900",
            "discounted_price": "$1.499.900",
            "discount": "-25%",
        }
    ]


# ---------------------------------------------------------------------
# Banner extraction (gallery/cronometer/tap/reach tiles)
# ---------------------------------------------------------------------


def test_extract_banner_links_resolves_anchor_href_and_image():
    anchor = FakeAnchor("/coleccion/31792")
    img = FakeBannerImage(src="/img/banner.png", alt="iPhone", ancestor_anchor=anchor)
    page = FakeListingPage([img], base_url="https://www.exito.com")
    items = extract_banner_links(page, "https://www.exito.com/")
    assert items == [
        {
            "detail_url": "https://www.exito.com/coleccion/31792",
            "image_url": "https://www.exito.com/img/banner.png",
            "alt_text": "iPhone",
        }
    ]


def test_extract_banner_links_skips_image_without_anchor():
    img = FakeBannerImage(src="/img/orphan.png", ancestor_anchor=None)
    page = FakeListingPage([img], base_url="https://www.exito.com")
    assert extract_banner_links(page, "https://www.exito.com/") == []


def test_extract_banner_links_skips_anchor_without_href():
    anchor = FakeAnchor(None)
    img = FakeBannerImage(src="/img/x.png", ancestor_anchor=anchor)
    page = FakeListingPage([img], base_url="https://www.exito.com")
    assert extract_banner_links(page, "https://www.exito.com/") == []


def test_extract_banner_links_handles_missing_image_src():
    anchor = FakeAnchor("/televisor-tcl-55-3226060/p")
    img = FakeBannerImage(src=None, alt="Tv TCL 55", ancestor_anchor=anchor)
    page = FakeListingPage([img], base_url="https://www.exito.com")
    items = extract_banner_links(page, "https://www.exito.com/")
    assert items == [
        {
            "detail_url": "https://www.exito.com/televisor-tcl-55-3226060/p",
            "image_url": None,
            "alt_text": "Tv TCL 55",
        }
    ]


def test_is_product_detail_url_matches_product_page():
    assert _is_product_detail_url("https://www.exito.com/televisor-tcl-55-3226060/p") is True


def test_is_product_detail_url_rejects_category_page():
    assert _is_product_detail_url("https://www.exito.com/coleccion/31792") is False
    assert (
        _is_product_detail_url(
            "https://www.exito.com/coleccion/5081?productClusterIds=5081&sort=orders_desc&page=0"
        )
        is False
    )


class FakeDetailPage:
    def __init__(self, fields):
        self.fields = fields

    def css(self, selector):
        return FakeCssResult(self.fields.get(selector))


def test_extract_detail_pulls_all_fields():
    from scraper.config import (
        DETAIL_DISCOUNT_SELECTOR,
        DETAIL_DISCOUNTED_PRICE_SELECTOR,
        DETAIL_NAME_SELECTOR,
        DETAIL_ORIGINAL_PRICE_SELECTOR,
    )

    fields = {
        DETAIL_NAME_SELECTOR: "Televisor 50 pulgadas",
        DETAIL_ORIGINAL_PRICE_SELECTOR: "$1.999.900",
        DETAIL_DISCOUNTED_PRICE_SELECTOR: "$1.499.900",
        DETAIL_DISCOUNT_SELECTOR: "-25%",
    }
    page = FakeDetailPage(fields)
    result = extract_detail(page)
    assert result == {
        "name": "Televisor 50 pulgadas",
        "original_price": "$1.999.900",
        "discounted_price": "$1.499.900",
        "discount": "-25%",
    }


# ---------------------------------------------------------------------
# Live tests - require real network + confirmed selectors.
# Run explore.py first, update config.py, then `pytest -m live`.
# ---------------------------------------------------------------------


@pytest.mark.live
def test_canary_selector_not_empty():
    pytest.importorskip("scrapling")
    from scraper.config import CARD_SELECTOR, HOMEPAGE_URL
    from scraper.fetch_pages import fetch_rendered

    page = fetch_rendered(HOMEPAGE_URL)
    assert len(page.css(CARD_SELECTOR)) > 0, (
        "CARD_SELECTOR matched nothing - site likely redesigned, "
        "update scraper/config.py before running a full scrape"
    )


@pytest.mark.live
def test_detail_link_parity():
    pytest.importorskip("scrapling")
    from scraper.config import OFERTAS_URL
    from scraper.extract_deals import extract_detail_links
    from scraper.fetch_pages import fetch_rendered

    page = fetch_rendered(OFERTAS_URL)
    items = extract_detail_links(page, OFERTAS_URL)
    urls = [item["detail_url"] for item in items]
    assert len(urls) == len(set(urls)), "duplicate detail links extracted"
    assert len(urls) > 0
    assert any(item["image_url"] for item in items), "no card yielded an image_url"
