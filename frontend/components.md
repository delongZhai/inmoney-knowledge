# Component Architecture

Component patterns and conventions in InMoney.

## Component Types

### Page Components (Smart)
Located in `pages/`. Connected to the store, handle routing.

```typescript
@Component({
  selector: 'app-ticker-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TickerDetailComponent, LoadingComponent],
  template: `
    @if (ticker(); as ticker) {
      <app-ticker-detail [ticker]="ticker" />
    } @else {
      <app-loading />
    }
  `,
})
export class TickerPageComponent {
  private store = inject(Store);

  ticker = this.store.selectSignal(selectCurrentTicker);
}
```

### Presentational Components (Dumb)
Located in `components/`. Receive data via inputs, emit events via outputs.

```typescript
@Component({
  selector: 'app-ticker-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">{{ ticker().symbol }}</h2>
        <p>{{ ticker().name }}</p>
        <button class="btn btn-primary" (click)="select.emit(ticker())">
          View Details
        </button>
      </div>
    </div>
  `,
})
export class TickerCardComponent {
  ticker = input.required<Ticker>();
  select = output<Ticker>();
}
```

### Form Components
Located in `forms/`. Reusable form controls and form groups.

## Modern Angular Patterns

### Signal-based APIs

```typescript
// Inputs
ticker = input.required<Ticker>();
limit = input(10); // with default

// Outputs
select = output<Ticker>();

// View queries
chart = viewChild<ElementRef>('chart');
items = viewChildren(ItemComponent);

// Content queries
header = contentChild(HeaderDirective);
```

### Modern Control Flow

```typescript
// Conditionals
@if (loading()) {
  <app-spinner />
} @else if (error()) {
  <app-error [message]="error()" />
} @else {
  <app-content [data]="data()" />
}

// Loops
@for (item of items(); track item.id) {
  <app-item [item]="item" />
} @empty {
  <p>No items found</p>
}

// Switch
@switch (status()) {
  @case ('loading') { <app-loading /> }
  @case ('error') { <app-error /> }
  @default { <app-content /> }
}
```

### Dependency Injection

```typescript
// Use inject() function
export class MyComponent {
  private store = inject(Store);
  private router = inject(Router);
  private service = inject(MyService);
}
```

## Component Conventions

### File Naming
- Kebab-case: `ticker-card.component.ts`
- Suffix with type: `.component.ts`, `.directive.ts`, `.pipe.ts`

### Selector Naming
- Prefix with `app-`: `app-ticker-card`

### Template
- Inline for small components
- Separate file for complex components

### Styles
- Use TailwindCSS utility classes
- Use DaisyUI component classes
- Inline styles for small components

## Change Detection

All components use OnPush change detection:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

This requires:
- Immutable data patterns
- Signal-based state
- Proper use of `async` pipe or signals
