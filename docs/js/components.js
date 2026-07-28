// ═══════════════════════════════════════════════════════════════════
// Components – DOM builders for the UI
// ═══════════════════════════════════════════════════════════════════

const Components = {
  // ── Stop Card ──────────────────────────────────────────────────
  stopCard(stop, isFav = false) {
    const card = document.createElement("div");
    card.className = "stop-card";
    card.dataset.stopId = stop.id;

    const icon = stop.direction === "Inbound" ? "🏙️" : "🏠";
    const favBtn = document.createElement("button");
    favBtn.className = `fav-btn ${isFav ? "active" : ""}`;
    favBtn.textContent = isFav ? "⭐" : "☆";
    favBtn.setAttribute("aria-label", isFav ? "Remove from favourites" : "Add to favourites");
    favBtn.onclick = (e) => {
      e.stopPropagation();
      App.toggleFavourite(stop.id);
    };

    const routesHtml = stop.routes
      .map((r) => `<span class="route-badge" style="background:${Utils.getRouteColor(r)}">${r}</span>`)
      .join("");

    card.innerHTML = `
      <span class="stop-icon">${icon}</span>
      <div class="stop-info">
        <div class="stop-name">${stop.name}</div>
        <div class="stop-road">${stop.road}</div>
        <div class="stop-routes">${routesHtml}</div>
        <div class="stop-desc">${stop.direction === "Inbound" ? "→ City Centre" : "← " + stop.description}</div>
      </div>
    `;
    card.appendChild(favBtn);

    card.addEventListener("click", () => App.showDepartures(stop.id));
    return card;
  },

  // ── Departure Card ─────────────────────────────────────────────
  departureCard(dep) {
    const card = document.createElement("div");
    card.className = `dep-card ${dep.isDue ? "due" : ""}`;

    const routeColor = Utils.getRouteColor(dep.route);
    const dueText = Utils.formatDue(dep.dueMinutes);

    card.innerHTML = `
      <div class="dep-route">
        <span class="route-badge" style="background:${routeColor}">${dep.route}</span>
      </div>
      <div class="dep-info">
        <div class="dep-dest">${dep.destination}</div>
        <div class="dep-meta">
          ${dep.isRealtime ? '<span class="dep-realtime">● Live</span>' : '<span class="dep-scheduled">Scheduled</span>'}
          ${dep.stopName ? ` · ${dep.stopName}` : ""}
        </div>
      </div>
      <div class="dep-time">
        ${dep.dueMinutes <= 0 ? "NOW" : dueText}
        <div class="dep-minutes">${dep.dueTime}</div>
      </div>
    `;

    // Stagger animation
    card.style.animationDelay = "0s";
    return card;
  },

  // ── Route Card ─────────────────────────────────────────────────
  routeCard(route) {
    const card = document.createElement("div");
    card.className = "route-card";
    card.innerHTML = `
      <span class="route-badge" style="background:${route.color};min-width:44px;height:32px;font-size:14px">${route.number}</span>
      <div class="route-info">
        <div class="route-name">${route.name}</div>
        <div class="route-via">via ${route.via}</div>
        <div class="route-operator">${route.operator}</div>
      </div>
    `;
    return card;
  },

  // ── Nearby Stop Group ──────────────────────────────────────────
  nearbyGroup(item) {
    const group = document.createElement("div");
    group.className = "nearby-group";

    const routeBages = item.stop.routes
      .map((r) => `<span class="route-badge" style="background:${Utils.getRouteColor(r)}">${r}</span>`)
      .join("");

    const depsHtml = item.departures
      .map((d) => {
        const dueText = Utils.formatDue(d.dueMinutes);
        return `<div class="dep-card ${d.isDue ? "due" : ""}" style="margin-bottom:6px;padding:10px 14px">
          <div class="dep-route"><span class="route-badge" style="background:${Utils.getRouteColor(d.route)}">${d.route}</span></div>
          <div class="dep-info"><div class="dep-dest">${d.destination}</div></div>
          <div class="dep-time" style="font-size:18px">${d.dueMinutes <= 0 ? "NOW" : dueText}<div class="dep-minutes">${d.dueTime}</div></div>
        </div>`;
      })
      .join("");

    group.innerHTML = `
      <div class="nearby-group-title">
        ${routeBages} ${item.stop.name}
        <span class="stop-dir">${item.stop.road}</span>
      </div>
      ${depsHtml}
    `;

    group.style.cursor = "pointer";
    group.addEventListener("click", () => App.showDepartures(item.stop.id));
    return group;
  },
};
