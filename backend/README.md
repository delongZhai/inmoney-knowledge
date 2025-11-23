# Backend Documentation

Documentation for the inmoney-api Cloudflare Workers application.

## Contents

- [Database](./database.md) - Database schema and migrations
- [Workers](./workers.md) - Cloudflare Workers specifics
- [Integrations](./integrations.md) - Third-party integrations

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Cloudflare Workers | Serverless runtime |
| D1 | SQLite database |
| KV | Key-value storage |
| R2 | Object storage |
| Supabase | PostgreSQL + Auth |

## Project Structure

```
inmoney-api/
├── src/
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Request middleware
│   ├── utils/           # Helpers
│   └── index.ts         # Entry point
├── migrations/          # D1 migrations
├── wrangler.toml        # Workers config
└── package.json
```

## Development

### Local Development
```bash
npm run dev
# Runs on http://localhost:8787
```

### Deploy
```bash
npm run deploy
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT verification secret |

## API Design

### Route Structure
```
/v1/tickers          # Ticker endpoints
/v1/options          # Options endpoints
/v1/strategies       # Strategy endpoints
/v1/playlists        # Playlist endpoints
/v1/user             # User endpoints
```

### Middleware
- Authentication
- Rate limiting
- CORS
- Error handling
- Logging

## Deployment

### Environments
| Environment | URL |
|-------------|-----|
| Development | localhost:8787 |
| Preview | preview.api.inmoney.app |
| Production | api.inmoney.app |

### CI/CD
Deployed via Cloudflare Workers CI or GitHub Actions.
