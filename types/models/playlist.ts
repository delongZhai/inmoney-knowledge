/**
 * Playlist (watchlist) type definitions
 */

export interface Playlist {
  /** Unique identifier */
  id: string;

  /** Owner user ID */
  userId: string;

  /** Playlist name */
  name: string;

  /** Ticker symbols in the playlist */
  symbols: string[];

  /** Whether this is the user's default playlist */
  isDefault: boolean;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

export interface CreatePlaylistRequest {
  name: string;
  symbols?: string[];
}

export interface UpdatePlaylistRequest {
  name?: string;
  symbols?: string[];
  isDefault?: boolean;
}

export interface AddSymbolRequest {
  symbol: string;
}

export interface PlaylistWithTickers extends Playlist {
  /** Expanded ticker data (when loaded) */
  tickers?: import('./ticker').Ticker[];
}
