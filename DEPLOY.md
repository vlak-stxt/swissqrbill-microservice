# Deploy

This project supports two Docker deployment modes:

- localhost-only service on `127.0.0.1:3000`
- production deployment with a dedicated `cloudflared` tunnel

## Files

- [docker-compose.yml](/Users/vlak/swissqrbill-microservice/docker-compose.yml): local or server-side localhost-only deployment
- [docker-compose.cloudflared.yml](/Users/vlak/swissqrbill-microservice/docker-compose.cloudflared.yml): production deployment with dedicated Cloudflare Tunnel
- [.env.example](/Users/vlak/swissqrbill-microservice/.env.example): environment template

## Mode 1: Localhost-Only Docker

Use this when you want the service available only on the host loopback interface.

```bash
cp .env.example .env
docker compose up -d --build
```

Result:

- app is reachable on `http://127.0.0.1:3000`
- nothing is exposed on public interfaces

Health check:

```bash
curl http://127.0.0.1:3000/health
```

## Mode 2: Dedicated Cloudflare Tunnel

Use this when you want a standalone public service such as `qr.ua-in.ch`.

### 1. Create a dedicated tunnel in Cloudflare

Create a new named tunnel and map its public hostname to the service:

- hostname: `qr.ua-in.ch`
- service: `http://qrbill:3000`

This service name is resolved inside the Docker network created by [docker-compose.cloudflared.yml](/Users/vlak/swissqrbill-microservice/docker-compose.cloudflared.yml).

### 2. Prepare environment

```bash
cp .env.example .env
```

Fill in:

- `TUNNEL_TOKEN`

### 3. Start the stack

```bash
docker compose -f docker-compose.cloudflared.yml up -d --build
```

Result:

- `qrbill` runs only on the internal Docker network
- `cloudflared` exposes the service through the dedicated tunnel
- no application port is published on the host

### 4. Verify

Inside the host:

```bash
docker compose -f docker-compose.cloudflared.yml ps
docker compose -f docker-compose.cloudflared.yml logs --tail=100 cloudflared
```

Public health check:

```bash
curl https://qr.ua-in.ch/health
```

## Recommended Layout For `app`

```text
/opt/qr.ua-in/
  current/
  .env
```

Suggested commands:

```bash
cd /opt/qr.ua-in
git clone https://github.com/vlak-stxt/swissqrbill-microservice.git current
cd current
cp .env.example ../.env
```

Then either:

```bash
cd /opt/qr.ua-in/current
docker compose --env-file ../.env -f docker-compose.yml up -d --build
```

or:

```bash
cd /opt/qr.ua-in/current
docker compose --env-file ../.env -f docker-compose.cloudflared.yml up -d --build
```

## Notes

- The project is stateless by design.
- `generated/` is not required for production persistence.
- For the tunnel mode, keep the `TUNNEL_TOKEN` outside git.
