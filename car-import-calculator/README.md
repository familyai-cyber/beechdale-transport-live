# Car Import Cost Calculator (UK/NI → Ireland)

A standalone web app that estimates the **full one-time cost** of importing a used car
from **Great Britain** or **Northern Ireland** into the **Republic of Ireland**.

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
npm test         # deterministic unit tests (fixed FX)
```

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
