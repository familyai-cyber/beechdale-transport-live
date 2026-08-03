/**
 * Build a browser bundle from the CommonJS source modules.
 *
 * Outputs public/js/calc-bundle.js exposing window.CarCalc (the calculation
 * engine), window.CarListingParser (listing extraction) and window.CarSpecs
 * (known-car-specs knowledge base) — the same code used by the server, so the
 * app works fully client-side (required for static hosting such as GitHub
 * Pages).
 *
 * Run:  node scripts/build-browser.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = (f) => fs.readFileSync(path.join(ROOT, "src", f), "utf8");
const OUT = path.join(ROOT, "public", "js", "calc-bundle.js");

// Indent every line of a source file by `n` spaces.
function indent(text, n) {
  const pad = " ".repeat(n);
  return text
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n");
}

const taxConfigSrc = SRC("tax-config.js");
const calculatorSrc = SRC("calculator.js");
const listingParserSrc = SRC("listing-parser.js");
const carSpecsSrc = SRC("car-specs.js");

const banner = `/**
 * calc-bundle.js — AUTO-GENERATED from src/tax-config.js, src/calculator.js,
 * src/listing-parser.js and src/car-specs.js. Do not edit directly;
 * regenerate with:  node scripts/build-browser.js
 */
/* global window */
(function (global) {
  "use strict";

  function loadConfig() {
    var module = { exports: {} };
    (function (module) {
${indent(taxConfigSrc, 6)}
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
${indent(calculatorSrc, 6)}
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
${indent(listingParserSrc, 6)}
    })(module, require);
    return module.exports;
  }
  var listingParser = loadListingParser();

  function loadCarSpecs() {
    var module = { exports: {} };
    (function (module) {
${indent(carSpecsSrc, 6)}
    })(module);
    return module.exports;
  }
  var carSpecs = loadCarSpecs();

  global.CarCalc = calculator;
  global.CarListingParser = listingParser;
  global.CarSpecs = carSpecs;
})(typeof window !== "undefined" ? window : this);
`;

fs.writeFileSync(OUT, banner, "utf8");
console.log("Wrote " + path.relative(ROOT, OUT) + " (" + banner.split("\n").length + " lines)");
