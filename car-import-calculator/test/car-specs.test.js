"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const specs = require("../src/car-specs.js");

test("MAKES is sorted and includes common brands", () => {
  assert.ok(specs.MAKES.length > 20);
  assert.ok(specs.MAKES.includes("Volkswagen"));
  assert.ok(specs.MAKES.includes("BMW"));
  assert.ok(specs.MAKES.includes("Toyota"));
  assert.ok(specs.MAKES.includes("Tesla"));
  assert.deepEqual(specs.MAKES, specs.MAKES.slice().sort());
});

test("matchMake resolves aliases", () => {
  assert.equal(specs.matchMake("vw"), "Volkswagen");
  assert.equal(specs.matchMake("VW"), "Volkswagen");
  assert.equal(specs.matchMake("mercedes"), "Mercedes-Benz");
  assert.equal(specs.matchMake("land rover"), "Land Rover");
  assert.equal(specs.matchMake("TOTALLY UNKNOWN BRAND"), null);
});

test("matchModel is tolerant of trim suffixes", () => {
  assert.equal(specs.matchModel("Volkswagen", "Golf GTI"), "Golf");
  assert.equal(specs.matchModel("BMW", "1 Series M Sport"), "1 Series");
  assert.equal(specs.matchModel("Toyota", "Corolla Hybrid"), "Corolla");
  assert.equal(specs.matchModel("Ford", "Focus ST-Line"), "Focus");
});

test("modelsFor returns sorted model list", () => {
  const models = specs.modelsFor("VW");
  assert.ok(models.includes("Golf"));
  assert.deepEqual(models, models.slice().sort());
});

test("lookup returns WLTP CO2 for a modern Golf", () => {
  const r = specs.lookup("Volkswagen", "Golf", 2021);
  assert.ok(r);
  assert.equal(r.make, "Volkswagen");
  assert.equal(r.model, "Golf");
  assert.equal(r.co2Standard, "wltp");
  assert.ok(r.co2 > 80 && r.co2 < 150);
  assert.equal(r.fuelType, "petrol");
  assert.ok(r.nox > 0);
});

test("lookup returns NEDC CO2 for a pre-2018 car", () => {
  const r = specs.lookup("Ford", "Focus", 2012);
  assert.ok(r);
  assert.equal(r.co2Standard, "nedc");
  assert.ok(r.co2 > 110 && r.co2 < 150);
});

test("EV lookup returns zero CO2", () => {
  const r = specs.lookup("Tesla", "Model 3", 2021);
  assert.ok(r);
  assert.equal(r.co2, 0);
  assert.equal(r.fuelType, "electric");
  assert.equal(r.nox, 0);
});

test("hybrid lookup prefers hybrid figure", () => {
  const r = specs.lookup("Toyota", "Corolla", 2021);
  assert.ok(r);
  assert.equal(r.fuelType, "hybrid");
  assert.ok(r.co2 > 0 && r.co2 < 130);
});

test("diesel override picks diesel figure", () => {
  const r = specs.lookup("VW", "Golf", 2019, "diesel");
  assert.ok(r);
  assert.equal(r.fuelType, "diesel");
  assert.ok(r.co2 > 90 && r.co2 < 130);
});

test("unknown make returns null", () => {
  assert.equal(specs.lookup("FakeBrand", "FakeModel", 2020), null);
});

test("year before earliest range clamps to earliest", () => {
  const r = specs.lookup("Tesla", "Model 3", 2000);
  assert.ok(r);
  assert.equal(r.co2, 0);
});

test("year after latest range clamps to latest", () => {
  const r = specs.lookup("Ford", "Fiesta", 2030);
  assert.ok(r);
  assert.ok(r.co2 > 50 && r.co2 < 150);
});

test("defaultFuel works for known models", () => {
  assert.equal(specs.defaultFuel("Tesla", "Model Y", 2022), "electric");
  assert.equal(specs.defaultFuel("Toyota", "Corolla", 2021), "hybrid");
  assert.equal(specs.defaultFuel("Ford", "Focus", 2016), "petrol");
  assert.equal(specs.defaultFuel("Nissan", "Qashqai", 2016), "diesel");
});

test("normalizeFuel", () => {
  assert.equal(specs.normalizeFuel("EV"), "electric");
  assert.equal(specs.normalizeFuel("Diesel"), "diesel");
  assert.equal(specs.normalizeFuel("PHEV"), "hybrid");
  assert.equal(specs.normalizeFuel("Petrol"), "petrol");
  assert.equal(specs.normalizeFuel(null), null);
});
