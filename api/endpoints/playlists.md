# Playlists API

Endpoints for user playlists (watchlists).

## List Playlists

Get all playlists for the current user.

### Request

`GET /playlists`

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
      "name": "Tech Stocks",
      "symbols": ["AAPL", "GOOGL", "MSFT"],
      "isDefault": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## Create Playlist

Create a new playlist.

### Request

`POST /playlists`

#### Request Body
```json
{
  "name": "My Watchlist",
  "symbols": ["AAPL", "GOOGL"]
}
```

### Response

#### Success (201)
```json
{
  "data": {
    "id": "uuid",
    "name": "My Watchlist",
    "symbols": ["AAPL", "GOOGL"],
    "isDefault": false,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## Update Playlist

Update a playlist's name or symbols.

### Request

`PUT /playlists/:id`

#### Request Body
```json
{
  "name": "Updated Name",
  "symbols": ["AAPL", "GOOGL", "AMZN"]
}
```

---

## Add Symbol to Playlist

Add a symbol to an existing playlist.

### Request

`POST /playlists/:id/symbols`

#### Request Body
```json
{
  "symbol": "NVDA"
}
```

---

## Remove Symbol from Playlist

Remove a symbol from a playlist.

### Request

`DELETE /playlists/:id/symbols/:symbol`

---

## Delete Playlist

Delete a playlist.

### Request

`DELETE /playlists/:id`

### Response

#### Success (204)
No content
