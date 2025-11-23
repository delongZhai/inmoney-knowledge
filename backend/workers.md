# Cloudflare Workers

Cloudflare Workers specifics for inmoney-api.

## Overview

InMoney API runs on Cloudflare Workers, providing:
- Edge computing (low latency globally)
- Serverless architecture
- Integrated storage (KV, D1, R2)
- Automatic scaling

## Configuration

### wrangler.toml

```toml
name = "inmoney-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "CACHE"
id = "xxx"

[[d1_databases]]
binding = "DB"
database_name = "inmoney"
database_id = "xxx"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "inmoney-storage"
```

## Bindings

### Environment Variables
```typescript
interface Env {
  // Secrets
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_JWT_SECRET: string;

  // KV
  CACHE: KVNamespace;

  // D1
  DB: D1Database;

  // R2
  STORAGE: R2Bucket;
}
```

### KV Usage

```typescript
// Set value
await env.CACHE.put('key', JSON.stringify(data), {
  expirationTtl: 3600, // 1 hour
});

// Get value
const cached = await env.CACHE.get('key', 'json');

// Delete
await env.CACHE.delete('key');
```

### D1 Usage

```typescript
// Query
const result = await env.DB
  .prepare('SELECT * FROM table WHERE id = ?')
  .bind(id)
  .first();

// Insert
await env.DB
  .prepare('INSERT INTO table (name) VALUES (?)')
  .bind(name)
  .run();
```

### R2 Usage

```typescript
// Upload
await env.STORAGE.put('path/to/file', data);

// Download
const object = await env.STORAGE.get('path/to/file');
const data = await object?.arrayBuffer();

// Delete
await env.STORAGE.delete('path/to/file');
```

## Request Handling

### Handler Pattern

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      // Route handling
      return await handleRequest(request, env);
    } catch (error) {
      return new Response('Internal Error', { status: 500 });
    }
  },
};
```

### Framework (if using Hono)

```typescript
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.get('/tickers/:symbol', async (c) => {
  const symbol = c.req.param('symbol');
  // Handle request
  return c.json({ data });
});

export default app;
```

## Best Practices

### Performance
- Use KV for caching
- Minimize cold starts
- Use streaming responses for large data

### Limits
- 10ms CPU time (free) / 50ms (paid)
- 128MB memory
- 100,000 requests/day (free)

### Error Handling
- Catch all errors
- Return proper status codes
- Log to external service (if needed)

## Deployment

### Development
```bash
wrangler dev
```

### Preview
```bash
wrangler publish --env preview
```

### Production
```bash
wrangler publish
```

## Monitoring

- Cloudflare dashboard for metrics
- Sentry for error tracking
- Custom logging via Workers
