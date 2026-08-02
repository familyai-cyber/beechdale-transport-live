/**
 * Car Import Cost Calculator – Server
 *
 * POST /api/estimate  → full import cost estimate for a UK/NI car into Ireland
 * GET  /api/fx        → current GBP→EUR rate
 */

const express = require("express");
const path = require("path");
const { calculate } = require("./src/calculator");
const { getEurPerGbp } = require("./src/exchange");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Estimate ────────────────────────────────────────────────────────
app.post("/api/estimate", async (req, res) => {
  const b = req.body || {};

  const origin = b.origin === "NI" ? "NI" : "GB";
  const buyerType = b.buyerType === "vat-dealer" ? "vat-dealer" : "private";

  const ukPriceGBP = Number(b.ukPriceGBP);
  if (!ukPriceGBP || ukPriceGBP <= 0) {
    return res.status(400).json({ error: "Please enter a valid UK price in £." });
  }
  const co2 = Number(b.co2);
  if (Number.isNaN(co2) || co2 < 0) {
    return res.status(400).json({ error: "Please enter a valid CO2 figure (g/km)." });
  }

  const fxRate = Number.isFinite(Number(b.fxRate)) ? Number(b.fxRate) : await getEurPerGbp();

  try {
    const result = calculate({
      origin,
      buyerType,
      ukPriceGBP,
      co2,
      nox: Number(b.nox) || 0,
      firstRegYear: b.firstRegYear ? Number(b.firstRegYear) : undefined,
      shippingEUR: b.shippingEUR ? Number(b.shippingEUR) : undefined,
      fxRate,
      omspOverride: b.omspOverride ? Number(b.omspOverride) : undefined,
    });

    res.json({
      car: {
        make: b.make || "",
        model: b.model || "",
        year: b.firstRegYear ? Number(b.firstRegYear) : null,
        origin,
        buyerType,
      },
      fx: { rate: result.breakdown.fxRate, source: "live-or-default" },
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── FX rate ─────────────────────────────────────────────────────────
app.get("/api/fx", async (req, res) => {
  const rate = await getEurPerGbp();
  res.json({ eurPerGbp: rate });
});

// ── Serve SPA ───────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║  🚗 Car Import Cost Calculator (UK/NI → IE)   ║
  ║  http://0.0.0.0:${String(PORT).padEnd(36)}║
  ╚═══════════════════════════════════════════════╝
  `);
});
