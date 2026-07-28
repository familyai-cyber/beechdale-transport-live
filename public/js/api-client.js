// ═══════════════════════════════════════════════════════════════════
// API Client – communicates with the backend proxy
// ═══════════════════════════════════════════════════════════════════

const API_BASE = "";

const ApiClient = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  // Fetch all stops
  async getStops() {
    const data = await this.get("/api/stops");
    return data.stops;
  },

  // Fetch departures for a specific stop
  async getDepartures(stopId) {
    return this.get(`/api/departures/${stopId}`);
  },

  // Fetch nearby departures
  async getNearby() {
    return this.get("/api/nearby");
  },

  // Get route info
  async getRoutes() {
    const data = await this.get("/api/routes");
    return data.routes;
  },

  // ── Luas ──────────────────────────────────────────────────────

  // Get Luas stops
  async getLuasStops() {
    const data = await this.get("/api/luas/stops");
    return data.stops;
  },

  // Get Luas forecast for a stop
  async getLuasForecast(stopCode) {
    return this.get(`/api/luas/forecast/${stopCode}`);
  },

  // ── Configuration ─────────────────────────────────────────────

  // Save NTA API key to server
  async saveApiKey(apiKey) {
    const res = await fetch(`${API_BASE}/api/configure/key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    return res.json();
  },

  // Check if API key is configured
  async checkApiKey() {
    return this.get("/api/configure/key");
  },

  // Get server status
  async getStatus() {
    return this.get("/api/status");
  },
};
