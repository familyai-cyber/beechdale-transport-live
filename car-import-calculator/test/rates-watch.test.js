/**
 * Rate-watcher snapshot test.
 *
 * Locks the currently-verified tax rates so that if anyone edits tax-config.js
 * (duty, VAT, VRT bands, EV relief, NOx, fees) this test fails loudly. When
 * Revenue/Citizens Information actually changes a rate, update THIS snapshot
 * by hand after double-checking the new figure — the mismatch is the signal
 * that a human review happened.
 *
 * Run: node test/rates-watch.test.js
 */
const assert = require("node:assert");
const { test } = require("node:test");
const tax = require("../src/tax-config.js");

test("rate-watcher: customs duty snapshot (GB 10%, NI 0%)", () => {
  assert.strictEqual(tax.customsDutyRate.GB, 0.10, "GB duty drifted");
  assert.strictEqual(tax.customsDutyRate.NI, 0.00, "NI duty drifted");
});

test("rate-watcher: import VAT snapshot (23% GB only)", () => {
  assert.strictEqual(tax.vatRate, 0.23, "VAT rate drifted");
});

test("rate-watcher: VRT 20 CO2 bands 7%–41%", () => {
  assert.strictEqual(tax.vrtRates.length, 20, "VRT band count changed");
  assert.strictEqual(tax.vrtRates[0].rate, 0.07, "lowest VRT band drifted");
  const last = tax.vrtRates[tax.vrtRates.length - 1];
  assert.strictEqual(last.rate, 0.41, "top VRT band drifted");
  assert.strictEqual(last.maxCO2, Infinity);
});

test("rate-watcher: EV VRT relief €5,000 to 31 Dec 2026", () => {
  assert.strictEqual(tax.evRelief.maxAmount, 5000, "EV relief amount drifted");
  assert.strictEqual(tax.evRelief.fullUpToOmsp, 40000);
  assert.strictEqual(tax.evRelief.zeroAtOmsp, 50000);
  assert.strictEqual(tax.evRelief.untilYear, 2026, "EV relief expiry year drifted");
});

test("rate-watcher: NOx tiered levy €5/€15/€25", () => {
  const tiers = tax.nox.tiers;
  assert.strictEqual(tiers.length, 3);
  assert.strictEqual(tiers[0].rate, 5);
  assert.strictEqual(tiers[1].rate, 15);
  assert.strictEqual(tiers[2].rate, 25);
  assert.strictEqual(tax.nox.defaultNoEvidenceDiesel, 4850);
  assert.strictEqual(tax.nox.defaultNoEvidenceOther, 600);
});

test("rate-watcher: fixed fees snapshot", () => {
  assert.strictEqual(tax.fees.registration, 125, "registration fee drifted");
  assert.strictEqual(tax.fees.nct, 60, "NCT fee drifted");
  assert.strictEqual(tax.defaultShippingEUR, 300);
});

test("rate-watcher: fallback FX snapshot", () => {
  assert.strictEqual(tax.fallbackFx.EUR_PER_GBP, 1.163, "fallback FX drifted");
});
