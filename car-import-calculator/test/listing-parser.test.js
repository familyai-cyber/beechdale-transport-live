/**
 * Listing parser tests (node:assert, no framework).
 * Run: node test/listing-parser.test.js
 *
 * Realistic fixtures for Autotrader UK (JSON-LD), NI Cars (carsni.com)
 * and generic/done deal style pages.
 */

const assert = require("assert");
const {
  extractListing,
  parsePrice,
  parseYear,
  extractCo2,
  detectOrigin,
  detectFuelType,
} = require("../src/listing-parser");

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2714 ${name}`);
  } catch (err) {
    failed++;
    console.error(`  \u2718 ${name}\n    ${err.message}`);
  }
}

// ── Fixtures ────────────────────────────────────────────────────────────

// Autotrader UK style — schema.org Car in JSON-LD + og tags
const AUTOTRADER_HTML = `
<html>
<head>
  <title>2019 Volkswagen Golf 1.5 TSI Match - Autotrader</title>
  <meta property="og:title" content="2019 Volkswagen Golf 1.5 TSI Match 5dr">
  <meta property="og:type" content="product">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Car",
    "brand": { "@type": "Brand", "name": "Volkswagen" },
    "model": "Golf 1.5 TSI Match",
    "productionDate": "2019-03-14",
    "vehicleModelDate": "2019",
    "mileageFromOdometer": { "value": "31000", "unitCode": "KMT" },
    "vehicleEngine": { "fuelType": "Petrol" },
    "offers": {
      "@type": "Offer",
      "price": "12995.00",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body>
  <h1>2019 Volkswagen Golf 1.5 TSI Match</h1>
  <p>CO2 emissions: 112 g/km</p>
  <p>Fuel type: Petrol</p>
</body>
</html>
`;

// NI Cars (carsni.com) style — og tags, GBP price, NI plate format ABC 1234
const NICS_HTML = `
<html>
<head>
  <title>2018 Ford Focus 1.5 TDCI Zetec For Sale | CarsNI</title>
  <meta property="og:title" content="2018 Ford Focus 1.5 TDCI Zetec">
  <meta property="og:price:amount" content="7995">
  <meta property="og:price:currency" content="GBP">
  <meta property="og:site_name" content="Cars NI">
</head>
<body>
  <div class="reg">WLZ 1234</div>
  <div class="mileage">48,000 miles</div>
  <p>Northern Ireland car for sale.</p>
  <p>Diesel</p>
</body>
</html>
`;

// DoneDeal style (Irish site, EUR price, no JSON-LD)
const DONEDEAL_HTML = `
<html>
<head>
  <title>2020 BMW 320d M Sport for sale in Dublin</title>
  <meta property="og:title" content="2020 BMW 320d M Sport for sale in Dublin">
</head>
<body>
  <div class="price">€16,950</div>
  <div class="spec"><strong>Year:</strong> 2020</div>
  <div class="spec"><strong>CO2:</strong> 119 g/km</div>
  <p>Diesel car, 320d M Sport, BMW.</p>
</body>
</html>
`;

// usedcarsni.com style — JSON-LD Car with price + nested priceSpecification currency
const USEDCARSNI_HTML = `
<html>
<head>
  <title>Used 2022 Porsche Taycan 350kW 4 93kWh 5dr Auto For Sale | Used Cars NI</title>
  <meta property="og:title" content="Used 2022 Porsche Taycan 350kW 4 93kWh 5dr Auto For Sale | Used Cars NI">
  <meta property="og:description" content="&pound;49,440 &middot; 14500 Miles &middot; County Down">
</head>
<body>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Car",
    "name": "2022 Porsche Taycan 350kW 4 93kWh 5dr Auto",
    "brand": { "@type": "Brand", "name": "Porsche" },
    "offers": {
      "@type": "Offer",
      "price": "49440",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "GBP",
        "valueAddedTaxIncluded": "true"
      },
      "availability": "InStock",
      "seller": { "@type": "Organization", "name": "Bells Crossgar" }
    }
  }
  </script>
  <p>Battery electric car for sale at &pound;49,440 from County Down, Northern Ireland.</p>
</body>
</html>
`;

// Bare HTML with minimal structure
const BARE_HTML = `
<html><head><title>Vauxhall Corsa 1.4 2015</title></head>
<body>
  <p>£4,299</p>
  <p>62,000 miles</p>
  <p>Petrol</p>
</body></html>
`;

// GB current plate (YY format) in text to derive year
const GBPLATE_HTML = `
<html><head><title>Vauxhall Corsa 1.4</title></head>
<body>
  <p>£4,299</p>
  <p>Reg: SG 14 BWW</p>
</body></html>
`;

// ── parsePrice / parseYear / extractCo2 / detectFuelType units ──────────
check("parsePrice: £1,299", () => {
  const p = parsePrice("£1,299");
  assert.strictEqual(p.amount, 1299);
  assert.strictEqual(p.currency, "GBP");
});
check("parsePrice: €16,950", () => {
  const p = parsePrice("€16,950");
  assert.strictEqual(p.amount, 16950);
  assert.strictEqual(p.currency, "EUR");
});
check("parsePrice: GBP 7995", () => {
  const p = parsePrice("GBP 7995");
  assert.strictEqual(p.amount, 7995);
  assert.strictEqual(p.currency, "GBP");
});
check("parsePrice: null for 'no price'", () => {
  assert.strictEqual(parsePrice("no price shown"), null);
});
check("parseYear: 2020 from text", () => {
  assert.strictEqual(parseYear("2020 BMW 320d"), 2020);
});
check("parseYear: null for 1985 (out of range)", () => {
  assert.strictEqual(parseYear("from 1985 to today"), null);
});
check("extractCo2: 119 g/km", () => {
  assert.strictEqual(extractCo2("CO2: 119 g/km"), 119);
});
check("extractCo2: 112g/km", () => {
  assert.strictEqual(extractCo2("emissions 112g/km"), 112);
});
check("detectFuelType: diesel", () => {
  assert.strictEqual(detectFuelType("1.5 TDCI Diesel"), "diesel");
});
check("detectFuelType: electric wins", () => {
  assert.strictEqual(detectFuelType("Electric vehicle"), "electric");
});
check("detectFuelType: hybrid", () => {
  assert.strictEqual(detectFuelType("Hybrid"), "hybrid");
});

// ── detectOrigin ─────────────────────────────────────────────────────────
check("detectOrigin: NI plate ABC 1234", () => {
  assert.strictEqual(detectOrigin("https://www.carsni.com/ford", "Reg: ABC 1234"), "NI");
});
check("detectOrigin: Northern Ireland phrase", () => {
  assert.strictEqual(detectOrigin("https://x.com/car", "Located in Northern Ireland"), "NI");
});
check("detectOrigin: GB current plate SG14BWW", () => {
  assert.strictEqual(detectOrigin("https://www.autotrader.co.uk/x", "Reg: SG 14 BWW"), "GB");
});
check("detectOrigin: null when no reg found", () => {
  assert.strictEqual(detectOrigin("https://www.donedeal.ie/cars/x", "Just a 2020 car"), null);
});
check("detectOrigin: 'TSI 2019' is not an NI plate", () => {
  assert.strictEqual(detectOrigin("https://www.autotrader.co.uk/x", "2019 Volkswagen Golf 1.5 TSI 2019"), null);
});
check("detectOrigin: 'GTI 22000' mileage is not an NI plate", () => {
  assert.strictEqual(detectOrigin("https://x.com/car", "Golf GTI 22000 miles"), null);
});
check("detectOrigin: 'BMW 320i 2019' is not an NI plate", () => {
  assert.strictEqual(detectOrigin("https://x.com/car", "BMW 320i 2019"), null);
});
check("detectOrigin: post-2019 NI plate AB 12345", () => {
  assert.strictEqual(detectOrigin("https://www.carsni.com/x", "Reg: AB 12345"), "NI");
});

// ── extractListing end-to-end ────────────────────────────────────────────
const FX = 1.163;

check("Autotrader: JSON-LD Car extracted", () => {
  const r = extractListing("https://www.autotrader.co.uk/car-details/123", AUTOTRADER_HTML, { fxRate: FX });
  assert.strictEqual(r.make, "Volkswagen");
  assert.strictEqual(r.model, "Golf 1.5 TSI Match");
  assert.strictEqual(r.year, 2019);
  assert.strictEqual(r.priceGBP, 12995);
  assert.strictEqual(r.currency, "GBP");
  assert.strictEqual(r.co2, 112);
  assert.strictEqual(r.fuelType, "petrol");
  assert.ok(r.sources.includes("json-ld"));
  assert.ok(r.confidence >= 0.8, "confidence should be high, got " + r.confidence);
});

check("Autotrader: priceEUR converts at FX rate", () => {
  const r = extractListing("https://www.autotrader.co.uk/car-details/123", AUTOTRADER_HTML, { fxRate: FX });
  assert.ok(Math.abs(r.priceEUR - 12995 * FX) < 1, "priceEUR=" + r.priceEUR);
  assert.strictEqual(r.fxRateUsed, FX);
});

check("NI Cars: og meta + NI plate → NI origin, GBP price", () => {
  const r = extractListing("https://www.carsni.com/focus", NICS_HTML, { fxRate: FX });
  assert.strictEqual(r.make, "Ford");
  assert.strictEqual(r.model.includes("Focus"), true);
  assert.strictEqual(r.year, 2018);
  assert.strictEqual(r.priceGBP, 7995);
  assert.strictEqual(r.currency, "GBP");
  assert.strictEqual(r.origin, "NI");
  assert.strictEqual(r.fuelType, "diesel");
});

check("DoneDeal: EUR price converted to GBP", () => {
  const r = extractListing("https://www.donedeal.ie/cars/320d", DONEDEAL_HTML, { fxRate: FX });
  assert.strictEqual(r.make, "BMW");
  assert.strictEqual(r.model, "320d M Sport");
  assert.strictEqual(r.year, 2020);
  assert.strictEqual(r.currency, "EUR");
  assert.ok(Math.abs(r.priceGBP - 16950 / FX) < 1, "priceGBP=" + r.priceGBP);
  assert.strictEqual(r.priceEUR, 16950);
  assert.strictEqual(r.co2, 119);
  assert.strictEqual(r.fuelType, "diesel");
});

check("Autotrader URL-only: make/model from URL slug", () => {
  const r = extractListing("https://www.autotrader.co.uk/cars/volkswagen/golf/abc12345", "", { fxRate: FX });
  assert.strictEqual(r.make, "Volkswagen");
  assert.ok(r.model.includes("Golf"), "model=" + r.model);
  assert.ok(r.sources.includes("url"), "sources=" + r.sources);
  assert.strictEqual(r.priceGBP, null);
  assert.ok(r.confidence >= 0.2 && r.confidence <= 0.4, "confidence=" + r.confidence);
});

check("cars.ni URL-only: year + make from URL slug", () => {
  const r = extractListing("https://cars.ni/used/2023-volkswagen-golf-2-0-tsi-gti-clubsport-dsg/", "", { fxRate: FX });
  assert.strictEqual(r.year, 2023);
  assert.strictEqual(r.make, "Volkswagen");
  assert.ok(r.model.includes("Golf"), "model=" + r.model);
});

check("Autotrader URL + empty body: year from slug not a false year", () => {
  const r = extractListing("https://www.autotrader.co.uk/car-details/20240201123456", "<html><body></body></html>", { fxRate: FX });
  assert.strictEqual(r.year, null);
  assert.strictEqual(r.make, null);
});

check("Bare HTML: regex price + year from title", () => {
  const r = extractListing("https://example.com/ad/42", BARE_HTML, { fxRate: FX });
  assert.strictEqual(r.make, "Vauxhall");
  assert.strictEqual(r.model.includes("Corsa"), true);
  assert.strictEqual(r.year, 2015);
  assert.strictEqual(r.priceGBP, 4299);
  assert.strictEqual(r.currency, "GBP");
  assert.strictEqual(r.fuelType, "petrol");
});

check("GB plate: year derived from SG 14 BWW → 2014", () => {
  const r = extractListing("https://example.com/ad/43", GBPLATE_HTML, { fxRate: FX });
  assert.strictEqual(r.year, 2014);
  assert.strictEqual(r.origin, "GB");
});

check("Unknown gibberish: graceful low-confidence result", () => {
  const r = extractListing("https://example.com/x", "<html><body><p>hello world</p></body></html>", { fxRate: FX });
  assert.strictEqual(r.priceGBP, null);
  assert.strictEqual(r.year, null);
  assert.ok(r.confidence <= 0.3, "confidence should be low, got " + r.confidence);
});

check("usedcarsni: JSON-LD price with nested priceSpecification currency", () => {
  const r = extractListing(
    "https://www.usedcarsni.com/2022-Porsche-Taycan-350kW-4-93kWh-5dr-Auto-399157019?make=23&model=236993045&keywords=&fuel_type=0&trans_type=0&age_from=0&age_to=0&price_from=0&price_to=0&user_type=0&mileage_to=0&body_style=0&location%5B%5D=0&location%5B%5D=0&homepage_search_attr=1&tab_id=0&search_type=1",
    USEDCARSNI_HTML,
    { fxRate: FX }
  );
  assert.strictEqual(r.make, "Porsche");
  assert.ok(r.model.includes("Taycan"), "model=" + r.model);
  assert.strictEqual(r.year, 2022);
  assert.strictEqual(r.priceGBP, 49440);
  assert.strictEqual(r.currency, "GBP");
  assert.ok(Math.abs(r.priceEUR - 49440 * FX) < 1, "priceEUR=" + r.priceEUR);
  assert.strictEqual(r.origin, "NI");
  assert.strictEqual(r.fuelType, "electric");
  assert.ok(r.sources.includes("json-ld"), "sources=" + r.sources);
});

check("usedcarsni: JSON-LD price with no currency falls back to visible text", () => {
  const html = USEDCARSNI_HTML.replace('"priceCurrency": "GBP"', '"priceCurrency": ""');
  const r = extractListing("https://www.usedcarsni.com/2022-Porsche-Taycan-350kW-4-93kWh-5dr-Auto-399157019", html, { fxRate: FX });
  assert.strictEqual(r.priceGBP, 49440);
  assert.strictEqual(r.currency, "GBP");
});

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
