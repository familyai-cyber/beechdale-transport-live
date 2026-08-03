/* Car Import Cost Calculator – frontend logic (UX redesign) */

const form = document.getElementById("estimate-form");
const results = document.getElementById("results");
const submitBtn = document.getElementById("submit-btn");
const formError = document.getElementById("form-error");
const fxBadge = document.getElementById("fx-badge");
const copyBtn = document.getElementById("copy-btn");
const shareBtn = document.getElementById("share-btn");
const saveBtn = document.getElementById("save-btn");
const printBtn = document.getElementById("print-btn");
const emailBtn = document.getElementById("email-btn");

const STORAGE_KEY = "carImportCalculator.v2";
const SAVED_QUOTES_KEY = "carImportCalculator.quotes.v1";

const fmt = (n) => "€" + Number(n).toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => "€" + Number(n).toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const gbp = (n) => "£" + Number(n).toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

let fxRate = null; // current live rate
let lastSpecSource = ""; // source attribution for the last KB lookup (feature: kb-source)
let lastResult = null; // last {payload, total, label} for share/save (features: share, save)

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
  updateKbNote();
  syncNiChecklist();
}

/** Show the "auto-detected from knowledge base" confirmation only when CO₂ was
 *  actually filled by the KB for the current car (critique-12), and attribute
 *  where the figure came from (feature: kb-source). */
function updateKbNote() {
  const el = document.getElementById("co2-kb-note");
  if (!el) return;
  const co2El = document.getElementById("co2");
  const visible = autoApplied.has("co2") && co2El && co2El.value !== "";
  el.classList.toggle("hidden", !visible);
  if (visible && lastSpecSource) {
    const srcEl = document.getElementById("co2-kb-source");
    if (srcEl) srcEl.textContent = lastSpecSource;
  }
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
  const keys = ["year", "uk-price", "co2", "nox", "shipping", "fuel-type", "co2-standard"];
  const state = {};
  keys.forEach((k) => (state[k] = document.getElementById(k).value));
  state.make = readFieldValue("make");
  state.model = readFieldValue("model");
  state.origin = document.querySelector('input[name="origin"]:checked').value;
  state.buyerType = document.querySelector('input[name="buyerType"]:checked').value;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
function restore() {
  let state;
  try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return; }
  if (!state) return;
  if (state.make) {
    setFieldValue("make", state.make);
    populateModels();
  }
  if (state.model) setFieldValue("model", state.model);
  const keys = ["year", "uk-price", "co2", "nox", "shipping", "fuel-type", "co2-standard"];
  keys.forEach((k) => {
    const el = document.getElementById(k);
    if (state[k] != null && state[k] !== "") el.value = state[k];
  });
  const mo = document.getElementById("make-other");
  if (mo) mo.classList.toggle("hidden", document.getElementById("make").value !== "__other__");
  const so = document.getElementById("model-other");
  if (so) so.classList.toggle("hidden", document.getElementById("model").value !== "__other__");
  if (state.origin) {
    const o = document.querySelector(`input[name="origin"][value="${state.origin}"]`);
    if (o) o.checked = true;
  }
  if (state.buyerType) {
    const b = document.querySelector(`input[name="buyerType"][value="${state.buyerType}"]`);
    if (b) b.checked = true;
  }
  applyKnownSpecs();
}

/* ── Car knowledge base + smart selectors (pass-21) ─────────────── */
const CURRENT_YEAR = new Date().getFullYear();

function otherInputId(id) {
  return id === "make" ? "make-other" : id === "model" ? "model-other" : null;
}

/** Read a field's value, falling back to its "Other" free-text input when a select is set to "__other__". */
function readFieldValue(id) {
  const el = document.getElementById(id);
  if (!el) return "";
  const v = el.value;
  const otherId = otherInputId(id);
  if (v === "__other__" && otherId) {
    const other = document.getElementById(otherId);
    return other ? other.value.trim() : "";
  }
  return String(v).trim();
}

/** Set a field's value. For make/model selects, picks the matching option or falls
 *  back to the "Other" free-text input when the value isn't a known option. */
function setFieldValue(id, value) {
  if (value == null || value === "") return;
  const el = document.getElementById(id);
  if (!el) return;
  const v = String(value);
  const otherId = otherInputId(id);
  if (el.tagName === "SELECT") {
    const opts = Array.from(el.options).map((o) => o.value);
    if (opts.includes(v)) {
      el.value = v;
    } else if (otherId) {
      el.value = "__other__";
      const other = document.getElementById(otherId);
      if (other) other.value = v;
    } else {
      return; // year outside the offered range — ignore
    }
  } else {
    el.value = v;
  }
  flashField(el);
}

function flashField(el) {
  el.classList.remove("flash");
  void el.offsetWidth; // restart animation
  el.classList.add("flash");
}

function populateMakes() {
  const sel = document.getElementById("make");
  if (!sel) return;
  sel.innerHTML = '<option value="" selected>Select make…</option>';
  (window.CarSpecs ? window.CarSpecs.MAKES : []).forEach((m) => {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = m;
    sel.appendChild(o);
  });
  const other = document.createElement("option");
  other.value = "__other__";
  other.textContent = "Other…";
  sel.appendChild(other);
}

function populateModels() {
  const sel = document.getElementById("model");
  if (!sel) return;
  const make = readFieldValue("make");
  sel.innerHTML = "";
  if (!make) {
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Select make first…";
    sel.appendChild(ph);
    sel.disabled = true;
    return;
  }
  const models = window.CarSpecs ? window.CarSpecs.modelsFor(make) : [];
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Select model…";
  sel.appendChild(ph);
  models.forEach((m) => {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = m;
    sel.appendChild(o);
  });
  const other = document.createElement("option");
  other.value = "__other__";
  other.textContent = "Other…";
  sel.appendChild(other);
  sel.disabled = false;
}

function populateYears() {
  const sel = document.getElementById("year");
  if (!sel) return;
  sel.innerHTML = '<option value="" selected>Select year…</option>';
  for (let y = CURRENT_YEAR + 1; y >= 1990; y--) {
    const o = document.createElement("option");
    o.value = String(y);
    o.textContent = String(y);
    sel.appendChild(o);
  }
}

/* Fields the knowledge base may auto-fill — skipped once the user edits them. */
const userTouched = new Set();
/* Fields previously auto-filled from the knowledge base. Cleared when the
   car's make/model/year changes so stale figures never linger (critique-1). */
const autoApplied = new Set();
["co2", "nox", "fuel-type", "co2-standard"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    const mark = () => {
      // An empty value ("Auto-detect" fuel / cleared field) must not block KB fills.
      if (el.value === "") userTouched.delete(id);
      else userTouched.add(id);
      autoApplied.delete(id);
    };
    el.addEventListener("input", mark);
    el.addEventListener("change", mark);
  }
});

/* Set when a partial extraction still needs user input (e.g. the asking
   price). The first form change that completes the data auto-calculates. */
let pendingPartialCalc = false;

/** Drop values the knowledge base auto-filled so a changed car never keeps
 *  the previous car's CO₂/fuel/NOx. Never touches fields the user typed. */
function clearAutoApplied() {
  if (autoApplied.size === 0) return;
  const reset = { co2: "", "fuel-type": "", nox: "", "co2-standard": "wltp" };
  autoApplied.forEach((id) => {
    if (reset[id] !== undefined && !userTouched.has(id)) {
      const el = document.getElementById(id);
      if (el) el.value = reset[id];
    }
  });
  autoApplied.clear();
  lastSpecSource = "";
  updateKbNote();
}

/** Reset every spec field (CO₂, fuel, NOx, standard) and forget both which
 *  ones the KB applied and which the user touched. Used when the car changes
 *  (a different make) or a fresh listing is extracted, so the previous car's
 *  figures never leak into the next one. */
function resetSpecFields() {
  const reset = { co2: "", "fuel-type": "", nox: "", "co2-standard": "wltp" };
  Object.keys(reset).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = reset[id];
    userTouched.delete(id);
  });
  autoApplied.clear();
  lastSpecSource = "";
  updateKbNote();
}

/**
 * Auto-fill CO₂, fuel type, CO₂ standard and NOx from the car-specs knowledge
 * base when make/model/year are known. Skips fields the user has touched.
 * Returns true when anything was applied.
 */
function applyKnownSpecs() {
  if (!window.CarSpecs) return false;
  let make = readFieldValue("make");
  let model = readFieldValue("model");
  const year = Number(document.getElementById("year").value) || 0;
  if (!make || !model || !year) return false;
  let spec = window.CarSpecs.lookup(make, model, year);
  // Free-text "Other" entries can still match a known car — canonicalise them
  // so the KB fills CO₂/fuel/NOx even for typed makes/models (critique-11).
  if (!spec && canonicalizeMakeModel()) {
    make = readFieldValue("make");
    model = readFieldValue("model");
    spec = window.CarSpecs.lookup(make, model, year);
  }
  lastSpecSource = spec ? (spec.source || "") : "";
  if (!spec) return false;

  let applied = false;

  const co2El = document.getElementById("co2");
  if (!userTouched.has("co2") && spec.co2 != null && co2El && co2El.value === "") {
    setFieldValue("co2", spec.co2);
    autoApplied.add("co2");
    applied = true;
  }

  const fuelEl = document.getElementById("fuel-type");
  if (!userTouched.has("fuel-type") && spec.fuelType && fuelEl && fuelEl.value === "") {
    fuelEl.value = spec.fuelType;
    flashField(fuelEl);
    autoApplied.add("fuel-type");
    applied = true;
  }

  const stdEl = document.getElementById("co2-standard");
  if (!userTouched.has("co2-standard") && spec.co2Standard && stdEl && stdEl.value !== spec.co2Standard) {
    stdEl.value = spec.co2Standard;
    flashField(stdEl);
    autoApplied.add("co2-standard");
    applied = true;
  }

  const noxEl = document.getElementById("nox");
  if (!userTouched.has("nox") && spec.nox != null && noxEl && noxEl.value === "") {
    setFieldValue("nox", spec.nox);
    autoApplied.add("nox");
    applied = true;
  }

  if (applied) {
    refreshHints();
    persist();
  }
  markSpecMatchingFields();
  return applied;
}

/** After restoring saved state, tag any field that still matches the knowledge
 *  base as auto-applied, so changing the car re-derives it later. */
function markSpecMatchingFields() {
  if (!window.CarSpecs) return;
  const make = readFieldValue("make");
  const model = readFieldValue("model");
  const year = Number(document.getElementById("year").value) || 0;
  if (!make || !model || !year) return;
  const spec = window.CarSpecs.lookup(make, model, year);
  lastSpecSource = spec ? (spec.source || "") : "";
  if (!spec) return;
  const match = (id, v) => {
    if (v == null) return false;
    const el = document.getElementById(id);
    return !!el && String(el.value) === String(v);
  };
  if (match("co2", spec.co2)) autoApplied.add("co2");
  if (match("fuel-type", spec.fuelType)) autoApplied.add("fuel-type");
  if (match("nox", spec.nox)) autoApplied.add("nox");
  if (match("co2-standard", spec.co2Standard)) autoApplied.add("co2-standard");
  updateKbNote();
}

/** Resolve a free-text "Other" make/model to a canonical knowledge-base entry
 *  (e.g. "Porsche" + "Taycan Turbo" → Porsche · Taycan). Returns true when the
 *  selects were re-pointed to real options so KB lookups succeed. */
function canonicalizeMakeModel() {
  if (!window.CarSpecs) return false;
  const rawMake = readFieldValue("make");
  const rawModel = readFieldValue("model");
  if (!rawMake || !rawModel) return false;
  const mk = window.CarSpecs.matchMake(rawMake);
  if (!mk) return false;
  const md = window.CarSpecs.matchModel(mk, rawModel);
  if (!md) return false;
  if (mk === rawMake && md === rawModel) return false;
  setFieldValue("make", mk);
  populateModels();
  setFieldValue("model", md);
  // Real options now exist — hide the "Other" free-text inputs.
  const mo = document.getElementById("make-other");
  if (mo) mo.classList.add("hidden");
  const so = document.getElementById("model-other");
  if (so) so.classList.add("hidden");
  return true;
}

function onMakeChange() {
  pendingPartialCalc = false; // user is switching cars — a partial extract's auto-calc no longer applies
  const other = document.getElementById("make-other");
  if (other) other.classList.toggle("hidden", document.getElementById("make").value !== "__other__");
  populateModels();
  document.getElementById("model").value = "";
  const so = document.getElementById("model-other");
  if (so) { so.value = ""; so.classList.add("hidden"); }
  // A different make means a different car — drop the previous car's figures.
  resetSpecFields();
  applyKnownSpecs();
}
function onModelChange() {
  pendingPartialCalc = false;
  const other = document.getElementById("model-other");
  if (other) other.classList.toggle("hidden", document.getElementById("model").value !== "__other__");
  clearAutoApplied();
  applyKnownSpecs();
}

/* ── Submit ──────────────────────────────────────────────────────── */
function buildPayload() {
  const origin = document.querySelector('input[name="origin"]:checked').value;
  const buyerType = document.querySelector('input[name="buyerType"]:checked').value;
  return {
    make: readFieldValue("make"),
    model: readFieldValue("model"),
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
  if (!y || y < 1990 || y > CURRENT_YEAR + 1) return { msg: `Please select a valid year of first registration (1990–${CURRENT_YEAR + 1}).`, focusId: "year" };
  const p = Number(document.getElementById("uk-price").value);
  if (!p || p <= 0) return { msg: "Please enter a valid UK purchase price in £.", focusId: "uk-price" };
  const c = document.getElementById("co2").value;
  let fuel = document.getElementById("fuel-type").value;
  // Try the knowledge base first: make/model/year may already auto-fill CO₂
  // (and fuel type when it's still on "Auto-detect").
  if ((c === "" || fuel === "") && fuel !== "electric") applyKnownSpecs();
  const c2 = document.getElementById("co2").value;
  fuel = document.getElementById("fuel-type").value;
  // EVs emit 0 g/km — a blank or 0 CO₂ is valid and needs no figure from the V5C.
  if (fuel === "electric") {
    if (c2 === "") document.getElementById("co2").value = "0";
    return null;
  }
  if (c2 === "" || Number(c2) < 0 || Number.isNaN(Number(c2))) return { msg: "Please enter the CO₂ figure (g/km) from the V5C.", focusId: "co2" };
  return null;
}

async function submit(e) {
  e.preventDefault();
  clearError();
  pendingPartialCalc = false;
  const err = validate();
  if (err) {
    showError(err.msg);
    const focusEl = err.focusId ? document.getElementById(err.focusId) : null;
    if (focusEl) {
      focusEl.focus();
      focusEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

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
  lastResult = { total: data.total, car: data.car };
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

  /* Action buttons (pass-17 + features: share/save/pdf/email) */
  copyBtn.classList.remove("hidden");
  shareBtn.classList.remove("hidden");
  saveBtn.classList.remove("hidden");
  printBtn.classList.remove("hidden");
  emailBtn.classList.remove("hidden");

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
  // 1st choice: our own serverless proxy (Cloudflare Worker / Deno Deploy) when
  // deployed. It fetches the listing server-side (better IP pool + real UA) and
  // returns HTML with permissive CORS. Kept as a placeholder URL so the app
  // works out of the box; replace with your deployed worker URL to enable.
  //   Deploy:  wrangler deploy functions/parse-listing-proxy.js --name car-import-parser
  //   then:    https://car-import-parser.<your-subdomain>.workers.dev
  (u) => ({
    url: `https://car-import-parser.YOUR-WORKER-SUBDOMAIN.workers.dev/?url=${encodeURIComponent(u)}`,
    timeout: 20000,
  }),
  // Jina Reader renders the page server-side and returns it with permissive CORS.
  // It's the only public proxy that reliably reads Autotrader (works on Pages).
  (u) => ({
    url: `https://r.jina.ai/${u}`,
    headers: { "X-Return-Format": "html", "Accept": "text/html" },
  }),
  (u) => ({ url: `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` }),
];

async function fetchWithTimeout(url, ms = 15000, headers) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
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
    if (v == null || v === "") return;
    const el = document.getElementById(id);
    if (!el) return;
    setFieldValue(id, String(v));
  };
  const notes = [];

  if (r.make) {
    const canonMake = window.CarSpecs && window.CarSpecs.matchMake ? window.CarSpecs.matchMake(r.make) : null;
    const make = canonMake || r.make;
    setFieldValue("make", make);
    populateModels();
    if (r.model) {
      const canonModel = window.CarSpecs && window.CarSpecs.matchModel ? window.CarSpecs.matchModel(make, r.model) : null;
      setFieldValue("model", canonModel || r.model);
    }
  } else if (r.model) {
    setFieldValue("model", r.model);
  }
  if (r.year) setVal("year", String(r.year));
  const mo = document.getElementById("make-other");
  if (mo) mo.classList.toggle("hidden", document.getElementById("make").value !== "__other__");
  const so = document.getElementById("model-other");
  if (so) so.classList.toggle("hidden", document.getElementById("model").value !== "__other__");

  // Price: prefer GBP; convert EUR → GBP using the live rate.
  let priceGBP = r.priceGBP;
  if (!priceGBP && r.priceEUR && fxRate) priceGBP = Math.round(r.priceEUR / fxRate);
  if (!priceGBP && r.priceEUR) priceGBP = Math.round(r.priceEUR / 1.163);
  if (priceGBP) setVal("uk-price", String(Math.round(priceGBP)));

  // CO₂ — includes 0 for EVs (the parser sets co2=0 for electric cars).
  if (r.co2 != null) setVal("co2", String(Math.round(r.co2)));

  if (r.fuelType) {
    const el = document.getElementById("fuel-type");
    if (el && ["petrol", "diesel", "hybrid", "electric"].includes(r.fuelType)) {
      el.value = r.fuelType;
    }
  }
  // EVs emit 0 g/km — if the advert didn't state a figure, fill it in.
  if (r.fuelType === "electric" && r.co2 == null) setVal("co2", "0");

  if (r.origin) {
    const o = document.querySelector(`input[name="origin"][value="${r.origin === "NI" ? "NI" : "GB"}"]`);
    if (o) {
      o.checked = true;
      notes.push(r.origin === "NI" ? "NI-registered — no duty or import VAT" : "GB-registered — duty & import VAT apply");
    }
  }

  // VAT-qualifying advert (dealer sale) → the buyer is likely a VAT-registered
  // company that can reclaim the import VAT. Auto-select the dealer option.
  if (r.vatQualified === true) {
    const b = document.querySelector('input[name="buyerType"][value="vat-dealer"]');
    if (b) {
      b.checked = true;
      notes.push("VAT-qualifying sale — dealer import selected");
    }
  }

  // Fill any remaining gaps (CO₂/fuel/NOx) from the knowledge base now that
  // make/model/year are known — even on partial extracts.
  applyKnownSpecs();

  refreshHints();
  persist();
  return notes;
}

function autoCalculateIfReady() {
  const has = (id) => {
    const v = document.getElementById(id).value;
    return v !== "" && Number(v) > 0;
  };
  // CO₂ is "present" when non-zero, OR when the car is an EV (0 g/km is valid).
  const fuel = document.getElementById("fuel-type").value;
  const co2 = document.getElementById("co2").value;
  const co2Ok = fuel === "electric" ? true : co2 !== "" && Number(co2) > 0;
  if (has("year") && has("uk-price") && co2Ok) {
    form.requestSubmit();
    return true;
  }
  return false;
}

/* After a partial extract, calculate as soon as the missing detail is
   filled in — one less click, and the result stays up to date. */
form.addEventListener("change", () => {
  if (!pendingPartialCalc) return;
  pendingPartialCalc = false;
  if (autoCalculateIfReady()) {
    if (extractedChip.className.includes("partial")) {
      setChip("ok", "Details complete — calculating…");
      extractHintMsg("");
    }
  } else {
    pendingPartialCalc = true;
  }
});

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
    //    Only accept results that actually read a price — a Cloudflare "Just a
    //    moment…" shell falls back to URL parsing (no price) and must not be
    //    treated as a full extraction, or the URL-only path below never runs.
    if (!extracted) {
      for (const proxy of PROXIES) {
        try {
          const p = proxy(url);
          const html = await fetchWithTimeout(p.url, p.timeout || 15000, p.headers);
          const r = window.CarListingParser && window.CarListingParser.extractListing(url, html, { fxRate });
          if (r && r.confidence > 0 && (r.priceGBP || r.priceEUR)) { extracted = r; break; }
        } catch { /* try next proxy */ }
      }
    }

    // 3) Last resort: direct fetch (rarely allowed cross-origin).
    if (!extracted && window.CarListingParser) {
      try {
        const html = await fetchWithTimeout(url);
        const r = window.CarListingParser.extractListing(url, html, { fxRate });
        if (r && r.confidence > 0 && (r.priceGBP || r.priceEUR)) extracted = r;
      } catch { /* ignore */ }
    }

    // 4) URL-only fallback: sites like usedcarsni are Cloudflare-blocked for all
    //    proxies, but their link slugs carry make/model/year/fuel/origin. Read
    //    what we can from the URL so the user only types the price.
    let urlOnly = null;
    if (!extracted && window.CarListingParser) {
      urlOnly = window.CarListingParser.extractListing(url, "", { fxRate });
      if (!urlOnly || urlOnly.confidence <= 0) urlOnly = null;
    }

    if (!extracted && !urlOnly) {
      setChip("error", "We couldn't read that listing. It may be blocked by the site — please fill the form manually.");
      extractHintMsg("Try a single advert page (not a search results page).");
      return;
    }

    // Normalise price to GBP (DoneDeal and other IE/NI sites quote in EUR).
    if (extracted && !extracted.priceGBP && extracted.priceEUR) {
      extracted.priceGBP = Math.round(extracted.priceEUR / (fxRate || 1.163));
    }

    // Full extraction must have a price and year to be useful.
    if (extracted && (!extracted.priceGBP || !extracted.year)) {
      const fields = [];
      if (!extracted.priceGBP) fields.push("price");
      if (!extracted.year) fields.push("year");
      setChip("error", `We couldn't read the ${fields.join(" and ")} from that page. It may be blocked by the site — please fill the form manually.`);
      extractHintMsg("Try a single advert page (not a search results page).");
      return;
    }

    // URL-only results are partial: fill what we have, then ask for the price.
    const result = extracted || urlOnly;
    const isUrlOnly = !!urlOnly;
    pendingPartialCalc = false;
    resetSpecFields();
    const notes = fillFromListing(result) || [];

    if (isUrlOnly) {
      const parts = [result.make, result.model, result.year].filter(Boolean).join(" · ");
      // CO₂ may have been auto-filled from the knowledge base after fillFromListing.
      const co2El = document.getElementById("co2");
      const co2Known = co2El.value !== "";
      const ask = [];
      if (!result.priceGBP) ask.push("the asking price");
      if (!co2Known) ask.push("CO₂");
      const hint = ask.length
        ? `We read this from the link — please add ${ask.join(" and ")} from the advert.`
        : "We read this from the link — please double-check the details above.";
      if (ask.length) {
        setChip("partial", `Read from link: ${parts}. Please add ${ask.join(" and ")} and press Calculate.`);
        extractHintMsg(hint);
        pendingPartialCalc = true;
        const focusId = ask.includes("CO₂") ? "co2" : "uk-price";
        const el = document.getElementById(focusId);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        // Every key detail is present (price from the link, CO₂ from the KB) — calculate automatically.
        setChip("ok", `Read from link: ${parts}.`);
        extractHintMsg(hint);
        if (!autoCalculateIfReady()) {
          extractHintMsg("All key details were read from the link — double-check them, then press Calculate.");
        }
      }
      return;
    }

    const parts = [result.make, result.model, result.year, `£${Math.round(result.priceGBP)}`]
      .filter(Boolean).join(" · ");
    const missing = [];
    // CO₂ may now be auto-filled from the knowledge base.
    const co2El2 = document.getElementById("co2");
    const co2Known2 = co2El2.value !== "";
    // EVs emit 0 g/km — co2=0 (or null with fuelType electric) means no figure needed.
    if (!co2Known2) missing.push("CO₂");
    if (!result.origin) missing.push("origin");

    if (missing.length) {
      setChip("partial", `Extracted: ${parts}. Please add: ${missing.join(", ")}.`);
      pendingPartialCalc = true;
      if (missing.includes("CO₂")) {
        extractHintMsg("CO₂ is needed for VRT — it's on the UK V5C or the advert's spec. NOx is optional: Revenue applies a default rate if left blank. Add CO₂ and press Calculate.");
      } else {
        extractHintMsg("Where the car is registered changes duty & VAT by thousands — please select Great Britain or Northern Ireland.");
      }
      // Take the user to the first thing they must fix, not the (empty) results.
      if (missing[0] === "CO₂") {
        const el = document.getElementById("co2");
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else if (missing[0] === "origin") {
        const el = document.querySelector('#origin-group input[type="radio"]');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setChip("ok", `Extracted: ${parts}.`);
    const lowConfidence = (result.sources && result.sources.includes("url")) || (result.confidence != null && result.confidence < 0.5);
    const noteText = notes.length ? " " + notes.join(" · ") : "";
    if (lowConfidence) {
      extractHintMsg("Most of this was read from the listing link — please double-check the details above." + noteText);
    } else {
      extractHintMsg(noteText.trim());
    }
    if (!autoCalculateIfReady()) {
      extractHintMsg((lowConfidence ? "Details above were read from the link — double-check them, then press Calculate." : "Check the details above, then press Calculate.") + noteText);
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

const clearUrlBtn = document.getElementById("clear-url");
function syncClearBtn() {
  if (clearUrlBtn) clearUrlBtn.classList.toggle("hidden", listingUrl.value === "");
}
listingUrl.addEventListener("input", () => {
  pendingPartialCalc = false;
  syncClearBtn();
  const cls = extractedChip.className;
  if (cls.includes("ok") || cls.includes("partial")) {
    setChip("", "");
    extractHintMsg("");
  }
});
if (clearUrlBtn) {
  clearUrlBtn.addEventListener("click", () => {
    listingUrl.value = "";
    pendingPartialCalc = false;
    syncClearBtn();
    setChip("", "");
    extractHintMsg("");
    listingUrl.focus();
  });
}
syncClearBtn();

refreshHints();
loadFx();

/* ── Smart selector wiring (pass-21) ────────────────────────────── */
const makeEl = document.getElementById("make");
const modelEl = document.getElementById("model");
const yearEl = document.getElementById("year");
const makeOtherEl = document.getElementById("make-other");
const modelOtherEl = document.getElementById("model-other");

// Populate the selects BEFORE restoring saved state so known values map to
// real options instead of falling into the "Other" free-text inputs.
populateMakes();
populateYears();
if (!readFieldValue("make")) populateModels(); // leaves model select disabled

restore();

// Feature: share deep-links — a #q= hash restores an exact quote.
(function applySharedHash() {
  const m = /#q=([^&]+)/.exec(location.hash);
  if (!m) return;
  try {
    const s = JSON.parse(decodeURIComponent(m[1]));
    if (s && typeof s === "object") applySharedState(s);
  } catch { /* ignore malformed hashes */ }
})();

makeEl.addEventListener("change", onMakeChange);
modelEl.addEventListener("change", onModelChange);
// Changing the car (make/model/year) drops any KB-auto-filled figures first
// so a different car never keeps the old car's CO₂/fuel/NOx (critique-1).
yearEl.addEventListener("change", () => { pendingPartialCalc = false; clearAutoApplied(); applyKnownSpecs(); });
if (makeOtherEl) {
  makeOtherEl.addEventListener("input", () => {
    pendingPartialCalc = false;
    populateModels();
    resetSpecFields();
    applyKnownSpecs();
  });
}
if (modelOtherEl) {
  modelOtherEl.addEventListener("input", () => { pendingPartialCalc = false; clearAutoApplied(); applyKnownSpecs(); });
}

// Click-to-select the pasted URL so pasting replaces it in one step (pass-21).
const listingUrlEl = document.getElementById("listing-url");
if (listingUrlEl) {
  listingUrlEl.addEventListener("focus", () => listingUrlEl.select());
}

/* ══ Feature batch: NI checklist · deep links · saved quotes · PDF/email · reg-plate ══ */

/** Toggle the NI used-car checklist when the origin switches to NI. */
function syncNiChecklist() {
  const el = document.getElementById("ni-checklist");
  if (!el) return;
  const origin = document.querySelector('input[name="origin"]:checked');
  el.classList.toggle("hidden", !origin || origin.value !== "NI");
}

/** Snapshot the current form into a compact shareable state object. */
function buildShareState() {
  return {
    origin: document.querySelector('input[name="origin"]:checked').value,
    buyerType: document.querySelector('input[name="buyerType"]:checked').value,
    year: document.getElementById("year").value,
    make: readFieldValue("make"),
    model: readFieldValue("model"),
    price: document.getElementById("uk-price").value,
    co2: document.getElementById("co2").value,
    nox: document.getElementById("nox").value,
    shipping: document.getElementById("shipping").value,
    fuelType: document.getElementById("fuel-type").value,
    co2Standard: document.getElementById("co2-standard").value,
  };
}

/** Restore a shared/saved state onto the form and re-calculate. */
function applySharedState(s) {
  if (!s || typeof s !== "object") return;
  if (s.make) {
    setFieldValue("make", s.make);
    populateModels();
  }
  if (s.model) setFieldValue("model", s.model);
  const keyMap = { year: "year", price: "uk-price", co2: "co2", nox: "nox", shipping: "shipping", fuelType: "fuel-type", co2Standard: "co2-standard" };
  Object.keys(keyMap).forEach((k) => {
    if (s[k] != null && s[k] !== "") {
      const el = document.getElementById(keyMap[k]);
      if (el) el.value = s[k];
    }
  });
  const mo = document.getElementById("make-other");
  if (mo) mo.classList.toggle("hidden", document.getElementById("make").value !== "__other__");
  const so = document.getElementById("model-other");
  if (so) so.classList.toggle("hidden", document.getElementById("model").value !== "__other__");
  if (s.origin) {
    const o = document.querySelector(`input[name="origin"][value="${s.origin}"]`);
    if (o) o.checked = true;
  }
  if (s.buyerType) {
    const b = document.querySelector(`input[name="buyerType"][value="${s.buyerType}"]`);
    if (b) b.checked = true;
  }
  refreshHints();
  applyKnownSpecs();
  persist();
  form.requestSubmit();
}

/* ── Share deep-links (feature 3) ───────────────────────────────── */
let shareNoteTimer = null;
function showShareNote(text, ms) {
  const note = document.getElementById("share-note");
  const span = document.getElementById("share-note-text");
  if (!note || !span) return;
  span.textContent = text;
  note.classList.remove("hidden");
  clearTimeout(shareNoteTimer);
  shareNoteTimer = setTimeout(() => note.classList.add("hidden"), ms || 3000);
}

shareBtn.addEventListener("click", async () => {
  if (!lastResult) return;
  const state = buildShareState();
  const hash = "#q=" + encodeURIComponent(JSON.stringify(state));
  const url = location.origin + location.pathname + location.search + hash;
  try {
    await navigator.clipboard.writeText(url);
    history.replaceState(null, "", hash);
    showShareNote("🔗 Link copied — it will re-open this exact quote.", 3000);
  } catch {
    showShareNote("Couldn't copy — your browser blocked the clipboard.", 4000);
  }
});

/* ── Saved quotes / compare (feature 4) ─────────────────────────── */
function loadSavedQuotes() {
  try { return JSON.parse(localStorage.getItem(SAVED_QUOTES_KEY)) || []; } catch { return []; }
}

function renderSavedQuotes() {
  const box = document.getElementById("saved-quotes");
  const tbody = document.getElementById("saved-quotes-body");
  if (!box || !tbody) return;
  const quotes = loadSavedQuotes();
  box.classList.toggle("hidden", quotes.length === 0);
  tbody.innerHTML = "";
  quotes.forEach((q, i) => {
    const tr = document.createElement("tr");
    tr.title = "Click to reload this quote";
    const tdCar = document.createElement("td");
    tdCar.textContent = q.label;
    const tdOrg = document.createElement("td");
    tdOrg.textContent = q.state.origin === "NI" ? "🇮🇪 NI" : "🇬🇧 GB";
    const tdB = document.createElement("td");
    tdB.textContent = q.state.buyerType === "vat-dealer" ? "Dealer" : "Private";
    const tdT = document.createElement("td");
    tdT.className = "num";
    tdT.textContent = fmt(q.total);
    const tdX = document.createElement("td");
    const del = document.createElement("button");
    del.className = "row-del";
    del.type = "button";
    del.textContent = "✕";
    del.title = "Delete this saved quote";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      const all = loadSavedQuotes();
      all.splice(i, 1);
      try { localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(all)); } catch {}
      renderSavedQuotes();
    });
    tdX.appendChild(del);
    tr.appendChild(tdCar);
    tr.appendChild(tdOrg);
    tr.appendChild(tdB);
    tr.appendChild(tdT);
    tr.appendChild(tdX);
    tr.addEventListener("click", () => {
      applySharedState(q.state);
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    tbody.appendChild(tr);
  });
}

saveBtn.addEventListener("click", () => {
  if (!lastResult) return;
  const state = buildShareState();
  const label = [state.make, state.model, state.year].filter(Boolean).join(" ") || "Quote";
  const quotes = loadSavedQuotes();
  quotes.unshift({ ts: Date.now(), label, total: lastResult.total, state });
  const trimmed = quotes.slice(0, 30);
  try { localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(trimmed)); } catch {}
  renderSavedQuotes();
  showShareNote("💾 Quote saved — see the table below.", 3000);
});
renderSavedQuotes();

/* ── PDF / email (feature 5) ────────────────────────────────────── */
printBtn.addEventListener("click", () => window.print());

emailBtn.addEventListener("click", () => {
  const summary = document.getElementById("result-summary").textContent;
  const total = document.getElementById("big-total").textContent.replace(/\s+/g, " ").trim();
  const car = [readFieldValue("make"), readFieldValue("model")].filter(Boolean).join(" ") || "Car";
  const subject = encodeURIComponent(`Car import cost estimate — ${car}`);
  const body = encodeURIComponent(summary + "\n\nTotal: " + total + "\n\nEstimated at the Car Import Cost Calculator.");
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
});

/* ── UK/NI reg-plate lookup (feature 6) ─────────────────────────── */
const regPlateEl = document.getElementById("reg-plate");
const dvlaLinkEl = document.getElementById("dvla-link");
const regPlateHintEl = document.getElementById("reg-plate-hint");
// gov.uk MOT history accepts a query param (DVLA's vehicle enquiry is POST-only).
const DVLA_CHECK_URL = "https://www.gov.uk/check-mot-history?registrationNumber=";

/** Current-format GB plates carry the year in the middle, e.g. YN20 ABC → 2020. */
function yearFromGbPlate(text) {
  const m = /\b[A-Z]{2}\s?(\d{2})\s?[A-Z]{3}\b/.exec(String(text || ""));
  if (!m) return null;
  const yy = Number(m[1]);
  return yy >= 50 ? 2000 + (yy - 50) : 2000 + yy;
}

if (regPlateEl) {
  regPlateEl.addEventListener("input", () => {
    const plate = regPlateEl.value.trim().toUpperCase();
    const year = yearFromGbPlate(plate);
    const yearField = document.getElementById("year");
    if (year && yearField && !yearField.value) {
      yearField.value = String(year);
      flashField(yearField);
    }
    if (dvlaLinkEl) {
      dvlaLinkEl.href = plate ? DVLA_CHECK_URL + encodeURIComponent(plate) : "#";
      dvlaLinkEl.classList.toggle("hidden", !plate);
    }
    if (regPlateHintEl) {
      regPlateHintEl.textContent = year
        ? `Plate reads as ${year} — the year field was filled in for you.`
        : "Optional — we can read the year from the plate and link to the DVLA check.";
    }
  });
}

syncNiChecklist();
