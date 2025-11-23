# Debugging

Common debugging scenarios and solutions.

## Frontend Debugging

### Angular DevTools
1. Install Chrome extension: Angular DevTools
2. Open DevTools → Angular tab
3. Inspect component tree, state, and change detection

### NgRx DevTools
1. Install Chrome extension: Redux DevTools
2. Enable in app: `StoreDevtoolsModule.instrument()`
3. View state changes, action history, time-travel

### Console Debugging

```typescript
// Log store state
this.store.subscribe(state => console.log('State:', state));

// Log specific selector
this.store.select(selectFeature).subscribe(console.log);
```

### Network Issues

1. Open DevTools → Network tab
2. Check for failed requests (red)
3. Verify request headers (Authorization)
4. Check response status and body

### Common Frontend Issues

#### Component Not Updating
- Check `ChangeDetectionStrategy.OnPush`
- Ensure immutable data updates
- Use signals or async pipe

#### State Not Changing
- Check action is dispatched (DevTools)
- Verify reducer handles action
- Check selector is correct

#### Styles Not Applied
- Check TailwindCSS class names
- Verify no CSS specificity conflicts
- Check DaisyUI theme is set

---

## Backend Debugging

### Local Development

```bash
# Run with verbose logging
wrangler dev --log-level debug
```

### Console Logging

```typescript
console.log('Debug:', data);
// Visible in wrangler dev terminal
```

### Request Inspection

```typescript
export default {
  async fetch(request: Request, env: Env) {
    console.log('URL:', request.url);
    console.log('Method:', request.method);
    console.log('Headers:', Object.fromEntries(request.headers));
    // ...
  },
};
```

### Common Backend Issues

#### 401 Unauthorized
- Check Authorization header present
- Verify token is valid (not expired)
- Check JWT secret matches

#### 500 Internal Error
- Check Workers logs (wrangler tail)
- Add try/catch with logging
- Check Sentry for stack trace

#### D1 Errors
- Verify database binding
- Check SQL syntax
- Ensure migrations ran

---

## Database Debugging

### Supabase

```sql
-- Check recent errors
SELECT * FROM auth.audit_log_entries
ORDER BY created_at DESC
LIMIT 10;

-- Query data
SELECT * FROM playlists
WHERE user_id = 'uuid';
```

### D1

```bash
# Interactive SQL
wrangler d1 execute inmoney-db --command "SELECT * FROM table"

# Remote database
wrangler d1 execute inmoney-db --remote --command "SELECT * FROM table"
```

---

## Error Tracking

### Sentry

1. Check Sentry dashboard for errors
2. Review stack traces
3. Check error frequency and users affected
4. Use breadcrumbs for context

### Adding Context

```typescript
Sentry.setUser({ id: userId, email: userEmail });
Sentry.setTag('feature', 'options');
Sentry.addBreadcrumb({
  message: 'User action',
  category: 'ui',
  level: 'info',
});
```

---

## Performance Debugging

### Frontend

1. DevTools → Performance tab
2. Record and analyze
3. Check for:
   - Long tasks
   - Excessive re-renders
   - Memory leaks

### Backend

1. Check Workers analytics
2. Monitor CPU time usage
3. Profile slow endpoints

---

## Useful Commands

```bash
# Frontend
npm run lint        # Find code issues
npm test            # Run tests
ng serve --verbose  # Verbose dev server

# Backend
wrangler tail       # Live logs
wrangler dev        # Local server

# Git
git log --oneline   # Recent commits
git diff            # See changes
git blame file.ts   # See who changed what
```
