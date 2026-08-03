/**
 * GBP → EUR exchange rate.
 *
 * Uses the free, keyless exchangerate-api (open.er-api.com) when online,
 * falling back to a configurable default if it fails or times out.
 */

const config = require("./tax-config");

const FALLBACK = config.fallbackFx.EUR_PER_GBP;
let cachedRate = null;
let cacheTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function fetchLiveRate() {
  const res = await fetch("https://open.er-api.com/v6/latest/GBP", {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`FX API responded ${res.status}`);
  const json = await res.json();
  const rate = Number(json?.rates?.EUR);
  if (!rate || rate <= 0) throw new Error("No EUR rate in FX response");
  return rate;
}

/** Returns EUR per GBP, preferring a cached live rate. */
async function getEurPerGbp() {
  if (cachedRate && Date.now() - cacheTime < CACHE_TTL_MS) return cachedRate;
  try {
    const rate = await fetchLiveRate();
    cachedRate = rate;
    cacheTime = Date.now();
    return rate;
  } catch {
    return FALLBACK;
  }
}

/** True when the last attempt produced a live (not fallback) rate. */
function isLiveRate() {
  return Boolean(cachedRate && Date.now() - cacheTime < CACHE_TTL_MS);
}

module.exports = { getEurPerGbp, isLiveRate, FALLBACK };
