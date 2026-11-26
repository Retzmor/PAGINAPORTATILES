import fs from 'fs/promises';
import path from 'path';

interface CatalogPriceItem {
  id: string;
  price: number;
  precioCOP?: number;
  precioCOPFormateado?: string;
  originalPrice?: number;
  discountPercentage?: number;
  freeShipping?: boolean;
  installments?: string;
  priceSyncedAt?: string;
  updatedAt?: string;
  enlace?: string;
  url?: string;
}

interface SyncMeta {
  lastSyncedAt?: string;
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

function formatCopNoDecimals(amount: number): string {
  return copFormatter.format(Math.round(amount));
}

async function readJsonWithFallback<T>(relativePathFromApi: string, relativePathFromCwd: string): Promise<T> {
  try {
    const raw = await fs.readFile(new URL(relativePathFromApi, import.meta.url), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    const raw = await fs.readFile(path.resolve(process.cwd(), relativePathFromCwd), 'utf-8');
    return JSON.parse(raw) as T;
  }
}

function resolveMeliIds(item: CatalogPriceItem): { itemId: string | null; productId: string | null } {
  const link = String(item.enlace || item.url || '');
  const articleMatch = link.match(/\/MCO-(\d+)-/i);
  if (articleMatch) {
    return { itemId: `MCO${articleMatch[1]}`, productId: null };
  }

  const catalogMatch = link.match(/\/(?:p|up)\/(MCO[U]?\d+)/i);
  if (catalogMatch) {
    return { itemId: null, productId: catalogMatch[1].toUpperCase() };
  }

  const rawId = String(item.id || '').trim().toUpperCase();
  if (/^MCO\d{9,}$/.test(rawId)) {
    return { itemId: rawId, productId: null };
  }
  return { itemId: null, productId: /^MCO[U]?\d+$/.test(rawId) ? rawId : null };
}

function normalizeMeliPricing(apiItem: Record<string, any>, fallback: CatalogPriceItem, syncedAt: string) {
  const sale = apiItem?.sale_price;
  const hasSale =
    typeof sale?.amount === 'number' &&
    Number.isFinite(sale.amount) &&
    sale.amount > 0 &&
    (!sale.status || sale.status === 'active');

  const rawPrice = hasSale ? sale.amount : apiItem?.price;
  const activePrice =
    typeof rawPrice === 'number' && Number.isFinite(rawPrice) && rawPrice > 0
      ? Math.round(rawPrice)
      : (fallback.precioCOP ?? fallback.price);

  const rawOriginal = apiItem?.original_price;
  const validOriginal =
    typeof rawOriginal === 'number' && Number.isFinite(rawOriginal) && rawOriginal > activePrice
      ? Math.round(rawOriginal)
      : undefined;

  const discountPercentage =
    validOriginal && activePrice > 0
      ? Math.round(((validOriginal - activePrice) / validOriginal) * 100)
      : undefined;

  const freeShipping =
    typeof apiItem?.shipping?.free_shipping === 'boolean'
      ? apiItem.shipping.free_shipping
      : fallback.freeShipping;

  return {
    id: fallback.id,
    price: activePrice,
    precioCOP: activePrice,
    precioCOPFormateado: formatCopNoDecimals(activePrice),
    ...(validOriginal && discountPercentage && discountPercentage > 0
      ? { originalPrice: validOriginal, discountPercentage }
      : {}),
    freeShipping,
    installments: fallback.installments,
    priceSyncedAt: syncedAt
  };
}

async function fetchLiveItemForServerless(
  item: CatalogPriceItem,
  token: string,
  syncedAt: string
): Promise<{ updated: boolean; payload: Record<string, any> }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'ComparaTech-Colombia/1.0'
  };

  const baseFallback = {
    id: item.id,
    price: item.precioCOP ?? item.price,
    precioCOP: item.precioCOP ?? item.price,
    precioCOPFormateado: item.precioCOPFormateado ?? formatCopNoDecimals(item.precioCOP ?? item.price),
    ...(item.originalPrice && item.originalPrice > (item.precioCOP ?? item.price)
      ? { originalPrice: item.originalPrice, discountPercentage: item.discountPercentage }
      : {}),
    freeShipping: item.freeShipping,
    installments: item.installments,
    priceSyncedAt: item.priceSyncedAt || item.updatedAt
  };

  try {
    const { itemId, productId } = resolveMeliIds(item);
    let targetItemId = itemId;

    if (!targetItemId && productId && !productId.startsWith('MCOU')) {
      const prodRes = await fetch(`https://api.mercadolibre.com/products/${productId}/items`, {
        headers,
        signal: AbortSignal.timeout(4000)
      });
      if (prodRes.ok) {
        const prodJson = (await prodRes.json()) as { results?: Array<Record<string, any>> };
        const firstActive = (prodJson.results || []).find(r => r.condition === 'new' && r.price > 0);
        targetItemId = firstActive?.item_id || firstActive?.id || null;
      }
    }

    if (!targetItemId) {
      return { updated: false, payload: baseFallback };
    }

    const res = await fetch(`https://api.mercadolibre.com/items/${targetItemId}`, {
      headers,
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) {
      return { updated: false, payload: baseFallback };
    }

    const apiItem = (await res.json()) as Record<string, any>;
    return {
      updated: true,
      payload: normalizeMeliPricing(apiItem, item, syncedAt)
    };
  } catch {
    return { updated: false, payload: baseFallback };
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=3600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req?.method && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const [catalog, syncMeta] = await Promise.all([
      readJsonWithFallback<CatalogPriceItem[]>('../src/data/portatiles.json', 'src/data/portatiles.json'),
      readJsonWithFallback<SyncMeta>('../src/data/price-sync.json', 'src/data/price-sync.json').catch(
        () => ({ lastSyncedAt: undefined })
      )
    ]);

    const token = process.env.MELI_ACCESS_TOKEN || process.env.MELI_TOKEN;
    const syncedNow = new Date().toISOString();

    if (!token) {
      const fallbackItems = catalog.map(item => ({
        id: item.id,
        price: item.precioCOP ?? item.price,
        precioCOP: item.precioCOP ?? item.price,
        precioCOPFormateado: item.precioCOPFormateado ?? formatCopNoDecimals(item.precioCOP ?? item.price),
        ...(item.originalPrice && item.originalPrice > (item.precioCOP ?? item.price)
          ? { originalPrice: item.originalPrice, discountPercentage: item.discountPercentage }
          : {}),
        freeShipping: item.freeShipping,
        installments: item.installments,
        priceSyncedAt: item.priceSyncedAt || item.updatedAt
      }));

      return res.status(200).json({
        ok: true,
        source: 'catalog-fallback',
        lastSyncedAt: syncMeta.lastSyncedAt || catalog[0]?.priceSyncedAt || syncedNow,
        updatedCount: 0,
        totalCount: fallbackItems.length,
        items: fallbackItems
      });
    }

    const results = await Promise.all(
      catalog.map(item => fetchLiveItemForServerless(item, token, syncedNow))
    );
    const liveUpdatedCount = results.filter(r => r.updated).length;

    return res.status(200).json({
      ok: true,
      source: liveUpdatedCount > 0 ? 'meli-api-live' : 'catalog-fallback',
      lastSyncedAt: liveUpdatedCount > 0 ? syncedNow : syncMeta.lastSyncedAt || syncedNow,
      updatedCount: liveUpdatedCount,
      totalCount: results.length,
      items: results.map(r => r.payload)
    });
  } catch (error: any) {
    return res.status(200).json({
      ok: true,
      source: 'error-fallback',
      items: [],
      message: error?.message || 'Fallback to bundled catalog'
    });
  }
}
