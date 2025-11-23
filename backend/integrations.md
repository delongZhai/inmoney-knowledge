# Integrations

Third-party service integrations in InMoney API.

## Overview

| Service | Purpose | Location |
|---------|---------|----------|
| **Supabase** | Database + Auth | `src/configs.ts`, `src/supabase/` |
| **Alpha Vantage** | Market Data | `src/market-data/functions.ts` |
| **Stripe** | Payments | `src/routes/pay-*.ts` |
| **OpenAI** | AI Analysis | `src/routes/llama-*.ts` |
| **Resend** | Email | `src/workflows/add-email-recipient-on-signup.ts` |
| **GitHub (Octokit)** | Issue Tracking | `src/routes/helpdesk-*.ts` |

---

## Supabase

### Purpose
- PostgreSQL database
- User authentication
- Row-level security

### Configuration

```typescript
// src/configs.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseAdmin(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
```

### Environment Variables
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1...
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Usage Patterns

```typescript
// Query data
const { data, error } = await getSupabaseAdmin(env)
  .from('options')
  .select('*')
  .eq('symbol', 'AAPL');

// Upsert with conflict handling
await getSupabaseAdmin(env)
  .from('options')
  .upsert(records, { onConflict: 'option_id' });

// Insert batch
await getSupabaseAdmin(env)
  .from('option_events')
  .insert(events);

// RPC call
const { data } = await getSupabaseAdmin(env)
  .rpc('get_recent_events', { limit_count: 100 });
```

### JWT Verification

```typescript
// src/authorize.ts
import { jwtVerify } from 'jose';

export async function verifyToken(token: string, env: Env) {
  const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
```

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)

---

## Alpha Vantage (Market Data)

### Purpose
- Realtime options data
- Historical options data
- Stock quotes and time series
- Technical indicators
- Company fundamentals
- Market news

### Configuration

```typescript
// src/configs.ts
import { AlphaVantage } from './market-data/functions';

export function getAlphaVantage(env: Env): AlphaVantage {
  return new AlphaVantage(env.ALPHA_VANTAGE_API_KEY);
}
```

### Environment Variables
```
ALPHA_VANTAGE_API_KEY=your-api-key
```

### API Functions

**Location**: `src/market-data/functions.ts`

```typescript
export class AlphaVantage {
  constructor(private apiKey: string) {}

  // Options Data
  async getRealtimeOptions(symbol: string): Promise<RealtimeOption[]> {
    return this.fetch('REALTIME_OPTIONS', { symbol });
  }

  async getHistoricalOptions(symbol: string, date?: string): Promise<HistoricalOption[]> {
    return this.fetch('HISTORICAL_OPTIONS', { symbol, date });
  }

  // Stock Data
  async getQuote(symbol: string): Promise<Quote> {
    return this.fetch('GLOBAL_QUOTE', { symbol });
  }

  async getTimeSeriesDaily(symbol: string, outputsize?: string): Promise<TimeSeries> {
    return this.fetch('TIME_SERIES_DAILY_ADJUSTED', { symbol, outputsize });
  }

  async getTimeSeriesIntraday(symbol: string, interval: string): Promise<TimeSeries> {
    return this.fetch('TIME_SERIES_INTRADAY', { symbol, interval });
  }

  // Company Data
  async getCompanyOverview(symbol: string): Promise<CompanyOverview> {
    return this.fetch('OVERVIEW', { symbol });
  }

  async getEtfProfile(symbol: string): Promise<EtfProfile> {
    return this.fetch('ETF_PROFILE', { symbol });
  }

  async getEarnings(symbol: string): Promise<Earnings[]> {
    return this.fetch('EARNINGS', { symbol });
  }

  // Technical Indicators
  async getSMA(symbol: string, interval: string, timePeriod: number): Promise<TechnicalData> {
    return this.fetch('SMA', { symbol, interval, time_period: timePeriod, series_type: 'close' });
  }

  async getEMA(symbol: string, interval: string, timePeriod: number): Promise<TechnicalData> {
    return this.fetch('EMA', { symbol, interval, time_period: timePeriod, series_type: 'close' });
  }

  async getMACD(symbol: string, interval: string): Promise<TechnicalData> {
    return this.fetch('MACD', { symbol, interval, series_type: 'close' });
  }

  async getRSI(symbol: string, interval: string, timePeriod: number): Promise<TechnicalData> {
    return this.fetch('RSI', { symbol, interval, time_period: timePeriod, series_type: 'close' });
  }

  // Market Data
  async getMarketStatus(): Promise<MarketStatus> {
    return this.fetch('MARKET_STATUS');
  }

  async getMarketNews(tickers?: string, topics?: string): Promise<NewsArticle[]> {
    return this.fetch('NEWS_SENTIMENT', { tickers, topics });
  }

  async getListings(): Promise<Listing[]> {
    return this.fetch('LISTING_STATUS');
  }

  // Core fetch method
  private async fetch(fn: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.set('function', fn);
    url.searchParams.set('apikey', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetch(url.toString());
    return response.json();
  }
}
```

### Rate Limiting

Alpha Vantage has rate limits. The API uses a `RateLimiter` Durable Object to manage:

```typescript
// Rate limit: 75 requests/minute for premium
// Handled via src/durable-objects/rate-limiter.ts

export class RateLimiter implements DurableObject {
  private requests: number[] = [];
  private limit = 75;
  private window = 60000; // 1 minute

  async fetch(request: Request): Promise<Response> {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.window);

    if (this.requests.length >= this.limit) {
      return new Response('Rate limited', { status: 429 });
    }

    this.requests.push(now);
    return new Response('OK');
  }
}
```

### Type Guards

**Location**: `src/market-data/is*.ts`

```typescript
// src/market-data/isRealtimeOption.ts
export function isRealtimeOption(data: unknown): data is RealtimeOption[] {
  return Array.isArray(data) && data.every(item =>
    typeof item.contractID === 'string' &&
    typeof item.symbol === 'string' &&
    typeof item.strike === 'number'
  );
}
```

### Documentation
- [Alpha Vantage API](https://www.alphavantage.co/documentation/)

---

## Stripe

### Purpose
- Subscription management
- Payment processing
- Customer management
- Billing portal

### Configuration

```typescript
// src/configs.ts
import Stripe from 'stripe';

export function getStripe(env: Env): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20'
  });
}
```

### Environment Variables
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Routes

**Location**: `src/routes/pay-*.ts`

| Route | Method | Purpose |
|-------|--------|---------|
| `/pay/create-checkout-session` | POST | Create Stripe checkout |
| `/pay/verify-subscription` | POST | Verify subscription status |
| `/pay/session-status` | GET | Get checkout session status |
| `/pay/link-user-with-stripe` | POST | Link Supabase user to Stripe |
| `/pay/redirect-billing-portal` | POST | Redirect to billing portal |

### Implementation

```typescript
// src/routes/pay-create-checkout-session.ts
export class CreateCheckoutSession extends OpenAPIRoute {
  async handle(request: Request, env: Env) {
    const stripe = getStripe(env);
    const { priceId, userId } = await request.json();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/checkout/cancel`,
      metadata: { userId }
    });

    return json({ url: session.url });
  }
}
```

### Webhooks

**Location**: `src/routes/webhooks.ts`

```typescript
export class StripeWebhook extends OpenAPIRoute {
  async handle(request: Request, env: Env) {
    const stripe = getStripe(env);
    const signature = request.headers.get('stripe-signature')!;
    const body = await request.text();

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(env, event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(env, event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(env, event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(env, event.data.object);
        break;
    }

    return json({ received: true });
  }
}
```

### Subscription Tiers

| Tier | Features |
|------|----------|
| **Free** | Basic access, limited symbols |
| **Pro** | Full access, all symbols, advanced filters |
| **Premium** | Pro + API access, priority support |

### Documentation
- [Stripe API](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

## OpenAI

### Purpose
- AI-powered strategic analysis
- Report generation
- Market insights

### Configuration

```typescript
// src/configs.ts
import OpenAI from 'openai';

export function getOpenAI(env: Env): OpenAI {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
```

### Environment Variables
```
OPENAI_API_KEY=sk-...
```

### Routes

**Location**: `src/routes/llama-*.ts`

| Route | Method | Purpose |
|-------|--------|---------|
| `/llama/report/strategic-implications` | POST | Generate strategic analysis |
| `/llama/report/strategic-implications/:symbol` | POST | Symbol-specific analysis |

### Implementation

```typescript
// src/routes/llama-strategic-implications.ts
export class GenerateStrategicImplications extends OpenAPIRoute {
  async handle(request: Request, env: Env) {
    const openai = getOpenAI(env);
    const { events, context } = await request.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an options market analyst. Analyze the following unusual options activity and provide strategic implications.`
        },
        {
          role: 'user',
          content: JSON.stringify({ events, context })
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return json({
      analysis: completion.choices[0].message.content
    });
  }
}
```

### Documentation
- [OpenAI API](https://platform.openai.com/docs)

---

## Resend (Email)

### Purpose
- Transactional emails
- Feature update notifications
- Email subscriptions

### Configuration

```typescript
// src/configs.ts
import { Resend } from 'resend';

export function getResend(env: Env): Resend {
  return new Resend(env.RESEND_API_KEY);
}
```

### Environment Variables
```
RESEND_API_KEY=re_...
```

### Routes

**Location**: `src/routes/subscribe-to-feature-updates.ts`

```typescript
export class SubscribeToFeatureUpdates extends OpenAPIRoute {
  async handle(request: Request, env: Env) {
    const { email } = await request.json();

    // Trigger workflow to add to mailing list
    await env.ADD_EMAIL_RECIPIENT_ON_SIGNUP.create({
      id: crypto.randomUUID(),
      params: { email }
    });

    return json({ success: true });
  }
}
```

### Workflow

**Location**: `src/workflows/add-email-recipient-on-signup.ts`

```typescript
export class AddEmailRecipientOnSignup extends WorkflowEntrypoint<Env, { email: string }> {
  async run(event: WorkflowEvent<{ email: string }>, step: WorkflowStep) {
    const { email } = event.payload;

    await step.do('Add to mailing list', async () => {
      const resend = getResend(this.env);

      // Add contact to audience
      await resend.contacts.create({
        email,
        audienceId: this.env.RESEND_AUDIENCE_ID
      });

      // Send welcome email
      await resend.emails.send({
        from: 'InMoney <noreply@inmoney.app>',
        to: email,
        subject: 'Welcome to InMoney!',
        html: '<h1>Welcome!</h1><p>Thank you for subscribing...</p>'
      });
    });
  }
}
```

### Documentation
- [Resend Docs](https://resend.com/docs)

---

## GitHub (Octokit)

### Purpose
- Helpdesk issue management
- Bug reporting
- Feature requests

### Configuration

```typescript
// src/configs.ts
import { Octokit } from '@octokit/rest';

export function getGithub(env: Env): Octokit {
  return new Octokit({ auth: env.GITHUB_TOKEN });
}
```

### Environment Variables
```
GITHUB_TOKEN=ghp_...
```

### Routes

**Location**: `src/routes/helpdesk-*.ts`

| Route | Method | Purpose |
|-------|--------|---------|
| `/helpdesk/issues` | GET | List issues |
| `/helpdesk/issues` | POST | Create issue |
| `/helpdesk/issues/:issueId` | GET | Get issue details |
| `/helpdesk/issues/:issueId` | POST | Add comment |

### Implementation

```typescript
// src/routes/helpdesk-create-issue.ts
export class CreateHelpdeskIssue extends OpenAPIRoute {
  async handle(request: Request, env: Env) {
    const github = getGithub(env);
    const { title, body, labels } = await request.json();

    const { data } = await github.issues.create({
      owner: 'delongZhai',
      repo: 'inmoney-issues',
      title,
      body,
      labels: labels || ['user-submitted']
    });

    return json({
      id: data.id,
      number: data.number,
      url: data.html_url
    });
  }
}
```

### Documentation
- [Octokit](https://octokit.github.io/rest.js)
- [GitHub REST API](https://docs.github.com/en/rest)

---

## Integration Patterns

### Error Handling

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
      await new Promise(r => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Usage
const data = await withRetry(() => alphaVantage.getRealtimeOptions('AAPL'));
```

### Graceful Degradation

```typescript
async function getMarketData(env: Env, symbol: string) {
  try {
    return await getAlphaVantage(env).getQuote(symbol);
  } catch (error) {
    console.error('Alpha Vantage error:', error);

    // Try cache
    const cached = await env.MARKET_CACHE.get(symbol, 'json');
    if (cached) {
      return { ...cached, stale: true };
    }

    throw error;
  }
}
```

### Request Timing

```typescript
async function timedRequest<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`${name} completed in ${Date.now() - start}ms`);
    return result;
  } catch (error) {
    console.error(`${name} failed after ${Date.now() - start}ms:`, error);
    throw error;
  }
}
```

---

## Environment Summary

```typescript
interface IntegrationEnv {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_JWT_SECRET: string;

  // Alpha Vantage
  ALPHA_VANTAGE_API_KEY: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // OpenAI
  OPENAI_API_KEY: string;

  // Resend
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID: string;

  // GitHub
  GITHUB_TOKEN: string;

  // App
  FRONTEND_URL: string;
  ENVIRONMENT: 'development' | 'preview' | 'production';
}
```
