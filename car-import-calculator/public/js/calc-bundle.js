/**
 * calc-bundle.js — AUTO-GENERATED from src/tax-config.js, src/calculator.js
 * and src/listing-parser.js. Do not edit directly; regenerate with:
 *   node scripts/build-browser.js
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

  function loadListingParser() {
    var module = { exports: {} };
    var require = function (name) {
      if (name === "./tax-config") return taxConfig;
      throw new Error("Cannot require " + name);
    };
    (function (module, require) {
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
          if (price != null) return { price, currency: jsonLdValue(o.priceCurrency) };
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
          const p = parsePrice(cleanTitle) || parsePrice(visible.slice(0, 20000));
          if (p) {
            found.price = p.amount;
            found.currency = p.currency;
            sources.push('text-price');
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

    })(module, require);
    return module.exports;
  }
  var listingParser = loadListingParser();

  global.CarCalc = calculator;
  global.CarListingParser = listingParser;
})(typeof window !== "undefined" ? window : this);
