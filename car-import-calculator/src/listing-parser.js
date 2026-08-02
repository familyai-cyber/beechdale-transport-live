/**
 * listing-parser.js
 * Extracts car listing details (make, model, year, price, CO2, fuel type, origin)
 * from a used-car advert URL + fetched HTML. Pure CommonJS, zero dependencies.
 *
 * export: extractListing(url, html, opts) -> result
 *   opts.fxRate  EUR-per-GBP rate for converting EUR prices to GBP (fallback: config)
 */

'use strict';

const { fallbackFx } = require('./tax-config');

// ---------------------------------------------------------------------------
// Make dictionary (longest first so "Land Rover" wins over "Rover")
// ---------------------------------------------------------------------------
const MAKES = [
  'Alfa Romeo', 'Aston Martin', 'Land Rover', 'Mercedes-Benz', 'Rolls-Royce',
  'Volkswagen', 'Chevrolet', 'Mitsubishi', 'Chrysler', 'Citroen', 'Citroën',
  'Daihatsu', 'Hummer', 'Infiniti', 'Lamborghini', 'Maserati', 'McLaren',
  'Peugeot', 'Pontiac', 'Porsche', 'SsangYong', 'Subaru', 'Suzuki',
  'Toyota', 'Bentley', 'Ferrari', 'Honda', 'Hyundai', 'Jaguar',
  'Kia', 'Mazda', 'Nissan', 'Renault', 'Rover', 'Skoda', 'Škoda',
  'Vauxhall', 'Volvo', 'Dacia', 'Fiat', 'Ford', 'Jeep', 'Lexus',
  'Mini', 'Opel', 'Seat', 'Tesla', 'Abarth', 'Audi', 'BMW', 'BYD',
  'Cupra', 'DS', 'Genesis', 'Lotus', 'MG', 'Polestar', 'Smart',
  // Common shorthand used in ad titles
  'VW', 'Mercedes', 'Alfa', 'Landrover',
];

const SORTED_MAKES = MAKES.slice().sort((a, b) => b.length - a.length);
const MAKE_RE = SORTED_MAKES.map(
  (m) => [m, new RegExp('\\b' + m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')]
);

const TITLE_STOPWORDS = new RegExp(
  '^(for|in|on|with|at|and|or|the|a|an|of|to|from|price|great|excellent|condition|used|new|sale|only|car|cars|ireland|irish|dublin|cork|galway|spec|very|low|miles|mileage|approved|warranty|includes?|available|ready|goes?|travels?)$',
  'i'
);

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------
function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/&pound;/g, '£')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** Strip scripts/styles/tags -> collapsed visible text (capped). */
function textFromHtml(html, cap) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, cap || 120000);
}

/** Parse <meta> tags into [{key, value}, ...]. */
function metaTags(html) {
  const out = [];
  const re = /<meta\b[^>]*>/gi;
  let m;
  while ((m = re.exec(String(html)))) {
    const attrs = {};
    const attrRe = /([a-zA-Z:]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
    let a;
    while ((a = attrRe.exec(m[0]))) attrs[a[1].toLowerCase()] = a[3] || a[4] || a[5] || '';
    out.push(attrs);
  }
  return out;
}

function metaContent(html, keys) {
  const metas = metaTags(html);
  for (const key of keys) {
    for (const t of metas) {
      const k = (t.property || t.name || t.itemprop || '').toLowerCase();
      if (k === key.toLowerCase() && t.content) return decodeEntities(t.content.trim());
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------
function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(String(html)))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch (_e) { /* malformed block — skip */ }
  }
  return blocks;
}

function collectNodes(node, out) {
  if (!node || typeof node !== 'object') return;
  out.push(node);
  if (Array.isArray(node['@graph'])) node['@graph'].forEach((n) => collectNodes(n, out));
  if (Array.isArray(node['@reverse'])) node['@reverse'].forEach((n) => collectNodes(n, out));
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (v && typeof v === 'object' && key !== 'offers' && !key.startsWith('@')) {
      if (Array.isArray(v)) v.forEach((x) => collectNodes(x, out));
      else collectNodes(v, out);
    }
  }
}

function findVehicleNode(blocks) {
  const all = [];
  blocks.forEach((b) => collectNodes(b, all));
  // Preferred: an explicit vehicle/car type.
  const vehicle = all.find((n) => /(^|[^a-z])(vehicle|car|motor(ized)?)([^a-z]|$)/i.test(String(n['@type'] || '')));
  if (vehicle) return vehicle;
  return all.find((n) => String(n['@type'] || '') === 'Product' && (n.offers || n.brand || n.model));
}

function jsonLdValue(v) {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim();
  if (Array.isArray(v)) return jsonLdValue(v[0]);
  if (typeof v === 'object') return jsonLdValue(v.name ?? v['@value']);
  return null;
}

function jsonLdOffers(node) {
  const offers = node.offers;
  if (!offers) return null;
  const list = Array.isArray(offers) ? offers : [offers];
  for (const o of list) {
    if (!o || typeof o !== 'object') continue;
    const price = jsonLdValue(o.price) ?? jsonLdValue(o.lowPrice) ?? jsonLdValue(o['@value']);
    if (price == null) continue;
    // Currency may sit on the offer itself, nested in a priceSpecification
    // (usedcarsni.com), or on a lowPrice/highPrice spec.
    const currency =
      jsonLdValue(o.priceCurrency) ??
      (o.priceSpecification && typeof o.priceSpecification === 'object'
        ? jsonLdValue(o.priceSpecification.priceCurrency)
        : null);
    return { price, currency };
  }
  return null;
}

function extractJsonLd(html) {
  const node = findVehicleNode(jsonLdBlocks(html));
  if (!node) return null;
  const out = {};
  out.make = jsonLdValue(node.brand);
  out.model = jsonLdValue(node.model) ?? jsonLdValue(node.vehicleModel) ?? jsonLdValue(node['model@name']);
  const name = jsonLdValue(node.name);
  if (name) out.name = name;
  const dateStr =
    jsonLdValue(node.productionDate) ?? jsonLdValue(node.modelDate) ??
    jsonLdValue(node.vehicleModelDate) ?? jsonLdValue(node.yearOfManufacture) ??
    jsonLdValue(node.modelYear);
  if (dateStr) {
    const y = /\b(19|20)\d{2}\b/.exec(dateStr);
    if (y) out.year = Number(y[0]);
  }
  const offers = jsonLdOffers(node);
  if (offers) {
    out.price = offers.price;
    out.currency = offers.currency;
  }
  const engine = node.vehicleEngine && typeof node.vehicleEngine === 'object' ? node.vehicleEngine : null;
  if (engine) {
    out.fuelType = jsonLdValue(engine.fuelType) ?? jsonLdValue(engine.engineType);
  }
  out.fuelType = out.fuelType ?? jsonLdValue(node.fuelType);
  return out;
}

// ---------------------------------------------------------------------------
// Price parsing
// ---------------------------------------------------------------------------
function cleanNumber(s) {
  const str = String(s).trim();
  // "1.234.567,89" (EU) vs "1,234,567.89" (US/UK)
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(str)) return Number(str.replace(/\./g, '').replace(',', '.'));
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(str)) return Number(str.replace(/,/g, ''));
  return Number(str.replace(/[^\d.]/g, ''));
}

function parsePrice(text) {
  const t = String(text || '');
  const patterns = [
    { re: /(?:£|GBP|GB\s?£)\s*(\d{1,7}(?:[.,]\d{3})*(?:\.\d{1,2})?)/i, cur: 'GBP' },
    { re: /(\d{1,7}(?:[.,]\d{3})*(?:\.\d{1,2})?)\s*(?:GBP|£)/i, cur: 'GBP' },
    { re: /(?:€|EUR|EUROS?)\s*(\d{1,7}(?:[.,]\d{3})*(?:\.\d{1,2})?)/i, cur: 'EUR' },
    { re: /(\d{1,7}(?:[.,]\d{3})*(?:\.\d{1,2})?)\s*(?:EUR|EUROS?|€)/i, cur: 'EUR' },
  ];
  for (const p of patterns) {
    const m = p.re.exec(t);
    if (m && m[1] !== undefined) {
      const amount = cleanNumber(m[1]);
      if (amount > 0 && amount < 10000000) return { amount, currency: p.cur };
    }
  }
  return null;
}

function extractPriceFromMeta(html) {
  const amount = metaContent(html, ['og:price:amount', 'product:price:amount', 'price', 'itemprop:price', 'product:retailer_item_id']);
  const currency = metaContent(html, ['og:price:currency', 'product:price:currency']);
  if (amount) {
    const n = cleanNumber(amount);
    if (n > 0 && n < 10000000) {
      const cur = (currency || '').toUpperCase();
      return { amount: n, currency: /EUR|€/.test(cur) ? 'EUR' : /GBP|£/.test(cur) ? 'GBP' : null };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Year & CO2 & fuel
// ---------------------------------------------------------------------------
function parseYear(text) {
  const re = /\b(19|20)\d{2}\b/g;
  let m;
  const years = [];
  while ((m = re.exec(String(text))) && years.length < 20) {
    const y = Number(m[0]);
    if (y >= 1990 && y <= 2026) years.push(y);
  }
  // Prefer the year that appears near a car-like context; otherwise first.
  return years.length ? years[0] : null;
}

/** Year from GB current-style plate "XX YY XXX" (2001+). */
function yearFromGbPlate(text) {
  const m = /\b[A-Z]{2}\s?(\d{2})\s?[A-Z]{3}\b/.exec(String(text));
  if (!m) return null;
  const yy = Number(m[1]);
  return yy >= 50 ? 2000 + (yy - 50) : 2000 + yy;
}

function extractCo2(text) {
  const t = String(text || '');
  const patterns = [
    /\bco2\s*(?:emissions|output|rating)?\s*[:–-]?\s*(\d{2,3}(?:\.\d)?)\s*g\s*\/?\s*km/i,
    /\bemissions\s*[:–-]?\s*(\d{2,3})\s*g\s*\/?\s*km/i,
    /(\d{2,3})\s*g\s*\/\s*km/i,
  ];
  for (const re of patterns) {
    const m = re.exec(t);
    if (m) {
      const v = Number(m[1]);
      if (v >= 40 && v <= 400) return v;
    }
  }
  return null;
}

function detectFuelType(text) {
  const t = String(text || '').toLowerCase();
  if (/\b(pure electric|battery electric|fully electric|100% electric)\b|electric vehicle|\bev\b|zero emissions/.test(t)) return 'electric';
  if (/plug[- ]?in hybrid|\bphev\b/.test(t)) return 'hybrid';
  if (/hybrid|\bhev\b|self[- ]charging/.test(t)) return 'hybrid';
  if (/diesel|\btdi\b|\bd4d\b|oil[- ]burn/.test(t)) return 'diesel';
  if (/petrol|gasoline|\btsi\b|\btsfi\b|\bgdi\b|\bfsi\b/.test(t)) return 'petrol';
  return null;
}

// ---------------------------------------------------------------------------
// Origin detection (GB mainland vs Northern Ireland)
// ---------------------------------------------------------------------------
function detectOrigin(url, html) {
  const u = String(url || '').toLowerCase();
  const t = textFromHtml(html, 30000);
  const combined = (u + ' ' + t).toLowerCase();
  if (/northern[ -]?ireland|car(s)? ?ni|ni registered|county (antrim|armagh|down|fermanagh|derry|londonderry|tyrone)/.test(combined)) {
    return 'NI';
  }
  // NI plate: 3 letters + 3-4 digits (e.g. "ABC 1234") or 2 letters + 5 digits
  // (post-2019 "AB 12345"). Remove currency markers so "GBP 7995" isn't misread.
  const tNoCurr = t.replace(/\b(?:GBP|EUR|USD|EUROS?)\s*\d/g, ' ');
  const cleaned = t.replace(/\b[A-Z]{2}\s?\d{2}\s?[A-Z]{3}\b/g, ' ').replace(/\b[A-Z]\s?\d{1,3}\s?[A-Z]{3}\b/g, ' ');
  if (hasRealNiPlate(tNoCurr) || hasRealNiPlate(cleaned)) return 'NI';
  if (/\b[A-Z]{2}\s?\d{2}\s?[A-Z]{3}\b/.test(t)) return 'GB';
  if (/\b[A-Z]\s?\d{1,3}\s?[A-Z]{3}\b/.test(t)) return 'GB';
  return null;
}

// All-caps words that commonly precede a number in a listing but are NOT the
// letters of an NI registration plate (trim/fuel/gearbox abbreviations). Without
// this, "1.5 TSI 2019" and "GTI 22000" would be misread as "ABC 1234" plates.
const NI_PLATE_FALSE_PREFIX = /^(TSI|GTI|GTD|TDI|SDI|CDI|DCI|HDI|VTI|VTS|SRI|HSE|GLS|GLE|VXR|STI|WRX|AMG|DSG|GTS)$/;
const NI_PLATE_2019_RE = /\b[A-Z]{2}\s?\d{5}\b/;

function hasRealNiPlate(text) {
  // Post-2019 format: 2 letters + 5 digits.
  if (NI_PLATE_2019_RE.test(text)) return true;
  // Pre-2019 format: 3 letters + 3-4 digits. Reject when the digit block looks
  // like a year (e.g. "TSI 2019", "GOLF 2020") or the prefix is a known car
  // abbreviation (e.g. "GTI 22000" mileage) — both are false positives.
  const re = /\b[A-Z]{3}\s?(\d{3,4})\b/g;
  let m;
  while ((m = re.exec(text))) {
    const digits = m[1];
    if (/^(19|20)\d{2}$/.test(digits)) continue;
    if (NI_PLATE_FALSE_PREFIX.test(m[0].slice(0, 3))) continue;
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Make / model from a human title
// ---------------------------------------------------------------------------
function titleCase(s) {
  return String(s || '')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(Mp|Id|I|Iii|Iv|V|Ix)\b/g, (m) => m.toLowerCase());
}

function extractMakeModel(title) {
  const t = String(title || '').trim();
  const clean = ' ' + t.replace(/[^\w .'-]/g, ' ') + ' ';
  for (const [make, re] of MAKE_RE) {
    const m = re.exec(clean);
    if (!m) continue;
    const after = clean.slice(m.index + m[0].length).trim();
    const modelParts = [];
    for (const tok of after.split(/\s+/)) {
      if (!tok) continue;
      if (/^(19|20)\d{2}$/.test(tok)) break;                     // year
      if (/^[£€]/.test(tok)) break;                              // price
      if (/^\d{1,3}([.,]\d{3})*$/.test(tok) && tok.length >= 4 && modelParts.length) break; // big number (mileage/price)
      if (TITLE_STOPWORDS.test(tok)) break;
      if (/^for$|^in$/.test(tok)) break;
      modelParts.push(tok.replace(/^['"]|['"]$/g, ''));
      if (modelParts.length >= 3) break;
    }
    // Trim trailing fuel-type words (e.g. "Focus Zetec Diesel" → "Focus Zetec"),
    // but never strip genuine trim/model words (M Sport, GTI, SE, etc).
    while (modelParts.length && /^(diesel|petrol|hybrid|electric|car|cars|spec)$/i.test(modelParts[modelParts.length - 1])) {
      modelParts.pop();
    }
    return { make: titleCase(make), model: modelParts.length ? titleCase(modelParts.join(' ')) : '' };
  }
  return { make: '', model: '' };
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
/**
 * @param {string} url   listing URL
 * @param {string} html  fetched page HTML
 * @param {object} opts  { fxRate }  EUR-per-GBP (defaults to config fallback)
 * @returns result object
 */
function extractListing(url, html, opts) {
  opts = opts || {};
  const fxRate = Number(opts.fxRate) || fallbackFx.EUR_PER_GBP;
  const visible = textFromHtml(html, 150000);
  const title =
    metaContent(html, ['og:title', 'twitter:title']) ||
    metaContent(html, ['title']) ||
    (/\<title\>([\s\S]*?)\<\/title\>/i.exec(String(html || '')) || [])[1] ||
    '';
  const cleanTitle = decodeEntities(title).replace(/\s+/g, ' ').trim();

  // URL path words (Autotrader /cars/volkswagen/golf/<id>, carsni /used/<year>-<make>-<model>-...).
  // Used only when the HTML yields nothing (Cloudflare-blocked sites, URL-only pastes).
  const slug = String(url || '')
    .split(/[/?#]/)
    .slice(-6)
    .join(' ')
    .replace(/(\d)[_-](\d)/g, '$1.$2') // "1-5" in URL slug → "1.5" engine size
    .replace(/[_-]+/g, ' ')
    .replace(/\b(?=[a-z0-9]*\d)[a-z0-9]{8,}\b/g, ' ') // strip advert IDs (e.g. abc12345, 14-digit ids), keep pure word makes/models
    .replace(/\b(car|cars|used|new|details?|vehicle|vehicles|advert|ad|listing|search|results?|page|autotrader|donedeal|carsni|cars\s+ni)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sources = [];
  const found = { make: '', model: '', year: null, price: null, currency: null, co2: null, fuelType: null, origin: null };

  // --- JSON-LD (most structured) ---
  const ld = extractJsonLd(html);
  if (ld && (ld.price || ld.year || ld.make || ld.model)) {
    sources.push('json-ld');
    if (ld.make) found.make = ld.make;
    if (ld.model) found.model = ld.model;
    if (ld.year) found.year = ld.year;
    if (ld.price != null) {
      found.price = cleanNumber(ld.price);
      const cur = (ld.currency || '').toUpperCase();
      if (/EUR|€/.test(cur)) found.currency = 'EUR';
      else if (/GBP|£/.test(cur)) found.currency = 'GBP';
    }
    if (ld.fuelType) found.fuelType = detectFuelType(String(ld.fuelType));
  }

  // --- Meta price ---
  if (found.price == null) {
    const mp = extractPriceFromMeta(html);
    if (mp) {
      found.price = mp.amount;
      found.currency = mp.currency;
      sources.push('meta-price');
    }
  }

  // --- Title / og (then URL slug) ---
  if (!found.make || !found.model) {
    const mm = extractMakeModel(cleanTitle);
    if (!found.make && mm.make) found.make = mm.make;
    if (!found.model && mm.model) found.model = mm.model;
    if (mm.make || mm.model) sources.push('title');
  }
  if (!found.make || !found.model) {
    const smm = extractMakeModel(slug);
    if (!found.make && smm.make) found.make = smm.make;
    if (!found.model && smm.model) found.model = smm.model;
    if (smm.make || smm.model) sources.push('url');
  }

  // --- Year ---
  if (found.year == null) {
    const fromTitle = parseYear(cleanTitle);
    const fromText = parseYear(visible);
    const fromPlate = yearFromGbPlate(visible);
    found.year = fromTitle || fromPlate || fromText || parseYear(slug);
    if (found.year) sources.push('year');
  }

  // --- Price from visible text ---
  if (found.price == null) {
    const p = parsePrice(cleanTitle) || parsePrice(decodeEntities(visible.slice(0, 20000)));
    if (p) {
      found.price = p.amount;
      found.currency = p.currency;
      sources.push('text-price');
    }
  }

  // --- Currency inference fallback ---
  // Some sites publish the price without an explicit currency (e.g. JSON-LD
  // "price" with no currency). Infer £ vs € from the visible text. The text is
  // entity-decoded because sites like usedcarsni emit &pound; / &euro;.
  if (found.price != null && !found.currency) {
    const cp = parsePrice(cleanTitle) || parsePrice(decodeEntities(visible.slice(0, 20000)));
    if (cp && cp.currency) {
      found.currency = cp.currency;
      if (!sources.includes('text-price')) sources.push('text-price');
    }
  }

  // --- CO2 & fuel ---
  if (found.co2 == null) found.co2 = extractCo2(visible) || extractCo2(cleanTitle);
  if (found.co2) sources.push('co2');
  if (found.fuelType == null) found.fuelType = detectFuelType(visible + ' ' + cleanTitle);
  if (found.fuelType) sources.push('fuel');

  // --- Origin ---
  const origin = detectOrigin(url, html);
  if (origin) sources.push('origin');

  // --- Resolve currency to GBP / EUR outputs ---
  let priceGBP = null;
  let priceEUR = null;
  let fxRateUsed = null;
  if (found.price != null && found.currency) {
    if (found.currency === 'EUR') {
      fxRateUsed = fxRate;
      priceEUR = found.price;
      priceGBP = found.currency === 'EUR' ? found.price / fxRate : found.price;
    } else {
      priceGBP = found.price;
      priceEUR = found.price * fxRate;
      fxRateUsed = fxRate;
    }
  }

  // --- Confidence ---
  let confidence = 0;
  if (found.price != null) confidence += 0.35;
  if (found.year) confidence += 0.3;
  if (found.make) confidence += 0.2;
  if (found.model) confidence += 0.1;
  if (found.co2) confidence += 0.1;
  if (sources.includes('json-ld')) confidence += 0.1;

  const result = {
    make: found.make || null,
    model: found.model || null,
    year: found.year,
    priceGBP: priceGBP != null ? Math.round(priceGBP * 100) / 100 : null,
    priceEUR: priceEUR != null ? Math.round(priceEUR * 100) / 100 : null,
    currency: found.currency,
    co2: found.co2,
    fuelType: found.fuelType,
    origin,
    title: cleanTitle || null,
    fxRateUsed,
    sources,
    confidence: Math.min(1, Math.round(confidence * 100) / 100),
  };
  return result;
}

module.exports = { extractListing, parsePrice, parseYear, extractCo2, detectOrigin, detectFuelType, MAKES };
