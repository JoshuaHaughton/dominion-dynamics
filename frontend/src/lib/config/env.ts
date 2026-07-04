export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ?? "http://localhost:8000";

export const WS_LIVE_PATH = "/ws/live";

/** WebSocket URL for the live asset snapshot stream. */
export function getLiveWebSocketUrl(): string {
  const wsOrigin = API_ORIGIN.replace(/^http/i, "ws");
  return `${wsOrigin}${WS_LIVE_PATH}`;
}
