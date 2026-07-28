// ═══════════════════════════════════════════════════════════════════
// App — main controller
// Flow: Routes (default) → Schedule → Luas → Saved
// ═══════════════════════════════════════════════════════════════════

const App = {
  view: "routes",
  routes: [],
  luasStops: [],
  favourites: Utils.storage("favs") || [],
  countdownTimer: null,
  _allDeps: [],

  async init() {
    this.routes = Object.values(BusData.routes);
    this.luasStops = LuasData.stops;

    const theme = Utils.storage("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);

    document.getElementById("settingsBtn").addEventListener("click", () => Utils.show(document.getElementById("settingsModal")));
    document.getElementById("infoBtn").addEventListener("click", () => Utils.show(document.getElementById("infoModal")));
    document.getElementById("modalClose").addEventListener("click", () => Utils.hide(document.getElementById("infoModal")));
    document.getElementById("infoModal").addEventListener("click", (e) => { if(e.target===e.currentTarget) Utils.hide(e.target) });
    document.getElementById("settingsModalClose").addEventListener("click", () => Utils.hide(document.getElementById("settingsModal")));
    document.getElementById("settingsModal").addEventListener("click", (e) => { if(e.target===e.currentTarget) Utils.hide(e.target) });
    document.getElementById("saveApiKeyBtn").addEventListener("click", () => this.saveApiKey());
    document.getElementById("schBack").addEventListener("click", () => this.showRoutes());
    document.getElementById("luasBack").addEventListener("click", () => this.showLuasList());
    document.querySelector(".hero").addEventListener("click", () => {
      const r = document.querySelector(".hero").dataset.route;
      if (r) this.showSchedule(r);
    });

    document.querySelectorAll(".nav-btn").forEach(b => b.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      this.switchView(b.dataset.view);
    }));

    this.showRoutes();
    const ut = () => document.getElementById("statusTime").textContent = new Date().toLocaleTimeString("en-IE",{hour:"2-digit",minute:"2-digit"});
    ut(); setInterval(ut, 10000);
  },

  // ─── Routes ═══════════════════════════════════════════════════
  async showRoutes() {
    this.view = "routes";
    ["scheduleView","luasView","savedView"].forEach(id => Utils.hide(document.getElementById(id)));
    Utils.show(document.querySelector(".hero"));
    Utils.show(document.getElementById("routesList"));
    if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
    await this.refreshRoutes();
    this.startCountdown();
  },

  async refreshRoutes() {
    const all = MockData.allNearby();
    const byRoute = {};
    for (const item of all) {
      for (const d of item.departures) {
        if (!byRoute[d.route]) byRoute[d.route] = [];
        byRoute[d.route].push({ ...d, stopName: item.stop.name });
      }
    }
    for (const r in byRoute) byRoute[r].sort((a,b) => a.dueMinutes - b.dueMinutes);

    const allDeps = [];
    for (const r in byRoute) for (const d of byRoute[r]) allDeps.push(d);
    allDeps.sort((a,b) => a.dueMinutes - b.dueMinutes);
    this._allDeps = allDeps;

    C.hero(allDeps.map(d => ({ route: d.route, dest: d.destination, min: d.dueMinutes, stop: d.stopName })));

    const list = document.getElementById("routesList");
    list.innerHTML = "";
    for (const route of this.routes) {
      const deps = byRoute[route.number];
      const next = deps ? { min: deps[0].dueMinutes, dest: deps[0].destination } : null;
      list.appendChild(C.routeCard(route, next));
    }
    document.getElementById("statusData").textContent = allDeps.length > 0 && allDeps[0].isRealtime ? "Luas Live · Bus Live" : "Luas Live · Bus Demo";
  },

  startCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      const heroEl = document.getElementById("heroCountdown");
      const curr = this._allDeps[0];
      if (heroEl && curr) {
        curr.dueMinutes = Math.max(0, curr.dueMinutes - 1/15);
        const d = Math.round(curr.dueMinutes);
        heroEl.textContent = Utils.fmt(d);
        document.getElementById("heroBadge").textContent = d <= 1 ? "Due Now" : "Next Departure";
      }
      document.querySelectorAll(".route-card").forEach(card => {
        const r = card.dataset.route;
        const te = card.querySelector(".rc-time");
        if (!te) return;
        const dd = this._allDeps.filter(d => d.route === r);
        if (dd.length > 0) {
          dd[0].dueMinutes = Math.max(0, dd[0].dueMinutes - 1/15);
          te.textContent = Utils.fmt(Math.round(dd[0].dueMinutes));
        }
      });
    }, 2000);
  },

  // ─── Schedule ═════════════════════════════════════════════════
  async showSchedule(routeNum) {
    this.view = "schedule";
    Utils.hide(document.querySelector(".hero"));
    Utils.hide(document.getElementById("routesList"));
    Utils.show(document.getElementById("scheduleView"));

    const route = BusData.getRoute(routeNum);
    document.getElementById("schTitle").textContent = `Route ${routeNum}`;
    document.getElementById("schSub").textContent = route.name;

    const body = document.getElementById("schBody");
    body.innerHTML = '<div class="loading">Loading…</div>';

    const all = MockData.allNearby();
    const sfr = all.filter(item => item.stop.routes.includes(routeNum));
    body.innerHTML = "";
    let h = false;
    for (const item of sfr) {
      const deps = item.departures.filter(d => d.route === routeNum);
      if (deps.length === 0) continue;
      h = true;
      body.appendChild(C.scheduleStop(item.stop.name, deps.map(d => ({ time: Utils.due(d.dueMinutes), dest: d.destination }))));
    }
    if (!h) body.innerHTML = '<div class="loading">No departures</div>';
  },

  // ─── Luas ═════════════════════════════════════════════════════
  async showLuasList() {
    this.view = "luas";
    ["scheduleView","savedView"].forEach(id => Utils.hide(document.getElementById(id)));
    Utils.hide(document.querySelector(".hero"));
    Utils.hide(document.getElementById("routesList"));
    Utils.show(document.getElementById("luasView"));
    document.getElementById("luasDetail").style.display = "none";
    document.getElementById("luasGrid").style.display = "";

    const grid = document.getElementById("luasGrid");
    if (grid.children.length === 0) {
      const green = this.luasStops.filter(s => s.line === "Green");
      const red = this.luasStops.filter(s => s.line === "Red");
      [...green, ...red].forEach(s => grid.appendChild(C.luasCard(s)));
    }
  },

  async showLuas(code, name) {
    document.getElementById("luasGrid").style.display = "none";
    document.getElementById("luasDetail").style.display = "";
    const fc = document.getElementById("luasForecast");
    fc.innerHTML = '<div class="loading">Loading…</div>';
    try {
      const data = await LuasData.forecast(code);
      fc.innerHTML = `<div style="font-size:16px;font-weight:700;margin-bottom:8px">🚊 ${name}</div>`;
      if (data.message) fc.innerHTML += `<div style="font-size:12px;color:var(--sec);margin-bottom:8px">${data.message}</div>`;
      data.directions.forEach(d => fc.appendChild(C.luasDir(d)));
    } catch(e) {
      fc.innerHTML = '<div class="loading">Failed to load</div>';
    }
  },

  // ─── Saved ════════════════════════════════════════════════════
  toggleFavRoute(r) {
    const i = this.favourites.indexOf(r);
    if (i === -1) { this.favourites.push(r); Utils.toast("⭐ Saved"); }
    else { this.favourites.splice(i, 1); Utils.toast("Removed"); }
    Utils.storage("favs", this.favourites);
    this.refreshRoutes();
  },

  async showSaved() {
    this.view = "saved";
    ["scheduleView","luasView"].forEach(id => Utils.hide(document.getElementById(id)));
    Utils.hide(document.querySelector(".hero"));
    Utils.hide(document.getElementById("routesList"));
    Utils.show(document.getElementById("savedView"));

    const c = document.getElementById("savedContent");
    if (this.favourites.length === 0) { c.innerHTML = '<div class="empty-state">Tap ★ on any route to save it</div>'; return; }
    const all = MockData.allNearby();
    let html = "";
    for (const r of this.favourites) {
      const rt = BusData.getRoute(r);
      if (!rt) continue;
      const deps = [];
      for (const item of all) if (item.stop.routes.includes(r)) item.departures.filter(d => d.route===r).forEach(d => deps.push(d));
      deps.sort((a,b) => a.dueMinutes - b.dueMinutes);
      const n = deps[0];
      html += `<div class="route-card" data-route="${r}" style="margin-bottom:8px"><div class="rc-badge" style="background:${rt.color}">${r}</div><div class="rc-info"><div class="rc-name">${rt.name}</div>${n ? `<div class="rc-next"><span class="rc-time">${n.dueMinutes}</span><span class="rc-unit">min</span></div>` : '<div class="rc-next" style="font-size:12px;color:var(--muted)">None</div>'}</div><span class="rc-arrow">›</span></div>`;
    }
    c.innerHTML = html;
    c.querySelectorAll(".route-card").forEach(el => el.addEventListener("click", () => App.showSchedule(el.dataset.route)));
  },

  switchView(v) {
    if (v === "routes") this.showRoutes();
    else if (v === "luas") this.showLuasList();
    else if (v === "saved") this.showSaved();
  },

  saveApiKey() {
    const k = document.getElementById("apiKeyInput").value.trim();
    if (!k) { document.getElementById("apiKeyStatus").textContent = "⚠️ Enter a key"; return; }
    localStorage.setItem("btl_nta_key", k);
    document.getElementById("apiKeyStatus").textContent = "✅ Saved (needs server proxy for live data)";
    Utils.toast("Key saved"); document.getElementById("apiKeyInput").value = "";
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
