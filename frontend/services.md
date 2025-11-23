# Services

Service layer documentation for InMoney.

## Service Categories

### API Services
Communicate with backend APIs.

### State Services
Interact with NgRx store.

### Utility Services
Provide helper functionality.

## Key Services

### SupabaseService
Direct Supabase client access.

```typescript
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  get client() {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }
}
```

### SupabaseHttpService
HTTP-based API calls to Supabase.

### CoreSdk
Auto-generated TypeScript SDK from OpenAPI spec.

```typescript
// Generated via: npm run generate-api
import { CoreSdk } from './core.sdk';

const sdk = new CoreSdk({ baseUrl: environment.apiUrl });
const tickers = await sdk.tickers.list();
```

### RealtimeService
Real-time subscriptions via Supabase.

```typescript
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  subscribeToTicker(symbol: string) {
    return this.supabase
      .channel(`ticker:${symbol}`)
      .on('broadcast', { event: 'update' }, (payload) => {
        // Handle update
      })
      .subscribe();
  }
}
```

### SessionRecoveryService
App initialization and session management.

```typescript
@Injectable({ providedIn: 'root' })
export class SessionRecoveryService {
  async initialize(): Promise<void> {
    // Recover session from storage
    // Load initial data
    // Set up subscriptions
  }
}
```

## Service Patterns

### Dependency Injection

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  private http = inject(HttpClient);
  private store = inject(Store);
}
```

### Error Handling

```typescript
getData(): Observable<Data> {
  return this.http.get<Data>(url).pipe(
    catchError((error) => {
      console.error('Error fetching data:', error);
      return throwError(() => new Error('Failed to fetch data'));
    })
  );
}
```

### Caching

```typescript
private cache = new Map<string, Data>();

getData(id: string): Observable<Data> {
  if (this.cache.has(id)) {
    return of(this.cache.get(id)!);
  }

  return this.http.get<Data>(`${url}/${id}`).pipe(
    tap((data) => this.cache.set(id, data))
  );
}
```

## Service vs Effect

| Use Service | Use Effect |
|-------------|------------|
| Reusable business logic | Action-triggered side effects |
| Caching | Store updates |
| Complex transformations | Navigation |
| External library wrappers | API calls with state updates |
