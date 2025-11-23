# Frontend Documentation

Documentation for the InMoney Angular application.

## Contents

- [Design System](./design-system.md) - Colors, typography, components, layouts
- [State Management](./state-management.md) - NgRx patterns and conventions
- [Components](./components.md) - Component architecture
- [Services](./services.md) - Service layer documentation
- [Styling](./styling.md) - TailwindCSS/DaisyUI conventions

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 19 | Framework (zoneless) |
| NgRx | Latest | State management |
| TailwindCSS | 4 | Utility-first CSS |
| DaisyUI | Latest | Component library |
| ApexCharts | Latest | Data visualization |
| Material Icons | Latest | Icon system |
| Supabase | Latest | Backend client |

## Design Philosophy

InMoney is a **data-focused trading platform**. The UI prioritizes:

1. **Information Density** - Traders need data, not whitespace
2. **Semantic Colors** - Green = bullish/calls, Red = bearish/puts
3. **Keyboard-First** - Power users navigate via hotkeys
4. **Focus Mode** - Deep analysis on single symbols
5. **Progressive Disclosure** - Simple by default, powerful when needed

## Key Features

| Feature | Description |
|---------|-------------|
| **Options Flow** | Real-time options trades with filtering |
| **Options Chain** | Interactive chain with Greeks |
| **Strategy Generator** | AI-powered strategy creation |
| **Watchlist** | Track symbols with real-time updates |
| **Focus Mode** | Lock UI to single symbol analysis |
| **Charts** | 100+ visualizations with ApexCharts |

## Project Structure

```
apps/inmoney/src/app/
├── pages/          # Page components (routed, smart)
├── components/     # Presentational components (dumb)
├── forms/          # Form components and validators
├── services/       # Business logic and API clients
├── state/          # NgRx (actions, reducers, selectors, effects)
├── types/          # TypeScript interfaces
├── utils/          # Helpers, directives, pipes
└── environments/   # Environment configuration
```

## Key Conventions

### Components
- Standalone components only (`standalone: true`)
- OnPush change detection
- Modern control flow (`@if`, `@for`, `@switch`)
- Signal-based APIs (`input()`, `output()`, `viewChild()`)
- Deferred loading for heavy components (`@defer`)

### State Management
- NgRx with entity adapters
- Actions, reducers, selectors, effects pattern
- Separate files per concern (`.actions.ts`, `.reducer.ts`, etc.)

### Styling
- TailwindCSS utility classes
- DaisyUI semantic component classes
- Kebab-case file naming
- Light/dark theme support

## Quick Reference

### Common Classes

```html
<!-- Bullish/Bearish -->
<p [class.bullish]="positive" [class.bearish]="negative">

<!-- Cards -->
<div class="card card-border bg-base-200 rounded-lg">

<!-- Buttons -->
<button class="btn btn-primary">
<button class="btn btn-ghost btn-circle">

<!-- Layout -->
<div class="flex flex-col lg:flex-row gap-4">
```

### Color Semantic

| Color | Meaning | Class |
|-------|---------|-------|
| Green | Bullish, Calls, Positive | `.bullish`, `text-green-500`, `bg-success` |
| Red | Bearish, Puts, Negative | `.bearish`, `text-red-500`, `bg-error` |
| Blue | Info, Prices | `text-info` |
| Primary | Selected, Focus | `bg-primary`, `text-primary` |

## Getting Started

```bash
# Development server
npm start

# Build
npm run devbuild

# Tests
npm test

# Lint
npm run lint
```

## Related Documentation

- [Product Overview](../domain/product-overview.md) - What InMoney does
- [API Documentation](../api/README.md) - Backend API
- [Architecture](../architecture/overview.md) - System architecture
