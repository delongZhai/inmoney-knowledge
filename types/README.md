# Types

Shared TypeScript type definitions.

## Contents

- [Models](./models/) - Shared model definitions

## Purpose

This directory contains TypeScript type definitions that are shared between the frontend and backend projects. This ensures type consistency across the codebase.

## Usage

### In Frontend (inmoney)

```typescript
import { Ticker, OptionContract } from '@shared/types';
```

### In Backend (inmoney-api)

```typescript
import { Ticker, OptionContract } from '../shared/types';
```

## Guidelines

### Do
- Define interfaces for API request/response shapes
- Export all types from index.ts
- Use JSDoc comments for documentation
- Keep types focused and single-purpose

### Don't
- Include implementation logic
- Create circular dependencies
- Duplicate types that exist in one project only

## Structure

```
types/
├── README.md
├── index.ts        # Re-exports all types
└── models/
    ├── index.ts    # Re-exports model types
    ├── ticker.ts
    ├── option.ts
    ├── strategy.ts
    └── playlist.ts
```
