# Strategies API

Endpoints for trading strategies.

## List Strategies

Get all strategies for the current user.

### Request

`GET /strategies`

#### Headers
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |

### Response

#### Success (200)
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Bull Call Spread",
      "symbol": "AAPL",
      "type": "spread",
      "legs": [...],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## Create Strategy

Create a new trading strategy.

### Request

`POST /strategies`

#### Headers
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |

#### Request Body
```json
{
  "name": "My Strategy",
  "symbol": "AAPL",
  "type": "spread",
  "legs": [
    {
      "type": "call",
      "action": "buy",
      "strike": 150,
      "expiration": "2024-01-19",
      "quantity": 1
    },
    {
      "type": "call",
      "action": "sell",
      "strike": 155,
      "expiration": "2024-01-19",
      "quantity": 1
    }
  ]
}
```

### Response

#### Success (201)
```json
{
  "data": {
    "id": "uuid",
    "name": "My Strategy",
    ...
  }
}
```

---

## Get Strategy

Get a specific strategy by ID.

### Request

`GET /strategies/:id`

---

## Update Strategy

Update an existing strategy.

### Request

`PUT /strategies/:id`

---

## Delete Strategy

Delete a strategy.

### Request

`DELETE /strategies/:id`

### Response

#### Success (204)
No content
