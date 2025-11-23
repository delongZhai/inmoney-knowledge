# State Management

NgRx patterns and conventions used in InMoney.

## Overview

InMoney uses NgRx for state management with the following features:
- `@ngrx/store` - State container
- `@ngrx/effects` - Side effects
- `@ngrx/entity` - Entity collections
- `@ngrx/router-store` - Router state

## State Structure

```typescript
interface AppState {
  app: AppFeatureState;      // Core app state
  tickers: TickersState;     // Ticker entities
  optionsSnapshots: OptionsSnapshotsState;
  strategies: StrategiesState;
  playlist: PlaylistState;
  router: RouterReducerState;
}
```

## Feature State Pattern

Each feature follows this structure:

```
state/
└── feature/
    ├── feature.actions.ts
    ├── feature.reducer.ts
    ├── feature.selectors.ts
    ├── feature.state.ts
    └── feature.effects.ts
```

### State Definition

```typescript
// feature.state.ts
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export interface Feature {
  id: string;
  name: string;
  // ...
}

export interface FeatureState extends EntityState<Feature> {
  loading: boolean;
  error: string | null;
}

export const featureAdapter: EntityAdapter<Feature> = createEntityAdapter<Feature>();

export const initialFeatureState: FeatureState = featureAdapter.getInitialState({
  loading: false,
  error: null,
});
```

### Actions

```typescript
// feature.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const FeatureActions = createActionGroup({
  source: 'Feature',
  events: {
    'Load Features': emptyProps(),
    'Load Features Success': props<{ features: Feature[] }>(),
    'Load Features Failure': props<{ error: string }>(),
    'Add Feature': props<{ feature: Feature }>(),
    'Update Feature': props<{ update: Update<Feature> }>(),
    'Delete Feature': props<{ id: string }>(),
  },
});
```

### Reducer

```typescript
// feature.reducer.ts
import { createReducer, on } from '@ngrx/store';

export const featureReducer = createReducer(
  initialFeatureState,

  on(FeatureActions.loadFeatures, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(FeatureActions.loadFeaturesSuccess, (state, { features }) =>
    featureAdapter.setAll(features, {
      ...state,
      loading: false,
    })
  ),

  on(FeatureActions.loadFeaturesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
```

### Selectors

```typescript
// feature.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';

export const selectFeatureState = createFeatureSelector<FeatureState>('feature');

const { selectIds, selectEntities, selectAll, selectTotal } = featureAdapter.getSelectors();

export const selectAllFeatures = createSelector(
  selectFeatureState,
  selectAll
);

export const selectFeatureLoading = createSelector(
  selectFeatureState,
  (state) => state.loading
);

export const selectFeatureById = (id: string) => createSelector(
  selectFeatureState,
  (state) => state.entities[id]
);
```

### Effects

```typescript
// feature.effects.ts
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';

export const loadFeatures = createEffect(
  (actions$ = inject(Actions), service = inject(FeatureService)) => {
    return actions$.pipe(
      ofType(FeatureActions.loadFeatures),
      mergeMap(() =>
        service.getAll().pipe(
          map((features) => FeatureActions.loadFeaturesSuccess({ features })),
          catchError((error) => of(FeatureActions.loadFeaturesFailure({ error: error.message })))
        )
      )
    );
  },
  { functional: true }
);
```

## Best Practices

### Do
- Use `createActionGroup` for related actions
- Use entity adapters for collections
- Keep selectors memoized
- Handle loading and error states
- Use functional effects

### Don't
- Mutate state directly
- Put business logic in reducers
- Subscribe to store in effects (use selectors)
- Dispatch actions from reducers

## Existing Features

| Feature | Description |
|---------|-------------|
| `app` | User, session, subscription, errors |
| `tickers` | Stock ticker entities |
| `optionsSnapshots` | Options data entities |
| `strategies` | Trading strategy entities |
| `playlist` | User playlist entities |
| `router` | Router state |
