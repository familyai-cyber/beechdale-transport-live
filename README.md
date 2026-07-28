# 🚌 Beechdale Transport Live

**Real-time public transport departures for Beechdale, Ballycullen, Dublin 24**

A beautiful, mobile-responsive web app showing live bus times for routes **15**, **49**, and **65b** serving the Beechdale / Ballycullen area.

## Features

- 🚏 **Real-time departure board** — see next bus times for any stop
- ⭐ **Favourite stops** — save your most-used stops for quick access
- 🔍 **Search** — find stops by name or route number
- 🗺️ **Route info** — view route maps and descriptions
- 🌙 **Dark mode** — auto-saves your preference
- 📱 **PWA ready** — install on your phone's home screen
- 🔄 **Auto-refresh** — departures update every 30 seconds

## Routes Covered

| Route | Route                     | Via                                      |
| ----- | ------------------------- | ---------------------------------------- |
| **15**  | Ballycullen – Clongriffin | City Centre, Croke Park, Fairview        |
| **49**  | Tallaght – Pearse Street  | Firhouse, Ballycullen, Kimmage, City Centre |
| **65b** | Ballycullen – Poolbeg St  | Knocklyon, City Centre                   |

## Quick Start

```bash
# 1. Install dependencies
cd transport-app
npm install

# 2. Start the server (demo mode)
npm start

# 3. Open in your browser
#    http://localhost:3001
```

## Live Data Setup

For **real-time** (not simulated) data, you need a free API key from the National Transport Authority:

1. Email **developer@nationaltransport.ie** to request a free GTFS Realtime API key
2. Create a `.env` file or copy `.env.example`:

```
TFI_API_KEY=your-api-key-here
USE_MOCK_DATA=false
```

3. Restart the server — the app will now show live times

## Deploying

### One-click Deploy (Recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/familyai-cyber/beechdale-transport-live)

Or manually via the [Render Dashboard](https://dashboard.render.com/):
1. Click **New +** → **Blueprint**
2. Connect your GitHub repo
3. Render auto-detects the `render.yaml` config

### Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/Uu6I3G?referralCode=beechdale)

### Deploy to Fly.io

```bash
fly launch
fly deploy
```

### Deploy to a VPS

```bash
npm install -g pm2
pm2 start server.js --name beechdale-transport
```

### Local network (for testing on phone)

```bash
# Find your local IP (e.g. 192.168.1.10)
ipconfig
# Then on your phone, visit:
http://192.168.1.10:3001
```

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** Vanilla HTML/CSS/JS (no framework — fast and lightweight)
- **Data:** NTA GTFS Realtime API (or built-in mock data for demo)
- **Design:** Mobile-first, responsive, dark/light mode

## Data Source

Powered by the [National Transport Authority](https://www.nationaltransport.ie/developer-apis/) GTFS Realtime API.

---

Built for Beechdale, Ballycullen, Dublin 24 🚌
