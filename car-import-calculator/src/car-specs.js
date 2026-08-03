/**
 * car-specs.js — a compact knowledge base of TYPICAL car specifications for
 * the most common UK-used cars imported to Ireland.
 *
 * Purpose: when a listing link only gives make/model/year (or the user picks
 * a make, model and year), we can auto-fill CO2, fuel type, CO2 test standard
 * and a typical NOx figure — so the import estimate is accurate without the
 * user hunting for V5C figures.
 *
 * IMPORTANT: all CO2/NOx values are TYPICAL figures for the model & era
 * (combined test-cycle values), not exact per-VIN numbers. The UI must say so.
 *
 * Data model (kept compact):
 *   SPECS = {
 *     "Volkswagen": {
 *       "Golf": {                                   // model key
 *         fuel: "petrol",                           // typical fuel for this model
 *         ranges: [
 *           { from: 2009, to: 2012, petrol: 145, diesel: 123, standard: "nedc" },
 *           { from: 2018, to: 2026, petrol: 112, diesel: 104, hybrid: 100, standard: "wltp" }
 *         ]
 *       }
 *     }
 *   }
 * Range fields: petrol / diesel / hybrid / electric (g/km). `standard` is the
 * test cycle the quoted figures use ("nedc" | "wltp"). Ranges without a
 * `standard` default to "nedc" for years < 2018 and "wltp" from 2018.
 * A model with only an `electric` field is a pure EV (CO2 = 0).
 *
 * NOx: a typical figure is derived per era & fuel unless a range overrides it
 * via `noxDiesel` / `noxPetrol` / `noxHybrid`.
 */

"use strict";

// ── Typical NOx (mg/km) by era & fuel — used unless a range overrides ──
const DEFAULT_NOX = {
  nedc: { petrol: 42, diesel: 165, hybrid: 42 },
  wltp: { petrol: 20, diesel: 52, hybrid: 20 },
};

const SPECS = {
  Vauxhall: {
    Corsa: {
      fuel: "petrol",
      ranges: [
        { from: 2008, to: 2014, petrol: 130, diesel: 115, standard: "nedc" },
        { from: 2015, to: 2019, petrol: 117, diesel: 92, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 118, diesel: 105, standard: "wltp" },
      ],
    },
    "Corsa-e": {
      fuel: "electric",
      ranges: [{ from: 2020, to: 2026, electric: 0, standard: "wltp" }],
    },
    Astra: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2015, petrol: 138, diesel: 106, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 126, diesel: 97, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 125, diesel: 110, standard: "wltp" },
      ],
    },
    Mokka: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2019, petrol: 135, diesel: 114, standard: "nedc" },
        { from: 2021, to: 2026, petrol: 130, diesel: 120, standard: "wltp" },
      ],
    },
    Insignia: {
      fuel: "petrol",
      ranges: [
        { from: 2009, to: 2017, petrol: 160, diesel: 124, standard: "nedc" },
        { from: 2018, to: 2022, petrol: 138, diesel: 118, standard: "wltp" },
      ],
    },
    Grandland: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2023, petrol: 131, diesel: 122, standard: "wltp" },
      ],
    },
    "Mokka-e": {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    Zafira: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2013, petrol: 165, diesel: 135, standard: "nedc" },
        { from: 2014, to: 2018, petrol: 145, diesel: 115, standard: "nedc" },
      ],
    },
    Viva: {
      fuel: "petrol",
      ranges: [{ from: 2015, to: 2019, petrol: 104, standard: "wltp" }],
    },
    Adam: {
      fuel: "petrol",
      ranges: [{ from: 2013, to: 2019, petrol: 107, standard: "nedc" }],
    },
    Cascada: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2017, petrol: 154, diesel: 119, standard: "nedc" },
        { from: 2018, to: 2019, petrol: 152, standard: "wltp" },
      ],
    },
    Vivaro: {
      fuel: "diesel",
      ranges: [{ from: 2014, to: 2019, diesel: 149, standard: "nedc" }],
    },
    "Grandland Electric": {
      fuel: "electric",
      ranges: [{ from: 2024, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Astra Electric": {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Frontera Electric": {
      fuel: "electric",
      ranges: [{ from: 2025, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Ford: {
    Fiesta: {
      fuel: "petrol",
      ranges: [
        { from: 2008, to: 2012, petrol: 118, diesel: 98, standard: "nedc" },
        { from: 2013, to: 2017, petrol: 104, diesel: 89, standard: "nedc" },
        { from: 2018, to: 2023, petrol: 102, diesel: 99, standard: "wltp" },
      ],
    },
    Focus: {
      fuel: "petrol",
      ranges: [
        { from: 2009, to: 2015, petrol: 129, diesel: 104, standard: "nedc" },
        { from: 2016, to: 2018, petrol: 124, diesel: 95, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 122, diesel: 108, standard: "wltp" },
      ],
    },
    Kuga: {
      fuel: "diesel",
      ranges: [
        { from: 2009, to: 2012, petrol: 169, diesel: 149, standard: "nedc" },
        { from: 2013, to: 2019, petrol: 142, diesel: 115, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 128, diesel: 125, hybrid: 30, standard: "wltp" },
      ],
    },
    Puma: {
      fuel: "petrol",
      ranges: [{ from: 2020, to: 2026, petrol: 120, standard: "wltp" }],
    },
    Mondeo: {
      fuel: "diesel",
      ranges: [
        { from: 2008, to: 2014, petrol: 169, diesel: 134, standard: "nedc" },
        { from: 2015, to: 2019, petrol: 129, diesel: 104, standard: "nedc" },
      ],
    },
    Mustang: {
      fuel: "petrol",
      ranges: [{ from: 2016, to: 2022, petrol: 249, standard: "wltp" }],
    },
    "Mustang GT": {
      fuel: "petrol",
      ranges: [
        { from: 2016, to: 2018, petrol: 269, standard: "wltp" },
        { from: 2019, to: 2022, petrol: 263, standard: "wltp" },
      ],
    },
    "Mustang Mach-E": {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Focus RS": {
      fuel: "petrol",
      ranges: [{ from: 2016, to: 2018, petrol: 175, standard: "nedc" }],
    },
    "Fiesta ST": {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2017, petrol: 138, standard: "nedc" },
        { from: 2018, to: 2022, petrol: 128, standard: "wltp" },
      ],
    },
    Ranger: {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2019, petrol: 260, diesel: 194, standard: "nedc" },
        { from: 2020, to: 2023, diesel: 203, standard: "wltp" },
      ],
    },
    Edge: {
      fuel: "diesel",
      ranges: [{ from: 2016, to: 2021, petrol: 240, diesel: 144, standard: "wltp" }],
    },
    Galaxy: {
      fuel: "diesel",
      ranges: [
        { from: 2010, to: 2015, petrol: 219, diesel: 159, standard: "nedc" },
        { from: 2016, to: 2023, diesel: 129, standard: "wltp" },
      ],
    },
    "S-Max": {
      fuel: "diesel",
      ranges: [
        { from: 2010, to: 2015, petrol: 219, diesel: 149, standard: "nedc" },
        { from: 2016, to: 2023, diesel: 129, standard: "wltp" },
      ],
    },
    "C-Max": {
      fuel: "petrol",
      ranges: [{ from: 2011, to: 2019, petrol: 139, diesel: 99, standard: "nedc" }],
    },
    Ka: {
      fuel: "petrol",
      ranges: [{ from: 2009, to: 2016, petrol: 118, standard: "nedc" }],
    },
  },

  Volkswagen: {
    Golf: {
      fuel: "petrol",
      ranges: [
        { from: 2009, to: 2012, petrol: 145, diesel: 123, standard: "nedc" },
        { from: 2013, to: 2016, petrol: 118, diesel: 106, standard: "nedc" },
        { from: 2017, to: 2019, petrol: 116, diesel: 108, standard: "wltp" },
        { from: 2020, to: 2026, petrol: 112, diesel: 104, hybrid: 100, standard: "wltp" },
      ],
    },
    Polo: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2014, petrol: 112, diesel: 99, standard: "nedc" },
        { from: 2015, to: 2017, petrol: 103, diesel: 92, standard: "nedc" },
        { from: 2018, to: 2026, petrol: 105, diesel: 100, standard: "wltp" },
      ],
    },
    Passat: {
      fuel: "diesel",
      ranges: [
        { from: 2011, to: 2015, petrol: 145, diesel: 112, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 135, diesel: 105, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 128, diesel: 108, standard: "wltp" },
      ],
    },
    Tiguan: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 152, diesel: 125, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 140, diesel: 118, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 134, diesel: 124, standard: "wltp" },
      ],
    },
    "T-Roc": {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2021, petrol: 124, diesel: 116, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 121, diesel: 112, standard: "wltp" },
      ],
    },
    "T-Cross": {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2026, petrol: 116, standard: "wltp" }],
    },
    ID3: {
      fuel: "electric",
      ranges: [{ from: 2020, to: 2026, electric: 0, standard: "wltp" }],
    },
    ID4: {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    Up: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 100, standard: "nedc" },
        { from: 2017, to: 2023, petrol: 98, standard: "wltp" },
      ],
    },
    "Golf R": {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2016, petrol: 165, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 160, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 170, standard: "wltp" },
      ],
    },
    "Golf GTI": {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2016, petrol: 139, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 152, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 158, standard: "wltp" },
      ],
    },
    "Golf GTD": {
      fuel: "diesel",
      ranges: [
        { from: 2014, to: 2016, diesel: 121, standard: "nedc", noxDiesel: 130 },
        { from: 2017, to: 2020, diesel: 135, standard: "wltp", noxDiesel: 95 },
        { from: 2021, to: 2026, diesel: 140, standard: "wltp", noxDiesel: 100 },
      ],
    },
    "Polo GTI": {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2022, petrol: 142, standard: "wltp" }],
    },
    ID5: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    "ID Buzz": {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    Arteon: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2020, petrol: 134, diesel: 115, standard: "wltp" },
        { from: 2021, to: 2023, petrol: 136, diesel: 122, standard: "wltp" },
      ],
    },
    Touareg: {
      fuel: "diesel",
      ranges: [
        { from: 2011, to: 2015, petrol: 239, diesel: 189, standard: "nedc" },
        { from: 2016, to: 2018, petrol: 229, diesel: 175, standard: "nedc" },
        { from: 2019, to: 2023, petrol: 205, diesel: 169, standard: "wltp" },
      ],
    },
  },

  BMW: {
    "1 Series": {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2015, petrol: 133, diesel: 109, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 123, diesel: 103, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 129, diesel: 112, standard: "wltp" },
      ],
    },
    "3 Series": {
      fuel: "diesel",
      ranges: [
        { from: 2012, to: 2015, petrol: 134, diesel: 118, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 131, diesel: 109, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 132, diesel: 117, standard: "wltp" },
      ],
    },
    "5 Series": {
      fuel: "diesel",
      ranges: [
        { from: 2011, to: 2016, petrol: 149, diesel: 119, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 138, diesel: 116, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 135, diesel: 122, standard: "wltp" },
      ],
    },
    X1: {
      fuel: "diesel",
      ranges: [
        { from: 2012, to: 2015, petrol: 149, diesel: 124, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 140, diesel: 115, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 138, diesel: 122, standard: "wltp" },
      ],
    },
    X3: {
      fuel: "diesel",
      ranges: [
        { from: 2012, to: 2016, petrol: 159, diesel: 131, standard: "nedc" },
        { from: 2018, to: 2021, petrol: 144, diesel: 127, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 138, diesel: 125, standard: "wltp" },
      ],
    },
    i3: {
      fuel: "electric",
      ranges: [{ from: 2014, to: 2022, electric: 0, standard: "wltp" }],
    },
    M2: {
      fuel: "petrol",
      ranges: [
        { from: 2016, to: 2018, petrol: 199, standard: "nedc" },
        { from: 2019, to: 2023, petrol: 205, standard: "wltp" },
        { from: 2024, to: 2026, petrol: 208, standard: "wltp" },
      ],
    },
    M3: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2018, petrol: 204, standard: "nedc" },
        { from: 2019, to: 2020, petrol: 208, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 212, standard: "wltp" },
      ],
    },
    M4: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2018, petrol: 204, standard: "nedc" },
        { from: 2019, to: 2020, petrol: 210, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 213, standard: "wltp" },
      ],
    },
    M5: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 239, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 231, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 229, standard: "wltp" },
      ],
    },
    "2 Series": {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2018, petrol: 143, diesel: 125, standard: "nedc" },
        { from: 2019, to: 2021, petrol: 141, diesel: 118, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 139, standard: "wltp" },
      ],
    },
    "4 Series": {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2019, petrol: 139, diesel: 121, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 143, diesel: 128, standard: "wltp" },
      ],
    },
    "7 Series": {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2015, petrol: 194, diesel: 139, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 174, diesel: 132, standard: "wltp" },
        { from: 2020, to: 2022, petrol: 159, standard: "wltp" },
        { from: 2023, to: 2026, hybrid: 145, standard: "wltp" },
      ],
    },
    "8 Series": {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2026, petrol: 181, standard: "wltp" }],
    },
    X2: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2021, petrol: 128, diesel: 114, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 126, standard: "wltp" },
      ],
    },
    X4: {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2019, petrol: 152, diesel: 134, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 148, diesel: 133, standard: "wltp" },
      ],
    },
    X5: {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2018, petrol: 192, diesel: 152, standard: "nedc" },
        { from: 2019, to: 2022, petrol: 172, diesel: 138, standard: "wltp" },
        { from: 2023, to: 2026, hybrid: 130, standard: "wltp" },
      ],
    },
    X6: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2018, petrol: 198, diesel: 160, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 171, diesel: 142, standard: "wltp" },
      ],
    },
    X7: {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2026, petrol: 175, diesel: 145, standard: "wltp" }],
    },
    Z4: {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2026, petrol: 161, standard: "wltp" }],
    },
    i4: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    iX3: {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    iX: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    iX1: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    i5: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    i7: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Audi: {
    A1: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2014, petrol: 114, diesel: 99, standard: "nedc" },
        { from: 2015, to: 2018, petrol: 107, diesel: 95, standard: "nedc" },
        { from: 2019, to: 2023, petrol: 110, diesel: 105, standard: "wltp" },
      ],
    },
    A3: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 125, diesel: 108, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 123, diesel: 105, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 120, diesel: 110, standard: "wltp" },
      ],
    },
    A4: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 135, diesel: 111, standard: "nedc" },
        { from: 2017, to: 2019, petrol: 128, diesel: 108, standard: "wltp" },
        { from: 2020, to: 2026, petrol: 124, diesel: 112, standard: "wltp" },
      ],
    },
    A5: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 146, diesel: 122, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 138, diesel: 117, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 135, diesel: 118, standard: "wltp" },
      ],
    },
    Q3: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2018, petrol: 145, diesel: 126, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 132, diesel: 120, standard: "wltp" },
      ],
    },
    Q5: {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2017, petrol: 156, diesel: 130, standard: "nedc" },
        { from: 2018, to: 2026, petrol: 143, diesel: 122, standard: "wltp" },
      ],
    },
    "e-tron": {
      fuel: "electric",
      ranges: [{ from: 2019, to: 2023, electric: 0, standard: "wltp" }],
    },
    S3: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2016, petrol: 162, standard: "nedc" },
        { from: 2017, to: 2019, petrol: 160, standard: "wltp" },
        { from: 2020, to: 2026, petrol: 165, standard: "wltp" },
      ],
    },
    S4: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2016, petrol: 177, standard: "nedc" },
        { from: 2017, to: 2026, petrol: 171, standard: "wltp" },
      ],
    },
    S5: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2016, petrol: 178, standard: "nedc" },
        { from: 2017, to: 2026, petrol: 172, standard: "wltp" },
      ],
    },
    RS3: {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2017, petrol: 172, standard: "nedc" },
        { from: 2018, to: 2021, petrol: 219, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 227, standard: "wltp" },
      ],
    },
    RS4: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2021, petrol: 214, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 219, standard: "wltp" },
      ],
    },
    RS5: {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2026, petrol: 216, standard: "wltp" }],
    },
    RS6: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2018, petrol: 223, standard: "nedc" },
        { from: 2019, to: 2023, petrol: 247, standard: "wltp" },
        { from: 2024, to: 2026, petrol: 241, standard: "wltp" },
      ],
    },
    R8: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2015, petrol: 275, standard: "nedc" },
        { from: 2016, to: 2023, petrol: 279, standard: "wltp" },
      ],
    },
    A6: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2018, petrol: 145, diesel: 119, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 137, diesel: 118, standard: "wltp" },
      ],
    },
    A7: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2018, petrol: 158, diesel: 128, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 140, diesel: 125, standard: "wltp" },
      ],
    },
    A8: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2017, petrol: 192, diesel: 149, standard: "nedc" },
        { from: 2018, to: 2026, petrol: 174, diesel: 142, standard: "wltp" },
      ],
    },
    Q2: {
      fuel: "petrol",
      ranges: [{ from: 2017, to: 2026, petrol: 121, diesel: 110, standard: "wltp" }],
    },
    Q7: {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2018, petrol: 192, diesel: 150, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 165, diesel: 139, standard: "wltp" },
      ],
    },
    Q8: {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2026, petrol: 166, diesel: 143, standard: "wltp" }],
    },
    TT: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2014, petrol: 139, diesel: 122, standard: "nedc" },
        { from: 2015, to: 2023, petrol: 135, standard: "wltp" },
      ],
    },
    "e-tron GT": {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Q4 e-tron": {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Q8 e-tron": {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    "RS e-tron GT": {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  "Mercedes-Benz": {
    "A-Class": {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2018, petrol: 117, diesel: 100, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 119, diesel: 104, standard: "wltp" },
      ],
    },
    "C-Class": {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2014, petrol: 138, diesel: 114, standard: "nedc" },
        { from: 2015, to: 2018, petrol: 126, diesel: 108, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 127, diesel: 114, standard: "wltp" },
      ],
    },
    "E-Class": {
      fuel: "diesel",
      ranges: [
        { from: 2010, to: 2016, petrol: 154, diesel: 124, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 138, diesel: 118, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 133, diesel: 122, standard: "wltp" },
      ],
    },
    GLA: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2019, petrol: 135, diesel: 114, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 131, diesel: 118, standard: "wltp" },
      ],
    },
    GLC: {
      fuel: "diesel",
      ranges: [
        { from: 2016, to: 2019, petrol: 149, diesel: 126, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 141, diesel: 129, standard: "wltp" },
      ],
    },
    "AMG A45": {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2018, petrol: 162, standard: "nedc" },
        { from: 2019, to: 2023, petrol: 195, standard: "wltp" },
        { from: 2024, to: 2026, petrol: 197, standard: "wltp" },
      ],
    },
    "AMG C63": {
      fuel: "petrol",
      ranges: [
        { from: 2016, to: 2018, petrol: 178, standard: "nedc" },
        { from: 2019, to: 2022, petrol: 222, standard: "wltp" },
        { from: 2023, to: 2026, petrol: 230, standard: "wltp" },
      ],
    },
    "AMG E63": {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2020, petrol: 222, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 223, standard: "wltp" },
      ],
    },
    "AMG G63": {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2026, petrol: 310, standard: "wltp" }],
    },
    "AMG GT": {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2019, petrol: 199, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 207, standard: "wltp" },
        { from: 2024, to: 2026, petrol: 211, standard: "wltp" },
      ],
    },
    "S-Class": {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2017, petrol: 199, diesel: 148, standard: "nedc" },
        { from: 2018, to: 2020, petrol: 178, diesel: 141, standard: "wltp" },
        { from: 2021, to: 2026, hybrid: 147, standard: "wltp" },
      ],
    },
    GLE: {
      fuel: "petrol",
      ranges: [
        { from: 2019, to: 2022, petrol: 165, diesel: 138, standard: "wltp" },
        { from: 2023, to: 2026, hybrid: 131, standard: "wltp" },
      ],
    },
    CLA: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2019, petrol: 126, diesel: 112, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 128, diesel: 120, standard: "wltp" },
      ],
    },
    CLS: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2017, petrol: 164, diesel: 133, standard: "nedc" },
        { from: 2018, to: 2023, petrol: 148, diesel: 126, standard: "wltp" },
      ],
    },
    "G-Class": {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2018, diesel: 259, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 265, diesel: 240, standard: "wltp" },
      ],
    },
    "V-Class": {
      fuel: "diesel",
      ranges: [{ from: 2015, to: 2026, diesel: 156, standard: "wltp" }],
    },
    EQA: {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    EQB: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    EQC: {
      fuel: "electric",
      ranges: [{ from: 2019, to: 2023, electric: 0, standard: "wltp" }],
    },
    EQE: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    EQS: {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    "EQS SUV": {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    EQT: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Toyota: {
    Yaris: {
      fuel: "hybrid",
      ranges: [
        { from: 2012, to: 2016, petrol: 104, hybrid: 100, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 100, hybrid: 85, standard: "wltp" },
        { from: 2021, to: 2026, hybrid: 95, standard: "wltp" },
      ],
    },
    Corolla: {
      fuel: "hybrid",
      ranges: [
        { from: 2013, to: 2018, petrol: 130, diesel: 112, standard: "nedc" },
        { from: 2019, to: 2026, hybrid: 105, standard: "wltp" },
      ],
    },
    Auris: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2018, petrol: 128, diesel: 104, hybrid: 90, standard: "nedc" },
      ],
    },
    RAV4: {
      fuel: "hybrid",
      ranges: [
        { from: 2013, to: 2018, petrol: 145, diesel: 127, hybrid: 118, standard: "nedc" },
        { from: 2019, to: 2026, hybrid: 112, standard: "wltp" },
      ],
    },
    "C-HR": {
      fuel: "hybrid",
      ranges: [
        { from: 2017, to: 2020, petrol: 126, hybrid: 94, standard: "wltp" },
        { from: 2021, to: 2026, hybrid: 108, standard: "wltp" },
      ],
    },
    Hilux: {
      fuel: "diesel",
      ranges: [{ from: 2016, to: 2026, diesel: 204, standard: "wltp" }],
    },
    Prius: {
      fuel: "hybrid",
      ranges: [{ from: 2016, to: 2020, hybrid: 82, standard: "wltp" }],
    },
    Aygo: {
      fuel: "petrol",
      ranges: [{ from: 2014, to: 2021, petrol: 93, standard: "nedc" }],
    },
    "GR Yaris": {
      fuel: "petrol",
      ranges: [{ from: 2021, to: 2026, petrol: 172, standard: "wltp" }],
    },
    "GR86": {
      fuel: "petrol",
      ranges: [{ from: 2022, to: 2026, petrol: 200, standard: "wltp" }],
    },
    Supra: {
      fuel: "petrol",
      ranges: [
        { from: 2019, to: 2022, petrol: 186, standard: "wltp" },
        { from: 2023, to: 2026, petrol: 181, standard: "wltp" },
      ],
    },
    GT86: {
      fuel: "petrol",
      ranges: [{ from: 2012, to: 2020, petrol: 165, standard: "nedc" }],
    },
    "Land Cruiser": {
      fuel: "diesel",
      ranges: [
        { from: 2010, to: 2015, diesel: 224, standard: "nedc" },
        { from: 2016, to: 2021, diesel: 211, standard: "wltp" },
        { from: 2022, to: 2026, diesel: 205, standard: "wltp" },
      ],
    },
    Avensis: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2015, petrol: 138, diesel: 121, standard: "nedc" },
        { from: 2016, to: 2018, petrol: 129, diesel: 112, standard: "nedc" },
      ],
    },
    Verso: {
      fuel: "petrol",
      ranges: [{ from: 2010, to: 2018, petrol: 148, diesel: 128, standard: "nedc" }],
    },
    Camry: {
      fuel: "hybrid",
      ranges: [{ from: 2019, to: 2026, hybrid: 102, standard: "wltp" }],
    },
    "Yaris Cross": {
      fuel: "hybrid",
      ranges: [{ from: 2021, to: 2026, hybrid: 104, standard: "wltp" }],
    },
    bZ4X: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Nissan: {
    Qashqai: {
      fuel: "diesel",
      ranges: [
        { from: 2011, to: 2013, petrol: 148, diesel: 129, standard: "nedc" },
        { from: 2014, to: 2018, petrol: 132, diesel: 104, standard: "nedc" },
        { from: 2019, to: 2021, petrol: 128, diesel: 110, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 118, hybrid: 105, standard: "wltp" },
      ],
    },
    Juke: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2015, petrol: 137, diesel: 109, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 122, diesel: 102, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 115, standard: "wltp" },
      ],
    },
    Leaf: {
      fuel: "electric",
      ranges: [{ from: 2011, to: 2026, electric: 0, standard: "wltp" }],
    },
    Micra: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2016, petrol: 120, diesel: 99, standard: "nedc" },
        { from: 2017, to: 2022, petrol: 106, standard: "wltp" },
      ],
    },
    "X-Trail": {
      fuel: "diesel",
      ranges: [
        { from: 2014, to: 2021, petrol: 158, diesel: 129, standard: "nedc" },
        { from: 2022, to: 2026, hybrid: 145, standard: "wltp" },
      ],
    },
    Ariya: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    "GT-R": {
      fuel: "petrol",
      ranges: [{ from: 2009, to: 2021, petrol: 275, standard: "nedc" }],
    },
    Navara: {
      fuel: "diesel",
      ranges: [{ from: 2012, to: 2021, diesel: 189, standard: "nedc" }],
    },
    Pulsar: {
      fuel: "petrol",
      ranges: [{ from: 2015, to: 2019, petrol: 122, diesel: 100, standard: "wltp" }],
    },
    Note: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2016, petrol: 124, diesel: 105, standard: "nedc" },
        { from: 2017, to: 2019, petrol: 109, standard: "wltp" },
      ],
    },
  },

  Hyundai: {
    i10: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2019, petrol: 110, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 106, standard: "wltp" },
      ],
    },
    i20: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 113, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 108, standard: "nedc" },
        { from: 2021, to: 2026, petrol: 109, standard: "wltp" },
      ],
    },
    i30: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 134, diesel: 115, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 128, diesel: 105, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 126, diesel: 110, standard: "wltp" },
      ],
    },
    Tucson: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2015, petrol: 155, diesel: 138, standard: "nedc" },
        { from: 2016, to: 2020, petrol: 141, diesel: 126, standard: "nedc" },
        { from: 2021, to: 2026, petrol: 126, diesel: 115, hybrid: 120, standard: "wltp" },
      ],
    },
    Kona: {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2023, petrol: 119, standard: "wltp" }],
    },
    "Kona Electric": {
      fuel: "electric",
      ranges: [{ from: 2018, to: 2026, electric: 0, standard: "wltp" }],
    },
    "IONIQ 5": {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    "IONIQ 5 N": {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    "i30 N": {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2022, petrol: 170, standard: "wltp" }],
    },
    "IONIQ 6": {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    IONIQ: {
      fuel: "hybrid",
      ranges: [
        { from: 2017, to: 2020, hybrid: 79, standard: "wltp" },
        { from: 2021, to: 2022, hybrid: 96, standard: "wltp" },
      ],
    },
    "Santa Fe": {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2018, petrol: 189, diesel: 149, standard: "nedc" },
        { from: 2019, to: 2023, petrol: 164, diesel: 140, hybrid: 130, standard: "wltp" },
      ],
    },
  },

  Kia: {
    Picanto: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 108, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 101, standard: "nedc" },
        { from: 2021, to: 2026, petrol: 112, standard: "wltp" },
      ],
    },
    Rio: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 114, standard: "nedc" },
        { from: 2017, to: 2023, petrol: 108, standard: "wltp" },
      ],
    },
    Ceed: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2017, petrol: 128, diesel: 104, standard: "nedc" },
        { from: 2018, to: 2021, petrol: 128, diesel: 114, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 124, diesel: 112, standard: "wltp" },
      ],
    },
    Sportage: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2015, petrol: 158, diesel: 137, standard: "nedc" },
        { from: 2016, to: 2020, petrol: 143, diesel: 125, standard: "nedc" },
        { from: 2021, to: 2026, petrol: 125, diesel: 113, hybrid: 130, standard: "wltp" },
      ],
    },
    Niro: {
      fuel: "hybrid",
      ranges: [
        { from: 2017, to: 2022, hybrid: 92, standard: "wltp" },
        { from: 2023, to: 2026, hybrid: 98, standard: "wltp" },
      ],
    },
    "e-Niro": {
      fuel: "electric",
      ranges: [{ from: 2019, to: 2022, electric: 0, standard: "wltp" }],
    },
    Stinger: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2020, petrol: 208, standard: "wltp" },
        { from: 2021, to: 2023, petrol: 213, standard: "wltp" },
      ],
    },
    EV6: {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    XCeed: {
      fuel: "petrol",
      ranges: [{ from: 2020, to: 2023, petrol: 124, diesel: 112, standard: "wltp" }],
    },
    Soul: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2013, petrol: 145, diesel: 128, standard: "nedc" },
        { from: 2014, to: 2019, petrol: 128, diesel: 112, standard: "nedc" },
      ],
    },
    "e-Soul": {
      fuel: "electric",
      ranges: [{ from: 2020, to: 2022, electric: 0, standard: "wltp" }],
    },
    Sorento: {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2018, petrol: 194, diesel: 158, standard: "nedc" },
        { from: 2019, to: 2023, diesel: 146, hybrid: 132, standard: "wltp" },
      ],
    },
    EV9: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    EV3: {
      fuel: "electric",
      ranges: [{ from: 2024, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Peugeot: {
    208: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2019, petrol: 100, diesel: 89, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 102, diesel: 102, standard: "wltp" },
      ],
    },
    "e-208": {
      fuel: "electric",
      ranges: [{ from: 2020, to: 2026, electric: 0, standard: "wltp" }],
    },
    308: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2016, petrol: 116, diesel: 98, standard: "nedc" },
        { from: 2017, to: 2021, petrol: 104, diesel: 98, standard: "nedc" },
        { from: 2022, to: 2026, petrol: 106, hybrid: 100, standard: "wltp" },
      ],
    },
    2008: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2019, petrol: 114, diesel: 104, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 113, diesel: 112, standard: "wltp" },
      ],
    },
    3008: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2016, petrol: 135, diesel: 114, standard: "nedc" },
        { from: 2017, to: 2021, petrol: 126, diesel: 112, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 120, hybrid: 112, standard: "wltp" },
      ],
    },
    5008: {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2016, petrol: 139, diesel: 115, standard: "nedc" },
        { from: 2017, to: 2023, petrol: 126, diesel: 118, standard: "wltp" },
      ],
    },
    "e-2008": {
      fuel: "electric",
      ranges: [{ from: 2020, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Renault: {
    Clio: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2012, petrol: 127, diesel: 104, standard: "nedc" },
        { from: 2013, to: 2019, petrol: 102, diesel: 92, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 103, hybrid: 96, standard: "wltp" },
      ],
    },
    Captur: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2019, petrol: 113, diesel: 100, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 112, hybrid: 105, standard: "wltp" },
      ],
    },
    Megane: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2013, petrol: 138, diesel: 114, standard: "nedc" },
        { from: 2014, to: 2018, petrol: 118, diesel: 95, standard: "nedc" },
        { from: 2019, to: 2022, petrol: 110, diesel: 104, standard: "wltp" },
      ],
    },
    Kadjar: {
      fuel: "diesel",
      ranges: [
        { from: 2015, to: 2019, petrol: 128, diesel: 110, standard: "nedc" },
        { from: 2020, to: 2022, petrol: 122, diesel: 116, standard: "wltp" },
      ],
    },
    Zoe: {
      fuel: "electric",
      ranges: [{ from: 2013, to: 2023, electric: 0, standard: "wltp" }],
    },
    "Megane RS": {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2013, petrol: 228, standard: "nedc" },
        { from: 2014, to: 2018, petrol: 174, standard: "nedc" },
        { from: 2019, to: 2022, petrol: 175, standard: "wltp" },
      ],
    },
    Scenic: {
      fuel: "diesel",
      ranges: [{ from: 2013, to: 2019, petrol: 138, diesel: 104, standard: "nedc" }],
    },
    Talisman: {
      fuel: "diesel",
      ranges: [{ from: 2016, to: 2020, petrol: 152, diesel: 116, standard: "wltp" }],
    },
  },

  Skoda: {
    Fabia: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2014, petrol: 116, diesel: 102, standard: "nedc" },
        { from: 2015, to: 2017, petrol: 104, diesel: 96, standard: "nedc" },
        { from: 2018, to: 2021, petrol: 108, diesel: 101, standard: "wltp" },
      ],
    },
    Octavia: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2012, petrol: 148, diesel: 129, standard: "nedc" },
        { from: 2013, to: 2017, petrol: 124, diesel: 106, standard: "nedc" },
        { from: 2018, to: 2020, petrol: 112, diesel: 102, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 110, diesel: 100, standard: "wltp" },
      ],
    },
    Karoq: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2021, petrol: 122, diesel: 116, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 118, diesel: 112, standard: "wltp" },
      ],
    },
    Kodiaq: {
      fuel: "petrol",
      ranges: [
        { from: 2017, to: 2020, petrol: 128, diesel: 120, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 124, diesel: 118, standard: "wltp" },
      ],
    },
    Superb: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2015, petrol: 149, diesel: 119, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 136, diesel: 109, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 130, diesel: 115, standard: "wltp" },
      ],
    },
  },

  Seat: {
    Ibiza: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2016, petrol: 105, diesel: 98, standard: "nedc" },
        { from: 2017, to: 2021, petrol: 104, diesel: 100, standard: "wltp" },
      ],
    },
    Leon: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2017, petrol: 114, diesel: 104, standard: "nedc" },
        { from: 2018, to: 2020, petrol: 110, diesel: 108, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 108, diesel: 104, standard: "wltp" },
      ],
    },
    Arona: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2026, petrol: 112, diesel: 108, standard: "wltp" },
      ],
    },
    Ateca: {
      fuel: "petrol",
      ranges: [
        { from: 2017, to: 2020, petrol: 126, diesel: 116, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 122, diesel: 112, standard: "wltp" },
      ],
    },
  },

  Tesla: {
    "Model 3": {
      fuel: "electric",
      ranges: [{ from: 2019, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Model Y": {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Model S": {
      fuel: "electric",
      ranges: [{ from: 2014, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Model X": {
      fuel: "electric",
      ranges: [{ from: 2016, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Mini: {
    Cooper: {
      fuel: "petrol",
      ranges: [
        { from: 2007, to: 2013, petrol: 130, diesel: 119, standard: "nedc" },
        { from: 2014, to: 2017, petrol: 112, diesel: 95, standard: "nedc" },
        { from: 2018, to: 2023, petrol: 108, diesel: 99, standard: "wltp" },
      ],
    },
    Clubman: {
      fuel: "petrol",
      ranges: [
        { from: 2016, to: 2019, petrol: 118, diesel: 104, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 116, diesel: 104, standard: "wltp" },
      ],
    },
    Countryman: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2016, petrol: 139, diesel: 115, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 132, diesel: 112, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 128, diesel: 118, standard: "wltp" },
      ],
    },
  },

  Volvo: {
    XC40: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2021, petrol: 134, diesel: 117, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 128, hybrid: 115, standard: "wltp" },
      ],
    },
    XC60: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2015, petrol: 168, diesel: 135, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 156, diesel: 130, standard: "nedc" },
        { from: 2020, to: 2026, hybrid: 112, standard: "wltp" },
      ],
    },
    V40: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2016, petrol: 125, diesel: 105, standard: "nedc" },
        { from: 2017, to: 2019, petrol: 117, diesel: 99, standard: "nedc" },
      ],
    },
    V60: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2015, petrol: 144, diesel: 116, standard: "nedc" },
        { from: 2016, to: 2019, petrol: 133, diesel: 110, standard: "nedc" },
        { from: 2020, to: 2026, hybrid: 100, standard: "wltp" },
      ],
    },
    "XC40 Recharge": {
      fuel: "electric",
      ranges: [{ from: 2020, to: 2026, electric: 0, standard: "wltp" }],
    },
    C40: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    EX30: {
      fuel: "electric",
      ranges: [{ from: 2024, to: 2026, electric: 0, standard: "wltp" }],
    },
    EX90: {
      fuel: "electric",
      ranges: [{ from: 2024, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Mazda: {
    2: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2014, petrol: 105, standard: "nedc" },
        { from: 2015, to: 2022, petrol: 105, standard: "wltp" },
      ],
    },
    3: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2013, petrol: 139, diesel: 110, standard: "nedc" },
        { from: 2014, to: 2019, petrol: 127, diesel: 106, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 112, diesel: 106, standard: "wltp" },
      ],
    },
    6: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2013, petrol: 149, diesel: 130, standard: "nedc" },
        { from: 2014, to: 2019, petrol: 136, diesel: 112, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 124, diesel: 110, standard: "wltp" },
      ],
    },
    "CX-5": {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2017, petrol: 145, diesel: 119, standard: "nedc" },
        { from: 2018, to: 2022, petrol: 139, diesel: 122, standard: "wltp" },
        { from: 2023, to: 2026, petrol: 132, diesel: 122, standard: "wltp" },
      ],
    },
    "CX-30": {
      fuel: "petrol",
      ranges: [{ from: 2020, to: 2026, petrol: 119, diesel: 110, standard: "wltp" }],
    },
    "MX-5": {
      fuel: "petrol",
      ranges: [{ from: 2016, to: 2026, petrol: 139, standard: "wltp" }],
    },
  },

  Honda: {
    Civic: {
      fuel: "petrol",
      ranges: [
        { from: 2009, to: 2011, petrol: 154, diesel: 132, standard: "nedc" },
        { from: 2012, to: 2016, petrol: 139, diesel: 110, standard: "nedc" },
        { from: 2017, to: 2021, petrol: 128, diesel: 118, standard: "wltp" },
        { from: 2022, to: 2026, hybrid: 99, standard: "wltp" },
      ],
    },
    "CR-V": {
      fuel: "petrol",
      ranges: [
        { from: 2008, to: 2012, petrol: 193, diesel: 158, standard: "nedc" },
        { from: 2013, to: 2017, petrol: 149, diesel: 132, standard: "nedc" },
        { from: 2018, to: 2022, petrol: 130, hybrid: 128, standard: "wltp" },
      ],
    },
    Jazz: {
      fuel: "petrol",
      ranges: [
        { from: 2009, to: 2014, petrol: 122, standard: "nedc" },
        { from: 2015, to: 2019, petrol: 106, standard: "nedc" },
        { from: 2020, to: 2026, hybrid: 101, standard: "wltp" },
      ],
    },
    "HR-V": {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2020, petrol: 122, standard: "nedc" },
        { from: 2022, to: 2026, hybrid: 118, standard: "wltp" },
      ],
    },
  },

  "Land Rover": {
    Evoque: {
      fuel: "diesel",
      ranges: [
        { from: 2011, to: 2014, petrol: 189, diesel: 139, standard: "nedc" },
        { from: 2015, to: 2018, petrol: 171, diesel: 131, standard: "nedc" },
        { from: 2019, to: 2023, petrol: 139, diesel: 132, standard: "wltp" },
      ],
    },
    "Discovery Sport": {
      fuel: "diesel",
      ranges: [
        { from: 2015, to: 2019, petrol: 168, diesel: 139, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 141, diesel: 136, standard: "wltp" },
      ],
    },
    "Range Rover": {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2017, diesel: 172, standard: "nedc" },
        { from: 2018, to: 2021, diesel: 150, standard: "wltp" },
        { from: 2022, to: 2026, hybrid: 140, standard: "wltp" },
      ],
    },
    "Range Rover Sport": {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2017, diesel: 179, standard: "nedc" },
        { from: 2018, to: 2021, diesel: 158, standard: "wltp" },
      ],
    },
  },

  Dacia: {
    Duster: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2017, petrol: 136, diesel: 116, standard: "nedc" },
        { from: 2018, to: 2021, petrol: 125, diesel: 115, standard: "wltp" },
        { from: 2022, to: 2026, petrol: 126, standard: "wltp" },
      ],
    },
    Sandero: {
      fuel: "petrol",
      ranges: [
        { from: 2013, to: 2016, petrol: 112, standard: "nedc" },
        { from: 2017, to: 2021, petrol: 108, standard: "nedc" },
        { from: 2022, to: 2026, petrol: 109, standard: "wltp" },
      ],
    },
  },

  Fiat: {
    500: {
      fuel: "petrol",
      ranges: [
        { from: 2008, to: 2015, petrol: 113, standard: "nedc" },
        { from: 2016, to: 2020, petrol: 104, standard: "nedc" },
        { from: 2021, to: 2026, petrol: 106, hybrid: 90, standard: "wltp" },
      ],
    },
    Panda: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2017, petrol: 116, standard: "nedc" },
        { from: 2018, to: 2023, petrol: 112, standard: "wltp" },
      ],
    },
    Tipo: {
      fuel: "petrol",
      ranges: [
        { from: 2016, to: 2022, petrol: 118, diesel: 108, standard: "wltp" },
      ],
    },
    "500e": {
      fuel: "electric",
      ranges: [{ from: 2021, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Suzuki: {
    Swift: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2016, petrol: 115, standard: "nedc" },
        { from: 2017, to: 2021, petrol: 104, hybrid: 96, standard: "wltp" },
        { from: 2022, to: 2026, hybrid: 97, standard: "wltp" },
      ],
    },
    Vitara: {
      fuel: "petrol",
      ranges: [{ from: 2015, to: 2021, petrol: 119, diesel: 108, standard: "wltp" }],
    },
    Ignis: {
      fuel: "petrol",
      ranges: [{ from: 2017, to: 2023, petrol: 100, standard: "wltp" }],
    },
    Jimny: {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2023, petrol: 161, standard: "wltp" }],
    },
  },

  Jaguar: {
    "E-Pace": {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2020, petrol: 131, diesel: 123, standard: "wltp" },
        { from: 2021, to: 2024, petrol: 128, standard: "wltp" },
      ],
    },
    "F-Pace": {
      fuel: "diesel",
      ranges: [
        { from: 2016, to: 2019, petrol: 145, diesel: 128, standard: "wltp" },
        { from: 2020, to: 2024, petrol: 136, diesel: 124, standard: "wltp" },
      ],
    },
    XE: {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2019, petrol: 131, diesel: 110, standard: "wltp" },
        { from: 2020, to: 2023, petrol: 124, diesel: 120, standard: "wltp" },
      ],
    },
    XF: {
      fuel: "diesel",
      ranges: [
        { from: 2012, to: 2017, petrol: 139, diesel: 114, standard: "nedc" },
        { from: 2018, to: 2023, petrol: 130, diesel: 118, standard: "wltp" },
      ],
    },
  },

  Citroen: {
    C3: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2016, petrol: 121, diesel: 98, standard: "nedc" },
        { from: 2017, to: 2020, petrol: 102, diesel: 103, standard: "wltp" },
        { from: 2021, to: 2026, petrol: 103, hybrid: 98, standard: "wltp" },
      ],
    },
    C4: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2016, petrol: 128, diesel: 106, standard: "nedc" },
        { from: 2021, to: 2026, petrol: 110, hybrid: 108, standard: "wltp" },
      ],
    },
    "C3 Aircross": {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2023, petrol: 113, diesel: 108, standard: "wltp" }],
    },
    "C5 Aircross": {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2026, petrol: 126, diesel: 115, standard: "wltp" }],
    },
  },

  MG: {
    ZS: {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2021, petrol: 132, standard: "wltp" }],
    },
    "ZS EV": {
      fuel: "electric",
      ranges: [{ from: 2019, to: 2026, electric: 0, standard: "wltp" }],
    },
    HS: {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2023, petrol: 142, standard: "wltp" }],
    },
    MG4: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    Cyberster: {
      fuel: "electric",
      ranges: [{ from: 2024, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Polestar: {
    2: {
      fuel: "electric",
      ranges: [{ from: 2020, to: 2026, electric: 0, standard: "wltp" }],
    },
    3: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    4: {
      fuel: "electric",
      ranges: [{ from: 2024, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  BYD: {
    "Atto 3": {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    Seal: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    Dolphin: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Sealion 7": {
      fuel: "electric",
      ranges: [{ from: 2025, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Lexus: {
    NX: {
      fuel: "hybrid",
      ranges: [
        { from: 2015, to: 2020, hybrid: 110, standard: "nedc" },
        { from: 2022, to: 2026, hybrid: 125, standard: "wltp" },
      ],
    },
    RX: {
      fuel: "hybrid",
      ranges: [
        { from: 2012, to: 2017, hybrid: 127, standard: "nedc" },
        { from: 2018, to: 2022, hybrid: 132, standard: "wltp" },
        { from: 2023, to: 2026, hybrid: 135, standard: "wltp" },
      ],
    },
    UX: {
      fuel: "hybrid",
      ranges: [{ from: 2019, to: 2026, hybrid: 100, standard: "wltp" }],
    },
  },

  Mitsubishi: {
    Outlander: {
      fuel: "hybrid",
      ranges: [
        { from: 2013, to: 2018, petrol: 143, diesel: 124, hybrid: 41, standard: "nedc" },
        { from: 2019, to: 2021, hybrid: 43, standard: "wltp" },
      ],
    },
    ASX: {
      fuel: "petrol",
      ranges: [{ from: 2013, to: 2019, petrol: 144, diesel: 126, standard: "nedc" }],
    },
  },

  Jeep: {
    Renegade: {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2019, petrol: 137, diesel: 126, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 133, diesel: 123, standard: "wltp" },
      ],
    },
    Compass: {
      fuel: "petrol",
      ranges: [
        { from: 2017, to: 2020, petrol: 128, diesel: 124, standard: "wltp" },
        { from: 2021, to: 2023, petrol: 128, standard: "wltp" },
      ],
    },
  },

  Smart: {
    ForTwo: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2019, petrol: 103, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 100, standard: "wltp" },
      ],
    },
  },

  Porsche: {
    Taycan: {
      fuel: "electric",
      ranges: [{ from: 2020, to: 2026, electric: 0, standard: "wltp" }],
    },
    Macan: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2018, petrol: 168, diesel: 146, standard: "nedc" },
        { from: 2019, to: 2023, petrol: 158, standard: "wltp" },
      ],
    },
    "Macan Electric": {
      fuel: "electric",
      ranges: [{ from: 2024, to: 2026, electric: 0, standard: "wltp" }],
    },
    Cayenne: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2017, petrol: 189, standard: "nedc" },
        { from: 2018, to: 2023, petrol: 179, standard: "wltp" },
      ],
    },
    911: {
      fuel: "petrol",
      ranges: [
        { from: 2005, to: 2011, petrol: 239, standard: "nedc" },
        { from: 2012, to: 2018, petrol: 199, standard: "nedc" },
        { from: 2019, to: 2026, petrol: 195, standard: "wltp" },
      ],
    },
    Boxster: {
      fuel: "petrol",
      ranges: [
        { from: 2005, to: 2012, petrol: 199, standard: "nedc" },
        { from: 2013, to: 2018, petrol: 165, standard: "nedc" },
      ],
    },
    Cayman: {
      fuel: "petrol",
      ranges: [
        { from: 2006, to: 2012, petrol: 199, standard: "nedc" },
        { from: 2013, to: 2018, petrol: 165, standard: "nedc" },
      ],
    },
    "718 Boxster": {
      fuel: "petrol",
      ranges: [{ from: 2017, to: 2026, petrol: 175, standard: "wltp" }],
    },
    "718 Cayman": {
      fuel: "petrol",
      ranges: [{ from: 2017, to: 2026, petrol: 175, standard: "wltp" }],
    },
    Panamera: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2016, petrol: 216, standard: "nedc" },
        { from: 2017, to: 2023, petrol: 204, standard: "wltp" },
      ],
    },
  },

  Abarth: {
    500: {
      fuel: "petrol",
      ranges: [{ from: 2012, to: 2020, petrol: 144, standard: "wltp" }],
    },
  },

  "Alfa Romeo": {
    Giulietta: {
      fuel: "petrol",
      ranges: [{ from: 2010, to: 2017, petrol: 134, diesel: 116, standard: "nedc" }],
    },
    Giulia: {
      fuel: "petrol",
      ranges: [
        { from: 2016, to: 2020, petrol: 140, diesel: 117, standard: "wltp" },
      ],
    },
    Stelvio: {
      fuel: "petrol",
      ranges: [{ from: 2017, to: 2023, petrol: 140, diesel: 119, standard: "wltp" }],
    },
  },

  Cupra: {
    Formentor: {
      fuel: "petrol",
      ranges: [{ from: 2020, to: 2026, petrol: 134, standard: "wltp" }],
    },
  },

  Chevrolet: {
    Corvette: {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2019, petrol: 250, standard: "nedc" },
        { from: 2020, to: 2026, petrol: 278, standard: "wltp" },
      ],
    },
    Camaro: {
      fuel: "petrol",
      ranges: [{ from: 2016, to: 2023, petrol: 279, standard: "wltp" }],
    },
    Spark: {
      fuel: "petrol",
      ranges: [{ from: 2010, to: 2016, petrol: 120, standard: "nedc" }],
    },
    Cruze: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2016, petrol: 149, diesel: 119, standard: "nedc" },
      ],
    },
  },

  "Rolls-Royce": {
    Ghost: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2020, petrol: 299, standard: "nedc" },
        { from: 2021, to: 2024, petrol: 295, standard: "wltp" },
      ],
    },
    Phantom: {
      fuel: "petrol",
      ranges: [
        { from: 2004, to: 2016, petrol: 343, standard: "nedc" },
        { from: 2018, to: 2024, petrol: 335, standard: "wltp" },
      ],
    },
    Cullinan: {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2024, petrol: 327, standard: "wltp" }],
    },
    Wraith: {
      fuel: "petrol",
      ranges: [{ from: 2013, to: 2021, petrol: 317, standard: "nedc" }],
    },
    Dawn: {
      fuel: "petrol",
      ranges: [{ from: 2015, to: 2021, petrol: 317, standard: "nedc" }],
    },
  },

  Subaru: {
    Impreza: {
      fuel: "petrol",
      ranges: [
        { from: 2008, to: 2014, petrol: 193, standard: "nedc" },
        { from: 2015, to: 2021, petrol: 162, standard: "wltp" },
      ],
    },
    "WRX STI": {
      fuel: "petrol",
      ranges: [
        { from: 2008, to: 2014, petrol: 283, standard: "nedc" },
        { from: 2015, to: 2019, petrol: 245, standard: "wltp" },
      ],
    },
    WRX: {
      fuel: "petrol",
      ranges: [{ from: 2015, to: 2019, petrol: 228, standard: "wltp" }],
    },
    Outback: {
      fuel: "petrol",
      ranges: [
        { from: 2009, to: 2014, petrol: 174, diesel: 150, standard: "nedc" },
        { from: 2015, to: 2019, petrol: 148, diesel: 136, standard: "wltp" },
      ],
    },
    Forester: {
      fuel: "petrol",
      ranges: [
        { from: 2008, to: 2013, petrol: 193, diesel: 159, standard: "nedc" },
        { from: 2014, to: 2018, petrol: 158, diesel: 128, standard: "nedc" },
        { from: 2019, to: 2022, petrol: 162, standard: "wltp" },
      ],
    },
    XV: {
      fuel: "petrol",
      ranges: [
        { from: 2012, to: 2017, petrol: 157, diesel: 117, standard: "nedc" },
        { from: 2018, to: 2021, petrol: 158, standard: "wltp" },
      ],
    },
  },

  Lotus: {
    Elise: {
      fuel: "petrol",
      ranges: [{ from: 2005, to: 2021, petrol: 149, standard: "nedc" }],
    },
    Exige: {
      fuel: "petrol",
      ranges: [{ from: 2012, to: 2021, petrol: 199, standard: "nedc" }],
    },
    Evora: {
      fuel: "petrol",
      ranges: [
        { from: 2010, to: 2015, petrol: 221, standard: "nedc" },
        { from: 2016, to: 2021, petrol: 199, standard: "nedc" },
      ],
    },
    Emira: {
      fuel: "petrol",
      ranges: [{ from: 2022, to: 2026, petrol: 208, standard: "wltp" }],
    },
    Eletre: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    Emeya: {
      fuel: "electric",
      ranges: [{ from: 2024, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Lamborghini: {
    Gallardo: {
      fuel: "petrol",
      ranges: [{ from: 2004, to: 2012, petrol: 325, standard: "nedc" }],
    },
    Huracan: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2018, petrol: 290, standard: "nedc" },
        { from: 2019, to: 2024, petrol: 279, standard: "wltp" },
      ],
    },
    Aventador: {
      fuel: "petrol",
      ranges: [
        { from: 2011, to: 2016, petrol: 340, standard: "nedc" },
        { from: 2017, to: 2022, petrol: 320, standard: "wltp" },
      ],
    },
    Urus: {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2024, petrol: 296, standard: "wltp" }],
    },
  },

  Ferrari: {
    California: {
      fuel: "petrol",
      ranges: [{ from: 2009, to: 2014, petrol: 275, standard: "nedc" }],
    },
    458: {
      fuel: "petrol",
      ranges: [{ from: 2010, to: 2015, petrol: 307, standard: "nedc" }],
    },
    488: {
      fuel: "petrol",
      ranges: [{ from: 2016, to: 2019, petrol: 275, standard: "nedc" }],
    },
    812: {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2022, petrol: 375, standard: "wltp" }],
    },
    Portofino: {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2023, petrol: 253, standard: "wltp" }],
    },
    F8: {
      fuel: "petrol",
      ranges: [{ from: 2020, to: 2022, petrol: 279, standard: "wltp" }],
    },
    GTC4Lusso: {
      fuel: "petrol",
      ranges: [{ from: 2017, to: 2020, petrol: 320, standard: "wltp" }],
    },
    Roma: {
      fuel: "petrol",
      ranges: [{ from: 2021, to: 2024, petrol: 250, standard: "wltp" }],
    },
    296: {
      fuel: "hybrid",
      ranges: [{ from: 2022, to: 2024, petrol: 181, standard: "wltp" }],
    },
    SF90: {
      fuel: "hybrid",
      ranges: [{ from: 2020, to: 2024, petrol: 254, standard: "wltp" }],
    },
  },

  Maserati: {
    GranTurismo: {
      fuel: "petrol",
      ranges: [{ from: 2008, to: 2017, petrol: 331, standard: "nedc" }],
    },
    GranCabrio: {
      fuel: "petrol",
      ranges: [{ from: 2010, to: 2017, petrol: 331, standard: "nedc" }],
    },
    Ghibli: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2019, petrol: 274, diesel: 149, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 259, standard: "wltp" },
      ],
    },
    Quattroporte: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2019, petrol: 304, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 286, standard: "wltp" },
      ],
    },
    Levante: {
      fuel: "petrol",
      ranges: [
        { from: 2017, to: 2020, petrol: 279, diesel: 169, standard: "wltp" },
        { from: 2021, to: 2023, petrol: 259, standard: "wltp" },
      ],
    },
    Grecale: {
      fuel: "petrol",
      ranges: [{ from: 2023, to: 2025, petrol: 186, standard: "wltp" }],
    },
  },

  McLaren: {
    "12C": {
      fuel: "petrol",
      ranges: [{ from: 2011, to: 2014, petrol: 279, standard: "nedc" }],
    },
    650: {
      fuel: "petrol",
      ranges: [{ from: 2014, to: 2017, petrol: 275, standard: "nedc" }],
    },
    "570S": {
      fuel: "petrol",
      ranges: [{ from: 2015, to: 2019, petrol: 249, standard: "nedc" }],
    },
    "720S": {
      fuel: "petrol",
      ranges: [{ from: 2017, to: 2021, petrol: 282, standard: "wltp" }],
    },
    "600LT": {
      fuel: "petrol",
      ranges: [{ from: 2018, to: 2021, petrol: 249, standard: "nedc" }],
    },
    GT: {
      fuel: "petrol",
      ranges: [{ from: 2019, to: 2023, petrol: 254, standard: "wltp" }],
    },
    Artura: {
      fuel: "hybrid",
      ranges: [{ from: 2022, to: 2025, petrol: 151, standard: "wltp" }],
    },
    "765LT": {
      fuel: "petrol",
      ranges: [{ from: 2021, to: 2023, petrol: 282, standard: "wltp" }],
    },
  },

  DS: {
    DS3: {
      fuel: "petrol",
      ranges: [{ from: 2016, to: 2019, petrol: 105, diesel: 99, standard: "nedc" }],
    },
    "DS 3 Crossback": {
      fuel: "petrol",
      ranges: [
        { from: 2019, to: 2023, petrol: 122, electric: 0, standard: "wltp" },
      ],
    },
    DS7: {
      fuel: "petrol",
      ranges: [
        { from: 2018, to: 2021, petrol: 126, diesel: 112, standard: "wltp" },
        { from: 2021, to: 2024, petrol: 129, hybrid: 37, standard: "wltp" },
      ],
    },
    DS4: {
      fuel: "petrol",
      ranges: [
        { from: 2022, to: 2025, petrol: 127, hybrid: 36, standard: "wltp" },
      ],
    },
    DS9: {
      fuel: "hybrid",
      ranges: [{ from: 2021, to: 2024, petrol: 33, standard: "wltp" }],
    },
  },

  Genesis: {
    G70: {
      fuel: "petrol",
      ranges: [{ from: 2021, to: 2024, petrol: 165, diesel: 149, standard: "wltp" }],
    },
    G80: {
      fuel: "petrol",
      ranges: [{ from: 2021, to: 2024, petrol: 209, standard: "wltp" }],
    },
    GV70: {
      fuel: "petrol",
      ranges: [
        { from: 2021, to: 2024, petrol: 186, electric: 0, standard: "wltp" },
      ],
    },
    GV80: {
      fuel: "petrol",
      ranges: [
        { from: 2021, to: 2024, petrol: 244, diesel: 168, standard: "wltp" },
      ],
    },
    "Electrified G80": {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    "Electrified GV70": {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
    GV60: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Infiniti: {
    Q50: {
      fuel: "petrol",
      ranges: [
        { from: 2014, to: 2019, petrol: 199, diesel: 139, standard: "nedc" },
        { from: 2020, to: 2023, petrol: 199, standard: "wltp" },
      ],
    },
    Q60: {
      fuel: "petrol",
      ranges: [{ from: 2017, to: 2019, petrol: 199, standard: "wltp" }],
    },
    QX30: {
      fuel: "petrol",
      ranges: [{ from: 2016, to: 2019, petrol: 149, diesel: 122, standard: "wltp" }],
    },
    QX70: {
      fuel: "petrol",
      ranges: [{ from: 2010, to: 2016, petrol: 249, diesel: 199, standard: "nedc" }],
    },
  },

  Isuzu: {
    Rodeo: {
      fuel: "diesel",
      ranges: [{ from: 2004, to: 2008, diesel: 249, standard: "nedc" }],
    },
    "D-Max": {
      fuel: "diesel",
      ranges: [
        { from: 2013, to: 2016, diesel: 197, standard: "nedc" },
        { from: 2017, to: 2020, diesel: 209, standard: "wltp" },
        { from: 2021, to: 2024, diesel: 199, standard: "wltp" },
      ],
    },
  },

  Lancia: {
    Delta: {
      fuel: "petrol",
      ranges: [{ from: 2009, to: 2014, petrol: 149, diesel: 134, standard: "nedc" }],
    },
    Ypsilon: {
      fuel: "petrol",
      ranges: [{ from: 2012, to: 2019, petrol: 108, diesel: 92, standard: "nedc" }],
    },
  },

  SsangYong: {
    Korando: {
      fuel: "diesel",
      ranges: [
        { from: 2011, to: 2016, diesel: 149, standard: "nedc" },
        { from: 2017, to: 2020, diesel: 158, standard: "wltp" },
      ],
    },
    Tivoli: {
      fuel: "petrol",
      ranges: [{ from: 2015, to: 2019, petrol: 139, diesel: 118, standard: "nedc" }],
    },
    Rexton: {
      fuel: "diesel",
      ranges: [
        { from: 2012, to: 2017, diesel: 199, standard: "nedc" },
        { from: 2018, to: 2022, diesel: 194, standard: "wltp" },
      ],
    },
    Musso: {
      fuel: "diesel",
      ranges: [{ from: 2018, to: 2024, diesel: 210, standard: "wltp" }],
    },
  },

  Chrysler: {
    "300C": {
      fuel: "petrol",
      ranges: [
        { from: 2006, to: 2010, petrol: 280, diesel: 229, standard: "nedc" },
        { from: 2011, to: 2014, petrol: 231, diesel: 185, standard: "nedc" },
      ],
    },
    300: {
      fuel: "petrol",
      ranges: [
        { from: 2015, to: 2019, petrol: 249, diesel: 169, standard: "wltp" },
      ],
    },
    Voyager: {
      fuel: "diesel",
      ranges: [{ from: 2008, to: 2012, diesel: 179, standard: "nedc" }],
    },
  },

  Rover: {
    25: {
      fuel: "petrol",
      ranges: [{ from: 2000, to: 2005, petrol: 162, diesel: 139, standard: "nedc" }],
    },
    45: {
      fuel: "petrol",
      ranges: [{ from: 2000, to: 2004, petrol: 162, diesel: 139, standard: "nedc" }],
    },
    75: {
      fuel: "petrol",
      ranges: [{ from: 2000, to: 2005, petrol: 209, diesel: 174, standard: "nedc" }],
    },
  },

  Lucid: {
    Air: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Rivian: {
    R1T: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
    R1S: {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  GMC: {
    "Hummer EV": {
      fuel: "electric",
      ranges: [{ from: 2023, to: 2026, electric: 0, standard: "wltp" }],
    },
  },

  Rimac: {
    Nevera: {
      fuel: "electric",
      ranges: [{ from: 2022, to: 2026, electric: 0, standard: "wltp" }],
    },
  },
};

// ── Make aliases (normalisation) ──
const ALIASES = {
  vw: "Volkswagen",
  merc: "Mercedes-Benz",
  mercedes: "Mercedes-Benz",
  alfa: "Alfa Romeo",
  landrover: "Land Rover",
  "land rover": "Land Rover",
  opel: "Vauxhall",
  vauxhall: "Vauxhall",
  chevy: "Chevrolet",
  rolls: "Rolls-Royce",
};

function norm(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

/**
 * Canonicalise a make name. Returns the canonical key from SPECS if known,
 * or null if the make is not in the knowledge base.
 */
function matchMake(name) {
  const key = norm(name);
  if (!key) return null;
  if (ALIASES[key]) return ALIASES[key];
  if (Object.prototype.hasOwnProperty.call(SPECS, name)) return name;
  const canon = Object.keys(SPECS).find((k) => norm(k) === key);
  return canon || null;
}

/**
 * Match a model name against a make's known models. Returns the canonical
 * model key, or null. Handles extra trim suffixes ("Golf GTI" → "Golf").
 */
function matchModel(make, model) {
  const canonMake = matchMake(make);
  if (!canonMake) return null;
  const models = SPECS[canonMake];
  if (!models) return null;
  const key = norm(model);
  if (!key) return null;
  const keys = Object.keys(models);
  const exact = keys.find((k) => norm(k) === key);
  if (exact) return exact;
  // prefix match: ad title may say "Golf GTI", "1 Series M Sport" etc.
  const prefix = keys
    .filter((k) => key.startsWith(norm(k) + " "))
    .sort((a, b) => b.length - a.length);
  return prefix[0] || null;
}

/* ── Source attribution ────────────────────────────────────────────
   Every figure in the KB is a typical/representative value. This map records
   where the data came from so the UI can attribute it honestly. */
const SOURCE_DEFAULT =
  "Typical official figures from UK VCA Car Fuel Data / manufacturer data (WLTP from 2018, NEDC before). Verify against the V5C.";
const MAKE_SOURCES = {
  Porsche: "Manufacturer official figures (Porsche GB) / VCA data.",
  BMW: "Manufacturer official figures (BMW UK) / VCA data.",
  Mercedes: "Manufacturer official figures (Mercedes-Benz UK) / VCA data.",
  Audi: "Manufacturer official figures (Audi UK) / VCA data.",
  "Land Rover": "Manufacturer official figures (Land Rover UK) / VCA data.",
  Volkswagen: "Manufacturer official figures (Volkswagen UK) / VCA data.",
  Ford: "Manufacturer official figures (Ford UK) / VCA data.",
  Tesla: "Manufacturer official figures — electric, 0 g/km.",
  Nissan: "Manufacturer official figures (Nissan UK) / VCA data.",
  Toyota: "Manufacturer official figures (Toyota UK) / VCA data.",
  Honda: "Manufacturer official figures (Honda UK) / VCA data.",
  Hyundai: "Manufacturer official figures (Hyundai UK) / VCA data.",
  Kia: "Manufacturer official figures (Kia UK) / VCA data.",
  Volvo: "Manufacturer official figures (Volvo UK) / VCA data.",
  Vauxhall: "Manufacturer official figures (Vauxhall UK) / VCA data.",
};

/** Describe where the spec figure for a car comes from. */
function sourceFor(make, model, year, fuelType) {
  const canon = matchMake(make);
  const m = findModel(canon, model);
  const fuel = normalizeFuel(fuelType) || (m && defaultFuel(canon, model, year));
  if (fuel === "electric" || (m && pickRange(m.ranges, year) && pickRange(m.ranges, year).electric != null)) {
    return "Electric vehicle — 0 g/km (no tailpipe emissions).";
  }
  if (canon && MAKE_SOURCES[canon]) return MAKE_SOURCES[canon];
  return SOURCE_DEFAULT;
}

/** Sorted canonical make list. */
const MAKES = Object.keys(SPECS).sort();

/** Sorted model list for a canonical make. */
function modelsFor(make) {
  const canon = matchMake(make);
  if (!canon) return [];
  return Object.keys(SPECS[canon]).sort();
}

/**
 * Typical default fuel type for a model near a given year.
 * Returns "petrol" | "diesel" | "electric" | "hybrid" | null.
 * Prefers the model's typical fuel when the era's range has a figure for it;
 * otherwise falls back by availability (electric > hybrid > diesel > petrol).
 */
function defaultFuel(make, model, year) {
  const m = findModel(make, model);
  if (!m) return null;
  const range = pickRange(m.ranges, year);
  if (!range) return m.fuel || "petrol";
  const fuel = m.fuel || "petrol";
  if (fuel === "electric" && range.electric != null) return "electric";
  if (fuel === "hybrid" && range.hybrid != null) return "hybrid";
  if (fuel === "diesel" && range.diesel != null) return "diesel";
  if (fuel === "petrol" && range.petrol != null) return "petrol";
  if (range.electric != null) return "electric";
  if (range.hybrid != null) return "hybrid";
  if (range.diesel != null) return "diesel";
  return "petrol";
}

/**
 * Pick the range that contains `year`; if the year predates the earliest
 * range use the earliest; if it postdates the latest use the latest.
 */
function pickRange(ranges, year) {
  const y = Number(year) || 0;
  if (!ranges || !ranges.length) return null;
  const hit = ranges.find((r) => y >= r.from && y <= r.to);
  if (hit) return hit;
  const sorted = ranges.slice().sort((a, b) => a.from - b.from);
  if (y < sorted[0].from) return sorted[0];
  return sorted[sorted.length - 1];
}

function findModel(make, model) {
  const canonMake = matchMake(make);
  if (!canonMake) return null;
  const m = matchModel(canonMake, model);
  if (!m) return null;
  return { make: canonMake, model: m, ranges: SPECS[canonMake][m].ranges, fuel: SPECS[canonMake][m].fuel };
}

function co2StandardFor(range, year) {
  if (range && range.standard) return range.standard;
  return year >= 2018 ? "wltp" : "nedc";
}

function typicalNox(fuel, standard) {
  if (fuel === "electric") return 0;
  const map = DEFAULT_NOX[standard] || DEFAULT_NOX.wltp;
  return map[fuel] != null ? map[fuel] : map.petrol;
}

/**
 * Look up typical specs for a known make/model/year.
 *
 * @param {string} make
 * @param {string} model
 * @param {number} year
 * @param {string} [fuelType] "petrol"|"diesel"|"electric"|"hybrid" — if omitted
 *        or no figure exists for it, falls back to the model's typical fuel.
 * @returns {object|null} { co2, co2Standard, fuelType, nox, make, model }
 *          or null when the make/model is not in the knowledge base.
 */
function lookup(make, model, year, fuelType) {
  const m = findModel(make, model);
  if (!m) return null;
  const range = pickRange(m.ranges, year);
  const standard = co2StandardFor(range, year);
  const fuel = normalizeFuel(fuelType) || defaultFuel(make, model, year);

  let co2 = null;
  if (fuel === "electric" || range.electric != null) {
    co2 = 0;
  } else if (fuel === "diesel" && range.diesel != null) {
    co2 = range.diesel;
  } else if (fuel === "hybrid" && range.hybrid != null) {
    co2 = range.hybrid;
  } else if (fuel === "hybrid" && range.hybrid == null && range.petrol != null) {
    co2 = range.petrol;
  } else if (fuel === "diesel" && range.diesel == null && range.petrol != null) {
    co2 = range.petrol; // e.g. petrol-only gen but user said diesel
  } else if (range.petrol != null) {
    co2 = range.petrol;
  } else if (range.hybrid != null) {
    co2 = range.hybrid;
  } else if (range.diesel != null) {
    co2 = range.diesel;
  }

  let nox = null;
  if (co2 != null) {
    const effFuel = co2 === 0 ? "electric" : fuel;
    nox = typicalNox(effFuel, standard);
  }

  return {
    make: m.make,
    model: m.model,
    co2,
    co2Standard: standard,
    fuelType: fuel,
    nox,
    source: sourceFor(make, model, year, fuel),
  };
}

function normalizeFuel(f) {
  const v = norm(f);
  if (v === "electric" || v === "ev" || v === "electricity") return "electric";
  if (v === "diesel") return "diesel";
  if (v === "hybrid" || v === "phev" || v === "hev" || v === "mild hybrid") return "hybrid";
  if (v === "petrol" || v === "gasoline") return "petrol";
  return null;
}

module.exports = { SPECS, MAKES, matchMake, matchModel, modelsFor, lookup, defaultFuel, normalizeFuel, sourceFor };
