import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import {
  buildMeliApiHeaders,
  extractActivePricing,
  fetchItemLivePricing,
  filterTrustedNewListings
} from './scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_PATH = path.resolve(__dirname, '../src/data/portatiles.json');
const SYNC_META_PATH = path.resolve(__dirname, '../src/data/price-sync.json');
const ACTIVE_URLS_PATH = path.resolve(__dirname, '../urls-activas.txt');
const BROWSER_PROFILE_DIR = path.resolve(__dirname, './.meli-browser-profile');

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/**
 * Formats an integer COP amount without decimals using Intl.NumberFormat('es-CO')
 */
export function formatCopNoDecimals(amount) {
  return copFormatter.format(Math.round(amount));
}

/**
 * Sleeps for an exact number of milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleeps between 800ms and 1500ms between public fetch requests to avoid rate limits
 */
function randomDelay(minMs = 800, maxMs = 1500) {
  const ms = minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
  return sleep(ms);
}

/**
 * Builds realistic Windows Chrome HTML headers for direct permalink fetches
 */
export function buildBrowserHtmlHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-CO,es;q=0.9',
    'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Upgrade-Insecure-Requests': '1'
  };
}

/**
 * Parses a COP price string or number into an integer (e.g. "1.479.900" -> 1479900)
 */
export function parseCopInteger(raw) {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
  }
  if (typeof raw !== 'string') return null;

  const cleaned = raw.trim().replace(/[$\sCOP]/gi, '');
  // Strip trailing 1-2 decimal digits if present (e.g. "1479900.00"), without touching ".900" thousands
  const noDecimals = cleaned.replace(/([.,]\d{1,2})$/, '');
  const digitsOnly = noDecimals.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;

  const num = parseInt(digitsOnly, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Searches recursively inside parsed JSON-LD objects for a @type: "Product" entry
 */
function findJsonLdProduct(node) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJsonLdProduct(item);
      if (found) return found;
    }
    return null;
  }

  const nodeType = node['@type'];
  const isProduct = nodeType === 'Product' || (Array.isArray(nodeType) && nodeType.includes('Product'));
  if (isProduct) return node;

  if (node['@graph']) {
    const found = findJsonLdProduct(node['@graph']);
    if (found) return found;
  }
  return null;
}

/**
 * Extracts active COP price and optional strikethrough originalPrice from public Mercado Libre HTML
 * Priority cascade:
 *   a) JSON-LD <script type="application/ld+json"> (@type: "Product" -> offers.price)
 *   b) Mercado Libre DOM selectors (.ui-pdp-price__second-line / .ui-pdp-price__original-value)
 *   c) <meta property="product:price:amount"> or embedded initial page state
 */
export function extractPricingFromHtml(html) {
  if (!html || typeof html !== 'string') {
    return { price: 0, source: 'empty-html', blockedByAntiBot: false };
  }

  if (html.includes('/gz/account-verification') || html.includes('account-verification-script')) {
    return { price: 0, source: 'account-verification', blockedByAntiBot: true };
  }

  const $ = cheerio.load(html);
  let price = null;
  let originalPrice = null;
  let source = null;

  // (a) JSON-LD @type: "Product" -> offers.price
  $('script[type="application/ld+json"]').each((_, el) => {
    if (price) return;
    const rawJson = $(el).html();
    if (!rawJson) return;
    try {
      const parsed = JSON.parse(rawJson);
      const product = findJsonLdProduct(parsed);
      const offers = product?.offers;
      const offerObj = Array.isArray(offers) ? offers[0] : offers;
      const candidate = parseCopInteger(offerObj?.price ?? offerObj?.lowPrice);
      if (candidate) {
        price = candidate;
        source = 'json-ld';
      }
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  });

  // (b) Mercado Libre PDP DOM selectors
  const domPriceText =
    $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text() ||
    $('.ui-pdp-price .andes-money-amount__fraction').not('.ui-pdp-price__original-value .andes-money-amount__fraction').first().text();

  const domOriginalText = $('.ui-pdp-price__original-value .andes-money-amount__fraction').first().text();

  if (!price && domPriceText) {
    const domPrice = parseCopInteger(domPriceText);
    if (domPrice) {
      price = domPrice;
      source = 'dom-ui-pdp-price';
    }
  }

  if (domOriginalText) {
    const domOriginal = parseCopInteger(domOriginalText);
    if (domOriginal) {
      originalPrice = domOriginal;
    }
  }

  // (c) Fallback metadata & embedded initial state JSON
  if (!price) {
    const metaPrice =
      $('meta[property="product:price:amount"]').attr('content') ||
      $('meta[itemprop="price"]').attr('content');
    const parsedMeta = parseCopInteger(metaPrice);
    if (parsedMeta) {
      price = parsedMeta;
      source = 'meta-product-price';
    }
  }

  if (!price) {
    const statePriceMatch = html.match(/"(?:sale_price|price)"\s*:\s*\{[^}]*"amount"\s*:\s*(\d+(?:\.\d+)?)/i) ||
      html.match(/"price"\s*:\s*(\d{5,9})(?:[.,]\d{1,2})?\s*[,}]/i);
    if (statePriceMatch?.[1]) {
      const parsedState = parseCopInteger(statePriceMatch[1]);
      if (parsedState) {
        price = parsedState;
        source = 'embedded-state';
      }
    }
  }

  if (!originalPrice) {
    const stateOriginalMatch = html.match(/"original_price"\s*:\s*(\d{5,9})(?:[.,]\d{1,2})?\s*[,}]/i);
    if (stateOriginalMatch?.[1]) {
      originalPrice = parseCopInteger(stateOriginalMatch[1]);
    }
  }

  if (!price) {
    return { price: 0, source: 'not-found', blockedByAntiBot: false };
  }

  const validOriginal = originalPrice && originalPrice > price ? originalPrice : undefined;
  const rawDiscount = validOriginal
    ? Math.round(((validOriginal - price) / validOriginal) * 100)
    : undefined;
  const discountPercentage = rawDiscount && rawDiscount > 0 ? rawDiscount : undefined;

  const buyboxShippingText = $('.ui-pdp-media__title, .ui-pdp-color--GREEN, #shipping_summary').text().replace(/\s+/g, ' ').trim();
  const freeShipping = buyboxShippingText ? /env[ií]o\s+gratis|llega\s+gratis/i.test(buyboxShippingText) : undefined;
  const rawInstallments = $('.ui-pdp-price__subtitles').first().text().replace(/\s+/g, ' ').trim();
  const installments = rawInstallments && rawInstallments.length > 0 && rawInstallments.length <= 90 ? rawInstallments : undefined;

  return {
    price,
    originalPrice: validOriginal,
    discountPercentage,
    freeShipping,
    installments,
    source,
    blockedByAntiBot: false
  };
}

/**
 * Fetches live pricing directly from a public Mercado Libre permalink HTML page
 */
async function fetchPermalinkHtmlPricing(permalink, browserHeaders) {
  try {
    const res = await fetch(permalink, {
      headers: browserHeaders,
      redirect: 'follow'
    });

    const html = await res.text();
    if (res.url.includes('/gz/account-verification')) {
      return {
        ok: false,
        status: res.status,
        blockedByAntiBot: true,
        error: 'Redirección a verificación anti-bot (/gz/account-verification)'
      };
    }

    if (res.status !== 200) {
      return {
        ok: false,
        status: res.status,
        blockedByAntiBot: false,
        error: `HTTP ${res.status} al consultar permalink`
      };
    }

    const parsed = extractPricingFromHtml(html);
    if (parsed.blockedByAntiBot) {
      return {
        ok: false,
        status: res.status,
        blockedByAntiBot: true,
        error: 'Página protegida por verificación anti-bot (/gz/account-verification)'
      };
    }

    if (parsed.price <= 0) {
      return {
        ok: false,
        status: res.status,
        blockedByAntiBot: false,
        error: `No se detectó precio en HTML (${parsed.source})`
      };
    }

    return {
      ok: true,
      status: res.status,
      source: parsed.source,
      pricing: {
        price: parsed.price,
        originalPrice: parsed.originalPrice,
        discountPercentage: parsed.discountPercentage,
        freeShipping: parsed.freeShipping,
        installments: parsed.installments
      }
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      blockedByAntiBot: false,
      error: error.message
    };
  }
}

/**
 * Resolves a Mercado Libre listing Item ID (MCO...) or Catalog/UP ID from a stored laptop entry
 */
function resolveIds(laptop) {
  const rawId = String(laptop.id || '').trim().toUpperCase();
  const enlace = String(laptop.enlace || laptop.url || '');

  const articleMatch = enlace.match(/\/MCO-(\d+)-/i);
  if (articleMatch) {
    return { itemId: `MCO${articleMatch[1]}`, productId: null };
  }

  const catalogMatch = enlace.match(/\/(?:p|up)\/(MCO[U]?\d+)/i);
  if (catalogMatch) {
    return { itemId: null, productId: catalogMatch[1].toUpperCase() };
  }

  if (/^MCO\d{9,}$/.test(rawId)) {
    return { itemId: rawId, productId: null };
  }

  return { itemId: null, productId: /^MCO\d+$/.test(rawId) ? rawId : null };
}

/**
 * Fetches live price via authenticated API for /p/MCO... or /up/MCOU... catalog entries
 */
async function fetchCatalogProductLivePricing(productId, searchResultsByProductId, headers) {
  if (searchResultsByProductId.has(productId)) {
    const matched = searchResultsByProductId.get(productId);
    const liveItem = await fetchItemLivePricing(matched.id, headers);
    if (liveItem.ok) return liveItem;
    return { ok: true, status: 200, pricing: extractActivePricing(matched) };
  }

  if (productId.startsWith('MCOU')) {
    try {
      const searchUpRes = await axios.get(
        `https://api.mercadolibre.com/sites/MCO/search?user_product_id=${encodeURIComponent(productId)}&condition=new`,
        { headers, timeout: 10000 }
      );
      const activeUp = filterTrustedNewListings(searchUpRes.data?.results || []);
      if (activeUp.length > 0) {
        const liveItem = await fetchItemLivePricing(activeUp[0].id, headers);
        if (liveItem.ok) return liveItem;
        return { ok: true, status: searchUpRes.status, pricing: extractActivePricing(activeUp[0]) };
      }
      return { ok: false, status: searchUpRes.status, error: 'Sin publicaciones activas para User Product' };
    } catch (error) {
      return {
        ok: false,
        status: error.response?.status ?? null,
        error: error.response?.data?.message || error.message
      };
    }
  }

  try {
    const res = await axios.get(`https://api.mercadolibre.com/products/${productId}/items`, {
      headers,
      timeout: 10000
    });
    const activeItems = (res.data?.results || []).filter(r => r.condition === 'new' && r.price > 0);
    if (activeItems.length > 0) {
      const liveItem = await fetchItemLivePricing(activeItems[0].item_id || activeItems[0].id, headers);
      if (liveItem.ok) return liveItem;
      return { ok: true, status: res.status, pricing: extractActivePricing(activeItems[0]) };
    }
    return { ok: false, status: res.status, error: 'Sin publicaciones activas en catálogo' };
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status ?? null,
      error: error.response?.data?.message || error.message
    };
  }
}

/**
 * Launches a visible persistent browser context using locally installed Chrome or Edge
 */
export async function launchMeliPersistentContext() {
  const launchOptions = {
    headless: false,
    locale: 'es-CO',
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  };

  for (const channel of ['chrome', 'msedge']) {
    try {
      const context = await chromium.launchPersistentContext(BROWSER_PROFILE_DIR, {
        ...launchOptions,
        channel
      });
      console.log(`🌐 Navegador persistente iniciado (${channel}) en ${BROWSER_PROFILE_DIR}`);
      return context;
    } catch (err) {
      console.warn(`⚠️ No se pudo iniciar channel '${channel}': ${err.message}`);
    }
  }

  // Fallback to default Playwright Chromium if neither Chrome nor Edge channel succeeded
  return chromium.launchPersistentContext(BROWSER_PROFILE_DIR, launchOptions);
}

/**
 * Checks whether the current browser URL or page content is Mercado Libre verification/login
 */
export function isVerificationOrLoginUrl(urlString) {
  return (
    urlString.includes('/gz/account-verification') ||
    urlString.includes('/login') ||
    urlString.includes('auth.mercadolibre') ||
    urlString.includes('/registration')
  );
}

/**
 * Waits until either .ui-pdp-price or a Product JSON-LD script is attached in the DOM
 */
export async function waitForProductPriceSelector(page, timeout = 15000) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('.ui-pdp-price')) return true;
      const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const s of ldScripts) {
        if (s.textContent && s.textContent.includes('Product')) return true;
      }
      return false;
    },
    undefined,
    { timeout }
  ).catch(() => {});
}

/**
 * Opens a Mercado Libre permalink in a real browser tab, waits for price selectors
 * (or up to 60s on first verification/login gate for manual user sign-in), and parses HTML.
 */
async function fetchPermalinkPlaywrightPricing(context, permalink, state) {
  const page = await context.newPage();
  try {
    await page.goto(permalink, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait briefly for either product price nodes or a verification/login redirect
    await page.waitForSelector(
      '.ui-pdp-price, script[type="application/ld+json"], #account-verification-script, form[action*="login"]',
      { state: 'attached', timeout: 15000 }
    ).catch(() => {});

    const htmlSnapshot = await page.content();
    const needsAuthOrVerification =
      isVerificationOrLoginUrl(page.url()) ||
      htmlSnapshot.includes('/gz/account-verification') ||
      htmlSnapshot.includes('account-verification-script');

    if (needsAuthOrVerification) {
      if (!state.manualAuthWaited) {
        state.manualAuthWaited = true;
        console.log('Inicia sesión en Mercado Libre en la ventana abierta para continuar...');

        // Wait up to 60s for the user to finish signing in in the visible browser window
        await page.waitForFunction(
          () => {
            const href = window.location.href;
            const blocked =
              href.includes('/gz/account-verification') ||
              href.includes('/login') ||
              href.includes('auth.mercadolibre') ||
              href.includes('/registration') ||
              Boolean(document.querySelector('#account-verification-script'));
            return !blocked;
          },
          undefined,
          { timeout: 60000 }
        );

        // Wait briefly for post-login redirect to load the product page; if it landed elsewhere (e.g. home), re-open permalink
        await waitForProductPriceSelector(page, 6000);
        const hasPriceNode = await page.evaluate(() => Boolean(document.querySelector('.ui-pdp-price')));
        if (!hasPriceNode) {
          await page.goto(permalink, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await waitForProductPriceSelector(page, 15000);
        }
      } else {
        await waitForProductPriceSelector(page, 10000);
      }
    } else {
      await waitForProductPriceSelector(page, 15000);
    }

    const finalHtml = await page.content();
    const parsed = extractPricingFromHtml(finalHtml);

    if (parsed.blockedByAntiBot || isVerificationOrLoginUrl(page.url())) {
      return {
        ok: false,
        status: 200,
        blockedByAntiBot: true,
        error: 'Bloqueado por verificación / inicio de sesión (/gz/account-verification)'
      };
    }

    if (parsed.price <= 0) {
      return {
        ok: false,
        status: 200,
        blockedByAntiBot: false,
        error: `No se detectó precio en el navegador (${parsed.source})`
      };
    }

    return {
      ok: true,
      status: 200,
      source: parsed.source,
      pricing: {
        price: parsed.price,
        originalPrice: parsed.originalPrice,
        discountPercentage: parsed.discountPercentage,
        freeShipping: parsed.freeShipping,
        installments: parsed.installments
      }
    };
  } catch (error) {
    const blocked = isVerificationOrLoginUrl(page.url());
    return {
      ok: false,
      status: 200,
      blockedByAntiBot: blocked,
      error: blocked
        ? 'Tiempo de espera (60s) agotado en verificación / inicio de sesión (/gz/account-verification)'
        : error.message
    };
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Collects IDs marked as `not-found` from a price-sync report
 */
export function extractNotFoundIds(syncReport) {
  const hiddenIds = new Set(syncReport?.notFoundIds || []);
  const lists = [syncReport?.failures || [], syncReport?.sampleFailures || []];
  for (const list of lists) {
    for (const entry of list) {
      if (
        entry?.id &&
        (entry.status === 'not-found' || String(entry.error || '').includes('not-found'))
      ) {
        hiddenIds.add(entry.id);
      }
    }
  }
  return Array.from(hiddenIds);
}

/**
 * Writes active laptop permalinks (one per line, no quotes or extra spaces) to urls-activas.txt
 */
export async function writeActiveUrlsFile(catalog, notFoundIdsList = []) {
  const hiddenSet = new Set(notFoundIdsList);
  const urls = catalog
    .filter(item => !hiddenSet.has(item.id))
    .map(item => String(item.enlace || item.url || '').trim())
    .filter(Boolean);

  await fs.writeFile(ACTIVE_URLS_PATH, `${urls.join('\n')}\n`, 'utf-8');
  return urls;
}

/**
 * Attempts authenticated/public API pricing update first when MELI_ACCESS_TOKEN exists,
 * falling back to direct public HTML permalink scraping, and launching Playwright with a
 * persistent Chrome/Edge profile if fetch is redirected to /gz/account-verification.
 */
export async function updateCatalogPrices() {
  const rawJson = await fs.readFile(CATALOG_PATH, 'utf-8');
  const catalog = JSON.parse(rawJson);

  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('El catálogo src/data/portatiles.json está vacío o no tiene formato válido.');
  }

  const apiHeaders = buildMeliApiHeaders();
  const browserHeaders = buildBrowserHtmlHeaders();
  const hasToken = Boolean(apiHeaders.Authorization);

  console.log(`🔄 Iniciando actualización rápida de precios para ${catalog.length} portátiles...`);

  let useHtmlMode = !hasToken;
  let usePlaywrightMode = false;
  let browserContext = null;
  const playwrightState = { manualAuthWaited: false };
  const searchResultsByProductId = new Map();

  if (hasToken) {
    try {
      const searchRes = await axios.get(
        'https://api.mercadolibre.com/sites/MCO/search?category=MCO1652&condition=new&limit=50',
        { headers: apiHeaders, timeout: 10000 }
      );
      for (const item of filterTrustedNewListings(searchRes.data?.results || [])) {
        if (item.catalog_product_id) {
          searchResultsByProductId.set(String(item.catalog_product_id).toUpperCase(), item);
        }
        if (item.user_product_id) {
          searchResultsByProductId.set(String(item.user_product_id).toUpperCase(), item);
        }
      }
    } catch (error) {
      const status = error.response?.status ?? null;
      if (status === 401 || status === 403) {
        console.warn(`⚠️ API respondió ${status}; cambiando a extracción directa desde permalink HTML.`);
        useHtmlMode = true;
      }
    }
  } else {
    console.log('ℹ️ Sin MELI_ACCESS_TOKEN: consultando permalinks públicos (con fallback Playwright si hay verificación).');
  }

  const syncedAt = new Date().toISOString();
  let updatedCount = 0;
  let failedCount = 0;
  let antiBotBlockedCount = 0;
  const failures = [];
  const updatedCatalog = [];

  try {
    for (let i = 0; i < catalog.length; i++) {
      const laptop = catalog[i];
      const permalink = laptop.enlace || laptop.url;
      let result = null;

      if (!useHtmlMode && !usePlaywrightMode) {
        const { itemId, productId } = resolveIds(laptop);
        if (itemId) {
          result = await fetchItemLivePricing(itemId, apiHeaders);
        } else if (productId) {
          result = await fetchCatalogProductLivePricing(productId, searchResultsByProductId, apiHeaders);
        }
        if (result && (result.status === 401 || result.status === 403)) {
          useHtmlMode = true;
          result = null;
        }
      }

      if ((useHtmlMode && !usePlaywrightMode) || (!usePlaywrightMode && !result)) {
        if (i > 0) {
          await randomDelay(800, 1500);
        }
        result = await fetchPermalinkHtmlPricing(permalink, browserHeaders);
        if (result?.blockedByAntiBot) {
          console.warn('⚠️ fetch directo recibió /gz/account-verification; iniciando Playwright visible con perfil persistente...');
          usePlaywrightMode = true;
          result = null;
        }
      }

      if (usePlaywrightMode) {
        if (!browserContext) {
          browserContext = await launchMeliPersistentContext();
        }
        if (i > 0 && result === null) {
          await sleep(1000);
        }
        result = await fetchPermalinkPlaywrightPricing(browserContext, permalink, playwrightState);
        console.log(
          `   [${i + 1}/${catalog.length}] ${laptop.id}: ${
            result.ok ? formatCopNoDecimals(result.pricing.price) : result.error
          }`
        );
      }

      if (!result?.ok || !result.pricing || result.pricing.price <= 0) {
        failedCount++;
        if (result?.blockedByAntiBot) antiBotBlockedCount++;
        failures.push({
          id: laptop.id,
          permalink,
          status: result?.status ?? null,
          error: result?.error || 'Error desconocido'
        });
        updatedCatalog.push(laptop);
        continue;
      }

      updatedCount++;
      const { price, originalPrice, discountPercentage, freeShipping, installments } = result.pricing;

      // Update ONLY pricing, shipping, installments and sync timestamp;
      // explicitly preserve affiliateUrl, tier, processor and core specs untouched.
      const nextItem = {
        ...laptop,
        price,
        precioCOP: price,
        precioCOPFormateado: formatCopNoDecimals(price),
        freeShipping: typeof freeShipping === 'boolean' ? freeShipping : laptop.freeShipping,
        installments: installments || laptop.installments,
        priceSyncedAt: syncedAt,
        affiliateUrl: laptop.affiliateUrl,
        tier: laptop.tier,
        processor: laptop.processor
      };

      if (nextItem.affiliateUrl === undefined) {
        delete nextItem.affiliateUrl;
      }

      if (originalPrice !== undefined && discountPercentage !== undefined) {
        nextItem.originalPrice = originalPrice;
        nextItem.discountPercentage = discountPercentage;
      } else {
        delete nextItem.originalPrice;
        delete nextItem.discountPercentage;
      }

      updatedCatalog.push(nextItem);
    }
  } finally {
    if (browserContext) {
      await browserContext.close().catch(() => {});
    }
  }

  const mode = usePlaywrightMode
    ? 'playwright-persistent'
    : useHtmlMode
      ? 'public-permalink-html'
      : 'meli-api';

  const notFoundIds = extractNotFoundIds({ failures });

  const syncSummary = {
    lastSyncedAt: syncedAt,
    mode,
    updatedCount,
    failedCount,
    antiBotBlockedCount,
    totalCount: catalog.length,
    authTokenConfigured: hasToken,
    notFoundIds,
    failures,
    sampleFailures: failures.slice(0, 5)
  };

  await fs.writeFile(SYNC_META_PATH, JSON.stringify(syncSummary, null, 2), 'utf-8');

  if (updatedCount === 0) {
    console.error(`❌ 0/${catalog.length} portátiles actualizados (${antiBotBlockedCount} bloqueados por /gz/account-verification).`);
    console.error('   Detalle:', JSON.stringify(syncSummary.sampleFailures.slice(0, 3)));
    console.error('   Nota: No se modificó src/data/portatiles.json para evitar datos falsos.');
    process.exitCode = 1;
    return syncSummary;
  }

  await fs.writeFile(CATALOG_PATH, JSON.stringify(updatedCatalog, null, 2), 'utf-8');
  const activeUrls = await writeActiveUrlsFile(updatedCatalog, notFoundIds);
  console.log(`✅ Precios actualizados: ${updatedCount}/${catalog.length} portátiles (${syncedAt}).`);
  console.log(`🔗 Exportadas ${activeUrls.length} URLs activas en urls-activas.txt.`);
  if (failedCount > 0) {
    console.warn(`⚠️ ${failedCount} portátiles mantuvieron su precio previo (${antiBotBlockedCount} por verificación anti-bot).`);
  }
  return syncSummary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateCatalogPrices().catch(err => {
    console.error('❌ Error fatal al actualizar precios:', err);
    process.exit(1);
  });
}
