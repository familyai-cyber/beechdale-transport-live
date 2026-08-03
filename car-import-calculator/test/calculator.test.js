/**
 * Calculator engine tests (node:assert, no framework).
 * Run: node test/calculator.test.js
 *
 * Rates verified against Revenue.ie / completecar.ie (2025/2026):
 *  - VRT Category A: 7%–41%, 20 bands, from 1 Jan 2022 (with band minimums where OMSP <= €2,000)
 *  - Import VAT: 23% on ALL GB cars regardless of age; NI never (with NI-used-status proof)
 *  - NOx levy: tiered €5/€15/€25 per mg, no cap
 *  - EV VRT relief: €5,000 (OMSP <= €40k, taper to €50k, regs before 31 Dec 2026)
 *  - NCT first test: €60; registration fee: €125; default shipping: €300
 *  - Motor tax (2021+): A0 €120 ... G €2,400
 */

const assert = require("assert");
const {
  calculate,
  vrtRateFor,
  noxCharge,
  importVatApplies,
  motorTaxBandFor,
  wltpCo2,
  evReliefFor,
} = require("../src/calculator");

const FX = 1.163; // fixed rate so tests are deterministic
let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✘ ${name}\n    ${err.message}`);
  }
}

// ── VRT rate bands (2022+: 7%–41%) ──────────────────────────────────
check("VRT 0 g/km (electric) = 7%", () => assert.strictEqual(vrtRateFor(0), 0.07));
check("VRT 50 g/km = 7%", () => assert.strictEqual(vrtRateFor(50), 0.07));
check("VRT 80 g/km = 9%", () => assert.strictEqual(vrtRateFor(80), 0.09));
check("VRT 81 g/km = 9.75%", () => assert.strictEqual(vrtRateFor(81), 0.0975));
check("VRT 120 g/km = 16%", () => assert.strictEqual(vrtRateFor(120), 0.16));
check("VRT 170 g/km = 30%", () => assert.strictEqual(vrtRateFor(170), 0.30));
check("VRT 190 g/km = 35%", () => assert.strictEqual(vrtRateFor(190), 0.35));
check("VRT 191+ g/km = 41%", () => assert.strictEqual(vrtRateFor(250), 0.41));

// ── NOx levy (tiered €5/€15/€25, no cap, since 1 Jan 2021) ──────────
check("NOx 0 mg/km = €0", () => assert.strictEqual(noxCharge(0), 0));
check("NOx 40 mg/km = 40×€5 = €200", () => assert.strictEqual(noxCharge(40), 200));
check("NOx 90 mg/km = 40×5+40×15+10×25 = €1,050", () => assert.strictEqual(noxCharge(90), 1050));
check("NOx 100 mg/km = €1,300", () => assert.strictEqual(noxCharge(100), 1300));
check("NOx 150 mg/km = €2,550", () => assert.strictEqual(noxCharge(150), 2550));
check("NOx no cap: 2000 mg/km = €48,800", () => assert.strictEqual(noxCharge(2000), 48800));

// ── VAT applicability (GB ALWAYS pays, NI never) ────────────────────
check("GB 2022 car → VAT applies", () => assert.strictEqual(importVatApplies("GB", 2022), true));
check("GB 2020 car → VAT STILL applies (all GB cars)", () => assert.strictEqual(importVatApplies("GB", 2020), true));
check("GB unknown year → VAT applies", () => assert.strictEqual(importVatApplies("GB", undefined), true));
check("NI car → never VAT", () => assert.strictEqual(importVatApplies("NI", 2023), false));
check("NI pre-2021 car → never VAT", () => assert.strictEqual(importVatApplies("NI", 2000), false));

// ── NEDC → WLTP uplift ──────────────────────────────────────────────
check("NEDC petrol 120 → 145 g/km", () => assert.strictEqual(wltpCo2(120, "nedc", "petrol"), 145));
check("NEDC diesel 120 → 150 g/km", () => assert.strictEqual(wltpCo2(120, "nedc", "diesel"), 150));
check("WLTP value passes through unchanged", () => assert.strictEqual(wltpCo2(120, "wltp", "petrol"), 120));

// ── EV VRT relief ───────────────────────────────────────────────────
check("EV relief: OMSP €30k 2024 → full €5,000", () => assert.strictEqual(evReliefFor(30000, 2024), 5000));
check("EV relief: OMSP €45k → tapered", () => assert.ok(evReliefFor(45000, 2024) > 0 && evReliefFor(45000, 2024) < 5000));
check("EV relief: OMSP €60k → none", () => assert.strictEqual(evReliefFor(60000, 2024), 0));
check("EV relief: reg 2027 → none", () => assert.strictEqual(evReliefFor(30000, 2027), 0));
check("EV relief: non-electric → none", () => {
  const r = calculate({ origin: "NI", buyerType: "private", ukPriceGBP: 20000, co2: 120, firstRegYear: 2024, shippingEUR: 300, fxRate: FX, fuelType: "petrol" });
  assert.strictEqual(r.breakdown.evRelief, 0);
});

// ── Motor tax bands (2021+) ─────────────────────────────────────────
check("Motor tax 0 g → A0 €120", () => assert.strictEqual(motorTaxBandFor(0).rate, 120));
check("Motor tax 120 g → A6 €190", () => assert.strictEqual(motorTaxBandFor(120).rate, 190));
check("Motor tax 160 g → C2 €280", () => assert.strictEqual(motorTaxBandFor(160).rate, 280));
check("Motor tax 180 g → E €600", () => assert.strictEqual(motorTaxBandFor(180).rate, 600));
check("Motor tax 250 g → G €2,400", () => assert.strictEqual(motorTaxBandFor(250).rate, 2400));

// ── Full scenario: GB 2022 car, private buyer ───────────────────────
{
  const r = calculate({
    origin: "GB",
    buyerType: "private",
    ukPriceGBP: 20000,
    co2: 120,
    nox: 40,
    firstRegYear: 2022,
    shippingEUR: 300,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("GB: price → €23,260", () => assert.strictEqual(b.carPriceEUR, 23260));
  check("GB: duty = 10% of (price+shipping) = €2,356", () => assert.strictEqual(b.duty, 2356));
  check("GB: VAT applies", () => assert.strictEqual(b.vatApplies, true));
  check("GB: VAT = 23% of (price+shipping+duty) = €5,960.68", () => assert.strictEqual(b.vat, 5960.68));
  check("GB: OMSP = price+shipping+duty = €25,916", () => assert.strictEqual(b.omsp, 25916));
  check("GB: VRT rate 16%, band 116–120g", () => assert.strictEqual(b.vrtRate, 0.16));
  check("GB: NOx 40 mg → €200", () => assert.strictEqual(b.noxLevy, 200));
  check("GB: VRT = 25,916×16% + 200 = €4,346.56", () => assert.strictEqual(b.vrt, 4346.56));
  check("GB: registration €125 + NCT €60", () => assert.strictEqual(b.registrationFee + b.nctFee, 185));
  check("GB: annual motor tax €190 (A6)", () => assert.strictEqual(b.annualMotorTax, 190));
  check("GB: grand total = €36,408.24", () => assert.strictEqual(r.total, 36408.24));
}

// ── Full scenario: NI 2022 car, private buyer ───────────────────────
{
  const r = calculate({
    origin: "NI",
    buyerType: "private",
    ukPriceGBP: 20000,
    co2: 120,
    nox: 40,
    firstRegYear: 2022,
    shippingEUR: 300,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("NI: no duty", () => assert.strictEqual(b.duty, 0));
  check("NI: no import VAT", () => assert.strictEqual(b.vat, 0));
  check("NI: OMSP = €23,560", () => assert.strictEqual(b.omsp, 23560));
  check("NI: VRT = 23,560×16% + 200 = €3,969.60", () => assert.strictEqual(b.vrt, 3969.6));
  check("NI: grand total = €27,714.60", () => assert.strictEqual(r.total, 27714.6));
}

// ── GB pre-2021 (2020) now ALSO pays VAT ────────────────────────────
{
  const r = calculate({
    origin: "GB",
    buyerType: "private",
    ukPriceGBP: 20000,
    co2: 120,
    firstRegYear: 2020,
    shippingEUR: 300,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("GB 2020: VAT applies (no age exemption)", () => assert.strictEqual(b.vatApplies, true));
  check("GB 2020: VAT = €5,960.68", () => assert.strictEqual(b.vat, 5960.68));
  check("GB 2020: total = €36,208.24", () => assert.strictEqual(r.total, 36208.24));
}

// ── GB 2022, VAT-registered dealer (VAT excluded from total) ────────
{
  const r = calculate({
    origin: "GB",
    buyerType: "vat-dealer",
    ukPriceGBP: 20000,
    co2: 120,
    firstRegYear: 2022,
    shippingEUR: 300,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("Dealer: VAT is reclaimable", () => assert.strictEqual(b.vatReclaimable, true));
  check("Dealer: net total = €30,247.56", () => assert.strictEqual(r.total, 30247.56));
  check("Dealer: grand total incl VAT = €36,208.24", () => assert.strictEqual(r.grandTotalInclVat, 36208.24));
}

// ── NI high-NOx scenario ────────────────────────────────────────────
{
  const r = calculate({
    origin: "NI",
    buyerType: "private",
    ukPriceGBP: 10000,
    co2: 180,
    nox: 150,
    firstRegYear: 2022,
    shippingEUR: 300,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("NI high-NOx: NOx = €2,550", () => assert.strictEqual(b.noxLevy, 2550));
  check("NI high-NOx: VRT = €6,725.50", () => assert.strictEqual(b.vrt, 6725.5));
  check("NI high-NOx: total = €18,840.50", () => assert.strictEqual(r.total, 18840.5));
}

// ── Default shipping now €300 (ferry from €179) ─────────────────────
{
  const r = calculate({ origin: "NI", buyerType: "private", ukPriceGBP: 20000, co2: 120, firstRegYear: 2022, fxRate: FX });
  check("Default shipping = €300", () => assert.strictEqual(r.breakdown.shippingEUR, 300));
}

// ── EV with relief ──────────────────────────────────────────────────
{
  const r = calculate({
    origin: "NI",
    buyerType: "private",
    ukPriceGBP: 25000,
    co2: 0,
    nox: 0,
    firstRegYear: 2024,
    fuelType: "electric",
    shippingEUR: 300,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("EV: relief €5,000 applied", () => assert.strictEqual(b.evRelief, 5000));
  check("EV: VRT floor at €0", () => assert.strictEqual(b.vrt, 0));
  check("EV: total = €29,560.00", () => assert.strictEqual(r.total, 29560));
}

// ── VRT band minimums (low OMSP ≤ €2,000) ───────────────────────────
{
  const r = calculate({ origin: "NI", buyerType: "private", ukPriceGBP: 500, co2: 120, firstRegYear: 2022, shippingEUR: 300, fxRate: FX });
  const b = r.breakdown;
  check("Low OMSP (€881.50): VRT = band min €320", () => assert.strictEqual(b.vrt, 320));
}

// ── NEDC input flows through to higher VRT band ─────────────────────
{
  const r = calculate({
    origin: "NI",
    buyerType: "private",
    ukPriceGBP: 20000,
    co2: 120,
    firstRegYear: 2022,
    co2Standard: "nedc",
    fuelType: "petrol",
    shippingEUR: 300,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("NEDC 120 → WLTP 145 → band 21.5%", () => assert.strictEqual(b.co2, 145));
  check("NEDC-flow VRT = OMSP×21.5% + NOx", () => assert.strictEqual(b.vrt, Math.round(23560 * 0.215 * 100) / 100));
}

// ── Summary ─────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
