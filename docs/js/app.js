// ═══════════════════════════════════════════════════════════════════
// App – main application controller
// ═══════════════════════════════════════════════════════════════════

const App = {
  stops: [],
  luasStops: [],
  favourites: [],
  currentView: "stops",
  currentStopId: null,
  currentLuasStop: null,
  routeFilter: "all",
  updateTimer: null,

  // ── Init ────────────────────────────────────────────────────────
  async init() {
    this.favourites = Utils.getStorage("favourites", []);

    // Load bus stops from API
    try {
      this.stops = await ApiClient.getStops();
    } catch (e) {
      console.error("Failed to load stops:", e);
    }

    // Load Luas stops from API
    try {
      this.luasStops = await ApiClient.getLuasStops();
    } catch (e) {
      console.error("Failed to load luas stops:", e);
    }

    // Load theme preference
    const theme = Utils.getStorage("theme", "light");
    document.documentElement.setAttribute("data-theme", theme);
    document.getElementById("themeToggle").textContent = theme === "dark" ? "☀️" : "🌙";

    // Set greeting
    this.updateGreeting();

    // Set up event listeners
    this.setupListeners();

    // Initial render
    this.renderStops();
    this.updateNextBusTile();

    // Start auto-refresh timer
    this.startAutoRefresh();

    // Set status bar time
    this.updateStatusTime();
    setInterval(() => this.updateStatusTime(), 10000);

    // Load server status for info modal
    this.loadStatus();
  },

  // ── Event Listeners ─────────────────────────────────────────────
  setupListeners() {
    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => this.toggleTheme());

    // Info modal
    document.getElementById("infoBtn").addEventListener("click", () => {
      Utils.show(document.getElementById("infoModal"));
    });
    document.getElementById("modalClose").addEventListener("click", () => {
      Utils.hide(document.getElementById("infoModal"));
    });
    document.getElementById("infoModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) Utils.hide(document.getElementById("infoModal"));
    });

    // Settings modal
    document.getElementById("settingsBtn").addEventListener("click", () => {
      Utils.show(document.getElementById("settingsModal"));
      this.loadApiKeyStatus();
    });
    document.getElementById("settingsModalClose").addEventListener("click", () => {
      Utils.hide(document.getElementById("settingsModal"));
    });
    document.getElementById("settingsModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) Utils.hide(document.getElementById("settingsModal"));
    });
    document.getElementById("saveApiKeyBtn").addEventListener("click", () => this.saveApiKey());

    // Stop search
    const searchInput = document.getElementById("stopSearch");
    searchInput.addEventListener("input", Utils.debounce(() => this.filterStops(searchInput.value), 150));

    // Route pills
    document.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        this.routeFilter = pill.dataset.route;
        this.renderStops();
      });
    });

    // Bottom nav
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.switchView(btn.dataset.view);
      });
    });

    // Back button
    document.getElementById("backBtn").addEventListener("click", () => this.backToStops());
  },

  // ── Theme ───────────────────────────────────────────────────────
  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    Utils.setStorage("theme", next);
    document.getElementById("themeToggle").textContent = next === "dark" ? "☀️" : "🌙";
  },

  // ── Greeting ────────────────────────────────────────────────────
  updateGreeting() {
    const h = new Date().getHours();
    let greeting = "Good evening";
    let icon = "🌙";
    if (h < 5) { greeting = "Late night?"; icon = "🌙"; }
    else if (h < 12) { greeting = "Good morning"; icon = "☀️"; }
    else if (h < 14) { greeting = "Good afternoon"; icon = "🌤️"; }
    else if (h < 18) { greeting = "Good afternoon"; icon = "🌤️"; }
    else { greeting = "Good evening"; icon = "🌆"; }
    document.getElementById("greetingText").textContent = greeting;
    document.querySelector(".greeting-icon").textContent = icon;
  },

  // ── Next Bus Tile ──────────────────────────────────────────────
  async updateNextBusTile() {
    const body = document.getElementById("nextBusBody");
    try {
      const data = await ApiClient.getNearby();
      const allDeps = [];
      for (const item of data.stops) {
        for (const dep of item.departures) {
          allDeps.push({ ...dep, stopName: item.stop.name, stopId: item.stop.id });
        }
      }
      allDeps.sort((a, b) => a.dueMinutes - b.dueMinutes);
      const next = allDeps.slice(0, 3);
      if (next.length === 0) {
        body.innerHTML = '<div class="nextbus-loading">No upcoming departures</div>';
        return;
      }
      body.innerHTML = next.map((d, i) => `
        <div class="nextbus-row" style="cursor:pointer" data-stop="${d.stopId}">
          <span class="nb-route"><span class="route-badge" style="background:${Utils.getRouteColor(d.route)}">${d.route}</span></span>
          <span class="nb-dest">${d.destination || "City Centre"}</span>
          <span class="nb-time">${d.dueMinutes <= 1 ? "NOW" : d.dueMinutes + "m"}</span>
        </div>
        ${i < next.length - 1 ? '<div style="border-top:1px solid rgba(255,255,255,0.15);"></div>' : ""}
      `).join("");
      body.querySelectorAll(".nextbus-row").forEach((el) => {
        el.addEventListener("click", () => this.showDepartures(el.dataset.stop));
      });
      document.getElementById("nextBusSource").textContent =
        data.stops[0]?.departures[0]?.isRealtime ? "Live 🟢" : "Demo 🎯";
    } catch (e) {
      body.innerHTML = '<div class="nextbus-loading">Next bus unavailable</div>';
    }
  },

  // ── Views ───────────────────────────────────────────────────────
  switchView(view) {
    this.currentView = view;
    const container = document.getElementById("stopSelector");
    const depSection = document.getElementById("departureSection");
    container.style.display = "";
    depSection.style.display = "none";
    // Hide map
    document.getElementById("stopMap").style.display = "none";
    if (this._currentMap) { try { this._currentMap.remove(); } catch(e) {} this._currentMap = null; }

    // Close any open modals
    document.getElementById("infoModal").style.display = "none";
    document.getElementById("settingsModal").style.display = "none";

    switch (view) {
      case "stops":
        this.renderStops();
        this.updateNextBusTile();
        break;
      case "luas":
        this.renderLuas();
        break;
      case "nearby":
        this.renderNearby();
        break;
      case "routes":
        this.renderRoutes();
        break;
    }
  },

  // ── Render Stops ────────────────────────────────────────────────
  renderStops(filterText = "") {
    const container = document.getElementById("stopSelector");
    const depSection = document.getElementById("departureSection");
    container.style.display = "";
    depSection.style.display = "none";

    // Rebuild search + grid
    container.innerHTML = `
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="stopSearch" placeholder="Search stops, routes..." autocomplete="off" />
      </div>
      <div class="stops-grid" id="stopsGrid"></div>
    `;

    document.getElementById("stopSearch").addEventListener("input",
      Utils.debounce(() => this.filterStops(document.getElementById("stopSearch").value), 150)
    );

    this.filterStops(filterText || document.getElementById("stopSearch")?.value || "");
    this.renderFavourites();
  },

  filterStops(query) {
    const grid = document.getElementById("stopsGrid");
    if (!grid) return;

    let filtered = this.stops;

    // Apply route filter
    if (this.routeFilter !== "all") {
      filtered = filtered.filter((s) => s.routes.includes(this.routeFilter));
    }

    // Apply text search
    const q = query.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.road.toLowerCase().includes(q) ||
          s.routes.some((r) => r.includes(q))
      );
    }

    grid.innerHTML = "";
    for (const stop of filtered) {
      grid.appendChild(Components.stopCard(stop, this.favourites.includes(stop.id)));
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="loading">No stops found</div>`;
    }
  },

  // ── Render Favourites ───────────────────────────────────────────
  renderFavourites() {
    const bar = document.getElementById("favesBar");
    const list = document.getElementById("favesList");
    if (this.favourites.length === 0) {
      bar.style.display = "none";
      return;
    }
    bar.style.display = "";
    list.innerHTML = this.favourites
      .map((id) => {
        const stop = this.stops.find((s) => s.id === id);
        if (!stop) return "";
        return `<span class="fave-chip" data-stop-id="${stop.id}">${stop.name}</span>`;
      })
      .join("");

    list.querySelectorAll(".fave-chip").forEach((chip) => {
      chip.addEventListener("click", () => this.showDepartures(chip.dataset.stopId));
    });
  },

  // ── Toggle Favourite ────────────────────────────────────────────
  toggleFavourite(stopId) {
    const idx = this.favourites.indexOf(stopId);
    if (idx === -1) {
      this.favourites.push(stopId);
      Utils.toast("⭐ Added to favourites");
    } else {
      this.favourites.splice(idx, 1);
      Utils.toast("Removed from favourites");
    }
    Utils.setStorage("favourites", this.favourites);
    this.renderStops(document.getElementById("stopSearch")?.value || "");
  },

  // ── Show Departures ────────────────────────────────────────────
  async showDepartures(stopId) {
    this.currentStopId = stopId;
    const container = document.getElementById("stopSelector");
    const depSection = document.getElementById("departureSection");

    container.style.display = "none";
    depSection.style.display = "";

    const stop = this.stops.find((s) => s.id === stopId);
    if (stop) {
      document.getElementById("depStopName").textContent = stop.name;
      document.getElementById("depStopDesc").textContent = `${stop.road} · ${stop.direction}`;

      // Render map
      this.renderStopMap(stop);
    }

    await this.loadDepartures(stopId);
  },

  renderStopMap(stop) {
    const mapContainer = document.getElementById("stopMap");
    if (!stop.lat || !stop.lng) { mapContainer.style.display = "none"; mapContainer.innerHTML = ""; return; }

    // Destroy previous Leaflet map instance if any
    if (this._currentMap) {
      try { this._currentMap.remove(); } catch(e) {}
      this._currentMap = null;
    }

    // Use OpenStreetMap embed iframe - works reliably, no external JS dependencies
    const margin = 0.008;
    const bbox = `${stop.lng - margin},${stop.lat - margin},${stop.lng + margin},${stop.lat + margin}`;
    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${stop.lat},${stop.lng}`;

    mapContainer.style.display = "";
    mapContainer.innerHTML = `
      <div style="position:relative;height:180px;border-radius:var(--radius-sm);overflow:hidden;background:var(--bg-pill);">
        <iframe src="${embedUrl}" style="width:100%;height:100%;border:none;" loading="lazy" title="Map of ${stop.name}"></iframe>
        <a href="https://www.openstreetmap.org/?mlat=${stop.lat}&mlon=${stop.lng}&zoom=15" target="_blank" style="position:absolute;bottom:2px;right:4px;font-size:9px;color:rgba(0,0,0,0.5);background:rgba(255,255,255,0.8);padding:1px 6px;border-radius:3px;text-decoration:none;">OpenStreetMap</a>
      </div>
    `;
  },

  async loadDepartures(stopId) {
    const board = document.getElementById("departureBoard");
    board.innerHTML = '<div class="loading">⏳ Loading departures…</div>';

    try {
      const data = await ApiClient.getDepartures(stopId);

      if (data.departures.length === 0) {
        board.innerHTML = '<div class="empty-state"><div class="empty-icon">🚌</div><div class="empty-title">No departures</div><div class="empty-desc">Check back soon</div></div>';
        return;
      }

      board.innerHTML = "";
      data.departures.forEach((dep, i) => {
        const card = Components.departureCard(dep);
        card.style.animationDelay = `${i * 0.06}s`;
        board.appendChild(card);
      });

      // Update status
      const sourceTag = data.source === "tfi" ? "Live 🟢" : data.source === "mock" ? "Demo 🎯" : "Demo (fallback)";
      document.getElementById("statusText").textContent = sourceTag;

    } catch (e) {
      board.innerHTML = `<div class="loading">⚠️ Could not load departures<br><small>${e.message}</small></div>`;
    }
  },

  // ── Luas View ──────────────────────────────────────────────────
  async renderLuas() {
    const container = document.getElementById("stopSelector");
    container.style.display = "";
    document.getElementById("departureSection").style.display = "none";

    container.innerHTML = `
      <div style="margin-bottom:12px;padding:12px 16px;background:var(--bg-card);border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;">🚊</span>
        <span style="font-size:13px;color:var(--text-secondary);"><strong>Live Luas times</strong> — Green Line</span>
        <span style="margin-left:auto;padding:2px 10px;background:rgba(16,185,129,0.15);color:var(--green);border-radius:var(--radius-pill);font-size:11px;font-weight:700;">LIVE</span>
      </div>
      <div class="stops-grid" id="luasGrid"></div>
    `;

    const grid = document.getElementById("luasGrid");
    if (!this.luasStops.length) {
      grid.innerHTML = '<div class="loading">No Luas stops available</div>';
      return;
    }

    // Show Green Line stops first (most relevant), then Red Line
    const green = this.luasStops.filter((s) => s.line === "Green");
    const red = this.luasStops.filter((s) => s.line === "Red");

    for (const stop of [...green, ...red]) {
      const card = document.createElement("div");
      card.className = "stop-card";
      card.innerHTML = `
        <span class="stop-icon">🚊</span>
        <div class="stop-info">
          <div class="stop-name">${stop.name}</div>
          <div class="stop-road" style="color:${stop.line === "Green" ? "#00985F" : "#DA291C"};font-weight:600;">${stop.line} Line</div>
        </div>
        <span style="font-size:12px;color:var(--text-muted);">${stop.code}</span>
      `;
      card.addEventListener("click", () => this.showLuasForecast(stop.code, stop.name));
      grid.appendChild(card);
    }
  },

  async showLuasForecast(stopCode, stopName) {
    const container = document.getElementById("stopSelector");
    const depSection = document.getElementById("departureSection");
    container.style.display = "none";
    depSection.style.display = "";
    this.currentLuasStop = stopCode;

    document.getElementById("depStopName").textContent = `🚊 ${stopName}`;
    document.getElementById("depStopDesc").textContent = `Luas Green Line · Live times`;

    const board = document.getElementById("departureBoard");
    board.innerHTML = '<div class="loading">⏳ Loading Luas times…</div>';

    try {
      const data = await ApiClient.getLuasForecast(stopCode);

      if (!data.directions || data.directions.length === 0) {
        board.innerHTML = '<div class="loading">No Luas services available</div>';
        return;
      }

      board.innerHTML = "";
      if (data.message) {
        const msg = document.createElement("div");
        msg.style.cssText = "padding:8px 14px;margin-bottom:12px;background:var(--accent-light);border-radius:var(--radius-sm);font-size:13px;color:var(--text-secondary);text-align:center;";
        msg.textContent = data.message;
        board.appendChild(msg);
      }

      for (const dir of data.directions) {
        const dirLabel = document.createElement("div");
        dirLabel.style.cssText = "font-size:13px;font-weight:700;color:var(--text-secondary);margin:8px 0 4px;padding:0 4px;";
        dirLabel.textContent = `⬡ ${dir.direction}`;
        board.appendChild(dirLabel);

        for (const tram of dir.trams) {
          const card = document.createElement("div");
          const due = tram.dueMinutes <= 1;
          card.className = `dep-card ${due ? "due" : ""}`;
          card.innerHTML = `
            <div class="dep-route"><span class="route-badge" style="background:#00985F;min-width:36px;">🚊</span></div>
            <div class="dep-info">
              <div class="dep-dest">${tram.destination}</div>
              <div class="dep-meta"><span class="dep-realtime">● Live Luas</span></div>
            </div>
            <div class="dep-time">
              ${tram.dueMinutes <= 0 ? "NOW" : tram.dueMinutes + " min"}
              <div class="dep-minutes">${dir.direction}</div>
            </div>
          `;
          board.appendChild(card);
        }
      }

      document.getElementById("statusText").textContent = "Luas LIVE 🟢";

    } catch (e) {
      board.innerHTML = `<div class="loading">⚠️ Could not load Luas data<br><small>${e.message}</small></div>`;
    }
  },

  // ── Back to Stops ──────────────────────────────────────────────
  backToStops() {
    document.getElementById("stopSelector").style.display = "";
    document.getElementById("departureSection").style.display = "none";
    // Hide map
    document.getElementById("stopMap").style.display = "none";
    document.getElementById("stopMap").innerHTML = "";
    if (this._currentMap) {
      try { this._currentMap.remove(); } catch(e) {}
      this._currentMap = null;
    }
    this.currentStopId = null;
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  // ── Nearby View ─────────────────────────────────────────────────
  async renderNearby() {
    const container = document.getElementById("stopSelector");
    container.style.display = "";
    container.innerHTML = '<div class="loading">📍 Loading nearby stops…</div>';

    try {
      const data = await ApiClient.getNearby();
      container.innerHTML = '<div class="nearby-list" id="nearbyList"></div>';
      const list = document.getElementById("nearbyList");

      data.stops.forEach((item) => {
        list.appendChild(Components.nearbyGroup(item));
      });
    } catch (e) {
      container.innerHTML = `<div class="loading">⚠️ Error loading nearby stops</div>`;
    }
  },

  // ── Routes View ─────────────────────────────────────────────────
  async renderRoutes() {
    const container = document.getElementById("stopSelector");
    container.style.display = "";
    container.innerHTML = '<div class="loading">🗺️ Loading routes…</div>';

    try {
      const routes = await ApiClient.getRoutes();
      container.innerHTML = '<div class="routes-list" id="routesList"></div>';
      const list = document.getElementById("routesList");

      routes.forEach((route) => {
        list.appendChild(Components.routeCard(route));
      });
    } catch (e) {
      container.innerHTML = `<div class="loading">⚠️ Error loading routes</div>`;
    }
  },

  // ── Auto Refresh ────────────────────────────────────────────────
  startAutoRefresh() {
    setInterval(() => {
      if (this.currentStopId) {
        this.loadDepartures(this.currentStopId);
      }
      this.updateNextBusTile();
    }, 30000); // Refresh every 30 seconds
  },

  // ── Status ──────────────────────────────────────────────────────
  updateStatusTime() {
    document.getElementById("statusTime").textContent =
      new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  },

  async loadStatus() {
    try {
      const status = await ApiClient.getStatus();
      const ds = document.getElementById("dataSourceInfo");
      if (ds) {
        const busStatus = status.busMode === "live" ? "Live 🟢" : "Demo 🎯";
        ds.innerHTML = `<strong>🚊 Luas:</strong> Live real-time data ✅<br><strong>🚌 Buses:</strong> ${busStatus} — ${status.apiKeyConfigured ? "Using your API key" : "Tap ⚙️ to add an NTA API key for live bus data"}`;
      }
    } catch (e) { /* ignore */ }
  },

  async loadApiKeyStatus() {
    try {
      const data = await ApiClient.checkApiKey();
      const statusEl = document.getElementById("apiKeyStatus");
      const inputEl = document.getElementById("apiKeyInput");
      if (data.configured) {
        statusEl.innerHTML = "✅ Live bus data is enabled!";
        inputEl.placeholder = "API key already configured";
      } else {
        statusEl.innerHTML = "";
      }
    } catch (e) { /* ignore */ }
  },

  async saveApiKey() {
    const input = document.getElementById("apiKeyInput");
    const key = input.value.trim();
    const statusEl = document.getElementById("apiKeyStatus");

    if (!key) {
      statusEl.innerHTML = "⚠️ Please enter an API key";
      return;
    }

    try {
      const result = await ApiClient.saveApiKey(key);
      if (result.success) {
        statusEl.innerHTML = "✅ Key saved! Bus data is now live. Refresh to see real times.";
        input.value = "";
        Utils.toast("🎉 Live bus data enabled!");
      } else {
        statusEl.innerHTML = "⚠️ " + (result.error || "Failed to save key");
      }
    } catch (e) {
      statusEl.innerHTML = "⚠️ Error saving key";
    }
  },
};

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => App.init());
