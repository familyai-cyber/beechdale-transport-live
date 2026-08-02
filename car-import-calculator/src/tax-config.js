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
  vatRate: 0.23,
  // GB cars first registered ON/AFTER 1 Jan 2021 attract Irish import VAT.
  // Cars registered BEFORE 1 Jan 2021 (and all NI cars) do not.
  vatCutoffYear: 2021,
  vatCutoffDate: "2021-01-01",

  // ── VRT rates (% of OMSP) by CO2 emissions band (current table) ──
  // https://www.revenue.ie/en/importing-and-exporting/vehicle-registration-tax/
  vrtRates: [
    { maxCO2: 80, rate: 0.14 }, // 0–80 g/km (incl. pure electric at 0)
    { maxCO2: 100, rate: 0.15 }, // 81–100
    { maxCO2: 110, rate: 0.16 }, // 101–110
    { maxCO2: 120, rate: 0.17 }, // 111–120
    { maxCO2: 130, rate: 0.18 }, // 121–130
    { maxCO2: 140, rate: 0.19 }, // 131–140
    { maxCO2: 150, rate: 0.20 }, // 141–150
    { maxCO2: 155, rate: 0.21 }, // 151–155
    { maxCO2: 170, rate: 0.23 }, // 156–170
    { maxCO2: 190, rate: 0.26 }, // 171–190
    { maxCO2: 200, rate: 0.29 }, // 191–200
    { maxCO2: Infinity, rate: 0.30 }, // 201+
  ],

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
    registration: 125, // vehicle registration fee €
    nct: 55, // National Car Test fee € ⚠️ approximate
  },

  // ── Shipping estimate from GB/NI to Ireland (editable in UI) ⚠️ ──
  defaultShippingEUR: 1200,

  // ── Annual motor tax (approx.) by CO2 band for cars registered 2021+ ⚠️
  // Motor tax is an ongoing annual cost, NOT part of the one-time import cost.
  motorTaxRates: [
    { maxCO2: 0, name: "Electric", rate: 120 },
    { maxCO2: 80, name: "A (0–80g)", rate: 170 },
    { maxCO2: 100, name: "B (81–100g)", rate: 200 },
    { maxCO2: 110, name: "C (101–110g)", rate: 270 },
    { maxCO2: 120, name: "D (111–120g)", rate: 330 },
    { maxCO2: 130, name: "E (121–130g)", rate: 390 },
    { maxCO2: 140, name: "F (131–140g)", rate: 460 },
    { maxCO2: 155, name: "G (141–155g)", rate: 570 },
    { maxCO2: 170, name: "H (156–170g)", rate: 660 },
    { maxCO2: 190, name: "I (171–190g)", rate: 790 },
    { maxCO2: 200, name: "J (191–200g)", rate: 880 },
    { maxCO2: Infinity, name: "K (201g+)", rate: 1200 },
  ],
};
