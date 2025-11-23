# Backend Documentation

Documentation for the inmoney-api Cloudflare Workers application.

## Contents

- [Workers](./workers.md) - Cloudflare Workers, Workflows & Durable Objects
- [Option Flow Engine](./option-flow-engine.md) - Data ingestion & labeling system
- [Database](./database.md) - Database schema and migrations
- [Integrations](./integrations.md) - Third-party integrations

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Cloudflare Workers** | Serverless HTTP runtime |
| **Cloudflare Workflows** | Long-running async jobs |
| **Cloudflare Durable Objects** | Stateful edge compute |
| **Cloudflare KV** | Key-value caching |
| **Cloudflare R2** | Object storage (leaderboards) |
| **Supabase** | PostgreSQL + Auth |
| **itty-router** | HTTP routing |
| **chanfana** | OpenAPI documentation |

## Project Structure

```
inmoney-api/
├── src/
│   ├── index.ts              # Entry point (fetch handler)
│   ├── scheduled.ts          # Cron job routing
│   ├── configs.ts            # Client factories (Supabase, Stripe, etc.)
│   ├── routes/               # HTTP API routes (67 endpoints)
│   │   └── index.ts          # Router factory with OpenAPI setup
│   ├── workflows/            # Cloudflare Workflows (14 workflows)
│   ├── durable-objects/      # Stateful edge compute
│   │   ├── realtime-options-leaderboard/
│   │   ├── notifier/
│   │   └── rate-limiter.ts
│   ├── market-data/          # Alpha Vantage API integration
│   │   ├── functions.ts      # Market data functions
│   │   └── is*.ts            # Type guards
│   ├── utils/                # Helpers & business logic
│   │   ├── strategies/       # Options strategy system
│   │   └── detect-unusual-options.ts
│   ├── supabase/             # Database integration
│   │   ├── types_db.ts       # Auto-generated types
│   │   └── admin.ts          # Admin client utilities
│   └── types/                # TypeScript type definitions
├── supabase/
│   └── migrations/           # PostgreSQL migrations
├── test/                     # Test files
├── wrangler.toml             # Cloudflare Workers config
├── package.json              # Dependencies & scripts
└── tsconfig.json             # TypeScript config
```

## Architecture Overview

The backend has three distinct execution models:

### 1. Worker API (Synchronous)
HTTP request handlers for immediate responses.
- **Location**: `src/routes/`
- **Trigger**: HTTP requests
- **Lifetime**: Milliseconds to seconds
- **Use Cases**: Data queries, strategy generation, market status

### 2. Workflows (Asynchronous)
Long-running background jobs with retry logic.
- **Location**: `src/workflows/`
- **Trigger**: Cron schedules or manual invocation
- **Lifetime**: Minutes to hours
- **Use Cases**: Unusual options detection, data updates, trust scores

### 3. Durable Objects (Stateful)
Persistent stateful compute at the edge.
- **Location**: `src/durable-objects/`
- **Trigger**: Workers or HTTP requests
- **Lifetime**: Persistent across requests
- **Use Cases**: Real-time leaderboards, WebSocket connections, rate limiting

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

### Testing
```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run type-check        # TypeScript validation
```

### Code Generation
```bash
npm run generate-route     # Scaffold new route
npm run generate-workflow  # Scaffold new workflow
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT verification secret |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `ALPHA_VANTAGE_API_KEY` | Market data API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GITHUB_TOKEN` | GitHub API token |
| `RESEND_API_KEY` | Email service API key |

## Deployment Environments

| Environment | URL |
|-------------|-----|
| Development | localhost:8787 |
| Preview | preview.api.inmoney.app |
| Production | api.inmoney.app |

## Key Patterns

### Route Pattern (OpenAPI)
```typescript
export class GetDataName extends OpenAPIRoute {
  schema = {
    request: { params: z.object({ symbol: z.string() }) },
    responses: { 200: { content: { 'application/json': { schema: DataSchema } } } }
  };

  async handle(request: Request, env: Env, ctx: ExecutionContext) {
    const { symbol } = await this.getValidatedData();
    return json(await this.request(env, ctx, symbol));
  }

  static async request(env: Env, ctx: ExecutionContext, symbol: string) {
    // Reusable logic callable from workflows
  }
}
```

### Workflow Pattern
```typescript
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const result = await step.do('Step name', async () => {
      // Long-running logic with automatic retries
      return data;
    });

    await step.sleep('Wait reason', milliseconds);
  }
}
```

### Supabase Integration
```typescript
const client = getSupabaseAdmin(env);
const { data, error } = await client
  .from('table_name')
  .select('*')
  .eq('column', value);
```
