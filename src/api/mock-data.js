/**
 * Mock real-time departure data for development/demo mode.
 * Generates realistic-looking bus times based on time of day.
 */
const { stops, routes, getRouteInfo } = require("../data/stops-ballycullen");

// Simulated frequency in minutes for each route by time of day
const frequencies = {
  "15": { peak: 8, day: 12, evening: 18, night: 40 },
  "49": { peak: 10, day: 15, evening: 22, night: 50 },
  "65b": { peak: 18, day: 22, evening: 30, night: 55 },
};

function getPeriod() {
  const h = new Date().getHours();
  if (h >= 7 && h < 10) return "peak";
  if (h >= 10 && h < 17) return "day";
  if (h >= 17 && h < 19) return "peak";
  if (h >= 19 && h < 23) return "evening";
  return "night";
}

function generateDepartures(stopId, count = 10) {
  const stop = stops.find((s) => s.id === stopId);
  if (!stop) return [];

  const now = new Date();
  const period = getPeriod();
  const departures = [];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Base offset in minutes - stagger across routes so not all show NOW
  let routeOffset = 0;
  for (const routeNum of stop.routes) {
    const freq = frequencies[routeNum];
    const interval = freq[period];
    const route = getRouteInfo(routeNum);
    // Randomize the next departure slightly so stops don't all show the same times
    const baseMinutes = 2 + Math.floor(Math.random() * 4) + routeOffset;

    let cumulative = baseMinutes;
    for (let i = 0; i < Math.min(5, Math.ceil(count / stop.routes.length)); i++) {
      // Add a small random jitter
      const jitter = Math.floor(Math.random() * 3) - 1;
      const dueMinutes = Math.max(1, cumulative + jitter);
      const departureTime = new Date(now.getTime() + dueMinutes * 60000);

      departures.push({
        route: routeNum,
        destination: stop.direction === "Inbound" || stop.direction === "Terminus"
          ? "City Centre / Clongriffin"
          : stop.direction === "Outbound"
            ? "Ballycullen / Tallaght"
            : "City Centre",
        dueMinutes: dueMinutes,
        dueTime: departureTime.toLocaleTimeString("en-IE", {
          hour: "2-digit", minute: "2-digit",
        }),
        operator: route?.operator || "Dublin Bus",
        isDue: dueMinutes <= 1,
        isRealtime: Math.random() > 0.25,
        stopName: stop.name,
        stopId: stop.id,
      });

      cumulative += interval + Math.floor(Math.random() * 4);
    }
    routeOffset += 3; // stagger between routes
  }

  // Sort by due time
  departures.sort((a, b) => a.dueMinutes - b.dueMinutes);
  return departures.slice(0, count);
}

function generateAllNearby() {
  const now = new Date();
  const period = getPeriod();
  const results = [];

  for (const stop of stops) {
    const departures = generateDepartures(stop.id, 3);
    if (departures.length > 0) {
      results.push({
        stop: {
          id: stop.id,
          name: stop.name,
          road: stop.road,
          direction: stop.direction,
          description: stop.description,
          routes: stop.routes,
        },
        departures: departures.slice(0, 3),
      });
    }
  }
  return results;
}

module.exports = { generateDepartures, generateAllNearby };
