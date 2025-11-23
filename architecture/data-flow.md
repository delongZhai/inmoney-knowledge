# Data Flow

How data flows through the InMoney system.

## Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Angular App
    participant S as NgRx Store
    participant W as Workers API
    participant DB as Supabase

    U->>A: User Action
    A->>S: Dispatch Action
    S->>W: HTTP Request
    W->>DB: Query/Mutation
    DB-->>W: Response
    W-->>S: API Response
    S->>S: Update State
    S-->>A: Select State
    A-->>U: UI Update
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Angular App
    participant Auth as Supabase Auth
    participant W as Workers API

    U->>A: Login Request
    A->>Auth: Authenticate
    Auth-->>A: JWT Token
    A->>A: Store Token
    A->>W: API Request + Token
    W->>W: Validate Token
    W-->>A: Protected Data
```

## Real-time Updates

```mermaid
sequenceDiagram
    participant A as Angular App
    participant RT as Supabase Realtime
    participant S as NgRx Store

    A->>RT: Subscribe to Channel
    RT-->>A: Connection Established
    RT->>A: Data Change Event
    A->>S: Dispatch Update Action
    S->>S: Update State
```

## State Management Flow

### NgRx Data Flow

```
User Action
    ↓
Component dispatches Action
    ↓
Effects intercept (async operations)
    ↓
Reducer updates State
    ↓
Selectors compute derived State
    ↓
Component receives updated data
```

### Entity State

All entity collections follow this pattern:
- `ids`: Array of entity IDs
- `entities`: Dictionary of entities by ID
- `loading`: Boolean loading state
- `error`: Error state

## API Data Flow

### Ticker Data

1. User searches for ticker
2. Frontend dispatches `loadTicker` action
3. Effect calls API endpoint
4. API fetches from market data provider
5. Response cached in KV (if applicable)
6. Data returned to frontend
7. Entity adapter updates store

### Options Data

1. User views options chain
2. Frontend dispatches `loadOptionsSnapshot` action
3. Effect calls API with ticker symbol
4. API aggregates options data
5. Snapshot stored in store
6. Components select and display data

## Caching Strategy

| Data Type | Cache Location | TTL |
|-----------|---------------|-----|
| Ticker metadata | KV | 24h |
| Options snapshots | None | Real-time |
| User preferences | Local Storage | Persistent |
| Session data | Memory | Session |
