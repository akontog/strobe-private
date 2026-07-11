export function createRealtimeSocket(path = '/ws/realtime', onMessage) {
  const url = new URL(path, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  const ws = new WebSocket(url.toString());

  ws.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (typeof onMessage === 'function') onMessage(payload);
    } catch {
      // ignore malformed websocket payloads
    }
  });

  return ws;
}
