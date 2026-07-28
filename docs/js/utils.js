// ═══════════════════════════════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════════════════════════════

const Utils = {
  fmt(m) { return m <= 0 ? "NOW" : m < 60 ? m : Math.floor(m/60)+"h"+((m%60)?m%60:"") },
  due(m) { return m <= 0 ? "Due" : m === 1 ? "1 min" : m + " min" },
  time(d) { return d.toLocaleTimeString("en-IE",{hour:"2-digit",minute:"2-digit"}) },
  color(r) { return {"15":"#004C98","49":"#B2005E","65b":"#00A54F"}[r]||"#6B7280" },

  show(el) { if(el) el.style.display="" },
  hide(el) { if(el) el.style.display="none" },

  debounce(fn,ms=200) { let t; return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)} },

  storage(k,v) {
    if(v!==undefined) try{localStorage.setItem(`btl_${k}`,JSON.stringify(v))}catch(e){}
    else try{const r=localStorage.getItem(`btl_${k}`);return r?JSON.parse(r):null}catch(e){return null}
  },

  toast(m) {
    const el=document.getElementById("toast");
    if(!el)return; el.textContent=m; el.classList.add("show");
    clearTimeout(el._h); el._h=setTimeout(()=>el.classList.remove("show"),2000);
  },
};
