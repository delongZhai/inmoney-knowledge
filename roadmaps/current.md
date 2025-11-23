# Current Roadmap

**Period**: Q4 2024 - Q1 2025
**Theme**: AI-Powered Intelligence & Simplified UX

---

## Vision

Transform InMoney from a data platform into an **AI-powered trading assistant** that helps users understand complex options data through natural conversation and intelligent recommendations.

**Key Principles**:
1. **Simplify complexity** - Make options trading accessible to more users
2. **AI-first interactions** - Let users ask questions instead of clicking through menus
3. **Contextual intelligence** - Surface relevant insights automatically
4. **Open ecosystem** - Enable AI agents to access our data via MCP

---

## Goals

- [ ] Enable AI assistants to query InMoney data via MCP (Model Context Protocol)
- [ ] Implement RAG for intelligent Q&A over user's portfolio and market data
- [ ] Simplify core workflows to reduce learning curve
- [ ] Improve onboarding for new users

---

## Strategic Initiatives

### 1. MCP Server Implementation
**Priority**: P0 (Critical)
**Status**: Planning
**Effort**: L

Build an MCP (Model Context Protocol) server that exposes InMoney data and capabilities to AI assistants like Claude.

**Why**: Users can interact with their trading data through natural language via any MCP-compatible AI assistant.

**Capabilities to expose**:
- [ ] Query watchlist and portfolio
- [ ] Search options flow by symbol, size, sentiment
- [ ] Get options chain data
- [ ] Analyze strategy P/L
- [ ] Fetch earnings calendar
- [ ] Get sentiment/trend analysis

**Tasks**:
- [ ] Design MCP server architecture
- [ ] Define tools/resources schema
- [ ] Implement authentication (user's API key)
- [ ] Build core query endpoints
- [ ] Add streaming for real-time data
- [ ] Documentation for setup

**Success Criteria**:
- User can ask Claude "What's the unusual options activity on TSLA today?" and get real answer
- User can say "Add NVDA to my watchlist" and it happens

---

### 2. RAG-Powered Q&A System
**Priority**: P0 (Critical)
**Status**: Planning
**Effort**: XL

Implement Retrieval-Augmented Generation to answer user questions about their data and market conditions.

**Why**: Users shouldn't need to know which chart or filter to use. They should just ask.

**Use Cases**:
- "What stocks in my watchlist have unusual put activity?"
- "Summarize the options flow for my portfolio today"
- "What are the highest conviction trades this week?"
- "Explain why AAPL calls are up 200% today"
- "What strategies would work for TSLA before earnings?"

**Components**:
- [ ] Vector store for market data embeddings
- [ ] Knowledge base of options concepts (from our docs)
- [ ] Query routing (portfolio vs. market vs. educational)
- [ ] Response generation with citations
- [ ] Conversation memory for follow-ups

**Tasks**:
- [ ] Choose vector database (Vectorize, Pinecone, etc.)
- [ ] Design embedding strategy for time-series data
- [ ] Build ingestion pipeline for real-time data
- [ ] Implement retrieval logic
- [ ] Create prompt templates for different query types
- [ ] Build chat UI component
- [ ] Add feedback mechanism (thumbs up/down)

**Success Criteria**:
- Users can get answers without navigating to specific pages
- Answers include relevant charts/data visualizations
- System learns from user feedback

---

### 3. Simplified UX & Onboarding
**Priority**: P1 (High)
**Status**: Planning
**Effort**: L

Reduce complexity for new users while maintaining power-user features.

**Why**: Options trading is already complex. Our UI shouldn't add more complexity.

**Focus Areas**:

#### 3a. Guided Onboarding Flow
- [ ] Interactive tutorial for first-time users
- [ ] Explain core concepts in context
- [ ] Pre-built watchlist templates (Tech, Meme stocks, etc.)
- [ ] "Quick start" for common tasks

#### 3b. Simplified Default Views
- [ ] Smart defaults for filters (don't show 15 options upfront)
- [ ] Progressive disclosure (basic → advanced)
- [ ] Contextual tooltips for terminology
- [ ] "Explain this" button on complex data

#### 3c. AI-Assisted Navigation
- [ ] Command palette (Cmd+K) with natural language
- [ ] "Take me to..." voice/text commands
- [ ] Suggested next actions based on context

**Success Criteria**:
- New user can find useful insight within 5 minutes
- Reduce support questions about "how do I..."
- Increase trial-to-paid conversion

---

### 4. API & Developer Experience
**Priority**: P2 (Medium)
**Status**: Planning
**Effort**: M

Prepare infrastructure for AI integrations and potential public API.

**Tasks**:
- [ ] Document internal API endpoints
- [ ] Design rate limiting per tier
- [ ] Create API key management UI
- [ ] Build developer documentation
- [ ] Consider OpenAPI spec publication

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| MCP is new protocol, may evolve | Start with core features, iterate |
| RAG quality depends on data structure | Invest in good embedding strategy |
| AI costs could be high | Tier AI features, cache responses |
| User adoption of chat interface | Keep traditional UI, chat is additive |

---

## Technical Considerations

### MCP Server Stack
- **Runtime**: Cloudflare Workers (existing)
- **Protocol**: MCP over HTTP/SSE
- **Auth**: User API keys tied to subscription

### RAG Stack Options
- **Vector DB**: Cloudflare Vectorize or external (Pinecone)
- **Embeddings**: OpenAI or local model
- **LLM**: Claude API (Anthropic)
- **Framework**: LangChain or custom

### Frontend Changes
- New chat/assistant component
- Command palette integration
- Onboarding flow components

---

## Timeline (Rough)

| Phase | Focus | Duration |
|-------|-------|----------|
| Phase 1 | MCP server MVP (read-only) | 2-3 weeks |
| Phase 2 | RAG for portfolio Q&A | 3-4 weeks |
| Phase 3 | Simplified onboarding | 2 weeks |
| Phase 4 | MCP write operations + polish | 2 weeks |

---

## Out of Scope (This Cycle)

- Mobile app
- Broker integrations
- Multi-language support
- Social/community features

These are moved to [backlog](./backlog.md) for future consideration.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| MCP server uptime | 99.9% |
| RAG answer accuracy | >80% user satisfaction |
| Time to first insight (new users) | <5 minutes |
| Trial-to-paid conversion | +20% improvement |
| Support ticket reduction | -30% |

---

## Completed This Period

<!-- Move completed features here -->

---

## Deferred

<!-- Features moved to backlog -->

---

## Notes

- MCP specification: https://modelcontextprotocol.io
- Consider Cloudflare AI Gateway for LLM cost management
- RAG could leverage existing `shared/` knowledge base for educational queries

---

## Related Documents

- [Architecture Overview](../architecture/overview.md)
- [API Documentation](../api/README.md)
- [Product Overview](../domain/product-overview.md)
