# API Endpoints

Detailed documentation for each API endpoint.

## Endpoint Categories

- [Tickers](./tickers.md) - Stock ticker endpoints
- [Options](./options.md) - Options data endpoints
- [Strategies](./strategies.md) - Trading strategy endpoints
- [Playlists](./playlists.md) - User playlist endpoints
- [User](./user.md) - User management endpoints

## Endpoint Documentation Template

Each endpoint should document:

```markdown
## Endpoint Name

Brief description of what the endpoint does.

### Request

`METHOD /path/:param`

#### Headers
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| param | string | Description |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | Results per page |

#### Request Body
```json
{
  "field": "value"
}
```

### Response

#### Success (200)
```json
{
  "data": { ... }
}
```

#### Errors
| Code | Description |
|------|-------------|
| 400 | Invalid request |
| 404 | Not found |

### Example

```bash
curl -X GET https://api.inmoney.app/v1/resource \
  -H "Authorization: Bearer token"
```
```
