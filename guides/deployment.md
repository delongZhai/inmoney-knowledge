# Deployment

Deployment procedures for InMoney.

## Environments

| Environment | Frontend | API |
|-------------|----------|-----|
| Development | localhost:4200 | localhost:8787 |
| Staging | staging.inmoney.app | staging-api.inmoney.app |
| Production | inmoney.app | api.inmoney.app |

## Frontend Deployment

### Build

```bash
# Production build
npm run prodbuild

# With version bump
npm run release
```

### Deploy to Hosting

Document your hosting provider deployment:
- Vercel
- Netlify
- Cloudflare Pages
- Other

### Example: Cloudflare Pages

```bash
# Via Wrangler
wrangler pages publish dist/apps/inmoney/browser

# Via Git (recommended)
# Push to main branch triggers automatic deployment
```

## Backend Deployment

### Build & Deploy

```bash
# Deploy to production
wrangler publish

# Deploy to preview
wrangler publish --env preview
```

### Database Migrations

```bash
# Run D1 migrations
wrangler d1 migrations apply inmoney-db --remote

# Run Supabase migrations
supabase db push
```

## Pre-Deployment Checklist

### Frontend
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run prodbuild`)
- [ ] Environment variables configured
- [ ] Version bumped (if release)

### Backend
- [ ] All tests pass
- [ ] Linting passes
- [ ] Secrets configured
- [ ] Migrations applied
- [ ] API tested locally

## Post-Deployment

### Verify Deployment
1. Check application loads
2. Test critical user flows
3. Verify API endpoints respond
4. Check error tracking (Sentry)

### Rollback

#### Frontend
Redeploy previous version from CI/CD or hosting dashboard.

#### Backend
```bash
# Rollback to previous deployment
wrangler rollback
```

## CI/CD

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run prodbuild

      - name: Deploy
        run: # Deploy command
```

## Monitoring

### Health Checks
- Frontend: Check page loads
- API: `/health` endpoint

### Alerts
Configure alerts for:
- Error rate spikes
- Latency increases
- Failed deployments
