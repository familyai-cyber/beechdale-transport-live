// ═══════════════════════════════════════════════════════════════════
// Client-side data module — replaces Node.js backend for GitHub Pages
// ═══════════════════════════════════════════════════════════════════

// ─── Bus Stops ──────────────────────────────────────────────────
const BusData = {
  stops: [
    { id:"7681", name:"Beechdale Avenue", road:"Ballycullen Road",     lat:53.2801, lng:-6.3284, routes:["15","65b"], direction:"Inbound", description:"Towards City Centre" },
    { id:"4511", name:"Beechdale Avenue", road:"Ballycullen Road",     lat:53.2805, lng:-6.3290, routes:["15","65b"], direction:"Outbound", description:"Towards Ballycullen / Tallaght" },
    { id:"4512", name:"Ballycullen Road", road:"Ballycullen Road",     lat:53.2788, lng:-6.3265, routes:["15","65b"], direction:"Inbound", description:"Towards City Centre" },
    { id:"7682", name:"Ballycullen Road", road:"Ballycullen Road",     lat:53.2792, lng:-6.3270, routes:["15","65b"], direction:"Outbound", description:"Towards Ballycullen" },
    { id:"4513", name:"Orlagh Avenue",    road:"Ballycullen Road",     lat:53.2775, lng:-6.3245, routes:["15","65b"], direction:"Inbound", description:"Towards City Centre" },
    { id:"7683", name:"Orlagh Avenue",    road:"Ballycullen Road",     lat:53.2779, lng:-6.3250, routes:["15","65b"], direction:"Outbound", description:"Towards Ballycullen" },
    { id:"4514", name:"Ballycullen Drive",road:"Ballycullen Road",     lat:53.2760, lng:-6.3220, routes:["15","49","65b"], direction:"Inbound", description:"Towards City Centre" },
    { id:"7684", name:"Ballycullen Drive",road:"Ballycullen Road",     lat:53.2764, lng:-6.3225, routes:["15","49","65b"], direction:"Outbound", description:"Towards Ballycullen / Tallaght" },
    { id:"4763", name:"Firhouse Road West",road:"Firhouse Road",      lat:53.2820, lng:-6.3340, routes:["49"], direction:"Inbound", description:"Towards City Centre" },
    { id:"4764", name:"Firhouse Road West",road:"Firhouse Road",      lat:53.2825, lng:-6.3345, routes:["49"], direction:"Outbound", description:"Towards The Square Tallaght" },
    { id:"4751", name:"Firhouse Road",    road:"Firhouse Road",        lat:53.2835, lng:-6.3310, routes:["49"], direction:"Inbound", description:"Towards City Centre" },
    { id:"4752", name:"Firhouse Road",    road:"Firhouse Road",        lat:53.2840, lng:-6.3315, routes:["49"], direction:"Outbound", description:"Towards The Square Tallaght" },
    { id:"4508", name:"Ballycullen Terminus",road:"Ballycullen Avenue",lat:53.2735, lng:-6.3190, routes:["15","65b"], direction:"Terminus", description:"Ballycullen Terminus" },
    { id:"7685", name:"Ballycullen Avenue",road:"Ballycullen Avenue",  lat:53.2742, lng:-6.3202, routes:["15","65b"], direction:"Inbound", description:"Towards City Centre" },
    { id:"7686", name:"Ballycullen Avenue",road:"Ballycullen Avenue",  lat:53.2748, lng:-6.3208, routes:["15","65b"], direction:"Outbound", description:"Towards Ballycullen Terminus" },
  ],
  routes: {
    "15":  { number:"15", name:"Ballycullen – Clongriffin", via:"City Centre, Croke Park, Fairview", color:"#004C98" },
    "49":  { number:"49", name:"Tallaght – Pearse Street", via:"Firhouse, Kimmage, City Centre", color:"#B2005E" },
    "65b": { number:"65b", name:"Ballycullen – Poolbeg Street", via:"Knocklyon, City Centre", color:"#00A54F" },
  },

  getStop(id) { return this.stops.find(s=>s.id===id); },
  getRoute(num) { return this.routes[num]; },
};

// ─── Mock Departures ────────────────────────────────────────────
const MockData = {
  freq: { "15":{peak:8,day:12,evening:18,night:40}, "49":{peak:10,day:15,evening:22,night:50}, "65b":{peak:18,day:22,evening:30,night:55} },
  getPeriod() {
    const h=new Date().getHours();
    if (h>=7&&h<10) return "peak";
    if (h>=10&&h<17) return "day";
    if (h>=17&&h<19) return "peak";
    if (h>=19&&h<23) return "evening";
    return "night";
  },
  generate(stopId, count=10) {
    const stop=BusData.getStop(stopId); if(!stop) return [];
    const period=this.getPeriod(); const now=new Date(); const deps=[];
    let off=0;
    for(const r of stop.routes) {
      const f=this.freq[r]; const intv=f[period]; let cum=2+Math.floor(Math.random()*4)+off;
      for(let i=0;i<Math.min(5,Math.ceil(count/stop.routes.length));i++) {
        const due=Math.max(1,cum+Math.floor(Math.random()*3)-1);
        deps.push({
          route:r, destination:stop.direction==="Inbound"||stop.direction==="Terminus"?"City Centre / Clongriffin":"Ballycullen / Tallaght",
          dueMinutes:due, dueTime:new Date(now.getTime()+due*60000).toLocaleTimeString("en-IE",{hour:"2-digit",minute:"2-digit"}),
          isDue:due<=1, isRealtime:Math.random()>0.25, stopName:stop.name, stopId:stop.id,
        });
        cum+=intv+Math.floor(Math.random()*4);
      }
      off+=3;
    }
    deps.sort((a,b)=>a.dueMinutes-b.dueMinutes);
    return deps.slice(0,count);
  },
  allNearby() {
    return BusData.stops.map(s=>({
      stop:{id:s.id,name:s.name,road:s.road,direction:s.direction,description:s.description,routes:s.routes},
      departures:this.generate(s.id,3).slice(0,3),
    }));
  },
};

// ─── Luas API (client-side) ─────────────────────────────────────
const LuasData = {
  stops: [
    {code:"RAN",name:"Ranelagh",line:"Green"},{code:"BEE",name:"Beechwood",line:"Green"},
    {code:"COW",name:"Cowper",line:"Green"},{code:"MIL",name:"Milltown",line:"Green"},
    {code:"WND",name:"Windy Arbour",line:"Green"},{code:"DUN",name:"Dundrum",line:"Green"},
    {code:"BAL",name:"Balally",line:"Green"},{code:"KIL",name:"Kilmacud",line:"Green"},
    {code:"STI",name:"Stillorgan",line:"Green"},{code:"SND",name:"Sandyford",line:"Green"},
    {code:"CEN",name:"Central Park",line:"Green"},{code:"GLE",name:"Glencairn",line:"Green"},
    {code:"BRI",name:"Brides Glen",line:"Green"},{code:"STH",name:"St. Stephen's Green",line:"Green"},
    {code:"HAR",name:"Harcourt",line:"Green"},{code:"CHA",name:"Charlemont",line:"Green"},
    {code:"TAL",name:"Tallaght",line:"Red"},{code:"FAT",name:"Fatima",line:"Red"},
  ],
  async forecast(stopCode) {
    const url=`https://luasforecasts.rpa.ie/xml/get.ashx?action=forecast&stop=${stopCode}&encrypt=false`;
    const resp=await fetch(url); const xml=await resp.text();
    const si=this.stops.find(s=>s.code===stopCode);
    const r={stopCode,stopName:si?.name||stopCode,line:si?.line||"",message:"",directions:[]};
    const msg=xml.match(/<message>([^<]*)<\/message>/); if(msg) r.message=msg[1];
    const dirRe=/<direction name="([^"]+)">(.*?)<\/direction>/gs; let m;
    while((m=dirRe.exec(xml))!==null) {
      const trams=[]; const trRe=/<tram dueMins="([^"]*)" destination="([^"]*)"[^>]*\/?>/g; let t;
      while((t=trRe.exec(m[2]))!==null) trams.push({dueMinutes:t[1]==="DUE"?0:parseInt(t[1],10),destination:t[2]});
      r.directions.push({direction:m[1],trams});
    }
    return r;
  },
};
