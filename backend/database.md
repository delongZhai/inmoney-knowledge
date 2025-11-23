# Database

Database schema and patterns for InMoney.

## Database Systems

### Supabase PostgreSQL
Primary database for:
- User data
- Strategies
- Playlists
- Persistent data

### Cloudflare D1
Edge database for:
- Cached data
- Session data
- High-frequency reads

### Cloudflare KV
Key-value storage for:
- API response caching
- Rate limiting counters
- Feature flags

## Schema Overview

### Users (Supabase Auth)
Managed by Supabase Auth, extended with profiles.

```sql
-- profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Playlists

```sql
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  symbols TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playlists_user_id ON playlists(user_id);
```

### Strategies

```sql
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  legs JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
```

## Migrations

### Supabase Migrations
Located in `supabase/migrations/`.

```bash
# Create migration
supabase migration new migration_name

# Apply migrations
supabase db push
```

### D1 Migrations
Located in `migrations/`.

```bash
# Apply migration
wrangler d1 migrations apply DB_NAME
```

## Row Level Security (RLS)

Supabase tables use RLS policies:

```sql
-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Users can only see their own playlists
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own playlists
CREATE POLICY "Users can insert own playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Query Patterns

### Using Supabase Client

```typescript
// Select
const { data } = await supabase
  .from('playlists')
  .select('*')
  .eq('user_id', userId);

// Insert
const { data } = await supabase
  .from('playlists')
  .insert({ name, symbols, user_id: userId })
  .select()
  .single();

// Update
const { data } = await supabase
  .from('playlists')
  .update({ name })
  .eq('id', id)
  .select()
  .single();

// Delete
await supabase
  .from('playlists')
  .delete()
  .eq('id', id);
```

## Performance

### Indexes
- Primary keys on all tables
- Foreign key indexes
- Query-specific indexes

### Caching
- KV for frequently accessed data
- Client-side caching
- Edge caching via Workers
