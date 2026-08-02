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
