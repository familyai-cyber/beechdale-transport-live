/* Car Import Cost Calculator – frontend logic */

const form = document.getElementById("estimate-form");
const results = document.getElementById("results");
const submitBtn = document.getElementById("submit-btn");

const euro = (n) =>
  "€" + Number(n).toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const gbp = (n) =>
  "£" + Number(n).toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const ORIGIN_HINTS = {
  GB: "GB cars pay 10% customs duty. If first registered on/after 1 Jan 2021, 23% import VAT also applies (unless you can claim UK-origin under the Trade & Cooperation Agreement).",
  NI: "NI cars are inside the EU customs union & VAT area: no customs duty and no import VAT. You'll still pay VRT when registering in Ireland.",
};
const BUYER_HINTS = {
  private: "As a private buyer you pay import VAT (if it applies) as part of the total cost.",
  "vat-dealer": "A VAT-registered dealer can reclaim import VAT as input VAT, so it's excluded from the net total below.",
};

function refreshHints() {
  document.getElementById("origin-hint").textContent =
    ORIGIN_HINTS[document.querySelector('input[name="origin"]:checked').value];
  document.getElementById("buyer-hint").textContent =
    BUYER_HINTS[document.querySelector('input[name="buyerType"]:checked').value];
}
form.addEventListener("change", refreshHints);
refreshHints();

function fill(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function submit(e) {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Calculating…";

  try {
    const payload = {
      make: document.getElementById("make").value.trim(),
      model: document.getElementById("model").value.trim(),
      firstRegYear: Number(document.getElementById("year").value),
      ukPriceGBP: Number(document.getElementById("uk-price").value),
      co2: Number(document.getElementById("co2").value),
      nox: Number(document.getElementById("nox").value) || 0,
      origin: document.querySelector('input[name="origin"]:checked').value,
      buyerType: document.querySelector('input[name="buyerType"]:checked').value,
      shippingEUR: Number(document.getElementById("shipping").value) || 0,
    };

    const res = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");

    render(data);
  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Calculate import cost";
  }
}

function render(data) {
  const b = data.breakdown;

  const carLabel = [data.car.make, data.car.model].filter(Boolean).join(" ") || "This car";
  const originLabel = data.car.origin === "NI" ? "Northern Ireland" : "Great Britain";
  const buyerLabel = data.car.buyerType === "vat-dealer" ? "VAT-registered dealer" : "Private buyer";
  document.getElementById("result-summary").textContent =
    `${carLabel} (${data.car.year || "year unknown"}, ${originLabel}) imported as a ${buyerLabel}. ` +
    `FX: €1 ≈ £${(1 / b.fxRate).toFixed(3)}`;

  fill("r-price-gbp", `${gbp(b.carPriceGBP)} → ${euro(b.carPriceEUR)}`);
  fill("r-price-eur", euro(b.carPriceEUR));
  fill("r-shipping", euro(b.shippingEUR));
  fill("r-duty-rate", `(${(b.dutyRate * 100).toFixed(0)}%)`);
  fill("r-duty", euro(b.duty));
  fill("r-vat-note", b.vatApplies ? "(applies)" : b.vatReclaimable ? "(applies)" : "(no VAT)");
  fill("r-vat", euro(b.vat));
  fill("r-vrt-rate", `(${(b.vrtRate * 100).toFixed(0)}%)`);
  fill("r-vrt", euro(b.vrt));
  fill("r-nox", euro(b.noxLevy));
  fill("r-reg", euro(b.registrationFee));
  fill("r-nct", euro(b.nctFee));
  fill("r-total", euro(data.total));

  const grandRow = document.getElementById("r-grand-row");
  if (b.vatReclaimable) {
    grandRow.classList.remove("hidden");
    fill("r-grand", euro(data.grandTotalInclVat));
  } else {
    grandRow.classList.add("hidden");
  }

  document.getElementById("n-omsp").textContent =
    `VRT is charged on Revenue's OMSP (Open Market Selling Price). We estimate it as UK price + shipping + duty (${euro(b.omsp)}). ` +
    `Revenue's official OMSP may differ.`;

  document.getElementById("n-motor-tax").textContent =
    `Ongoing annual motor tax (not included above): approx. ${euro(b.annualMotorTax)} (CO2 band ${b.motorTaxBand}).`;

  document.getElementById("n-disclaimer").textContent =
    `Estimate only. Final VRT/duty are set by Revenue at registration. Electric cars may qualify for VRT relief — check with Revenue.`;

  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", submit);
