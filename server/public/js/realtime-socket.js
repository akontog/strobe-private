(function initRealtimeSocketFactory(globalScope) {
  'use strict';

  function parseMessage(rawData) {
    try {
      const parsed = JSON.parse(String(rawData || ''));
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      const event = typeof parsed.event === 'string' ? parsed.event.trim() : '';
      if (!event) {
        return null;
      }

      return {
        event,
        data: parsed.data
      };
    } catch {
      return null;
    }
  }

  function createRealtimeSocket(options = {}) {
    const listeners = new Map();
    const reconnectDelayMs = Number.isFinite(options.reconnectDelayMs)
      ? Math.max(200, Number(options.reconnectDelayMs))
      : 1200;
    const path = typeof options.path === 'string' && options.path.trim()
      ? options.path.trim()
      : '/ws/realtime';

    let shouldReconnect = options.reconnect !== false;
    let ws = null;
    let reconnectTimer = null;
    let connectNotifyTimer = null;
    let manualClose = false;
    let openedAtLeastOnce = false;
    let connectNotified = false;

    const socket = {
      id: null,
      connected: false,
      active: false,
      on(event, handler) {
        if (typeof handler !== 'function') {
          return socket;
        }

        const safeEvent = String(event || '').trim();
        if (!safeEvent) {
          return socket;
        }

        const registered = listeners.get(safeEvent) || [];
        registered.push(handler);
        listeners.set(safeEvent, registered);
        return socket;
      },
      off(event, handler) {
        const safeEvent = String(event || '').trim();
        if (!safeEvent || typeof handler !== 'function') {
          return socket;
        }

        const registered = listeners.get(safeEvent);
        if (!registered || !registered.length) {
          return socket;
        }

        listeners.set(safeEvent, registered.filter((candidate) => candidate !== handler));
        return socket;
      },
      emit(event, data) {
        const safeEvent = String(event || '').trim();
        if (!safeEvent || !ws || ws.readyState !== WebSocket.OPEN) {
          return socket;
        }

        try {
          ws.send(JSON.stringify({ event: safeEvent, data }));
        } catch {
        }

        return socket;
      },
      connect() {
        shouldReconnect = options.reconnect !== false;
        manualClose = false;
        openConnection();
        return socket;
      },
      disconnect() {
        manualClose = true;
        shouldReconnect = false;
        socket.active = false;
        clearReconnectTimer();
        clearConnectNotifyTimer();

        if (ws) {
          try {
            ws.close();
          } catch {
          }
        }

        return socket;
      }
    };

    function emitLocal(event, payload) {
      const handlers = listeners.get(event);
      if (!handlers || !handlers.length) {
        return;
      }

      handlers.slice().forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error('[realtime] listener error:', error);
        }
      });
    }

    function clearReconnectTimer() {
      if (!reconnectTimer) {
        return;
      }

      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    function clearConnectNotifyTimer() {
      if (!connectNotifyTimer) {
        return;
      }

      clearTimeout(connectNotifyTimer);
      connectNotifyTimer = null;
    }

    function normalizePath() {
      if (!path.startsWith('/')) {
        return `/${path}`;
      }
      return path;
    }

    function buildUrl() {
      const explicit = typeof options.url === 'string' ? options.url.trim() : '';

      if (explicit.startsWith('ws://') || explicit.startsWith('wss://')) {
        return explicit;
      }

      if (explicit.startsWith('http://') || explicit.startsWith('https://')) {
        const converted = explicit.replace(/^http/, 'ws');
        return `${converted.replace(/\/$/, '')}${normalizePath()}`;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}${normalizePath()}`;
    }

    function scheduleReconnect() {
      if (!shouldReconnect || manualClose) {
        return;
      }

      clearReconnectTimer();
      reconnectTimer = setTimeout(() => {
        openConnection();
      }, reconnectDelayMs);
    }

    function notifyConnect() {
      if (connectNotified || !socket.connected) {
        return;
      }

      connectNotified = true;
      emitLocal('connect');
    }

    function openConnection() {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      clearReconnectTimer();

      try {
        ws = new WebSocket(buildUrl());
      } catch (error) {
        emitLocal('connect_error', error);
        scheduleReconnect();
        return;
      }

      socket.active = true;

      ws.addEventListener('open', () => {
        openedAtLeastOnce = true;
        socket.connected = true;
        socket.active = true;
        connectNotified = false;
        clearConnectNotifyTimer();
        connectNotifyTimer = setTimeout(() => {
          notifyConnect();
        }, 60);
      });

      ws.addEventListener('message', (event) => {
        const message = parseMessage(event && event.data);
        if (!message) {
          return;
        }

        if (message.event === '__meta') {
          socket.id = message && message.data && typeof message.data.id === 'string'
            ? message.data.id
            : null;
          notifyConnect();
          return;
        }

        emitLocal(message.event, message.data);
      });

      ws.addEventListener('error', (event) => {
        emitLocal('connect_error', event && event.error ? event.error : event);
      });

      ws.addEventListener('close', () => {
        const wasConnected = socket.connected;
        socket.connected = false;
        socket.active = false;
        socket.id = null;
        connectNotified = false;
        clearConnectNotifyTimer();
        ws = null;

        if (wasConnected || openedAtLeastOnce) {
          emitLocal('disconnect');
        }

        scheduleReconnect();
      });
    }

    if (options.autoConnect !== false) {
      socket.connect();
    }

    return socket;
  }

  globalScope.createRealtimeSocket = createRealtimeSocket;
})(window);
