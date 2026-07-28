/**
 * Stops database for Beechdale / Ballycullen / Dublin 24 area
 *
 * These are the main bus stops serving the Beechdale estate and surrounding areas.
 * Each stop has a TFI-compatible stop_id for use with the NTA GTFS Realtime API.
 *
 * Routes:
 *   15  – Ballycullen ↔ Clongriffin (via City Centre / Croke Park)
 *   49  – The Square Tallaght ↔ Pearse Street (via Firhouse / Ballycullen)
 *   65b – Ballycullen ↔ Poolbeg Street (via Knocklyon / City Centre)
 *
 * Stop IDs follow the Dublin Bus / NTA numbering convention.
 */

const stops = [
  // ── Beechdale / Ballycullen (Route 15, 65b) ──────────────────────
  {
    id: "7681",
    name: "Beechdale Avenue",
    road: "Ballycullen Road",
    lat: 53.2801,
    lng: -6.3284,
    routes: ["15", "65b"],
    direction: "Inbound",
    description: "Towards City Centre",
  },
  {
    id: "4511",
    name: "Beechdale Avenue",
    road: "Ballycullen Road",
    lat: 53.2805,
    lng: -6.3290,
    routes: ["15", "65b"],
    direction: "Outbound",
    description: "Towards Ballycullen / Tallaght",
  },
  {
    id: "4512",
    name: "Ballycullen Road",
    road: "Ballycullen Road",
    lat: 53.2788,
    lng: -6.3265,
    routes: ["15", "65b"],
    direction: "Inbound",
    description: "Towards City Centre",
  },
  {
    id: "7682",
    name: "Ballycullen Road",
    road: "Ballycullen Road",
    lat: 53.2792,
    lng: -6.3270,
    routes: ["15", "65b"],
    direction: "Outbound",
    description: "Towards Ballycullen",
  },
  {
    id: "4513",
    name: "Orlagh Avenue",
    road: "Ballycullen Road",
    lat: 53.2775,
    lng: -6.3245,
    routes: ["15", "65b"],
    direction: "Inbound",
    description: "Towards City Centre",
  },
  {
    id: "7683",
    name: "Orlagh Avenue",
    road: "Ballycullen Road",
    lat: 53.2779,
    lng: -6.3250,
    routes: ["15", "65b"],
    direction: "Outbound",
    description: "Towards Ballycullen",
  },
  {
    id: "4514",
    name: "Ballycullen Drive",
    road: "Ballycullen Road",
    lat: 53.2760,
    lng: -6.3220,
    routes: ["15", "49", "65b"],
    direction: "Inbound",
    description: "Towards City Centre",
  },
  {
    id: "7684",
    name: "Ballycullen Drive",
    road: "Ballycullen Road",
    lat: 53.2764,
    lng: -6.3225,
    routes: ["15", "49", "65b"],
    direction: "Outbound",
    description: "Towards Ballycullen / Tallaght",
  },

  // ── Firhouse Road area (Route 49, 15A) ──────────────────────────
  {
    id: "4763",
    name: "Firhouse Road West",
    road: "Firhouse Road",
    lat: 53.2820,
    lng: -6.3340,
    routes: ["49"],
    direction: "Inbound",
    description: "Towards City Centre",
  },
  {
    id: "4764",
    name: "Firhouse Road West",
    road: "Firhouse Road",
    lat: 53.2825,
    lng: -6.3345,
    routes: ["49"],
    direction: "Outbound",
    description: "Towards The Square Tallaght",
  },
  {
    id: "4751",
    name: "Firhouse Road",
    road: "Firhouse Road",
    lat: 53.2835,
    lng: -6.3310,
    routes: ["49"],
    direction: "Inbound",
    description: "Towards City Centre",
  },
  {
    id: "4752",
    name: "Firhouse Road",
    road: "Firhouse Road",
    lat: 53.2840,
    lng: -6.3315,
    routes: ["49"],
    direction: "Outbound",
    description: "Towards The Square Tallaght",
  },

  // ── Knocklyon / Ballycullen terminus area ─────────────────────
  {
    id: "4508",
    name: "Ballycullen Terminus",
    road: "Ballycullen Avenue",
    lat: 53.2735,
    lng: -6.3190,
    routes: ["15", "65b"],
    direction: "Terminus",
    description: "Ballycullen Terminus (Starting Point)",
  },
  {
    id: "7685",
    name: "Ballycullen Avenue",
    road: "Ballycullen Avenue",
    lat: 53.2742,
    lng: -6.3202,
    routes: ["15", "65b"],
    direction: "Inbound",
    description: "Towards City Centre",
  },
  {
    id: "7686",
    name: "Ballycullen Avenue",
    road: "Ballycullen Avenue",
    lat: 53.2748,
    lng: -6.3208,
    routes: ["15", "65b"],
    direction: "Outbound",
    description: "Towards Ballycullen Terminus",
  },
];

// Route information
const routes = {
  "15": {
    number: "15",
    name: "Ballycullen – Clongriffin",
    via: "City Centre, Croke Park, Fairview",
    operator: "Dublin Bus",
    color: "#004C98",
    textColor: "#FFFFFF",
  },
  "49": {
    number: "49",
    name: "The Square Tallaght – Pearse Street",
    via: "Firhouse, Ballycullen, Kimmage, City Centre",
    operator: "Dublin Bus",
    color: "#B2005E",
    textColor: "#FFFFFF",
  },
  "65b": {
    number: "65b",
    name: "Ballycullen – Poolbeg Street",
    via: "Knocklyon, City Centre",
    operator: "Dublin Bus",
    color: "#00A54F",
    textColor: "#FFFFFF",
  },
};

function getStopsByRoute(routeNumber) {
  return stops.filter((s) => s.routes.includes(routeNumber));
}

function getStopById(id) {
  return stops.find((s) => s.id === id);
}

function getRouteInfo(routeNumber) {
  return routes[routeNumber] || null;
}

module.exports = {
  stops,
  routes,
  getStopsByRoute,
  getStopById,
  getRouteInfo,
};
