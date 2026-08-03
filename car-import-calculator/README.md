# Car Import Cost Calculator (UK/NI → Ireland)

A standalone web app that estimates the **full one-time cost** of importing a used car
from **Great Britain** or **Northern Ireland** into the **Republic of Ireland**.

[![Rates Watch](https://github.com/familyai-cyber/beechdale-transport-live/actions/workflows/rates.yml/badge.svg)](https://github.com/familyai-cyber/beechdale-transport-live/actions/workflows/rates.yml)
[![Live site](https://img.shields.io/badge/live-site-blue)](https://familyai-cyber.github.io/car-import-calculator/)

Enter the car's make/model, year of first registration, CO₂ (g/km), NOx (mg/km, optional),
fuel type and UK purchase price, choose the registration origin and buyer type, and it
returns a full breakdown:

- GBP → EUR conversion (live rate, cached 6h, with fallback)
- Shipping / transport (editable, default €300)
- Customs duty — **10% for GB** (unless TCA UK-origin), **0% for NI**
- Import VAT (23%) — **all GB cars regardless of age**; **never for NI** (with proof)
- VRT (Vehicle Registration Tax) — 20 CO₂ bands (7%–41%) + band minimums + NOx levy
- EV VRT relief (up to €5,000 for registrations before 31 Dec 2026)
- Vehicle registration fee (€125) and NCT test (€60)
- Ongoing annual motor tax estimate (informational, not part of the import total)

## Why GB vs NI matters

Post-Brexit, **Northern Ireland** stays inside the EU customs union and VAT area, so a
car already registered there moves to Ireland with **no customs duty and no import VAT**
(with the right proof: V5C, NI-registered keeper, NI MOT/insurance). The same car
registered in **Great Britain** pays 10% duty and **23% import VAT on all imports,
regardless of age** (per current Revenue guidance).

A **VAT-registered dealer** buyer (e.g. a car company) can reclaim import VAT as input
VAT, so it is shown as reclaimable and excluded from the net total.

## Run

```bash
cd car-import-calculator
npm install
npm start        # http://localhost:3002
```

## Test

```bash
npm test         # all 4 suites: calculator (64) + listing-parser (45) +
                 # car-specs (27) + rates-watch (7) — deterministic, fixed FX
```

## Rate watcher

Tax rates change. [`test/rates-watch.test.js`](test/rates-watch.test.js) snapshots
every verified rate (duty, import VAT, VRT bands, EV relief, NOx tiers, fees, FX
fallback) so drift fails loudly. A GitHub Action at
[`.github/workflows/rates.yml`](../.github/workflows/rates.yml) runs it **every
Monday 06:00 UTC** and on any change to `tax-config.js` or the snapshot — update the
snapshot only after re-verifying a changed rate against the official source.

## Serverless listing proxy

GitHub Pages is static, so cross-origin listing fetches (Autotrader, usedcarsni)
rely on public CORS proxies that are flaky. A ready-to-deploy serverless proxy is
included at [`functions/parse-listing-proxy.js`](functions/parse-listing-proxy.js) —
it fetches the advert server-side (real user-agent, worker IP pool) and returns the
HTML with permissive CORS. Deploy once, then set the URL in
[`public/js/app.js`](public/js/app.js) `PROXIES[0]`:

```bash
npm i -g wrangler
wrangler deploy functions/parse-listing-proxy.js --name car-import-parser
# then set:  PROXIES[0] url -> https://car-import-parser.<your-subdomain>.workers.dev/?url=…
```

Until deployed, the app transparently falls back to the existing proxies.

## API

`POST /api/estimate` — body:

```json
{
  "origin": "GB",
  "buyerType": "private",
  "fuelType": "petrol",
  "co2Standard": "wltp",
  "ukPriceGBP": 18500,
  "co2": 118,
  "nox": 40,
  "firstRegYear": 2022,
  "shippingEUR": 300,
  "fxRate": 1.163
}
```

Returns `{ car, fx, breakdown, total, grandTotalInclVat, isDealer }`.

`GET /api/fx` — returns `{ eurPerGbp }` (live rate or fallback).

## Notes / caveats

- This is an **estimate**. VRT and duty are set by Revenue at registration, and VRT is
  charged on Revenue's official **OMSP**, which may differ from the estimate here.
- The OMSP is estimated as UK price + shipping + customs duty; use `omspOverride` to
  supply Revenue's official figure.
- CO₂ entered as **NEDC** is uplifted to WLTP automatically (diesel `NEDC×1.1405+12.858`,
  other `NEDC×0.9227+34.554`).
- EVs get up to €5,000 VRT relief (full below €40k OMSP, tapered to zero at €50k,
  registrations before 31 Dec 2026).
- If the car is UK-manufactured (or contains enough EU/UK-origin content), it may
  qualify for **0% duty** under the UK–EU Trade & Cooperation Agreement.
- The NOx levy is tiered (first 40 mg at €5/mg, 41–80 at €15/mg, over 80 at €25/mg)
  with no cap.

All rates live in [`src/tax-config.js`](src/tax-config.js) — a single source of truth.
