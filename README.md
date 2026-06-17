# Medelite Facility Assessment Report Generator

A lightweight local web application for generating a Medelite facility assessment snapshot from a CMS Certification Number (CCN). The app fetches public CMS nursing home data, combines it with user-entered operational inputs, and exports a branded PDF report.

## Features

- Dynamic CCN lookup against the CMS Provider Data Catalog.
- Facility name override while preserving the static `INFINITE` platform branding.
- Manual operational inputs for EMR, current census, patient type, Medelite history, provider performance, and medical coverage.
- CMS data preview for location, certified beds, and star ratings.
- Branded PDF export with a clickable Medicare Care Compare profile link.
- Responsive assessment-tool interface.

## Tech Stack

- React 19
- Vite
- Express
- jsPDF
- jsPDF AutoTable

## Getting Started

Install dependencies:

```bash
npm install
```

Start the backend API proxy:

```bash
npm run server
```

In a second terminal, start the frontend:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://127.0.0.1:5173/
```

## Test Case

Use the assignment reference CCN:

```text
686123
```

Expected live facility:

```text
KENDALL LAKES HEALTHCARE AND REHAB CENTER
```

The generated Medicare source link follows this format:

```text
https://www.medicare.gov/care-compare/details/nursing-home/686123
```

## CMS API Notes

The backend uses the CMS Provider Data Catalog datastore query endpoint for nursing home provider information:

```text
https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0
```

CCN filtering is done with CMS datastore conditions:

```text
conditions[0][property]=cms_certification_number_ccn
conditions[0][value]=<CCN>
conditions[0][operator]=%3D
```

The `=` operator is URL-encoded as `%3D` in the server request.

## Field Mapping

The report maps CMS fields and manual inputs as follows:

| Report Field | Source |
| --- | --- |
| Name of Facility | CMS `provider_name`, overridden by manual facility name if entered |
| Location | CMS `location` or address fields |
| EMR | Manual input |
| Census Capacity | CMS `number_of_certified_beds` |
| Current Census | Manual input |
| Type of Patient | Manual input |
| Previous Coverage from Medelite | Manual input |
| Previous Provider Performance from Medelite | Manual input |
| Medical Coverage | Manual input |
| Overall Star Rating | CMS `overall_rating` |
| Health Inspection | CMS `health_inspection_rating` |
| Staffing | CMS `staffing_rating` |
| Quality of Resident Care | CMS `qm_rating` |

## Assumptions

- The app uses current live CMS Provider Data Catalog values. These may differ from the static reference PDF if CMS data has refreshed since the sample was created.
- Manual operational fields are intentionally user-entered because they are not available in the public CMS provider dataset.
- Hospitalization and emergency department metrics are optional bonus scope and are not included in the current MVP.
- The backend proxy is used to avoid browser-side CORS issues and to keep CMS query construction in one place.

## Validation

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## Deployment Notes

The app is configured for a single full-stack Node deployment. The Express server serves the built React app from `dist/` and exposes the API under `/api`.

Recommended Render setup:

```text
Service Type: Web Service
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start
```

The server uses `process.env.PORT`, which Render provides automatically. For local development, it falls back to port `3001`.
