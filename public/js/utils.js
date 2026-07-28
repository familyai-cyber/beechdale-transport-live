// ═══════════════════════════════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════════════════════════════

const Utils = {
  // Format minutes into a human-readable string
  formatDue(minutes) {
    if (minutes <= 0) return "Due";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
  },

  // Get time of day in HH:MM format
  getTimeString(date) {
    return date.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  },

  // Check if current time is peak for display
  isPeak() {
    const h = new Date().getHours();
    return (h >= 7 && h < 10) || (h >= 17 && h < 19);
  },

  // Toggle element visibility
  show(el) { if (el) el.style.display = ""; },
  hide(el) { if (el) el.style.display = "none"; },

  // Debounce
  debounce(fn, ms = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  // Save to localStorage
  setStorage(key, value) {
    try { localStorage.setItem(`btl_${key}`, JSON.stringify(value)); }
    catch(e) { /* ignore */ }
  },

  // Load from localStorage
  getStorage(key, fallback = null) {
    try {
      const v = localStorage.getItem(`btl_${key}`);
      return v ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  },

  // Show toast message
  toast(message) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._hide);
    el._hide = setTimeout(() => el.classList.remove("show"), 2000);
  },

  // Route badge color
  getRouteColor(route) {
    const colors = { "15": "#004C98", "49": "#B2005E", "65b": "#00A54F" };
    return colors[route] || "#6B7280";
  },

  // Format last updated time
  timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 15) return "just now";
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    return `${mins}min ago`;
  },
};
