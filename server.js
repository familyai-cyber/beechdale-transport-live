/**
 * Beechdale Transport Live – Server
 *
 * Real-time transport dashboard for Beechdale, Ballycullen, Dublin 24.
 *
 * Data sources:
 *   🟢 Luas – free, no auth, real-time XML API (works NOW!)
 *   🟡 Dublin Bus – NTA GTFS Realtime API (free key from developer@nationaltransport.ie)
 *   🎯 Fallback – realistic mock data for demo
 */

require("dotenv").config();
const express = require("express");
const path = require("path");
const { stops, routes, getStopById, getRouteInfo } = require("./src/data/stops-ballycullen");
const { generateDepartures, generateAllNearby } = require("./src/api/mock-data");
const { fetchDepartures } = require("./src/api/tfi-proxy");
const { fetchLuasForecast, getLuasStops } = require("./src/api/luas-api");

const app = express();
const PORT = process.env.PORT || 3001;
const TFI_API_KEY = process.env.TFI_API_KEY || "DEMO_MODE";
const USE_MOCK = process.env.USE_MOCK_DATA !== "false";

// ── Middleware ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ── Bus Stop Routes ────────────────────────────────────────────────

app.get("/api/stops", (req, res) => res.json({ stops }));
app.get("/api/stops/:id", (req, res) => {
  const stop = getStopById(req.params.id);
  if (!stop) return res.status(404).json({ error: "Stop not found" });
  res.json({ stop });
});
app.get("/api/stops/by-route/:route", (req, res) => {
  res.json({ stops: stops.filter((s) => s.routes.includes(req.params.route)) });
});
app.get("/api/routes", (req, res) => res.json({ routes: Object.values(routes) }));
app.get("/api/routes/:number", (req, res) => {
  const route = getRouteInfo(req.params.number);
  if (!route) return res.status(404).json({ error: "Route not found" });
  res.json({ route });
});

// ── Bus Departures (NTA GTFS Realtime + mock fallback) ────────────

app.get("/api/departures/:stopId", async (req, res) => {
  const stopId = req.params.stopId;
  const stop = getStopById(stopId);
  if (!stop) return res.status(404).json({ error: "Stop not found" });

  try {
    let departures;
    const activeKey = configuredApiKey;
    if (activeKey === "DEMO_MODE") {
      departures = generateDepartures(stopId, 12);
    } else {
      departures = await fetchDepartures(stopId, activeKey);
    }
    res.json({
      stop: { id: stop.id, name: stop.name, road: stop.road, direction: stop.direction, description: stop.description, routes: stop.routes },
      departures,
      source: USE_MOCK || TFI_API_KEY === "DEMO_MODE" ? "mock" : "tfi",
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    const departures = generateDepartures(stopId, 8);
    res.json({
      stop: { id: stop.id, name: stop.name, road: stop.road, direction: stop.direction, description: stop.description, routes: stop.routes },
      departures,
      source: "mock-fallback",
      lastUpdated: new Date().toISOString(),
      error: err.message,
    });
  }
});

app.get("/api/nearby", (req, res) => {
  res.json({ stops: generateAllNearby(), lastUpdated: new Date().toISOString() });
});

// ── Luas Real-Time (works NOW, no auth required) ───────────────────

app.get("/api/luas/stops", (req, res) => {
  res.json({ stops: getLuasStops() });
});

app.get("/api/luas/forecast/:stopCode", async (req, res) => {
  try {
    const data = await fetchLuasForecast(req.params.stopCode);
    res.json({ ...data, source: "luas-live" });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ── API Key Configuration ─────────────────────────────────────────

// Store the API key in memory (persists until server restart)
let configuredApiKey = process.env.TFI_API_KEY || "DEMO_MODE";

// POST /api/configure/key – set the NTA API key
app.post("/api/configure/key", express.json(), (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || apiKey.trim().length < 10) {
    return res.status(400).json({ error: "Invalid API key" });
  }
  configuredApiKey = apiKey.trim();
  console.log(`\n  🔑 NTA API key configured via UI`);
  res.json({ success: true, message: "API key saved. Bus data will now use live mode." });
});

// GET /api/configure/key – check if key is configured
app.get("/api/configure/key", (req, res) => {
  res.json({ configured: configuredApiKey !== "DEMO_MODE" });
});

// Update the departures handler to use the configured key
// Override the env-based key with the UI-configured key
// ── Status ─────────────────────────────────────────────────────────

app.get("/api/status", (req, res) => {
  res.json({
    status: "running",
    busMode: configuredApiKey === "DEMO_MODE" ? "demo" : "live",
    luasMode: "live",
    apiKeyConfigured: configuredApiKey !== "DEMO_MODE",
    busStops: stops.length,
    luasStops: getLuasStops().length,
    routes: Object.keys(routes),
    port: PORT,
  });
});

// ── Serve SPA ──────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🚌 Beechdale Transport Live            ║
  ║   Running on http://0.0.0.0:${PORT}         ║
  ║   Bus mode: ${(USE_MOCK || TFI_API_KEY === "DEMO_MODE" ? "DEMO 🎯" : "LIVE 🟢").padEnd(28)}║
  ║   Luas mode: LIVE 🟢                    ║
  ║   Bus stops: ${String(stops.length).padEnd(21)} Luas stops: ${String(getLuasStops().length).padEnd(8)}║
  ║   Routes: ${Object.keys(routes).join(", ").padEnd(29)}║
  ╚══════════════════════════════════════════╝
  `);
});
