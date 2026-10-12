# LeadIQ — Acquisition Lead Intelligence

A full-stack prototype for prioritizing potential acquisition targets with transparent, rule-based fit scoring and data-quality signals.

> **Prototype data notice:** All company records in this project are synthetic demonstration data. The scores are illustrative prioritization aids, not investment advice or verified assessments of real companies.

## Features

- Acquisition pipeline dashboard with summary metrics
- Transparent fit score (0–100) based on revenue, employee count, industry, and website/verification signals
- Duplicate detection by normalized company name
- Search by company, industry, or location
- Industry filtering
- Data-quality flags for missing website and unverified records
- CSV export of the displayed results
- REST API built with Express
- Local JSON-file persistence, so no MySQL installation is needed to run the submission
- Responsive UI for desktop and smaller screens

## Run locally

Requirements: Node.js 18+ and npm.

### 1. Start the backend

Open a terminal in the project root:

```bash
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

Check it:
- `http://localhost:5000/api/health`
- `http://localhost:5000/api/leads`

### 2. Start the frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

Keep both terminals open while using the app.

## API

- `GET /api/health` — service status
- `GET /api/leads` — unique leads, with optional query parameters:
  - `search`: searches name, industry, and location
  - `industry`: filters by exact industry
- `GET /api/leads/:id` — lead details including scoring breakdown
- `POST /api/leads` — add a lead (JSON body with `name`, `industry`, `location`, `revenue`, `employees`, `website`, `verified`)
- `GET /api/quality` — quality summary

## Scoring logic

| Criterion | Points |
|---|---:|
| Revenue at least $5M | +35 |
| Employee count between 20 and 200 | +25 |
| Industry is SaaS or IT Services | +25 |
| Website is present | +10 |
| Record is marked verified | +5 |
| Maximum | 100 |

The score is a transparent preliminary fit heuristic. It is not a valuation, diligence result, or recommendation to acquire a company. The UI shows data-quality warnings separately so users can distinguish a high score from complete/verified information.

## Data storage strategy

For a quick, easy-to-run interview prototype, the backend persists records to `backend/data/leads.json`. This avoids requiring a database server or credentials during evaluation. The JSON file is seeded with synthetic sample records the first time the backend starts. For a production deployment, I would migrate this repository to MySQL/PostgreSQL, add migrations, validation, authentication/authorization, audit logging, and a trusted company-data source.

## Project structure

```text
LeadIQ_Submission/
  backend/
    data/leads.json
    server.js
    package.json
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      App.jsx
      App.css
      main.jsx
  docs/
    interview-answers.md
    walkthrough-script.md
```

## Important limitations

- Synthetic demo data only; no live company enrichment or scraping is performed.
- “Verified” is a sample data flag, not independent verification by this app.
- Fit scores are rule-based and illustrative.
- The prototype has no user authentication or production security controls.
