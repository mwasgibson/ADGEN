# AdGen

Multi-format display and social banner ad studio with a Swiss industrial aesthetic and zero generic AI clutter.

Paste a product name, description, or URL → synthesize a cohesive campaign → export every standard IAB and social size as PNG, JPEG, or IAB HTML5.

Works **with or without** a Gemini API key. Without a key, AdGen falls back to a deterministic copy engine so the studio stays usable offline or in restricted environments.

## Features

- URL metadata inspection (title, description, OG image, domain)
- Campaign synthesis (Gemini when configured, deterministic fallback otherwise)
- 10 standard formats: Medium Rectangle, Leaderboard, Half Page, Billboard, mobile units, social square & landscape
- Live canvas preview with zoom, category filters, and image controls
- Export PNG / JPEG @2x and copy IAB HTML5 bundles
- Local campaign history (browser `localStorage`)
- Curated industrial / editorial palettes and typography motifs

## Requirements

- Node.js 20+
- Optional: `GEMINI_API_KEY` for AI-authored copy (otherwise deterministic mode)

## Setup

```bash
npm install
cp .env.example .env   # optional — set GEMINI_API_KEY if you have one
npm run dev            # development (Vite + Express on port 3000)
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
npm run build          # builds the React client into dist/
NODE_ENV=production npm start
```

The Express server serves the API and the static `dist/` SPA on the same port.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Full-stack dev server |
| `npm run build` | Client production build |
| `npm start` | Run server (use `NODE_ENV=production` after build) |
| `npm run lint` | Typecheck |

## Environment

| Variable | Required | Meaning |
|----------|----------|---------|
| `GEMINI_API_KEY` | No | Enables Gemini campaign synthesis |
| `GEMINI_MODEL` | No | Override model (default `gemini-2.0-flash`) |
| `PORT` | No | Server port (default `3000`) |
| `APP_URL` | No | Public URL for share / deploy metadata |

## Privacy

Campaign history and uploaded product images stay in the browser (`localStorage` / memory). URL inspection only fetches the page you provide. No telemetry.
