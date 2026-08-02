# Car Import Cost Calculator (UK/NI → Ireland)

A standalone web app that estimates the **full one-time cost** of importing a used car
from **Great Britain** or **Northern Ireland** into the **Republic of Ireland**.

Enter the car's make/model, year of first registration, CO₂ (g/km) and UK purchase
price, choose the registration origin and buyer type, and it returns a full breakdown:

- GBP → EUR conversion (live rate, cached 6h, with fallback)
- Shipping / transport (editable)
- Customs duty — **10% for GB** (unless TCA UK-origin), **0% for NI**
- Import VAT (23%) — **GB cars first registered on/after 1 Jan 2021 only**; NI never
- VRT (Vehicle Registration Tax) by CO₂ band + NOx levy
- Vehicle registration fee (€125) and NCT test (~€55)
- Ongoing annual motor tax estimate (informational)

The **GB vs NI** difference matters post-Brexit: NI is inside the EU customs union and
VAT area, so NI cars attract no customs duty and no import VAT. A **VAT-registered
dealer** buyer (e.g. a car company) can reclaim import VAT as input VAT, so it is shown
as reclaimable and excluded from the net total.

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
  "ukPriceGBP": 20000,
  "co2": 120,
  "nox": 40,
  "firstRegYear": 2022,
  "shippingEUR": 1200
}
```

Returns `{ car, fx, breakdown, total, grandTotalInclVat, isDealer }`.

## Notes / caveats

- This is an **estimate**. VRT and duty are set by Revenue at registration, and VRT is
  charged on Revenue's official **OMSP**, which may differ from the estimate here.
- The OMSP is estimated as UK price + shipping + customs duty.
- Electric cars may qualify for VRT relief — check current Revenue rules.
- If the car is UK-manufactured (or contains enough EU/UK-origin content), it may
  qualify for **0% duty** under the UK–EU Trade & Cooperation Agreement.

All rates live in [`src/tax-config.js`](src/tax-config.js) — a single source of truth.
