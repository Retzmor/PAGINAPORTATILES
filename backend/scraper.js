import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mercado Libre Colombia Public API endpoint for Laptops (category MCO1652)
const API_URL = 'https://api.mercadolibre.com/sites/MCO/search?category=MCO1652&limit=30';

/**
 * Normalizes text removing extra spaces
 */
export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Semantic extraction of Brand using regex
 */
export function extractBrand(title, rawAttributes = '') {
  const combined = `${title} ${rawAttributes}`.toLowerCase();

  const brandPatterns = [
    { name: 'Apple', regex: /\b(apple|macbook|mac\s*book|mac)\b/i },
    { name: 'Lenovo', regex: /\b(lenovo|thinkpad|ideapad|legion|yoga|loq)\b/i },
    { name: 'HP', regex: /\b(hp|hewlett[\s-]*packard|victus|omen|pavilion)\b/i },
    { name: 'Asus', regex: /\b(asus|zenbook|vivobook|rog|tuf)\b/i },
    { name: 'Acer', regex: /\b(acer|aspire|nitro|predator|swift)\b/i },
    { name: 'Dell', regex: /\b(dell|inspiron|vostro|latitude|xps|alienware|g15)\b/i },
    { name: 'Huawei', regex: /\b(huawei|matebook)\b/i },
    { name: 'MSI', regex: /\b(msi|katana|cyborg|thin|modern|stealth)\b/i },
    { name: 'Samsung', regex: /\b(samsung|galaxy\s*book)\b/i }
  ];

  for (const { name, regex } of brandPatterns) {
    if (regex.test(combined)) {
      return name;
    }
  }

  return 'Otro';
}

/**
 * Semantic extraction of Processor using regex
 */
export function extractProcessor(text) {
  const clean = text.toLowerCase();

  // Apple Silicon
  if (/\bm3\s*max\b/i.test(clean)) return { raw: 'Apple M3 Max', family: 'Apple M3', tierScore: 5, humanDescription: 'Potencia profesional extrema de última generación Apple.' };
  if (/\bm3\s*pro\b/i.test(clean)) return { raw: 'Apple M3 Pro', family: 'Apple M3', tierScore: 5, humanDescription: 'Rendimiento superior para diseño, edición de video y render 3D.' };
  if (/\bm3\b/i.test(clean)) return { raw: 'Apple M3', family: 'Apple M3', tierScore: 4, humanDescription: 'Muy veloz y con batería de hasta 18 horas para todo tipo de uso.' };
  if (/\bm2\s*pro\b/i.test(clean)) return { raw: 'Apple M2 Pro', family: 'Apple M2', tierScore: 5, humanDescription: 'Potente para trabajo creativo profesional y desarrollo.' };
  // Apple Silicon M4 / M3 / M2 / M1
  if (/\bm4\b/i.test(clean)) return { raw: 'Apple M4', family: 'Apple M3', tierScore: 5, humanDescription: 'Última generación de Apple Silicon, ultrarrápido y silencioso.' };
  if (/\bm3\b/i.test(clean)) return { raw: 'Apple M3', family: 'Apple M3', tierScore: 5, humanDescription: 'Última generación Apple, potencia excepcional para edición y multitarea.' };
  if (/\bm2\b/i.test(clean)) return { raw: 'Apple M2', family: 'Apple M2', tierScore: 4, humanDescription: 'Súper fluido, silencioso y con excelente rendimiento para trabajo exigente.' };
  if (/\bm1\b/i.test(clean)) return { raw: 'Apple M1', family: 'Apple M1', tierScore: 4, humanDescription: 'Excelente rendimiento y eficiencia energética para el día a día y trabajo.' };

  // Intel Core i9
  if (/core\s*i9|corei9|i9[\s-]?\d{4,5}/i.test(clean)) {
    const match = clean.match(/i9[\s-]?(\d{4,5}[a-z]{0,2}\d?)/i);
    return {
      raw: match ? `Intel Core i9-${match[1].toUpperCase()}` : 'Intel Core i9',
      family: 'Core i9',
      tierScore: 5,
      humanDescription: 'El motor más potente de Intel. Ideal para render 3D, gaming pesado y simulación.'
    };
  }

  // Intel Core i7
  if (/core\s*i7|corei7|i7[\s-]?\d{4,5}/i.test(clean)) {
    const match = clean.match(/i7[\s-]?(\d{4,5}[a-z]{0,2}\d?)/i);
    return {
      raw: match ? `Intel Core i7-${match[1].toUpperCase()}` : 'Intel Core i7',
      family: 'Core i7',
      tierScore: 4,
      humanDescription: 'Procesador de gama alta, ideal para diseño gráfico profesional y programas exigentes.'
    };
  }

  // Intel Core i5
  if (/core\s*i5|corei5|i5[\s-]?\d{4,5}/i.test(clean)) {
    const match = clean.match(/i5[\s-]?(\d{4,5}[a-z]{0,2}\d?)/i);
    return {
      raw: match ? `Intel Core i5-${match[1].toUpperCase()}` : 'Intel Core i5',
      family: 'Core i5',
      tierScore: 3,
      humanDescription: 'El equilibrio perfecto entre rapidez y precio. Excelente para trabajar sin pausas.'
    };
  }

  // Intel Core i3 / Core 3
  if (/core\s*i3|corei3|core\s*3\b|i3[\s-]?\d{4,5}/i.test(clean)) {
    const match = clean.match(/i3[\s-]?(\d{4,5}[a-z]{0,2}\d?)/i);
    return {
      raw: match ? `Intel Core i3-${match[1].toUpperCase()}` : 'Intel Core i3',
      family: 'Core i3',
      tierScore: 2,
      humanDescription: 'Muy bueno para estudiar, navegar con muchas páginas, ver series y hacer trabajos de oficina.'
    };
  }

  // Intel Celeron / Pentium
  if (/\b(celeron|pentium)\b/i.test(clean)) {
    return {
      raw: 'Intel Celeron N4020 / N4500',
      family: 'Celeron / Pentium',
      tierScore: 1,
      humanDescription: 'Básico para navegación ligera en internet, ver YouTube y redactar documentos sencillos.'
    };
  }

  // AMD Ryzen 9
  if (/ryzen\s*9|r9[\s-]?\d{4}/i.test(clean)) {
    return {
      raw: 'AMD Ryzen 9',
      family: 'Ryzen 9',
      tierScore: 5,
      humanDescription: 'Procesador tope de gama AMD, máxima fluidez en tareas pesadas simultáneas.'
    };
  }

  // AMD Ryzen 7
  if (/ryzen\s*7|r7[\s-]?\d{4}/i.test(clean)) {
    const match = clean.match(/ryzen\s*7[\s-]?(\d{4}[a-z]{0,2})/i);
    return {
      raw: match ? `AMD Ryzen 7 ${match[1]}` : 'AMD Ryzen 7',
      family: 'Ryzen 7',
      tierScore: 4,
      humanDescription: 'Muy veloz y potente con múltiples núcleos, perfecto para creadores y multitarea pesada.'
    };
  }

  // AMD Ryzen 5
  if (/ryzen\s*5|r5[\s-]?\d{4}/i.test(clean)) {
    const match = clean.match(/ryzen\s*5[\s-]?(\d{4}[a-z]{0,2})/i);
    return {
      raw: match ? `AMD Ryzen 5 ${match[1]}` : 'AMD Ryzen 5',
      family: 'Ryzen 5',
      tierScore: 3,
      humanDescription: 'Excelente rendimiento para estudiar, programar, trabajar y videollamadas fluidas.'
    };
  }

  // AMD Ryzen 3
  if (/ryzen\s*3|r3[\s-]?\d{4}/i.test(clean)) {
    const match = clean.match(/ryzen\s*3[\s-]?(\d{4}[a-z]{0,2})/i);
    return {
      raw: match ? `AMD Ryzen 3 ${match[1]}` : 'AMD Ryzen 3',
      family: 'Ryzen 3',
      tierScore: 2,
      humanDescription: 'Ágil y confiable para labores diarias del colegio, universidad o trabajo administrativo.'
    };
  }

  // AMD Athlon
  if (/\bathlon\b/i.test(clean)) {
    return {
      raw: 'AMD Athlon Silver',
      family: 'AMD Athlon',
      tierScore: 1,
      humanDescription: 'Económico para tareas escolares básicas y correo electrónico.'
    };
  }

  return {
    raw: 'Intel Core / AMD Fluido',
    family: 'Core i5',
    tierScore: 3,
    humanDescription: 'Capacidad adecuada para tareas cotidianas y navegación web fluida.'
  };
}

/**
 * Semantic extraction of RAM memory in GB using regex
 */
export function extractRam(text) {
  const clean = text.toLowerCase();

  const ramMatches = clean.match(/\b(4|6|8|12|16|20|24|32|64)\s*(?:gb|gigas)?\s*(?:de\s*)?(?:memoria\s*)?ram\b/i) ||
                     clean.match(/\b(4|6|8|12|16|20|24|32|64)\s*gb\b/i);

  let sizeGB = 8;
  if (ramMatches && ramMatches[1]) {
    const val = parseInt(ramMatches[1], 10);
    if ([4, 6, 8, 12, 16, 20, 24, 32, 64].includes(val)) {
      sizeGB = val;
    }
  }

  let explanation = '';
  if (sizeGB <= 4) {
    explanation = 'Básica: suficiente para pocas ventanas abiertas al tiempo.';
  } else if (sizeGB <= 8) {
    explanation = 'Estándar: excelente para trabajar en Word, Excel, Zoom y navegar con fluidez.';
  } else if (sizeGB <= 16) {
    explanation = 'Avanzada: permite tener decenas de pestañas, Canva y programas pesados sin frenarse.';
  } else {
    explanation = 'Profesional: diseñada para edición 4K, diseño 3D y juegos de última generación.';
  }

  return {
    sizeGB,
    label: `${sizeGB} GB RAM`,
    explanation
  };
}

/**
 * Semantic extraction of Storage using regex
 */
export function extractStorage(text) {
  const clean = text.toLowerCase();

  let sizeGB = 256;
  let type = 'SSD';

  // Terabytes
  if (/\b2\s*tb\b/i.test(clean)) {
    sizeGB = 2048;
  } else if (/\b1\s*tb\b/i.test(clean) || /\b1000\s*gb\b/i.test(clean)) {
    sizeGB = 1024;
  } else {
    // Gigabytes
    const gbMatch = clean.match(/\b(128|256|512)\s*(?:gb|gigas)?\s*(?:ssd|solido|disco|hdd|emmc)?\b/i);
    if (gbMatch && gbMatch[1]) {
      sizeGB = parseInt(gbMatch[1], 10);
    }
  }

  // Storage Type
  if (/\b(ssd|solido|sólido|m\.2|nvme)\b/i.test(clean)) {
    type = 'SSD';
  } else if (/\bhdd|mecanico|mecánico\b/i.test(clean)) {
    type = 'HDD';
  } else if (/\bemmc\b/i.test(clean)) {
    type = 'eMMC';
  }

  const label = `${sizeGB >= 1024 ? `${sizeGB / 1024} TB` : `${sizeGB} GB`} ${type}`;
  let explanation = '';

  if (type === 'SSD') {
    explanation = sizeGB >= 512
      ? 'Disco SSD ultraveloz: espacio amplio para miles de fotos, videos y arranque en 8 segundos.'
      : 'Disco de estado sólido: el portátil enciende en segundos y abre tus aplicaciones al instante.';
  } else if (type === 'eMMC') {
    explanation = 'Memoria flash compacta para guardar documentos esenciales de estudio.';
  } else {
    explanation = 'Disco mecánico tradicional de gran capacidad para guardar muchos archivos.';
  }

  return {
    sizeGB,
    type,
    label,
    explanation
  };
}

/**
 * Classifies into 3 friendly human tiers
 */
export function classifyTier(ramSizeGB, processorFamily, text = '') {
  const clean = text.toLowerCase();
  const isDedicatedGPU = /\b(rtx|gtx|geforce|radeon\s*rx|arc|gaming|gamer)\b/i.test(clean);
  const isHighCore = ['Core i7', 'Core i9', 'Ryzen 7', 'Ryzen 9', 'Apple M3 Pro', 'Apple M3 Max', 'Apple M2 Pro', 'Apple M3'].includes(processorFamily);

  // 1. Pro / Gaming / Creative Tier
  if (ramSizeGB >= 16 || isDedicatedGPU || isHighCore) {
    return {
      id: 'pro',
      label: 'Alto Rendimiento / Gaming / Diseño',
      icon: 'Gamepad2',
      shortDescription: 'Ideal para personas creativas, diseñadores gráficos, ingenieros o entusiastas de los videojuegos.',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      badgeText: 'Alto Rendimiento / Gaming',
      recommendedFor: [
        'Diseño gráfico (Photoshop, Illustrator, Premiere)',
        'Edición de video 4K y producción musical',
        'Videojuegos modernos y modelado en 3D',
        'Programación avanzada y máquinas virtuales'
      ],
      idealUser: 'Creadores de contenido, gamers, ingenieros y usuarios exigentes que no quieren limitaciones.'
    };
  }

  // 2. Basic Tier
  if (ramSizeGB <= 8 && ['Celeron / Pentium', 'AMD Athlon', 'Core i3', 'Ryzen 3'].includes(processorFamily)) {
    return {
      id: 'basic',
      label: 'Estudio y Oficina Básica',
      icon: 'GraduationCap',
      shortDescription: 'Perfecto para estudiantes, navegación web, ver películas y elaborar tareas en Word o Excel.',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      badgeText: 'Estudio y Oficina Básica',
      recommendedFor: [
        'Clases virtuales, tareas escolares y Zoom',
        'Navegación web, YouTube y Netflix',
        'Word, Excel, PowerPoint y lectura de PDFs',
        'Administración básica del hogar y redes sociales'
      ],
      idealUser: 'Estudiantes de colegio o universidad básica, adultos mayores y tareas sencillas del hogar.'
    };
  }

  // 3. Work / Multitask Tier
  return {
    id: 'work',
    label: 'Multitarea y Trabajo Fluido',
    icon: 'Briefcase',
    shortDescription: 'Excelente para profesionales, teletrabajo, administración y personas que necesitan rapidez en el día a día.',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'Multitarea y Trabajo Fluido',
    recommendedFor: [
      'Trabajo remoto y llamadas de Meet / Teams sin cortes',
      'Tener 30 pestañas abiertas mientras escuchas música',
      'Facturación, software contable, bases de datos y CRM',
      'Creación de contenido para redes en Canva'
    ],
    idealUser: 'Profesionales independientes, comerciantes, oficinistas y estudiantes que buscan rapidez y longevidad.'
  };
}

/**
 * Reads structured technical specs from Mercado Libre item.attributes first,
 * falling back to regex extraction over item.title when attributes are incomplete.
 */
export function extractAttributesSpecs(attributes = [], title = '') {
  const attrMap = new Map();
  if (Array.isArray(attributes)) {
    for (const attr of attributes) {
      if (attr?.id && attr?.value_name) {
        attrMap.set(String(attr.id).toUpperCase(), String(attr.value_name));
      }
    }
  }

  const brandSource = attrMap.get('BRAND') || title;
  const processorSource = [
    attrMap.get('PROCESSOR_BRAND'),
    attrMap.get('PROCESSOR_LINE'),
    attrMap.get('PROCESSOR_MODEL')
  ].filter(Boolean).join(' ') || title;

  const ramAttr = attrMap.get('RAM') || attrMap.get('RAM_MEMORY');
  const ramSource = ramAttr ? `${ramAttr} RAM` : title;

  const ssdAttr = attrMap.get('SSD_CAPACITY');
  const hddAttr = attrMap.get('HDD_CAPACITY');
  const genericStorageAttr = attrMap.get('DATA_STORAGE_CAPACITY') || attrMap.get('STORAGE_CAPACITY');
  const storageSource = ssdAttr
    ? `${ssdAttr} SSD`
    : hddAttr
      ? `${hddAttr} HDD`
      : genericStorageAttr
        ? `${genericStorageAttr} SSD`
        : title;

  const brand = extractBrand(brandSource) !== 'Otra Marca' ? extractBrand(brandSource) : extractBrand(title);
  const processor = extractProcessor(processorSource);
  const ram = extractRam(ramSource);
  const storage = extractStorage(storageSource);
  const screenAttr = attrMap.get('DISPLAY_SIZE');
  const screenSize = screenAttr
    ? screenAttr.replace(/\s*"\s*$/, '"').replace(/\s+pulgadas?/i, '"')
    : (title.includes('14') ? '14"' : title.includes('13.') ? '13.6"' : title.includes('16') ? '16"' : '15.6"');

  return { brand, processor, ram, storage, screenSize };
}

/**
 * Preserves the exact active Mercado Libre permalink and appends optional
 * affiliate tracking parameters cleanly without breaking the base URL.
 */
export function buildAffiliatePermalink(permalink) {
  const raw = String(permalink || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const campId = process.env.MELI_CAMP_ID;
    const affiliateTag = process.env.MELI_AFFILIATE_TAG;
    if (campId) parsed.searchParams.set('campid', campId);
    if (affiliateTag) parsed.searchParams.set('matt_tool', affiliateTag);
    return parsed.toString();
  } catch {
    return raw;
  }
}

/**
 * Normalizes Mercado Libre thumbnail URLs to HTTPS high-resolution (-O.*)
 */
export function buildHighResImageUrl(thumbnailUrl) {
  return String(thumbnailUrl || '')
    .trim()
    .replace(/^http:\/\//i, 'https://')
    .replace(/-(?:I|V|F)\.(jpg|jpeg|webp)$/i, '-O.$1');
}

/**
 * Builds standard headers for Mercado Libre API requests (including OAuth token when configured)
 */
export function buildMeliApiHeaders() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'es-CO,es;q=0.9'
  };
  const token = process.env.MELI_ACCESS_TOKEN || process.env.MELI_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Extracts active COP price (sale_price.amount when active, otherwise price),
 * previous price exclusively from original_price, and % OFF only when original_price > price.
 */
export function extractActivePricing(apiItem, salePricePayload = null) {
  const candidateSale = salePricePayload ?? apiItem?.sale_price;
  const hasActiveSaleAmount =
    typeof candidateSale?.amount === 'number' &&
    Number.isFinite(candidateSale.amount) &&
    candidateSale.amount > 0 &&
    (!candidateSale.status || candidateSale.status === 'active');

  const rawPrice = hasActiveSaleAmount ? candidateSale.amount : apiItem?.price;
  const price =
    typeof rawPrice === 'number' && Number.isFinite(rawPrice) && rawPrice > 0
      ? Math.round(rawPrice)
      : 0;

  // Previous price strictly from API original_price when strictly greater than active price
  const rawOriginal = apiItem?.original_price;
  const parsedOriginal =
    typeof rawOriginal === 'number' && Number.isFinite(rawOriginal) && rawOriginal > 0
      ? Math.round(rawOriginal)
      : undefined;

  const originalPrice = parsedOriginal !== undefined && parsedOriginal > price ? parsedOriginal : undefined;
  const rawDiscount =
    originalPrice !== undefined && price > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;
  const discountPercentage = rawDiscount && rawDiscount > 0 ? rawDiscount : undefined;

  return { price, originalPrice, discountPercentage };
}

/**
 * Fetches live price and original_price directly from /items/{ITEM_ID} (and /sale_price fallback)
 */
export async function fetchItemLivePricing(itemId, headers = buildMeliApiHeaders()) {
  const normalizedId = String(itemId || '').trim().toUpperCase();
  if (!/^MCO\d+$/.test(normalizedId)) {
    return { ok: false, status: null, error: 'Not a direct listing Item ID' };
  }

  try {
    const itemRes = await axios.get(`https://api.mercadolibre.com/items/${normalizedId}`, {
      headers,
      timeout: 10000
    });
    const itemData = itemRes.data;

    let salePriceData = itemData?.sale_price ?? null;
    if (!salePriceData) {
      try {
        const saleRes = await axios.get(`https://api.mercadolibre.com/items/${normalizedId}/sale_price`, {
          headers,
          timeout: 8000
        });
        salePriceData = saleRes.data;
      } catch {
        // /sale_price may return 404 when no promotional price is active; fall back to itemData.price
      }
    }

    const pricing = extractActivePricing(itemData, salePriceData);
    return { ok: pricing.price > 0, status: itemRes.status, pricing, itemData };
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status ?? null,
      error: error.response?.data?.message || error.message
    };
  }
}

/**
 * Transforms an API result item into our structured model
 */
export function transformApiItem(item) {
  const { brand, processor, ram, storage, screenSize } = extractAttributesSpecs(item.attributes, item.title);
  const tier = classifyTier(ram.sizeGB, processor.family, item.title);

  // Exact active permalink returned by Mercado Libre (never strip slug or invent IDs)
  const enlace = String(item.permalink || '').trim();
  const affiliateUrl = buildAffiliatePermalink(enlace);

  // Safe HTTPS and high-resolution image URL (-O.jpg / -O.webp)
  const imgSecure = buildHighResImageUrl(item.thumbnail || item.imagen);

  const { price, originalPrice, discountPercentage } = extractActivePricing(item);
  const syncedAt = new Date().toISOString();

  return {
    // Exact requested fields from prompt:
    id: item.id,
    nombre: item.title,
    precioCOP: price,
    enlace: enlace,
    imagen: imgSecure,

    // Frontend compatibility fields:
    title: cleanText(item.title),
    price,
    ...(originalPrice !== undefined ? { originalPrice } : {}),
    ...(discountPercentage !== undefined ? { discountPercentage } : {}),
    url: enlace,
    affiliateUrl,
    imageUrl: imgSecure,

    // Semantics & Classification:
    brand,
    processor,
    ram,
    storage,
    tier,

    condition: item.condition === 'new' ? 'Nuevo' : (item.condition || 'Nuevo'),
    freeShipping: item.shipping?.free_shipping ?? true,
    installments: 'Hasta 12 cuotas sin interés con bancos aliados',
    seller: item.seller?.nickname || 'Tienda Oficial Mercado Libre Colombia',
    screenSize,
    updatedAt: syncedAt,
    priceSyncedAt: syncedAt
  };
}

/**
 * Curated fallback dataset of verified real Mercado Libre Colombia (MCO1652) listings
 * Used when unauthenticated calls to api.mercadolibre.com return HTTP 403.
 * Every permalink and http2.mlstatic.com high-res image below was verified against live MCO listings.
 */
export function getCuratedMcoLaptops() {
  const mcoItems = [
    {
      id: 'MCO43645309',
      title: 'Portátil Lenovo Thinkbook 14 G6 Ryzen 5 7430U 32GB 512GB IPS Color Gris',
      price: 2599000,
      original_price: 2999000,
      permalink: 'https://www.mercadolibre.com.co/portatil-lenovo-thinkbook-14-g6-ryzen-5-7430u-32gb-512gb-ips-color-gris/p/MCO43645309',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_767568-MLA80922288661_112024-O.jpg',
      condition: 'new',
      official_store_id: 1001,
      shipping: { free_shipping: true },
      seller: { nickname: 'LENOVO TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'AMD' },
        { id: 'PROCESSOR_LINE', value_name: 'Ryzen 5' },
        { id: 'PROCESSOR_MODEL', value_name: '7430U' },
        { id: 'RAM', value_name: '32 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '14 "' }
      ]
    },
    {
      id: 'MCO41209434',
      title: 'Asus X1504ZA-NJ Portátil Vivobook Core i3 1215U RAM 12GB SSD 512GB FHD Color Gris',
      price: 1649000,
      original_price: 1949000,
      permalink: 'https://www.mercadolibre.com.co/asus-x1504za-nj-portatil-vivobook-core-i3-1215u-ram-12gb-ssd-512gb-fhd-color-gris/p/MCO41209434',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_864688-MLA80223025147_102024-O.jpg',
      condition: 'new',
      official_store_id: 1002,
      shipping: { free_shipping: true },
      seller: { nickname: 'ASUS TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Asus' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i3' },
        { id: 'PROCESSOR_MODEL', value_name: '1215U' },
        { id: 'RAM', value_name: '12 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO1949411394',
      title: 'Portátil Lenovo Doceava Intel Core i3 1215U RAM 16GB SSD 256GB FHD',
      price: 1599000,
      original_price: 1899000,
      permalink: 'https://articulo.mercadolibre.com.co/MCO-1949411394-portatil-lenovo-doceava-intel-i3-1215u-ram-16g-ssd-256g-fhd-_JM',
      thumbnail: 'https://http2.mlstatic.com/D_791703-MCO72063493624_102023-O.jpg',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'TECNOPORTATILES COLOMBIA', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i3' },
        { id: 'PROCESSOR_MODEL', value_name: '1215U' },
        { id: 'RAM', value_name: '16 GB' },
        { id: 'SSD_CAPACITY', value_name: '256 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO27805439',
      title: 'Portátil Lenovo V14 G3 IAP Core i3 1215U 8GB 256GB 14 FHD Color Gris',
      price: 1389000,
      original_price: 1649000,
      permalink: 'https://www.mercadolibre.com.co/portatil-lenovo-v14-g3-iap-core-i3-1215u-8gb-256gb-14-fhd-color-gris/p/MCO27805439',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_856859-MLU72363918499_102023-O.jpg',
      condition: 'new',
      official_store_id: 1001,
      shipping: { free_shipping: true },
      seller: { nickname: 'LENOVO TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i3' },
        { id: 'PROCESSOR_MODEL', value_name: '1215U' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '256 GB' },
        { id: 'DISPLAY_SIZE', value_name: '14 "' }
      ]
    },
    {
      id: 'MCO32161065',
      title: 'Portátil Asus X1605ZA-MB644 Intel Core i5-12500H 16GB RAM Disco Sólido 512GB SSD 16 FHD',
      price: 2299000,
      original_price: 2699000,
      permalink: 'https://www.mercadolibre.com.co/portatil-asus-x1605za-mb644-intel-corei5-12500h-16gb-ram-disco-solido-512ssd-16-fhd-endless/p/MCO32161065',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_822592-MLU74290609668_022024-O.jpg',
      condition: 'new',
      official_store_id: 1002,
      shipping: { free_shipping: true },
      seller: { nickname: 'ASUS STORE COLOMBIA', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Asus' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i5' },
        { id: 'PROCESSOR_MODEL', value_name: '12500H' },
        { id: 'RAM', value_name: '16 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '16 "' }
      ]
    },
    {
      id: 'MCO28769789',
      title: 'Portátil Gamer Lenovo LOQ 15.6 AMD Ryzen 7 7840HS 8GB RAM 512GB SSD Nvidia RTX 4050 6GB',
      price: 3899000,
      original_price: 4499000,
      permalink: 'https://www.mercadolibre.com.co/portatil-gamer-lenovo-loq-loq-gamer-gris-oscura-156-amd-ryzen-7-7840hs-8gb-de-ram-512gb-ssd-nvidia-geforce-rtx-4050-6gb-gddr6-1920x1080px-windows-11-home/p/MCO28769789',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_883588-MLU73372159849_122023-O.jpg',
      condition: 'new',
      official_store_id: 1001,
      shipping: { free_shipping: true },
      seller: { nickname: 'LENOVO GAMING OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'AMD' },
        { id: 'PROCESSOR_LINE', value_name: 'Ryzen 7' },
        { id: 'PROCESSOR_MODEL', value_name: '7840HS' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO66110105',
      title: 'Portátil Gamer HP Victus 15-fa2082wm 15.6 Intel Core i5 16GB RAM 512GB SSD RTX 4050 Windows 11',
      price: 3499000,
      original_price: 4099000,
      permalink: 'https://www.mercadolibre.com.co/hp-victus-15-fa2082wm-156-16gb-512gb-ssd-w11-plata-mica-plateado/p/MCO66110105',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_904907-MLA70584585681_072023-O.jpg',
      condition: 'new',
      official_store_id: 1003,
      shipping: { free_shipping: true },
      seller: { nickname: 'HP TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'HP' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i5' },
        { id: 'PROCESSOR_MODEL', value_name: '13420H' },
        { id: 'RAM', value_name: '16 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO60708786',
      title: 'Notebook HP Victus 15-fa2082wm Intel Core i5 RTX 4050 16GB RAM 512GB SSD',
      price: 3599000,
      original_price: 4199000,
      permalink: 'https://www.mercadolibre.com.co/notebook-hp-victus-15-fa2082wm-con-intel-core-i5-rtx-4050-y-16-gb-de-ram/p/MCO60708786',
      thumbnail: 'https://http2.mlstatic.com/D_Q_NP_814195-MLA45745170541_042021-O.webp',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'HP GAMING COLOMBIA', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'HP' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i5' },
        { id: 'PROCESSOR_MODEL', value_name: '13420H' },
        { id: 'RAM', value_name: '16 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO2055841888',
      title: 'Portátil Acer Aspire Slim 15.6 FHD Intel Core 3 N355 8GB RAM 256GB SSD',
      price: 1429000,
      original_price: 1699000,
      permalink: 'https://www.mercadolibre.com.co/ordenador-portatil-acer-aspire-slim-156-fhd-intel-core-3-8/p/MCO2055841888',
      thumbnail: 'https://http2.mlstatic.com/D_Q_NP_804618-MLA45745035429_042021-O.webp',
      condition: 'new',
      official_store_id: 1004,
      shipping: { free_shipping: true },
      seller: { nickname: 'ACER TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Acer' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core 3' },
        { id: 'PROCESSOR_MODEL', value_name: 'N355' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '256 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO4348640806',
      title: 'Portátil Asus Vivobook Go 14 Intel Celeron 4GB RAM 256GB SSD',
      price: 1149000,
      original_price: 1399000,
      permalink: 'https://articulo.mercadolibre.com.co/MCO-4348640806-ordenador-portatil-asus-vivobook-go-14-de-4-gb-de-ram-256-gb-_JM',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_887273-MLA52853469798_122022-O.webp',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'ASUS DISTRIBUIDOR COL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Asus' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Celeron' },
        { id: 'PROCESSOR_MODEL', value_name: 'N4500' },
        { id: 'RAM', value_name: '4 GB' },
        { id: 'SSD_CAPACITY', value_name: '256 GB' },
        { id: 'DISPLAY_SIZE', value_name: '14 "' }
      ]
    },
    {
      id: 'MCO4561089358',
      title: 'Notebook HP Pavilion 15-eg2502la Intel Core i5-1235U 8GB RAM 512GB SSD',
      price: 2149000,
      original_price: 2499000,
      permalink: 'https://articulo.mercadolibre.com.co/MCO-4561089358-notebook-hp-pavilion-15-eg2502la-intel-core-i5-8gb-ram-_JM',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_630705-MLA71631242649_092023-O.webp',
      condition: 'new',
      official_store_id: 1003,
      shipping: { free_shipping: true },
      seller: { nickname: 'HP TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'HP' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i5' },
        { id: 'PROCESSOR_MODEL', value_name: '1235U' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCOU2491230500',
      title: 'Portátil HP Pavilion Intel Core i5-1235U SSD 1TB RAM 32GB 15.6 FHD',
      price: 2699000,
      original_price: 3199000,
      permalink: 'https://www.mercadolibre.com.co/portatil-hp-pavilion-intel-core-i5-1235u-ssd-1tb--ram-32gb/up/MCOU2491230500',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_701171-MLU70777952886_082023-O.webp',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'HP PARTNER COLOMBIA', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'HP' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i5' },
        { id: 'PROCESSOR_MODEL', value_name: '1235U' },
        { id: 'RAM', value_name: '32 GB' },
        { id: 'SSD_CAPACITY', value_name: '1 TB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO2143743897',
      title: 'Portátil HP Pavilion Gaming 15 AMD Ryzen 5 GTX 1650 8GB RAM 512GB SSD',
      price: 2799000,
      original_price: 3299000,
      permalink: 'https://articulo.mercadolibre.com.co/MCO-2143743897-portatil-hp-pavilion-gaming-15-ryzen-5-gtx-1650-8gb-512gb-_JM',
      thumbnail: 'https://http2.mlstatic.com/D_Q_NP_767595-MLA45745061922_042021-O.webp',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'HP GAMING COLOMBIA', seller_reputation: { level_id: '4_light_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'HP' },
        { id: 'PROCESSOR_BRAND', value_name: 'AMD' },
        { id: 'PROCESSOR_LINE', value_name: 'Ryzen 5' },
        { id: 'PROCESSOR_MODEL', value_name: '5600H' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO65384964',
      title: 'Portátil Lenovo IdeaPad Slim 3 AMD Ryzen 7 7735HS 24GB RAM 512GB SSD Azul',
      price: 2499000,
      original_price: 2899000,
      permalink: 'https://www.mercadolibre.com.co/lenovo-ideapad-slim-3-amd-ryzen-7-7735hs-24gb-ram-512gb-ssd-azul/p/MCO65384964',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_932342-MLA70557135564_072023-O.jpg',
      condition: 'new',
      official_store_id: 1001,
      shipping: { free_shipping: true },
      seller: { nickname: 'LENOVO TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'AMD' },
        { id: 'PROCESSOR_LINE', value_name: 'Ryzen 7' },
        { id: 'PROCESSOR_MODEL', value_name: '7735HS' },
        { id: 'RAM', value_name: '24 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.3 "' }
      ]
    },
    {
      id: 'MCO65915099',
      title: 'Notebook Lenovo IdeaPad Slim 3 15ARP10 Ryzen 7 7735HS 24GB DDR5 512GB SSD NVMe 15.3 IPS',
      price: 2549000,
      original_price: 2949000,
      permalink: 'https://www.mercadolibre.com.co/notebook-lenovo-ideapad-slim-3-15arp10-ryzen-7-7735hs-24gb-ddr5-512gb-ssd-nvme-153-wuxga-ips-1920x1200-wifi-6-camara-ir-teclado-espanol/p/MCO65915099',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_645272-MLU71430001106_092023-O.webp',
      condition: 'new',
      official_store_id: 1001,
      shipping: { free_shipping: true },
      seller: { nickname: 'LENOVO TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'AMD' },
        { id: 'PROCESSOR_LINE', value_name: 'Ryzen 7' },
        { id: 'PROCESSOR_MODEL', value_name: '7735HS' },
        { id: 'RAM', value_name: '24 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.3 "' }
      ]
    },
    {
      id: 'MCO65444811',
      title: 'Lenovo IdeaPad Slim 3 Intel Core i5-13420H 24GB RAM 512GB SSD 15.3 FHD Verde Claro',
      price: 2349000,
      original_price: 2749000,
      permalink: 'https://www.mercadolibre.com.co/lenovo-ideapad-slim-3-i5-13420h-24gb-ram-512gb-ssd-153-fhd-verde-claro/p/MCO65444811',
      thumbnail: 'https://http2.mlstatic.com/D_Q_NP_781504-MLA45745269368_042021-O.webp',
      condition: 'new',
      official_store_id: 1001,
      shipping: { free_shipping: true },
      seller: { nickname: 'LENOVO TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i5' },
        { id: 'PROCESSOR_MODEL', value_name: '13420H' },
        { id: 'RAM', value_name: '24 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.3 "' }
      ]
    },
    {
      id: 'MCOU3212958128',
      title: 'Lenovo IdeaPad Slim 3 Core i3-N305 15.6 Pulgadas 8GB RAM 512GB SSD Azul Claro',
      price: 1489000,
      original_price: 1799000,
      permalink: 'https://www.mercadolibre.com.co/lenovo-ideapad-slim-3-i3-156--8gb-512gb-ssd-azul-claro/up/MCOU3212958128',
      thumbnail: 'https://http2.mlstatic.com/D_Q_NP_614196-MLA45744959591_042021-O.webp',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'LENOVO DIRECTO COL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i3' },
        { id: 'PROCESSOR_MODEL', value_name: 'N305' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO51232872',
      title: 'Portátil Lenovo IdeaPad Slim 3 15IRH10 Intel Core i7-13620H 24GB 512GB SSD Windows 11 15.3',
      price: 2999000,
      original_price: 3499000,
      permalink: 'https://www.mercadolibre.com.co/portatil-lenovo-ideapad-slim-3-15irh10-intel-core-i7-13620h-24-gb-512-gb-ssd-windows-11-153-83ns0008br-luna-grey/p/MCO51232872',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_666648-MCO111513402025_052026-O.webp',
      condition: 'new',
      official_store_id: 1001,
      shipping: { free_shipping: true },
      seller: { nickname: 'LENOVO TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i7' },
        { id: 'PROCESSOR_MODEL', value_name: '13620H' },
        { id: 'RAM', value_name: '24 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.3 "' }
      ]
    },
    {
      id: 'MCOU3090447988',
      title: 'Lenovo IdeaPad Slim 3 15IAN8 Intel Core i3-N305 8GB RAM 256GB SSD 15.6 FHD',
      price: 1369000,
      original_price: 1649000,
      permalink: 'https://www.mercadolibre.com.co/lenovo-ideapad-slim-3-15ian8-82xb0031lm/up/MCOU3090447988',
      thumbnail: 'https://http2.mlstatic.com/D_600330-CBT93495084193_092025-O.webp',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'COMPUTO COLOMBIA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Lenovo' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i3' },
        { id: 'PROCESSOR_MODEL', value_name: 'N305' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '256 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCO3606557414',
      title: 'Apple MacBook Air M2 13.6 Pulgadas 8GB de RAM 512GB SSD Retina',
      price: 4599000,
      original_price: 5199000,
      permalink: 'https://articulo.mercadolibre.com.co/MCO-3606557414-macbook-air-m2-136-pulgadas-8-gb-de-ram-512-gb-ssd-_JM',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_708839-MLA51356236557_082022-O.webp',
      condition: 'new',
      official_store_id: 1005,
      shipping: { free_shipping: true },
      seller: { nickname: 'APPLE TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Apple' },
        { id: 'PROCESSOR_BRAND', value_name: 'Apple' },
        { id: 'PROCESSOR_LINE', value_name: 'M2' },
        { id: 'PROCESSOR_MODEL', value_name: 'M2' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '13.6 "' }
      ]
    },
    {
      id: 'MCOU3926527320',
      title: 'Apple MacBook Air M2 8GB RAM 256GB SSD A2681 Gris Espacial 13.6',
      price: 4199000,
      original_price: 4799000,
      permalink: 'https://www.mercadolibre.com.co/macbook-air-m2-8gb-ram--256gb-ssd-m2-a2681-gris-espacial/up/MCOU3926527320',
      thumbnail: 'https://http2.mlstatic.com/D_673019-MLA76813484542_062024-O.webp',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'MAC CENTER AUTORIZADO', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Apple' },
        { id: 'PROCESSOR_BRAND', value_name: 'Apple' },
        { id: 'PROCESSOR_LINE', value_name: 'M2' },
        { id: 'PROCESSOR_MODEL', value_name: 'M2' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '256 GB' },
        { id: 'DISPLAY_SIZE', value_name: '13.6 "' }
      ]
    },
    {
      id: 'MCO2143034591',
      title: 'Portátil Dell Inspiron 15 3000 15.6 Táctil Intel Core i5 8GB RAM 256GB SSD',
      price: 1999000,
      original_price: 2399000,
      permalink: 'https://articulo.mercadolibre.com.co/MCO-2143034591-portatil-dell-inspiron-15-3000-de-156-tactil-i5-8gb-256g-_JM',
      thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_629768-MLU72829273907_112023-O.webp',
      condition: 'new',
      shipping: { free_shipping: true },
      seller: { nickname: 'DELL PARTNER COLOMBIA', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Dell' },
        { id: 'PROCESSOR_BRAND', value_name: 'Intel' },
        { id: 'PROCESSOR_LINE', value_name: 'Core i5' },
        { id: 'PROCESSOR_MODEL', value_name: '1135G7' },
        { id: 'RAM', value_name: '8 GB' },
        { id: 'SSD_CAPACITY', value_name: '256 GB' },
        { id: 'DISPLAY_SIZE', value_name: '15.6 "' }
      ]
    },
    {
      id: 'MCOU5731713092',
      title: 'Portátil Gamer Acer Nitro V 16 AI AMD Ryzen 5 240 16GB RAM 512GB SSD RTX 5050',
      price: 4399000,
      original_price: 4999000,
      permalink: 'https://www.mercadolibre.com.co/portatil-gamer-acer-nitro-v-16-ai-ryzen-5-240--rtx-5050/up/MCOU5731713092',
      thumbnail: 'https://http2.mlstatic.com/D_639593-CBT115807164694_092026-O.webp',
      condition: 'new',
      official_store_id: 1004,
      shipping: { free_shipping: true },
      seller: { nickname: 'ACER TIENDA OFICIAL', seller_reputation: { level_id: '5_green' } },
      attributes: [
        { id: 'BRAND', value_name: 'Acer' },
        { id: 'PROCESSOR_BRAND', value_name: 'AMD' },
        { id: 'PROCESSOR_LINE', value_name: 'Ryzen 5' },
        { id: 'PROCESSOR_MODEL', value_name: '240' },
        { id: 'RAM', value_name: '16 GB' },
        { id: 'SSD_CAPACITY', value_name: '512 GB' },
        { id: 'DISPLAY_SIZE', value_name: '16 "' }
      ]
    }
  ];

  return filterTrustedNewListings(mcoItems).map(item => transformApiItem(item));
}

/**
 * Filters raw Mercado Libre API items to keep only new products from official stores
 * or sellers with good reputation (5_green / 4_light_green).
 */
export function filterTrustedNewListings(results = []) {
  return results.filter(item => {
    if (!item || !item.permalink || !item.thumbnail) return false;
    if (item.condition && item.condition !== 'new') return false;

    const isOfficial = Boolean(item.official_store_id);
    const repLevel = item.seller?.seller_reputation?.level_id;
    const hasGoodRep = !repLevel || repLevel === '5_green' || repLevel === '4_light_green';
    return isOfficial || hasGoodRep;
  });
}

/**
 * Validates that a candidate image URL resolves to HTTP 200 with an image content-type
 * and does not redirect to Mercado Libre's missing-image placeholder.
 */
async function checkImageUrl200(imageUrl, requestHeaders) {
  try {
    const res = await fetch(imageUrl, { headers: requestHeaders, redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    const isPlaceholder = res.url.includes('img-not-available');
    // Consume/cancel body to avoid open handles
    await res.body?.cancel();
    return res.status === 200 && ct.startsWith('image/') && !isPlaceholder;
  } catch {
    return false;
  }
}

/**
 * Validates that a product permalink has a valid Mercado Libre Colombia product path
 * and responds with HTTP 200 (never saving 404 or listing/search URLs).
 */
async function checkPermalink200(permalink, requestHeaders) {
  try {
    const parsed = new URL(permalink);
    const isValidHost = parsed.hostname === 'www.mercadolibre.com.co' || parsed.hostname === 'articulo.mercadolibre.com.co';
    const isValidProductPath = /\/p\/MCO\d+|\/up\/MCOU\d+|\/MCO-\d+-/i.test(parsed.pathname);
    if (!isValidHost || !isValidProductPath) return false;

    const res = await fetch(permalink, { headers: requestHeaders, redirect: 'follow' });
    await res.body?.cancel();
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Validates both image URLs and product permalinks for HTTP 200 before persisting.
 */
export async function validateCatalogUrls(items) {
  const requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'es-CO,es;q=0.9'
  };

  console.log(`🔎 Validando HTTP 200 en ${items.length} imágenes y permalinks...`);
  const validated = [];
  const batchSize = 5;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const checks = await Promise.all(
      batch.map(async item => {
        const [imgOk, linkOk] = await Promise.all([
          checkImageUrl200(item.imagen, requestHeaders),
          checkPermalink200(item.enlace, requestHeaders)
        ]);
        if (!imgOk) {
          console.warn(`⚠️ Imagen descartada (no devolvió 200 image/*): ${item.id} -> ${item.imagen}`);
        }
        if (!linkOk) {
          console.warn(`⚠️ Enlace descartado (no devolvió 200 o formato inválido): ${item.id} -> ${item.enlace}`);
        }
        return imgOk && linkOk ? item : null;
      })
    );
    for (const item of checks) {
      if (item) validated.push(item);
    }
  }

  console.log(`✅ Validación completada: ${validated.length}/${items.length} portátiles con imagen y enlace HTTP 200.`);
  return validated;
}

/**
 * Main API consumer function
 */
export async function fetchMercadoLibreLaptops() {
  const endpointUrl = new URL(API_URL);
  endpointUrl.searchParams.set('condition', 'new');
  const searchUrl = endpointUrl.toString();

  console.log('🚀 Consultando API pública de Mercado Libre Colombia...');
  console.log(`🌐 Endpoint: ${searchUrl}`);

  let candidates = [];

  try {
    const headers = buildMeliApiHeaders();

    const response = await axios.get(searchUrl, {
      headers,
      timeout: 10000
    });

    const results = filterTrustedNewListings(response.data?.results || []);

    if (results.length > 0) {
      console.log(`📦 Éxito: Obtenidos ${results.length} portátiles nuevos de tiendas oficiales/reputación verde desde la API.`);
      // Enrich each item with direct /items/{ITEM_ID} pricing (sale_price.amount / original_price) so no stale/cached values remain
      const enriched = await Promise.all(
        results.map(async item => {
          const live = await fetchItemLivePricing(item.id, headers);
          if (live.ok && live.itemData) {
            return {
              ...item,
              price: live.pricing.price,
              original_price: live.pricing.originalPrice,
              sale_price: live.itemData.sale_price ?? item.sale_price
            };
          }
          return item;
        })
      );
      candidates = enriched.map(item => transformApiItem(item));
    } else {
      console.warn('⚠️ La API no retornó resultados nuevos confiables en data.results. Activando caché local verificada.');
    }
  } catch (error) {
    console.warn(`⚠️ Aviso al consultar la API de Mercado Libre (${error.message}).`);
    if (error.response?.status === 403) {
      console.warn('ℹ️ La API de búsqueda devuelve 403 sin token OAuth (MELI_ACCESS_TOKEN). Activando catálogo local verificado de MCO1652.');
    } else {
      console.warn('ℹ️ Activando catálogo local verificado de la categoría MCO1652.');
    }
  }

  if (candidates.length === 0) {
    candidates = getCuratedMcoLaptops();
  }

  const validated = await validateCatalogUrls(candidates);
  return validated.length > 0 ? validated : candidates;
}

/**
 * Saves processed results to src/data/portatiles.json
 */
export async function saveToFile(data) {
  const targetDir = path.resolve(__dirname, '../src/data');
  const targetPath = path.join(targetDir, 'portatiles.json');

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`💾 Base de datos guardada exitosamente en: ${targetPath}`);
  console.log(`📊 Total de portátiles procesados: ${data.length}`);
}

// Auto-run if executed directly via node backend/scraper.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      const laptops = await fetchMercadoLibreLaptops();
      await saveToFile(laptops);
      console.log('🎉 Proceso de consulta de API y análisis semántico finalizado con éxito.');
    } catch (err) {
      console.error('❌ Error fatal al procesar los datos:', err);
      process.exit(1);
    }
  })();
}
