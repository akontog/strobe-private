(function initSharedClassroomApi(global) {
  if (global.SharedClassroomApi) {
    return;
  }

  function normalizeMessage(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const type = typeof raw.type === "string" ? raw.type : "";
    if (type) {
      return {
        topic: type,
        payload: raw,
        raw
      };
    }

    const event = typeof raw.event === "string" ? raw.event : "";
    if (event) {
      return {
        topic: event,
        payload: raw.data,
        raw
      };
    }

    return null;
  }

  function createClient(options) {
    const config = options && typeof options === "object" ? options : {};
    const wsPath = typeof config.wsPath === "string" && config.wsPath.trim()
      ? config.wsPath.trim()
      : "/ws/realtime";
    const url = typeof config.url === "string" ? config.url.trim() : "";
    const reconnectDelayMs = Number.isFinite(Number(config.reconnectDelayMs))
      ? Math.max(150, Number(config.reconnectDelayMs))
      : 900;

    const onOpen = typeof config.onOpen === "function" ? config.onOpen : function noop() {};
    const onClose = typeof config.onClose === "function" ? config.onClose : function noop() {};
    const onError = typeof config.onError === "function" ? config.onError : function noop() {};
    const onMessage = typeof config.onMessage === "function" ? config.onMessage : function noop() {};
    const onRawMessage = typeof config.onRawMessage === "function" ? config.onRawMessage : function noop() {};

    let socket = null;
    let reconnectTimer = null;
    let manualStop = false;

    function wsUrl() {
      if (url.startsWith("ws://") || url.startsWith("wss://")) {
        return url;
      }

      if (url.startsWith("http://") || url.startsWith("https://")) {
        const converted = url.replace(/^http/, "ws").replace(/\/$/, "");
        return `${converted}${wsPath}`;
      }

      const proto = global.location && global.location.protocol === "https:" ? "wss" : "ws";
      const host = global.location && global.location.host ? global.location.host : "localhost";
      return `${proto}://${host}${wsPath}`;
    }

    function clearReconnect() {
      if (!reconnectTimer) {
        return;
      }
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    function isConnected() {
      return Boolean(socket) && socket.readyState === WebSocket.OPEN;
    }

    function send(type, data) {
      if (!isConnected()) {
        return false;
      }

      const payload = { type };
      if (data && typeof data === "object") {
        Object.assign(payload, data);
      }

      try {
        socket.send(JSON.stringify(payload));
        return true;
      } catch {
        return false;
      }
    }

    function sendPacket(packet) {
      if (!isConnected() || !packet || typeof packet !== "object") {
        return false;
      }

      try {
        socket.send(JSON.stringify(packet));
        return true;
      } catch {
        return false;
      }
    }

    function scheduleReconnect() {
      if (manualStop || reconnectTimer) {
        return;
      }

      reconnectTimer = setTimeout(function reconnectLater() {
        reconnectTimer = null;
        start();
      }, reconnectDelayMs);
    }

    function stop() {
      manualStop = true;
      clearReconnect();
      if (socket) {
        try {
          socket.close();
        } catch {
        }
      }
      socket = null;
    }

    function start() {
      manualStop = false;
      clearReconnect();

      if (isConnected()) {
        return;
      }

      try {
        socket = new WebSocket(wsUrl());
      } catch (error) {
        onError(error);
        scheduleReconnect();
        return;
      }

      socket.addEventListener("open", function onSocketOpen() {
        onOpen();
      });

      socket.addEventListener("message", function onSocketMessage(event) {
        let parsed;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }

        onRawMessage(parsed);

        const normalized = normalizeMessage(parsed);
        if (!normalized) {
          return;
        }

        onMessage(normalized.topic, normalized.payload, normalized.raw);
      });

      socket.addEventListener("close", function onSocketClose(event) {
        onClose(event);
        if (!manualStop) {
          scheduleReconnect();
        }
      });

      socket.addEventListener("error", function onSocketError(error) {
        onError(error);
      });
    }

    return {
      start,
      stop,
      send,
      sendPacket,
      isConnected
    };
  }

  global.SharedClassroomApi = {
    createClient
  };
})(window);
