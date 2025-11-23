# Integrations

Third-party service integrations in InMoney.

## Supabase

### Purpose
- PostgreSQL database
- Authentication
- Real-time subscriptions

### Configuration
```typescript
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);
```

### Auth Integration
```typescript
// Verify JWT from client
const { data: { user } } = await supabase.auth.getUser(token);
```

### Documentation
- [Supabase Docs](https://supabase.com/docs)

---

## Stripe

### Purpose
- Subscription management
- Payment processing

### Configuration
```typescript
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
```

### Webhooks
Handle Stripe webhooks for:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### Subscription Tiers
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic features |
| Pro | $X/mo | Full access |

### Documentation
- [Stripe Docs](https://stripe.com/docs)

---

## Sentry

### Purpose
- Error tracking
- Performance monitoring

### Configuration
```typescript
Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.ENVIRONMENT,
});
```

### Usage
```typescript
try {
  // Code
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Documentation
- [Sentry Docs](https://docs.sentry.io/)

---

## Market Data APIs

### Purpose
- Stock quotes
- Options data
- Historical prices

### Providers
Document the specific market data providers used:
- Provider name
- API endpoints
- Rate limits
- Data format

### Caching Strategy
```typescript
// Cache market data in KV
const cacheKey = `ticker:${symbol}`;
const cached = await env.CACHE.get(cacheKey, 'json');

if (cached) {
  return cached;
}

const data = await fetchFromProvider(symbol);
await env.CACHE.put(cacheKey, JSON.stringify(data), {
  expirationTtl: 60, // 1 minute for real-time data
});

return data;
```

---

## Email Service

### Purpose
- Transactional emails
- Notifications

### Provider
Document email provider (if applicable):
- SendGrid
- Postmark
- Resend

---

## Integration Patterns

### Error Handling
```typescript
try {
  const result = await externalService.call();
  return result;
} catch (error) {
  // Log error
  Sentry.captureException(error);

  // Graceful degradation
  return fallbackResponse;
}
```

### Retry Logic
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
```

### Circuit Breaker
Implement circuit breaker for unreliable external services.
