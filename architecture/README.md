# Architecture

System-wide architecture documentation for the InMoney ecosystem.

## Contents

- [Overview](./overview.md) - High-level system architecture
- [Data Flow](./data-flow.md) - How data flows between frontend and backend
- [Diagrams](./diagrams/) - Visual architecture diagrams

## System Overview

InMoney is a stock and options tracking platform built with:

| Layer | Technology | Description |
|-------|------------|-------------|
| Frontend | Angular 19 | SPA with NgRx state management |
| Backend | Cloudflare Workers | Serverless API on edge |
| Database | Supabase (PostgreSQL) | Data persistence and real-time |
| Auth | Supabase Auth | Authentication and authorization |
| Payments | Stripe | Subscription management |

## Key Architecture Decisions

Document significant architectural decisions here as Architecture Decision Records (ADRs).

### ADR Template
```
## ADR-XXX: [Title]

### Status
Proposed | Accepted | Deprecated | Superseded

### Context
What is the issue that we're seeing that is motivating this decision?

### Decision
What is the change that we're proposing and/or doing?

### Consequences
What becomes easier or more difficult to do because of this change?
```
