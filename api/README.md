# API Documentation

Backend API documentation for inmoney-api.

## Contents

- [Authentication](./authentication.md) - Auth flows with Supabase
- [Endpoints](./endpoints/) - Endpoint-specific documentation
- [OpenAPI](./openapi/) - OpenAPI specifications

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8787` |
| Production | `https://api.inmoney.app` |

## Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <supabase_access_token>
```

See [Authentication](./authentication.md) for details.

## Response Format

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

## Rate Limiting

- Rate limits are applied per user/IP
- Headers indicate limit status:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Versioning

API versioning strategy (if applicable):
- URL path: `/v1/endpoint`
- Header: `Accept: application/vnd.inmoney.v1+json`

## SDK

TypeScript SDK is auto-generated from OpenAPI spec:
```bash
npm run generate-api
```

See `apps/inmoney/src/app/services/core.sdk.ts`
