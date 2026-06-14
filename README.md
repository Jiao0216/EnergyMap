# EnergyMap

**Authors:** Jiao Zhang, Xiaotong Zhuang

**Map the energy of your relationships** — Record interactions, visualize connection patterns in 3D, and get AI-powered relationship insights.

## Overview

EnergyMap is a personal relationship journal that turns people and interactions into an interactive 3D graph. Each person or interaction becomes a node; shared tags and categories form links that reveal patterns in your social energy over time.

Built with React and Three.js, EnergyMap combines structured logging with a WebGL-powered exploration interface, an embedded AI relationship advisor, and optional EverOS cloud sync.

## Features

- **3D relationship graph** — force-directed visualization with search, category filters, and click-to-focus
- **Interaction records** — energy score (-5 to +5), tags, notes, follow-up visits, photos
- **Category management** — Friends, Family, Work, and custom groups
- **AI advisor** — chat to log interactions or ask for pattern analysis (Nebius API)
- **Passwordless auth** — email verification via EmailJS
- **Offline-first** — data stored in `localStorage`, synced to EverOS when configured

## Local development

```bash
npm install
npm run dev
```

Create a `.env` file with:

| Variable | Purpose |
|---|---|
| `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` | Login verification emails |
| `AUTH_SECRET` | HMAC for verification codes |
| `NEBIUS_API_KEY` | AI parse / advisor |
| `EVEROS_API_KEY`, `EVEROS_UPSTREAM` | Optional EverOS cloud memory sync |

## Project structure

```
src/
├── App.jsx                 # Shell UI + login
├── lib/
│   ├── bootstrap.js        # CDN globals (Three.js, ForceGraph3D)
│   └── energymap.js        # Core engine: graph, auth, CRUD, storage
├── advisor/
│   ├── AIAdvisor.jsx       # AI tab wrapper
│   ├── advisor-engine.js   # Chat + Möbius visualization
│   └── advisor.css
└── styles/global.css
api/
├── ai/parse.js             # AI interaction parser
├── auth/                     # Email verification
└── everos/                   # EverOS proxy
```

## Storage keys

Per-user data uses the `em_{email}_*` prefix.

| Key | Content |
|---|---|
| `em_session` | Current user session |
| `em_{email}_notes` | Interaction records |
| `em_{email}_categories` | Category metadata |
| `em_{email}_taxonomy` | Category hierarchy |
| `em_{email}_profile` | User profile |

## Deploy

Static build: `npm run build` → deploy `dist/`.

Serverless routes under `api/` require a platform that runs Vercel-style functions (or deploy them separately on Butterbase).
