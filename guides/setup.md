# Development Setup

Guide to setting up the InMoney development environment.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm
- Git
- VS Code (recommended)

## Frontend (inmoney)

### Clone Repository

```bash
git clone https://github.com/delongZhai/inmoney.git
cd inmoney
```

### Initialize Submodules

```bash
git submodule init
git submodule update
```

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create `.env` file in project root:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key
SENTRY_DSN=your_sentry_dsn
```

Run environment generation:
```bash
npm run create-env
```

### Start Development Server

```bash
npm start
# Opens at http://localhost:4200
```

## Backend (inmoney-api)

### Clone Repository

```bash
git clone https://github.com/delongZhai/inmoney-api.git
cd inmoney-api
```

### Install Dependencies

```bash
npm install
```

### Configure Wrangler

Ensure `wrangler.toml` has correct bindings.

### Set Secrets

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put SUPABASE_JWT_SECRET
```

### Start Development Server

```bash
npm run dev
# Runs at http://localhost:8787
```

## VS Code Extensions

Recommended extensions:

- Angular Language Service
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :4200

# Kill process
kill -9 <PID>
```

### Node Version Mismatch

Use nvm to manage Node versions:
```bash
nvm use 18
```

### Submodule Not Updating

```bash
git submodule update --remote --merge
```

## Next Steps

1. Review [Architecture Overview](../architecture/overview.md)
2. Understand [State Management](../frontend/state-management.md)
3. Check [API Documentation](../api/README.md)
