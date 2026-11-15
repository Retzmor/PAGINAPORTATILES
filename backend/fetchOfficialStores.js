import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  cleanText,
  classifyTier,
  extractBrand,
  extractProcessor,
  extractRam,
  extractStorage
} from './scraper.js';
import {
  extractNotFoundIds,
  extractPricingFromHtml,
  formatCopNoDecimals,
  isVerificationOrLoginUrl,
  launchMeliPersistentContext,
  sleep,
  waitForProductPriceSelector
} from './updatePrices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_PATH = path.resolve(__dirname, '../src/data/portatiles.json');
const SYNC_META_PATH = path.resolve(__dirname, '../src/data/price-sync.json');
const NEW_URLS_PATH = path.resolve(__dirname, '../urls-nuevas.txt');

const OFFICIAL_STORES_SEARCH_URL =
  'https://listado.mercadolibre.com.co/computacion/portatiles-accesorios/portatiles/_ITEM*CONDITION_2230284_Tienda_all_NoIndex_True';
const OFFICIAL_STORES_PAGE2_URL =
  'https://listado.mercadolibre.com.co/computacion/portatiles-accesorios/portatiles/_Desde_51_ITEM*CONDITION_2230284_Tienda_all_NoIndex_True';

const TARGET_NEW_COUNT = 12;
const MIN_NEW_COUNT = 10;

/**
 * Strips query parameters and hash fragments to produce a canonical Mercado Libre permalink
 */
function toCleanPermalink(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.hostname.includes('click1.mercadolibre') ||
      parsed.pathname.includes('/mclics/')
    ) {
      return null;
    }
    if (
      !parsed.hostname.includes('mercadolibre.com.co') ||
      !(/\/(?:p|up)\/MCO/i.test(parsed.pathname) || /\/MCO-\d+/i.test(parsed.pathname))
    ) {
      return null;
    }
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
}

/**
 * Extracts canonical MCO / MCOU product or listing ID from a clean Mercado Libre URL
 */
function extractIdFromPermalink(permalink) {
  const catalogMatch = permalink.match(/\/(?:p|up)\/(MCO[U]?\d+)/i);
  if (catalogMatch) return catalogMatch[1].toUpperCase();

  const itemMatch = permalink.match(/\/(MCO)-?(\d+)/i);
  if (itemMatch) return `MCO${itemMatch[2]}`;

  return null;
}

/**
 * Normalizes an mlstatic image URL to HTTPS with high-resolution -O.jpg suffix
 */
function toHighResMeliImage(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let url = rawUrl.trim();
  if (!url.startsWith('http') || url.includes('data:image') || url.includes('.svg')) {
    return null;
  }
  url = url.replace(/^http:\/\//i, 'https://');
  url = url.replace(/-[A-Z](\.(?:jpg|jpeg|webp))(?:\?.*)?$/i, '-O.jpg');
  if (!url.includes('mlstatic.com')) {
    return null;
  }
  return url;
}

/**
 * Extracts screen size in inches from title or specs text
 */
function extractScreenSize(text) {
  const match = text.match(/\b(13(?:\.[0-6])?|14(?:\.0)?|15\.[36]|16(?:\.[01])?|17\.3)\s*(?:"|pulgadas|''|inch)?/i);
  return match ? `${match[1]}"` : '15.6"';
}

/**
 * Waits up to 120s on first verification/login encounter for manual sign-in
 */
async function ensureAuthenticatedSession(page, fallbackUrl, authState) {
  const html = await page.content();
  const blocked =
    isVerificationOrLoginUrl(page.url()) ||
    html.includes('/gz/account-verification') ||
    html.includes('account-verification-script');

  if (!blocked) return true;

  if (!authState.prompted) {
    authState.prompted = true;
    await page.bringToFront().catch(() => {});
    console.log('Inicia sesión en Mercado Libre en la ventana abierta para continuar (esperando hasta 120s)...');
    try {
      await page.waitForFunction(
        () => {
          const href = window.location.href;
          return (
            !href.includes('/gz/account-verification') &&
            !href.includes('/login') &&
            !href.includes('auth.mercadolibre') &&
            !href.includes('/registration') &&
            !document.querySelector('#account-verification-script')
          );
        },
        undefined,
        { timeout: 120000 }
      );
      await sleep(1200);
      if (fallbackUrl && !page.url().includes(new URL(fallbackUrl).pathname.slice(0, 20))) {
        await page.goto(fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      }
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Collects candidate clean product permalinks and card titles from the Official Stores search page
 */
async function collectCandidatesFromSearch(context, searchUrl, excludedIds, authState) {
  const page = await context.newPage();
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForSelector('.ui-search-result__wrapper, .poly-card, #account-verification-script', {
      state: 'attached',
      timeout: 4000
    }).catch(() => {});

    const sessionOk = await ensureAuthenticatedSession(page, searchUrl, authState);
    if (!sessionOk) {
      console.warn(`⚠️ No se completó la verificación/sesión en: ${page.url()}`);
      return [];
    }

    await page.waitForSelector('.ui-search-result__wrapper, .poly-card', {
      state: 'attached',
      timeout: 15000
    }).catch(() => {});

    const { rawCards, debugInfo } = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.ui-search-result__wrapper, .poly-card, li.ui-search-layout__item');
      for (const card of cards) {
        const linkEl = card.querySelector(
          'a.poly-component__title, a.ui-search-link, h2 a, h3 a, a[href*="/p/MCO"], a[href*="/up/MCO"], a[href*="articulo.mercadolibre.com.co/MCO-"]'
        );
        if (!linkEl) continue;
        const href = linkEl.getAttribute('href') || linkEl.href;
        const cardTitle = (linkEl.textContent || card.querySelector('h2, h3, .poly-component__title')?.textContent || '').trim();
        const sellerText = (
          card.querySelector('.poly-component__seller, .ui-search-official-store-label')?.textContent || ''
        ).trim();
        const priceText = (
          card.querySelector('.poly-price__current .andes-money-amount__fraction, .andes-money-amount__fraction')
            ?.textContent || ''
        ).trim();
        if (href && cardTitle) {
          results.push({ href, cardTitle, sellerText, priceText });
        }
      }
      return {
        rawCards: results,
        debugInfo: { url: window.location.href, title: document.title, cardCount: cards.length }
      };
    });

    if (rawCards.length === 0) {
      console.warn('⚠️ Sin tarjetas detectadas en búsqueda:', debugInfo);
    }

    const seenIds = new Set(excludedIds);
    const candidates = [];

    for (const card of rawCards) {
      const cleanUrl = toCleanPermalink(card.href);
      if (!cleanUrl) continue;
      const id = extractIdFromPermalink(cleanUrl);
      if (!id || seenIds.has(id)) continue;

      // Skip refurbished, used, or non-laptop accessories
      if (/\b(reacondicionado|refurbished|usado|funda|morral|cargador|base\s+refrigerante|mochila|teclado|mouse|ipad|tablet)\b/i.test(card.cardTitle)) {
        continue;
      }

      seenIds.add(id);
      candidates.push({
        id,
        permalink: cleanUrl,
        cardTitle: cleanText(card.cardTitle),
        brand: extractBrand(card.cardTitle),
        sellerHint: cleanText(card.sellerText),
        priceHint: card.priceText
      });
    }

    return candidates;
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Orders candidates to maximize brand diversity and price/tier variety without duplicates
 */
function prioritizeDiverseCandidates(candidates, keptLaptops) {
  const brandCounts = new Map();
  for (const item of keptLaptops) {
    brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1);
  }

  // Round-robin pick across underrepresented brands first (Apple, Asus, Dell, Huawei, MSI, then HP, Acer, Lenovo)
  const targetBrands = ['Apple', 'Asus', 'Dell', 'Huawei', 'MSI', 'HP', 'Acer', 'Lenovo'];
  const ordered = [];
  const usedIds = new Set();

  // First pass: ensure at least 1-2 from each missing/underrepresented brand
  for (let round = 0; round < 5; round++) {
    for (const brand of targetBrands) {
      const match = candidates.find(c => c.brand === brand && !usedIds.has(c.id));
      if (match) {
        usedIds.add(match.id);
        ordered.push(match);
      }
    }
  }

  // Remaining candidates
  for (const c of candidates) {
    if (!usedIds.has(c.id)) {
      usedIds.add(c.id);
      ordered.push(c);
    }
  }

  return ordered;
}

/**
 * Visits an individual official-store product permalink and extracts all Laptop fields
 */
async function scrapeOfficialProductPage(context, candidate, authState) {
  const page = await context.newPage();
  try {
    await page.goto(candidate.permalink, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector(
      '.ui-pdp-price, h1.ui-pdp-title, #account-verification-script, form[action*="login"]',
      { state: 'attached', timeout: 15000 }
    ).catch(() => {});

    const sessionOk = await ensureAuthenticatedSession(page, candidate.permalink, authState);
    if (!sessionOk) return { ok: false, reason: 'auth-blocked' };

    await waitForProductPriceSelector(page, 15000);
    await page.waitForSelector('h1.ui-pdp-title', { state: 'attached', timeout: 5000 }).catch(() => {});

    const html = await page.content();
    const pricing = extractPricingFromHtml(html);
    if (pricing.blockedByAntiBot) return { ok: false, reason: 'anti-bot' };
    if (!pricing.price || pricing.price <= 0) return { ok: false, reason: 'no-price' };

    const $ = cheerio.load(html);

    // Check refurbished / paused alerts on PDP
    const subtitleCondition = cleanText($('.ui-pdp-header__subtitle').first().text()).toLowerCase();
    const statusMessage = cleanText($('.ui-pdp-promotions-pill-label, .andes-message__text').text()).toLowerCase();
    if (
      subtitleCondition.includes('reacondicionado') ||
      subtitleCondition.includes('usado') ||
      statusMessage.includes('publicación pausada') ||
      statusMessage.includes('publicación finalizada')
    ) {
      return { ok: false, reason: 'not-new-or-paused' };
    }

    const title = cleanText($('h1.ui-pdp-title').first().text()) || candidate.cardTitle;
    if (!title || /\b(reacondicionado|refurbished|usado|tablet|ipad)\b/i.test(title)) {
      return { ok: false, reason: 'invalid-title' };
    }

    // Extract seller / Official Store name
    const sellerHeader = cleanText(
      $('.ui-pdp-seller__header__title, .ui-pdp-seller__link-trigger').first().text()
    );
    const officialBadgeText = cleanText($('.ui-pdp-seller').text());
    const hasOfficialStoreBadge =
      /tienda\s+oficial/i.test(officialBadgeText) ||
      /tienda\s+oficial/i.test(sellerHeader) ||
      /tienda\s+oficial/i.test(candidate.sellerHint);

    if (!hasOfficialStoreBadge) {
      return { ok: false, reason: `not-official-store (${sellerHeader || 'unknown'})` };
    }

    // Collect full specs text from technical specifications table + highlights
    const specParts = [];
    $('.andes-table__row, .ui-pdp-specs__table tr').each((_, row) => {
      const th = cleanText($(row).find('th').text());
      const td = cleanText($(row).find('td').text());
      if (th || td) specParts.push(`${th}: ${td}`);
    });
    $('.ui-vpp-highlighted-specs__features-list li, .ui-pdp-list__item').each((_, li) => {
      specParts.push(cleanText($(li).text()));
    });
    const specsText = specParts.join(' | ');
    const combinedText = `${title} ${specsText}`;

    // Extract image URL (HTTPS, -O.jpg)
    const rawImageCandidates = [
      $('.ui-pdp-gallery__figure img').first().attr('data-zoom'),
      $('.ui-pdp-gallery__figure img').first().attr('src'),
      $('meta[property="og:image"]').attr('content')
    ];
    let highResImage = null;
    for (const imgCandidate of rawImageCandidates) {
      highResImage = toHighResMeliImage(imgCandidate);
      if (highResImage) break;
    }
    if (!highResImage) {
      return { ok: false, reason: 'no-image' };
    }

    // Canonical clean permalink
    const canonicalHref = $('link[rel="canonical"]').attr('href');
    const cleanPermalink =
      toCleanPermalink(canonicalHref || page.url()) || candidate.permalink;
    const finalId = extractIdFromPermalink(cleanPermalink) || candidate.id;

    // Semantic extraction combining title + technical spec table
    const brand = extractBrand(title, specsText);
    const processor = extractProcessor(combinedText);
    const ram = extractRam(combinedText);
    const storage = extractStorage(combinedText);
    const tier = classifyTier(ram.sizeGB, processor.family, combinedText);
    const screenSize = extractScreenSize(combinedText);

    // Format seller name cleanly (e.g. "ASUS TIENDA OFICIAL")
    let sellerName = sellerHeader
      .replace(/^Vendido por\s*/i, '')
      .replace(/^Tienda oficial\s*/i, '')
      .trim();
    if (sellerName) {
      sellerName = `${sellerName.toUpperCase()} TIENDA OFICIAL`;
    } else {
      sellerName = `${brand.toUpperCase()} TIENDA OFICIAL`;
    }

    const buyboxText = cleanText($('.ui-pdp-media__title, .ui-pdp-color--GREEN, #shipping_summary').text());
    const freeShipping = /env[ií]o\s+gratis|llega\s+gratis/i.test(buyboxText);
    const installmentsText = cleanText($('.ui-pdp-price__subtitles').first().text());
    const installments = installmentsText && installmentsText.length <= 80
      ? installmentsText
      : 'Hasta 12 cuotas sin interés con bancos aliados';

    const nowIso = new Date().toISOString();
    const laptopObj = {
      id: finalId,
      nombre: title,
      precioCOP: pricing.price,
      enlace: cleanPermalink,
      imagen: highResImage,
      title,
      price: pricing.price,
      url: cleanPermalink,
      imageUrl: highResImage,
      brand,
      processor,
      ram,
      storage,
      tier,
      condition: 'Nuevo',
      freeShipping,
      installments,
      seller: sellerName,
      screenSize,
      updatedAt: nowIso,
      precioCOPFormateado: formatCopNoDecimals(pricing.price),
      priceSyncedAt: nowIso
    };

    if (pricing.originalPrice !== undefined && pricing.discountPercentage !== undefined) {
      laptopObj.originalPrice = pricing.originalPrice;
      laptopObj.discountPercentage = pricing.discountPercentage;
    }

    return { ok: true, laptop: laptopObj };
  } catch (err) {
    return { ok: false, reason: err.message };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const rawCatalog = JSON.parse(await fs.readFile(CATALOG_PATH, 'utf-8'));
  const rawSync = JSON.parse(await fs.readFile(SYNC_META_PATH, 'utf-8'));
  const notFoundSet = new Set(extractNotFoundIds(rawSync));

  // Step 1: Keep only the laptops that already have an assigned affiliateUrl and are not `not-found`
  const keptLaptops = rawCatalog.filter(
    item => Boolean(item.affiliateUrl) && !notFoundSet.has(item.id)
  );
  const keptIds = new Set(keptLaptops.map(item => item.id));
  const keptNormalizedTitles = new Set(
    keptLaptops.map(item => cleanText(item.title || item.nombre).toLowerCase().slice(0, 45))
  );

  console.log(`✅ Conservados ${keptLaptops.length} portátiles monetizados (eliminados ${rawCatalog.length - keptLaptops.length} sin afiliación/not-found).`);

  const browserContext = await launchMeliPersistentContext();
  const authState = { prompted: false };
  const newlyAdded = [];

  try {
    let candidates = await collectCandidatesFromSearch(
      browserContext,
      OFFICIAL_STORES_SEARCH_URL,
      keptIds,
      authState
    );
    console.log(`🔎 Encontrados ${candidates.length} candidatos en página 1 de Tiendas Oficiales.`);

    if (candidates.length < 25) {
      await sleep(1000);
      const page2Candidates = await collectCandidatesFromSearch(
        browserContext,
        OFFICIAL_STORES_PAGE2_URL,
        new Set([...keptIds, ...candidates.map(c => c.id)]),
        authState
      );
      candidates = [...candidates, ...page2Candidates];
      console.log(`🔎 Total candidatos tras página 2: ${candidates.length}`);
    }

    const prioritized = prioritizeDiverseCandidates(candidates, keptLaptops);

    for (const candidate of prioritized) {
      if (newlyAdded.length >= TARGET_NEW_COUNT) break;

      const titlePrefix = candidate.cardTitle.toLowerCase().slice(0, 45);
      if (keptIds.has(candidate.id) || keptNormalizedTitles.has(titlePrefix)) {
        continue;
      }

      await sleep(1000);
      const res = await scrapeOfficialProductPage(browserContext, candidate, authState);
      if (!res.ok) {
        console.log(`   ⏭️ Omitido ${candidate.id} (${candidate.brand}): ${res.reason}`);
        continue;
      }

      const added = res.laptop;
      if (keptIds.has(added.id)) continue;

      keptIds.add(added.id);
      keptNormalizedTitles.add(added.title.toLowerCase().slice(0, 45));
      newlyAdded.push(added);

      console.log(
        `   ✅ [${newlyAdded.length}/${TARGET_NEW_COUNT}] ${added.id} | ${added.brand} | ${added.ram.label} | ${added.precioCOPFormateado} | ${added.seller}`
      );
    }
  } finally {
    await browserContext.close().catch(() => {});
  }

  if (newlyAdded.length === 0) {
    throw new Error('No se extrajo ningún portátil nuevo de Tiendas Oficiales; portatiles.json no fue modificado.');
  }

  if (newlyAdded.length < MIN_NEW_COUNT) {
    console.warn(`⚠️ Solo se pudieron extraer ${newlyAdded.length} portátiles nuevos (mínimo deseado: ${MIN_NEW_COUNT}).`);
  }

  const finalCatalog = [...keptLaptops, ...newlyAdded];
  const syncedAt = new Date().toISOString();

  await fs.writeFile(CATALOG_PATH, `${JSON.stringify(finalCatalog, null, 2)}\n`, 'utf-8');

  // Update price-sync.json so none of the removed old not-found IDs linger and totals reflect current active catalog
  const updatedSyncMeta = {
    lastSyncedAt: syncedAt,
    mode: 'playwright-official-stores',
    updatedCount: finalCatalog.length,
    failedCount: 0,
    antiBotBlockedCount: 0,
    totalCount: finalCatalog.length,
    authTokenConfigured: false,
    notFoundIds: [],
    failures: [],
    sampleFailures: []
  };
  await fs.writeFile(SYNC_META_PATH, `${JSON.stringify(updatedSyncMeta, null, 2)}\n`, 'utf-8');

  // Step 3: Write urls-nuevas.txt with ONLY the newly added permalinks, NO trailing blank line
  const newUrls = newlyAdded.map(item => item.enlace.trim()).filter(Boolean);
  await fs.writeFile(NEW_URLS_PATH, newUrls.join('\n'), 'utf-8');

  console.log(`\n🎉 Catálogo actualizado en portatiles.json: ${keptLaptops.length} monetizados + ${newlyAdded.length} nuevos = ${finalCatalog.length} portátiles totales.`);
  console.log(`📄 Creado urls-nuevas.txt con ${newUrls.length} URLs limpias (sin línea vacía al final).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('❌ Error al extraer Tiendas Oficiales:', err);
    process.exit(1);
  });
}
