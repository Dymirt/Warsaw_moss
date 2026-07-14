# Eco Navigate

Eco Navigate is an interactive environmental map for Warsaw. It brings a public
tree inventory and air-quality monitoring data into one interface so residents and
visitors can better understand the environment around them.

The current repository is a working data-viewer prototype. The broader product
vision also includes sustainable routing, bike-share, recycling, and EV charging;
those ideas are listed under [Roadmap](#roadmap) and are not presented as finished
features.

## What works

- Interactive Leaflet map centered on Warsaw
- 91 air-quality stations, color-coded by reported status
- Station popups with particulate reading, address, timestamp, and source
- 10,000 tree-inventory records rendered efficiently on a canvas layer
- Tree popups with species, district, location, and recorded health
- Accessible layer toggles for turning environmental overlays on and off
- Browser geolocation with clear loading, success, and error feedback
- Responsive desktop and mobile layout
- No client-side API key or application backend required

## Data notice

This prototype uses bundled snapshots rather than live API requests:

- `src/data/air-quality.json` contains 91 stations and measurements dated
  **23 November 2024**. The records identify the City of Warsaw and Poland's Chief
  Inspectorate of Environmental Protection as data sources.
- `src/data/trees.json` contains 10,000 compacted records from Warsaw's public tree
  inventory (resource ID `ed6217dd-c8d0-4f7b-8bed-3b7eb81a95ba`).

The app therefore must not be used as a real-time health advisory. Refreshing the
datasets through a backend or scheduled data pipeline is a roadmap item.

## Getting started

### Requirements

- Node.js 18 or newer
- npm
- Internet access for OpenStreetMap tiles

### Install and run

```bash
git clone https://github.com/Dymirt/Warsaw_moss.git
cd Warsaw_moss
npm install
npm run dev
```

Open the local URL printed by Vite, normally
`http://localhost:5173`.

The location feature works on `localhost` and on HTTPS deployments. The browser
will ask for permission when **Use my location** is selected. The coordinates stay
out of an application backend; recentering the map does request the corresponding
tiles from OpenStreetMap.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the source tree |

## Project structure

```text
.
├── public/
│   └── eco-navigate.svg       # Application icon
├── src/
│   ├── banner/                # Brand rail and information panel
│   ├── data/                  # Bundled environmental-data snapshots
│   ├── maps/                  # Leaflet map, layers, markers, and popups
│   ├── App.jsx                # Geolocation state and page composition
│   └── main.jsx               # React entry point
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

The compact tree dataset stores each record using the field order declared in its
`fields` property. `Map.jsx` converts those rows to GeoJSON once and renders them
with Leaflet's canvas renderer, avoiding thousands of SVG DOM nodes.

## Production build

```bash
npm run lint
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static host. No environment
variables are currently needed.

## Roadmap

- Refresh air-quality and tree data through a server-side Warsaw API integration
- Add walking and cycling routes scored by pollution and tree cover
- Add bike-share stations, recycling points, parks, and EV charging locations
- Add marker clustering or viewport-based loading for larger inventories
- Add automated component and end-to-end tests
- Add Polish localization and translated source descriptions

## Authors

- Ziad Karoune
- Dmytro Kolida
