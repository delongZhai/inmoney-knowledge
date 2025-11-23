# Issues

Known issues and bug tracking for InMoney.

## Contents

- [Open](./open.md) - Current open issues
- [Resolved](./resolved.md) - Resolved issues archive
- [Templates](./templates/) - Issue templates

## Issue Format

```markdown
## [ISSUE-XXX] Issue Title

- **Status**: Open | In Progress | Resolved | Closed | Won't Fix
- **Severity**: Critical | High | Medium | Low
- **Component**: Frontend | Backend | Database | Infrastructure
- **Reported**: YYYY-MM-DD
- **Reporter**: @username
- **Assigned**: @username (optional)

### Description
Detailed description of the issue.

### Steps to Reproduce (for bugs)
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
What should happen.

### Actual Behavior
What actually happens.

### Environment
- Browser: Chrome 120
- OS: macOS 14
- Version: 1.0.0

### Screenshots/Logs
Attach relevant screenshots or error logs.

### Resolution
(When resolved) How the issue was fixed.
```

## Severity Definitions

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | System down, data loss | Immediate |
| High | Major feature broken | Same day |
| Medium | Feature degraded | This week |
| Low | Minor issue | When possible |

## Issue Types

### Bug
Something isn't working as expected.

### Performance
System is slow or inefficient.

### Security
Security vulnerability or concern.

### Usability
User experience issue.

## Workflow

1. **Report**: Create issue with full details
2. **Triage**: Assign severity and owner
3. **Investigate**: Root cause analysis
4. **Fix**: Implement solution
5. **Verify**: Confirm fix works
6. **Close**: Move to resolved

## Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | Improvement request |
| `question` | Needs clarification |
| `duplicate` | Already reported |
| `wontfix` | Intentional behavior |
