"""Site-specific config for the exito.com scraper.

Selectors below were confirmed against live DOM dumps in
output/exploration/{homepage,ofertas,detail_sample}.html (FastStore/VTEX
storefront, hashed CSS-module class names — selectors use `[class*=...]`
substring or `data-fs-*`/`data-testid` attributes where possible since
those are more stable across deploys than the full hashed class name).
"""

HOMEPAGE_URL = "https://www.exito.com/"
OFERTAS_URL = (
    "https://www.exito.com/ofertas-y-promociones"
    "?itm_source=Promociones&itm_medium=Promo&itm_campaign=ExclusivosOn"
)

CARD_SELECTOR = 'article[class*="productCard_productCard"]'
CARD_LINK_SELECTOR = 'a[data-testid="product-link"]::attr(href)'
CARD_IMAGE_SELECTOR = 'a[data-testid="product-link"] img::attr(src)'
CARD_NAME_SELECTOR = 'h3[class*="styles_name"]::text'
CARD_ORIGINAL_PRICE_SELECTOR = 'p[class*="price-dashed"]::text'
CARD_DISCOUNTED_PRICE_SELECTOR = 'p[data-fs-container-price-otros="true"]::text'
CARD_DISCOUNT_BADGE_SELECTOR = 'span[data-percentage="true"]::text'

# Site uses Swiper; arrows expose disabled state via the
# "swiper-button-disabled" CSS class, not the HTML `disabled` attribute -
# see _exhaust_carousels in fetch_pages.py for the matching check.
CAROUSEL_NEXT_ARROW_SELECTOR = ".swiper-button-next"
CAROUSEL_DISABLED_CLASS = "swiper-button-disabled"

# Bound the overlay-close click separately from the arrow click: it's
# re-checked on every loop iteration in _exhaust_carousels (up to
# MAX_CAROUSEL_CLICKS times per arrow), so a slow/never-clickable close
# button at Playwright's default 30s timeout can stall a single arrow
# for tens of minutes.
OVERLAY_CLOSE_CLICK_TIMEOUT_MS = 3000

# Promo banners (gallery tiles, countdown carousel, top "tap" carousel,
# category reach-banner) carry no price text on the listing page and
# aren't `productCard` elements - selected by the <img>'s own attribute
# since the wrapping <a> doesn't share one attribute across all four
# banner types; the href is read off the closest ancestor <a> instead
# (see extract_banner_links in extract_deals.py).
BANNER_IMAGE_SELECTOR = (
    'img[data-fs-gallery-banner-item-image], '
    'img[data-cronometer-banner-image], '
    'img[data-fs-img-tap], '
    'img[data-fs-reach-banner]'
)

# Promo popup that randomly appears and intercepts clicks (confirmed in
# output/exploration/homepage.html) - dismiss it before clicking arrows.
STORE_OVERLAY_SELECTOR = '[data-testid="store-overlay"]'
STORE_OVERLAY_CLOSE_SELECTOR = '[data-testid="store-button"]'
ARROW_CLICK_TIMEOUT_MS = 5000

DETAIL_NAME_SELECTOR = 'h1[class*="product-title"]::text'
DETAIL_ORIGINAL_PRICE_SELECTOR = 'p[class*="price-dashed"]::text'
DETAIL_DISCOUNTED_PRICE_SELECTOR = 'p[data-fs-container-price-otros="true"]::text'
DETAIL_DISCOUNT_SELECTOR = 'span[data-percentage="true"]::text'

# Stabilization tuning
# SCROLL_WAIT_MS was 400ms - too short on this site's slow/flaky network
# for a lazy-load batch's XHR + render to land before the next height
# check, so STABLE_ROUNDS_REQUIRED (3) could trip after only ~1.2s of
# real silence and quit before later batches loaded. 2000ms x 3 gives
# ~6s of grace, matched to observed page-load latencies on this site.
SCROLL_WAIT_MS = 2000
CLICK_WAIT_MS = 400
STABLE_ROUNDS_REQUIRED = 3
MAX_FULL_PAGE_PASSES = 20
MAX_CAROUSEL_CLICKS = 50
MAX_SCROLL_ITERATIONS = 200

# Throttling for detail-page fetches (no proxy available, keep load low)
DETAIL_FETCH_CONCURRENCY = 1
DETAIL_FETCH_DELAY_SECONDS = 1.0

OUTPUT_DIR = "output"
