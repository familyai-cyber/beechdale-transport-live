/**
 * Calculator engine tests (node:assert, no framework).
 * Run: node test/calculator.test.js
 */

const assert = require("assert");
const { calculate, vrtRateFor, noxCharge, importVatApplies } = require("../src/calculator");

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

// ── VRT rate bands ──────────────────────────────────────────────────
check("VRT 0 g/km (electric) = 14%", () => assert.strictEqual(vrtRateFor(0), 0.14));
check("VRT 80 g/km = 14%", () => assert.strictEqual(vrtRateFor(80), 0.14));
check("VRT 81 g/km = 15%", () => assert.strictEqual(vrtRateFor(81), 0.15));
check("VRT 120 g/km = 17%", () => assert.strictEqual(vrtRateFor(120), 0.17));
check("VRT 190 g/km = 26%", () => assert.strictEqual(vrtRateFor(190), 0.26));
check("VRT 201+ g/km = 30%", () => assert.strictEqual(vrtRateFor(250), 0.30));

// ── NOx levy (tiered €5/€15/€25, no cap, since 1 Jan 2021) ──────────
check("NOx 0 mg/km = €0", () => assert.strictEqual(noxCharge(0), 0));
check("NOx 40 mg/km = 40×€5 = €200", () => assert.strictEqual(noxCharge(40), 200));
check("NOx 90 mg/km = 40×5+40×15+10×25 = €1,050", () => assert.strictEqual(noxCharge(90), 1050));
check("NOx 100 mg/km = €1,300", () => assert.strictEqual(noxCharge(100), 1300));
check("NOx 150 mg/km = €2,550", () => assert.strictEqual(noxCharge(150), 2550));
check("NOx no cap: 2000 mg/km = €48,800", () => assert.strictEqual(noxCharge(2000), 48800));

// ── VAT applicability ───────────────────────────────────────────────
check("GB 2022 car → VAT applies", () => assert.strictEqual(importVatApplies("GB", 2022), true));
check("GB 2020 car → no VAT", () => assert.strictEqual(importVatApplies("GB", 2020), false));
check("GB unknown year → VAT assumed", () => assert.strictEqual(importVatApplies("GB", undefined), true));
check("NI car → never VAT", () => assert.strictEqual(importVatApplies("NI", 2023), false));

// ── Full scenario: GB 2022 car, private buyer ───────────────────────
{
  const r = calculate({
    origin: "GB",
    buyerType: "private",
    ukPriceGBP: 20000,
    co2: 120,
    nox: 40,
    firstRegYear: 2022,
    shippingEUR: 1200,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("GB: price → €23,260", () => assert.strictEqual(b.carPriceEUR, 23260));
  check("GB: duty = 10% of (price+shipping) = €2,446", () => assert.strictEqual(b.duty, 2446));
  check("GB: import VAT = 23% of CIF+duty = €6,188.38", () => assert.strictEqual(b.vat, 6188.38));
  check("GB: OMSP = €26,906", () => assert.strictEqual(b.omsp, 26906));
  check("GB: NOx 40mg = €200", () => assert.strictEqual(b.noxLevy, 200));
  check("GB: VRT = 17% × OMSP + NOx = €4,774.02", () => assert.strictEqual(b.vrt, 4774.02));
  check("GB: total = €38,048.40", () => assert.strictEqual(r.total, 38048.4));
}

// ── Full scenario: NI car, private buyer ────────────────────────────
{
  const r = calculate({
    origin: "NI",
    buyerType: "private",
    ukPriceGBP: 20000,
    co2: 120,
    nox: 40,
    firstRegYear: 2022,
    shippingEUR: 1200,
    fxRate: FX,
  });
  const b = r.breakdown;
  check("NI: no customs duty", () => assert.strictEqual(b.duty, 0));
  check("NI: no import VAT", () => assert.strictEqual(b.vat, 0));
  check("NI: OMSP = €24,460", () => assert.strictEqual(b.omsp, 24460));
  check("NI: VRT = 17% × OMSP + NOx = €4,358.20", () => assert.strictEqual(b.vrt, 4358.2));
  check("NI: total = €28,998.20", () => assert.strictEqual(r.total, 28998.2));
  check("NI cheaper than GB by €9,050.20", () => assert.strictEqual(Math.round(r.total * 100) / 100, Math.round((38048.4 - 9050.2) * 100) / 100));
}

// ── GB pre-2021 car: no import VAT ──────────────────────────────────
{
  const r = calculate({
    origin: "GB",
    buyerType: "private",
    ukPriceGBP: 20000,
    co2: 120,
    firstRegYear: 2020,
    shippingEUR: 1200,
    fxRate: FX,
  });
  check("GB 2020: no import VAT", () => assert.strictEqual(r.breakdown.vat, 0));
  check("GB 2020: total = €31,660.02", () => assert.strictEqual(r.total, 31660.02));
}

// ── VAT-registered dealer buyer ─────────────────────────────────────
{
  const r = calculate({
    origin: "GB",
    buyerType: "vat-dealer",
    ukPriceGBP: 20000,
    co2: 120,
    firstRegYear: 2022,
    shippingEUR: 1200,
    fxRate: FX,
  });
  check("Dealer: VAT is reclaimable", () => assert.strictEqual(r.breakdown.vatReclaimable, true));
  check("Dealer: VAT excluded from total", () => assert.strictEqual(r.total, 31660.02));
  check("Dealer: grand total incl. VAT shown", () => assert.strictEqual(r.grandTotalInclVat, 37848.4));
}

// ── NOx charge in full calc ─────────────────────────────────────────
{
  const r = calculate({
    origin: "NI",
    buyerType: "private",
    ukPriceGBP: 10000,
    co2: 180,
    nox: 150,
    firstRegYear: 2022,
    shippingEUR: 1200,
    fxRate: FX,
  });
  const expectedNox = 40 * 5 + 40 * 15 + (150 - 80) * 25; // 2550
  check("NOx charge €2,550 included in VRT", () => assert.strictEqual(r.breakdown.noxLevy, expectedNox));
  check("VRT = OMSP×26% + NOx", () => {
    const omsp = 10000 * FX + 1200; // 12830
    assert.strictEqual(r.breakdown.vrt, Math.round((omsp * 0.26 + expectedNox) * 100) / 100);
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
