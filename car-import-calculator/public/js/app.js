/* Car Import Cost Calculator – frontend logic (UX redesign) */

const form = document.getElementById("estimate-form");
const results = document.getElementById("results");
const submitBtn = document.getElementById("submit-btn");
const formError = document.getElementById("form-error");
const fxBadge = document.getElementById("fx-badge");
const copyBtn = document.getElementById("copy-btn");

const STORAGE_KEY = "carImportCalculator.v1";

const fmt = (n) => "€" + Number(n).toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => "€" + Number(n).toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const gbp = (n) => "£" + Number(n).toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

let fxRate = null; // current live rate

/* ── FX badge (pass-03) ──────────────────────────────────────────── */
async function loadFx() {
  fxBadge.classList.add("loading");
  const setRate = (rate) => {
    fxRate = rate;
    fxBadge.textContent = `£1 = €${fxRate.toFixed(3)}`;
    fxBadge.classList.remove("loading");
    fxBadge.classList.add("live");
    fxBadge.title = "Live exchange rate (auto-updated). Also shown as £ in the results.";
  };
  const fail = () => {
    fxBadge.textContent = "FX unavailable – using default";
    fxBadge.classList.remove("loading");
  };

  // 1) Try the app server's /api/fx when hosted on Express.
  try {
    const res = await fetch("/api/fx");
    const data = await res.json();
    if (res.ok && data.eurPerGbp) return setRate(data.eurPerGbp);
  } catch { /* fall through */ }

  // 2) Static hosting (GitHub Pages): call the public FX API directly.
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/GBP");
    const json = await res.json();
    const rate = Number(json?.rates?.EUR);
    if (res.ok && rate > 0) return setRate(rate);
  } catch { /* fall through */ }

  fail();
}

/* ── Hints (pass-18: quantified origin impact) ───────────────────── */
const ORIGIN_HINTS = {
  GB: "GB cars pay 10% customs duty and 23% import VAT on the full value — typically €3,000–€7,000+ extra vs a Northern Ireland car. If first registered before 2021 you must still pay VAT under current Revenue rules.",
  NI: "NI cars are inside the EU customs union & VAT area: no customs duty and no import VAT with the right proof (V5C, NI-registered keeper, NI MOT/insurance). You still pay VRT when registering in Ireland.",
};
const BUYER_HINTS = {
  private: "As a private buyer you pay import VAT (if it applies) as part of the total.",
  "vat-dealer": "A VAT-registered dealer can reclaim import VAT as input VAT — shown separately as reclaimable below.",
};

function refreshHints() {
  const origin = document.querySelector('input[name="origin"]:checked').value;
  const buyer = document.querySelector('input[name="buyerType"]:checked').value;
  document.getElementById("origin-hint").textContent = ORIGIN_HINTS[origin];
  document.getElementById("buyer-hint").textContent = BUYER_HINTS[buyer];
}
form.addEventListener("change", refreshHints);

/* ── Error display (pass-02) ─────────────────────────────────────── */
function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
  formError.scrollIntoView({ behavior: "smooth", block: "center" });
}
function clearError() {
  formError.classList.add("hidden");
  formError.textContent = "";
}

/* ── Persistence (pass-08) ───────────────────────────────────────── */
function persist() {
  const keys = ["make", "model", "year", "uk-price", "co2", "nox", "shipping", "fuel-type", "co2-standard"];
  const state = {};
  keys.forEach((k) => (state[k] = document.getElementById(k).value));
  state.origin = document.querySelector('input[name="origin"]:checked').value;
  state.buyerType = document.querySelector('input[name="buyerType"]:checked').value;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
function restore() {
  let state;
  try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return; }
  if (!state) return;
  const keys = ["make", "model", "year", "uk-price", "co2", "nox", "shipping", "fuel-type", "co2-standard"];
  keys.forEach((k) => {
    const el = document.getElementById(k);
    if (state[k] != null && state[k] !== "") el.value = state[k];
  });
  if (state.origin) {
    const o = document.querySelector(`input[name="origin"][value="${state.origin}"]`);
    if (o) o.checked = true;
  }
  if (state.buyerType) {
    const b = document.querySelector(`input[name="buyerType"][value="${state.buyerType}"]`);
    if (b) b.checked = true;
  }
}

/* ── Submit ──────────────────────────────────────────────────────── */
function buildPayload() {
  const origin = document.querySelector('input[name="origin"]:checked').value;
  const buyerType = document.querySelector('input[name="buyerType"]:checked').value;
  return {
    make: document.getElementById("make").value.trim(),
    model: document.getElementById("model").value.trim(),
    firstRegYear: Number(document.getElementById("year").value),
    ukPriceGBP: Number(document.getElementById("uk-price").value),
    co2: Number(document.getElementById("co2").value),
    nox: Number(document.getElementById("nox").value) || 0,
    origin,
    buyerType,
    fuelType: document.getElementById("fuel-type").value,
    co2Standard: document.getElementById("co2-standard").value,
    shippingEUR: Number(document.getElementById("shipping").value) || 0,
    fxRate: fxRate || undefined,
  };
}

function validate() {
  const y = Number(document.getElementById("year").value);
  if (!y || y < 1990 || y > 2026) return "Please enter a valid year of first registration (1990–2026).";
  const p = Number(document.getElementById("uk-price").value);
  if (!p || p <= 0) return "Please enter a valid UK purchase price in £.";
  const c = document.getElementById("co2").value;
  if (c === "" || Number(c) < 0 || Number.isNaN(Number(c))) return "Please enter the CO₂ figure (g/km) from the V5C.";
  return null;
}

async function submit(e) {
  e.preventDefault();
  clearError();
  const err = validate();
  if (err) { showError(err); return; }

  submitBtn.disabled = true;
  submitBtn.classList.add("loading");
  submitBtn.querySelector(".btn-label").textContent = "Calculating…";
  results.classList.add("recalculating");

  const payload = buildPayload();

  try {
    let data;
    // Prefer the local calculation engine (works on static hosting too).
    if (window.CarCalc && typeof window.CarCalc.calculate === "function") {
      data = window.CarCalc.calculate(payload);
      // Match the shape the server returns so render() is shared.
      data.car = {
        make: payload.make || "",
        model: payload.model || "",
        year: payload.firstRegYear ? Number(payload.firstRegYear) : null,
        origin: payload.origin,
        buyerType: payload.buyerType,
      };
      data.fx = { rate: data.breakdown.fxRate, source: "live-or-default" };
    } else {
      // Fallback: the Express server API.
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong");
      data = j;
    }
    render(data);
    persist();
  } catch (err2) {
    showError(err2.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    submitBtn.querySelector(".btn-label").textContent = "Calculate import cost";
    results.classList.remove("recalculating");
  }
}

/* ── Render (pass-04/05/06/07/16/17) ─────────────────────────────── */
const na = (el) => {
  const cell = document.createElement("div");
  cell.className = "value na";
  cell.textContent = el;
  return cell;
};
const cell = (v, cls) => {
  const c = document.createElement("div");
  c.className = "value";
  if (cls) c.classList.add(cls);
  c.textContent = v;
  return c;
};
const row = (label, sub, valueEl, cls) => {
  const r = document.createElement("div");
  r.className = "row";
  if (cls) r.classList.add(cls);
  const l = document.createElement("div");
  l.className = "label";
  l.textContent = label;
  if (sub) {
    const s = document.createElement("small");
    s.textContent = sub;
    l.appendChild(s);
  }
  r.appendChild(l);
  r.appendChild(valueEl);
  return r;
};

function render(data) {
  const b = data.breakdown;
  const carLabel = [data.car.make, data.car.model].filter(Boolean).join(" ") || "This car";
  const originLabel = data.car.origin === "NI" ? "Northern Ireland" : "Great Britain";
  const buyerLabel = data.car.buyerType === "vat-dealer" ? "VAT-registered dealer" : "private buyer";
  const fxEurPerGbp = b.fxRate;
  const fxGbpPerEur = (1 / fxEurPerGbp).toFixed(3);

  /* Summary lines (pass-16) */
  const summary = document.getElementById("result-summary");
  summary.innerHTML = "";
  const mk = (txt) => {
    const d = document.createElement("div");
    d.textContent = txt;
    summary.appendChild(d);
  };
  mk(`${carLabel} · ${data.car.year || "year unknown"} · ${originLabel}`);
  mk(`Buying as a ${buyerLabel}${data.car.buyerType === "vat-dealer" ? " (VAT reclaimable)" : ""}`);
  mk(`Exchange rate: £1 = €${fxEurPerGbp.toFixed(3)} · UK price ${gbp(b.carPriceGBP)}`);

  /* Badges (pass-06) */
  const badges = document.getElementById("result-badges");
  badges.innerHTML = "";
  const badge = (text, cls) => {
    const s = document.createElement("span");
    s.className = "badge " + cls;
    s.textContent = text;
    badges.appendChild(s);
  };
  badge(data.car.origin === "NI" ? "Northern Ireland · no duty/VAT" : "Great Britain · duty + VAT", data.car.origin === "NI" ? "ni" : "gb");
  if (data.car.buyerType === "vat-dealer") badge("VAT reclaimable", "dealer");
  if (b.evRelief > 0) badge(`EV relief −${fmt0(b.evRelief)}`, "neutral");

  /* Big total (pass-06) */
  const big = document.getElementById("big-total");
  big.innerHTML = "";
  const label = document.createElement("span");
  label.className = "big-label";
  label.textContent =
    data.car.buyerType === "vat-dealer" ? "Net cash required (VAT reclaimable)" : "Estimated total cost";
  big.appendChild(label);
  big.appendChild(document.createTextNode(fmt(data.total)));
  const note = document.createElement("span");
  note.className = "big-note";
  if (data.car.buyerType === "vat-dealer") {
    note.textContent = `Plus reclaimable VAT ${fmt(b.vat)} → grand total ${fmt(data.grandTotalInclVat)} if you can't fund it up front`;
  } else if (data.car.origin === "GB") {
    note.textContent = "Includes customs duty, import VAT, VRT, NOx levy, fees & shipping";
  } else {
    note.textContent = "Includes VRT, NOx levy, fees & shipping (no duty or import VAT)";
  }
  big.appendChild(note);

  /* Breakdown rows */
  const bd = document.getElementById("breakdown");
  bd.innerHTML = "";

  const dutyRow = row(
    "Customs duty",
    `(rate ${(b.dutyRate * 100).toFixed(0)}%${data.car.origin === "GB" ? "" : " — NI exemption"})`,
    b.duty > 0 ? cell(fmt(b.duty)) : na("Not applicable"),
    "duty"
  );
  bd.appendChild(dutyRow);

  const vatRow = row(
    "Import VAT",
    b.vatApplies
      ? `(23%${data.car.buyerType === "vat-dealer" ? " — reclaimable" : ""})`
      : "(GB cars only)",
    b.vat > 0 ? cell(fmt(b.vat)) : na("Not applicable"),
    "vat"
  );
  bd.appendChild(vatRow);

  /* Dealer net rows (pass-05) */
  if (data.car.buyerType === "vat-dealer" && b.vat > 0) {
    const net = row(
      "Net total (VAT reclaimable)",
      "Your cash cost after reclaiming import VAT",
      cell(fmt(data.total), "net"),
      "sub"
    );
    bd.appendChild(net);
    const grand = row(
      "Grand total (incl. reclaimable VAT)",
      "Cash needed up front if you fund it before reclaim",
      cell(fmt(data.grandTotalInclVat)),
      "total"
    );
    bd.appendChild(grand);
  }

  const vrtRow = row(
    "VRT (Vehicle Registration Tax)",
    `OMSP ${fmt(b.omsp)} · CO₂ band ${b.vrtBand} (${(b.vrtRate * 100).toFixed(2)}%)${b.evRelief > 0 ? ` · EV relief −${fmt0(b.evRelief)}` : ""}`,
    cell(fmt(b.vrt)),
    "vrt"
  );
  bd.appendChild(vrtRow);

  const noxRow = row(
    "NOx levy",
    `${b.noxMg} mg/km`,
    b.noxLevy > 0 ? cell(fmt(b.noxLevy)) : na("None"),
    "nox"
  );
  bd.appendChild(noxRow);

  const shipRow = row("Shipping & transport", "Ferry, trailer, insurance", cell(fmt(b.shippingEUR)), "ship");
  bd.appendChild(shipRow);

  const feeRow = row("Registration & NCT", `Registration €125 · NCT ${fmt(b.nctFee)}`, cell(fmt(b.registrationFee + b.nctFee)), "fee");
  bd.appendChild(feeRow);

  /* Annual motor tax — NOT in total (pass-07) */
  if (b.annualMotorTax) {
    const annual = row(
      "Annual motor tax (not included in total)",
      `Ongoing yearly cost · CO₂ band ${b.motorTaxBand}`,
      cell(fmt(b.annualMotorTax)),
      "annual"
    );
    bd.appendChild(annual);
  }

  /* Notes */
  const notes = document.getElementById("result-notes");
  notes.innerHTML = "";
  const noteP = (txt) => {
    const p = document.createElement("p");
    p.textContent = txt;
    notes.appendChild(p);
  };
  noteP(`VRT is charged on Revenue's OMSP. We estimate it as UK price + shipping + duty (${fmt(b.omsp)}) — Revenue's official figure can differ.`);
  noteP(`Annual motor tax is ${fmt(b.annualMotorTax)}/yr and is not part of the import total above.`);
  noteP("Estimate only — final duty, VAT and VRT are set by Revenue at registration.");

  /* Copy button (pass-17) */
  copyBtn.classList.remove("hidden");

  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── Copy summary (pass-17) ──────────────────────────────────────── */
async function copySummary() {
  const text = document.getElementById("result-summary").textContent + "\n" +
    document.getElementById("big-total").textContent.replace(/\s+/g, " ").trim();
  try {
    await navigator.clipboard.writeText(text);
    const orig = copyBtn.textContent;
    copyBtn.textContent = "✓ Copied";
    setTimeout(() => (copyBtn.textContent = orig), 1600);
  } catch {
    showError("Couldn't copy — your browser blocked clipboard access.");
  }
}

copyBtn.addEventListener("click", copySummary);
form.addEventListener("submit", submit);
form.addEventListener("change", persist);
form.addEventListener("input", persist);

/* ── Listing URL extraction (paste-a-link) ───────────────────────── */
const extractBtn = document.getElementById("extract-btn");
const listingUrl = document.getElementById("listing-url");
const extractHint = document.getElementById("extract-hint");
const extractedChip = document.getElementById("extracted-chip");

const PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
];

async function fetchWithTimeout(url, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function setChip(state, text) {
  extractedChip.className = "extracted-chip " + state;
  extractedChip.textContent = text || "";
  extractedChip.classList.toggle("hidden", !text);
}

function extractHintMsg(msg) {
  extractHint.textContent = msg;
}

function fillFromListing(r) {
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el && v != null && v !== "") {
      el.value = v;
      el.classList.remove("flash");
      void el.offsetWidth; // restart animation
      el.classList.add("flash");
    }
  };

  if (r.make) setVal("make", r.make);
  if (r.model) setVal("model", r.model);
  if (r.year) setVal("year", String(r.year));

  // Price: prefer GBP; convert EUR → GBP using the live rate.
  let priceGBP = r.priceGBP;
  if (!priceGBP && r.priceEUR && fxRate) priceGBP = Math.round(r.priceEUR / fxRate);
  if (!priceGBP && r.priceEUR) priceGBP = Math.round(r.priceEUR / 1.163);
  if (priceGBP) setVal("uk-price", String(Math.round(priceGBP)));

  if (r.co2) setVal("co2", String(Math.round(r.co2)));
  if (r.fuelType) {
    const el = document.getElementById("fuel-type");
    if (el && ["petrol", "diesel", "hybrid", "electric"].includes(r.fuelType)) {
      el.value = r.fuelType;
    }
  }
  if (r.origin) {
    const o = document.querySelector(`input[name="origin"][value="${r.origin === "NI" ? "NI" : "GB"}"]`);
    if (o) o.checked = true;
  }
  refreshHints();
  persist();
}

function autoCalculateIfReady() {
  const has = (id) => {
    const v = document.getElementById(id).value;
    return v !== "" && Number(v) > 0;
  };
  if (has("year") && has("uk-price") && has("co2")) {
    form.requestSubmit();
    return true;
  }
  return false;
}

async function extractFromUrl() {
  const url = listingUrl.value.trim();
  clearError();
  setChip("loading", "Extracting details from the listing… this can take a few seconds.");
  extractHintMsg("");

  if (!/^https?:\/\/.+/i.test(url)) {
    setChip("error", "Please paste a full link starting with http:// or https://.");
    return;
  }

  extractBtn.disabled = true;
  extractBtn.classList.add("loading");
  extractBtn.querySelector(".btn-label").textContent = "Extracting…";

  try {
    let extracted = null;

    // 1) Local dev: the Express server fetches server-side (no CORS limits).
    try {
      const res = await fetch("/api/parse-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, fxRate }),
      });
      if (res.ok) {
        const j = await res.json();
        if (j && (j.priceGBP || j.year || j.make)) extracted = j;
      }
    } catch { /* fall through */ }

    // 2) Static hosting (Pages): fetch HTML via CORS proxies, parse client-side.
    if (!extracted) {
      for (const proxy of PROXIES) {
        try {
          const html = await fetchWithTimeout(proxy(url));
          extracted = window.CarListingParser.extractListing(url, html, { fxRate });
          if (extracted && extracted.confidence > 0) break;
        } catch { /* try next proxy */ }
      }
    }

    // 3) Last resort: direct fetch (rarely allowed cross-origin).
    if (!extracted && window.CarListingParser) {
      try {
        const html = await fetchWithTimeout(url);
        extracted = window.CarListingParser.extractListing(url, html, { fxRate });
      } catch { /* ignore */ }
    }

    if (!extracted || !window.CarListingParser) {
      setChip("error", "We couldn't read that listing. It may be blocked by the site — please fill the form manually.");
      extractHintMsg("Try a direct listing page (not a search results page).");
      return;
    }

    // Normalise price to GBP (DoneDeal and other IE/NI sites quote in EUR).
    if (!extracted.priceGBP && extracted.priceEUR) {
      extracted.priceGBP = Math.round(extracted.priceEUR / (fxRate || 1.163));
    }

    if (!extracted.priceGBP || !extracted.year) {
      const fields = [];
      if (!extracted.priceGBP) fields.push("price");
      if (!extracted.year) fields.push("year");
      setChip("error", `We couldn't read the ${fields.join(" and ")} from that page. It may be blocked by the site — please fill the form manually.`);
      extractHintMsg("Try a direct listing page (not a search results page).");
      return;
    }

    fillFromListing(extracted);
    const parts = [extracted.make, extracted.model, extracted.year, `£${Math.round(extracted.priceGBP)}`]
      .filter(Boolean).join(" · ");
    const missing = [];
    if (!extracted.co2) missing.push("CO₂");
    if (!extracted.origin) missing.push("origin");

    if (missing.length) {
      setChip("partial", `Extracted: ${parts}. Please add: ${missing.join(", ")}.`);
      if (missing.includes("CO₂")) {
        extractHintMsg("CO₂ is needed for VRT — it's on the UK V5C or the advert's spec. Add it and press Calculate.");
      } else {
        extractHintMsg("Where the car is registered changes duty & VAT by thousands — please select Great Britain or Northern Ireland.");
      }
      // Take the user to the first thing they must fix, not the (empty) results.
      const focusId = missing[0] === "CO₂" ? "co2" : null;
      if (focusId) {
        const el = document.getElementById(focusId);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setChip("ok", `Extracted: ${parts}.`);
    const lowConfidence = (extracted.sources && extracted.sources.includes("url")) || (extracted.confidence != null && extracted.confidence < 0.5);
    if (lowConfidence) {
      extractHintMsg("Most of this was read from the listing link — please double-check the details above.");
    } else {
      extractHintMsg("");
    }
    if (!autoCalculateIfReady()) {
      extractHintMsg(lowConfidence ? "Details above were read from the link — double-check them, then press Calculate." : "Check the details above, then press Calculate.");
    }
  } catch (err2) {
    setChip("error", "Couldn't reach that listing. The site may be blocking automated requests — please enter the details manually.");
  } finally {
    extractBtn.disabled = false;
    extractBtn.classList.remove("loading");
    extractBtn.querySelector(".btn-label").textContent = "🔍 Extract details";
  }
}

extractBtn.addEventListener("click", extractFromUrl);
listingUrl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    extractFromUrl();
  }
});
// If the user changes the pasted link, clear the stale extraction result.
listingUrl.addEventListener("input", () => {
  const cls = extractedChip.className;
  if (cls.includes("ok") || cls.includes("partial")) {
    setChip("", "");
    extractHintMsg("");
  }
});

refreshHints();
restore();
loadFx();
