// ═══════════════════════════════════════════════════════════════════
// Components — DOM builders
// ═══════════════════════════════════════════════════════════════════

const C = {

  hero(data) {
    const d = data[0];
    if (!d) return;
    document.getElementById("heroRoute").textContent = d.route;
    document.getElementById("heroDest").textContent = d.dest;
    document.getElementById("heroCountdown").textContent = Utils.fmt(d.min);
    document.getElementById("heroSub").textContent = d.min <= 1 ? "Due now" : "tap for all times";
    document.getElementById("heroStop").textContent = d.stop;
    document.getElementById("heroBadge").textContent = d.min <= 1 ? "Due Now" : "Next Departure";
    document.querySelector(".hero").dataset.route = d.route;
  },

  routeCard(route, next) {
    const card = document.createElement("div");
    card.className = "route-card";
    card.dataset.route = route.number;
    const color = route.color;
    const fav = (App.favourites || []).includes(route.number);
    card.innerHTML = `
      <div class="rc-badge" style="background:${color}">${route.number}</div>
      <div class="rc-info">
        <div class="rc-name">${route.name.replace(" – "," → ")}</div>
        <div class="rc-via">${route.via}</div>
        ${next ? `<div class="rc-next"><span class="rc-time">${next.min}</span><span class="rc-unit">min</span></div>` : '<div class="rc-next" style="color:var(--muted);font-size:12px">No upcoming departures</div>'}
      </div>
      <button class="rc-star ${fav?'active':''}" data-route="${route.number}" aria-label="Toggle favourite">${fav?'★':'☆'}</button>
      <span class="rc-arrow">›</span>
    `;
    card.querySelector(".rc-star").addEventListener("click", (e) => {
      e.stopPropagation();
      App.toggleFavRoute(route.number);
    });
    card.addEventListener("click", () => App.showSchedule(route.number));
    return card;
  },

  scheduleStop(stopName, rows) {
    const g = document.createElement("div");
    g.className = "sch-group";
    g.innerHTML = `<div class="sch-stop-name">🚏 ${stopName}</div>`;
    rows.forEach(r => {
      const row = document.createElement("div");
      row.className = "sch-row";
      row.innerHTML = `<span class="sch-row-time">${r.time}</span><span class="sch-row-dest">${r.dest}</span>`;
      g.appendChild(row);
    });
    return g;
  },

  luasCard(stop) {
    const card = document.createElement("div");
    card.className = "luas-card";
    card.innerHTML = `<div class="luas-code">${stop.code}</div><div><div style="font-weight:600;font-size:14px">${stop.name}</div><div style="font-size:10px;color:var(--muted)">${stop.line} Line</div></div>`;
    card.addEventListener("click", () => App.showLuas(stop.code, stop.name));
    return card;
  },

  luasDir(dir) {
    const g = document.createElement("div");
    g.style.marginBottom = "10px";
    const label = document.createElement("div");
    label.style.cssText = "font-size:12px;font-weight:700;color:var(--sec);margin:8px 0 4px";
    label.textContent = `⬡ ${dir.direction}`;
    g.appendChild(label);
    dir.trams.forEach(t => {
      const row = document.createElement("div");
      row.className = "sch-row";
      const due = t.dueMinutes <= 0 ? "NOW" : t.dueMinutes + "m";
      row.innerHTML = `<span class="sch-row-time" style="color:#00985F">${due}</span><span class="sch-row-dest">${t.destination}</span>`;
      g.appendChild(row);
    });
    return g;
  },
};
