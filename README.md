# swissqrbill-microservice

Self-hostable Swiss QR Bill microservice with HTTP API and HTML form, powered by [`schoero/swissqrbill`](https://github.com/schoero/swissqrbill).

## Demo instance

You can try a live instance at [qr.ua-in.ch](https://qr.ua-in.ch/).

This public deployment is provided for demonstration purposes only. It should not be used for production integrations because continuous availability is not guaranteed.

## Why this project exists

The goal is not to reimplement the Swiss QR Bill standard from scratch. This service wraps the upstream `swissqrbill` library with:

- a simple HTML form on `/`
- a machine-friendly HTTP API
- stateless SVG and PDF output
- validation and guardrails suitable for open-source reuse

This keeps the QR Bill logic delegated to the library that already tracks the standard, while exposing a small service that shops, ERP systems, and operators can use directly.

It also decouples Swiss QR Bill generation from the language, framework, and runtime choices of the surrounding product. Instead of binding QR bill support to a specific stack, other systems can integrate through a simple HTTP API.

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
- EN/DE UI and bill rendering
- website embed snippet on the result page
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
- field lengths are capped to stay within Swiss QR Bill layout limits
- QR-IBAN requires a QR reference

## Local run

Requirements:

- Node.js 22 LTS
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
| `PUBLIC_BASE_URL` | empty | Optional canonical public base URL used for generated embed URLs |
| `COMPOSE_PROJECT_NAME` | `qrbill` | Docker Compose project name |
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
curl "http://localhost:3000/api/qr?name=Example%20Tools%20AG&street=Example%20Street&number=12A&postcode=8000&city=Zurich&iban=CH5604835012345678009&amount=149.95&message=Invoice%2010024&personalNote=Demo%20payload&lang=de&format=svg"
```

Example PDF download:

```bash
curl -L "http://localhost:3000/api/qr?name=Example%20Tools%20AG&street=Example%20Street&number=12A&postcode=8000&city=Zurich&iban=CH5604835012345678009&amount=149.95&format=pdf&download=1" --output swiss-qr-bill.pdf
```

Example JSON metadata response:

```bash
curl "http://localhost:3000/api/qr?name=Example%20Tools%20AG&street=Example%20Street&number=12A&postcode=8000&city=Zurich&iban=CH5604835012345678009&amount=149.95&format=json"
```

### POST `/api/qr`

```bash
curl -X POST "http://localhost:3000/api/qr?format=pdf" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Tools AG",
    "street": "Example Street",
    "number": "12A",
    "postcode": "8000",
    "city": "Zurich",
    "iban": "CH5604835012345678009",
    "amount": 149.95,
    "message": "Invoice 10024",
    "personalNote": "Demo payload"
  }' \
  --output swiss-qr-bill.pdf
```

### Response formats

- `format=json` returns metadata, preview URL, and download URLs
- `format=svg` returns `image/svg+xml`
- `format=pdf` returns `application/pdf`

If `format` is omitted, the service defaults to JSON unless the `Accept` header requests SVG or PDF.

### Language selection

- use `lang=de` or `lang=en` to control the Swiss QR Bill rendering language explicitly
- if `lang` is omitted for API requests, the service falls back to the request `Accept-Language` header
- the HTML UI keeps the selected language in the query string so preview and download links stay aligned

## UI usage

- Open `/`
- fill in the form
- click `Generate QR`
- review the SVG preview and summary
- use `Download PDF`, `Download SVG`, or `Copy API Link`
- copy the website embed snippet from the result section when you need to embed the SVG on another page

The same root page can also be prefilled via query parameters. That makes it useful for operator workflows where another system builds a link and opens it directly.

## Stateless behavior

The service does not persist generated files by default. Download URLs are rebuilt from the same request parameters instead of writing artifacts to disk.

## Limitations

- no authentication
- no database
- no permanent short links
- `address` and `personalNote` are preserved in metadata/summary but may not be encoded into the QR payload
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
- UI embed URLs derived from proxy headers or `PUBLIC_BASE_URL`
- static assets served with cache headers

## CI and security

GitHub Actions cover:

- `npm run lint`
- `npm test`
- `npm run build`
- Docker image build validation
- `npm audit --omit=dev`
- CodeQL analysis for JavaScript/TypeScript
- Trivy filesystem scan for high/critical findings

Dependabot is configured for:

- npm dependencies
- Docker base images
- GitHub Actions

## Health endpoint

```bash
curl http://localhost:3000/health
```

## License

MIT. See [LICENSE](/Users/vlak/swissqrbill-microservice/LICENSE).
