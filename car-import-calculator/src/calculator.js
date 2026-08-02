/**
 * Car import cost calculation engine (pure functions).
 *
 * Estimates the one-time cost of importing a used car from Great Britain
 * (GB) or Northern Ireland (NI) into the Republic of Ireland.
 *
 * Origin matters because:
 *  - NI is inside the EU customs union & VAT area  → 0% customs duty,
 *    no import VAT, and second-hand margin-scheme purchases are common.
 *  - GB attracts 10% customs duty (unless UK/EU-origin goods under the
 *    Trade & Cooperation Agreement) and 23% import VAT for cars first
 *    registered on/after 1 Jan 2021.
 *
 * A VAT-registered buyer (e.g. a car dealer) can reclaim import VAT as
 * input VAT, so it is neutral to the final cost.
 */

const config = require("./tax-config");

const round2 = (n) => Math.round(n * 100) / 100;

/** Look up the VRT percentage band for a given CO2 figure. */
function vrtRateFor(co2) {
  const band = config.vrtRates.find((b) => co2 <= b.maxCO2);
  return band ? band.rate : config.vrtRates[config.vrtRates.length - 1].rate;
}

/** Full VRT band object (rate + minimum) for a given CO2 figure. */
function vrtBandFor(co2) {
  return config.vrtRates.find((b) => co2 <= b.maxCO2) || config.vrtRates[config.vrtRates.length - 1];
}

/** Annual motor tax band (informational). */
function motorTaxBandFor(co2) {
  const band = config.motorTaxRates.find((b) => co2 <= b.maxCO2);
  return band || config.motorTaxRates[config.motorTaxRates.length - 1];
}

/**
 * NOx levy (since 1 Jan 2021): tiered €5/€15/€25 per mg/km, no cap.
 * e.g. 90 mg/km → 40×5 + 40×15 + 10×25 = €1,050.
 */
function noxCharge(nox) {
  const n = Number(nox) || 0;
  let charge = 0;
  let prevMax = 0;
  for (const tier of config.nox.tiers) {
    if (n <= prevMax) break;
    charge += (Math.min(n, tier.maxMg) - prevMax) * tier.rate;
    prevMax = tier.maxMg;
  }
  return charge;
}

/**
 * Whether Irish import VAT applies.
 * GB cars ALWAYS pay 23% import VAT, regardless of registration year
 * (verified: completecar.ie per Revenue advice). NI cars never pay,
 * provided NI-registered status can be proven.
 */
function importVatApplies(origin) {
  return origin === "GB";
}

/**
 * Apply the NEDC→WLTP uplift to a CO2 figure if the user supplied NEDC data.
 * @param {number} co2 raw CO2 figure
 * @param {string} [co2Standard] "nedc" | "wltp"
 * @param {string} [fuelType]    "diesel" | "petrol" | ...
 */
function wltpCo2(co2, co2Standard, fuelType) {
  const c = Number(co2) || 0;
  if (co2Standard !== "nedc") return c;
  const f = fuelType === "diesel" ? config.nedcToWltp.diesel : config.nedcToWltp.other;
  return Math.round(c * f.slope + f.intercept);
}

/**
 * EV VRT relief (VERIFIED): €5,000 for registrations before 31 Dec 2026,
 * full below €40,000 OMSP, tapered to €0 at €50,000 OMSP.
 */
function evReliefFor(omsp, firstRegYear) {
  if (Number(firstRegYear) > config.evRelief.untilYear) return 0;
  if (omsp >= config.evRelief.zeroAtOmsp) return 0;
  if (omsp <= config.evRelief.fullUpToOmsp) return config.evRelief.maxAmount;
  // taper: €5,000 at €40k down to €0 at €50k
  return round2((config.evRelief.zeroAtOmsp - omsp) * 0.5);
}

/**
 * Compute the full estimate.
 *
 * @param {object} input
 * @param {string}  input.origin          "GB" | "NI"
 * @param {string}  input.buyerType       "private" | "vat-dealer"
 * @param {number}  input.ukPriceGBP      purchase price in £
 * @param {number}  input.co2             CO2 emissions g/km
 * @param {number}  [input.nox]           NOx emissions mg/km (default 0)
 * @param {number}  [input.firstRegYear]  year of first registration
 * @param {number}  [input.shippingEUR]   shipping cost € (default from config)
 * @param {number}  [input.fxRate]        EUR per GBP (default from config)
 * @param {number}  [input.omspOverride]  optional manual OMSP € (else estimated)
 * @param {string}  [input.fuelType]      "petrol" | "diesel" | "electric" | "hybrid"
 * @param {string}  [input.co2Standard]   "wltp" (default) | "nedc"
 * @returns {{ breakdown: object, total: number }}
 */
function calculate(input) {
  const {
    origin,
    buyerType,
    ukPriceGBP,
    co2,
    nox = 0,
    firstRegYear,
    shippingEUR,
    fxRate,
    omspOverride,
    fuelType = "petrol",
    co2Standard = "wltp",
  } = input;

  const fx = Number(fxRate) || config.fallbackFx.EUR_PER_GBP;
  const priceEUR = round2(Number(ukPriceGBP) * fx);
  const shipping = round2(Number(shippingEUR) || config.defaultShippingEUR);

  // ── Customs duty (on CIF: price + shipping) ──
  const dutyRate = config.customsDutyRate[origin];
  const duty = round2((priceEUR + shipping) * dutyRate);

  // ── Import VAT (GB always pays; NI never) ──
  const vatRate = config.vatRate;
  const vatApplies = importVatApplies(origin);
  const vat = vatApplies ? round2((priceEUR + shipping + duty) * vatRate) : 0;

  // ── VRT ──
  // OMSP (Open Market Selling Price) is what Revenue tax VRT on. In practice
  // importers estimate OMSP ≈ UK price + shipping + customs duty (in EUR).
  const omsp = omspOverride ? round2(Number(omspOverride)) : round2(priceEUR + shipping + duty);
  const effCo2 = wltpCo2(co2, co2Standard, fuelType);
  const band = vrtBandFor(effCo2);
  const noxLevy = noxCharge(nox);
  const rawVrt = omsp <= band.minThreshold ? Math.max(omsp * band.rate, band.minVrt) : omsp * band.rate;
  const evRelief = fuelType === "electric" ? evReliefFor(omsp, firstRegYear) : 0;
  const vrt = round2(Math.max(0, rawVrt + noxLevy - evRelief));

  // ── Fixed fees ──
  const registrationFee = config.fees.registration;
  const nctFee = config.fees.nct;

  // ── Totals ──
  // For a VAT-registered dealer the import VAT is reclaimable input VAT,
  // so it appears in the breakdown but is excluded from the net cost.
  const isDealer = buyerType === "vat-dealer";
  const vatNet = isDealer ? 0 : vat;

  const total = round2(priceEUR + shipping + duty + vatNet + vrt + registrationFee + nctFee);
  const grandTotalInclVat =
    isDealer && vat > 0 ? round2(total + vat) : total;

  const motorTax = motorTaxBandFor(effCo2);

  return {
    breakdown: {
      carPriceEUR: priceEUR,
      carPriceGBP: round2(Number(ukPriceGBP)),
      fxRate: fx,
      shippingEUR: shipping,
      dutyRate,
      duty,
      vatRate,
      vatApplies,
      vat,
      vatReclaimable: isDealer && vat > 0,
      omsp,
      co2: effCo2,
      co2Standard,
      vrtRate: band.rate,
      vrtBand: band.name,
      noxMg: Number(nox) || 0,
      noxLevy,
      evRelief,
      vrt,
      registrationFee,
      nctFee,
      motorTaxBand: motorTax.name,
      annualMotorTax: motorTax.rate,
    },
    total,
    grandTotalInclVat,
    isDealer,
  };
}

module.exports = { calculate, vrtRateFor, noxCharge, importVatApplies, motorTaxBandFor, wltpCo2, evReliefFor, round2 };
