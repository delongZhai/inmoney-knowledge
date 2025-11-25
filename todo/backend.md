# Backend Tasks

Tasks for the inmoney-api Workers application.

---

## In Progress

<!-- Currently active tasks -->

---

## Pending

<!-- Tasks ready to be picked up -->

### Task Template
- **Status**: Pending
- **Priority**: P2
- **Created**: YYYY-MM-DD
- **Description**: Description of what needs to be done
- **Notes**: Any additional context

---

## Blocked

<!-- Tasks waiting on something -->

---

## Done

<!-- Completed tasks (archive periodically) -->

### MCP Server - Initial Implementation
- **Status**: Done
- **Priority**: P1
- **Completed**: 2025-11-24
- **Description**: Implement minimal working MCP server with 5 core tools
- **Details**:
  - Created `/mcp` and `/sse` endpoints in existing Cloudflare Worker
  - Integrated with existing Supabase subscription token authentication
  - Implemented 5 working tools: search_symbol, search_option_contracts, get_market_status, get_company_snapshot, get_realtime_options
  - Tested locally with wrangler dev - all tools working
  - Documentation added: MCP_SETUP.md and src/mcp/README.md
- **Commit**: 44619b7

---

## Quick Capture

Quick task list for later processing:

### MCP Server Expansion
- [ ] Fix remaining tool handlers in `src/mcp/tools/` (30+ tools drafted but need signature fixes)
- [ ] Add technical indicators tools (RSI, MACD, Bollinger Bands, etc.)
- [ ] Add strategy generation and backtesting tools
- [ ] Implement MCP resource providers for cached data
- [ ] Add integration tests for all MCP tools
- [ ] Create example queries documentation for users
- [ ] Add MCP tool usage observability/logging
- [ ] Consider adding streaming support for long-running tools
- [ ] Deploy to production and monitor performance
- [ ] Gather user feedback on tool usefulness
