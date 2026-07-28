// ═══════════════════════════════════════════════════════════════════
// API Client — now uses client-side data module (no backend needed)
// ═══════════════════════════════════════════════════════════════════

const ApiClient = {
  async getStops() { return BusData.stops; },
  async getRoutes() { return Object.values(BusData.routes); },

  async getDepartures(stopId) {
    const stop = BusData.getStop(stopId);
    if (!stop) throw new Error("Stop not found");
    return {
      stop: { id:stop.id, name:stop.name, road:stop.road, direction:stop.direction, description:stop.description, routes:stop.routes },
      departures: MockData.generate(stopId, 12),
      source: "mock",
      lastUpdated: new Date().toISOString(),
    };
  },

  async getNearby() {
    return { stops: MockData.allNearby(), lastUpdated: new Date().toISOString() };
  },

  async getLuasStops() { return LuasData.stops; },
  async getLuasForecast(stopCode) { return LuasData.forecast(stopCode); },

  async getStatus() {
    return { status:"running", busMode:"demo", luasMode:"live", apiKeyConfigured:false, busStops:BusData.stops.length, luasStops:LuasData.stops.length, routes:Object.keys(BusData.routes) };
  },

  async saveApiKey(key) {
    localStorage.setItem("btl_nta_key", key);
    return { success: true };
  },
  async checkApiKey() {
    const key = localStorage.getItem("btl_nta_key");
    return { configured: !!key && key.length > 10 };
  },
};
