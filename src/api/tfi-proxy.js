/**
 * Transport for Ireland (TFI) / NTA GTFS Realtime API proxy.
 *
 * The NTA provides GTFS Realtime feeds covering:
 *   - Trip Updates   (real-time arrival/departure predictions)
 *   - Vehicle Positions
 *   - Service Alerts
 *
 * API docs: https://www.nationaltransport.ie/developer-apis/
 * Key req:  Email developer@nationaltransport.ie to request a free API key
 *
 * Primary endpoint: https://api.nationaltransport.ie/gtfsr/v2/gtfsr
 * Format: GTFS Realtime Protocol Buffers (use format=json for JSON output)
 */

const https = require("https");
const http = require("http");

const TFI_BASE = "https://api.nationaltransport.ie/gtfsr/v2";
const TIMEOUT = 10000;

/**
 * Fetch real-time departures for a specific stop from the TFI API.
 * @param {string} stopId - NTA stop ID (e.g. "7681")
 * @param {string} apiKey - TFI API key
 * @returns {Promise<Array>} Array of departure objects
 */
async function fetchDepartures(stopId, apiKey) {
  if (!apiKey || apiKey === "DEMO_MODE") {
    throw new Error("No valid TFI API key configured");
  }

  const url = `${TFI_BASE}/gtfsr?format=json&stopId=${encodeURIComponent(stopId)}`;

  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "Cache-Control": "no-cache",
          "x-api-key": apiKey,
        },
        timeout: TIMEOUT,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const departures = parseGtfsResponse(parsed, stopId);
            resolve(departures);
          } catch (e) {
            reject(new Error(`Failed to parse TFI response: ${e.message}`));
          }
        });
      }
    );

    req.on("error", (e) => reject(new Error(`TFI API request failed: ${e.message}`)));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("TFI API request timed out"));
    });
  });
}

/**
 * Parse a GTFS Realtime JSON response into a simpler departure format.
 */
function parseGtfsResponse(gtfsData, stopId) {
  const departures = [];

  if (!gtfsData?.entity) return departures;

  for (const entity of gtfsData.entity) {
    if (!entity.trip_update?.stop_time_update) continue;

    for (const stu of entity.trip_update.stop_time_update) {
      if (String(stu.stop_id) !== String(stopId)) continue;

      const routeId = entity.trip_update.trip?.route_id || "?";
      const departure = stu.departure || stu.arrival;
      const delay = departure?.delay || 0;
      const time = departure?.time
        ? new Date(departure.time * 1000)
        : new Date();
      const dueMinutes = Math.round((time - new Date()) / 60000) + Math.round(delay / 60);

      departures.push({
        route: routeId,
        destination: entity.trip_update.trip?.trip_headsign || "Unknown",
        dueMinutes: Math.max(0, dueMinutes),
        dueTime: time.toLocaleTimeString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        operator: "Dublin Bus",
        isDue: dueMinutes <= 1,
        isRealtime: true,
        stopName: "",
        stopId: stopId,
      });
    }
  }

  departures.sort((a, b) => a.dueMinutes - b.dueMinutes);
  return departures;
}

module.exports = { fetchDepartures };
