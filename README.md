# Medical Vital Statistics Tracker

A full-stack web application for recording, viewing, and reporting patient vital signs.

## Tech Stack

- **Frontend**: React 19, Chart.js, react-chartjs-2, @react-pdf/renderer
- **Backend**: Express 5, SQLite3
- **Build**: Create React App

## Features

- **Data Entry** — Add/edit vital sign records (glucose, weight, temperature, blood pressure, heart rate, SpO2)
- **Data Grid** — Searchable, sortable table of all records with edit/delete actions
- **Trend Reports** — Line charts for each vital metric over time with date/patient filters
- **Import/Export** — JSON/CSV/PDF export with filterable report view, JSON import

## Quick Start

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Start the Express server (serves API + built React app)
node server/server.js
```

Open [http://localhost:8080](http://localhost:8080).

### Development

```bash
# Run React dev server (requires Express server running for API)
npm start
```

Runs on [http://localhost:3000](http://localhost:3000) with hot reloading.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/vitals` | List all records |
| GET | `/api/vitals/:id` | Get single record |
| POST | `/api/vitals` | Create record |
| PUT | `/api/vitals/:id` | Update record |
| DELETE | `/api/vitals/:id` | Delete record |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `REACT_APP_PDF_EXPORT_URL` | `http://10.0.0.92:8081/report/pdf` | External PDF export endpoint |
