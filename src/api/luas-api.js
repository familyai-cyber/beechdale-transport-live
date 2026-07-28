/**
 * Luas Real-Time API Integration
 *
 * Free, no authentication required.
 * Endpoint: https://luasforecasts.rpa.ie/xml/get.ashx
 * Parameters:
 *   action=forecast  – get forecast for a stop
 *   stop=STOPCODE    – three-letter stop code (e.g. RAN, STH, MAR)
 *   encrypt=false    – return plain XML (not encrypted)
 *
 * Stop codes: https://luasforecasts.rpa.ie/xml/get.ashx?action=stops
 */

const https = require("https");

const LUAS_BASE = "https://luasforecasts.rpa.ie/xml/get.ashx";
const TIMEOUT = 8000;

// Luas stops near Ballycullen / accessible via bus routes
const LUAS_STOPS = {
  RAN: { name: "Ranelagh", line: "Green", lat: 53.3263, lng: -6.2570 },
  BEE: { name: "Beechwood", line: "Green", lat: 53.3207, lng: -6.2577 },
  COW: { name: "Cowper", line: "Green", lat: 53.3163, lng: -6.2577 },
  MIL: { name: "Milltown", line: "Green", lat: 53.3090, lng: -6.2546 },
  WND: { name: "Windy Arbour", line: "Green", lat: 53.3021, lng: -6.2506 },
  DUN: { name: "Dundrum", line: "Green", lat: 53.2928, lng: -6.2472 },
  BAL: { name: "Balally", line: "Green", lat: 53.2847, lng: -6.2460 },
  KIL: { name: "Kilmacud", line: "Green", lat: 53.2782, lng: -6.2435 },
  STI: { name: "Stillorgan", line: "Green", lat: 53.2780, lng: -6.2440 },
  SND: { name: "Sandyford", line: "Green", lat: 53.2692, lng: -6.2478 },
  CEN: { name: "Central Park", line: "Green", lat: 53.2638, lng: -6.2465 },
  GLE: { name: "Glencairn", line: "Green", lat: 53.2564, lng: -6.2417 },
  BRI: { name: "Brides Glen", line: "Green", lat: 53.2505, lng: -6.2367 },
  STH: { name: "St. Stephen's Green", line: "Green", lat: 53.3383, lng: -6.2590 },
  HAR: { name: "Harcourt", line: "Green", lat: 53.3336, lng: -6.2628 },
  CHA: { name: "Charlemont", line: "Green", lat: 53.3310, lng: -6.2574 },
  TAL: { name: "Tallaght", line: "Red", lat: 53.2867, lng: -6.3732 },
  FAT: { name: "FATIMA", line: "Red", lat: 53.3382, lng: -6.2922 },
};

/**
 * Fetch real-time Luas forecasts for a stop.
 * @param {string} stopCode - 3-letter stop code (e.g. "RAN")
 * @returns {Promise<Object>} Parsed forecast data
 */
function fetchLuasForecast(stopCode) {
  const url = `${LUAS_BASE}?action=forecast&stop=${encodeURIComponent(stopCode)}&encrypt=false`;

  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: TIMEOUT }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = parseLuasXml(data, stopCode);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Luas parse error: ${e.message}`));
        }
      });
    });
    req.on("error", (e) => reject(new Error(`Luas request failed: ${e.message}`)));
    req.on("timeout", () => { req.destroy(); reject(new Error("Luas request timed out")); });
  });
}

/**
 * Parse Luas XML response into structured data.
 */
function parseLuasXml(xml, stopCode) {
  const stop = LUAS_STOPS[stopCode];
  const result = {
    stopCode,
    stopName: stop?.name || stopCode,
    line: stop?.line || "Unknown",
    message: "",
    lastUpdated: new Date().toISOString(),
    directions: [],
  };

  // Extract message
  const msgMatch = xml.match(/<message>([^<]*)<\/message>/);
  if (msgMatch) result.message = msgMatch[1];

  // Extract directions and trams
  const dirRegex = /<direction name="([^"]+)">(.*?)<\/direction>/gs;
  let dirMatch;
  while ((dirMatch = dirRegex.exec(xml)) !== null) {
    const direction = dirMatch[1];
    const trams = [];
    const tramRegex = /<tram dueMins="([^"]*)" destination="([^"]*)"(?:\s+separator="([^"]*)")?(?:\s+?)?\/?>/g;
    let tramMatch;
    while ((tramMatch = tramRegex.exec(dirMatch[2])) !== null) {
      trams.push({
        dueMinutes: tramMatch[1] === "DUE" ? 0 : parseInt(tramMatch[1], 10),
        destination: tramMatch[2],
      });
    }
    result.directions.push({ direction, trams });
  }

  return result;
}

/**
 * Get list of all Luas stop codes with names.
 */
function getLuasStops() {
  return Object.entries(LUAS_STOPS).map(([code, info]) => ({
    code,
    name: info.name,
    line: info.line,
    lat: info.lat,
    lng: info.lng,
  }));
}

module.exports = { fetchLuasForecast, getLuasStops, LUAS_STOPS };
