/**
 * calc-bundle.js — AUTO-GENERATED from src/tax-config.js and src/calculator.js.
 * Do not edit directly; regenerate with:  node scripts/build-browser.js
 */
/* global window */
(function (global) {
  "use strict";

  function loadConfig() {
    var module = { exports: {} };
    (function (module) {
      /**
       * Tax configuration for importing a car from the UK (Great Britain) or
       * Northern Ireland into the Republic of Ireland.
       *
       * Figures are based on Revenue.ie / citizensinformation.ie and should be
       * reviewed periodically. Where a value is an estimate it is marked ⚠️.
       */

      module.exports = {
        // ── Exchange rate fallback (used if the live FX API is unreachable) ──
        fallbackFx: {
          EUR_PER_GBP: 1.163, // €1.163 per £1  (≈ 0.86 GBP per EUR) ⚠️ approximate
        },

        // ── Customs duty on import ──
        // GB (mainland UK) attracts 10% duty on CIF (cost + insurance + freight)
        // unless the car qualifies as UK/EU-origin under the TCA. NI is inside the
        // EU customs union so NI-registered cars attract 0%.
        customsDutyRate: {
          GB: 0.10,
          NI: 0.00,
        },

        // ── Irish VAT ──
        // Since 1 Jan 2021 ALL cars imported from Great Britain pay 23% import VAT,
        // regardless of age or mileage (completecar.ie, per Revenue advice).
        // NI-registered cars (inside the EU VAT area) do NOT pay import VAT,
        // provided "NI used status" can be proven (V5C + NI keeper + NI MOT).
        vatRate: 0.23,

        // ── VRT rates (% of OMSP) by CO2 emissions band ──
        // VERIFIED: Category A table in force since 1 Jan 2022 (20 bands, 7%–41%).
        // Each band has a minimum VRT that applies when OMSP ≤ €2,000.
        // https://www.revenue.ie/en/importing-and-exporting/vehicle-registration-tax/
        vrtRates: [
          { maxCO2: 50, name: "0–50g (7%)", rate: 0.07, minVrt: 140, minThreshold: 2000 }, // 0–50
          { maxCO2: 80, name: "51–80g (9%)", rate: 0.09, minVrt: 180, minThreshold: 2000 }, // 51–80
          { maxCO2: 85, name: "81–85g (9.75%)", rate: 0.0975, minVrt: 195, minThreshold: 2000 }, // 81–85
          { maxCO2: 90, name: "86–90g (10.5%)", rate: 0.105, minVrt: 210, minThreshold: 2000 }, // 86–90
          { maxCO2: 95, name: "91–95g (11.25%)", rate: 0.1125, minVrt: 225, minThreshold: 2000 }, // 91–95
          { maxCO2: 100, name: "96–100g (12%)", rate: 0.12, minVrt: 240, minThreshold: 2000 }, // 96–100
          { maxCO2: 105, name: "101–105g (12.75%)", rate: 0.1275, minVrt: 255, minThreshold: 2000 }, // 101–105
          { maxCO2: 110, name: "106–110g (13.5%)", rate: 0.135, minVrt: 270, minThreshold: 2000 }, // 106–110
          { maxCO2: 115, name: "111–115g (15.25%)", rate: 0.1525, minVrt: 305, minThreshold: 2000 }, // 111–115
          { maxCO2: 120, name: "116–120g (16%)", rate: 0.16, minVrt: 320, minThreshold: 2000 }, // 116–120
          { maxCO2: 125, name: "121–125g (16.75%)", rate: 0.1675, minVrt: 335, minThreshold: 2000 }, // 121–125
          { maxCO2: 130, name: "126–130g (17.5%)", rate: 0.175, minVrt: 350, minThreshold: 2000 }, // 126–130
          { maxCO2: 135, name: "131–135g (19.25%)", rate: 0.1925, minVrt: 385, minThreshold: 2000 }, // 131–135
          { maxCO2: 140, name: "136–140g (20%)", rate: 0.20, minVrt: 400, minThreshold: 2000 }, // 136–140
          { maxCO2: 145, name: "141–145g (21.5%)", rate: 0.215, minVrt: 430, minThreshold: 2000 }, // 141–145
          { maxCO2: 150, name: "146–150g (25%)", rate: 0.25, minVrt: 500, minThreshold: 2000 }, // 146–150
          { maxCO2: 155, name: "151–155g (27.5%)", rate: 0.275, minVrt: 550, minThreshold: 2000 }, // 151–155
          { maxCO2: 170, name: "156–170g (30%)", rate: 0.30, minVrt: 600, minThreshold: 2000 }, // 156–170
          { maxCO2: 190, name: "171–190g (35%)", rate: 0.35, minVrt: 700, minThreshold: 2000 }, // 171–190
          { maxCO2: Infinity, name: "191g+ (41%)", rate: 0.41, minVrt: 820, minThreshold: 2000 }, // 191+
        ],

        // ── EV VRT relief (VERIFIED) ──
        // Full €5,000 relief for registrations before 31 Dec 2026 where OMSP ≤ €40,000,
        // tapered down to €0 at €50,000 OMSP. Applies to pure battery-electric vehicles.
        // https://www.revenue.ie/en/importing-and-exporting/vehicle-registration-tax/
        evRelief: {
          maxAmount: 5000,
          fullUpToOmsp: 40000, // full €5,000 relief below this OMSP
          zeroAtOmsp: 50000, // no relief at/above this OMSP
          untilYear: 2026, // registrations before 31 Dec 2026
        },

        // ── NEDC → WLTP uplift ──
        // Pre-2018 cars often quote NEDC CO2; VRT & motor-tax bands use WLTP-equivalent.
        // Diesel: NEDC×1.1405+12.858   Non-diesel: NEDC×0.9227+34.554
        nedcToWltp: {
          diesel: { slope: 1.1405, intercept: 12.858 },
          other: { slope: 0.9227, intercept: 34.554 },
        },

        // ── NOx levy (tiered, since 1 Jan 2021) ──
        // Revenue charges per mg/km of NOx in tiers with NO upper cap:
        //   first 40 mg/km → €5/mg, next 40 (40–80) → €15/mg, above 80 → €25/mg.
        nox: {
          tiers: [
            { maxMg: 40, rate: 5 },
            { maxMg: 80, rate: 15 },
            { maxMg: Infinity, rate: 25 },
          ],
          // Default charge where no satisfactory NOx evidence is provided.
          defaultNoEvidenceDiesel: 4850,
          defaultNoEvidenceOther: 600,
        },

        // ── Fixed one-time fees ──
        fees: {
          registration: 125, // vehicle registration fee € ⚠️ unverified estimate
          nct: 60, // National Car Test fee € (VERIFIED; required from 4 years old)
        },

        // ── Shipping estimate from GB/NI to Ireland (editable in UI) ⚠️ ──
        // Stena "from €179" car & driver single; realistic range €180–€350.
        defaultShippingEUR: 300,

        // ── Annual motor tax (approx.) by CO2 band for cars registered 2021+ ──
        // VERIFIED Revenue table (WLTP-based).
        // Motor tax is an ongoing annual cost, NOT part of the one-time import cost.
        motorTaxRates: [
          { maxCO2: 0, name: "A0 (0g)", rate: 120 },
          { maxCO2: 50, name: "A1 (1–50g)", rate: 140 },
          { maxCO2: 80, name: "A2 (51–80g)", rate: 150 },
          { maxCO2: 90, name: "A3 (81–90g)", rate: 160 },
          { maxCO2: 100, name: "A4 (91–100g)", rate: 170 },
          { maxCO2: 110, name: "A5 (101–110g)", rate: 180 },
          { maxCO2: 120, name: "A6 (111–120g)", rate: 190 },
          { maxCO2: 130, name: "B1 (121–130g)", rate: 200 },
          { maxCO2: 140, name: "B2 (131–140g)", rate: 210 },
          { maxCO2: 150, name: "C1 (141–150g)", rate: 270 },
          { maxCO2: 160, name: "C2 (151–160g)", rate: 280 },
          { maxCO2: 170, name: "D (161–170g)", rate: 420 },
          { maxCO2: 190, name: "E (171–190g)", rate: 600 },
          { maxCO2: 200, name: "F1 (191–200g)", rate: 790 },
          { maxCO2: 225, name: "F2 (201–225g)", rate: 1250 },
          { maxCO2: Infinity, name: "G (226g+)", rate: 2400 },
        ],
      };

    })(module);
    return module.exports;
  }
  var taxConfig = loadConfig();

  function loadCalculator() {
    var module = { exports: {} };
    var require = function (name) {
      if (name === "./tax-config") return taxConfig;
      throw new Error("Cannot require " + name);
    };
    (function (module, require) {
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

    })(module, require);
    return module.exports;
  }
  var calculator = loadCalculator();

  global.CarCalc = calculator;
})(typeof window !== "undefined" ? window : this);
