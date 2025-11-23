# InMoney Knowledge Base

Shared documentation and knowledge base for the InMoney ecosystem.

## Projects

| Project | Description | Repository |
|---------|-------------|------------|
| **inmoney** | Angular 19 frontend application | [inmoney](https://github.com/delongZhai/inmoney) |
| **inmoney-api** | Cloudflare Workers backend API | [inmoney-api](https://github.com/delongZhai/inmoney-api) |

---

## Documentation Structure

### [Architecture](./architecture/)
System-wide architecture documentation, data flows, and diagrams.

- [Overview](./architecture/overview.md) - High-level system architecture
- [Data Flow](./architecture/data-flow.md) - How data flows between frontend and backend
- [Diagrams](./architecture/diagrams/) - Visual architecture diagrams

### [API](./api/)
Backend API documentation and specifications.

- [Overview](./api/README.md) - API overview and conventions
- [Authentication](./api/authentication.md) - Auth flows with Supabase
- [Endpoints](./api/endpoints/) - Endpoint-specific documentation
- [OpenAPI Spec](./api/openapi/) - OpenAPI specifications

### [Frontend](./frontend/)
InMoney Angular application documentation.

- [Overview](./frontend/README.md) - Frontend architecture overview
- [State Management](./frontend/state-management.md) - NgRx patterns and conventions
- [Components](./frontend/components.md) - Component architecture
- [Services](./frontend/services.md) - Service layer documentation
- [Styling](./frontend/styling.md) - TailwindCSS/DaisyUI conventions

### [Backend](./backend/)
InMoney API documentation.

- [Overview](./backend/README.md) - Backend architecture overview
- [Database](./backend/database.md) - Database schema and migrations
- [Workers](./backend/workers.md) - Cloudflare Workers specifics
- [Integrations](./backend/integrations.md) - Third-party integrations

### [Domain](./domain/)
Business domain knowledge and terminology.

- [Glossary](./domain/glossary.md) - Trading and options terminology
- [Tickers](./domain/tickers.md) - How tickers work
- [Options](./domain/options.md) - Options data structures
- [Strategies](./domain/strategies.md) - Trading strategies explained

### [Guides](./guides/)
How-to guides and operational documentation.

- [Setup](./guides/setup.md) - Development environment setup
- [Deployment](./guides/deployment.md) - Deployment procedures
- [Debugging](./guides/debugging.md) - Common debugging scenarios

### [Types](./types/)
Shared TypeScript type definitions.

- [Overview](./types/README.md) - Types documentation
- [Models](./types/models/) - Shared model definitions

---

## Project Management

### [Roadmaps](./roadmaps/)
Product roadmaps and feature planning.

- [2024 Q4](./roadmaps/2024-q4.md) - Q4 2024 roadmap
- [2025 Q1](./roadmaps/2025-q1.md) - Q1 2025 roadmap
- [Backlog](./roadmaps/backlog.md) - Future features backlog

### [TODO](./todo/)
Task tracking and work items.

- [Frontend Tasks](./todo/frontend.md) - InMoney app tasks
- [Backend Tasks](./todo/backend.md) - API tasks
- [Infrastructure](./todo/infrastructure.md) - DevOps and infrastructure tasks

### [Issues](./issues/)
Known issues and bug tracking.

- [Open Issues](./issues/open.md) - Current open issues
- [Resolved](./issues/resolved.md) - Resolved issues archive
- [Templates](./issues/templates/) - Issue templates

---

## Quick Links

- [Contributing Guide](./CONTRIBUTING.md)
- [Development Setup](./guides/setup.md)
- [API Reference](./api/README.md)

---

## Getting Started

1. Clone the repository as a submodule:
   ```bash
   git submodule add https://github.com/delongZhai/inmoney-knowledge.git shared
   ```

2. Initialize and update submodules:
   ```bash
   git submodule init
   git submodule update
   ```

3. Navigate to relevant documentation based on your needs.
