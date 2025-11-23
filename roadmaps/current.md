# Current Roadmap

**Period**: Q4 2024 - Q1 2025
**Theme**: Intelligent Flow Analysis & Conversational Interface

---

## Vision

Transform InMoney from a data platform into an **AI-powered trading assistant** that automatically detects sophisticated trading strategies from options flow, enables natural language interaction, and delivers AI-augmented insights across all platforms.

**Key Principles**:
1. **Intelligent detection** - Automatically identify multi-leg strategies and market sentiment from raw flow
2. **Conversational interface** - Users interact through chat, not menus
3. **API-first architecture** - All computation server-side, enabling agents and mobile
4. **Cross-platform consistency** - Same experience on web, mobile, and AI assistants

---

## Goals

- [ ] Detect multi-leg options strategies from flow data automatically
- [ ] Enable conversational queries AND actions via chat interface
- [ ] Migrate UI computations to API for agent/mobile consumption
- [ ] Document mobile strategy for future native iOS/Android apps

---

## Strategic Initiatives

### 1. Multi-Leg Strategy Detection
**Priority**: P0 (Critical)
**Status**: Planning
**Effort**: L

Automatically identify options strategies from raw flow data by clustering related trades within a **rolling 5-minute window**.

**Why**: Users currently see individual trades but miss the bigger picture. A synthetic long (150x call + 150x short put) looks like two unrelated trades but represents a single directional bet.

**Detectable Patterns**:

| Pattern | Detection Logic |
|---------|-----------------|
| Synthetic Long | Long call + short put, same strike/exp, similar size |
| Synthetic Short | Short call + long put, same strike/exp, similar size |
| Bull Call Spread | Long lower strike call + short higher strike call |
| Bear Put Spread | Long higher strike put + short lower strike put |
| Straddle | Long call + long put, same strike/exp |
| Strangle | Long OTM call + long OTM put, same exp |
| Iron Condor | Bull put spread + bear call spread |
| Butterfly | 3-leg structure with middle strike 2x quantity |

**Enrichment Layer**:
- Inferred direction (bullish / bearish / neutral / volatility)
- Conviction score (premium-weighted, normalized by vol/OI)
- Combined position Greeks and max profit/loss profile

**Tasks**:
- [ ] Design clustering algorithm with 5-minute rolling window
- [ ] Define pattern templates for each strategy type
- [ ] Implement tolerance parameters (strike proximity, size matching)
- [ ] Build enrichment layer (direction, conviction, Greeks)
- [ ] Create API endpoint for strategy-annotated flow
- [ ] Add strategy detection to real-time flow feed
- [ ] Update frontend to display detected strategies

**Success Criteria**:
- Correctly identify >90% of multi-leg strategies in historical data
- Real-time detection latency <1 second
- Users can filter flow by detected strategy type

---

### 2. MCP Server Implementation
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

### 3. Conversational Research Interface
**Priority**: P0 (Critical)
**Status**: Planning
**Effort**: XL

Chat interface supporting both **read operations** (queries, analysis) and **write operations** (watchlist management, alerts, actions).

**Why**: Users shouldn't need to know which chart or filter to use. They should just ask—and act.

**Query Capabilities**:
```
"Show me bullish flow on AAPL this week"
"Find synthetic longs opened today with premium > $500K"
"What's unusual in my watchlist?"
"Compare NVDA flow sentiment to last earnings"
```

**Action Capabilities**:
```
"Add TSLA to my watchlist"
"Create a new watchlist called 'Earnings Plays'"
"Alert me when there's unusual put activity on SPY"
"Remove META from Tech Stocks"
```

**Analysis Capabilities**:
```
"Explain why this flow cluster is significant"
"Summarize today's market sentiment"
"What does this iron condor setup imply about expected move?"
```

**Architecture**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Chat UI   │────▶│    Agent    │────▶│  Compute    │
│ (Web/Mobile)│◀────│ Orchestrator│◀────│    API      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │     LLM     │
                    │  (Reasoning)│
                    └─────────────┘
```

**Agent Function Definitions**:

| Function | Type | Description |
|----------|------|-------------|
| `searchFlow` | read | Query options flow with filters |
| `detectStrategies` | read | Identify multi-leg patterns in flow |
| `analyzeSymbol` | read | Get sentiment/flow summary for ticker |
| `getWatchlist` | read | Retrieve user's watchlists |
| `addToWatchlist` | write | Add symbol to watchlist |
| `removeFromWatchlist` | write | Remove symbol from watchlist |
| `createWatchlist` | write | Create new watchlist |
| `deleteWatchlist` | write | Delete a watchlist |
| `createAlert` | write | Set up flow/price alert |
| `explainFlow` | read | Generate analysis of flow pattern |

**API Migration Checklist** (move from UI to API):
- [ ] Strategy P/L profile calculation
- [ ] Greeks aggregation
- [ ] Flow filtering & sorting
- [ ] Historical flow queries
- [ ] Strategy pattern detection (Initiative 1)

**Tasks**:
- [ ] Design agent orchestration framework (in-house)
- [ ] Define function schemas for all read/write operations
- [ ] Migrate compute logic from frontend to API endpoints
- [ ] Implement LLM integration layer
- [ ] Build chat UI component (web)
- [ ] Add conversation memory / context management
- [ ] Implement action confirmation flow (for write operations)
- [ ] Add feedback mechanism (thumbs up/down)

**Success Criteria**:
- Users can query data without navigating UI
- Users can execute actions (add to watchlist, create alerts) via chat
- Agent correctly routes between read/write operations
- Response latency <3 seconds for queries, <1 second for actions

---

### 4. Simplified UX & Onboarding
**Priority**: P1 (High)
**Status**: Planning
**Effort**: L

Reduce complexity for new users while maintaining power-user features.

**Why**: Options trading is already complex. Our UI shouldn't add more complexity.

**Focus Areas**:

#### 4a. Guided Onboarding Flow
- [ ] Interactive tutorial for first-time users
- [ ] Explain core concepts in context
- [ ] Pre-built watchlist templates (Tech, Meme stocks, etc.)
- [ ] "Quick start" for common tasks

#### 4b. Simplified Default Views
- [ ] Smart defaults for filters (don't show 15 options upfront)
- [ ] Progressive disclosure (basic → advanced)
- [ ] Contextual tooltips for terminology
- [ ] "Explain this" button on complex data

#### 4c. AI-Assisted Navigation
- [ ] Command palette (Cmd+K) with natural language
- [ ] "Take me to..." voice/text commands
- [ ] Suggested next actions based on context

**Success Criteria**:
- New user can find useful insight within 5 minutes
- Reduce support questions about "how do I..."
- Increase trial-to-paid conversion

---

### 5. API & Developer Experience
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
| Strategy detection accuracy | Start with simple patterns, add complex ones iteratively |
| Agent action safety | Require confirmation for destructive actions |
| MCP is new protocol, may evolve | Start with core features, iterate |
| AI costs could be high | Tier AI features, cache responses |
| User adoption of chat interface | Keep traditional UI, chat is additive |

---

## Technical Considerations

### Strategy Detection Engine
- **Algorithm**: Sliding window clustering (5-minute rolling)
- **Storage**: Annotate flow records with detected strategy IDs
- **Streaming**: Real-time pattern matching on incoming flow

### Agent Architecture
- **Orchestration**: In-house agent framework
- **LLM**: Claude API (Anthropic)
- **Function calling**: Structured tool definitions
- **Memory**: Conversation context per session

### MCP Server Stack
- **Runtime**: Cloudflare Workers (existing)
- **Protocol**: MCP over HTTP/SSE
- **Auth**: User API keys tied to subscription

### Frontend Changes
- Chat/assistant component (portable to mobile)
- Strategy visualization in flow table
- Command palette integration

---

## Execution Phases

| Phase | Focus |
|-------|-------|
| Phase 1 | Multi-leg strategy detection engine (Initiative 1) |
| Phase 2 | API migration + MCP server (Initiative 2) |
| Phase 3 | Chat interface with read operations (Initiative 3) |
| Phase 4 | Chat write operations + action handlers |
| Phase 5 | Simplified UX & onboarding (Initiative 4) |

---

## Out of Scope (This Cycle)

- Native mobile apps (see [backlog](./backlog.md#native-mobile-apps) for documented strategy)
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
