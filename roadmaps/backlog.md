# Feature Backlog

Features planned for future development, prioritized based on the [current roadmap](./current.md).

## Overview

The current roadmap focuses on **AI-Powered Intelligence & Simplified UX**. Features in this backlog either:
1. Support the roadmap but aren't in the current cycle
2. Are valuable but lower priority than AI/UX initiatives
3. Need more research before committing

---

## High Priority (Next Up)

Features that directly support the roadmap or have high user demand.

### Enhanced Keyboard Navigation
- **Category**: Frontend / UX
- **Effort**: S
- **Description**: Expand hotkeys.service.ts to support more actions, add keyboard shortcuts guide modal
- **Value**: Supports "Simplified UX" goal - power users navigate faster
- **Supports Roadmap**: Initiative 3 (Simplified UX)

### Saved Filter Presets
- **Category**: Frontend
- **Effort**: S
- **Description**: Allow users to save and quickly apply favorite option event filter combinations
- **Value**: Reduces complexity - users don't re-configure filters daily
- **Supports Roadmap**: Initiative 3 (Simplified UX)

### API Key Management UI
- **Category**: Frontend + Backend
- **Effort**: M
- **Description**: User interface for creating/managing API keys for MCP and external integrations
- **Value**: Required for MCP server to work with user authentication
- **Supports Roadmap**: Initiative 1 (MCP) and Initiative 4 (API/DX)

### Knowledge Base for RAG
- **Category**: Documentation
- **Effort**: M
- **Description**: Expand shared/domain docs with structured content for RAG ingestion
- **Value**: Better RAG answers require good source content
- **Supports Roadmap**: Initiative 2 (RAG)

### Contextual Tooltips & "Explain This"
- **Category**: Frontend / UX
- **Effort**: M
- **Description**: Add tooltips explaining options terminology, plus "Explain this" button that triggers AI explanation
- **Value**: Reduces learning curve for new users
- **Supports Roadmap**: Initiative 3 (Simplified UX)

---

## Medium Priority

Features with clear value but not immediately scheduled.

### Export Portfolio/Strategies to CSV/PDF
- **Category**: Frontend
- **Effort**: M
- **Description**: Allow users to export their portfolio targets, strategies, and watchlists
- **Value**: Users need to share/archive data for tax purposes or external analysis

### Dark/Light Theme Toggle
- **Category**: Frontend
- **Effort**: S
- **Description**: User-selectable theme switching with system preference detection
- **Value**: Many traders prefer dark mode for eye strain reduction

### Options P/L Calculator
- **Category**: Frontend
- **Effort**: M
- **Description**: Interactive profit/loss diagram showing break-even points and max profit/loss
- **Value**: Visual understanding of strategy risk/reward before execution

### Candlestick Charts
- **Category**: Frontend
- **Effort**: M
- **Description**: Add candlestick chart type to price-chart component
- **Value**: Standard chart type expected by traders

### Strategy Templates
- **Category**: Frontend
- **Effort**: M
- **Description**: Pre-built strategy templates (iron condor, bull call spread, etc.) with one-click apply
- **Value**: Faster strategy creation for common patterns

### Search with Recent History
- **Category**: Frontend
- **Effort**: S
- **Description**: Show recently searched symbols and options in search dropdown
- **Value**: Reduces repetitive typing for frequently accessed symbols

### Improved Options Chain UX
- **Category**: Frontend
- **Effort**: M
- **Description**: Better keyboard navigation, quick-add to strategy, inline Greeks display
- **Value**: Core user workflow improvement

---

## Low Priority / Nice to Have

Features that would be nice but are not urgent.

### Progressive Web App (PWA)
- **Category**: Frontend + Infrastructure
- **Effort**: L
- **Description**: Enable PWA features for offline access and home screen installation
- **Value**: Better mobile experience, offline viewing of saved strategies

### Drag-and-Drop Watchlist Reordering
- **Category**: Frontend
- **Effort**: S
- **Description**: Allow users to reorder watchlist items via drag-and-drop
- **Value**: Minor UX improvement for personalization

### Social Sharing for Strategies
- **Category**: Frontend
- **Effort**: S
- **Description**: Generate shareable links or images for strategies
- **Value**: Marketing/virality, user engagement

### Volume Profile Indicator
- **Category**: Frontend
- **Effort**: M
- **Description**: Add volume profile overlay to stock charts
- **Value**: Important technical indicator for support/resistance analysis

### Mobile-Responsive Options Chain
- **Category**: Frontend
- **Effort**: L
- **Description**: Redesign options chain table for mobile/tablet with swipe gestures
- **Value**: Mobile users currently have poor options chain experience

### Earnings Calendar Enhancements
- **Category**: Frontend
- **Effort**: M
- **Description**: Filter by sector, market cap, expected move
- **Value**: Earnings plays are common options strategies

### Options Flow Summary Widget
- **Category**: Frontend
- **Effort**: M
- **Description**: Dashboard widget showing aggregated unusual options activity
- **Value**: Quick market sentiment overview

### Accessibility (WCAG AA)
- **Category**: Frontend
- **Effort**: L
- **Description**: Audit and improve screen reader support, keyboard navigation, color contrast
- **Value**: Inclusive design, potential legal compliance

### Component Storybook
- **Category**: Frontend / DX
- **Effort**: L
- **Description**: Document all UI components in Storybook
- **Value**: Developer experience, design consistency

---

## Ideas / Exploration

Early-stage ideas that need more research or validation.

### Voice Commands
- **Description**: Voice-controlled navigation leveraging existing text-to-speech service
- **Questions to Answer**:
  - Browser API support/reliability?
  - Privacy concerns?
  - Most useful commands?
- **Related to Roadmap**: Could enhance AI-assisted navigation

### Broker Integration
- **Description**: Connect to brokerage accounts for one-click trade execution
- **Questions to Answer**:
  - Which brokers have APIs?
  - Regulatory requirements?
  - Liability considerations?

### Real-Time Collaboration
- **Description**: Multiple users view/edit same watchlist or strategy
- **Questions to Answer**:
  - Is there user demand?
  - Infrastructure cost?
  - Subscription tier implications?

### Options Education Module
- **Description**: Interactive tutorials teaching options basics within the app
- **Questions to Answer**:
  - Build vs. partner with education provider?
  - How to measure effectiveness?
  - Could this feed into RAG knowledge base?

### AI Strategy Optimization
- **Description**: AI suggests modifications to improve strategy risk/reward
- **Questions to Answer**:
  - What models/algorithms?
  - Liability/disclaimers needed?
  - Builds on RAG foundation?

### Multi-Language Support (i18n)
- **Category**: Frontend
- **Effort**: XL
- **Description**: Internationalization for non-English markets
- **Value**: Market expansion potential

---

## Planned Future Initiatives

Major initiatives documented for future development.

### Native Mobile Apps
**Priority**: Future (after Pillars 1-2 complete)
**Category**: Mobile
**Effort**: XL

Native iOS and Android applications with chat-first interface.

**Strategy**:
- iOS: Swift + SwiftUI
- Android: Kotlin + Jetpack Compose
- Shared: Design tokens, API contracts, authentication (Supabase)

**Core Features**:
- Chat interface as primary interaction (same as web)
- Watchlist management with real-time updates
- Push notifications for AI-generated alerts
- Flow feed with strategy annotations
- Offline-capable watchlist caching

**Design System Requirements**:
- Unified color palette, typography, spacing tokens
- Component library documentation
- Platform-specific adaptations (iOS HIG, Material Design)
- Dark mode support

**Dependencies**:
- Multi-leg strategy detection API (Initiative 1)
- Conversational interface + agent framework (Initiative 3)
- API migration complete (compute endpoints)

**Why Wait**:
- API-first architecture must be complete first
- Chat interface design needs validation on web before mobile
- Reduces duplicate implementation by having stable APIs

---

## Out of Scope / Rejected

Features that have been considered and rejected. Document reasoning.

### Real-Time Chat Support
- **Reason**: High operational cost. AI assistant should reduce support needs. Email support and documentation preferred for current scale.

### Crypto Options
- **Reason**: Different market structure, data sources, and user base. Focus on US equity options for now.

---

## Effort Sizing Guide

| Size | Description | Rough Duration |
|------|-------------|----------------|
| S | Simple, well-understood | Hours |
| M | Moderate complexity | Days |
| L | Significant work | 1-2 weeks |
| XL | Large initiative | Multiple weeks |
