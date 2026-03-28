# swissqrbill-microservice

Self-hostable Swiss QR Bill microservice with HTTP API and HTML form, powered by [`schoero/swissqrbill`](https://github.com/schoero/swissqrbill).

## Why this project exists

The goal is not to reimplement the Swiss QR Bill standard from scratch. This service wraps the upstream `swissqrbill` library with:

- a simple HTML form on `/`
- a machine-friendly HTTP API
- stateless SVG and PDF output
- validation and guardrails suitable for open-source reuse

This keeps the QR Bill logic delegated to the library that already tracks the standard, while exposing a small service that shops, ERP systems, and operators can use directly.

## Why `swissqrbill`

According to the official upstream repository, `swissqrbill` natively supports:

- SVG generation for the QR bill payment section
- PDF generation via the PDFKit-based renderer
- Node.js and browser usage

That makes it a good fit for a small wrapper service with low standard-compliance risk.

## Features

- `GET /` HTML form with server-rendered preview
- `GET /api/qr` for query-string based generation
- `POST /api/qr` for JSON integrations
- `GET /health` health probe
- SVG output
- PDF output
- rate limiting
- strict TypeScript build
- Docker support
- no database
- stateless download URLs based on the same request parameters

## Supported fields

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | Payee name |
| `street` | yes | Payee street |
| `number` | optional | Building number |
| `postcode` | yes | Postal code |
| `city` | yes | City |
| `iban` | yes | CH/LI IBAN |
| `reference` | optional | Required when using QR-IBAN |
| `bic` | optional | Returned in metadata/summary, not required for payload |
| `amount` | optional | Non-negative number |
| `message` | optional | Unstructured message |
| `address` | optional | UI / metadata-only field |
| `personalNote` | optional | UI / metadata-only field |
| `currency` | optional | Defaults to `CHF`, supports `CHF` and `EUR` |
| `country` | optional | Defaults to `CH` |

## Validation rules

- required payee fields must not be empty
- `iban` must be a valid CH or LI IBAN
- `amount` must be numeric and non-negative
- `postcode` only accepts letters, digits, spaces, and hyphens
- field lengths are capped to stay within Swiss QR Bill layout limits
- QR-IBAN requires a QR reference

## Local run

Requirements:

- Node.js 25 stable
- npm

Install and start:

```bash
npm install
npm run dev
```

Build and run production mode:

```bash
npm run build
npm start
```

The service listens on `http://localhost:3000` by default.

## Environment

Example values are in [.env.example](/Users/vlak/swissqrbill-microservice/.env.example).

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `HOST` | `0.0.0.0` | Bind host |
| `LOG_LEVEL` | `info` | Fastify logger level |
| `RATE_LIMIT_MAX` | `60` | Max requests per window |
| `RATE_LIMIT_WINDOW` | `1 minute` | Rate limit window |
| `COMPOSE_PROJECT_NAME` | `qr-ua-in` | Docker Compose project name |
| `TUNNEL_TOKEN` | empty | Required only for dedicated Cloudflare Tunnel mode |

## Docker

Build and run with Docker:

```bash
docker build -t swissqrbill-microservice .
docker run --rm -p 3000:3000 --env-file .env swissqrbill-microservice
```

Or with Compose:

```bash
cp .env.example .env
docker compose up --build
```

### Docker modes

This repository ships with two Docker deployment variants:

- [docker-compose.yml](/Users/vlak/swissqrbill-microservice/docker-compose.yml): localhost-only deployment on `127.0.0.1:3000`
- [docker-compose.cloudflared.yml](/Users/vlak/swissqrbill-microservice/docker-compose.cloudflared.yml): dedicated Cloudflare Tunnel deployment

See [DEPLOY.md](/Users/vlak/swissqrbill-microservice/DEPLOY.md) for the full `/opt/qr.ua-in` rollout flow.

## API usage

### GET `/api/qr`

Example SVG request:

```bash
curl "http://localhost:3000/api/qr?name=Gebruder%20Pneu%20Edelmann%20GmbH&street=St.%20Gallerstrasse&number=1&postcode=8589&city=Sitterdorf&iban=CH8109000000853815289&bic=POFICHBEXXX&amount=514.56&message=Order%20236949&personalNote=Summer%20tyres&format=svg"
```

Example PDF download:

```bash
curl -L "http://localhost:3000/api/qr?name=Gebruder%20Pneu%20Edelmann%20GmbH&street=St.%20Gallerstrasse&number=1&postcode=8589&city=Sitterdorf&iban=CH8109000000853815289&amount=514.56&format=pdf&download=1" --output swiss-qr-bill.pdf
```

Example JSON metadata response:

```bash
curl "http://localhost:3000/api/qr?name=Gebruder%20Pneu%20Edelmann%20GmbH&street=St.%20Gallerstrasse&number=1&postcode=8589&city=Sitterdorf&iban=CH8109000000853815289&amount=514.56&format=json"
```

### POST `/api/qr`

```bash
curl -X POST "http://localhost:3000/api/qr?format=pdf" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gebruder Pneu Edelmann GmbH",
    "street": "St. Gallerstrasse",
    "number": "1",
    "postcode": "8589",
    "city": "Sitterdorf",
    "iban": "CH8109000000853815289",
    "bic": "POFICHBEXXX",
    "amount": 514.56,
    "message": "Order 236949",
    "personalNote": "Summer tyres"
  }' \
  --output swiss-qr-bill.pdf
```

### Response formats

- `format=json` returns metadata, preview URL, and download URLs
- `format=svg` returns `image/svg+xml`
- `format=pdf` returns `application/pdf`

If `format` is omitted, the service defaults to JSON unless the `Accept` header requests SVG or PDF.

## UI usage

- Open `/`
- fill in the form
- click `Generate QR`
- review the SVG preview and summary
- use `Download PDF`, `Download SVG`, or `Copy API Link`

The same root page can also be prefilled via query parameters. That makes it useful for operator workflows where another system builds a link and opens it directly.

## Stateless behavior

The service does not persist generated files by default. Download URLs are rebuilt from the same request parameters instead of writing artifacts to disk.

The [`generated`](/Users/vlak/swissqrbill-microservice/generated) directory is present only as a placeholder for a future file-backed mode.

## Limitations

- no PNG export in MVP
- no authentication
- no database
- no permanent short links
- `bic`, `address`, and `personalNote` are preserved in metadata/summary but may not be encoded into the QR payload
- this service generates the QR bill section, not a full accounting workflow or payment gateway

## Tests

Run:

```bash
npm run lint
npm test
```

Covered scenarios:

- valid IBAN acceptance
- required field validation
- invalid IBAN rejection
- successful SVG generation
- successful PDF generation
- integration tests for `GET /api/qr` and `POST /api/qr`

## Health endpoint

```bash
curl http://localhost:3000/health
```

## Roadmap

### MVP

- HTML form on `/`
- `GET /api/qr`
- `POST /api/qr`
- SVG and PDF output
- Docker support
- README and tests

### Next

- PNG export via SVG conversion
- EN/DE localization
- optional hash-based short links
- invoice templates

### Later

- fuller invoice generation
- logo upload
- signed URLs
- webhook integration

## License

MIT. See [LICENSE](/Users/vlak/swissqrbill-microservice/LICENSE).
